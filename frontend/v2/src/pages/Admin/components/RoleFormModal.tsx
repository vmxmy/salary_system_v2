import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Transfer, message } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Role, Permission, CreateRolePayload, UpdateRolePayload } from '../../../api/types';
import { createRole, updateRole } from '../../../api/roles';
import { getPermissions as apiGetPermissions } from '../../../api/permissions';

// Define a type for the form values to accurately reflect field types, esp. permission_ids as string[]
interface RoleFormValues {
  name: string;
  code: string;
  permission_ids?: string[]; 
}

interface RoleFormModalProps {
  visible: boolean;
  role?: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  visible,
  role,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['role', 'common']);
  const [form] = Form.useForm<RoleFormValues>();
  const [loading, setLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const isEditMode = !!role;

  // 获取所有权限
  const fetchAllPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const permissionsArray = await apiGetPermissions();
      setAllPermissions(permissionsArray || []);
    } catch (error) {
      message.error(t('message.fetch_permissions_error'));
      setAllPermissions([]);
    }
    setLoadingPermissions(false);
  };

  // 重置表单当模态框打开/关闭时
  useEffect(() => {
    if (visible) {
      fetchAllPermissions();
      if (role) {
        // 编辑模式：设置初始值
        const currentPermissionIdsAsStrings = (role.permissions || []).map(p => p.id.toString());
        setSelectedPermissions(currentPermissionIdsAsStrings);
        form.setFieldsValue({
          name: role.name,
          code: role.code,
          permission_ids: currentPermissionIdsAsStrings,
        });
      } else {
        // 新建模式：重置表单
        setSelectedPermissions([]);
        form.setFieldsValue({ name: '', code: '', permission_ids: [] });
      }
    } else {
      // 模态框关闭时重置
      setSelectedPermissions([]);
      form.resetFields();
    }
  }, [visible, role, form]);

  // 处理表单提交
  const handleFinish = async (values: RoleFormValues) => {
    setLoading(true);
    const submissionPermissionIds = selectedPermissions.map(idStr => parseInt(idStr, 10));

    try {
      if (isEditMode && role) {
        // 更新角色
        const payload: UpdateRolePayload = { 
          name: values.name !== role.name ? values.name : undefined,
          code: values.code !== role.code ? values.code : undefined, 
          permission_ids: submissionPermissionIds, 
        };
        const cleanedPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined)
        ) as UpdateRolePayload;
        
        await updateRole(role.id, cleanedPayload);
        message.success(t('message.update_role_success'));
      } else {
        // 创建角色
        if (!values.name || !values.code) {
          message.error(t('message.create_role_error_name_code_required'));
          setLoading(false);
          return;
        }
        const payload: CreateRolePayload = {
          name: values.name,
          code: values.code,
          permission_ids: submissionPermissionIds,
        };
        await createRole(payload);
        message.success(t('message.create_role_success'));
      }

      onSuccess();
    } catch (error: any) {
      
      let errorToDisplay: string = isEditMode 
        ? `${t('message.update_role_error')}` : `${t('message.create_role_error')}`; 

      if (error.response?.data) {
        const serverErrorData = error.response.data;
        const detail = serverErrorData.detail;

        if (typeof detail === 'string') {
          errorToDisplay = detail;
        } else if (typeof detail === 'object' && detail !== null) {
          // Try to extract common error message patterns from object 'detail'
          if (typeof detail.message === 'string') { // e.g. { message: "..." }
            errorToDisplay = detail.message;
          } else if (Array.isArray(detail) && detail.length > 0 && typeof detail[0].msg === 'string') { // FastAPI validation detail
            errorToDisplay = detail[0].msg;
          } else if (detail.error && typeof detail.error.message === 'string') { // e.g. { error: { message: "..."} }
             errorToDisplay = detail.error.message;
          } else if (typeof detail.error === 'string') { // e.g. { error: "..." }
             errorToDisplay = detail.error;
          }
        } else if (serverErrorData.error) {
           // Fallback to other common error structures if detail is not the primary source
           if (typeof serverErrorData.error === 'string') {
             errorToDisplay = serverErrorData.error;
           } else if (typeof serverErrorData.error === 'object' && serverErrorData.error !== null && typeof serverErrorData.error.message === 'string') {
             errorToDisplay = serverErrorData.error.message;
           }
        } else if (Array.isArray(serverErrorData.errors) && serverErrorData.errors.length > 0 && typeof serverErrorData.errors[0].message === 'string') {
            // Handle cases like { errors: [{ field: "f", message: "m" }] }
            errorToDisplay = serverErrorData.errors[0].message;
        }

        // For 500 errors, also log the full response data for easier debugging
        if (error.response.status === 500) {
        }
      }
      message.error(errorToDisplay);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditMode 
        ? t('modal.role_form.title.edit') : t('modal.role_form.title.create')}
      open={visible}
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnClose
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        name="roleForm"
        onFinish={handleFinish}
        onValuesChange={(changedValues, allValues) => {
        }}
      >
        <Form.Item
          name="name"
          label={t('modal.role_form.label.name')}
          rules={[{ required: true, message: t('modal.role_form.validation.name_required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="code"
          label={t('modal.role_form.label.code')}
          rules={[{ required: true, message: t('modal.role_form.validation.code_required') }]}
        >
          <Input disabled={isEditMode} />
        </Form.Item>
        <Form.Item
          label={t('modal.role_form.label.permissions')}
        >
          <Transfer
            dataSource={allPermissions.map(p => ({
              key: p.id.toString(),
              title: p.code,
              description: p.description || p.code,
            }))}
            targetKeys={selectedPermissions}
            onChange={(nextTargetKeys) => {
              setSelectedPermissions(nextTargetKeys as string[]);
              form.setFieldsValue({ permission_ids: nextTargetKeys as string[] });
            }}
            render={item => `${item.title} (${item.description})`}
            disabled={loadingPermissions}
            showSearch
          />
        </Form.Item>
        
        <Form.Item name="permission_ids" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleFormModal;