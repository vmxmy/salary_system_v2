#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== 停止高新区工资信息管理系统服务 =====${NC}"

# 项目根目录
PROJECT_ROOT=$(pwd)

# 停止后端服务
if [ -f "backend.pid" ]; then
    echo -e "${YELLOW}正在停止后端服务...${NC}"
    pid=$(cat backend.pid)
    if ps -p $pid > /dev/null; then
        kill -9 $pid
        echo -e "${GREEN}后端服务已停止 (PID: $pid)${NC}"
    else
        echo -e "${RED}后端服务进程 (PID: $pid) 不存在或已停止${NC}"
    fi
    rm backend.pid
else
    echo -e "${YELLOW}查找uvicorn进程...${NC}"
    uvicorn_pid=$(ps aux | grep "[u]vicorn webapp.main" | awk '{print $2}')
    if [ -n "$uvicorn_pid" ]; then
        echo -e "${YELLOW}找到uvicorn进程，正在停止 (PID: $uvicorn_pid)...${NC}"
        kill -9 $uvicorn_pid
        echo -e "${GREEN}后端服务已停止${NC}"
    else
        echo -e "${RED}未找到正在运行的后端服务${NC}"
    fi
fi

# 停止前端服务
if [ -f "frontend.pid" ]; then
    echo -e "${YELLOW}正在停止前端服务...${NC}"
    pid=$(cat frontend.pid)
    if ps -p $pid > /dev/null; then
        kill -9 $pid
        echo -e "${GREEN}前端服务已停止 (PID: $pid)${NC}"
    else
        echo -e "${RED}前端服务进程 (PID: $pid) 不存在或已停止${NC}"
    fi
    rm frontend.pid
else
    echo -e "${YELLOW}查找前端服务进程...${NC}"
    # 查找前端服务进程（vite开发服务器）
    frontend_pid=$(ps aux | grep "[v]ite" | grep "frontend/v2" | awk '{print $2}')
    if [ -n "$frontend_pid" ]; then
        echo -e "${YELLOW}找到前端服务进程，正在停止 (PID: $frontend_pid)...${NC}"
        kill -9 $frontend_pid
        echo -e "${GREEN}前端服务已停止${NC}"
    else
        echo -e "${RED}未找到正在运行的前端服务${NC}"
    fi
fi

# 检查是否还有残留的服务
echo -e "${YELLOW}检查是否有残留的服务...${NC}"
uvicorn_proc=$(ps aux | grep "[u]vicorn webapp.main" | awk '{print $2}')
vite_proc=$(ps aux | grep "[v]ite" | grep "frontend/v2" | awk '{print $2}')

if [ -n "$uvicorn_proc" ] || [ -n "$vite_proc" ]; then
    echo -e "${RED}发现残留进程:${NC}"
    [ -n "$uvicorn_proc" ] && echo -e "后端: $uvicorn_proc"
    [ -n "$vite_proc" ] && echo -e "前端: $vite_proc"
    
    read -p "是否要终止这些进程? (y/n): " kill_remaining
    if [ "$kill_remaining" = "y" ]; then
        [ -n "$uvicorn_proc" ] && kill -9 $uvicorn_proc
        [ -n "$vite_proc" ] && kill -9 $vite_proc
        echo -e "${GREEN}所有残留进程已终止${NC}"
    else
        echo -e "${YELLOW}残留进程未终止${NC}"
    fi
else
    echo -e "${GREEN}没有发现残留服务进程${NC}"
fi

echo -e "${GREEN}===== 服务停止完成 =====${NC}" 