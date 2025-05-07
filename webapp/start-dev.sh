#!/bin/bash

# 激活conda环境
source /opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh
conda activate lightweight-salary-system

# 启动后端服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8080 --log-level debug
