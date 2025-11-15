# hr-ai-platform/hr-backend-service/app/models/job.py
from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)        # Название роли: "Senior Python Developer"
    department = Column(String)                   # Отдел: "Data Science", "Infrastructure"
    level = Column(String)                        # Уровень: "Junior", "Middle", "Senior"
    description = Column(String)                  # Полное описание вакансии
    required_skills = Column(JSON)                # Обязательные навыки: ["Python", "SQL"]
    preferred_skills = Column(JSON)               # Желательные навыки: ["AWS", "Docker"]
    status = Column(String, default="draft")      # Статус: "draft", "published", "closed"