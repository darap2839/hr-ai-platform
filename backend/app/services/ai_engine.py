from typing import Any

import httpx

from app.core.config import get_settings


class AIEngineClient:
    def __init__(self) -> None:
        self.base_url = get_settings().ai_engine_url.rstrip("/")

    async def chat(self, messages: list[dict[str, str]], max_tokens: int = 256) -> dict[str, Any]:
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self.base_url}/v1/chat/completions", json=payload)
            response.raise_for_status()
            return response.json()
