#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}薪资系统前端 Docker 启动脚本${NC}"
echo -e "${BLUE}====================================${NC}"

# 检查前端构建产物是否存在
if [ ! -d "../../frontend/v2/dist" ]; then
    echo -e "${YELLOW}前端构建产物不存在，开始构建...${NC}"
    
    # 进入前端项目目录
    cd ../../frontend/v2
    
    # 安装依赖
    echo -e "${BLUE}安装依赖...${NC}"
    npm install
    
    # 构建前端
    echo -e "${BLUE}构建前端...${NC}"
    npm run build
    
    # 返回到Docker目录
    cd ../../docker/frontend
    
    echo -e "${GREEN}前端构建完成${NC}"
else
    echo -e "${GREEN}前端构建产物已存在${NC}"
fi

# 构建并启动容器
echo -e "${BLUE}构建并启动容器...${NC}"
docker-compose up --build -d

echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}服务已启动!${NC}"
echo -e "${YELLOW}前端地址: ${NC}http://localhost"
echo -e "${YELLOW}API地址: ${NC}http://localhost:8080"
echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}提示: 使用 'docker-compose logs -f' 查看日志${NC}" 