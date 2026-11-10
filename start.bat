@echo off
if not exist "%~dp0web\index.html" (
    echo Could not find web\index.html.
    pause
    exit /b 1
)
start "" "%~dp0web\index.html"
