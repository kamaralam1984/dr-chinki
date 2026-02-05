@echo off
REM Dr. Chinki - Start Script for Windows
REM Starts both Frontend (Vite) and Backend (Flask) servers

echo 🚀 Starting Dr. Chinki AI Medical Tutor...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 20+
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
)

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing backend dependencies...
    python -m pip install Flask==3.0.0 flask-cors==4.0.0
)

REM Start Backend Server
echo 🔧 Starting Backend Server (Flask) on port 5000...
start "Dr. Chinki Backend" cmd /k "python memory_server.py"

REM Wait a bit for backend to start
timeout /t 2 /nobreak >nul

REM Start Frontend Server
echo ⚡ Starting Frontend Server (Vite) on port 3000...
start "Dr. Chinki Frontend" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo 📡 Backend:  http://localhost:5000
echo 🌐 Frontend: http://localhost:3000
echo.
echo Close the command windows to stop the servers
echo.
pause
