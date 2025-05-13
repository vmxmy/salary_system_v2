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
