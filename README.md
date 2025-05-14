# 高新区工资信息管理系统

## 项目概述

高新区工资信息管理系统是一个用于管理和分析员工薪资数据的应用程序。系统支持导入、合并、查询和分析各类薪资数据，包括基本工资、社保、公积金、年金等信息。

## 主要功能

- 数据导入：支持导入各类薪资数据文件
- 数据合并：将不同来源的数据合并到统一的数据结构中
- 数据查询：提供多种视图和查询方式，方便用户查看和分析数据
- 数据分析：支持按部门、职位等维度进行薪资数据分析

## 技术栈

- 后端：Python, Flask, SQLAlchemy, Alembic
- 数据库：PostgreSQL
- 前端：Vue.js, Element UI

## 数据库结构

系统使用 PostgreSQL 数据库，主要包含以下几个模式（Schema）：

- `core`: 包含核心数据表，如用户、部门、员工类型等
- `staging`: 包含数据导入和合并的中间表
- `payroll`: 包含薪资计算和规则相关的表
- `public`: 包含用于查询和分析的视图

### 主要数据表

- `staging.consolidated_data`: 合并后的薪资数据表，包含所有薪资相关字段
- `staging.raw_salary_data_staging`: 原始薪资数据导入表
- `staging.raw_medical_staging`: 医疗保险数据导入表
- `staging.raw_pension_staging`: 养老保险数据导入表
- `staging.raw_housingfund_staging`: 住房公积金数据导入表
- `staging.raw_annuity_staging`: 年金数据导入表
- `staging.raw_tax_staging`: 税务数据导入表

### 主要视图

- `public.正编人员工资信息表`: 正编人员（公务员、参公和事业编制）的薪资信息视图
- `public.聘用人员工资信息表`: 聘用人员（非正编人员）的薪资信息视图

## 开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/vmxmy/salary_system.git
cd salary_system
```

2. 创建并激活 conda 环境
```bash
conda create -n lightweight-salary-system python=3.9
conda activate lightweight-salary-system
```

3. 安装依赖
```bash
pip install -r webapp/requirements.txt
cd frontend/salary-viewer
npm install
cd ../..
```

4. 设置数据库
```bash
# 创建数据库
createdb salary_system

# 运行数据库迁移
alembic upgrade head
```

5. 启动开发服务器
```bash
./start-dev.sh
```

## 拉取代码后启动服务步骤

如果您已经克隆过仓库，并且想要拉取最新代码并启动服务，请按照以下步骤操作：

1. 拉取最新代码
```bash
cd /path/to/salary_system
git pull
```

2. 激活 conda 环境
```bash
conda activate lightweight-salary-system
```

3. 更新依赖（如果有更新）
```bash
pip install -r webapp/requirements.txt
cd frontend/salary-viewer
npm install
cd ../..
```

4. 运行数据库迁移（如果有新的迁移）
```bash
alembic upgrade head
```

5. 启动服务
```bash
./start-dev.sh
```

服务启动后：
- 后端服务将运行在 http://localhost:8080
- 前端服务将运行在 http://localhost:5173
- 后端日志将自动显示在终端中
- 前端日志保存在 frontend.log 文件中

如需停止服务，可以按 Ctrl+C 或运行：
```bash
./stop-dev.sh
```

## 数据库迁移

系统使用 Alembic 管理数据库迁移。以下是常用的 Alembic 命令：

```bash
# 创建新的迁移文件
alembic revision -m "描述"

# 应用所有迁移
alembic upgrade head

# 回滚到上一个版本
alembic downgrade -1

# 查看迁移历史
alembic history
```

### 多数据库迁移

系统支持同时在多个数据库上运行迁移。有两种方式可以实现：

#### 方法1：使用环境变量

通过设置`ALEMBIC_DATABASE_URL`环境变量来指定目标数据库：

```bash
# 在第一个数据库上运行迁移
ALEMBIC_DATABASE_URL=postgresql://user1:pass1@host1/db1 alembic upgrade head

# 在第二个数据库上运行迁移
ALEMBIC_DATABASE_URL=postgresql://user2:pass2@host2/db2 alembic upgrade head
```

#### 方法2：使用辅助脚本

使用`scripts/multi_db_migrate.py`脚本可以同时在多个数据库上运行相同的迁移命令：

```bash
# 在多个数据库上应用所有迁移
python scripts/multi_db_migrate.py --command upgrade --target head --db-urls "postgresql://user1:pass1@host1/db1" "postgresql://user2:pass2@host2/db2"

# 在多个数据库上创建新的迁移文件
python scripts/multi_db_migrate.py --command revision --message "新的迁移" --autogenerate --db-urls "postgresql://user1:pass1@host1/db1"

# 在多个数据库上回滚到上一个版本
python scripts/multi_db_migrate.py --command downgrade --target -1 --db-urls "postgresql://user1:pass1@host1/db1" "postgresql://user2:pass2@host2/db2"
```

注意：创建迁移文件时，通常只需要针对一个数据库运行，因为迁移文件是通用的，可以应用到多个数据库。

## 最近更新

### 2025-05-10

- 添加了多数据库迁移支持，可以同时在多个数据库上运行迁移
  - 支持通过环境变量指定目标数据库
  - 提供了辅助脚本`scripts/multi_db_migrate.py`，简化多数据库迁移操作
- 更新了文档，添加了多数据库迁移的使用说明

### 2025-05-07

- 创建了正编人员工资信息表视图，包含正编人员（公务员、参公和事业编制）的薪资信息
- 创建了聘用人员工资信息表视图，包含非正编人员的薪资信息
- 修改了数据库字段名称，使命名更加一致
  - 将 `raw_medical_staging` 表中的 `total_employee_contribution` 改为 `medical_total_employee_contribution`
  - 将 `raw_medical_staging` 表中的 `total_employer_contribution` 改为 `medical_total_employer_contribution`
  - 将 `consolidated_data` 表中的字段名称相应更新为 `med_medical_total_employee_contribution` 和 `med_medical_total_employer_contribution`

## 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件
