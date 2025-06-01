import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload } from '../../../../api/types'; // Adjusted path
import { useTranslation } from 'react-i18next'; // Added i18n hook

interface PermissionFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: CreatePermissionPayload | UpdatePermissionPayload) => Promise<void>;
  initialData?: Permission | null;
  isLoading?: boolean; // To disable form/submit button during submission
}

const PermissionForm: React.FC<PermissionFormProps> = ({ 
  visible, 
  onClose, 
  onSubmit, 
  initialData, 
  isLoading 
}) => {
  const { t } = useTranslation('permission'); // Initialized t function
  const [form] = Form.useForm<CreatePermissionPayload | UpdatePermissionPayload>();
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialData, form]);

  const handleFormSubmit = async (values: CreatePermissionPayload | UpdatePermissionPayload) => {
    try {
      await onSubmit(values);
      onClose(); // Close modal on successful submission
    } catch (error) {
      // Error handling might be done by the mutation hook in the parent component
      // but a local message can also be shown.
      // message.error("Failed to save permission."); // Already handled by parent usually
    }
  };

  return (
    <Modal
      title={isEditing ?      t('form.title.edit'): t('form.title.create')}
      open={visible} // Changed from visible to open for AntD v5 compatibility
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} disabled={isLoading}>
          t('form.button.cancel')
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={isLoading} 
          onClick={() => form.submit()}
        >
          {isEditing ?      t('form.button.save_changes'): t('form.button.create')}
        </Button>,
      ]}
      destroyOnHidden // Ensures form is reset when modal is closed and reopened for "create"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        name="permission_form"
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

export default PermissionForm; 