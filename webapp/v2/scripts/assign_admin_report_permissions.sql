-- 为admin用户分配报表管理权限
-- 假设admin用户已存在，用户名为'admin'

-- 1. 为admin用户分配report_admin角色
INSERT INTO security.user_roles (user_id, role_id)
SELECT 
    u.id as user_id,
    r.id as role_id
FROM security.users u
CROSS JOIN security.roles r
WHERE u.username = 'admin'
  AND r.code = 'report_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 2. 验证admin用户的报表权限
SELECT 
    u.username,
    r.name as role_name,
    p.code as permission_code,
    p.description as permission_description
FROM security.users u
JOIN security.user_roles ur ON u.id = ur.user_id
JOIN security.roles r ON ur.role_id = r.id
JOIN security.role_permissions rp ON r.id = rp.role_id
JOIN security.permissions p ON rp.permission_id = p.id
WHERE u.username = 'admin'
  AND p.code LIKE 'report:%'
ORDER BY p.code;

-- 3. 显示admin用户的所有角色
SELECT 
    u.username,
    r.code as role_code,
    r.name as role_name
FROM security.users u
JOIN security.user_roles ur ON u.id = ur.user_id
JOIN security.roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
ORDER BY r.code; 