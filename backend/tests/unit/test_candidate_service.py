"""Unit tests for CandidateService"""
import pytest
from fastapi import HTTPException

from app.schemas import CandidateCreate
from app.services.candidate.service import CandidateService


class TestCandidateService:
    """Тесты для CandidateService"""

    def test_create_candidate(self, test_db):
        """Тест создания кандидата"""
        payload = CandidateCreate(
            full_name="Иван Иванов",
            email="ivan@test.com",
            phone="+79991234567",
            skills=["Python", "FastAPI"],
            experience_years=5,
            resume_text="Опытный Python разработчик"
        )

        candidate = CandidateService.create_candidate(test_db, payload)

        assert candidate.id is not None
        assert candidate.full_name == "Иван Иванов"
        assert candidate.email == "ivan@test.com"
        assert isinstance(candidate.skills, list)
        assert "Python" in candidate.skills

    def test_create_candidate_duplicate_email(self, test_db):
        """Тест: дубликат email выбрасывает 400"""
        payload = CandidateCreate(
            full_name="Иван Иванов",
            email="ivan@test.com",
            skills=["Python"]
        )
        CandidateService.create_candidate(test_db, payload)

        with pytest.raises(HTTPException) as exc_info:
            CandidateService.create_candidate(test_db, payload)

        assert exc_info.value.status_code == 400

    def test_list_candidates(self, test_db):
        """Тест получения списка кандидатов"""
        payload = CandidateCreate(
            full_name="Иван Иванов",
            email="ivan@test.com",
            skills=["Python"]
        )
        CandidateService.create_candidate(test_db, payload)

        candidates = CandidateService.list_candidates(test_db)

        assert len(candidates) == 1
        assert isinstance(candidates[0].skills, list)
