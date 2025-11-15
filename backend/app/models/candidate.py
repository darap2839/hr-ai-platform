# backend/app/models/candidate.py
from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    experience = Column(String)
    goals = Column(String)
    skills = Column(JSON)
    learning_progress = Column(JSON)