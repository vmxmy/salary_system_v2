# 环境变量配置指南

本文档介绍了高新区工资信息管理系统的环境变量配置方法和最佳实践。

## 环境变量整合

为了简化配置和维护，我们将所有环境变量整合到项目根目录的单一`.env`文件中。这样可以：

1. 避免配置分散在多个文件中导致的混乱
2. 简化部署和环境设置过程
3. 确保前后端使用一致的配置

## 配置文件说明

系统使用以下环境变量文件：

- `.env` - 主要环境变量文件，包含所有配置
- `.env.template` - 环境变量模板，包含所有可配置项及说明
- `frontend/salary-viewer/.env.production` - 前端生产环境特定配置

## 环境变量分类

环境变量分为以下几类：

### 数据库配置

- `DATABASE_URL` - 数据库连接字符串
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - 单独的数据库连接参数

### 后端服务器配置

- `UVICORN_HOST` - 后端服务器主机地址
- `UVICORN_PORT` - 后端服务器端口
- `UVICORN_RELOAD` - 是否启用热重载

### JWT认证配置

- `JWT_SECRET_KEY` - JWT密钥
- `JWT_ALGORITHM` - JWT算法
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - 访问令牌过期时间
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS` - 刷新令牌过期时间

### 管理员账户设置

- `ADMIN_USERNAME` - 管理员用户名
- `ADMIN_EMAIL` - 管理员邮箱
- `ADMIN_PASSWORD` - 管理员密码

### 应用程序设置

- `AUTO_INIT_DB` - 是否自动初始化数据库
- `CONDA_ENV` - Conda环境名称

### 前端配置

- `VITE_API_BASE_URL` - 前端API基础URL

### Dify聊天机器人配置

- `VITE_DIFY_TOKEN` - Dify聊天机器人Token
- `VITE_DIFY_BASE_URL` - Dify聊天机器人基础URL

### LLM配置

- `LLM_BASE_URL` - LLM基础URL
- `LLM_API_KEY` - LLM API密钥
- `LLM_MODEL` - LLM模型

### 邮件服务器配置

- `EMAIL_CFG_FERNET_KEY` - 用于加密邮件服务器密码的Fernet密钥

## 环境变量整合步骤

1. 复制`.env.template`为`.env`：

   ```bash
   cp .env.template .env
   ```

2. 编辑`.env`文件，填入适当的值：

   ```bash
   nano .env  # 或使用您喜欢的文本编辑器
   ```

3. 或者使用提供的整合脚本自动合并现有的环境变量文件：

   ```bash
   bash scripts/merge_env_files.sh
   ```

## 环境变量加载机制

### 后端

后端通过以下方式加载环境变量，优先使用项目根目录的`.env`文件：

1. 在`webapp/database.py`中：

   ```python
   # 首先尝试加载项目根目录的.env文件
   root_dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
   if os.path.exists(root_dotenv_path):
       load_dotenv(dotenv_path=root_dotenv_path)
   else:
       # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
       webapp_dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
       load_dotenv(dotenv_path=webapp_dotenv_path)
   ```

2. 在`webapp/main.py`中：

   ```python
   # 首先尝试加载项目根目录的.env文件
   root_dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
   if os.path.exists(root_dotenv_path):
       load_dotenv(dotenv_path=root_dotenv_path)
   else:
       # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
       webapp_dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
       load_dotenv(dotenv_path=webapp_dotenv_path)
   ```

3. 在启动脚本`start-dev.sh`中：

   ```bash
   ROOT_ENV_FILE=".env"
   WEBAPP_ENV_FILE="webapp/.env"

   # 首先尝试加载根目录的.env文件
   if [ -f "$ROOT_ENV_FILE" ]; then
     echo "Loading configuration from $ROOT_ENV_FILE..."
     set -a
     source "$ROOT_ENV_FILE"
     set +a
   elif [ -f "$WEBAPP_ENV_FILE" ]; then
     # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
     echo "Loading backend configuration from $WEBAPP_ENV_FILE..."
     set -a
     source "$WEBAPP_ENV_FILE"
     set +a
   fi
   ```

### 前端

前端通过Vite的环境变量机制加载环境变量：

1. 在`frontend/salary-viewer/src/services/api.ts`中：

   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
   ```

2. 在Dify聊天机器人组件中：

   ```typescript
   const token = import.meta.env.VITE_DIFY_TOKEN || 'jsPqTK9jkG42gNSr';
   const baseUrl = import.meta.env.VITE_DIFY_BASE_URL || 'http://dify.atx.ziikoo.com';
   ```

## 最佳实践

1. **不要提交敏感信息**：确保包含敏感信息的`.env`文件不会被提交到版本控制系统中。
2. **使用强密码和密钥**：为`JWT_SECRET_KEY`、`ADMIN_PASSWORD`等敏感配置使用强随机值。
3. **环境隔离**：为开发、测试和生产环境使用不同的环境变量值。
4. **定期更新密钥**：定期更新密钥和密码，提高系统安全性。
5. **检查默认值**：确保没有使用不安全的默认值，特别是在生产环境中。

## 环境变量更新后的操作

更新环境变量后，需要执行以下操作：

1. 重启后端服务器：

   ```bash
   ./start-dev.sh
   ```

2. 重新构建前端（如果更新了前端环境变量）：

   ```bash
   cd frontend/salary-viewer
   npm run build
   ```
