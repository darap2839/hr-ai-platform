# backend/app/api/candidates.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/v1")

@router.post("/candidates")
def create_candidate(
    candidate: schemas.CandidateCreate,
    db: Session = Depends(get_db)
):
    db_candidate = models.Candidate(
        name=candidate.name,
        email=candidate.email,
        experience=candidate.experience,
        goals=candidate.goals,
        skills=candidate.skills,
        learning_progress=candidate.learning_progress or {}
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate