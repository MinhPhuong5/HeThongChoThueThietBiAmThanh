@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
    if errorlevel 1 goto failed
)
".venv\Scripts\python.exe" -c "import argon2, dotenv, fastapi, psycopg, uvicorn" >nul 2>&1
if errorlevel 1 (
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 goto failed
)
".venv\Scripts\python.exe" -m scripts.start_local
if errorlevel 1 goto failed
exit /b 0

:failed
echo EchoRent could not start. Review the message above.
pause
exit /b 1
