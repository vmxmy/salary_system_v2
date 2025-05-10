# 技术背景

## 核心技术

* **数据库**: PostgreSQL 14+，包含以下 schemas:
  * `core`: 核心业务表 (units, departments, employees, users, roles)
  * `staging`: 数据暂存区 (raw_salary_data_staging, consolidated_data)
  * `payroll`: 计算结果 (calculated_salary_records, calculation_rules)
* **ETL**: Python+Pandas 用于数据预处理
* **数据转换**: dbt Core 配合自定义模型
* **后端**:
  * Python 3.10+
  * FastAPI 0.95+
  * SQLAlchemy 2.0+
  * JWT认证
* **前端**:
  * React 19+
  * TypeScript 5.7+
  * Vite 6.3+
  * Redux Toolkit
  * Ant Design 5.24+

## 开发环境搭建

1. **数据库**:

```bash
docker-compose -f docker/docker-compose.yml up -d postgres
```

1. **后端**:

```bash
conda create -n salary-system python=3.10
conda activate salary-system
pip install -r webapp/requirements.txt
```

1. **前端**:

```bash
cd frontend/salary-viewer
npm install
npm run dev
```

## 技术约束

1. **数据隐私**:

* 身份证号等敏感字段必须加密存储
* 生产环境必须启用HTTPS

1. **性能**:

* 工资计算批处理需在30分钟内完成 (1000人规模)
* 列表查询响应时间 < 1s (10000条记录)

1. **兼容性**:

* 支持Excel 2010+文件导入
* 浏览器兼容: Chrome最新版, Edge最新版

## 主要依赖

1. **后端**:

* FastAPI
* SQLAlchemy
* python-jose (JWT)
* pandas (数据处理)
* psycopg2-binary (PostgreSQL驱动)
* passlib (密码哈希)
* python-dotenv (环境变量)
* uvicorn (ASGI服务器)

1. **前端**:

* react-i18next
* antd
* axios
* @reduxjs/toolkit
* react-redux
* @dnd-kit (拖拽功能)
* xlsx (表格导出)
* @ant-design/v5-patch-for-react-19 (React 19兼容)

## 配置文件

1. **后端**:

* `docker/.env`: 数据库连接配置
* `webapp/core/config.py`: 应用配置

1. **前端**:

* `frontend/salary-viewer/.env`: API基础URL
* `frontend/salary-viewer/vite.config.ts`: 构建配置

## 架构文档

1. [系统架构总览](./system-architecture.md)
2. [前端架构](./frontend-architecture.md)
3. [后端架构](./backend-architecture.md)

## 已知问题

1. 大批量数据导入时内存占用较高
1. 复杂计算规则可能导致性能下降
1. 表格高级筛选功能在某些情况下可能存在问题
1. 需要使用@ant-design/v5-patch-for-react-19确保Ant Design与React 19兼容

## 最近更新

1. 前端升级到React 19和Vite 6
1. 添加Redux Toolkit进行状态管理
1. 实现表格布局配置的服务器存储和本地缓存
1. 添加邮件服务器配置和邮件发送功能
1. 优化表格高级筛选和导出功能
