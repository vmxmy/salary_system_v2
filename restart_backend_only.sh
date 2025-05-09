#!/bin/bash

# 停止当前运行的后端服务
echo "正在停止当前运行的后端服务..."
pkill -f "uvicorn webapp.main:app"

# 等待几秒钟确保服务已停止
sleep 2

# 启动后端服务
echo "正在启动后端服务..."
cd /Users/xumingyang/app/高新区工资信息管理/salary_system
source /opt/miniconda3/etc/profile.d/conda.sh
conda activate lightweight-salary-system
nohup uvicorn webapp.main:app --host 0.0.0.0 --port 8080 --reload > backend.log 2>&1 &

echo "后端服务已重启，日志输出到 backend.log"
echo "等待服务启动..."
sleep 3
echo "查看最新日志:"
tail -n 10 backend.log
