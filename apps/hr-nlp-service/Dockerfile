# hr-nlp-service/Dockerfile
FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# Устанавливаем Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

COPY . .

# Запускаем Ollama в фоне + FastAPI
CMD ["sh", "-c", "ollama serve & sleep 5 && ollama pull llama3 && uvicorn app:app --host 0.0.0.0 --port 8001"]