#!/bin/bash

# Script to start the frontend (React/Vite) and backend (FastAPI/Uvicorn) development servers concurrently.

echo "Starting frontend and backend development servers..."

# 创建一个临时脚本来使用zsh激活conda环境并运行后端
if [ -f ".env" ]; then
  source .env
  if [ -n "$CONDA_ENV" ]; then
    echo "Creating temporary script to activate Conda environment with zsh: $CONDA_ENV"

    # 创建临时脚本
    cat > temp_run_backend.sh << 'EOL'
#!/usr/bin/env zsh
# 获取conda环境名称
CONDA_ENV=$1
HOST=$2
PORT=$3

# 激活conda环境
source ~/.zshrc
conda activate $CONDA_ENV

# 提示用户确认是否运行初始化脚本
echo "是否要运行数据库初始化脚本？这将检查数据库状态，如果需要，将创建表和管理员账户。"
read -p "运行初始化脚本？(y/n): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
  echo "Running database initialization with conda env: $CONDA_ENV"
  python -c "from webapp.scripts.init_app import initialize_database; initialize_database()" || echo "Database initialization failed, but continuing..."
else
  echo "跳过数据库初始化..."
fi

# 运行后端
echo "Running backend with conda env: $CONDA_ENV"
uvicorn webapp.main:app --reload --host $HOST --port $PORT --log-level debug > ../backend.log 2>&1
EOL

    # 使脚本可执行
    chmod +x temp_run_backend.sh

    # 设置后端命令为使用zsh运行临时脚本
    export USE_ZSH_CONDA=true
  fi
fi

# --- Load Config from .env --- START ---
ROOT_ENV_FILE=".env"
WEBAPP_ENV_FILE="webapp/.env"

# 首先尝试加载根目录的.env文件
if [ -f "$ROOT_ENV_FILE" ]; then
  echo "Loading configuration from $ROOT_ENV_FILE..."
  # Use set -a to export all variables defined in the .env file
  set -a
  source "$ROOT_ENV_FILE"
  set +a # Disable exporting variables
elif [ -f "$WEBAPP_ENV_FILE" ]; then
  # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
  echo "Loading backend configuration from $WEBAPP_ENV_FILE..."
  set -a
  source "$WEBAPP_ENV_FILE"
  set +a
else
  echo "Warning: Neither $ROOT_ENV_FILE nor $WEBAPP_ENV_FILE found. Using default host/port for backend."
fi

# Set defaults if variables are not defined in .env or .env doesn't exist
UVICORN_HOST=${UVICORN_HOST:-"0.0.0.0"} # Default to 0.0.0.0 if not set
UVICORN_PORT=${UVICORN_PORT:-8080}     # Default to 8080 if not set
# --- Load Config from .env --- END ---

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
FRONTEND_CMD="cd frontend/salary-viewer && npm run dev > ../../frontend.log 2>&1"

# 根据是否使用zsh来选择后端启动命令
if [ "$USE_ZSH_CONDA" = true ]; then
  # 使用临时脚本启动后端
  BACKEND_CMD="./temp_run_backend.sh $CONDA_ENV $UVICORN_HOST $UVICORN_PORT"
  echo "Starting Backend with zsh and conda env $CONDA_ENV on: $UVICORN_HOST:$UVICORN_PORT (with debug logging)"
else
  # 提示用户确认是否运行初始化脚本
  echo "是否要运行数据库初始化脚本？这将检查数据库状态，如果需要，将创建表和管理员账户。"
  read -p "运行初始化脚本？(y/n): " confirm
  if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "Running database initialization..."
    python -c "from webapp.scripts.init_app import initialize_database; initialize_database()" || echo "Database initialization failed, but continuing..."
  else
    echo "跳过数据库初始化..."
  fi

  # 使用默认命令启动后端
  BACKEND_CMD="uvicorn webapp.main:app --reload --host $UVICORN_HOST --port $UVICORN_PORT --log-level debug > backend.log 2>&1"
  echo "Starting Backend on: $UVICORN_HOST:$UVICORN_PORT (with debug logging, output to backend.log)"
fi

echo "Starting Frontend (output to frontend.log)..."

# Run concurrently
# --kill-others attempts to kill other processes if one exits
# --names adds prefixes to the log output (e.g., "[FRONTEND]", "[BACKEND]")
concurrently --kill-others --names "FRONTEND,BACKEND" "$FRONTEND_CMD" "$BACKEND_CMD" &
CONCURRENTLY_PID=$!

# 等待一段时间，让服务器启动
echo "Waiting for servers to start..."
sleep 5

# 开始 tail 后端日志
echo "Starting to tail backend logs (Press Ctrl+C to stop)..."
if [ "$USE_ZSH_CONDA" = true ]; then
  # 如果使用 zsh 和 conda，日志在项目根目录的上一级
  tail -f ../backend.log &
else
  # 默认情况下，日志在项目根目录
  tail -f backend.log &
fi
TAIL_PID=$!

# 等待 concurrently 进程结束
wait $CONCURRENTLY_PID
EXIT_CODE=$?

# 杀死 tail 进程
kill $TAIL_PID 2>/dev/null

if [ $EXIT_CODE -ne 0 ]; then
  echo "One or both of the servers failed to start or exited unexpectedly (Exit Code: $EXIT_CODE)."
else
  echo "Servers stopped."
fi

exit $EXIT_CODE