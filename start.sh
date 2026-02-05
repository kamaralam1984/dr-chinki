#!/bin/bash

# Dr. Chinki - Start Script
# Starts both Frontend (Vite) and Backend (Flask) servers

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${CYAN}🚀 Starting Dr. Chinki AI Medical Tutor...${NC}\n"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    python3 -m pip install --user Flask==3.0.0 flask-cors==4.0.0
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# Start Backend Server
echo -e "${CYAN}🔧 Starting Backend Server (Flask) on port 5000...${NC}"
python3 memory_server.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend server failed to start${NC}"
    exit 1
fi

# Start Frontend Server
echo -e "${GREEN}⚡ Starting Frontend Server (Vite) on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 2

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "\n${GREEN}✅ Both servers are running!${NC}\n"
echo -e "${CYAN}📡 Backend:  http://localhost:5000${NC}"
echo -e "${CYAN}🌐 Frontend: http://localhost:3000${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
