from pydantic import BaseModel

class Skill(BaseModel):
    name: str
    level: str  # например: "junior", "middle", "senior"
