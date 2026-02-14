from hr_platform_domain.value_objects.skill import Skill


class Job:
    def __init__(self, id: int, title: str, required_skills: list[Skill]):
        self.id = id
        self.title = title
        self.required_skills = required_skills
