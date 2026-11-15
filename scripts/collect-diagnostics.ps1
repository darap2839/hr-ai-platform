#requires -Version 5.1
<#
Read-only diagnostics for an existing Docker Desktop deployment.
Does not pull, build, restart, migrate, seed, or change application records.
Only the synthetic AI probe performs inference (unless -SkipAI is supplied).
No container logs, environment dumps, resume text, or HTTP bodies are saved.
#>
[CmdletBinding()]
param(
    [string]$ProjectDirectory = (Split-Path -Parent $PSScriptRoot),
    [string]$BaseUrl = 'http://localhost',
    [string]$OutputDirectory = '',
    [switch]$SkipAI
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$results = New-Object 'System.Collections.Generic.List[object]'
$containers = New-Object 'System.Collections.Generic.List[object]'

function Add-Check {
    param([string]$Id, [string]$Status, [string]$Detail)
    $results.Add([pscustomobject]@{ id = $Id; status = $Status; detail = $Detail })
}

function Invoke-Docker {
    param([string[]]$Arguments, [string]$InputText = '')
    # Discard raw stderr: it can contain local paths or endpoint details.
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($InputText) {
            $lines = @($InputText | & docker @Arguments 2>$null)
        } else {
            $lines = @(& docker @Arguments 2>$null)
        }
        $nativeCode = $LASTEXITCODE
        return [pscustomobject]@{ code = $nativeCode; text = ($lines -join "`n") }
    } finally {
        $ErrorActionPreference = $oldPreference
    }
}

$projectPath = (Resolve-Path -LiteralPath $ProjectDirectory).Path
if (-not (Test-Path -LiteralPath (Join-Path $projectPath 'docker-compose.yml'))) {
    throw 'docker-compose.yml not found. Set -ProjectDirectory to the repository directory.'
}
$targetUri = [uri]$BaseUrl
if (-not $targetUri.IsAbsoluteUri -or $targetUri.Scheme -notin @('http', 'https') -or
    -not $targetUri.IsLoopback -or $targetUri.UserInfo -or $targetUri.Query -or $targetUri.Fragment) {
    throw 'BaseUrl must be a localhost/loopback HTTP URL without credentials, query or fragment.'
}
if (-not $OutputDirectory) {
    $OutputDirectory = Join-Path ([IO.Path]::GetTempPath()) ('hr-ai-diagnostics-' + [guid]::NewGuid().ToString('N'))
}
$outputPath = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $outputPath) {
    throw 'OutputDirectory already exists. Choose a new directory to preserve previous evidence.'
}
$null = New-Item -ItemType Directory -Path $outputPath
$started = [datetime]::UtcNow.ToString('o')
$revision = 'unknown'
$dependencies = $null
$resources = @()
$dockerVersion = 'unavailable'

