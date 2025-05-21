#!/bin/bash

# 定义变量
TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOCAL_ARCHIVE_NAME="salary_frontend_build_${TIMESTAMP}.tar.gz"
REMOTE_USER="caijing"
REMOTE_HOST="172.28.6.204"
REMOTE_TARGET_DIR="/opt/1panel/apps/openresty/openresty/www/sites/172.28.6.204/index/" # 确保这是1Panel站点的确切根目录
REMOTE_ARCHIVE_PATH="~/${LOCAL_ARCHIVE_NAME}" # 上传到服务器的家目录

# 本地项目路径 (假设脚本在项目根目录运行)
FRONTEND_DIST_PATH="frontend/v2/dist"

# 脚本开始
echo " "
echo "🚀 开始部署前端应用..."
echo "--------------------------------------------------"

# 1. 在本地打包 dist 目录
echo "📦 步骤 1/3: 打包 ${FRONTEND_DIST_PATH} 目录..."
tar -czvf "${LOCAL_ARCHIVE_NAME}" -C "${FRONTEND_DIST_PATH}" . # 打包 dist 目录下的所有内容
if [ $? -ne 0 ]; then
    echo "❌ 打包失败！请检查错误信息。"
    exit 1
fi
echo "✅ 打包完成: ${LOCAL_ARCHIVE_NAME}"
echo "--------------------------------------------------"

# 2. 上传压缩包到服务器的家目录
echo "📤 步骤 2/3: 上传 ${LOCAL_ARCHIVE_NAME} 到 ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE_PATH}..."
scp "${LOCAL_ARCHIVE_NAME}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE_PATH}"
if [ $? -ne 0 ]; then
    echo "❌ 上传失败！请检查网络连接和SSH配置。"
    exit 1
fi
echo "✅ 上传成功！"
echo "--------------------------------------------------"

# 3. 在服务器上执行解压和清理操作
echo "⚙️  步骤 3/3: 在服务器 ${REMOTE_HOST} 上执行解压和部署..."
# 使用带引号的 EOF 防止本地扩展，并通过参数传递本地变量的值
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s -- "${LOCAL_ARCHIVE_NAME}" "${REMOTE_TARGET_DIR}" << 'EOF'
    # $1 对应本地的 LOCAL_ARCHIVE_NAME
    # $2 对应本地的 REMOTE_TARGET_DIR

    echo "  ↳ 正在服务器上操作..."
    echo "  ↳ 清空目标目录: $2..."
    # 更安全地清空目标目录
    if [ -d "$2" ]; then
        find "$2" -mindepth 1 -delete
    else
        mkdir -p "$2"
    fi
    
    echo "  ↳ 远程调试: 尝试解压位于 $HOME/$1 的文件 (传入的归档文件名是 $1)"
    tar -xzvf "$HOME/$1" -C "$2"
    if [ $? -ne 0 ]; then
        echo "  ❌ 服务器端解压失败！(尝试解压 $HOME/$1 到 $2)"
        exit 1 # 这会退出 SSH 会话内的脚本部分，父脚本依然会继续
    fi
    
    echo "  ↳ (可选) 删除服务器上的压缩包: $HOME/$1..."
    rm "$HOME/$1"
    if [ $? -ne 0 ]; then
        echo "  ⚠️ 服务器端删除压缩包 $HOME/$1 失败，请手动检查。"
    fi
    
    echo "  ✅ 服务器端部署操作完成！"
'EOF'

if [ $? -ne 0 ]; then
    echo "❌ 服务器端操作可能失败！请检查SSH输出。"
    exit 1
fi
echo "--------------------------------------------------"

# 4. (可选) 删除本地的压缩包
echo "🗑️  (可选) 清理本地压缩包 ${LOCAL_ARCHIVE_NAME}..."
rm "${LOCAL_ARCHIVE_NAME}"
echo "✅ 本地清理完成。"
echo "--------------------------------------------------"
echo "🎉 前端部署脚本执行完毕！"
echo "请通过浏览器访问你的应用，并检查1Panel中对应的站点配置是否正确（特别是伪静态规则）。"
echo " " 