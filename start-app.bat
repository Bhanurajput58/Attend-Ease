@echo off
echo Starting Attend-Ease Application...
echo.
echo Starting Backend Server...
start cmd /k "cd backend && npm run dev"
echo.
echo Starting Frontend Server...
start cmd /k "npm start"
echo.
echo Both servers are starting in separate windows.
echo Press any key to exit this window...
pause > nul 