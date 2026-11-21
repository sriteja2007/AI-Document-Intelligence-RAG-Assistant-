@echo off
echo Starting AI Document Intelligence Backend...
cd /d "%~dp0backend"
if not exist ".venv\Scripts\activate.bat" (
    echo Virtual environment not found at backend\.venv.
    pause
    exit /b 1
)
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
