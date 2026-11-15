"""Regression coverage for HTTP 500 paths observed in the local API run."""
import pytest
from app.schemas import CandidateCreate, CandidateUpdate, VacancyCreate, ApplicationCreate, StageUpdate
from app.services.candidate.service import CandidateService
from app.services.vacancy.service import VacancyService
from app.services.application.service import ApplicationService
from app.models.db_models import CandidateModel
from app.core.cache import cache

@pytest.fixture
def hiring_pair(test_db):
    cache.clear()
    candidate = CandidateService.create_candidate(test_db, CandidateCreate(
        full_name='Synthetic Engineer', email='engineer@example.com',
        skills=['PCB', 'Python'], experience_years=3))
    vacancy = VacancyService.create_vacancy(test_db, VacancyCreate(
        title='Synthetic PCB Engineer', department='Lab', description='Test only',
        required_skills=['PCB']))
    yield candidate, vacancy
    cache.clear()

def test_partial_candidate_update_preserves_skills(test_db, hiring_pair):
    candidate, _ = hiring_pair
    result = CandidateService.update_candidate(test_db, candidate.id, CandidateUpdate(experience_years=4))
    assert result.experience_years == 4
    assert result.skills == ['PCB', 'Python']
    test_db.expire_all()
    assert CandidateService.get_candidate(test_db, candidate.id).skills == ['PCB', 'Python']

@pytest.mark.parametrize('skills', [['RF', 'PCB'], []])
def test_candidate_skill_update_persists_as_text(test_db, hiring_pair, skills):
    candidate, _ = hiring_pair
    result = CandidateService.update_candidate(test_db, candidate.id, CandidateUpdate(skills=skills))
    assert result.skills == skills
    test_db.expire_all()
    stored = test_db.query(CandidateModel).filter_by(id=candidate.id).one()
    assert stored.skills == ','.join(skills)
    assert CandidateService.get_candidate(test_db, candidate.id).skills == skills

def test_analysis_survives_commit_list_and_stage_update(test_db, hiring_pair):
    candidate, vacancy = hiring_pair
    application = ApplicationService.create_application(test_db, ApplicationCreate(
        candidate_id=candidate.id, vacancy_id=vacancy.id))
    analyzed = ApplicationService.analyze_application(test_db, application.id)
    assert analyzed.ai_analysis.score == 100
    assert analyzed.ai_analysis.matched_skills == ['pcb']
    test_db.expire_all()
    listed = ApplicationService.list_applications(test_db)
    assert listed[0].ai_analysis.model_dump() == analyzed.ai_analysis.model_dump()
    changed = ApplicationService.update_application_stage(test_db, application.id, StageUpdate(stage='screening'))
    assert changed.stage.value == 'screening'
    assert changed.ai_analysis.score == 100

def test_interview_questions_accept_persisted_text_skills(test_db, hiring_pair):
    candidate, vacancy = hiring_pair
    application = ApplicationService.create_application(test_db, ApplicationCreate(
        candidate_id=candidate.id, vacancy_id=vacancy.id))
    result = ApplicationService.get_interview_questions(test_db, application.id)
    assert any('PCB' in question for question in result['questions'])
    assert 1 <= len(result['questions']) <= 8
