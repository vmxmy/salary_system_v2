# 工资信息管理系统 - 开发文档

## 1. 项目概述

工资信息管理系统是一个用于管理和分析员工工资信息的综合平台。系统提供了员工信息管理、部门管理、工资数据导入和分析、报表生成等功能。

### 主要功能

- 员工信息管理
- 部门和单位管理
- 工资数据导入和转换
- 工资数据查询和分析
- 报表生成和管理
- 用户权限管理

## 2. 技术栈

### 后端

- **框架**: FastAPI
- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy
- **数据转换**: dbt (data build tool)
- **认证**: JWT

### 前端

- **框架**: React
- **构建工具**: Vite
- **UI库**: Ant Design
- **状态管理**: React Context API
- **路由**: React Router
- **国际化**: i18next

### 开发环境

- **Python环境**: Conda (lightweight-salary-system 环境)
- **Node.js**: npm
- **并发开发服务器**: concurrently

## 3. 环境设置

### 前提条件

- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Conda

### 数据库设置

1. 创建PostgreSQL数据库:

```sql
CREATE DATABASE salary_system;
```

2. 使用项目中的SQL脚本初始化数据库结构:

```bash
# 从sql目录运行初始化脚本
psql -U postgres -d salary_system -f sql/init_schema.sql
```

### Python环境设置

1. 创建并激活Conda环境:

```bash
# 创建环境
conda create -n lightweight-salary-system python=3.8

# 激活环境
conda activate lightweight-salary-system
```

2. 安装Python依赖:

```bash
# 在项目根目录下
pip install -r webapp/requirements.txt
```

### 前端环境设置

1. 安装Node.js依赖:

```bash
# 进入前端目录
cd frontend/salary-viewer

# 安装依赖
npm install
```

## 4. 项目结构

```
salary_system/
├── .env                     # 后端环境变量
├── alembic.ini              # Alembic配置
├── alembic/                 # 数据库迁移脚本
├── frontend/                # 前端应用
│   └── salary-viewer/       # React应用
├── logs/                    # 日志文件目录
├── models.py                # SQLAlchemy模型
├── salary_dbt_transforms/   # dbt数据转换项目
├── scripts/                 # 实用脚本
├── sql/                     # SQL脚本
├── start-dev.sh             # 开发服务器启动脚本
└── webapp/                  # 后端FastAPI应用
    ├── main.py              # 主应用入口
    ├── routers/             # API路由
    ├── pydantic_models/     # 数据模型
    └── core/                # 核心配置
```

## 5. 启动项目

### 使用启动脚本

项目提供了一个启动脚本，可以同时启动前端和后端开发服务器:

```bash
# 确保脚本有执行权限
chmod +x start-dev.sh

# 运行启动脚本
./start-dev.sh
```

这个脚本会:
1. 激活Conda环境 (lightweight-salary-system)
2. 启动后端FastAPI服务器 (默认在 http://localhost:8080)
3. 启动前端Vite开发服务器 (默认在 http://localhost:5173)

### 手动启动

如果需要单独启动前端或后端，可以使用以下命令:

#### 启动后端

```bash
# 激活Conda环境
conda activate lightweight-salary-system

# 启动FastAPI服务器
cd /path/to/salary_system
uvicorn webapp.main:app --reload --host 0.0.0.0 --port 8080
```

#### 启动前端

```bash
# 进入前端目录
cd /path/to/salary_system/frontend/salary-viewer

# 启动Vite开发服务器
npm run dev
```

## 6. 开发指南

### 后端开发

#### 添加新的API端点

1. 在`webapp/routers/`目录下创建或修改路由文件
2. 定义新的端点函数
3. 在`webapp/main.py`中注册路由

示例:

```python
# 在webapp/routers/example.py中
from fastapi import APIRouter, Depends
from ..database import get_db

router = APIRouter()

@router.get("/example")
async def get_example(db = Depends(get_db)):
    return {"message": "This is an example endpoint"}

# 在webapp/main.py中注册
from .routers import example
app.include_router(
    example.router,
    prefix="/api",
    tags=["Example"]
)
```

#### 添加新的数据模型

1. 在`models.py`中定义SQLAlchemy模型
2. 在`webapp/pydantic_models/`中定义Pydantic模型
3. 使用Alembic创建迁移脚本

```bash
# 创建迁移脚本
alembic revision --autogenerate -m "Add new model"

# 应用迁移
alembic upgrade head
```

### 前端开发

#### 添加新组件

1. 在`frontend/salary-viewer/src/components/`目录下创建新组件
2. 在`App.tsx`中添加路由

#### 添加新API服务

1. 在`frontend/salary-viewer/src/services/`目录下创建或修改API服务文件
2. 使用fetch或axios发起API请求

## 7. 数据库结构

系统使用PostgreSQL数据库，主要包含以下schema:

- **core**: 核心数据表，如用户、权限等
- **employee**: 员工相关数据表
- **salary**: 工资相关数据表
- **config**: 系统配置相关数据表

### 主要数据表

- `core.users`: 用户信息
- `employee.employees`: 员工基本信息
- `employee.departments`: 部门信息
- `employee.units`: 单位信息
- `salary.salary_records`: 工资记录
- `config.field_mappings`: 字段映射配置

## 8. 常见问题解决

### 启动问题

**问题**: 启动脚本报错 `uvicorn: command not found`

**解决方案**: 确保已激活正确的Conda环境，并安装了uvicorn:
```bash
conda activate lightweight-salary-system
pip install uvicorn
```

**问题**: 前端启动失败，报错 `Module not found`

**解决方案**: 确保已安装所有前端依赖:
```bash
cd frontend/salary-viewer
npm install
```

### 数据库问题

**问题**: 连接数据库失败

**解决方案**: 
1. 检查`.env`文件中的数据库连接配置
2. 确保PostgreSQL服务正在运行
3. 验证数据库用户名和密码是否正确

### Conda环境问题

**问题**: Conda环境激活失败

**解决方案**:
1. 确保已安装Conda
2. 检查环境名称是否正确
3. 如果使用zsh，确保已正确配置Conda初始化

```bash
# 在~/.zshrc中添加
source ~/miniconda3/etc/profile.d/conda.sh
# 或
source ~/anaconda3/etc/profile.d/conda.sh
```

## 9. 贡献指南

1. 创建功能分支
2. 提交更改
3. 确保代码通过所有测试
4. 提交合并请求

## 10. 联系方式

如有任何问题，请联系项目维护者。
