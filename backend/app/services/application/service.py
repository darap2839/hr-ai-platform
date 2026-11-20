"""Application Service - Business logic for applications"""
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import ApplicationModel, ApplicationStage as ModelApplicationStage
from app.schemas import Application, ApplicationCreate, StageUpdate
from app.services.application.validation import ApplicationValidator
from app.repositories.application_repository import (
    list_applications, get_application_or_404, create_application,
    save_ai_analysis, update_stage, get_candidate_from_repository, get_vacancy_from_repository
)
from app.services.ai.analyzer import AIAnalyzer
from app.services.candidate.service import CandidateService
from app.services.vacancy.service import VacancyService
from app.services.notification.service import notification_service
from app.schemas import NotificationType


class ApplicationService:
    """Сервис для работы с откликами"""
    
    @staticmethod
    def _to_schema(application: ApplicationModel) -> Application:
        """Decode persisted JSON analysis before validating the API response."""
        analysis = application.ai_analysis
        if isinstance(analysis, str):
            analysis = json.loads(analysis)
        return Application.model_validate({
            'id': application.id,
            'candidate_id': application.candidate_id,
            'vacancy_id': application.vacancy_id,
            'stage': application.stage,
            'ai_analysis': analysis,
        })

    @staticmethod
    def list_applications(db: Session) -> list[Application]:
        """Получить все отклики"""
        applications = list_applications(db)
        return [ApplicationService._to_schema(a) for a in applications]
    
    @staticmethod
    def create_application(db: Session, payload: ApplicationCreate) -> Application:
        """Создать отклик"""
        ApplicationValidator.validate_create(payload)
        
        candidate = get_candidate_from_repository(db, payload.candidate_id)
        vacancy = get_vacancy_from_repository(db, payload.vacancy_id)
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Кандидат не найден")
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        application = create_application(db, payload.candidate_id, payload.vacancy_id)
        
        notification_service.create_notification(
            notification_type=NotificationType.APPLICATION_NEW,
            title="Новый отклик",
            message=f'Кандидат откликнулся на вакансию',
            entity_type="application",
            entity_id=application.id
        )
        
        return ApplicationService._to_schema(application)
    
    @staticmethod
    def analyze_application(db: Session, application_id: int) -> Application:
        """Провести AI анализ отклика"""
        application = get_application_or_404(db, application_id)
        
        candidate_data = CandidateService.get_candidate(db, application.candidate_id).model_dump()
        vacancy_data = VacancyService.get_vacancy(db, application.vacancy_id).model_dump()
        
        analysis = AIAnalyzer.analyze_candidate(candidate_data, vacancy_data)
        updated = save_ai_analysis(db, application, json.dumps(analysis, ensure_ascii=False))
        
        notification_service.create_notification(
            notification_type=NotificationType.AI_ANALYSIS_READY,
            title="AI анализ готов",
            message=f'AI анализ отклика #{application.id} завершён (совпадение: {analysis["score"]}%)',
            entity_type="application",
            entity_id=application.id
        )
        
        return ApplicationService._to_schema(updated)
    
    @staticmethod
    def get_interview_questions(db: Session, application_id: int) -> dict:
        """Получить вопросы для интервью"""
        application = get_application_or_404(db, application_id)
        
        candidate_data = CandidateService.get_candidate(db, application.candidate_id).model_dump()
        vacancy_data = VacancyService.get_vacancy(db, application.vacancy_id).model_dump()
        
        return AIAnalyzer.generate_interview_questions(candidate_data, vacancy_data)
    
    @staticmethod
    def update_application_stage(db: Session, application_id: int, payload: StageUpdate) -> Application:
        """Обновить стадию отклика"""
        application = get_application_or_404(db, application_id)
        updated = update_stage(db, application, ModelApplicationStage(payload.stage))
        
        if payload.stage != application.stage:
            notification_service.create_notification(
                notification_type=NotificationType.APPLICATION_STAGE_CHANGED,
                title="Изменена стадия отклика",
                message=f'Отклик #{application_id} переведён на стадию "{payload.stage}"',
                entity_type="application",
                entity_id=application_id
            )
        
        return ApplicationService._to_schema(updated)
