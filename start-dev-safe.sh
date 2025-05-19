#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== 高新区工资信息管理系统启动脚本 =====${NC}"

# 检查8080端口占用情况
echo -e "${YELLOW}检查端口占用情况...${NC}"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}警告: 8080端口已被占用!${NC}"
    echo -e "正在显示占用进程:"
    lsof -i :8080 | grep LISTEN
    
    read -p "是否要终止占用8080端口的进程? (y/n): " kill_process
    if [ "$kill_process" = "y" ]; then
        pid=$(lsof -Pi :8080 -sTCP:LISTEN -t)
        echo -e "${YELLOW}终止进程 PID: $pid${NC}"
        kill -9 $pid
        echo -e "${GREEN}进程已终止${NC}"
    else
        echo -e "${RED}请手动释放8080端口后再运行此脚本${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}8080端口未被占用，可以继续${NC}"
fi

# 项目根目录
PROJECT_ROOT=$(pwd)

# 检查conda环境
CONDA_ENV=${CONDA_ENV:-"lightweight-salary-system"}
echo -e "${YELLOW}检查是否需要激活conda环境: $CONDA_ENV${NC}"
read -p "是否需要激活conda环境 '$CONDA_ENV'? (y/n): " use_conda
if [ "$use_conda" = "y" ]; then
    echo -e "${YELLOW}尝试激活conda环境...${NC}"
    if command -v conda >/dev/null 2>&1; then
        eval "$(conda shell.bash hook)"
        conda activate $CONDA_ENV
        conda_status=$?
        if [ $conda_status -ne 0 ]; then
            echo -e "${RED}激活conda环境失败，将直接使用系统Python${NC}"
        else
            echo -e "${GREEN}成功激活conda环境: $CONDA_ENV${NC}"
        fi
    else
        echo -e "${RED}未找到conda命令，将直接使用系统Python${NC}"
    fi
fi

# 启动后端服务
echo -e "${YELLOW}直接启动后端服务...${NC}"

# 前台启动（方便查看日志和调试）
echo -e "${YELLOW}是否要在前台启动后端服务（可以直接查看日志）？${NC}"
read -p "前台启动后端? (y/n): " foreground
if [ "$foreground" = "y" ]; then
    echo -e "${GREEN}在前台启动后端服务...${NC}"
    echo -e "${RED}注意: 前台启动后，请另开一个终端窗口运行前端服务${NC}"
    echo -e "${YELLOW}按 Ctrl+C 可以停止服务${NC}"
    cd "$PROJECT_ROOT"
    uvicorn webapp.main:app --host 0.0.0.0 --port 8080 --reload
    exit 0
fi

# 后台启动
echo -e "${YELLOW}在后台启动后端服务...${NC}"
cd "$PROJECT_ROOT"
if [ -f "backend.log" ]; then
    mv backend.log backend.log.old
fi
uvicorn webapp.main:app --host 0.0.0.0 --port 8080 --reload > backend.log 2>&1 &
backend_pid=$!
echo $backend_pid > backend.pid
echo -e "${GREEN}后端服务已在后台启动，PID: $backend_pid${NC}"
echo -e "${YELLOW}可以通过 'tail -f backend.log' 查看日志${NC}"

# 等待后端服务启动
echo -e "${YELLOW}等待后端服务启动 (5秒)...${NC}"
sleep 5

# 检查后端服务是否成功启动
if ps -p $backend_pid > /dev/null; then
    echo -e "${GREEN}后端服务启动成功 (PID: $backend_pid)${NC}"
else
    echo -e "${RED}后端服务启动失败！${NC}"
    echo -e "${YELLOW}查看backend.log获取详细错误信息${NC}"
    tail -n 20 backend.log
    exit 1
fi

# 启动前端服务
echo -e "${YELLOW}启动前端服务...${NC}"
cd "$PROJECT_ROOT/frontend/v2"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未找到node_modules，正在安装依赖...${NC}"
    npm install
fi

# 在新窗口或后台启动前端
echo -e "${YELLOW}是否要在新窗口启动前端服务？${NC}"
read -p "使用新窗口? (y/n): " new_window
if [ "$new_window" = "y" ]; then
    # 尝试使用各种终端
    if [ "$(uname)" = "Darwin" ]; then
        echo -e "${YELLOW}尝试使用macOS终端...${NC}"
        osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/frontend/v2"' && npm run dev"'
    elif command -v gnome-terminal >/dev/null 2>&1; then
        echo -e "${YELLOW}尝试使用gnome-terminal...${NC}"
        gnome-terminal -- bash -c "cd $PROJECT_ROOT/frontend/v2 && npm run dev; exec bash"
    elif command -v xterm >/dev/null 2>&1; then
        echo -e "${YELLOW}尝试使用xterm...${NC}"
        xterm -e "cd $PROJECT_ROOT/frontend/v2 && npm run dev; exec bash"
    else
        # 如果无法启动新窗口，则在后台启动
        echo -e "${RED}无法启动新终端窗口，将在后台启动前端服务${NC}"
        new_window="n"
    fi
fi

# 如果不使用新窗口或无法启动新窗口，则在后台启动
if [ "$new_window" != "y" ]; then
    echo -e "${YELLOW}在后台启动前端服务...${NC}"
    cd "$PROJECT_ROOT/frontend/v2"
    if [ -f "../../frontend.log" ]; then
        mv ../../frontend.log ../../frontend.log.old
    fi
    npm run dev > ../../frontend.log 2>&1 &
    frontend_pid=$!
    echo $frontend_pid > ../../frontend.pid
    echo -e "${GREEN}前端服务已在后台启动，PID: $frontend_pid${NC}"
    echo -e "${YELLOW}可以通过 'tail -f frontend.log' 查看日志${NC}"
fi

# 返回项目根目录
cd "$PROJECT_ROOT"
echo -e "${GREEN}===== 服务启动完成 =====${NC}"
echo -e "${GREEN}前端: http://localhost:5173${NC}"
echo -e "${GREEN}后端: http://localhost:8080${NC}"
echo -e "${GREEN}后端API: http://localhost:8080/v2/auth/token${NC}"
echo -e "${YELLOW}可以通过 'cat backend.pid' 和 'cat frontend.pid' 查看服务PID${NC}"
echo -e "${YELLOW}可以通过 './stop-dev-safe.sh' 停止所有服务${NC}" 