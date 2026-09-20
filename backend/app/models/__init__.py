"""All database models"""
from app.models.db_models import (
    VacancyModel,
    CandidateModel,
    ApplicationModel,
    UserModel,
    VacancyStatus,
    ApplicationStage,
    CandidateStatus,
    DocumentModel,
    DocumentVersionModel,
    OrganizationUnitModel,
    OrganizationEmployeeModel,
)

__all__ = [
    "VacancyModel",
    "CandidateModel",
    "ApplicationModel",
    "UserModel",
    "VacancyStatus",
    "ApplicationStage",
    "CandidateStatus",
    "DocumentModel",
    "DocumentVersionModel",
    "OrganizationUnitModel",
    "OrganizationEmployeeModel",
]
