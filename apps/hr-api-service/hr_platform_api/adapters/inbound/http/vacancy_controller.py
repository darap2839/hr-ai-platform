from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

vacancies_router = APIRouter(prefix="/vacancies", tags=["Vacancies"])


@vacancies_router.post("/upload")
def upload_vacancy(file: UploadFile = File(...)):
    # Мы просто принимаем файл и СРАЗУ отдаем ответ
    print(f"DEBUG: Получен файл {file.filename}")

    return {
        "status": "success",
        "message": f"Файл {file.filename} успешно получен бэкендом!",
        "structured": {
            "role": "Тестовая вакансия",
            "skills": ["Python", "React"]
        }
    }


@vacancies_router.get("")
def get_vacancy_list():
    return {"vacancies": []}