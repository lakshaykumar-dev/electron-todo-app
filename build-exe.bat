@echo off
title TaskFlow - Build Windows Executable (.exe)
setlocal enabledelayedexpansion

echo ============================================================
echo   TaskFlow Project Manager - Build Executable (.exe)
echo ============================================================
echo.

:: Navigate to the directory where this script is located
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js from https://nodejs.org/ to proceed.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, install dependencies if missing
if not exist "node_modules\" (
    echo [1/2] Missing dependencies detected. Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Project dependencies verified.
)

echo.
echo [2/2] Packaging latest source code into Windows Executable...
echo.

call npm run package:win

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Packaging failed! Please review the error message above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo ============================================================
echo.
echo Executable generated at:
echo "%~dp0dist\TaskFlow-win32-x64\TaskFlow.exe"
echo.
echo Opening output folder in File Explorer...
start "" explorer "%~dp0dist\TaskFlow-win32-x64"
echo.
pause
