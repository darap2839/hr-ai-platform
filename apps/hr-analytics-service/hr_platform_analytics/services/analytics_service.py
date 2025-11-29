import os
from hr_platform_analytics.utils.pdf_utils import extract_text_from_file
from hr_platform_analytics.repositories.nlp_repository import NLPRepository
from fastapi import UploadFile


class AnalyticsService:
    UPLOAD_DIR = "uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    @staticmethod
    async def save_upload_file(upload_file: UploadFile, destination: str):
        content = await upload_file.read()
        with open(destination, "wb") as buffer:
            buffer.write(content)

    @staticmethod
    async def process_vacancy(file: UploadFile):
        file_path = os.path.join(AnalyticsService.UPLOAD_DIR, file.filename)
        await AnalyticsService.save_upload_file(file, file_path)
        text = extract_text_from_file(file_path)
        structured = await NLPRepository.analyze_text(text)
        return {"status": "success", "structured": structured}
