import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload } from '../../../../api/types'; // Adjusted path

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
      console.error("Form submission error:", error);
      // message.error("Failed to save permission."); // Already handled by parent usually
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit Permission' : 'Create Permission'}
      open={visible} // Changed from visible to open for AntD v5 compatibility
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={isLoading} 
          onClick={() => form.submit()}
        >
          {isEditing ? 'Save Changes' : 'Create'}
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
          label="Code"
          rules={[{ required: true, message: 'Please input the permission code!' }]}
        >
          <Input placeholder="e.g., user:create or payroll:view_all" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea rows={3} placeholder="Enter a description for the permission" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PermissionForm; 