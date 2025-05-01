import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Spin, Alert, Row, Col, App } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

const UserProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const { user, isLoading: authLoading } = useAuth();
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [errorProfile, setErrorProfile] = useState<string | null>(null);
    const [errorPassword, setErrorPassword] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            console.log("User object in UserProfilePage:", user);
            profileForm.setFieldsValue({
                username: user.username,
                email: user.email || '',
            });
        }
    }, [user, profileForm]);

    const handleUpdateProfile = async (values: { email: string }) => {
        setLoadingProfile(true);
        setErrorProfile(null);
        try {
            await apiClient.put('/api/users/me', { email: values.email });
            message.success(t('userProfilePage.emailUpdateSuccess'));
        } catch (err: any) {
            const errorDetail = err.response?.data?.detail || t('userProfilePage.updateFailed');
            setErrorProfile(errorDetail);
            message.error(`${t('userProfilePage.updateFailed')}: ${errorDetail}`);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleChangePassword = async (values: any) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error(t('userProfilePage.passwordMismatch'));
            return;
        }
        setLoadingPassword(true);
        setErrorPassword(null);
        try {
            await apiClient.put('/api/users/me/password', {
                current_password: values.currentPassword,
                new_password: values.newPassword,
            });
            message.success(t('userProfilePage.passwordUpdateSuccess'));
            passwordForm.resetFields();
        } catch (err: any) {
            const errorDetail = err.response?.data?.detail || t('userProfilePage.passwordUpdateFailed');
            setErrorPassword(errorDetail);
            message.error(`${t('userProfilePage.passwordUpdateFailed')}: ${errorDetail}`);
        } finally {
            setLoadingPassword(false);
        }
    };

    if (authLoading || !user) {
        return <Spin tip="Loading user data..." />;
    }

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <Card title={t('userProfilePage.title')}>
                    <Spin spinning={loadingProfile}>
                        {errorProfile && <Alert message={errorProfile} type="error" showIcon closable onClose={() => setErrorProfile(null)} style={{ marginBottom: 16 }} />}
                        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                            <Form.Item label={t('userProfilePage.usernameLabel')} name="username">
                                <Input disabled prefix={<UserOutlined />} />
                            </Form.Item>
                            <Form.Item
                                label={t('userProfilePage.updateEmailLabel')}
                                name="email"
                                rules={[
                                    { required: true, message: t('userProfilePage.emailRequired') },
                                    { type: 'email', message: t('userProfilePage.emailRequired') },
                                ]}
                            >
                                <Input placeholder={t('auth.emailLabel')} prefix={<MailOutlined />} />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loadingProfile}>
                                    {t('userProfilePage.updateProfileButton')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Card>
            </Col>
            <Col xs={24} md={12}>
                <Card title={t('userProfilePage.changePasswordButton')}>
                    <Spin spinning={loadingPassword}>
                        {errorPassword && <Alert message={errorPassword} type="error" showIcon closable onClose={() => setErrorPassword(null)} style={{ marginBottom: 16 }} />}
                        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                            <Input 
                                name="username" 
                                type="text" 
                                autoComplete="username" 
                                defaultValue={user?.username} 
                                style={{ display: 'none' }} 
                            />
                            <Form.Item
                                label={t('userProfilePage.currentPasswordLabel')}
                                name="currentPassword"
                                rules={[{ required: true, message: t('userProfilePage.passwordRequired') }]}
                            >
                                <Input.Password autoComplete="current-password" prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item
                                label={t('userProfilePage.newPasswordLabel')}
                                name="newPassword"
                                rules={[{ required: true, message: t('userProfilePage.newPasswordRequired') }, { min: 8, message: t('userProfilePage.passwordMinLength', { minLength: 8 }) }]}
                                hasFeedback
                            >
                                <Input.Password autoComplete="new-password" prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item
                                label={t('userProfilePage.confirmNewPasswordLabel')}
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                hasFeedback
                                rules={[
                                    { required: true, message: t('userProfilePage.confirmPasswordRequired') },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error(t('userProfilePage.passwordsDontMatch')));
                                        },
                                    }),
                                    { min: 8, message: t('userProfilePage.passwordMinLength', { minLength: 8 }) }
                                ]}
                            >
                                <Input.Password autoComplete="new-password" prefix={<LockOutlined />} />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loadingPassword}>
                                    {t('userProfilePage.changePasswordButton')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Card>
            </Col>
        </Row>
    );
};

export default UserProfilePage; 