@echo off
echo Starting AI Document Intelligence Frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
call npm run dev
