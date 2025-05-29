-- =====================================================
-- 权限系统现代化迁移脚本
-- 将所有 P_ 前缀权限迁移到现代化格式（冒号分隔）
-- =====================================================

BEGIN;

-- 第一步：创建所有现代化权限
INSERT INTO security.permissions (code, description) VALUES
-- 员工管理权限
('employee:create', '创建员工'),
('employee:view_list', '查看员工列表'),
('employee:view_detail', '查看员工详情'),
('employee:update', '更新员工信息'),
('employee:delete', '删除员工'),

-- 部门管理权限
('department:manage', '管理部门'),
('department:view', '查看部门'),

-- 用户管理权限
('user:create', '创建用户'),
('user:view_list', '查看用户列表'),
('user:view_detail', '查看用户详情'),
('user:update', '更新用户信息'),
('user:delete', '删除用户'),
('user:manage_roles', '管理用户角色'),

-- 角色管理权限
('role:create', '创建角色'),
('role:view_list', '查看角色列表'),
('role:view_detail', '查看角色详情'),
('role:update', '更新角色信息'),
('role:delete', '删除角色'),
('role:manage_permissions', '管理角色权限'),

-- 权限管理权限
('permission:create', '创建权限'),
('permission:view_list', '查看权限列表'),
('permission:view_detail', '查看权限详情'),
('permission:update', '更新权限信息'),
('permission:delete', '删除权限'),

-- 薪资管理权限
('payroll_run:create', '创建薪资执行'),
('payroll_run:view', '查看薪资执行'),
('payroll_run:execute', '执行薪资计算'),
('payroll_run:approve', '批准薪资执行'),
('payroll_run:export_bank', '导出银行文件'),
('payroll_run:view_reports', '查看薪资报表'),
('payroll_run:manage_all', '管理所有薪资执行'),

-- 薪资组件权限
('payroll_component:create', '创建薪资组件'),
('payroll_component:view', '查看薪资组件'),
('payroll_component:update', '更新薪资组件'),
('payroll_component:delete', '删除薪资组件'),
('payroll_component:assign', '分配薪资组件'),

-- 查找值管理权限
('lookup_type:manage', '管理查找类型'),
('lookup_value:view', '查看查找值'),
('lookup_value:manage', '管理查找值'),

-- 系统配置权限
('system_config:view', '查看系统配置'),
('system_config:manage', '管理系统配置'),

-- 超级管理员权限
('system:admin', '系统管理员'),

-- 报表管理权限（已存在的现代化权限）
('report:view_datasources', '查看数据源'),
('report:create_datasource', '创建数据源'),
('report:edit_datasource', '编辑数据源'),
('report:delete_datasource', '删除数据源'),
('report:detect_fields', '检测字段'),
('report:view_calculated_fields', '查看计算字段'),
('report:create_calculated_field', '创建计算字段'),
('report:edit_calculated_field', '编辑计算字段'),
('report:delete_calculated_field', '删除计算字段'),
('report:test_formula', '测试公式'),
('report:view_templates', '查看模板'),
('report:create_template', '创建模板'),
('report:edit_template', '编辑模板'),
('report:delete_template', '删除模板'),
('report:copy_template', '复制模板'),
('report:share_template', '分享模板'),
('report:execute', '执行报表'),
('report:view_executions', '查看执行历史'),
('report:export', '导出报表'),
('report:use_designer', '使用设计器'),
('report:preview', '预览报表'),
('report:manage_global_fields', '管理全局字段'),
('report:view_all_templates', '查看所有模板'),
('report:admin', '报表管理员')

-- 忽略重复权限错误
ON CONFLICT (code) DO NOTHING;

-- 第二步：创建现代化角色
INSERT INTO security.roles (code, name, description) VALUES
-- 系统管理员角色
('system_admin', '系统管理员', '拥有所有系统权限的超级管理员'),

-- 人事管理员角色
('hr_admin', '人事管理员', '负责员工信息管理的角色'),

-- 财务管理员角色  
('finance_admin', '财务管理员', '负责薪资计算和财务管理的角色'),

