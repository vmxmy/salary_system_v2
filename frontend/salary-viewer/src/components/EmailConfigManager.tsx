import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Checkbox, Space, Popconfirm, Typography, Row, Col, InputNumber, App } from 'antd'; // Removed message, Added App
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
    getEmailConfigs,
    createEmailConfig,
    updateEmailConfig,
    deleteEmailConfig,
    testEmailConfig,
    // Assuming EmailConfigResponse from api.ts can be used or adapted for EmailConfig here
    // Or define EmailConfig interface locally if it differs significantly
} from '../services/api'; // Import real API functions

// interface EmailConfig defined below can be used if it matches response structure
// or import/adapt EmailConfigResponse from api.ts

// Import the interfaces from api.ts
import {
    EmailConfigResponse,
    EmailConfigCreateData,
    EmailConfigUpdateData
} from '../services/api';

// Use EmailConfigResponse for the state
type EmailConfig = EmailConfigResponse;

// Form data interface that matches the backend model
interface EmailConfigFormData {
    server_name: string;
    host: string;
    port: number;
    use_tls: boolean;
    use_ssl: boolean;
    username: string;
    password?: string; // For create/update
    sender_email: string;
    is_default: boolean; // 是否设为默认邮箱服务器
}

const EmailConfigManager: React.FC = () => {
  const { t } = useTranslation();
  const { message: messageApi } = App.useApp(); // Added App.useApp()
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
    const [form] = Form.useForm<EmailConfigFormData>();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [testLoading, setTestLoading] = useState<{[key: number]: boolean}>({});

    const fetchConfigs = async () => {
        setLoading(true);
        try {
          const data = await getEmailConfigs(); // Use real API
          setConfigs(data); // Assuming getEmailConfigs returns EmailConfig[] directly
        } catch (error: any) {
          messageApi.error(t('emailConfigManager.messages.fetchFailed') + (error.response?.data?.detail ? `: ${error.response.data.detail}` : ''));
          console.error("Failed to fetch email configs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      fetchConfigs();
    }, [t]); // t is not a typical dependency for fetching data, consider removing if not needed for fetchConfigs logic

    // useEffect to handle form initialization when modal opens
    useEffect(() => {
      if (isModalVisible) {
        if (editingConfig) {
          form.setFieldsValue({
            ...editingConfig,
            password: '', // Clear password field for editing
          });
        } else {
          form.resetFields();
          form.setFieldsValue({ port: 587, use_tls: true, use_ssl: false, is_default: false }); // Default values for new config
        }
      }
    }, [isModalVisible, editingConfig, form]);

    const handleAdd = () => {
      setEditingConfig(null);
      // Form initialization moved to useEffect
      setIsModalVisible(true);
    };

    const handleEdit = (record: EmailConfig) => {
      setEditingConfig(record);
      // Form initialization moved to useEffect
      setIsModalVisible(true);
    };

    const handleDelete = async (id: number) => {
      try {
        await deleteEmailConfig(id); // Use real API
        messageApi.success(t('emailConfigManager.messages.deleteSuccess'));
        fetchConfigs(); // Refresh list
      } catch (error: any) {
        messageApi.error(t('emailConfigManager.messages.deleteFailed') + (error.response?.data?.detail ? `: ${error.response.data.detail}` : ''));
        console.error("Failed to delete email config:", error);
      }
    };

    const handleTestConnection = async (id: number) => {
        console.log('[EmailConfigManager] handleTestConnection called with ID:', id, new Date().toISOString());
        setTestLoading(prev => ({ ...prev, [id]: true }));
        try {
          const response = await testEmailConfig(id); // Use real API
          if (response.success) {
            messageApi.success(t('emailConfigManager.messages.testSuccess', { message: response.message || 'Success' }));
          } else {
            messageApi.error(t('emailConfigManager.messages.testFailed', { message: response.message || 'Failed' }));
          }
        } catch (error: any) {
          messageApi.error(t('emailConfigManager.messages.testError') + (error.response?.data?.detail ? `: ${error.response.data.detail}` : ''));
          console.error("Failed to test email config:", error);
        } finally {
          setTestLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);

            if (editingConfig) {
                // 更新现有配置
                const updatePayload: EmailConfigUpdateData = { ...values };
                if (!updatePayload.password) { // If password is empty, null, or undefined
                    delete updatePayload.password; // Do not send empty password
                }
                await updateEmailConfig(editingConfig.id, updatePayload);
                messageApi.success(t('emailConfigManager.messages.updateSuccess'));
            } else {
                // 创建新配置
                // 确保密码字段存在且不为空，后端要求密码字段
                if (!values.password) {
                    messageApi.error(t('emailConfigManager.validation.passwordRequired'));
                    setSubmitLoading(false);
                    return;
                }

                // 创建新配置时，确保所有必填字段都存在
                const createPayload: EmailConfigCreateData = {
                    server_name: values.server_name,
                    host: values.host,
                    port: values.port,
                    use_tls: values.use_tls,
                    use_ssl: values.use_ssl,
                    username: values.username,
                    password: values.password,
                    sender_email: values.sender_email,
                    is_default: values.is_default || false
                };

                await createEmailConfig(createPayload);
                messageApi.success(t('emailConfigManager.messages.createSuccess'));
            }

            setIsModalVisible(false);
            fetchConfigs(); // Refresh list
        } catch (errorInfo: any) {
            if (errorInfo.response && errorInfo.response.data && errorInfo.response.data.detail) {
                // Handle backend validation errors or other specific errors
                if (Array.isArray(errorInfo.response.data.detail)) {
                    errorInfo.response.data.detail.forEach((err: any) => {
                        messageApi.error(`${err.loc ? err.loc.join(' > ') + ': ' : ''}${err.msg}`);
                    });
                } else {
                    messageApi.error(t('emailConfigManager.messages.validationFailed') + `: ${errorInfo.response.data.detail}`);
                }
            } else if (errorInfo.errorFields) {
                // Ant Design form validation client-side error
                console.log('Form Validation Failed:', errorInfo);
                messageApi.error(t('emailConfigManager.messages.validationFailed'));
            } else {
                // Other errors
                console.error('Save/Update Error:', errorInfo);
                messageApi.error(t('emailConfigManager.messages.validationFailed')); // Generic fallback
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: t('emailConfigManager.columns.name'),
            dataIndex: 'server_name',
            key: 'server_name',
        },
        {
            title: t('emailConfigManager.columns.host'),
            dataIndex: 'host',
            key: 'host',
        },
        {
            title: t('emailConfigManager.columns.port'),
            dataIndex: 'port',
            key: 'port',
        },
        {
            title: t('emailConfigManager.columns.useTls'),
            dataIndex: 'use_tls',
            key: 'use_tls',
            render: (use_tls: boolean) => (use_tls ? t('common.yes') : t('common.no')),
        },
        {
            title: t('emailConfigManager.columns.useSsl'),
            dataIndex: 'use_ssl',
            key: 'use_ssl',
            render: (use_ssl: boolean) => (use_ssl ? t('common.yes') : t('common.no')),
        },
        {
            title: t('emailConfigManager.columns.username'),
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: t('emailConfigManager.columns.senderAddress'),
            dataIndex: 'sender_email',
            key: 'sender_email',
        },
        {
            title: t('emailConfigManager.columns.isDefault'),
            dataIndex: 'is_default',
            key: 'is_default',
            render: (is_default: boolean) => (is_default ? t('common.yes') : t('common.no')),
        },
        {
            title: t('emailConfigManager.columns.actions'),
            key: 'actions',
            render: (_: any, record: EmailConfig) => (
                <Space size="middle">
                    <Button
                        icon={<ThunderboltOutlined />}
                        onClick={() => handleTestConnection(record.id)}
                        loading={testLoading[record.id]}
                    >
                        {t('emailConfigManager.buttons.testConnection')}
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        {t('common.edit')}
                    </Button>
                    <Popconfirm
                        title={t('emailConfigManager.confirmations.deleteTitle')}
                        description={t('emailConfigManager.confirmations.deleteDescription', { name: record.server_name })}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('common.yes')}
                        cancelText={t('common.no')}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    >
                        <Button icon={<DeleteOutlined />} danger>
                            {t('common.delete')}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Typography.Title level={3} style={{ marginBottom: '20px' }}>
                {t('emailConfigManager.title')}
            </Typography.Title>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{ marginBottom: 16 }}
            >
                {t('emailConfigManager.buttons.addConfig')}
            </Button>
            <Table
                columns={columns}
                dataSource={configs}
                loading={loading}
                rowKey="id"
                bordered
                scroll={{ x: 1300 }} // Added for horizontal scroll
            />
            <Modal
                title={editingConfig ? t('emailConfigManager.modal.editTitle') : t('emailConfigManager.modal.addTitle')}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                confirmLoading={submitLoading}
                destroyOnClose
                width={600}
            >
                <Form form={form} layout="vertical" name="emailConfigForm" initialValues={{ port: 587, use_tls: true, use_ssl: false, is_default: false }}>
                    <Form.Item
                        name="server_name"
                        label={t('emailConfigManager.form.name')}
                        rules={[{ required: true, message: t('emailConfigManager.validation.nameRequired') }]}
                    >
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                name="host"
                                label={t('emailConfigManager.form.host')}
                                rules={[{ required: true, message: t('emailConfigManager.validation.hostRequired') }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="port"
                                label={t('emailConfigManager.form.port')}
                                rules={[{ required: true, type: 'number', min: 1, max: 65535, message: t('emailConfigManager.validation.portRequired') }]}
                            >
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="use_tls" valuePropName="checked">
                        <Checkbox>{t('emailConfigManager.form.useTls')}</Checkbox>
                    </Form.Item>
                    <Form.Item name="use_ssl" valuePropName="checked">
                        <Checkbox>{t('emailConfigManager.form.useSsl')}</Checkbox>
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label={t('emailConfigManager.form.username')}
                        rules={[{ required: true, message: t('emailConfigManager.validation.usernameRequired') }]}
                    >
                        <Input autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={t('emailConfigManager.form.password')}
                        help={editingConfig ? t('emailConfigManager.form.passwordHelp') : ''}
                        rules={[{ required: !editingConfig, message: t('emailConfigManager.validation.passwordRequired') }]}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                        name="sender_email"
                        label={t('emailConfigManager.form.senderAddress')}
                        rules={[
                            { required: true, message: t('emailConfigManager.validation.senderAddressRequired') },
                            { type: 'email', message: t('emailConfigManager.validation.senderAddressInvalid') }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="is_default" valuePropName="checked">
                        <Checkbox>{t('emailConfigManager.form.isDefault')}</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EmailConfigManager;