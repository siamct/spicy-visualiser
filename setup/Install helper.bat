@echo off
title Spicy Visualiser helper
cd /d "%~dp0"
if not exist "%~dp0setup.ps1" (
  echo.
  echo   Please extract the zip first: right-click it, Extract All, then open
  echo   "Install helper.bat" from the extracted folder.
  echo.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
