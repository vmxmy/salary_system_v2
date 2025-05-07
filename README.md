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
```

2. 创建并激活 conda 环境
```bash
conda create -n lightweight-salary-system python=3.9
conda activate lightweight-salary-system
```

3. 安装依赖
```bash
pip install -r requirements.txt
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

## 最近更新

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
