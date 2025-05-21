#!/bin/bash

# 切换到项目根目录
cd "$(dirname "$0")" || exit 1

echo "开始添加缺失的职位信息..."

# 运行Python脚本
python webapp/v2/scripts/add_missing_positions.py

echo "添加职位完成。" 