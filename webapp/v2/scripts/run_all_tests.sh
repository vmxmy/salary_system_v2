#!/bin/bash
# 按顺序运行所有测试：数据库连接 -> 后端服务状态 -> API测试

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 设置默认值
DB_URL=${DATABASE_URL:-"postgresql://postgres:810705@localhost:5432/salary_system_v2"}
BASE_URL=${API_BASE_URL:-"http://localhost:8080"}
USERNAME=${API_USERNAME:-"admin"}
PASSWORD=${API_PASSWORD:-"admin"}
TEST_CATEGORIES=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --db-url)
      DB_URL="$2"
      shift 2
      ;;
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --username)
      USERNAME="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    --categories)
      TEST_CATEGORIES="$2"
      shift 2
      ;;
    --help)
      echo "使用方法: $0 [选项]"
      echo "选项:"
      echo "  --db-url URL       数据库URL (默认: $DB_URL)"
      echo "  --base-url URL     API基础URL (默认: $BASE_URL)"
      echo "  --username USER    API用户名 (默认: $USERNAME)"
      echo "  --password PASS    API密码 (默认: $PASSWORD)"
      echo "  --categories CATS  要测试的API分类，逗号分隔 (默认: 所有分类)"
      echo "  --help             显示此帮助信息"
      exit 0
      ;;
    *)
      echo "未知选项: $1"
      exit 1
      ;;
  esac
done

# 创建日志目录
LOG_DIR="test_logs"
mkdir -p $LOG_DIR

# 获取当前时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/test_log_$TIMESTAMP.txt"

# 输出到控制台和日志文件
exec > >(tee -a $LOG_FILE)
exec 2>&1

echo -e "${CYAN}开始综合测试...${NC}"
echo "时间: $(date)"
echo "数据库URL: $DB_URL"
echo "API基础URL: $BASE_URL"
echo "API用户名: $USERNAME"
echo "API密码: ********"
echo "测试分类: ${TEST_CATEGORIES:-'所有分类'}"
echo "日志文件: $LOG_FILE"
echo ""

# 步骤1: 测试数据库连接
echo -e "${CYAN}=== 步骤1: 测试数据库连接 ===${NC}"
python test_db_connection.py --db-url "$DB_URL"
DB_RESULT=$?

if [ $DB_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ 数据库连接测试通过${NC}"
else
  echo -e "${RED}✗ 数据库连接测试失败${NC}"
  echo -e "${YELLOW}警告: 数据库连接失败，但将继续测试后端服务状态${NC}"
fi

echo ""

# 步骤2: 测试后端服务状态
echo -e "${CYAN}=== 步骤2: 测试后端服务状态 ===${NC}"
python test_server_status.py --base-url "$BASE_URL"
SERVER_RESULT=$?

if [ $SERVER_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ 后端服务状态测试通过${NC}"
else
  echo -e "${RED}✗ 后端服务状态测试失败${NC}"
  echo -e "${YELLOW}警告: 后端服务状态测试失败，无法继续测试API接口${NC}"
  echo -e "${CYAN}综合测试结果:${NC}"
  echo -e "数据库连接: $([ $DB_RESULT -eq 0 ] && echo '${GREEN}通过${NC}' || echo '${RED}失败${NC}')"
  echo -e "后端服务状态: ${RED}失败${NC}"
  echo -e "API测试: ${YELLOW}跳过${NC}"
  exit 1
fi

echo ""

# 步骤3: 测试API接口
echo -e "${CYAN}=== 步骤3: 测试API接口 ===${NC}"

# 构建API测试命令
API_TEST_CMD="python comprehensive_v2_test.py --db-url \"$DB_URL\" --base-url \"$BASE_URL\" --username \"$USERNAME\" --password \"$PASSWORD\""

if [ -n "$TEST_CATEGORIES" ]; then
  API_TEST_CMD="$API_TEST_CMD --categories \"$TEST_CATEGORIES\""
else
  API_TEST_CMD="$API_TEST_CMD --test-all"
fi

# 执行API测试
eval $API_TEST_CMD
API_RESULT=$?

if [ $API_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ API测试通过${NC}"
else
  echo -e "${RED}✗ API测试失败${NC}"
fi

echo ""

# 输出综合测试结果
echo -e "${CYAN}综合测试结果:${NC}"
echo -e "数据库连接: $([ $DB_RESULT -eq 0 ] && echo "${GREEN}通过${NC}" || echo "${RED}失败${NC}")"
echo -e "后端服务状态: $([ $SERVER_RESULT -eq 0 ] && echo "${GREEN}通过${NC}" || echo "${RED}失败${NC}")"
echo -e "API测试: $([ $API_RESULT -eq 0 ] && echo "${GREEN}通过${NC}" || echo "${RED}失败${NC}")"

# 设置退出码
if [ $DB_RESULT -eq 0 ] && [ $SERVER_RESULT -eq 0 ] && [ $API_RESULT -eq 0 ]; then
  echo -e "${GREEN}所有测试通过!${NC}"
  exit 0
else
  echo -e "${RED}部分测试失败!${NC}"
  exit 1
fi