-- 报表管理员角色
('report_admin', '报表管理员', '负责报表管理的角色'),

-- 报表用户角色
('report_user', '报表用户', '基础报表查看用户'),

-- 普通员工角色
('employee_user', '普通员工', '普通员工基础权限')

-- 忽略重复角色错误
ON CONFLICT (code) DO NOTHING;

-- 第三步：为现代化角色分配权限

-- 系统管理员：拥有所有权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM security.roles r, security.permissions p
WHERE r.code = 'system_admin'
AND p.code IN (
    'employee:create', 'employee:view_list', 'employee:view_detail', 'employee:update', 'employee:delete',
    'department:manage', 'department:view',
    'user:create', 'user:view_list', 'user:view_detail', 'user:update', 'user:delete', 'user:manage_roles',
    'role:create', 'role:view_list', 'role:view_detail', 'role:update', 'role:delete', 'role:manage_permissions',
    'permission:create', 'permission:view_list', 'permission:view_detail', 'permission:update', 'permission:delete',
    'payroll_run:create', 'payroll_run:view', 'payroll_run:execute', 'payroll_run:approve', 'payroll_run:export_bank', 'payroll_run:view_reports', 'payroll_run:manage_all',
    'payroll_component:create', 'payroll_component:view', 'payroll_component:update', 'payroll_component:delete', 'payroll_component:assign',
    'lookup_type:manage', 'lookup_value:view', 'lookup_value:manage',
    'system_config:view', 'system_config:manage',
    'system:admin',
    'report:admin'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 人事管理员：员工和部门管理权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM security.roles r, security.permissions p
WHERE r.code = 'hr_admin'
AND p.code IN (
    'employee:create', 'employee:view_list', 'employee:view_detail', 'employee:update', 'employee:delete',
    'department:manage', 'department:view',
    'lookup_value:view', 'lookup_value:manage',
    'report:view_templates', 'report:execute', 'report:export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 财务管理员：薪资管理权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM security.roles r, security.permissions p
WHERE r.code = 'finance_admin'
AND p.code IN (
    'employee:view_list', 'employee:view_detail',
    'payroll_run:create', 'payroll_run:view', 'payroll_run:execute', 'payroll_run:approve', 'payroll_run:export_bank', 'payroll_run:view_reports',
    'payroll_component:create', 'payroll_component:view', 'payroll_component:update', 'payroll_component:delete', 'payroll_component:assign',
    'lookup_value:view',
    'report:view_templates', 'report:execute', 'report:export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 报表管理员：所有报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM security.roles r, security.permissions p
WHERE r.code = 'report_admin'
AND p.code LIKE 'report:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 报表用户：基础报表权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM security.roles r, security.permissions p
WHERE r.code = 'report_user'
AND p.code IN (
    'report:view_templates', 'report:execute', 'report:export', 'report:use_designer', 'report:preview'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 普通员工：基础查看权限
INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM security.roles r, security.permissions p
WHERE r.code = 'employee_user'
AND p.code IN (
    'employee:view_detail',  -- 只能查看自己的信息
    'lookup_value:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 第四步：将admin用户分配到system_admin角色
INSERT INTO security.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM security.users u, security.roles r
WHERE u.username = 'admin' 
AND r.code = 'system_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 第五步：清理阶段 - 注释掉旧权限删除，保持兼容性
-- 注意：先不删除旧权限，确保系统稳定运行后再清理

COMMIT;

-- 验证脚本执行结果
SELECT 'Modern permissions created:', COUNT(*) 
FROM security.permissions 
WHERE code NOT LIKE 'P_%';

SELECT 'Modern roles created:', COUNT(*) 
FROM security.roles 
WHERE code IN ('system_admin', 'hr_admin', 'finance_admin', 'report_admin', 'report_user', 'employee_user');

SELECT 'Admin user modern roles:', r.code
FROM security.users u
JOIN security.user_roles ur ON u.id = ur.user_id  
JOIN security.roles r ON ur.role_id = r.id
WHERE u.username = 'admin' AND r.code NOT LIKE 'P_%'; 