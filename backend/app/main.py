# backend/app/main.py
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import engine, get_db
from app.parsers import extract_text_from_pdf, extract_text_from_docx
from app.api import candidates
app.include_router(candidates.router)
import httpx
import os

# Создаём таблицы
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

NLP_SERVICE_URL = os.getenv("NLP_SERVICE_URL", "http://nlp-service:8001")


@app.post("/api/v1/upload_vacancy")
async def upload_vacancy(
        file: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    # 1. Сохраняем файл (как у тебя было)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # 2. Извлекаем текст
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_path)
    elif file.filename.endswith(".docx"):
        text = extract_text_from_docx(file_path)
    else:
        raise HTTPException(status_code=400, detail="Invalid file format")

    # 3. Отправляем в NLP Service
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{NLP_SERVICE_URL}/structure",
            json={"text": text}
        )
        structured = response.json()

    # 4. Сохраняем вакансию в БД (НОВОЕ!)
    db_job = models.Job(
        title=structured.get("role", "Неизвестная роль"),
        department="Не указан",
        level="Не указан",
        description=text[:500] + "...",
        required_skills=structured.get("skills", []),
        preferred_skills=[],
        status="draft"
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    return {
        "status": "success",
        "job_id": db_job.id,
        "structured": structured
    }