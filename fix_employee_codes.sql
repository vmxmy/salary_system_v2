-- 修复员工编码空值问题
-- 为空的 employee_code 生成格式化的编码

UPDATE hr.employees 
SET employee_code = 'EMP' || LPAD(id::text, 6, '0') 
WHERE employee_code IS NULL;

-- 验证结果
SELECT count(*) as remaining_null_codes FROM hr.employees WHERE employee_code IS NULL;

-- 显示更新后的一些示例
SELECT id, name, employee_code FROM hr.employees 
WHERE employee_code LIKE 'EMP%' 
ORDER BY id 
LIMIT 10;