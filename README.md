# HR AI Platform

MVP HR platform with mocked AI functionality.

## Business modules

1. Dashboard
2. Vacancies
3. Candidates
4. Applications
5. AI Candidate Analysis
6. AI Interview Assistant
7. Analytics
8. Demo Data Generator

## Technology stack

- Backend: FastAPI
- Frontend: React + Vite
- State management: Zustand
- Data fetching: React Query

## Development roadmap

### Commit 1
Project bootstrap

### Commit 2
Application layout

### Commit 3
Dashboard

### Commit 4
Vacancy management

### Commit 5
Candidate management

### Commit 6
Application pipeline

### Commit 7
AI candidate analysis

### Commit 8
Interview assistant

### Commit 9
Analytics

### Commit 10
Demo scenario

## Local AI Engine (CPU)

The optional local model runs in a separate Docker Compose service. It is not required to start the rest of the platform.

See [AI Engine setup and troubleshooting](ai-engine/README.md) for first-time model download, startup, health checks, and a test prompt.

Current model: `Qwen/Qwen2.5-0.5B-Instruct`. The model files live in `data/ai-models` and are not committed to Git.

The FastAPI endpoint for chat is `POST /api/ai/chat`. Example request body:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Ответь по-русски: что такое подбор сотрудников?"
    }
  ],
  "max_tokens": 100
}
```

When the AI Engine is running, FastAPI forwards this request to the internal Docker address `http://ai-engine:8000`. The AI Engine port is intentionally not published to the host by default.
