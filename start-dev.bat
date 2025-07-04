@echo off
echo Starting OTTR Development Environment...
echo.

echo Starting Server...
start "OTTR Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Mobile App...
start "OTTR Mobile" cmd /k "cd /d %~dp0mobile && npm start"

echo.
echo Both server and mobile app are starting...
echo Server will be available at: http://localhost:3000
echo Mobile app will open Expo DevTools
echo.
pause