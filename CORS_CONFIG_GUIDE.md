# CORS 跨域配置指南

## 📋 环境变量配置

现在 CORS 配置已改为完全通过环境变量控制，请按以下步骤配置：

### 1. 创建 webapp/.env 文件

在 `webapp` 目录下创建 `.env` 文件：

```bash
# webapp/.env

# ===========================================
# CORS 跨域配置 (必须设置!)
# ===========================================

# 当前生产环境配置
CORS_ORIGINS_STRING=http://172.28.6.204:5173,http://172.28.6.204:8080,http://salary.ziikoo.com,https://salary.ziikoo.com

# 开发环境配置 (可选)
# CORS_ORIGINS_STRING=http://localhost:5173,http://127.0.0.1:5173,http://172.28.6.204:5173

# 紧急测试配置 (⚠️ 仅测试用，生产环境禁用!)
# CORS_ORIGINS_STRING=*

# ===========================================
# 其他必要配置
# ===========================================
DATABASE_URL=postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2
SECRET_KEY=your-secret-key-here
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8080
```

### 2. 配置说明

#### CORS_ORIGINS_STRING 格式
- **多个地址用逗号分隔**
- **不要有空格**
- **包含协议和端口**

#### 示例配置

**开发环境：**
```bash
CORS_ORIGINS_STRING=http://localhost:5173,http://127.0.0.1:5173
```

**生产环境：**
```bash
CORS_ORIGINS_STRING=http://172.28.6.204:5173,https://salary.ziikoo.com
```

**紧急测试（不推荐）：**
```bash
CORS_ORIGINS_STRING=*
```

### 3. 重启后端服务

配置完成后，重启后端服务使配置生效：

```bash
# 如果使用 systemd
sudo systemctl restart salary-system

# 或者直接重启 Python 进程
```

### 4. 验证配置

测试 CORS 配置是否生效：

```bash
curl -I -X OPTIONS http://172.28.6.204:8080/v2/auth/token \
  -H "Origin: http://172.28.6.204:5173" \
  -H "Access-Control-Request-Method: POST"
```

应该返回：
```
access-control-allow-origin: http://172.28.6.204:5173
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-credentials: true
```

## 🚨 安全注意事项

1. **❌ 生产环境绝不使用通配符 `*`**
2. **✅ 只添加真正需要的域名**
3. **✅ 定期审查和更新 CORS 配置**
4. **✅ 使用 HTTPS 协议的域名**

## 🔧 常见问题

### Q: 前端仍然报 CORS 错误？
A: 确保：
1. 环境变量已正确设置
2. 后端服务已重启
3. 前端地址拼写正确（包括协议和端口）

### Q: 如何查看当前 CORS 配置？
A: 检查后端启动日志，会显示警告信息如果未设置环境变量

### Q: 生产环境推荐配置？
A: 只包含生产域名：
```bash
CORS_ORIGINS_STRING=https://salary.ziikoo.com
```

## 📝 配置模板

**完整的 webapp/.env 模板：**
```bash
# CORS 配置
CORS_ORIGINS_STRING=http://172.28.6.204:5173,https://salary.ziikoo.com

# 数据库配置
DATABASE_URL=postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2

# 服务配置
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8080
SECRET_KEY=your-secret-key-here
``` 