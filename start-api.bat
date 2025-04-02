@echo off
echo Starting API server and frontend...

rem Start the backend API server
start cmd /k "cd backend && npm start"

rem Wait for a few seconds to let the API server initialize
timeout /t 3

rem Start the frontend development server
start cmd /k "npm start"

echo Both servers are starting up. Wait for them to initialize...
echo API server will be running at http://localhost:5000
echo Frontend will be running at http://localhost:3000 