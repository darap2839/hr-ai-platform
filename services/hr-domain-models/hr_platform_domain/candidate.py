from hr_platform_domain.value_objects.experience import Experience
from hr_platform_domain.value_objects.skill import Skill


class Candidate:
    def __init__(self, id: int, name: str, skills: list[Skill], experience: Experience):
        self.id = id
        self.name = name
        self.skills = skills
        self.experience = experience
