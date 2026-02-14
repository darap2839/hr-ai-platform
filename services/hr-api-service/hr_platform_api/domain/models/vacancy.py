from pydantic import BaseModel

class VacancyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    department: str | None = None
    deadline: str | None = None  # формат: "YYYY-MM-DD"
    status: str | None = None    # например: "active", "archived", "closed"
