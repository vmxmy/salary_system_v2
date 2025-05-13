#!/bin/bash
# 清理项目中的临时文件、日志文件、缓存文件和空目录

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

# 确认函数
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo "清理项目中的临时文件、日志文件、缓存文件和空目录。"
    echo
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -y, --yes      自动确认所有操作"
    echo "  -n, --dry-run  仅显示将要删除的文件，不实际删除"
    echo
}

# 解析命令行参数
AUTO_CONFIRM=false
DRY_RUN=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -h|--help) show_help; exit 0 ;;
        -y|--yes) AUTO_CONFIRM=true ;;
        -n|--dry-run) DRY_RUN=true ;;
        *) echo_error "未知选项: $1"; show_help; exit 1 ;;
    esac
    shift
done

# 如果是dry run模式，设置rm命令为echo
RM_CMD="rm -rf"
if [ "$DRY_RUN" = true ]; then
    RM_CMD="echo 将删除:"
    echo_info "运行在dry run模式，不会实际删除文件"
fi

# 清理临时文件和日志文件
echo_info "正在检查临时文件和日志文件..."
TEMP_FILES=(
    "temp_run_backend.sh"
    "temp_run_backend_clean.sh"
    "frontend.log"
    "frontend-clean.log"
    ".DS_Store"
    "memory-bank/.DS_Store"
)

for file in "${TEMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        if [ "$AUTO_CONFIRM" = true ] || confirm "是否删除临时文件: $file?"; then
            $RM_CMD "$file"
            if [ "$DRY_RUN" = false ]; then
                echo_info "已删除: $file"
            fi
        else
            echo_info "跳过: $file"
        fi
    fi
done

# 清理备份和历史文件
echo_info "正在检查备份和历史文件..."
BACKUP_FILES=(
    "webapp/main.py.bak"
)

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        if [ "$AUTO_CONFIRM" = true ] || confirm "是否删除备份文件: $file?"; then
            $RM_CMD "$file"
            if [ "$DRY_RUN" = false ]; then
                echo_info "已删除: $file"
            fi
        else
            echo_info "跳过: $file"
        fi
    fi
done

# 清理Python缓存文件
echo_info "正在检查Python缓存文件..."
if [ "$AUTO_CONFIRM" = true ] || confirm "是否删除所有Python缓存文件(__pycache__目录和.pyc文件)?"; then
    # 查找并删除所有__pycache__目录
    find . -type d -name "__pycache__" | while read dir; do
        $RM_CMD "$dir"
        if [ "$DRY_RUN" = false ]; then
            echo_info "已删除: $dir"
        fi
    done

    # 查找并删除所有.pyc文件
    find . -type f -name "*.pyc" | while read file; do
        $RM_CMD "$file"
        if [ "$DRY_RUN" = false ]; then
            echo_info "已删除: $file"
        fi
    done
else
    echo_info "跳过Python缓存文件"
fi

# 清理空目录
echo_info "正在检查空目录..."
EMPTY_DIRS=(
    "webapp/import_modules"
    "frontend/salary-viewer/src/components/charts"
)

for dir in "${EMPTY_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -z "$(ls -A "$dir")" ]; then
        if [ "$AUTO_CONFIRM" = true ] || confirm "是否删除空目录: $dir?"; then
            $RM_CMD "$dir"
            if [ "$DRY_RUN" = false ]; then
                echo_info "已删除: $dir"
            fi
        else
            echo_info "跳过: $dir"
        fi
    elif [ -d "$dir" ]; then
        echo_warn "目录不为空，跳过: $dir"
    fi
done

echo_info "清理完成！"
