#!/usr/bin/env zsh
# 获取conda环境名称
CONDA_ENV=$1
HOST=$2
PORT=$3

# 激活conda环境
source ~/.zshrc
conda activate $CONDA_ENV

# 运行后端
echo "Running backend with conda env: $CONDA_ENV"
uvicorn webapp.main:app --reload --host $HOST --port $PORT --log-level debug > ../backend.log 2>&1
