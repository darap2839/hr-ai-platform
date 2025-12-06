# controllers/resume_controller.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Annotated

from pydantic import BaseModel

from ..security.auth import get_current_user
from ..security.schemas import UserResponse

resumes_router = APIRouter(prefix="/resumes", tags=["Resumes"])


class ResumeUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] | None = None
    experience: str | None = None
    education: str | None = None
    position: str | None = None


@resumes_router.post("")
async def upload_resume(
        current_user: UserResponse = Depends(get_current_user),
        full_name: Annotated[str, Form()] = None,
        email: Annotated[str, Form()] = None,
        position: Annotated[str, Form()] = None,
        file: Annotated[UploadFile, File()] = None,
):
    file_info = None
    if file:
        file_info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_kb": len(await file.read()) // 1024
        }
        await file.seek(0)

    return {
        "user_id": current_user.user_id,
        "resume_id": "mock-resume-123",
        "message": "Резюме успешно загружено",
        "file_info": file_info,
        "manual_data": {
            "full_name": full_name,
            "email": email,
            "position": position
        }
    }


@resumes_router.get("")
async def get_resume_list(
        current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "resumes": []
    }


@resumes_router.get("/{id}")
async def get_resume_item(
        id: str,
        current_user: UserResponse = Depends(get_current_user)
):
    """
    Получить детали резюме по ID (включая AI-анализ, если есть).
    """
    return {
        "user_id": current_user.user_id,
        "resume_id": id,
        "full_name": "Иван Иванов",
        "email": "ivan@example.com",
        "skills": ["Python", "FastAPI", "AI"],
        "ai_analysis": {
            "match_score": 85,
            "recommendations": ["Рассмотреть на роль Backend Developer"]
        }
    }


@resumes_router.patch("/{id}")
async def update_resume(
        id: str,
        update_data: ResumeUpdate,
        current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "resume_id": id,
        "updated_fields": update_data.model_dump(exclude_none=True),
        "message": "Резюме обновлено"
    }


@resumes_router.delete("/{id}")
async def archive_resume(
        id: str,
        current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "resume_id": id,
        "message": "Резюме архивировано"
    }
