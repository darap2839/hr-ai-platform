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

## Test the AI assistant in the vacancy form

The vacancy-creation chat now sends messages to the real local AI Engine through `POST /api/ai/chat`; it no longer fills the form with hard-coded demo vacancy data.

1. Pull the latest `master` changes and rebuild/update the frontend image using the normal project deployment workflow.
2. Start the local AI Engine and wait until its health status is `healthy` (see [AI Engine setup and troubleshooting](ai-engine/README.md)).
3. Open the platform at [http://localhost](http://localhost), go to **Вакансии** and open **Создание вакансии**.
4. In **Чат-помощник**, test an ordinary question, for example: `Составь пять основных требований к инженеру-электронщику на предприятии радиоэлектронной отрасли.` The reply should come from the model and appear in the chat.
5. To generate a vacancy draft, ask explicitly, for example: `Создай вакансию инженера-электронщика. Отдел: разработка радиоэлектронной аппаратуры. Обязанности: разработка и тестирование электронных устройств. Навыки: чтение электрических схем, измерительное оборудование.` The assistant will attempt to extract a draft; review and correct all fields before saving.

If the assistant reports that the AI is unavailable, check `docker compose --profile ai ps -a ai-engine` and `docker compose logs --tail=100 backend`. If the page still behaves like the old version, update/rebuild the frontend image and recreate the frontend service before testing again.

### Manual API smoke test (diagnostic fallback)

The UI is the primary test. If needed, the backend can still be tested separately from PowerShell by writing the request body as UTF-8 JSON to a file and posting it with `curl.exe --data-binary "@ai-test.json"` to `http://localhost/api/ai/chat`. This diagnostic step is useful for separating frontend issues from backend/model issues; it does not replace testing in the platform.

