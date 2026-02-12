from fastapi import Fast
from fastapi.middleware.cors import CORSMiddleware

from .adapters.inbound.http.auth_controller import auth_router
from .adapters.inbound.http.vacancy_controller import vacancies_router
from .adapters.inbound.http.resume_controller import resumes_router
from .adapters.inbound.http.assignment_controller import assignments_router

app = FastAPI(title="HR Api Service",
              description="API для управления вакансиями и заявками",
              version="1.0.0",
              docs_url="/docs",
              redoc_url="/redoc",
              openapi_url="/openapi.json"
              )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(vacancies_router)
app.include_router(resumes_router)
