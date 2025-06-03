import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload } from '../../../api/types';
import { createPermission, updatePermission } from '../../../api/permissions';

interface PermissionFormModalProps {
  visible: boolean;
  permission?: Permission | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  visible,
  permission,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['permission', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!permission;

  // 重置表单当模态框打开/关闭时
  useEffect(() => {
    if (visible) {
      if (permission) {
        // 编辑模式：设置初始值
        form.setFieldsValue({
          code: permission.code,
          description: permission.description,
        });
      } else {
        // 新建模式：重置表单
        form.resetFields();
      }
    }
  }, [visible, permission, form]);

  // 处理表单提交
  const handleFinish = async (values: CreatePermissionPayload | UpdatePermissionPayload) => {
    setLoading(true);
    try {
      if (isEditMode && permission) {
        // 更新权限
        await updatePermission(permission.id, values);
        message.success(t('list_page.message.update_success', { permissionCode: values.code }));
      } else {
        // 创建权限
        const newPermission = await createPermission(values as CreatePermissionPayload);
        message.success(t('list_page.message.create_success', { permissionCode: newPermission.code }));
      }

      onSuccess();
    } catch (error: any) {
      const errorMessage = isEditMode 
        ? `${t('list_page.message.update_error_prefix')}${error.message}`
        : `${t('list_page.message.create_error_prefix')}${error.message}`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? t('form.title.edit') : t('form.title.create')}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
              destroyOnHidden
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        name="permissionForm"
        onFinish={handleFinish}
      >
        <Form.Item
          name="code"
          label={t('form.label.code')}
          rules={[{ required: true, message: t('form.validation.code_required') }]}
        >
          <Input placeholder={t('form.placeholder.code')} />
        </Form.Item>
        <Form.Item
          name="description"
          label={t('form.label.description')}
        >
          <Input.TextArea rows={3} placeholder={t('form.placeholder.description')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PermissionFormModal;