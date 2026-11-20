#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'repair-local-login.ps1'
$tokens = $null; $parseErrors = $null
$null = [Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
$root = Join-Path ([IO.Path]::GetTempPath()) ('hr-login-test-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path (Join-Path $root 'nginx') -Force
'original config' | Set-Content (Join-Path $root 'nginx\default.conf')
'original compose' | Set-Content (Join-Path $root 'docker-compose.yml')
$global:hrLoginCalls = New-Object 'System.Collections.Generic.List[string]'
$global:hrLoginFailValidation = $false
function global:docker {
    $global:hrLoginCalls.Add(($args -join ' '))
    $global:LASTEXITCODE = 0
    if ($global:hrLoginFailValidation -and ($args -join ' ') -match 'nginx -t') { $global:LASTEXITCODE = 1 }
}
function global:Invoke-WebRequest {
    param([string]$Uri, [string]$OutFile, [switch]$UseBasicParsing, [int]$TimeoutSec)
    if ($OutFile) { 'new config' | Set-Content -LiteralPath $OutFile; return }
    return [pscustomobject]@{StatusCode=401}
}
function global:Invoke-RestMethod {
    param([string]$Uri, [int]$TimeoutSec)
    if ($Uri.EndsWith('/health')) { return [pscustomobject]@{status='ok'} }
    if ($Uri.EndsWith('/keycloak-config')) { return [pscustomobject]@{url='http://127.0.0.1:18080/auth'} }
    return [pscustomobject]@{issuer='http://127.0.0.1:18080/auth/realms/platform'}
}
$backups = @()
try {
    $output = @(& $scriptPath -ProjectDirectory $root 6>&1)
    $backups += @($output | ForEach-Object { if ($_.ToString().StartsWith('Backups: ')) { $_.ToString().Substring(9) } })
    $yaml = Get-Content (Join-Path $root 'docker-compose.local-login.yml') -Raw
    if ($yaml -notmatch 'KC_HOSTNAME: http://127.0.0.1:18080/auth') { throw 'Public hostname missing.' }
    if ($yaml -notmatch 'KEYCLOAK_ISSUER: http://127.0.0.1:18080/auth/realms/platform') { throw 'Issuer mismatch.' }
    if ((Get-Content (Join-Path $root 'docker-compose.yml') -Raw).Trim() -ne 'original compose') { throw 'Base compose changed.' }
    if (($global:hrLoginCalls -join ' ') -match '\b(down|prune|rm)\b') { throw 'Data-destructive command detected.' }
    if (-not @($global:hrLoginCalls | Where-Object { $_ -match 'up -d --no-deps --pull never --no-build backend frontend keycloak' }).Count) { throw 'Unexpected scope of recreation.' }
    $global:hrLoginFailValidation = $true
    'second original' | Set-Content (Join-Path $root 'nginx\default.conf')
    $caught = $false
    try { & $scriptPath -ProjectDirectory $root | Out-Null } catch { $caught = $true }
    if (-not $caught) { throw 'Invalid nginx config did not stop deployment.' }
    if ((Get-Content (Join-Path $root 'nginx\default.conf') -Raw).Trim() -ne 'second original') { throw 'Nginx backup not restored.' }
    Write-Host 'Login repair syntax, pinned images, public issuer, preserved base config and rollback passed.'
} finally {
    Remove-Item Function:\docker, Function:\Invoke-WebRequest, Function:\Invoke-RestMethod -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $root -Recurse -Force
    foreach ($path in $backups) {
        if ($path -match 'hr-ai-login-backup-[a-f0-9]{32}$') { Remove-Item -LiteralPath $path -Recurse -Force }
    }
}
$global:LASTEXITCODE = 0
