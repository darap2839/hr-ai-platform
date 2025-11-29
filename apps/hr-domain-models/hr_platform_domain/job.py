from pydantic import BaseModel
from typing import List, Optional
from hr_platform.value_objects.skill import Skill

class Job(BaseModel):
    id: int
    title: str
    required_skills: List[Skill]
    preferred_skills: Optional[List[Skill]] = []
    min_experience: Optional[int]
