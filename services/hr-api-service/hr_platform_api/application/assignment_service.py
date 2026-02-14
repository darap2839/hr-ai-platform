# application/assignment_service.py

async def create_assignment(resume_id: str, vacancy_id: str, assigned_by: str):
    # Здесь будет логика (сейчас — заглушка)
    return {
        "assignment_id": "mock-assign-123",
        "resume_id": resume_id,
        "vacancy_id": vacancy_id,
        "assigned_by": assigned_by,
        "status": "under_review"
    }

async def get_assignment(assignment_id: str):
    return {"assignment_id": assignment_id, "status": "mock"}

async def update_status(assignment_id: str, status: str, comment: str | None = None):
    return {"assignment_id": assignment_id, "status": status}

async def get_assignments_by_vacancy(vacancy_id: str):
    return {"vacancy_id": vacancy_id, "assignments": []}