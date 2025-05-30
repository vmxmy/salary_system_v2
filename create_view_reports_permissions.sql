-- 视图报表模块权限创建脚本
-- 创建时间: 2024年
-- 说明: 为视图报表模块创建必要的权限和角色分配

-- 1. 创建视图报表相关权限
INSERT INTO security.permissions (code, description) VALUES 
('report:view_reports', '查看视图报表列表'),
('report:create_view_report', '创建视图报表'),
('report:edit_view_report', '编辑视图报表'),
('report:delete_view_report', '删除视图报表'),
('report:sync_view_report', '同步视图报表到数据库'),
('report:validate_sql', '验证SQL查询语句'),
('report:query_view_data', '查询视图报表数据'),
('report:export_view_data', '导出视图报表数据'),
('report:view_execution_logs', '查看视图报表执行记录'),
('report:manage_view_categories', '管理视图报表分类')
ON CONFLICT (code) DO NOTHING;

-- 2. 为SUPER_ADMIN角色分配所有视图报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'SUPER_ADMIN'
AND p.code IN (
    'report:view_reports',
    'report:create_view_report',
    'report:edit_view_report',
    'report:delete_view_report',
    'report:sync_view_report',
    'report:validate_sql',
    'report:query_view_data',
    'report:export_view_data',
    'report:view_execution_logs',
    'report:manage_view_categories'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. 为ADMIN角色分配视图报表管理权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'ADMIN'
AND p.code IN (
    'report:view_reports',
    'report:create_view_report',
    'report:edit_view_report',
    'report:delete_view_report',
    'report:sync_view_report',
    'report:validate_sql',
    'report:query_view_data',
    'report:export_view_data',
    'report:view_execution_logs',
    'report:manage_view_categories'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. 为HR_MANAGER角色分配视图报表使用权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'HR_MANAGER'
AND p.code IN (
    'report:view_reports',
    'report:create_view_report',
    'report:edit_view_report',
    'report:validate_sql',
    'report:query_view_data',
    'report:export_view_data',
    'report:view_execution_logs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. 为FINANCE_MANAGER角色分配视图报表使用权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'FINANCE_MANAGER'
AND p.code IN (
    'report:view_reports',
    'report:create_view_report',
    'report:edit_view_report',
    'report:validate_sql',
    'report:query_view_data',
    'report:export_view_data',
    'report:view_execution_logs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. 为HR_SPECIALIST角色分配基础视图报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'HR_SPECIALIST'
AND p.code IN (
    'report:view_reports',
    'report:query_view_data',
    'report:export_view_data'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 7. 验证权限创建结果
SELECT 
    p.code as permission_code,
    p.description as permission_description,
    COUNT(rp.role_id) as assigned_roles_count
FROM security.permissions p
LEFT JOIN security.role_permissions rp ON p.id = rp.permission_id
WHERE p.code LIKE 'report:%view%' OR p.code LIKE 'report:%sql%'
GROUP BY p.id, p.code, p.description
ORDER BY p.code;

-- 8. 查看各角色的视图报表权限分配情况
SELECT 
    r.code as role_code,
    r.name as role_name,
    STRING_AGG(p.code, ', ' ORDER BY p.code) as permissions
FROM security.roles r
JOIN security.role_permissions rp ON r.id = rp.role_id
JOIN security.permissions p ON rp.permission_id = p.id
WHERE p.code LIKE 'report:%'
GROUP BY r.id, r.code, r.name
ORDER BY r.code;

-- 完成提示
SELECT '视图报表模块权限创建完成！' as status; 