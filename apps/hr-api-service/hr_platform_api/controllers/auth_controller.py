# controllers/auth_controller.py
from fastapi import APIRouter, Depends
from ..security.auth import login_for_access_token, get_current_user
from ..security.schemas import Token, UserResponse

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/login", response_model=Token)
async def login():
    """
    Получить access token (заглушка для разработки).
    В production: интеграция с Keycloak.
    """
    return await login_for_access_token()

@auth_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """
    Получить информацию о текущем HR-пользователе.
    """
    return current_user