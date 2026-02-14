# application/matching_service.py

async def get_resume_matches(vacancy_id: str, limit: int = 10) -> list[dict]:
    # Заглушка рекомендаций
    return [
        {
            "resume_id": f"resume-{i}",
            "score": 95 - i * 2,
            "reasons": [
                "Совпадение по ключевым навыкам",
                "Опыт соответствует требованиям"
            ]
        }
        for i in range(1, min(limit + 1, 6))
    ]