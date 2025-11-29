FROM python:3.10

WORKDIR /app

COPY ../hr-domain-models /app/hr-domain-models
RUN pip install -e /app/hr-domain-models

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

