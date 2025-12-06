# http/vacancy_controller.py
from fastapi import APIRouter, Depends

from ....security.auth import get_current_user
from ....security.schemas import UserResponse
from ....domain.models.vacancy import VacancyUpdate

vacancies_router = APIRouter(prefix="/vacancies", tags=["Vacancies"])

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