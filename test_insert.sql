-- 测试插入单条记录
INSERT INTO reports.report_type_definitions 
(code, name, description, category, generator_class, generator_module, 
 template_config, default_config, required_permissions, is_active, is_system, 
 sort_order, usage_count)
VALUES 
('test_report', '测试报表', '这是一个测试报表', 'test',
 'TestGenerator', 'webapp.v2.services.batch_report_service',
 '{"format": "excel"}'::jsonb,
 '{"test": true}'::jsonb,
 '["test:view"]'::jsonb,
 true, false, 999, 0);

-- 验证插入
SELECT * FROM reports.report_type_definitions WHERE code = 'test_report'; 