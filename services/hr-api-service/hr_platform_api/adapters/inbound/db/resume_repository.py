# db/resume_repository.py
from typing import List, Optional, Dict, Any

# ЗАГЛУШКА: временная "база данных" в памяти
_mock_resume_db: Dict[str, Dict[str, Any]] = {}
_next_id = 1


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
    global _next_id
    resume_id = f"resume_{_next_id}"
    _next_id += 1

    resume = {
        "id": resume_id,
        "full_name": full_name,
        "email": email,
        "position": position,
        "phone": phone,
        "skills": skills or [],
        "experience": experience,
        "education": education,
        "file_url": file_url,
        "created_by": created_by,
        "archived": False,
        "ai_analysis": None
    }
    _mock_resume_db[resume_id] = resume
    return resume


async def get_resume(resume_id: str) -> Optional[Dict[str, Any]]:
    resume = _mock_resume_db.get(resume_id)
    if resume and not resume.get("archived", False):
        return resume
    return None


async def get_all_resumes(
        created_by: Optional[str] = None,
        include_archived: bool = False
) -> List[Dict[str, Any]]:
    resumes = list(_mock_resume_db.values())

    if created_by:
        resumes = [r for r in resumes if r.get("created_by") == created_by]

    if not include_archived:
        resumes = [r for r in resumes if not r.get("archived", False)]

    return resumes


async def update_resume(
        resume_id: str,
        updates: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    if resume_id not in _mock_resume_db:
        return None

    resume = _mock_resume_db[resume_id]
    for key, value in updates.items():
        if key in resume:  # Защита от случайных полей
            resume[key] = value

    return resume


async def archive_resume(resume_id: str) -> bool:
    if resume_id not in _mock_resume_db:
        return False
    _mock_resume_db[resume_id]["archived"] = True
    return True