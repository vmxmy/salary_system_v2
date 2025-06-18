# 薪资系统前端 Docker 部署指南

本目录包含了薪资系统前端的Docker部署配置文件，可以快速构建和运行前端服务。

## 目录结构

```
docker/frontend/
├── Dockerfile          # 前端服务的Docker镜像构建文件
├── docker-compose.yml  # Docker Compose配置文件
├── nginx.conf          # Nginx配置文件
├── .dockerignore       # Docker构建时忽略的文件
├── run.sh              # 启动脚本
├── stop.sh             # 停止脚本
└── README.md           # 本文档
```

## 前端构建和部署流程

### 1. 自动构建和部署（推荐）

使用提供的脚本自动完成前端构建和部署：

```bash
# 添加执行权限
chmod +x run.sh

# 执行启动脚本（会自动检查并构建前端）
./run.sh
```

### 2. 手动构建和部署

如果需要手动控制构建过程，可以按以下步骤操作：

#### 2.1 构建前端

```bash
# 进入前端项目目录
cd ../../frontend/v2

# 安装依赖
npm install

# 构建前端
npm run build
```

#### 2.2 部署Docker容器

```bash
# 返回Docker目录
cd ../../docker/frontend

# 构建并启动容器
docker-compose up --build -d
```

## 配置说明

### Nginx配置

`nginx.conf`文件包含了前端服务的Nginx配置：

- 静态文件服务：提供前端构建产物的访问
- 单页应用支持：配置路由重定向，支持前端路由
- API代理：将`/v2/`开头的请求代理到后端服务
- 静态资源缓存：配置静态资源的缓存策略
- Gzip压缩：启用Gzip压缩，提高传输效率

### Docker Compose配置

`docker-compose.yml`文件定义了完整的服务栈：

- `frontend`：前端服务，基于Nginx提供静态文件服务
- `backend`：后端API服务，处理业务逻辑
- `db`：数据库服务，存储系统数据

## 常见问题

### 1. 前端构建失败

如果前端构建失败，可能是由于Node.js版本不兼容或依赖问题，请尝试：

```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules目录
rm -rf node_modules

# 重新安装依赖
npm install

# 重新构建
npm run build
```

### 2. 容器启动失败

如果容器启动失败，请检查日志：

```bash
docker-compose logs frontend
```

### 3. 无法访问前端页面

如果无法访问前端页面，可能是由于：

- 端口冲突：检查80端口是否被占用
- Nginx配置问题：检查nginx.conf文件
- 前端构建问题：检查dist目录是否存在且包含index.html

## 停止服务

使用提供的脚本停止服务：

```bash
# 添加执行权限
chmod +x stop.sh

# 停止服务
./stop.sh
``` 