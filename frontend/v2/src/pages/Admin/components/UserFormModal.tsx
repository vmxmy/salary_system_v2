import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Switch, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import type { User as ApiUser, Role as ApiRole, CreateUserPayload, UpdateUserPayload } from '../../../api/types';
import { createUser, updateUser } from '../../../api/users';
import { getRoles } from '../../../api/roles';

const { Option } = Select;

// Interface for form values when creating a user, including confirm_password
interface UserFormCreationValues extends CreateUserPayload {
  confirm_password?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_id_card?: string;
}

// Interface for form values when updating a user
interface UserFormUpdateValues extends Omit<UpdateUserPayload, 'role_ids'> {
  username?: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_id_card?: string;
  role_ids?: number[];
}

// Combined type for the form to handle both creation and update
type UserFormValues = UserFormCreationValues | UserFormUpdateValues;

interface UserFormModalProps {
  visible: boolean;
  user?: ApiUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['user', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<ApiRole[]>([]);

  const isEditMode = !!user;

  // 获取所有角色
  const fetchAllRoles = async () => {
    try {
      const rolesResponse = await getRoles({ page: 1, size: 100 });
      if (rolesResponse && rolesResponse.data) {
        setAllRoles(rolesResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      message.error(t('message.fetch_roles_error'));
    }
  };

  // 重置表单当模态框打开/关闭时
  useEffect(() => {
    if (visible) {
      fetchAllRoles();
      if (user) {
        // 编辑模式：设置初始值
        form.setFieldsValue({
          username: user.username,
          employee_first_name: user.employee?.first_name || '',
          employee_last_name: user.employee?.last_name || '',
          employee_id_card: user.employee?.id_number || '',
          is_active: user.is_active,
          role_ids: user.roles?.map(role => role.id) || [],
        });
      } else {
        // 新建模式：重置表单并设置默认值
        form.resetFields();
        form.setFieldsValue({
          is_active: true,
        });
      }
    }
  }, [visible, user, form]);

  // 处理表单提交
  const handleFinish = async (values: UserFormValues) => {
    setLoading(true);
    try {
      if (isEditMode && user) {
        // 更新用户
        const payload: UpdateUserPayload = {
          is_active: values.is_active,
          role_ids: (values as UserFormUpdateValues).role_ids?.map(id => Number(id)),
          employee_first_name: (values as UserFormUpdateValues).employee_first_name,
          employee_last_name: (values as UserFormUpdateValues).employee_last_name,
          employee_id_card: (values as UserFormUpdateValues).employee_id_card,
        };

        const cleanedPayload = Object.fromEntries(
          Object.entries(payload).filter(([key, v]) => {
            if (key === 'is_active') return true;
            if (['employee_first_name', 'employee_last_name', 'employee_id_card'].includes(key)) return true;
            return v !== undefined;
          })
        ) as UpdateUserPayload;

        await updateUser(user.id, cleanedPayload);
        message.success(t('message.update_user_success', { username: user.username }));
      } else {
        // 创建用户
        const { confirm_password, employee_id, ...apiValues } = values as UserFormCreationValues & { employee_id?: any };
        
        const payloadForApi: CreateUserPayload = {
          username: apiValues.username,
          password: apiValues.password as string,
          is_active: apiValues.is_active === undefined ? true : apiValues.is_active,
          role_ids: apiValues.role_ids?.map(id => Number(id)) || [],
          employee_first_name: apiValues.employee_first_name,
          employee_last_name: apiValues.employee_last_name,
          employee_id_card: apiValues.employee_id_card,
        };
        
        const cleanedPayloadForApi = Object.fromEntries(
          Object.entries(payloadForApi).filter(([_, v]) => v !== undefined)
        ) as CreateUserPayload;

        const newUser = await createUser(cleanedPayloadForApi);
        message.success(t('message.create_user_success', { username: newUser.username }));
      }

      onSuccess();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      let errorMsg = isEditMode 
        ? t('message.update_user_error.default')
        : t('message.create_user_error.default');

      // 尝试获取后端详细错误信息
      const backendError = error.response?.data;
      if (backendError) {
        if (backendError.detail?.details && typeof backendError.detail.details === 'string') {
          errorMsg = backendError.detail.details;
        } else if (backendError.detail && typeof backendError.detail === 'string') {
          errorMsg = backendError.detail;
        } else if (backendError.error?.details && typeof backendError.error.details === 'string') {
          errorMsg = backendError.error.details;
        } else if (backendError.error?.message && typeof backendError.error.message === 'string') {
          errorMsg = backendError.error.message;
        } else if (typeof backendError === 'string') {
          errorMsg = backendError;
        }
      }
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditMode ? t('modal.title.edit_user') : t('modal.title.create_user')}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        name="userForm"
        onFinish={handleFinish}
      >
        <Form.Item
          name="username"
          label={t('form.username.label')}
          rules={[{ required: true, message: t('form.username.validation.required') }]}
        >
          <Input disabled={isEditMode} />
        </Form.Item>

        {!isEditMode && (
          <>
            <Form.Item
              name="password"
              label={t('form.password.label')}
              rules={[{ required: true, message: t('form.password.validation.required') }]}
              hasFeedback
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label={t('form.confirm_password.label')}
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: t('form.confirm_password.validation.required') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('form.confirm_password.validation.match')));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
          </>
        )}

        <Typography.Text strong>
          {t('form.section.employee_association')}
        </Typography.Text>
        <Form.Item
          name="employee_last_name"
          label={t('form.label.employee_last_name')}
        >
          <Input placeholder={t('form.placeholder.employee_last_name')} />
        </Form.Item>
        <Form.Item
          name="employee_first_name"
          label={t('form.label.employee_first_name')}
        >
          <Input placeholder={t('form.placeholder.employee_first_name')} />
        </Form.Item>
        <Form.Item
          name="employee_id_card"
          label={t('form.label.employee_id_card')}
          tooltip={t('form.tooltip.employee_id_card_for_association')}
        >
          <Input placeholder={t('form.placeholder.employee_id_card')} />
        </Form.Item>
        
        <Form.Item
          name="role_ids"
          label={t('form.roles.label')}
          rules={[{ required: true, message: t('form.roles.validation.required') }]}
        >
          <Select
            mode="multiple"
            allowClear
            placeholder={t('form.roles.placeholder')}
            options={allRoles.map(role => ({ label: role.name, value: role.id }))}
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="is_active"
          label={t('form.status.label')}
          valuePropName="checked"
        >
          <Switch 
            checkedChildren={t('form.status_switch.active')} 
            unCheckedChildren={t('form.status_switch.inactive')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;