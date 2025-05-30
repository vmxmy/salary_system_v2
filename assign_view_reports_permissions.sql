-- 视图报表模块权限分配脚本
-- 创建时间: 2024年
-- 说明: 为视图报表模块创建权限并分配给相应角色

-- ========== 第一步：创建视图报表相关权限 ==========

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

-- 显示权限创建结果
SELECT '视图报表权限创建完成' as step1_status;

-- ========== 第二步：为各角色分配权限 ==========

-- 1. 为SUPER_ADMIN角色（ID: 3）分配所有视图报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 3, p.id
FROM security.permissions p
WHERE p.code IN (
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

-- 2. 为report_admin角色（ID: 6）分配管理权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 6, p.id
FROM security.permissions p
WHERE p.code IN (
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

-- 3. 为report_user角色（ID: 7）分配查看权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 7, p.id
FROM security.permissions p
WHERE p.code IN (
    'report:view_reports',
    'report:query_view_data',
    'report:export_view_data',
    'report:view_execution_logs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. 为HR角色（ID: 4）分配基础权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 4, p.id
FROM security.permissions p
WHERE p.code IN (
    'report:view_reports',
    'report:create_view_report',
    'report:edit_view_report',
    'report:query_view_data',
    'report:export_view_data',
    'report:validate_sql'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. 为FA角色（ID: 5）分配财务相关权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT 5, p.id
FROM security.permissions p
WHERE p.code IN (
    'report:view_reports',
    'report:query_view_data',
    'report:export_view_data',
    'report:view_execution_logs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ========== 第三步：验证权限分配结果 ==========

-- 查看权限分配情况
SELECT 
    r.name as role_name,
    r.code as role_code,
    p.code as permission_code,
    p.description as permission_description
FROM security.role_permissions rp
JOIN security.roles r ON rp.role_id = r.id
JOIN security.permissions p ON rp.permission_id = p.id
WHERE p.code LIKE 'report:%'
ORDER BY r.id, p.code;

-- 显示完成状态
SELECT '视图报表权限分配完成！' as final_status;

-- ========== 权限分配说明 ==========
/*
权限分配说明：

1. SUPER_ADMIN (超级管理员) - 所有权限
   - 完整的视图报表管理权限

2. report_admin (报表管理员) - 管理权限  
   - 完整的视图报表管理权限

3. report_user (报表用户) - 查看权限
   - 查看报表列表
   - 查询报表数据
   - 导出报表数据
   - 查看执行记录

4. HR (人事负责人) - 业务权限
   - 查看报表列表
   - 创建和编辑报表
   - 查询和导出数据
   - 验证SQL语句

5. FA (财务) - 查看权限
   - 查看报表列表
   - 查询报表数据
   - 导出报表数据
   - 查看执行记录
*/ 