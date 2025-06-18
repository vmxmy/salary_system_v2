#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}停止薪资系统后端服务...${NC}"
echo -e "${BLUE}====================================${NC}"

# 停止并移除容器
docker-compose down

echo -e "${GREEN}后端服务已停止${NC}" 