# application/resume_service.py
from typing import List, Optional, Dict, Any
from ..db.repositories.resume_repository import (
    create_resume as repo_create,
    get_resume as repo_get,
    get_all_resumes as repo_get_all,
    update_resume as repo_update,
    archive_resume as repo_archive
)


async def create_resume(
        full_name: str,
        email: str,
        position: Optional[str] = None,
        phone: Optional[str] = None,
        skills: Optional[List[str]] = None,
        experience: Optional[str] = None,
        education: Optional[str] = None,
        file_url: Optional[str] = None,
        created_by: str = "mock-hr-id"
) -> Dict[str, Any]:
    return await repo_create(
        full_name=full_name,
        email=email,
        position=position,
        phone=phone,
        skills=skills,
        experience=experience,
        education=education,
        file_url=file_url,
        created_by=created_by
    )


async def get_resume(resume_id: str) -> Optional[Dict[str, Any]]:
    return await repo_get(resume_id)


async def get_all_resumes(
        created_by: Optional[str] = None,
        include_archived: bool = False
) -> List[Dict[str, Any]]:
    return await repo_get_all(created_by, include_archived)


async def update_resume(
        resume_id: str,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        position: Optional[str] = None,
        phone: Optional[str] = None,
        skills: Optional[List[str]] = None,
        experience: Optional[str] = None,
        education: Optional[str] = None,
        ai_analysis: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    # Формируем словарь только из переданных (не None) значений
    updates = {
        k: v for k, v in {
            "full_name": full_name,
            "email": email,
            "position": position,
            "phone": phone,
            "skills": skills,
            "experience": experience,
            "education": education,
            "ai_analysis": ai_analysis
        }.items() if v is not None
    }

    return await repo_update(resume_id, updates)


async def archive_resume(resume_id: str) -> bool:
    return await repo_archive(resume_id)


# AI-анализ остаётся в сервисе (бизнес-логика)
async def run_ai_analysis(resume_id: str) -> Optional[Dict[str, Any]]:
    resume = await get_resume(resume_id)
    if not resume:
        return None

    ai_result = {
        "skills_extracted": resume.get("skills", ["Python", "FastAPI"]),
        "experience_years": 5,
        "match_score": 85,
        "recommendations": ["Рассмотреть на роль Backend Developer"],
        "processed_at": "2025-06-01T12:00:00Z"
    }

    await update_resume(resume_id, ai_analysis=ai_result)
    return ai_result