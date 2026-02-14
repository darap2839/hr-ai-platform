# security/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from .schemas import Token, UserResponse

security = HTTPBearer()

# Заглушка: любой токен валиден
async def login_for_access_token() -> Token:
    # В реальности: обмен логин/пароль → JWT от Keycloak
    return Token(access_token="mock-jwt-token-for-dev")

async def get_current_user(credentials = Depends(security)) -> UserResponse:
    # В реальности: декодирование и валидация JWT от Keycloak
    return UserResponse(
        user_id="mock-hr-id-001",
        username="hr.specialist",
        email="hr@example.com",
        role="hr"
    )