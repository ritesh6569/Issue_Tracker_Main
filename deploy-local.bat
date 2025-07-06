@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo       Issue Tracker Deployment Script
echo ===================================================
echo.

REM 
if not exist backend (
    echo Backend directory not found!
    pause
    exit /b 1
)

echo Setting up backend...
cd backend
call npm install
start "" /b cmd /c "npm run dev > backend.log 2>&1"
cd ..

REM
if not exist frontend (
    echo Frontend directory not found!
    pause
    exit /b 1
)

echo Setting up frontend...
cd frontend
call npm install
start "" /b cmd /c "npm run dev > frontend.log 2>&1"
cd ..

echo.
echo ===================================================
echo       Deployment Complete!
echo ===================================================
echo.
pause
