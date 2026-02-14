@echo off
echo Освобождение порта 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /pid %%a /f
)
echo Запуск сервера...
uvicorn hr_platform_api.main:app --host 0.0.0.0 --port 8000 --reload