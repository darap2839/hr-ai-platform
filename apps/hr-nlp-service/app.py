# hr-nlp-service/app.py
from fastapi import FastAPI, HTTPException
import spacy
import ollama
import re

app = FastAPI()

# Загружаем spaCy (для будущего использования)
try:
    nlp = spacy.load("ru_core_news_sm")
except OSError:
    print("Модель spaCy не найдена. Используем fallback.")

# Словарь ключевых слов (оставляем твой)
ELECTRONICS_KEYWORDS = {
    "altium", "cadence", "плис", "fpga", "свч", "микросхема",
    "гост рф", "печатная плата", "осциллограф", "спектроанализатор"
}


@app.post("/structure")
def structure_text(request: dict):
    text = request["text"].lower()
    skills = [kw for kw in ELECTRONICS_KEYWORDS if kw in text]

    # Простое определение роли
    role = "инженер"
    if "программист" in text or "разработчик" in text:
        role = "программист"
    elif "инженер" in text:
        role = "инженер"

    return {"skills": skills, "role": role}


# НОВЫЙ ЭНДПОИНТ: генерация рекомендаций
@app.post("/generate_recommendation")
def generate_recommendation(request: dict):
    """
    Генерирует рекомендацию для кандидата
    request: { "candidate": {...}, "job": {...} }
    """
    try:
        # Используем Llama 3 через Ollama
        prompt = f"""
        Ты — карьерный консультант в ИТ. 
        Кандидат: {request['candidate']['experience']}, навыки: {', '.join(request['candidate']['skills'])}
        Вакансия: {request['job']['title']}, требуется: {', '.join(request['job']['required_skills'])}

        Объясни, почему кандидат пока не подходит, и дай персонализированный план развития.
        Пиши на русском, дружелюбно, без маркированных списков.
        """

        response = ollama.generate(model='llama3', prompt=prompt)
        return {"recommendation": response['response']}
    except Exception as e:
        # Fallback: простой ответ
        return {"recommendation": "Изучите недостающие навыки и попробуйте снова."}


# НОВЫЙ ЭНДПОИНТ: объяснение для HR
@app.post("/explain_match")
def explain_match(request: dict):
    """Объясняет HR, почему кандидат рекомендован"""
    # Аналогично с промптом для HR
    pass