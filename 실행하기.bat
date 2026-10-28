@echo off
chcp 65001 > nul
title ABO Partner App
cd /d "%~dp0"

echo ===================================================
echo   🌿 ABO Partner Platform (sFuNe) 앱을 실행합니다...
echo ===================================================

:: 로컬 웹서버(PWA 및 오프라인/설치 기능 활성화) 백그라운드 구동
start /b "" python -m http.server 8080 > nul 2>&1
timeout /t 1 /nobreak > nul

:: Chrome 전용 모바일 앱 창(430x920)으로 실행
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:8080/index.html" --user-data-dir="%LOCALAPPDATA%\ABOPartnerProfile" --window-size=430,920
) else (
    start "" http://localhost:8080/index.html
)
