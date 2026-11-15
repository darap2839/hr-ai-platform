#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$ProjectDirectory = (Split-Path -Parent $PSScriptRoot),
    [string]$RunnerPath = (Join-Path $PSScriptRoot 'functional-diagnostics.py'),
    [switch]$TestAIOutage
)
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$runnerText = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $RunnerPath).Path)
$projectPath = (Resolve-Path -LiteralPath $ProjectDirectory).Path
if (-not (Test-Path -LiteralPath (Join-Path $projectPath 'docker-compose.yml'))) { throw 'Project compose file not found.' }
$outputPath = Join-Path ([IO.Path]::GetTempPath()) ('hr-ai-functional-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $outputPath
$engineNeedsRestore = $false
$collectorEvents = New-Object 'System.Collections.Generic.List[object]'

function Invoke-Phase {
    param([string]$Phase)
    Write-Host ('Running phase: ' + $Phase)
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $lines = @($runnerText | & docker compose --profile ai exec -T backend python - --phase $Phase 2>$null)
        $exitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previous }
    if ($exitCode -ne 0) { throw ('Backend probe failed in phase ' + $Phase) }
    $json = $lines -join "`n"
    $parsed = $json | ConvertFrom-Json
    if ($parsed.phase -ne $Phase -or -not $parsed.checks) { throw 'Unexpected report format.' }
    $json | Set-Content -LiteralPath (Join-Path $outputPath ($Phase + '.json')) -Encoding UTF8
    foreach ($entry in $parsed.checks) {
        Write-Host ($entry.id + ': ' + $entry.status)
    }
}

Push-Location -LiteralPath $projectPath
try {
    $sourceRevision = 'unknown'
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $sourceLines = @(& git rev-parse HEAD 2>$null)
        if ($LASTEXITCODE -eq 0 -and $sourceLines.Count) { $sourceRevision = $sourceLines[0] }
    }
    [ordered]@{
        startedUtc = [datetime]::UtcNow.ToString('o')
        localCheckout = $sourceRevision
        runnerSha256 = (Get-FileHash -LiteralPath $RunnerPath -Algorithm SHA256).Hash
        apiPath = 'backend-container -> nginx -> backend'
        outageRequested = [bool]$TestAIOutage
        sourceScope = 'Local checkout does not identify deployed image code.'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outputPath 'metadata.json') -Encoding UTF8
    if ($TestAIOutage) {
        # Record pre-existing state before promising recovery. Never start an engine
        # which was originally stopped as a side effect of this test.
        $engineIds = @(& docker compose --profile ai ps --status running --quiet ai-engine)
        if ($LASTEXITCODE -ne 0 -or -not $engineIds.Count) { throw 'AI Engine must already be running for an outage test.' }
    }
    Invoke-Phase 'functional'
    if ($TestAIOutage) {
        $engineNeedsRestore = $true
        & docker compose --profile ai stop -t 20 ai-engine
        if ($LASTEXITCODE -ne 0) { throw 'Could not stop AI Engine; restoration will be attempted.' }
        Invoke-Phase 'outage'
    }
} catch {
    $collectorEvents.Add([pscustomobject]@{ id = 'WRAPPER'; status = 'blocked'; detail = $_.Exception.Message })
} finally {
    try {
        if ($engineNeedsRestore) {
            Write-Host 'Restoring the previously running AI Engine...'
            & docker compose --profile ai start ai-engine
            if ($LASTEXITCODE -ne 0) { throw 'AI Engine restart failed. Run docker compose --profile ai start ai-engine.' }
            Invoke-Phase 'recovery'
        }
    } catch {
        $collectorEvents.Add([pscustomobject]@{ id = 'AI-RESTORE'; status = 'failed'; detail = $_.Exception.Message })
        Write-Warning 'AI recovery is not confirmed. Check docker compose --profile ai ps -a.'
    }
    Pop-Location
    ConvertTo-Json -InputObject @($collectorEvents.ToArray()) -Depth 5 | Set-Content -LiteralPath (Join-Path $outputPath 'wrapper.json') -Encoding UTF8
    Compress-Archive -Path (Join-Path $outputPath '*.json') -DestinationPath ($outputPath + '.zip')
    Write-Host ('Report: ' + $outputPath + '.zip')
    Write-Host 'Read results before acceptance. Any synthetic leftovers are identified by the report marker.'
}
