-- 设置测试数据：数据源和报表模板（修复版）
-- 用于测试视图优化策略

-- 1. 首先检查是否有用户数据，如果没有则创建一个系统用户
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM security.users WHERE id = 1) THEN
        INSERT INTO security.users (id, username, email, hashed_password, is_active, is_superuser, created_at, updated_at)
        VALUES (1, 'system', 'system@example.com', 'hashed_password_placeholder', true, true, NOW(), NOW());
    END IF;
END $$;

-- 2. 创建测试数据源（不指定created_by，让其为NULL）
INSERT INTO config.report_data_sources (
    id, name, code, description, connection_type, schema_name, table_name, 
    source_type, is_active, is_system, sort_order, created_at, updated_at
) VALUES 
(1, '薪资条目数据源', 'payroll_entries_ds', '薪资条目详细数据', 'database', 'payroll', 'payroll_entries', 'table', true, false, 1, NOW(), NOW()),
(2, '薪资周期数据源', 'payroll_periods_ds', '薪资周期管理数据', 'database', 'payroll', 'payroll_periods', 'table', true, false, 2, NOW(), NOW()),
(3, '薪资运行数据源', 'payroll_runs_ds', '薪资运行记录数据', 'database', 'payroll', 'payroll_runs', 'table', true, false, 3, NOW(), NOW()),
(4, '员工基础数据源', 'employees_ds', '员工基础信息数据', 'database', 'hr', 'employees', 'table', true, false, 4, NOW(), NOW()),
(5, '薪资组件定义数据源', 'payroll_components_ds', '薪资组件配置数据', 'database', 'config', 'payroll_component_definitions', 'table', true, false, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    connection_type = EXCLUDED.connection_type,
    schema_name = EXCLUDED.schema_name,
    table_name = EXCLUDED.table_name,
    source_type = EXCLUDED.source_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. 创建测试报表模板（包含必需的template_config字段）
INSERT INTO config.report_templates (
    id, name, description, data_source_id, template_config, is_public, is_active,
    sort_order, usage_count, created_by, created_at, updated_at
) VALUES 
(1, '薪资条目详细报表', '显示薪资条目的详细信息', 1, '{"fields": [], "filters": [], "sorting": []}', true, true, 1, 0, 1, NOW(), NOW()),
(2, '薪资周期汇总报表', '薪资周期的汇总统计', 2, '{"fields": [], "filters": [], "sorting": []}', true, true, 2, 0, 1, NOW(), NOW()),
(3, '薪资运行状态报表', '薪资运行的状态监控', 3, '{"fields": [], "filters": [], "sorting": []}', true, true, 3, 0, 1, NOW(), NOW()),
(4, '员工基础信息报表', '员工的基础信息展示', 4, '{"fields": [], "filters": [], "sorting": []}', true, true, 4, 0, 1, NOW(), NOW()),
(5, '薪资组件配置报表', '薪资组件的配置信息', 5, '{"fields": [], "filters": [], "sorting": []}', true, true, 5, 0, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    data_source_id = EXCLUDED.data_source_id,
    template_config = EXCLUDED.template_config,
    is_public = EXCLUDED.is_public,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 4. 验证数据
SELECT 'Data Sources Created:' as info;
SELECT id, name, schema_name, table_name, source_type FROM config.report_data_sources ORDER BY id;

SELECT 'Report Templates Created:' as info;
SELECT id, name, description, data_source_id FROM config.report_templates ORDER BY id; 