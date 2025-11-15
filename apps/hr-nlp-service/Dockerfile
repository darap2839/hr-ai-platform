# hr-nlp-service/Dockerfile
FROM ollama/ollama:latest

# Устанавливаем Python и зависимости
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Копируем исходный код
COPY . .

# Запускаем Ollama (в фоне не нужно — он уже запущен через ENTRYPOINT)
# Но нам нужно дождаться его готовности, затем запустить FastAPI
CMD ["sh", "-c", "sleep 10 && ollama pull llama3 && uvicorn app:app --host 0.0.0.0 --port 8001"]