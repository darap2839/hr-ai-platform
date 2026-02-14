from pydantic import BaseModel


class ResumeUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] | None = None
    experience: str | None = None
    education: str | None = None
    position: str | None = None