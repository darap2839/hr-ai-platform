FROM hr-platform/hr-base

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "hr_platform_job.main:app", "--host", "0.0.0.0", "--port", "8000"]
