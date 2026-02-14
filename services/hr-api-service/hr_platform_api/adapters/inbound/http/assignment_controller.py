# http/assignment_controller.py
from fastapi import APIRouter, Depends, Query
from ....security.auth import get_current_user
from ....security.schemas import UserResponse
from ....application import assignment_service, matching_service

assignments_router = APIRouter(prefix="/assignments", tags=["Assignments"])

# --- Основные операции ---
@assignments_router.post("")
async def create_assignment(
    resume_id: str,
    vacancy_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await assignment_service.create_assignment(
        resume_id=resume_id,
        vacancy_id=vacancy_id,
        assigned_by=current_user.user_id
    )

@assignments_router.get("/{id}")
async def get_assignment(
    id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await assignment_service.get_assignment(id)

@assignments_router.patch("/{id}/status")
async def update_assignment_status(
    id: str,
    status: str,
    comment: str | None = None,
    current_user: UserResponse = Depends(get_current_user)
):
    return await assignment_service.update_status(id, status, comment)

# --- Рекомендации ---
@assignments_router.get("/vacancies/{vacancy_id}/suggested-resumes")
async def get_suggested_resumes(
    vacancy_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: UserResponse = Depends(get_current_user)
):
    suggestions = await matching_service.get_resume_matches(vacancy_id, limit)
    return {
        "vacancy_id": vacancy_id,
        "suggestions": suggestions
    }

# --- Агрегаты ---
@assignments_router.get("/vacancies/{vacancy_id}/assignments")
async def get_assignments_by_vacancy(
    vacancy_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await assignment_service.get_assignments_by_vacancy(vacancy_id)