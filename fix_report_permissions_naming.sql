-- 修正报表权限命名，使其与后端代码一致
-- 将数据库中的混合格式权限名称更新为后端期望的下划线格式

BEGIN;

-- 1. 更新数据源相关权限
UPDATE security.permissions SET code = 'report:view_datasources' WHERE code = 'report:datasource_view_list';
UPDATE security.permissions SET code = 'report:create_datasource' WHERE code = 'report:datasource_create';
UPDATE security.permissions SET code = 'report:edit_datasource' WHERE code = 'report:datasource_update';
UPDATE security.permissions SET code = 'report:delete_datasource' WHERE code = 'report:datasource_delete';
UPDATE security.permissions SET code = 'report:manage_datasources' WHERE code = 'report:datasource_manage';
UPDATE security.permissions SET code = 'report:view_datasource_detail' WHERE code = 'report:datasource_view_detail';

-- 2. 更新计算字段相关权限
UPDATE security.permissions SET code = 'report:view_calculated_fields' WHERE code = 'report:calculated_field_view_list';
UPDATE security.permissions SET code = 'report:create_calculated_field' WHERE code = 'report:calculated_field_create';
UPDATE security.permissions SET code = 'report:edit_calculated_field' WHERE code = 'report:calculated_field_update';
UPDATE security.permissions SET code = 'report:delete_calculated_field' WHERE code = 'report:calculated_field_delete';
UPDATE security.permissions SET code = 'report:manage_calculated_fields' WHERE code = 'report:calculated_field_manage';
UPDATE security.permissions SET code = 'report:view_calculated_field_detail' WHERE code = 'report:calculated_field_view_detail';

-- 3. 更新模板相关权限
UPDATE security.permissions SET code = 'report:view_templates' WHERE code = 'report:template_view_list';
UPDATE security.permissions SET code = 'report:create_template' WHERE code = 'report:template_create';
UPDATE security.permissions SET code = 'report:edit_template' WHERE code = 'report:template_update';
UPDATE security.permissions SET code = 'report:delete_template' WHERE code = 'report:template_delete';
UPDATE security.permissions SET code = 'report:manage_templates' WHERE code = 'report:template_manage';
UPDATE security.permissions SET code = 'report:view_template_detail' WHERE code = 'report:template_view_detail';

-- 4. 其他报表权限保持不变（已经是正确格式）
-- report:view, report:design, report:export, report:print

-- 验证更新结果
SELECT 'Updated permissions:' as status;
SELECT code, description FROM security.permissions WHERE code LIKE 'report:%' ORDER BY code;

COMMIT; 