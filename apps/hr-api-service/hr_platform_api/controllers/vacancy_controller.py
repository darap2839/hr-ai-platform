# controllers/vacancy_controller.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from ..security.auth import get_current_user
from ..security.schemas import UserResponse

vacancies_router = APIRouter(prefix="/vacancies", tags=["Vacancies"])

class VacancyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    department: str | None = None
    deadline: str | None = None  # формат: "YYYY-MM-DD"
    status: str | None = None    # например: "active", "archived", "closed"


@vacancies_router.get("")
async def get_vacancy_list(
    current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "message": "Список вакансий доступен",
        "vacancies": []
    }


@vacancies_router.get("/{id}")
async def get_vacancy_item(
    id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "vacancy_id": id,
        "message": "Детали вакансии"
    }


@vacancies_router.patch("/{id}")
async def update_vacancy(
    id: str,
    update_data: VacancyUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "vacancy_id": id,
        "updated_fields": update_data.dict(exclude_none=True),
        "message": "Вакансия обновлена"
    }


@vacancies_router.delete("/{id}")
async def archive_vacancy(
    id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "vacancy_id": id,
        "message": "Вакансия архивирована"
    }