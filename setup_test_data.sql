-- 设置测试数据：数据源和报表模板
-- 用于测试视图优化策略

-- 1. 创建测试数据源
INSERT INTO config.report_data_sources (
    id, name, code, description, connection_type, schema_name, table_name, 
    source_type, is_active, is_system, sort_order, created_at, updated_at, created_by
) VALUES 
(1, '薪资条目数据源', 'payroll_entries_ds', '薪资条目详细数据', 'database', 'payroll', 'payroll_entries', 'table', true, false, 1, NOW(), NOW(), 1),
(2, '薪资周期数据源', 'payroll_periods_ds', '薪资周期管理数据', 'database', 'payroll', 'payroll_periods', 'table', true, false, 2, NOW(), NOW(), 1),
(3, '薪资运行数据源', 'payroll_runs_ds', '薪资运行记录数据', 'database', 'payroll', 'payroll_runs', 'table', true, false, 3, NOW(), NOW(), 1),
(4, '员工基础数据源', 'employees_ds', '员工基础信息数据', 'database', 'hr', 'employees', 'table', true, false, 4, NOW(), NOW(), 1),
(5, '薪资组件定义数据源', 'payroll_components_ds', '薪资组件配置数据', 'database', 'config', 'payroll_component_definitions', 'table', true, false, 5, NOW(), NOW(), 1)
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

-- 2. 检查报表模板表结构
\d config.report_templates

-- 3. 验证数据源插入结果
SELECT 'Data Sources Created:' as info;
SELECT id, name, schema_name, table_name, source_type FROM config.report_data_sources ORDER BY id;

-- 4. 创建测试报表模板
INSERT INTO config.report_templates (
    id, name, description, data_source_id, is_public, is_active,
    created_by, created_at, updated_at
) VALUES 
(1, '薪资条目详细报表', '显示薪资条目的详细信息', 1, true, true, 1, NOW(), NOW()),
(2, '薪资周期汇总报表', '薪资周期的汇总统计', 2, true, true, 1, NOW(), NOW()),
(3, '薪资运行状态报表', '薪资运行的状态监控', 3, true, true, 1, NOW(), NOW()),
(4, '员工基础信息报表', '员工的基础信息展示', 4, true, true, 1, NOW(), NOW()),
(5, '薪资组件配置报表', '薪资组件的配置信息', 5, true, true, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    data_source_id = EXCLUDED.data_source_id,
    is_public = EXCLUDED.is_public,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 5. 重置序列
SELECT setval('config.report_data_sources_id_seq', (SELECT MAX(id) FROM config.report_data_sources));
SELECT setval('config.report_templates_id_seq', (SELECT MAX(id) FROM config.report_templates));

-- 6. 验证数据
SELECT 'Data Sources:' as info;
SELECT id, name, schema_name, table_name, source_type FROM config.report_data_sources ORDER BY id;

SELECT 'Report Templates:' as info;
SELECT id, name, description, data_source_id FROM config.report_templates ORDER BY id; 