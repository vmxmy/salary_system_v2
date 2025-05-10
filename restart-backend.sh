#!/bin/bash
# 重启后端服务器脚本

echo "正在重启后端服务器..."

# 检查是否有运行中的后端服务器进程
BACKEND_PID=$(pgrep -f "uvicorn webapp.main:app")

if [ ! -z "$BACKEND_PID" ]; then
    echo "发现运行中的后端服务器进程 (PID: $BACKEND_PID)，正在停止..."
    kill $BACKEND_PID
    sleep 2
    
    # 检查进程是否已停止
    if ps -p $BACKEND_PID > /dev/null; then
        echo "进程未能正常停止，强制终止..."
        kill -9 $BACKEND_PID
        sleep 1
    fi
    
    echo "后端服务器已停止"
fi

# 启动后端服务器
echo "正在启动后端服务器..."
cd "$(dirname "$0")"
source ./start-dev.sh

echo "后端服务器已重启"
