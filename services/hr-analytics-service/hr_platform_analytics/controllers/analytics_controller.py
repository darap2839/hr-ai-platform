from fastapi import APIRouter, UploadFile, File
from hr_platform_analytics.services.analytics_service import AnalyticsService

router = APIRouter()


@router.post("/upload_vacancy")
async def upload_vacancy(file: UploadFile = File(...)):
    return await AnalyticsService.process_vacancy(file)
