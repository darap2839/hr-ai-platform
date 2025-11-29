from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="HR NLP Test Service")


# Модели запросов
class StructureRequest(BaseModel):
    text: str


class RecommendationRequest(BaseModel):
    candidate: Dict
    job: Dict


class ExplainRequest(BaseModel):
    candidate: Dict
    job: Dict


# Эндпоинт структуры
@app.post("/structure")
def structure_text(request: StructureRequest):
    # Пока просто ручка тестовая
    if request.text:
        return {"status": "ok", "message": "Структура текста обработана"}
    return {"status": "не ок", "message": "Пустой текст"}


# Эндпоинт рекомендаций
@app.post("/generate_recommendation")
def generate_recommendation(request: RecommendationRequest):
    # Пока ручка возвращает фиксированное значение
    if request.candidate and request.job:
        return {"status": "ok", "recommendation": "Рекомендация сгенерирована (тест)"}
    return {"status": "не ок", "recommendation": "Некорректные данные"}


# Эндпоинт объяснения для HR
@app.post("/explain_match")
def explain_match(request: ExplainRequest):
    if request.candidate and request.job:
        return {"status": "ok", "explanation": "Объяснение сгенерировано (тест)"}
    return {"status": "не ок", "explanation": "Некорректные данные"}
