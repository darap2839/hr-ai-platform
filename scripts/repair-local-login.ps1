#requires -Version 5.1
<# Restore the owner's display profile and one consistent local OIDC origin. #>
[CmdletBinding()]
param([string]$ProjectDirectory = (Get-Location).Path)
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$revision = '87f0fe20095b7e8f77ee3e39ec2d1cc98aaf0d68'
$frontendImage = 'ghcr.io/darap2839/hr-ai-platform/frontend:' + $revision
$backendImage = 'ghcr.io/darap2839/hr-ai-platform/backend:5e192b1be7091453dcce03327a9e014adeb8b531'
$origin = 'http://127.0.0.1:18080'
$projectPath = (Resolve-Path -LiteralPath $ProjectDirectory).Path
if (-not (Test-Path -LiteralPath (Join-Path $projectPath 'docker-compose.yml'))) { throw 'Run from the hr-ai-platform directory, or pass -ProjectDirectory.' }
$backup = Join-Path ([IO.Path]::GetTempPath()) ('hr-ai-login-backup-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $backup
$overrideName = 'docker-compose.local-login.yml'
$overridePath = Join-Path $projectPath $overrideName
$nginxPath = Join-Path $projectPath 'nginx\default.conf'
if (-not (Test-Path -LiteralPath $nginxPath)) { throw 'nginx/default.conf not found.' }
Copy-Item -LiteralPath $nginxPath -Destination (Join-Path $backup 'default.conf')
if (Test-Path -LiteralPath $overridePath) { Copy-Item -LiteralPath $overridePath -Destination (Join-Path $backup $overrideName) }

function Invoke-CheckedDocker {
    param([string[]]$Arguments)
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) { throw ('Docker command failed (exit ' + $LASTEXITCODE + '). Stop here and share the error output.') }
}

Push-Location -LiteralPath $projectPath
try {
    # Fetch the published frontend first, before changing running services.
    Invoke-CheckedDocker @('pull', $frontendImage)
    $download = Join-Path $backup 'new-default.conf'
    Invoke-WebRequest -UseBasicParsing -Uri ('https://raw.githubusercontent.com/darap2839/hr-ai-platform/' + $revision + '/nginx/default.conf') -OutFile $download
    Copy-Item -LiteralPath $download -Destination $nginxPath -Force
    try { Invoke-CheckedDocker @('compose', 'exec', '-T', 'nginx', 'nginx', '-t') }
    catch {
        Copy-Item -LiteralPath (Join-Path $backup 'default.conf') -Destination $nginxPath -Force
        throw
    }
    $yaml = @"
services:
  backend:
    image: $backendImage
    environment:
      KEYCLOAK_URL: $origin/auth
      KEYCLOAK_ISSUER: $origin/auth/realms/platform
  frontend:
    image: $frontendImage
  keycloak:
    environment:
      KC_HOSTNAME: $origin/auth
  nginx:
    ports:
      - "127.0.0.1:18080:80"
"@
    [IO.File]::WriteAllText($overridePath, $yaml, (New-Object Text.UTF8Encoding($false)))
    $compose = @('compose', '-f', 'docker-compose.yml', '-f', $overrideName)
    Invoke-CheckedDocker ($compose + @('config', '--quiet'))
    Invoke-CheckedDocker ($compose + @('up', '-d', '--no-deps', '--pull', 'never', '--no-build', 'backend', 'frontend', 'keycloak'))
    Invoke-CheckedDocker @('compose', 'exec', '-T', 'nginx', 'nginx', '-s', 'reload')

    Write-Host 'Waiting for Keycloak and backend (up to 120 seconds)...'
    $deadline = [datetime]::UtcNow.AddSeconds(120)
    $ready = $false
    do {
        try {
            $discovery = Invoke-RestMethod -Uri ($origin + '/auth/realms/platform/.well-known/openid-configuration') -TimeoutSec 5
            $health = Invoke-RestMethod -Uri ($origin + '/health') -TimeoutSec 5
            if ($discovery.issuer -eq ($origin + '/auth/realms/platform') -and $health.status -eq 'ok') { $ready = $true; break }
        } catch { }
        Start-Sleep -Seconds 2
    } while ([datetime]::UtcNow -lt $deadline)
    if (-not $ready) { throw 'Readiness/issuer not confirmed. Share docker compose logs --tail 30 keycloak backend; do not delete data.' }
    $config = Invoke-RestMethod -Uri ($origin + '/api/auth/keycloak-config') -TimeoutSec 10
    if ($config.url -ne ($origin + '/auth')) { throw 'Public Keycloak URL mismatch. Do not run further updates.' }
    $anonymousCode = 0
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri ($origin + '/api/candidates') -TimeoutSec 10
        $anonymousCode = [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response) { $anonymousCode = [int]$_.Exception.Response.StatusCode } else { throw }
    }
    if ($anonymousCode -ne 401) { throw ('Expected anonymous HTTP 401; got ' + $anonymousCode) }
    Write-Host ('Keycloak URL: ' + $config.url)
    Write-Host ('Issuer: ' + $discovery.issuer)
    Write-Host 'Anonymous candidates request: HTTP 401 (expected)'
    Write-Host ('Open ' + $origin + '/, press Ctrl+F5 and sign in again.')
    Write-Host ('Keep using: docker compose -f docker-compose.yml -f ' + $overrideName + ' ...')
} finally {
    Pop-Location
    Write-Host ('Backups: ' + $backup)
}
