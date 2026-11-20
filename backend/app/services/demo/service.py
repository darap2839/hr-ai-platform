"""Generate the explicit demo dataset using the current persistence contract."""
from sqlalchemy.orm import Session

from app.core.cache import cache_invalidate
from app.models import CandidateModel
from app.repositories.demo_repository import seed_demo_records
from app.schemas import CandidateCreate, VacancyCreate
from app.services.vacancy.mapper import VacancyMapper


class DemoService:
    """Create missing demo records; preserve any existing user data."""

    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def seed_demo(db: Session) -> dict[str, int]:
        """Return newly created counts; repeated serial calls create no duplicates."""
        vacancies = [
            VacancyCreate(title="Senior Python Developer", department="Engineering", description="Ищем Python разработчика", required_skills=["Python", "FastAPI"]),
            VacancyCreate(title="Frontend Developer", department="Engineering", description="Ищем React разработчика", required_skills=["React", "JavaScript"]),
        ]
        candidates = [
            CandidateCreate(full_name="Иван Иванов", email="ivan@example.com", phone="+79991234567", skills=["Python", "FastAPI"], experience_years=5, resume_text="Опытный Python разработчик"),
            CandidateCreate(full_name="Анна Петрова", email="anna@example.com", phone="+79997654321", skills=["React", "JavaScript"], experience_years=3, resume_text="Frontend разработчик"),
        ]
        return seed_demo_records(
            db,
            [VacancyMapper.to_model(payload) for payload in vacancies],
            [CandidateModel(**payload.model_dump(exclude={"skills"}), skills=",".join(payload.skills)) for payload in candidates],
        )

    @staticmethod
    def seed_demo_data(db: Session) -> dict[str, int]:
        """Keep compatibility with callers using the previous method name."""
        return DemoService.seed_demo(db)


demo_service = DemoService()
