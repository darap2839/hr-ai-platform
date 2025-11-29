from pydantic import BaseModel
from typing import List, Optional
from hr_platform.value_objects.skill import Skill

class Candidate(BaseModel):
    id: int
    full_name: str
    email: Optional[str]
    skills: List[Skill]
    experience_years: Optional[int]