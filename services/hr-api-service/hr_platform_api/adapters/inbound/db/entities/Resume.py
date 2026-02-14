# models/resume.py или entities/resume.py
from typing import List, Optional
from pydantic import BaseModel, Field

class Resume(BaseModel):
    id: str
    full_name: str
    email: str
    position: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: Optional[str] = None
    education: Optional[str] = None
    file_url: Optional[str] = None
    created_by: str
    archived: bool = False
    ai_analysis: Optional[dict] = None  # или отдельная модель, если сложная