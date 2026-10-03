# AI Engine

This directory contains the isolated LLM runtime for HR AI Platform.

The first implementation uses Soup as an OpenAI-compatible inference server.
It is intentionally isolated from the FastAPI backend.

## Local development

The service is disabled in the default Compose profile.

Start only the AI Engine with:

```bash
docker compose --profile ai up -d --build ai-engine
```

The default model is a small Qwen instruct model selected for a CPU-only development machine:

```
Qwen/Qwen2.5-0.5B-Instruct
```

The model cache is stored in `./data/ai-models`.

Change the model without changing the application architecture:

```bash
AI_MODEL=<model-id> docker compose --profile ai up -d --build ai-engine
```

The next step is to add a small FastAPI client for this service. Until that happens,
the core platform does not depend on AI Engine availability.
