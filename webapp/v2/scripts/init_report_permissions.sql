-- 报表管理权限初始化SQL脚本
-- 按照现有权限命名法创建权限记录

-- 1. 插入报表相关权限
INSERT INTO security.permissions (code, description) VALUES
-- 数据源管理权限
('report:view_datasources', '查看数据源列表'),
('report:create_datasource', '创建数据源'),
('report:edit_datasource', '编辑数据源'),
('report:delete_datasource', '删除数据源'),
('report:detect_fields', '检测数据源字段'),

-- 计算字段管理权限
('report:view_calculated_fields', '查看计算字段'),
('report:create_calculated_field', '创建计算字段'),
('report:edit_calculated_field', '编辑计算字段'),
('report:delete_calculated_field', '删除计算字段'),
('report:test_formula', '测试计算公式'),

-- 报表模板管理权限
('report:view_templates', '查看报表模板'),
('report:create_template', '创建报表模板'),
('report:edit_template', '编辑报表模板'),
('report:delete_template', '删除报表模板'),
('report:copy_template', '复制报表模板'),
('report:share_template', '分享报表模板'),

-- 报表执行权限
('report:execute_report', '执行报表'),
('report:view_executions', '查看执行记录'),
('report:export_report', '导出报表'),

-- 报表设计器权限
('report:use_designer', '使用报表设计器'),
('report:preview_report', '预览报表'),

-- 高级权限
('report:manage_global_fields', '管理全局计算字段'),
('report:view_all_templates', '查看所有用户的模板'),
('report:admin', '报表管理员权限')

ON CONFLICT (code) DO NOTHING;

-- 2. 创建报表管理员角色
INSERT INTO security.roles (code, name) VALUES 
('report_admin', '报表管理员')
ON CONFLICT (code) DO NOTHING;

-- 3. 创建报表用户角色
INSERT INTO security.roles (code, name) VALUES 
('report_user', '报表用户')
ON CONFLICT (code) DO NOTHING;

-- 4. 为报表管理员角色分配所有报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'report_admin'
  AND p.code LIKE 'report:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. 为报表用户角色分配基础权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'report_user'
  AND p.code IN (
    'report:view_datasources',
    'report:view_calculated_fields',
    'report:view_templates',
    'report:execute_report',
    'report:use_designer',
    'report:preview_report',
    'report:export_report'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. 验证权限创建结果
SELECT 
    '权限总数' as type,
    count(*) as count
FROM security.permissions 
WHERE code LIKE 'report:%'

UNION ALL

SELECT 
    '角色总数' as type,
    count(*) as count
FROM security.roles 
WHERE code IN ('report_admin', 'report_user')

UNION ALL

SELECT 
    '管理员权限数' as type,
    count(*) as count
FROM security.role_permissions rp
JOIN security.roles r ON rp.role_id = r.id
JOIN security.permissions p ON rp.permission_id = p.id
WHERE r.code = 'report_admin' AND p.code LIKE 'report:%'

UNION ALL

SELECT 
    '用户权限数' as type,
    count(*) as count
FROM security.role_permissions rp
JOIN security.roles r ON rp.role_id = r.id
JOIN security.permissions p ON rp.permission_id = p.id
WHERE r.code = 'report_user' AND p.code LIKE 'report:%';

-- 7. 显示创建的权限列表
SELECT 
    p.code,
    p.description,
    CASE 
        WHEN admin_perms.permission_id IS NOT NULL THEN '✓'
        ELSE ''
    END as "管理员",
    CASE 
        WHEN user_perms.permission_id IS NOT NULL THEN '✓'
        ELSE ''
    END as "普通用户"
FROM security.permissions p
LEFT JOIN (
    SELECT rp.permission_id
    FROM security.role_permissions rp
    JOIN security.roles r ON rp.role_id = r.id
    WHERE r.code = 'report_admin'
) admin_perms ON p.id = admin_perms.permission_id
LEFT JOIN (
    SELECT rp.permission_id
    FROM security.role_permissions rp
    JOIN security.roles r ON rp.role_id = r.id
    WHERE r.code = 'report_user'
) user_perms ON p.id = user_perms.permission_id
WHERE p.code LIKE 'report:%'
ORDER BY p.code; 