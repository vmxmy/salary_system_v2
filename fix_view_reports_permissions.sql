-- 视图报表模块权限修复脚本
-- 创建时间: 2024年
-- 说明: 撤销之前错误的权限分配，重新按照实际角色进行分配

-- ========== 第一步：撤销之前的错误权限分配 ==========

-- 1. 删除所有视图报表相关的权限分配（保留权限本身，只删除角色分配）
DELETE FROM security.role_permissions 
WHERE permission_id IN (
    SELECT id FROM security.permissions 
    WHERE code IN (
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
);

-- 显示撤销结果
SELECT '已撤销所有视图报表权限的角色分配' as step1_status;

-- ========== 第二步：重新分配正确的权限 ==========

-- 2. 为SUPER_ADMIN角色（ID: 3）分配所有视图报表权限
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

-- 3. 为report_admin角色（ID: 6）分配视图报表管理权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'report_admin'
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

-- 4. 为HR角色（ID: 4）分配视图报表使用权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'HR'
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

-- 5. 为FA角色（ID: 5）分配视图报表使用权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'FA'
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

-- 6. 为report_user角色（ID: 7）分配基础视图报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'report_user'
AND p.code IN (
    'report:view_reports',
    'report:query_view_data',
    'report:export_view_data'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ========== 第三步：验证修复结果 ==========

-- 7. 验证权限重新分配结果
SELECT 
    p.code as permission_code,
    p.description as permission_description,
    COUNT(rp.role_id) as assigned_roles_count
FROM security.permissions p
LEFT JOIN security.role_permissions rp ON p.id = rp.permission_id
WHERE p.code LIKE 'report:%view%' OR p.code LIKE 'report:%sql%' OR p.code LIKE 'report:%create%' OR p.code LIKE 'report:%edit%'
GROUP BY p.id, p.code, p.description
ORDER BY p.code;

-- 8. 查看各角色的视图报表权限分配情况（修复后）
SELECT 
    r.id as role_id,
    r.code as role_code,
    r.name as role_name,
    COUNT(p.id) as permission_count,
    STRING_AGG(p.code, ', ' ORDER BY p.code) as permissions
FROM security.roles r
LEFT JOIN security.role_permissions rp ON r.id = rp.role_id
LEFT JOIN security.permissions p ON rp.permission_id = p.id AND p.code LIKE 'report:%'
WHERE r.id IN (3, 4, 5, 6, 7) -- 只显示相关角色
GROUP BY r.id, r.code, r.name
ORDER BY r.id;

-- 9. 显示修复后的角色权限级别
SELECT 
    r.id,
    r.code,
    r.name,
    CASE 
        WHEN r.code = 'SUPER_ADMIN' THEN '✅ 拥有所有权限 (10个权限)'
        WHEN r.code = 'report_admin' THEN '✅ 报表管理员 - 完整管理权限 (10个权限)'
        WHEN r.code = 'HR' THEN '✅ 人事负责人 - 创建编辑权限 (7个权限)'
        WHEN r.code = 'FA' THEN '✅ 财务 - 创建编辑权限 (7个权限)'
        WHEN r.code = 'report_user' THEN '✅ 报表用户 - 只读权限 (3个权限)'
        ELSE '❌ 未分配视图报表权限'
    END as view_report_access_level,
    (
        SELECT COUNT(*) 
        FROM security.role_permissions rp2 
        JOIN security.permissions p2 ON rp2.permission_id = p2.id 
        WHERE rp2.role_id = r.id AND p2.code LIKE 'report:%'
    ) as actual_permission_count
FROM security.roles r
WHERE r.id IN (3, 4, 5, 6, 7)
ORDER BY r.id;

-- 完成提示
SELECT '🎉 视图报表模块权限修复完成！已按照实际角色重新分配权限。' as final_status; 