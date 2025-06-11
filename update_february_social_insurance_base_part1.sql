-- 更新2月份员工社保缴费基数 - 第一部分
-- 执行日期: 2025年1月
-- 说明: 批量更新已有2月份配置的员工的社保缴费基数

BEGIN;

-- 更新包晓静的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 14947,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '包' AND first_name = '晓静')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新方敬玉的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 16969,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '方' AND first_name = '敬玉')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新高洪艳的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 17355,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '高' AND first_name = '洪艳')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新谷颖的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 20228,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '谷' AND first_name = '颖')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新韩霜的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 19917,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '韩' AND first_name = '霜')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新何婷的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 15657,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '何' AND first_name = '婷')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新胡潇的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 12966,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '胡' AND first_name = '潇')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新黄明的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 21953,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '黄' AND first_name = '明')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新李薇的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 15657,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '李' AND first_name = '薇')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新李文媛的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 16813,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '李' AND first_name = '文媛')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新廖希的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 14947,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '廖' AND first_name = '希')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新刘丹的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 16621,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '刘' AND first_name = '丹')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新罗蓉的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 15285,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '罗' AND first_name = '蓉')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新吕果的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 13363,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '吕' AND first_name = '果')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新马霜的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 14650,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '马' AND first_name = '霜')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新蒲薇的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 14947,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '蒲' AND first_name = '薇')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新邱高长青的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 14528,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '邱高' AND first_name = '长青')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新冉光俊的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 22555,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '冉' AND first_name = '光俊')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新田原的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 10958,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '田' AND first_name = '原')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 更新汪琳的社保缴费基数
UPDATE payroll.employee_salary_configs 
SET social_insurance_base = 20172,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM hr.employees WHERE last_name = '汪' AND first_name = '琳')
  AND effective_date <= '2025-02-01' 
  AND (end_date IS NULL OR end_date >= '2025-02-01');

-- 检查更新结果
SELECT 
    e.last_name || e.first_name as 姓名,
    esc.social_insurance_base as 更新后社保基数,
    esc.updated_at as 更新时间
FROM hr.employees e
JOIN payroll.employee_salary_configs esc ON e.id = esc.employee_id
WHERE e.last_name || e.first_name IN ('包晓静', '方敬玉', '高洪艳', '谷颖', '韩霜', '何婷', '胡潇', '黄明', '李薇', '李文媛', '廖希', '刘丹', '罗蓉', '吕果', '马霜', '蒲薇', '邱高长青', '冉光俊', '田原', '汪琳')
  AND esc.effective_date <= '2025-02-01' 
  AND (esc.end_date IS NULL OR esc.end_date >= '2025-02-01')
ORDER BY e.last_name, e.first_name;

COMMIT; 