"""API endpoints for the isolated AI Engine."""
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ai_engine import AIEngineClient

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    max_tokens: int = Field(default=256, ge=1, le=1024)


@router.post("/chat")
async def chat(payload: ChatRequest):
    """Forward a chat request to the separately running AI Engine."""
    try:
        return await AIEngineClient().chat(
            messages=[message.model_dump() for message in payload.messages],
            max_tokens=payload.max_tokens,
        )
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        raise HTTPException(
            status_code=503,
            detail="AI Engine временно недоступен",
        ) from exc
