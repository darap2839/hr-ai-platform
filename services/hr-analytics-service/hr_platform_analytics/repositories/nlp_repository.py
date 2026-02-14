import httpx
from hr_platform_analytics.config import NLP_SERVICE_URL


class NLPRepository:
    @staticmethod
    async def analyze_text(text: str) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(NLP_SERVICE_URL, json={"text": text})
                response.raise_for_status()
                return response.json()
            except:
                # stub на случай ошибки
                return {"skills": ["Python"], "role": "Backend Engineer (stub)"}
