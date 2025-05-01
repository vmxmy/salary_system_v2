#!/bin/bash

# Script to start the frontend (React/Vite) and backend (FastAPI/Uvicorn) development servers concurrently.

echo "Starting frontend and backend development servers..."

# --- Load Backend Config from .env --- START ---
ENV_FILE="webapp/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Loading backend configuration from $ENV_FILE..."
  # Use set -a to export all variables defined in the .env file
  set -a 
  source "$ENV_FILE"
  set +a # Disable exporting variables
else
  echo "Warning: $ENV_FILE not found. Using default host/port for backend."
fi

# Set defaults if variables are not defined in .env or .env doesn't exist
UVICORN_HOST=${UVICORN_HOST:-"0.0.0.0"} # Default to 0.0.0.0 if not set
UVICORN_PORT=${UVICORN_PORT:-8080}     # Default to 8080 if not set
# --- Load Backend Config from .env --- END ---

# Check if concurrently is installed globally
if ! npm list -g concurrently --depth=0 | grep concurrently > /dev/null; then
  echo "Warning: 'concurrently' is not installed globally. It's recommended for managing multiple dev servers."
  echo "Attempting to install 'concurrently' globally..."
  npm install -g concurrently
  # Re-check after installation attempt
  if ! npm list -g concurrently --depth=0 | grep concurrently > /dev/null; then
    echo "--------------------------------------------------------------------------"
    echo "Error: Failed to install 'concurrently'. Please install it manually:"
    echo "  npm install -g concurrently"
    echo "Then try running this script again."
    echo ""
    echo "Alternatively, run the frontend and backend in separate terminals:"
    echo "  Terminal 1 (Navigate to salary_system/frontend/salary-viewer): npm run dev"
    echo "  Terminal 2 (Navigate to salary_system): uvicorn webapp.main:app --reload --host $UVICORN_HOST --port $UVICORN_PORT"
    echo "--------------------------------------------------------------------------"
    exit 1
  fi
  echo "'concurrently' installed successfully."
fi

# Define commands
# Ensure you are in the project root when running this script
# If your frontend uses yarn, change 'npm run dev' to 'yarn dev'
FRONTEND_CMD="cd frontend/salary-viewer && npm run dev"
# Use the loaded/defaulted variables for backend command
BACKEND_CMD="uvicorn webapp.main:app --reload --host $UVICORN_HOST --port $UVICORN_PORT"

echo "Starting Backend on: $UVICORN_HOST:$UVICORN_PORT"
echo "Starting Frontend..."

# Run concurrently
# --kill-others attempts to kill other processes if one exits
# --names adds prefixes to the log output (e.g., "[FRONTEND]", "[BACKEND]")
concurrently --kill-others --names "FRONTEND,BACKEND" "$FRONTEND_CMD" "$BACKEND_CMD"

# Check the exit code of concurrently
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "One or both of the servers failed to start or exited unexpectedly (Exit Code: $EXIT_CODE)."
else
  echo "Servers stopped."
fi

exit $EXIT_CODE 