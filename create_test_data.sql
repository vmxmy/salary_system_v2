-- 创建报表优化测试所需的数据库表和测试数据

-- 1. 创建数据源表
CREATE TABLE IF NOT EXISTS reports.report_data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schema_name VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    view_name VARCHAR(100),
    source_type VARCHAR(50) NOT NULL DEFAULT 'table', -- 'table', 'view', 'query'
    custom_query TEXT,
    connection_config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建报表模板表
CREATE TABLE IF NOT EXISTS reports.report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_source_id INTEGER REFERENCES reports.report_data_sources(id),
    template_config JSONB,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建数据源字段表
CREATE TABLE IF NOT EXISTS reports.report_data_source_fields (
    id SERIAL PRIMARY KEY,
    data_source_id INTEGER REFERENCES reports.report_data_sources(id),
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(100),
    display_name VARCHAR(255),
    description TEXT,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 插入测试数据源
INSERT INTO reports.report_data_sources (id, name, description, schema_name, table_name, source_type) VALUES
(1, '薪资条目数据源', '薪资条目详细信息', 'payroll', 'payroll_entries', 'table'),
(2, '薪资周期数据源', '薪资周期管理', 'payroll', 'payroll_periods', 'table'),
(3, '薪资运行数据源', '薪资运行记录', 'payroll', 'payroll_runs', 'table'),
(4, '员工基础数据源', '员工基础信息', 'hr', 'employees', 'table'),
(5, '薪资条目优化视图', '薪资条目优化查询视图', 'public', NULL, 'view')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    schema_name = EXCLUDED.schema_name,
    table_name = EXCLUDED.table_name,
    source_type = EXCLUDED.source_type;

-- 设置视图名称
UPDATE reports.report_data_sources SET view_name = 'v_payroll_entries_detailed' WHERE id = 5;

-- 5. 插入测试报表模板
INSERT INTO reports.report_templates (id, name, description, data_source_id, template_config) VALUES
(1, '薪资条目报表', '详细的薪资条目报表', 1, '{"has_aggregation": false, "has_complex_joins": false}'),
(2, '薪资汇总报表', '按部门汇总的薪资报表', 1, '{"has_aggregation": true, "has_complex_joins": true}'),
(3, '员工薪资明细', '员工个人薪资明细报表', 1, '{"has_aggregation": false, "has_complex_joins": true}'),
(4, '薪资周期报表', '薪资周期统计报表', 2, '{"has_aggregation": true, "has_complex_joins": false}'),
(5, '优化视图测试报表', '使用优化视图的测试报表', 5, '{"has_aggregation": false, "has_complex_joins": false}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    data_source_id = EXCLUDED.data_source_id,
    template_config = EXCLUDED.template_config;

-- 6. 插入测试字段定义
INSERT INTO reports.report_data_source_fields (data_source_id, field_name, field_type, display_name) VALUES
(1, 'id', 'INTEGER', 'ID'),
(1, 'employee_id', 'INTEGER', '员工ID'),
(1, 'payroll_run_id', 'INTEGER', '薪资运行ID'),
(1, 'base_salary', 'DECIMAL', '基本工资'),
(1, 'total_earnings', 'DECIMAL', '总收入'),
(1, 'total_deductions', 'DECIMAL', '总扣除'),
(1, 'net_pay', 'DECIMAL', '实发工资'),
(2, 'id', 'INTEGER', 'ID'),
(2, 'period_name', 'VARCHAR', '周期名称'),
(2, 'start_date', 'DATE', '开始日期'),
(2, 'end_date', 'DATE', '结束日期'),
(2, 'status', 'VARCHAR', '状态'),
(3, 'id', 'INTEGER', 'ID'),
(3, 'payroll_period_id', 'INTEGER', '薪资周期ID'),
(3, 'run_date', 'TIMESTAMP', '运行日期'),
(3, 'status', 'VARCHAR', '状态'),
(3, 'total_employees', 'INTEGER', '员工总数')
ON CONFLICT DO NOTHING;

-- 7. 重置序列
SELECT setval('reports.report_data_sources_id_seq', (SELECT MAX(id) FROM reports.report_data_sources));
SELECT setval('reports.report_templates_id_seq', (SELECT MAX(id) FROM reports.report_templates));

-- 8. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_report_data_sources_schema_table ON reports.report_data_sources(schema_name, table_name);
CREATE INDEX IF NOT EXISTS idx_report_templates_data_source ON reports.report_templates(data_source_id);
CREATE INDEX IF NOT EXISTS idx_report_data_source_fields_source ON reports.report_data_source_fields(data_source_id);

COMMIT; 