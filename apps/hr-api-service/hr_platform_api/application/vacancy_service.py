# application/vacancy_service.py
from typing import List, Optional, Dict, Any
from ..db.repositories.vacancy_repository import (
    create_vacancy as repo_create,
    get_vacancy as repo_get,
    get_all_vacancies as repo_get_all,
    update_vacancy as repo_update,
    archive_vacancy as repo_archive
)


async def create_vacancy(
        title: str,
        department: str,
        description: Optional[str] = None,
        requirements: Optional[str] = None,
        skills: Optional[List[str]] = None,
        deadline: Optional[str] = None,
        created_by: str = "mock-hr-id"
) -> Dict[str, Any]:
    """
    Создать новую вакансию.
    """
    return await repo_create(
        title=title,
        department=department,
        description=description,
        requirements=requirements,
        skills=skills,
        deadline=deadline,
        created_by=created_by
    )


async def get_vacancy(vacancy_id: str) -> Optional[Dict[str, Any]]:
    """
    Получить вакансию по ID.
    """
    return await repo_get(vacancy_id)


async def get_all_vacancies(
        created_by: Optional[str] = None,
        department: Optional[str] = None,
        include_archived: bool = False
) -> List[Dict[str, Any]]:
    """
    Получить список всех вакансий с фильтрацией.
    """
    return await repo_get_all(
        created_by=created_by,
        department=department,
        include_archived=include_archived
    )


async def update_vacancy(
        vacancy_id: str,
        title: Optional[str] = None,
        department: Optional[str] = None,
        description: Optional[str] = None,
        requirements: Optional[str] = None,
        skills: Optional[List[str]] = None,
        deadline: Optional[str] = None,
        status: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Частично обновить вакансию.
    """
    updates = {
        k: v for k, v in {
            "title": title,
            "department": department,
            "description": description,
            "requirements": requirements,
            "skills": skills,
            "deadline": deadline,
            "status": status
        }.items() if v is not None
    }
    return await repo_update(vacancy_id, updates)


async def archive_vacancy(vacancy_id: str) -> bool:
    """
    Архивировать вакансию (мягкое удаление).
    """
    return await repo_archive(vacancy_id)
