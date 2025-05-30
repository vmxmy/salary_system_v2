-- 测试多数据源JOIN查询，检查字段名格式
-- 模拟后端生成的SQL查询

-- 1. 首先查看数据
SELECT 
    ds_4.employee_code,
    ds_4.first_name,
    ds_4.department_id,
    ds_5.name as dept_name
FROM employees AS ds_4
LEFT JOIN departments AS ds_5 ON ds_4.department_id = ds_5.id
LIMIT 5;

-- 2. 使用字段别名模拟后端返回格式
SELECT 
    ds_4.employee_code as "4.employee_code",
    ds_4.first_name as "4.first_name",
    ds_5.name as "5.name"
FROM employees AS ds_4
LEFT JOIN departments AS ds_5 ON ds_4.department_id = ds_5.id
LIMIT 5; 