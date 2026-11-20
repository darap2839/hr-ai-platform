"""Unit tests for DemoService"""
from app.services.demo.service import DemoService
from app.repositories.vacancy_repo import VacancyRepository
from app.repositories.candidate_repository import list_candidates
from app.repositories.application_repository import list_applications


class TestDemoService:
    """Тесты для DemoService"""

    def test_seed_demo_creates_data(self, test_db):
        """Тест генерации демо данных"""
        result = DemoService.seed_demo(test_db)

        assert result["vacancies"] == 2
        assert result["candidates"] == 2
        assert result["applications"] == 1

        assert len(VacancyRepository.list(test_db)) == 2
        assert len(list_candidates(test_db)) == 2
        assert len(list_applications(test_db)) == 1

    def test_seed_demo_idempotent(self, test_db):
        """Тест: повторный вызов не создаёт дубликаты"""
        DemoService.seed_demo(test_db)
        result = DemoService.seed_demo(test_db)

        assert result["vacancies"] == 0
        assert result["candidates"] == 0
        assert result["applications"] == 0

        assert len(VacancyRepository.list(test_db)) == 2
        assert len(list_candidates(test_db)) == 2


def test_demo_preserves_existing_records(test_db):
    """Seeding must not replace user changes or delete unrelated rows."""
    from app.models import CandidateModel
    existing = CandidateModel(full_name="Существующий пользователь", email="ivan@example.com", skills="Custom")
    unrelated = CandidateModel(full_name="Другой", email="other@example.com", skills="PCB")
    test_db.add_all([existing, unrelated])
    test_db.commit()
    result = DemoService.seed_demo(test_db)
    assert result == {"vacancies": 2, "candidates": 1, "applications": 1}
    test_db.refresh(existing)
    assert existing.full_name == "Существующий пользователь"
    assert existing.skills == "Custom"
    assert test_db.get(CandidateModel, unrelated.id) is not None


def test_demo_rolls_back_partial_creation(test_db):
    """A failed final commit must not leave half of the demo dataset."""
    from unittest.mock import patch
    import pytest
    with patch.object(test_db, 'commit', side_effect=RuntimeError('commit failed')):
        with pytest.raises(RuntimeError, match='commit failed'):
            DemoService.seed_demo(test_db)
    assert VacancyRepository.list(test_db) == []
    assert list_candidates(test_db) == []
    assert list_applications(test_db) == []
    assert DemoService.seed_demo(test_db)["vacancies"] == 2


def test_demo_api_handler_uses_supported_service_method(test_db):
    from app.api.dashboard import seed_demo
    assert seed_demo(db=test_db) == {"vacancies": 2, "candidates": 2, "applications": 1}
    assert DemoService.seed_demo_data(test_db) == {"vacancies": 0, "candidates": 0, "applications": 0}
