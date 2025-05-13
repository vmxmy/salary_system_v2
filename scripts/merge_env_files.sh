#!/bin/bash
# 环境变量文件整合脚本
# 此脚本将现有的环境变量文件整合到一个统一的.env文件中

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 输出带颜色的消息
echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否存在.env文件
if [ -f ".env" ]; then
    echo_warn "已存在.env文件。是否要备份并创建新文件？(y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        backup_file=".env.backup.$(date +%Y%m%d%H%M%S)"
        cp .env "$backup_file"
        echo_info "已将现有.env文件备份为 $backup_file"
    else
        echo_info "操作已取消。"
        exit 0
    fi
fi

# 创建新的.env文件
echo_info "创建新的.env文件..."
cp .env.template .env
echo_info "已从模板创建新的.env文件"

# 从现有文件中提取值
extract_env_values() {
    local file=$1
    if [ -f "$file" ]; then
        echo_info "从 $file 提取环境变量..."
        while IFS= read -r line || [[ -n "$line" ]]; do
            # 跳过注释和空行
            if [[ ! "$line" =~ ^#.*$ ]] && [[ ! -z "$line" ]]; then
                # 提取变量名和值
                var_name=$(echo "$line" | cut -d '=' -f 1)
                var_value=$(echo "$line" | cut -d '=' -f 2-)
                
                # 检查变量是否已在.env中存在
                if grep -q "^$var_name=" .env; then
                    # 替换现有值
                    sed -i '' "s|^$var_name=.*|$var_name=$var_value|" .env
                    echo_info "  更新: $var_name=$var_value"
                else
                    # 如果变量不在模板中，添加到文件末尾
                    if [[ ! "$var_name" =~ ^[[:space:]]*$ ]]; then
                        echo "$var_name=$var_value" >> .env
                        echo_info "  添加: $var_name=$var_value"
                    fi
                fi
            fi
        done < "$file"
    else
        echo_warn "文件 $file 不存在，跳过"
    fi
}

# 提取各个环境变量文件中的值
extract_env_values ".env.backup."*
extract_env_values "webapp/.env"
extract_env_values "frontend/salary-viewer/.env"
extract_env_values "frontend/salary-viewer/.env.production"

echo_info "环境变量整合完成！"
echo_info "请检查新的.env文件，确保所有必要的变量都已正确设置。"
echo_info "然后，您可以删除或备份其他.env文件。"
