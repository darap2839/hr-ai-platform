# security/schemas.py
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str | None = None
    role: str = "hr"  # или list[str] для нескольких ролей