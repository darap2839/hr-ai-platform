from pydantic import BaseModel

class Match(BaseModel):
    candidate_id: int
    job_id: int
    score: float
