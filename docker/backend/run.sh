#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}薪资系统后端 Docker 启动脚本${NC}"
echo -e "${BLUE}====================================${NC}"

# 检查是否存在.env文件，如果不存在则从示例创建
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}未找到.env文件，从env.example创建...${NC}"
    cp env.example .env
    echo -e "${GREEN}已创建.env文件，请根据需要修改配置${NC}"
fi

# 构建并启动容器
echo -e "${BLUE}构建并启动容器...${NC}"
docker-compose up --build -d

echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}后端服务已启动!${NC}"
echo -e "${YELLOW}API地址: ${NC}http://localhost:8080"
echo -e "${YELLOW}API文档: ${NC}http://localhost:8080/docs"
echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}提示: 使用 'docker-compose logs -f' 查看日志${NC}" 