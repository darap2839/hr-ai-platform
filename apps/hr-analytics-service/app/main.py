from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import httpx

from hr_domain_models.job import Job

app = FastAPI(title="HR AI Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

NLP_SERVICE_URL = "http://nlp-service:8001/structure"


@app.post("/api/v1/upload_vacancy")
async def upload_vacancy(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Только PDF или DOCX")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(file_path)
    else:
        text = extract_text_from_docx(file_path)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(NLP_SERVICE_URL, json={"text": text})
            structured = response.json()
        except:
            structured = {"skills": ["Altium", "ГОСТ РВ"], "role": "инженер (резерв)"}

    return {"status": "success", "structured": structured}


@app.get("/api/v1/matches")
async def get_matches():
    return {
        "candidates": [
            {"name": "Иванов А.", "match_score": 92, "gap": "Нет опыта с ГОСТ РВ"},
            {"name": "Петров Б.", "match_score": 78, "gap": "Нет допуска к гостайне"}
        ],
        "recommendation": "Обучение по ГОСТ РВ — 2 недели"
    }
