#!/usr/bin/env zsh
# 获取conda环境名称
CONDA_ENV=$1
HOST=$2
PORT=$3

# 激活conda环境
source ~/.zshrc
conda activate $CONDA_ENV

# 运行后端 (CLEAN MODE: no --reload, add --workers 1)
echo "Running backend with conda env: $CONDA_ENV (CLEAN MODE)"
uvicorn webapp.main:app --host $HOST --port $PORT --workers 1 --log-level debug > ../backend-clean.log 2>&1
