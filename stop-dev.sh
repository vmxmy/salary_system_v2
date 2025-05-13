#!/bin/bash

echo "Attempting to stop development servers..."

# Kill concurrently process first, as it might be managing the others
echo "Stopping concurrently..."
pkill -f "concurrently --kill-others --names"

# Give it a moment
sleep 1

# Kill frontend (Vite/npm run dev)
# Look for processes related to the frontend directory and npm run dev
echo "Stopping frontend (npm run dev)..."
pkill -f "npm run dev" # General npm dev scripts
pkill -f "vite"       # Specifically for Vite

# Kill backend (Uvicorn/FastAPI)
echo "Stopping backend (uvicorn)..."
pkill -f "uvicorn webapp.main:app"

# Kill temporary zsh backend runner scripts if they are somehow still running
echo "Stopping temporary backend runner scripts (if any)..."
pkill -f "temp_run_backend_clean.sh"
pkill -f "temp_run_backend.sh" # In case the non-clean version was also used

# Check for processes listening on common ports as a fallback
# Frontend common ports: 5173 (Vite default), 3000 (Create React App default)
# Backend common port: 8080 (from start-dev-clean.sh), 8000 (common FastAPI/Uvicorn)
PORTS_TO_CHECK=("5173" "3000" "8080" "8000")
echo "Checking for processes on common ports: ${PORTS_TO_CHECK[*]}..."
for port in "${PORTS_TO_CHECK[@]}"; do
  # Using lsof for macOS/Linux. For Windows, this would need netstat and taskkill.
  # The -t flag gives PIDs only, -i TCP:$port finds processes listening on that TCP port.
  PIDS=$(lsof -t -i TCP:$port)
  if [ -n "$PIDS" ]; then
    echo "Found processes on port $port: $PIDS. Attempting to kill..."
    kill -9 $PIDS 2>/dev/null
  else
    echo "No processes found on port $port."
  fi
done

echo "Cleanup attempt finished."
echo "Please verify that the processes have been stopped and ports are free."
echo "You might need to run this script with sudo if you encounter permission issues, or manually kill processes using 'kill -9 <PID>'."