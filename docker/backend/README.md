# 薪资系统后端 Docker 部署指南

本目录包含了薪资系统后端的Docker部署配置文件，可以快速构建和运行后端服务。

## 目录结构

```
docker/backend/
├── Dockerfile            # 后端服务的Docker镜像构建文件
├── docker-compose.yml    # Docker Compose配置文件
├── docker-requirements.txt # Docker环境的Python依赖文件
├── system-dependencies.txt # 系统依赖包列表
├── .dockerignore         # Docker构建时忽略的文件
├── env.example           # 环境变量示例文件
├── healthcheck.py        # 健康检查脚本
├── run.sh               # 启动脚本
├── stop.sh              # 停止脚本
└── README.md            # 本文档
```

## 依赖管理

本项目采用文件化的依赖管理方式，确保所有依赖都可以被追踪和管理：

1. **Python依赖**：
   - 主要Python依赖在 `webapp/requirements.txt` 中定义
   - Docker特定的Python依赖在 `docker/backend/docker-requirements.txt` 中定义
   - Docker环境使用 `docker-requirements.txt` 安装所有依赖

2. **系统依赖**：
   - 所有系统依赖在 `docker/backend/system-dependencies.txt` 中定义
   - Dockerfile通过读取该文件安装所有系统依赖

这种方式确保了：
- 所有依赖都有明确的文档记录
- 依赖更新只需修改相应的文件
- 避免在Dockerfile中硬编码依赖信息

## 快速开始

### 1. 准备环境

确保已安装Docker和Docker Compose：

```bash
docker --version
docker-compose --version
```

### 2. 配置环境变量

复制环境变量示例文件并根据需要修改：

```bash
cp env.example .env
```

### 3. 启动服务

使用提供的脚本启动服务：

```bash
# 添加执行权限
chmod +x run.sh
# 启动服务
./run.sh
```

服务启动后，可以通过以下地址访问：
- API地址：http://localhost:8080
- API文档：http://localhost:8080/docs

### 4. 停止服务

使用提供的脚本停止服务：

```bash
# 添加执行权限
chmod +x stop.sh
# 停止服务
./stop.sh
```

## 高级配置

### 自定义端口

如需修改端口映射，编辑`docker-compose.yml`文件中的`ports`部分：

```yaml
ports:
  - "自定义端口:8080"
```

### 持久化数据

数据库数据默认保存在名为`postgres_data`的Docker卷中。如需备份或迁移数据，请参考PostgreSQL的相关文档。

### 查看日志

```bash
# 查看所有服务的日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 只查看后端服务的日志
docker-compose logs backend
```

## 故障排除

### 数据库连接问题

如果后端无法连接到数据库，请检查：
1. 数据库容器是否正常运行：`docker-compose ps`
2. 环境变量中的数据库连接信息是否正确
3. 数据库是否初始化完成：`docker-compose logs db`

### 端口冲突

如果出现端口冲突，可能是本地已有服务占用了相同端口，请修改`docker-compose.yml`中的端口映射。 