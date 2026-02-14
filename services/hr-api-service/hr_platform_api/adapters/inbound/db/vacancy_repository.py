# db/vacancy_repository.py
from typing import List, Optional, Dict, Any

# ЗАГЛУШКА: временная "база данных" в памяти
_mock_vacancy_db: Dict[str, Dict[str, Any]] = {}
_next_id = 1


async def create_vacancy(
        title: str,
        department: str,
        description: Optional[str] = None,
        requirements: Optional[str] = None,
        skills: Optional[List[str]] = None,
        deadline: Optional[str] = None,
        created_by: str = "mock-hr-id"
) -> Dict[str, Any]:
    global _next_id
    vacancy_id = f"vacancy_{_next_id}"
    _next_id += 1

    vacancy = {
        "id": vacancy_id,
        "title": title,
        "department": department,
        "description": description,
        "requirements": requirements,
        "skills": skills or [],
        "deadline": deadline,
        "created_by": created_by,
        "status": "active",  # active, archived, closed
        "archived": False
    }
    _mock_vacancy_db[vacancy_id] = vacancy
    return vacancy


async def get_vacancy(vacancy_id: str) -> Optional[Dict[str, Any]]:
    vacancy = _mock_vacancy_db.get(vacancy_id)
    if vacancy and not vacancy.get("archived", False):
        return vacancy
    return None


async def get_all_vacancies(
        created_by: Optional[str] = None,
        department: Optional[str] = None,
        include_archived: bool = False
) -> List[Dict[str, Any]]:
    vacancies = list(_mock_vacancy_db.values())

    if created_by:
        vacancies = [v for v in vacancies if v.get("created_by") == created_by]
    if department:
        vacancies = [v for v in vacancies if v.get("department") == department]
    if not include_archived:
        vacancies = [v for v in vacancies if not v.get("archived", False)]

    return vacancies


async def update_vacancy(vacancy_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if vacancy_id not in _mock_vacancy_db:
        return None

    vacancy = _mock_vacancy_db[vacancy_id]
    for key, value in updates.items():
        if key in vacancy:
            vacancy[key] = value
    return vacancy


async def archive_vacancy(vacancy_id: str) -> bool:
    if vacancy_id not in _mock_vacancy_db:
        return False
    _mock_vacancy_db[vacancy_id]["archived"] = True
    _mock_vacancy_db[vacancy_id]["status"] = "archived"
    return True