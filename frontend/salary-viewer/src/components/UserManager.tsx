import React, { useState, useEffect } from 'react';
import { Typography, Table, message, Space, Button, App as AntApp, Modal, Form, Input, Select, Switch, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import api from '../services/api'; // Assuming api service exists
import { PlusOutlined } from '@ant-design/icons'; // Import icon for Add button

const { Title } = Typography;
const { Option } = Select;

// Define the User interface based on expected API response
interface User {
    id: number;
    username: string;
    email: string | null;
    role: RoleResponse | null; // Updated to potentially hold RoleResponse
    role_id: number; // Keep role_id for form binding
    is_active: boolean;
    created_at?: string; // Optional based on schema
    updated_at?: string; // Optional based on schema
    // Add other relevant fields if needed
}

// Define the structure of the list response from the API
interface UserListResponse {
    data: User[];
    total: number;
}

// Define RoleResponse interface based on schema
interface RoleResponse {
    id: number;
    name: string;
    description?: string | null;
}

const UserManager: React.FC = () => {
    const { t } = useTranslation();
    const { message: messageApi } = AntApp.useApp();
    const [form] = Form.useForm(); // Form instance
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalUsers, setTotalUsers] = useState<number>(0); // State for total count
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    // Fetch Roles
    const fetchRoles = async () => {
        try {
            const response = await api.get<RoleResponse[]>('/api/users/roles/list');
            setRoles(response.data || []);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            messageApi.error(t('userManager.errors.loadRolesFailed', 'Failed to load roles.'));
        }
    };

    // Fetch users from the API
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get<UserListResponse>('/api/users');
            // Ensure role object exists or is null
            const formattedUsers = response.data.data.map(u => ({...u, role: u.role || null})); 
            setUsers(formattedUsers);
            setTotalUsers(response.data.total);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            messageApi.error(t('userManager.errors.loadFailed', 'Failed to load users.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles(); // Fetch roles on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Populate form when modal opens (for editing)
    useEffect(() => {
        if (editingUser && isModalVisible) {
            form.setFieldsValue({
                ...editingUser,
                role_id: editingUser.role?.id
            });
        } 
        // No need for else { form.resetFields() } because of destroyOnClose and manual reset
    }, [editingUser, isModalVisible, form]);

    // Define table columns
    const columns: ColumnsType<User> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: t('userManager.table.colUsername', 'Username'),
            dataIndex: 'username',
            key: 'username',
            sorter: (a, b) => a.username.localeCompare(b.username),
        },
        {
            title: t('userManager.table.colEmail', 'Email'),
            dataIndex: 'email',
            key: 'email',
            render: (email) => email || '-', // Display '-' if email is null
        },
        {
            title: t('userManager.table.colRole', 'Role'),
            dataIndex: 'role',
            key: 'role',
            render: (role) => role?.name || '-',
            sorter: (a, b) => (a.role?.name || '').localeCompare(b.role?.name || ''),
            filters: roles.map(role => ({ text: role.name, value: role.name })), // Dynamic filters from state
            onFilter: (value, record) => record.role?.name === value,
        },
        {
            title: t('userManager.table.colStatus', 'Status'),
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive) => (isActive ? t('userManager.status.active', 'Active') : t('userManager.status.inactive', 'Inactive')),
            filters: [
                { text: t('userManager.status.active', 'Active'), value: true },
                { text: t('userManager.status.inactive', 'Inactive'), value: false },
            ],
            onFilter: (value, record) => record.is_active === value,
        },
        {
            title: t('common.colActions'),
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleEdit(record)}>{t('common.edit')}</Button>
                    <Popconfirm
                        title={t('userManager.deleteConfirm.title', 'Confirm Delete')}
                        description={t('userManager.deleteConfirm.content', 'Delete user {{username}}?', { username: record.username })}
                        onConfirm={() => handleConfirmDelete(record.id)}
                        okText={t('common.yes', 'Yes')}
                        cancelText={t('common.no', 'No')}
                        okButtonProps={{ loading: deleteLoading === record.id }}
                        disabled={record.id === 1}
                    >
                        <Button type="link" danger disabled={record.id === 1}>
                            {t('common.delete')}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Handle Edit Button Click
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalVisible(true);
    };

    // Handle Modal Cancel
    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingUser(null);
        form.resetFields();
    };

    // Handle Modal OK (Form Submission)
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);

            if (editingUser) { 
                // --- Edit Logic ---
                const payload: any = {};
                if (values.email !== editingUser.email) payload.email = values.email;
                if (values.role_id !== editingUser.role_id) payload.role_id = values.role_id;
                if (values.is_active !== editingUser.is_active) payload.is_active = values.is_active;
                // Username & Password are not updated here

                if (Object.keys(payload).length === 0) {
                    messageApi.info(t('common.noChanges'));
                } else {
                    await api.put(`/api/users/${editingUser.id}`, payload);
                    messageApi.success(t('userManager.messages.updateSuccess', 'User updated successfully!'));
                    fetchUsers(); // Refresh list
                }
            } else {
                // --- Add Logic ---
                const payload = {
                    username: values.username,
                    email: values.email,
                    password: values.password, // Get password from form
                    role_id: values.role_id,
                    is_active: values.is_active === undefined ? true : values.is_active // Default to true if switch not touched
                };
                await api.post('/api/users', payload);
                messageApi.success(t('userManager.messages.createSuccess', 'User created successfully!'));
                fetchUsers(); // Refresh list
            }

            setIsModalVisible(false);
            setEditingUser(null);

        } catch (error: any) {
             console.error('Failed to save user:', error);
             const defaultError = editingUser 
                 ? t('userManager.errors.updateFailed', 'Failed to update user') 
                 : t('userManager.errors.createFailed', 'Failed to create user');
             const errorMsg = error?.response?.data?.detail || error?.message || defaultError;
             messageApi.error(errorMsg);
             // Keep modal open on error 
        } finally {
            setIsSaving(false);
        }
    };

    // Implement Delete Handler
    const handleConfirmDelete = async (id: number) => {
        setDeleteLoading(id); // Set loading for the specific user
        try {
            await api.delete(`/api/users/${id}`);
            messageApi.success(t('userManager.messages.deleteSuccess', 'User deleted successfully!'));
            fetchUsers(); // Refresh the list
        } catch (error: any) {
            console.error('Failed to delete user:', error);
            const errorMsg = error?.response?.data?.detail || error?.message || t('userManager.errors.deleteFailed', 'Failed to delete user');
            messageApi.error(errorMsg);
        } finally {
            setDeleteLoading(null); // Reset loading state regardless of outcome
        }
    };

    const showAddModal = () => {
        setEditingUser(null); // Ensure we are in Add mode
        setIsModalVisible(true);
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> 
                <Title level={2} style={{ margin: 0 }}>{t('breadcrumb.userManager')}</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}> 
                    {t('userManager.addButton', 'Add User')}
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="id"
                style={{ marginTop: 16 }}
                pagination={{
                    total: totalUsers,
                    showTotal: (total, range) => t('common.pagination.showTotal', { rangeStart: range[0], rangeEnd: range[1], total }),
                    showSizeChanger: true, // Optional: allow changing page size
                    // onChange: handleTableChange, // Add if server-side pagination/sorting is needed
                }}
            />

            {/* Combined Add/Edit User Modal */}
            <Modal
                title={editingUser 
                    ? t('userManager.modal.editTitle', { username: editingUser.username })
                    : t('userManager.modal.addTitle', 'Add New User')
                }
                open={isModalVisible} 
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={isSaving}
                okText={t('common.save')}
                cancelText={t('common.cancel')}
                destroyOnClose // Reset form state when modal is closed
            >
                <Form form={form} layout="vertical" name="userForm">
                    <Form.Item
                        name="username"
                        label={t('userManager.form.username', 'Username')}
                        rules={[{ required: !editingUser, message: t('userManager.validation.usernameRequired', 'Please input the username!') }]}
                    >
                         {/* Disable username when editing */}
                        <Input disabled={!!editingUser} autoComplete="username" /> 
                    </Form.Item>
                    
                    {/* Conditionally render password field only for Add mode */}
                    {!editingUser && (
                        <>
                            <Form.Item
                                name="password"
                                label={t('userManager.form.password', 'Password')}
                                rules={[
                                    { required: true, message: t('userManager.validation.passwordRequired', 'Please input the password!') },
                                    { min: 8, message: t('userManager.validation.passwordMinLength', 'Password must be at least 8 characters!') }
                                ]}
                                hasFeedback // Add feedback icon
                            >
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>

                            {/* Add Confirm Password Field */}
                            <Form.Item
                                name="confirmPassword"
                                label={t('userManager.form.confirmPassword', 'Confirm Password')}
                                dependencies={['password']} // Depend on password field
                                hasFeedback
                                rules={[
                                    { 
                                        required: true, 
                                        message: t('userManager.validation.confirmPasswordRequired', 'Please confirm your password!') 
                                    },
                                    // Validator function
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error(t('userManager.validation.passwordsDontMatch', 'The two passwords that you entered do not match!')));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item
                        name="email"
                        label={t('userManager.form.email', 'Email')}
                        rules={[
                            { required: true, message: t('userManager.validation.emailRequired', 'Please input the email!') },
                            { type: 'email', message: t('userManager.validation.emailInvalid', 'Please enter a valid email address!') }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role_id"
                        label={t('userManager.form.role', 'Role')}
                        rules={[{ required: true, message: t('userManager.validation.roleRequired', 'Please select a role!') }]}
                    >
                        <Select placeholder={t('userManager.placeholders.selectRole', 'Select a role')} loading={!roles.length} disabled={!roles.length}>
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>{role.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="is_active"
                        label={t('userManager.form.status', 'Status')}
                        valuePropName="checked"
                        initialValue={true} // Default to active for new users
                    >
                        <Switch checkedChildren={t('userManager.status.active', 'Active')} unCheckedChildren={t('userManager.status.inactive', 'Inactive')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManager; 