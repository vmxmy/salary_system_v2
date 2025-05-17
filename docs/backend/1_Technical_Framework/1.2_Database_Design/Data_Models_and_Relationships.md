# 数据模型与关系详解

本文档详细定义了数据库中的数据模型、表间关系以及字段约束。

(待填充：为每个核心表提供详细的字段列表、数据类型、约束条件、索引、外键关系等。)

## 示例：employees 表

| 字段名        | 数据类型    | 约束                | 描述             |
|---------------|-------------|---------------------|------------------|
| id            | INT         | PRIMARY KEY, AUTO_INCREMENT | 唯一标识符       |
| employee_number | VARCHAR(50) | UNIQUE, NOT NULL    | 工号             |
| first_name    | VARCHAR(100)| NOT NULL            | 名               |
| last_name     | VARCHAR(100)| NOT NULL            | 姓               |
| department_id | INT         | FOREIGN KEY (departments.id) | 所属部门ID       |
| job_title_id  | INT         | FOREIGN KEY (job_titles.id)  | 职位ID           |
| hire_date     | DATE        | NOT NULL            | 入职日期         |
| ...           | ...         | ...                 | ...              |

*此文档后续可整合 `docs/v2/数据库 2.0 说明.md` 的详细内容。* 