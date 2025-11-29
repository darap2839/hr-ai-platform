from pydantic import BaseModel

class Experience(BaseModel):
    years: int
    description: str
