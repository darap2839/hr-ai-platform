#requires -Version 5.1
# Offline smoke tests. No running Docker, database, AI model or HTTP server needed.
$ErrorActionPreference = 'Stop'
$collector = Join-Path (Split-Path -Parent $PSScriptRoot) 'collect-diagnostics.ps1'
$tokens = $null
$parseErrors = $null
$null = [Management.Automation.Language.Parser]::ParseFile($collector, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('hr-ai-collector-test-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $testRoot
$null = New-Item -ItemType File -Path (Join-Path $testRoot 'docker-compose.yml')
$global:hrDiagnosticTestMode = 'normal'
$global:hrDiagnosticTestCalls = New-Object 'System.Collections.Generic.List[string]'

function global:docker {
    $words = @($args)
    $global:hrDiagnosticTestCalls.Add(($words -join ' '))
    $global:LASTEXITCODE = 0
    if ($words[0] -eq 'version') {
        if ($global:hrDiagnosticTestMode -eq 'daemon-down') { $global:LASTEXITCODE = 1; return }
        return '28.0.0'
    }
    if ($words[0] -eq 'inspect') { return '[{"com.docker.compose.service":"backend"},"private.example/account/image:tag","sha256:abc","running",0,"healthy"]' }
    if ($words[0] -eq 'stats') { return '{"ID":"aaaaaaaaaaaa","CPUPerc":"1.0%","MemUsage":"128MiB / 8GiB","MemPerc":"1.0%","Name":"PRIVATE_NAME"}' }
    if ($words -contains 'config') { return }
    if ($words -contains 'ps') { return 'aaaaaaaaaaaa' }
    if ($words -contains 'exec') {
        return '{"dependencies":{"python":"3.12.0"},"checks":[{"id":"SYS-DATABASE","status":"passed","detail":"SELECT 1 succeeded"}]}'
    }
    throw ('Unexpected Docker command: ' + ($words -join ' '))
}
function global:Invoke-WebRequest { return [pscustomobject]@{ StatusCode = 200 } }
function global:Invoke-RestMethod { return [pscustomobject]@{ choices = @([pscustomobject]@{ message = [pscustomobject]@{ content = 'PRIVATE_COMPLETION' } }) } }
function global:git { $global:LASTEXITCODE = 0; return ('a' * 40) }

try {
    $normalOutput = Join-Path $testRoot 'normal'
    & $collector -ProjectDirectory $testRoot -OutputDirectory $normalOutput
    $json = Get-Content -LiteralPath (Join-Path $normalOutput 'report.json') -Raw
    $report = $json | ConvertFrom-Json
    foreach ($expected in @('SYS-DOCKER', 'SYS-COMPOSE', 'SYS-DATABASE', 'SYS-NGINX-HEALTH', 'AI-CHAT')) {
        if (-not @($report.checks | Where-Object { $_.id -eq $expected -and $_.status -eq 'passed' }).Count) { throw ('Missing successful check: ' + $expected + '; checks=' + ($report.checks | ConvertTo-Json -Compress)) }
    }
    if ($report.containers[0].image -ne 'custom-image-reference-omitted') { throw 'Custom registry reference was retained.' }
    if ($json -match 'PRIVATE_|private.example') { throw 'Private data leaked into report.' }
    if (-not (Test-Path -LiteralPath ($normalOutput + '.zip'))) { throw 'ZIP missing.' }
    if (@($report.checks | Where-Object { $_.id -eq 'SYS-COLLECTOR' }).Count) { throw 'Collector unexpectedly failed.' }
    if (($global:hrDiagnosticTestCalls -join ' ') -match '\b(pull|build|restart|down|up|run)\b') { throw 'Mutating Docker command detected.' }

    $global:hrDiagnosticTestMode = 'daemon-down'
    $downOutput = Join-Path $testRoot 'down'
    & $collector -ProjectDirectory $testRoot -OutputDirectory $downOutput -SkipAI
    $down = Get-Content -LiteralPath (Join-Path $downOutput 'report.json') -Raw | ConvertFrom-Json
    if (-not @($down.checks | Where-Object { $_.id -eq 'SYS-DOCKER' -and $_.status -eq 'blocked' }).Count) { throw 'Unavailable daemon was not recorded.' }
    if (-not @($down.checks | Where-Object { $_.id -eq 'AI-CHAT' -and $_.status -eq 'blocked' }).Count) { throw 'SkipAI was ignored.' }

    $rejected = $false
    try { & $collector -ProjectDirectory $testRoot -BaseUrl 'https://example.com' } catch { $rejected = $true }
    if (-not $rejected) { throw 'Non-local destination was accepted.' }
    Write-Host 'Collector parse, offline probes, partial report, archive, privacy and localhost checks passed.'
} finally {
    Remove-Item Function:\docker, Function:\Invoke-WebRequest, Function:\Invoke-RestMethod, Function:\git -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $testRoot -Recurse -Force
}
