#!/bin/bash

# 定义变量
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOCAL_BACKEND_ARCHIVE_NAME="salary_backend_build_${TIMESTAMP}.tar.gz"
REMOTE_USER="caijing"
REMOTE_HOST="172.28.6.204"
# 后端代码将部署在用户家目录下的此文件夹
REMOTE_BACKEND_TARGET_DIR="/home/caijing/salary_system_backend" 
REMOTE_ARCHIVE_PATH="~/${LOCAL_BACKEND_ARCHIVE_NAME}" # 上传到服务器的家目录

# 本地后端项目路径 (假设脚本在项目根目录运行)
BACKEND_SOURCE_PATH="webapp" # <--- 请确认这是正确的后端代码根目录

# 检查后端源路径是否存在
if [ ! -d "${BACKEND_SOURCE_PATH}" ]; then
    echo "❌ 错误: 后端源路径 '${BACKEND_SOURCE_PATH}' 不存在。"
    echo "请检查 BACKEND_SOURCE_PATH 变量是否正确设置成本地后端代码的根目录 (例如 webapp/ 或 src/backend/ 等)。"
    exit 1
fi

# 脚本开始
echo " "
echo "🚀 开始部署后端应用源码..."
echo "--------------------------------------------------"

# 1. 在本地打包后端源代码目录
echo "📦 步骤 1/4: 打包 ${BACKEND_SOURCE_PATH} 目录..."
tar -czvf "${LOCAL_BACKEND_ARCHIVE_NAME}" -C "${BACKEND_SOURCE_PATH}" .
if [ $? -ne 0 ]; then
    echo "❌ 打包失败！请检查错误信息。"
    exit 1
fi
echo "✅ 打包完成: ${LOCAL_BACKEND_ARCHIVE_NAME}"
echo "--------------------------------------------------"

# 2. 上传压缩包到服务器的家目录
echo "📤 步骤 2/4: 上传 ${LOCAL_BACKEND_ARCHIVE_NAME} 到 ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE_PATH}..."
scp "${LOCAL_BACKEND_ARCHIVE_NAME}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE_PATH}"
if [ $? -ne 0 ]; then
    echo "❌ 上传失败！请检查网络连接和SSH配置。"
    # 清理本地产生的压缩包
    rm "${LOCAL_BACKEND_ARCHIVE_NAME}"
    exit 1
fi
echo "✅ 上传成功！"
echo "--------------------------------------------------"

# 3. 在服务器上执行解压和部署操作
echo "⚙️  步骤 3/4: 在服务器 ${REMOTE_HOST} 上解压源码..."
# 使用带引号的 EOF 防止本地扩展，并通过参数传递本地变量的值
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s -- "${LOCAL_BACKEND_ARCHIVE_NAME}" "${REMOTE_BACKEND_TARGET_DIR}" << 'EOF'
    # $1 对应本地的 LOCAL_BACKEND_ARCHIVE_NAME
    # $2 对应本地的 REMOTE_BACKEND_TARGET_DIR

    echo "  ↳ 正在服务器上操作..."
    echo "  ↳ 确保目标目录存在: $2..."
    mkdir -p "$2"
    if [ $? -ne 0 ]; then
        echo "  ❌ 创建或访问目标目录 $2 失败！"
        exit 1
    fi

    echo "  ↳ 清空目标目录: $2..."
    # 更安全地清空目标目录
    if [ -d "$2" ]; then
        find "$2" -mindepth 1 -delete
    else
        # mkdir -p "$2" # 已在上面创建
        echo "  ⚠️ 目标目录 $2 刚刚不存在，现已创建但内部应为空。"
    fi
    
    echo "  ↳ 解压位于 $HOME/$1 的文件到 $2"
    tar -xzvf "$HOME/$1" -C "$2"
    if [ $? -ne 0 ]; then
        echo "  ❌ 服务器端解压失败！(尝试解压 $HOME/$1 到 $2)"
        exit 1 
    fi
    
    echo "  ↳ (可选) 删除服务器上的压缩包: $HOME/$1..."
    rm "$HOME/$1"
    if [ $? -ne 0 ]; then
        echo "  ⚠️ 服务器端删除压缩包 $HOME/$1 失败，请手动检查。"
    fi
    
    echo "  ✅ 服务器端源码解压和放置操作完成！"
'EOF'

SSH_EXIT_CODE=$?
if [ ${SSH_EXIT_CODE} -ne 0 ]; then
    echo "❌ 服务器端操作失败！SSH退出码: ${SSH_EXIT_CODE}。请检查SSH输出。"
    # 清理本地产生的压缩包
    rm "${LOCAL_BACKEND_ARCHIVE_NAME}"
    exit 1
fi
echo "--------------------------------------------------"

# 4. (可选) 删除本地的压缩包
echo "🗑️  步骤 4/4: 清理本地压缩包 ${LOCAL_BACKEND_ARCHIVE_NAME}..."
rm "${LOCAL_BACKEND_ARCHIVE_NAME}"
echo "✅ 本地清理完成。"
echo "--------------------------------------------------"
echo "🎉 后端源码部署脚本执行完毕！"
echo "后端代码已上传到服务器 ${REMOTE_HOST}:${REMOTE_BACKEND_TARGET_DIR}"
echo "接下来您可能需要：安装依赖、配置环境变量、设置数据库连接、启动后端服务等。"
echo " " 