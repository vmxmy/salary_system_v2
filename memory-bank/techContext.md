# 技术背景

## 核心技术

* **数据库**: PostgreSQL 14+，包含以下 schemas:
  - `core`: 核心业务表 (units, departments, employees)
  - `staging`: 数据暂存区 (raw_salary_data_staging)
  - `payroll`: 计算结果 (calculated_salary_records)
* **ETL**: Python+Pandas 用于数据预处理
* **数据转换**: dbt Core 配合自定义模型
* **后端**:
  - Python 3.10+
  - FastAPI 0.95+
  - SQLAlchemy 2.0+
* **前端**:
  - React 18+
  - TypeScript 5+
  - Vite 4+

## 开发环境搭建

1. **数据库**:
```bash
docker-compose -f docker/docker-compose.yml up -d postgres
```

2. **后端**:
```bash
conda create -n salary-system python=3.10
conda activate salary-system
pip install -r webapp/requirements.txt
```

3. **前端**:
```bash
cd frontend/salary-viewer
npm install
npm run dev
```

## 技术约束

1. **数据隐私**:
- 身份证号等敏感字段必须加密存储
- 生产环境必须启用HTTPS

2. **性能**:
- 工资计算批处理需在30分钟内完成 (1000人规模)
- 列表查询响应时间 < 1s (10000条记录)

3. **兼容性**:
- 支持Excel 2010+文件导入
- 浏览器兼容: Chrome最新版, Edge最新版

## 主要依赖

1. **后端**:
- FastAPI
- SQLAlchemy
- python-jose (JWT)
- pandas (数据处理)

2. **前端**:
- react-i18next
- antd
- axios
- vite-plugin-mdx

## 配置文件

1. **后端**:
- `docker/.env`: 数据库连接配置
- `webapp/core/config.py`: 应用配置

2. **前端**:
- `frontend/salary-viewer/.env`: API基础URL
- `frontend/salary-viewer/vite.config.ts`: 构建配置

## 架构文档

1. [系统架构总览](./system-architecture.md)
2. [前端架构](./frontend-architecture.md)
3. [后端架构](./backend-architecture.md)

## 已知问题

1. 大批量数据导入时内存占用较高
2. 复杂计算规则可能导致性能下降
