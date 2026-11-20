#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$wrapper = Join-Path (Split-Path -Parent $PSScriptRoot) 'run-functional-diagnostics.ps1'
$tokens = $null; $parseErrors = $null
$null = [Management.Automation.Language.Parser]::ParseFile($wrapper, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('hr-ai-functional-test-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $testRoot
New-Item -ItemType File -Path (Join-Path $testRoot 'docker-compose.yml') | Out-Null
'print("stub")' | Set-Content (Join-Path $testRoot 'runner.py')
$global:hrFunctionalCalls = New-Object 'System.Collections.Generic.List[string]'
$global:hrFunctionalFailOutage = $false
function global:docker {
    $words = @($args)
    $global:hrFunctionalCalls.Add(($words -join ' '))
    $global:LASTEXITCODE = 0
    if ($words -contains 'ps') { return 'aaaaaaaaaaaa' }
    if ($words -contains 'stop' -or $words -contains 'start') { return }
    $phaseIndex = [array]::IndexOf($words, '--phase')
    if ($phaseIndex -ge 0) {
        $phase = $words[$phaseIndex + 1]
        if ($phase -eq 'outage' -and $global:hrFunctionalFailOutage) { $global:LASTEXITCODE = 1; return }
        return ('{"phase":"' + $phase + '","checks":[{"id":"STUB","status":"passed","detail":"offline test"}]}')
    }
    throw 'Unexpected Docker command'
}
$generated = @()
try {
    # Capture printed ZIP paths without collecting another user's reports.
    $messages = @(& $wrapper -ProjectDirectory $testRoot -RunnerPath (Join-Path $testRoot 'runner.py') -TestAIOutage 6>&1)
    $generated += @($messages | ForEach-Object { if ($_.ToString().StartsWith('Report: ')) { $_.ToString().Substring(8) } })
    if (-not @($global:hrFunctionalCalls | Where-Object { $_ -match 'start ai-engine' }).Count) { throw 'Engine was not restored.' }
    if (-not @($global:hrFunctionalCalls | Where-Object { $_ -match '--phase recovery' }).Count) { throw 'Recovery was not tested.' }
    if (-not $generated.Count -or -not (Test-Path -LiteralPath $generated[0])) { throw 'Report ZIP missing.' }
    $global:hrFunctionalCalls.Clear()
    $global:hrFunctionalFailOutage = $true
    $messages = @(& $wrapper -ProjectDirectory $testRoot -RunnerPath (Join-Path $testRoot 'runner.py') -TestAIOutage 6>&1)
    $generated += @($messages | ForEach-Object { if ($_.ToString().StartsWith('Report: ')) { $_.ToString().Substring(8) } })
    if (-not @($global:hrFunctionalCalls | Where-Object { $_ -match 'start ai-engine' }).Count) { throw 'Finally failed to restore engine after probe failure.' }
    if (($global:hrFunctionalCalls -join ' ') -match '\b(down|pull|build|rm)\b') { throw 'Destructive/unexpected Docker command.' }
    Write-Host 'Wrapper syntax, normal phases, ZIP generation and finally restoration tests passed.'
} finally {
    Remove-Item Function:\docker -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $testRoot -Recurse -Force
    foreach ($archive in $generated) {
        if ($archive -match 'hr-ai-functional-[a-f0-9]{32}\.zip$') {
            Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $archive.Substring(0, $archive.Length - 4) -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
$global:LASTEXITCODE = 0
