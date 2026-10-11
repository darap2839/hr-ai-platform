# AI Engine

AI Engine is an optional, isolated local LLM service. It runs Soup as an OpenAI-compatible inference server and keeps model weights outside the FastAPI process.

## Requirements

- Docker Desktop with Docker Compose
- The repository checked out locally
- Enough disk space for the model and the Docker image

The current default model is `Qwen/Qwen2.5-0.5B-Instruct`. It runs on CPU and does not require a paid API key.

## First-time setup

Run these commands from the repository root in PowerShell.

1. Download the model once (the script stores it under `data/ai-models`, which is intentionally not committed to Git):

```powershell
. scripts\download-ai-model.ps1
```

Remove the space after `.` if copying manually; the actual command is:

```powershell
.\scripts\download-ai-model.ps1
```

2. Build and start the optional service:

```powershell
docker compose --profile ai up -d --build ai-engine
```

3. Check readiness and logs:

```powershell
docker compose --profile ai ps -a ai-engine
docker compose --profile ai logs --tail=100 ai-engine
```

Wait for `healthy` and the `Server Ready` log message. The first model load may take a little while.

## Check the service

The Compose configuration does not publish port 8000 to the host. This is intentional: the backend reaches the AI Engine over Docker's internal network at `http://ai-engine:8000`.

Check health from inside the container:

```powershell
docker compose --profile ai exec ai-engine python -c "import urllib.request; r=urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=10); print('HTTP:', r.status); print(r.read().decode())"
```

Send a test prompt to the model from inside the container:

```powershell
docker compose --profile ai exec ai-engine python -c "import json,urllib.request; d=json.dumps({'model':'Qwen2.5-0.5B-Instruct','messages':[{'role':'user','content':'Ответь по-русски: что такое подбор сотрудников?'}],'max_tokens':100}).encode(); req=urllib.request.Request('http://127.0.0.1:8000/v1/chat/completions',data=d,headers={'Content-Type':'application/json'}); r=urllib.request.urlopen(req,timeout=120); print(r.read().decode())"
```

## Stop and restart

```powershell
docker compose --profile ai stop ai-engine
docker compose --profile ai up -d ai-engine
```

## Configuration

- `AI_MODEL` is the Hugging Face repository ID used by the model download script.
- `AI_MODEL_PATH` is the model directory mounted into the container; default: `/models/Qwen2.5-0.5B-Instruct`.
- `AI_MODEL_NAME` is the model name sent by the FastAPI backend; default: `Qwen2.5-0.5B-Instruct`.

Model files under `data/ai-models` are local artifacts and are not tracked by Git.