Push-Location -LiteralPath $projectPath
try {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $gitOutput = @(& git rev-parse HEAD 2>$null)
        if ($LASTEXITCODE -eq 0 -and $gitOutput.Count -gt 0) { $revision = $gitOutput[0] }
    }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Add-Check 'SYS-DOCKER' 'blocked' 'Docker CLI not found.'
    } else {
        $version = Invoke-Docker -Arguments @('version', '--format', '{{.Server.Version}}')
        if ($version.code -ne 0) {
            Add-Check 'SYS-DOCKER' 'blocked' 'Docker daemon unavailable. Check Docker Desktop.'
        } else {
            $dockerVersion = $version.text.Trim()
            Add-Check 'SYS-DOCKER' 'passed' 'Docker daemon reachable.'
            $compose = @('compose', '--profile', 'ai')
            $config = Invoke-Docker -Arguments ($compose + @('config', '--quiet'))
            if ($config.code -eq 0) { Add-Check 'SYS-COMPOSE' 'passed' 'Compose configuration accepted.' }
            else { Add-Check 'SYS-COMPOSE' 'failed' 'Compose configuration rejected; raw configuration is not collected.' }
            $ids = Invoke-Docker -Arguments ($compose + @('ps', '--all', '--quiet'))
            if ($ids.code -ne 0 -or -not $ids.text.Trim()) {
                Add-Check 'SYS-CONTAINERS' 'blocked' 'No project containers found, or Compose query failed.'
            } else {
                # No embedded string quotes: Windows PowerShell 5.1 rewrites native quoting.
                $template = '[{{json .Config.Labels}},{{json .Config.Image}},{{json .Image}},{{json .State.Status}},{{json .State.ExitCode}},{{if .State.Health}}{{json .State.Health.Status}}{{else}}null{{end}}]'
                $containerIds = @($ids.text -split '\r?\n' | Where-Object { $_ -match '^[a-f0-9]{12,64}$' })
                foreach ($containerId in $containerIds) {
                    $inspection = Invoke-Docker -Arguments @('inspect', '--format', $template, $containerId)
                    try {
                        if ($inspection.code -ne 0) { throw 'inspect failed' }
                        $fields = @($inspection.text | ConvertFrom-Json)
                        $item = [pscustomobject]@{
                            service = $fields[0].'com.docker.compose.service'
                            image = $fields[1]
                            imageId = $fields[2]
                            state = $fields[3]
                            exitCode = $fields[4]
                            health = $fields[5]
                        }
                        # Custom image references can contain private registry/account names.
                        if ($item.image -notmatch '^(ghcr.io/darap2839/hr-ai-platform/(backend|frontend)|nginx|postgres|keycloak/keycloak|minio/minio|qdrant/qdrant)(:|@|$)' -and $item.service -ne 'ai-engine') {
                            $item.image = 'custom-image-reference-omitted'
                        }
                        if ($item.service -eq 'ai-engine') { $item.image = 'local-ai-engine' }
                        $item | Add-Member -NotePropertyName containerId -NotePropertyValue $containerId
                        $containers.Add($item)
                        $state = if ($item.state -ne 'running' -or $item.health -eq 'unhealthy') { 'failed' } else { 'passed' }
                        Add-Check ('SYS-CONTAINER-' + $item.service) $state ('State=' + $item.state + '; health=' + $item.health)
                    } catch { Add-Check 'SYS-INSPECT' 'blocked' 'Container metadata could not be read.' }
                }
                foreach ($service in @('backend', 'frontend', 'nginx', 'postgres', 'keycloak', 'minio', 'qdrant', 'ai-engine')) {
                    if (-not @($containers | Where-Object { $_.service -eq $service }).Count) {
                        Add-Check ('SYS-CONTAINER-' + $service) 'blocked' 'Service container absent; no service is started automatically.'
                    }
                }
                $stats = Invoke-Docker -Arguments (@('stats', '--no-stream', '--format', '{{json .}}') + $containerIds)
                if ($stats.code -eq 0) {
                    $resources = @($stats.text -split '\r?\n' | Where-Object { $_.Trim() } | ForEach-Object {
                        $sample = $_ | ConvertFrom-Json
                        [pscustomobject]@{ containerId = $sample.ID; cpu = $sample.CPUPerc; memory = $sample.MemUsage; memoryPercent = $sample.MemPerc }
                    })
                    Add-Check 'SYS-RESOURCES' 'passed' 'One resource snapshot collected; not a load test.'
                } else { Add-Check 'SYS-RESOURCES' 'blocked' 'Resource snapshot unavailable.' }

                if (@($containers | Where-Object { $_.service -eq 'backend' -and $_.state -eq 'running' }).Count) {
                    $python = @'
import json, os, time, platform, urllib.request, urllib.error
from importlib.metadata import version, PackageNotFoundError
out = {'checks': [], 'dependencies': {'python': platform.python_version()}}
def check(label, url):
    started = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            code = response.status
        out['checks'].append({'id': label, 'status': 'passed' if code == 200 else 'failed', 'detail': 'HTTP %s; %.3fs' % (code, time.monotonic() - started)})
    except urllib.error.HTTPError as error:
        out['checks'].append({'id': label, 'status': 'failed', 'detail': 'HTTP %s' % error.code})
    except Exception as error:
        out['checks'].append({'id': label, 'status': 'blocked', 'detail': type(error).__name__})
for package in ('fastapi', 'sqlalchemy', 'qdrant-client', 'minio', 'httpx'):
    try: out['dependencies'][package] = version(package)
    except PackageNotFoundError: out['dependencies'][package] = 'not installed'
check('SYS-BACKEND-HEALTH', 'http://127.0.0.1:8000/health')
check('DOC-MINIO-HEALTH', 'http://' + os.getenv('MINIO_ENDPOINT', 'minio:9000') + '/minio/health/ready')
check('RAG-QDRANT-HEALTH', 'http://qdrant:6333/healthz')
check('AI-ENGINE-HEALTH', os.getenv('AI_ENGINE_URL', 'http://ai-engine:8000').rstrip('/') + '/health')
check('AUTH-DISCOVERY', 'http://keycloak:8080/auth/realms/' + os.getenv('KEYCLOAK_REALM', 'platform') + '/.well-known/openid-configuration')
try:
    from sqlalchemy import create_engine, text
    url = os.environ['DATABASE_URL'].replace('postgresql://', 'postgresql+psycopg2://', 1)
    engine = create_engine(url, connect_args={'connect_timeout': 5})
    with engine.connect() as connection:
        connection.execute(text('SELECT 1'))
        rows = connection.execute(text('SELECT version_num FROM alembic_version')).fetchall()
    out['checks'].append({'id': 'SYS-DATABASE', 'status': 'passed', 'detail': 'SELECT 1 succeeded; alembic revisions=' + ','.join(str(row[0]) for row in rows)})
    engine.dispose()
except Exception as error:
    out['checks'].append({'id': 'SYS-DATABASE', 'status': 'blocked', 'detail': type(error).__name__})
print(json.dumps(out))
'@
                    $probe = Invoke-Docker -Arguments ($compose + @('exec', '-T', 'backend', 'python', '-')) -InputText $python
                    try {
                        if ($probe.code -ne 0) { throw 'backend probe failed' }
                        $payload = $probe.text | ConvertFrom-Json
                        $dependencies = $payload.dependencies
                        foreach ($entry in $payload.checks) { Add-Check $entry.id $entry.status $entry.detail }
                    } catch { Add-Check 'SYS-BACKEND-PROBE' 'blocked' 'Backend probe failed or returned invalid JSON.' }
                } else { Add-Check 'SYS-BACKEND-PROBE' 'blocked' 'Backend is not running.' }
            }
        }
    }

    $healthTimer = [Diagnostics.Stopwatch]::StartNew()
    try {
        $health = Invoke-WebRequest -Uri ($BaseUrl.TrimEnd('/') + '/health') -UseBasicParsing -TimeoutSec 15
        $healthTimer.Stop()
        $state = if ($health.StatusCode -eq 200) { 'passed' } else { 'failed' }
        Add-Check 'SYS-NGINX-HEALTH' $state ('HTTP ' + $health.StatusCode + '; seconds=' + $healthTimer.Elapsed.TotalSeconds.ToString('F3', [cultureinfo]::InvariantCulture))
    } catch { Add-Check 'SYS-NGINX-HEALTH' 'blocked' 'Local HTTP health endpoint unavailable.' }
    if ($SkipAI) { Add-Check 'AI-CHAT' 'blocked' 'Skipped by user; no inference requested.' }
    else {
        $chatBody = @{ messages = @(@{ role = 'user'; content = 'Reply with the single word OK.' }); max_tokens = 16 } | ConvertTo-Json -Depth 5 -Compress
        $timer = [Diagnostics.Stopwatch]::StartNew()
        try {
            $reply = Invoke-RestMethod -Uri ($BaseUrl.TrimEnd('/') + '/api/ai/chat') -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($chatBody)) -TimeoutSec 150
            $timer.Stop()
            if (-not $reply.choices -or -not $reply.choices[0].message.content) { throw 'No completion' }
            Add-Check 'AI-CHAT' 'passed' ('Non-empty completion; seconds=' + $timer.Elapsed.TotalSeconds.ToString('F3', [cultureinfo]::InvariantCulture) + '; reply omitted; not a quality benchmark.')
        } catch { Add-Check 'AI-CHAT' 'blocked' 'AI completion unavailable or invalid; response body omitted.' }
    }
    Add-Check 'AUTH-END-TO-END' 'blocked' 'Interactive login/session/logout and access enforcement require a separate test.'
    Add-Check 'FUNCTIONAL-END-TO-END' 'blocked' 'CRUD, uploads, ranking, SSE and real failure recovery are not exercised by this read-only collection.'
} catch {
    Add-Check 'SYS-COLLECTOR' 'blocked' 'Unexpected collection failure; partial evidence preserved; raw error omitted.'
} finally {
    Pop-Location
    $report = [ordered]@{
        schemaVersion = 1
        startedUtc = $started
        finishedUtc = [datetime]::UtcNow.ToString('o')
        sourceCommit = $revision
        sourceCommitScope = 'Local checkout only; deployed image IDs are recorded separately.'
        powershellVersion = $PSVersionTable.PSVersion.ToString()
        dockerServerVersion = $dockerVersion
        dependencies = $dependencies
        containers = @($containers.ToArray())
        resourceSnapshot = $resources
        checks = @($results.ToArray())
    }
    $report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $outputPath 'report.json') -Encoding UTF8
    $summary = @('# HR-AI Platform - local diagnostic evidence', '', 'Local source commit: ' + $revision, '', '| Check | Status | Detail |', '|---|---|---|')
    foreach ($entry in $results) { $summary += '| ' + $entry.id + ' | ' + $entry.status + ' | ' + $entry.detail.Replace('|', '/') + ' |' }
    $summary | Set-Content -LiteralPath (Join-Path $outputPath 'summary.md') -Encoding UTF8
    Compress-Archive -LiteralPath @((Join-Path $outputPath 'report.json'), (Join-Path $outputPath 'summary.md')) -DestinationPath ($outputPath + '.zip')
    Write-Host ('Report: ' + $outputPath + '.zip')
    Write-Host 'Collection finished. Blocked checks do not mean that the platform passed acceptance.'
}
