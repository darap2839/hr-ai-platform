# hr-ai-platform/hr-backend-service/app/models/match.py
from sqlalchemy import Column, Integer, Float, String, ForeignKey, JSON
from app.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    match_score = Column(Float)                   # Процент соответствия: 0.72
    ai_explanation = Column(String)               # Объяснение от ИИ: "Вы отлично знаете Python..."
    recommendation_text = Column(String)          # Полный текст рекомендации для кандидата
    missing_skills = Column(JSON)                 # Недостающие навыки: ["Docker", "Kubernetes"]