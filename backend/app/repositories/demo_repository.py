"""Persist demo fixtures without duplicating or overwriting existing records."""
from sqlalchemy.orm import Session

from app.models import ApplicationModel, CandidateModel, VacancyModel


def seed_demo_records(
    db: Session, vacancies: list[VacancyModel], candidates: list[CandidateModel]
) -> dict[str, int]:
    """Create missing fixtures and their first application in one transaction."""
    counts = {"vacancies": 0, "candidates": 0, "applications": 0}
    saved_vacancies = []
    saved_candidates = []
    try:
        for template in vacancies:
            record = db.query(VacancyModel).filter(
                VacancyModel.title == template.title,
                VacancyModel.department == template.department,
            ).first()
            if record is None:
                record = template
                db.add(record)
                db.flush()
                counts["vacancies"] += 1
            saved_vacancies.append(record)
        for template in candidates:
            record = db.query(CandidateModel).filter(CandidateModel.email == template.email).first()
            if record is None:
                record = template
                db.add(record)
                db.flush()
                counts["candidates"] += 1
            saved_candidates.append(record)
        candidate, vacancy = saved_candidates[0], saved_vacancies[0]
        application = db.query(ApplicationModel).filter(
            ApplicationModel.candidate_id == candidate.id,
            ApplicationModel.vacancy_id == vacancy.id,
        ).first()
        if application is None:
            db.add(ApplicationModel(candidate_id=candidate.id, vacancy_id=vacancy.id, stage="new"))
            counts["applications"] += 1
        db.commit()
    except Exception:
        db.rollback()
        raise
    return counts
