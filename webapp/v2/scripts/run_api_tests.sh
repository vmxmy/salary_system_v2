#!/bin/bash
# 运行API测试并生成报告

# 设置环境变量
export API_BASE_URL=${API_BASE_URL:-"http://localhost:8080"}
export API_USERNAME=${API_USERNAME:-"admin"}
export API_PASSWORD=${API_PASSWORD:-"admin"}

# 创建报告目录
REPORT_DIR="api_test_reports"
mkdir -p $REPORT_DIR

# 获取当前时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/api_test_report_$TIMESTAMP.json"

echo "开始API测试..."
echo "基础URL: $API_BASE_URL"
echo "用户名: $API_USERNAME"
echo "报告文件: $REPORT_FILE"

# 运行测试
python api_tester.py --test-all --report $REPORT_FILE

# 检查测试结果
if [ $? -eq 0 ]; then
    echo "测试完成，报告已保存到: $REPORT_FILE"
else
    echo "测试失败，请检查错误信息"
fi
