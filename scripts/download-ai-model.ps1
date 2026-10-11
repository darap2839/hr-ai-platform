$ErrorActionPreference = "Stop"

$model = if ($env:AI_MODEL) {
    $env:AI_MODEL
} else {
    "Qwen/Qwen2.5-0.5B-Instruct"
}

$modelDirectory = ($model -split "/")[-1]
$pythonCode = "from huggingface_hub import snapshot_download; snapshot_download(repo_id='$model', local_dir='/models/$modelDirectory')"

Write-Host "Загрузка модели $model в data/ai-models/$modelDirectory ..."
docker compose --profile ai run --rm --no-deps --entrypoint python ai-engine -c $pythonCode

if ($LASTEXITCODE -ne 0) {
    throw "Загрузка модели завершилась с ошибкой (код $LASTEXITCODE)."
}

Write-Host "Загрузка модели завершена."
