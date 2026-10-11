"""Tests for the API boundary to the isolated AI Engine."""
import httpx
import pytest
from fastapi import HTTPException

from app.api.ai import ChatRequest, chat


@pytest.mark.asyncio
async def test_chat_forwards_messages_and_token_limit(monkeypatch):
    expected = {"choices": [{"message": {"role": "assistant", "content": "Готово"}}]}
    captured = {}

    async def fake_chat(self, messages, max_tokens):
        captured["messages"] = messages
        captured["max_tokens"] = max_tokens
        return expected

    monkeypatch.setattr("app.api.ai.AIEngineClient.chat", fake_chat)
    payload = ChatRequest(
        messages=[{"role": "user", "content": "Привет"}],
        max_tokens=64,
    )

    result = await chat(payload)

    assert result == expected
    assert captured == {
        "messages": [{"role": "user", "content": "Привет"}],
        "max_tokens": 64,
    }


@pytest.mark.asyncio
async def test_chat_returns_503_when_engine_is_unreachable(monkeypatch):
    async def unavailable(self, messages, max_tokens):
        request = httpx.Request("POST", "http://ai-engine:8000/v1/chat/completions")
        raise httpx.ConnectError("connection refused", request=request)

    monkeypatch.setattr("app.api.ai.AIEngineClient.chat", unavailable)
    payload = ChatRequest(messages=[{"role": "user", "content": "Привет"}])

    with pytest.raises(HTTPException) as error:
        await chat(payload)

    assert error.value.status_code == 503
    assert error.value.detail == "AI Engine временно недоступен"
