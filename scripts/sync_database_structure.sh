#!/bin/bash

# ===========================================
# 数据库结构同步脚本
# Database Structure Sync Script
# ===========================================

set -e  # 出错时退出

# 配置变量
SOURCE_DB_HOST="pg.debian.ziikoo.com"
SOURCE_DB_PORT="25432"
SOURCE_DB_USER="postgres"
SOURCE_DB_NAME="salary_system_v2"

TARGET_DB_HOST="$1"
TARGET_DB_PORT="${2:-5432}"
TARGET_DB_USER="${3:-postgres}"
TARGET_DB_NAME="${4:-salary_system_v2}"

if [ -z "$TARGET_DB_HOST" ]; then
    echo "用法: $0 <目标服务器IP> [端口] [用户名] [数据库名]"
    echo "示例: $0 10.31.59.108 5432 postgres salary_system_v2"
    exit 1
fi

echo "🚀 开始同步数据库结构..."
echo "源数据库: $SOURCE_DB_HOST:$SOURCE_DB_PORT/$SOURCE_DB_NAME"
echo "目标数据库: $TARGET_DB_HOST:$TARGET_DB_PORT/$TARGET_DB_NAME"

# 1. 导出源数据库结构
echo "📋 步骤1: 导出源数据库结构..."
pg_dump -h $SOURCE_DB_HOST -p $SOURCE_DB_PORT -U $SOURCE_DB_USER -d $SOURCE_DB_NAME \
    --schema-only --no-owner --no-privileges \
    -f /tmp/salary_system_structure.sql

echo "✅ 结构导出完成"

# 2. 创建目标数据库（如果不存在）
echo "📋 步骤2: 准备目标数据库..."
createdb -h $TARGET_DB_HOST -p $TARGET_DB_PORT -U $TARGET_DB_USER $TARGET_DB_NAME 2>/dev/null || true

# 3. 导入结构到目标数据库
echo "📋 步骤3: 导入结构到目标数据库..."
psql -h $TARGET_DB_HOST -p $TARGET_DB_PORT -U $TARGET_DB_USER -d $TARGET_DB_NAME \
    -f /tmp/salary_system_structure.sql

# 4. 运行 Alembic 迁移
echo "📋 步骤4: 运行 Alembic 迁移..."
cd webapp/v2/alembic_for_db_v2

# 更新环境变量
export DATABASE_URL="postgresql+psycopg2://$TARGET_DB_USER:password@$TARGET_DB_HOST:$TARGET_DB_PORT/$TARGET_DB_NAME"

# 标记所有迁移为已应用（因为我们已经导入了完整结构）
alembic stamp head

echo "📋 步骤5: 创建视图..."
# 执行视图创建脚本
psql -h $TARGET_DB_HOST -p $TARGET_DB_PORT -U $TARGET_DB_USER -d $TARGET_DB_NAME \
    -f ../../../webapp/reports/v_monthly_report.sql

# 5. 验证同步结果
echo "📋 步骤6: 验证同步结果..."
echo "检查表数量:"
psql -h $TARGET_DB_HOST -p $TARGET_DB_PORT -U $TARGET_DB_USER -d $TARGET_DB_NAME \
    -c "SELECT schemaname, COUNT(*) as table_count FROM pg_tables WHERE schemaname IN ('hr', 'payroll', 'config', 'security', 'reports') GROUP BY schemaname;"

echo "检查视图数量:"
psql -h $TARGET_DB_HOST -p $TARGET_DB_PORT -U $TARGET_DB_USER -d $TARGET_DB_NAME \
    -c "SELECT schemaname, COUNT(*) as view_count FROM pg_views WHERE schemaname = 'reports' GROUP BY schemaname;"

# 清理临时文件
rm -f /tmp/salary_system_structure.sql

echo "🎉 数据库结构同步完成！"
echo ""
echo "📝 下一步:"
echo "1. 更新目标服务器的 webapp/.env 文件"
echo "2. 启动后端服务测试连接"
echo "3. 验证所有功能是否正常" 