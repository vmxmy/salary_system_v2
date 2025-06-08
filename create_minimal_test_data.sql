-- 创建最简化的测试数据
-- 使用现有的admin用户（ID=17）

-- 1. 创建数据源（使用现有admin用户ID=17）
INSERT INTO config.report_data_sources (
    name, code, connection_type, schema_name, table_name, source_type, 
    is_active, is_system, sort_order, created_by, created_at, updated_at
) VALUES 
('薪资条目数据源', 'payroll_entries_ds', 'database', 'payroll', 'payroll_entries', 'table', true, false, 1, 17, NOW(), NOW()),
('薪资周期数据源', 'payroll_periods_ds', 'database', 'payroll', 'payroll_periods', 'table', true, false, 2, 17, NOW(), NOW()),
('员工基础数据源', 'employees_ds', 'database', 'hr', 'employees', 'table', true, false, 3, 17, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    schema_name = EXCLUDED.schema_name,
    table_name = EXCLUDED.table_name,
    updated_at = NOW();

-- 2. 创建报表模板（使用现有admin用户ID=17）
INSERT INTO config.report_templates (
    name, template_config, is_public, is_active, sort_order, usage_count, 
    created_by, created_at, updated_at
) VALUES 
('薪资条目详细报表', '{"fields": [], "filters": [], "sorting": []}', true, true, 1, 0, 17, NOW(), NOW()),
('薪资周期汇总报表', '{"fields": [], "filters": [], "sorting": []}', true, true, 2, 0, 17, NOW(), NOW()),
('员工基础信息报表', '{"fields": [], "filters": [], "sorting": []}', true, true, 3, 0, 17, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
    template_config = EXCLUDED.template_config,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. 更新模板的数据源关联
UPDATE config.report_templates 
SET data_source_id = (SELECT id FROM config.report_data_sources WHERE code = 'payroll_entries_ds')
WHERE name = '薪资条目详细报表';

UPDATE config.report_templates 
SET data_source_id = (SELECT id FROM config.report_data_sources WHERE code = 'payroll_periods_ds')
WHERE name = '薪资周期汇总报表';

UPDATE config.report_templates 
SET data_source_id = (SELECT id FROM config.report_data_sources WHERE code = 'employees_ds')
WHERE name = '员工基础信息报表';

-- 4. 验证数据
SELECT 'Created Data Sources:' as info;
SELECT id, name, code, schema_name, table_name, created_by FROM config.report_data_sources ORDER BY id;

SELECT 'Created Templates:' as info;
SELECT id, name, data_source_id, created_by FROM config.report_templates ORDER BY id; 