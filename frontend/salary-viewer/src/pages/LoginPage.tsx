import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Corrected import path
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const onFinish = async (values: any) => {
        setLoading(true);
        setError(null);
        try {
            await login(values.username, values.password);
            navigate('/', { replace: true }); // Redirect to home/dashboard after login
        } catch (err: any) {
            // Handle different error types if needed
            const errorMessage = err.response?.data?.detail || err.message || t('auth.loginFailedGeneric');
             setError(errorMessage);
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Spin spinning={loading}>
                <Card style={{ width: 400 }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
                        {t('auth.loginTitle')}
                    </Title>
                    {error && (
                        <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} closable onClose={() => setError(null)} />
                    )}
                    <Form
                        name="normal_login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        size="large" // Make inputs larger
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: t('auth.usernameRequired') }]}
                        >
                            <Input id="username" prefix={<UserOutlined />} placeholder={t('auth.usernamePlaceholder')} autoComplete="username" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: t('auth.passwordRequired') }]}
                        >
                            <Input.Password
                                id="password"
                                prefix={<LockOutlined />}
                                type="password"
                                placeholder={t('auth.passwordPlaceholder')}
                                autoComplete="current-password"
                            />
                        </Form.Item>
                        {/* Optional: Add Remember me or Forgot password links here if needed */}
                        {/* <Form.Item>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>{t('auth.rememberMe')}</Checkbox>
                            </Form.Item>
                            <a style={{ float: 'right' }} href="">
                                {t('auth.forgotPassword')}
                            </a>
                        </Form.Item> */}
                        <Form.Item>
                            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                                {t('auth.loginButton')}
                            </Button>
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                {t('auth.noAccount')} <Link to="/register">{t('auth.registerNow')}</Link>
                            </div>
                        </Form.Item>
                    </Form>
                </Card>
            </Spin>
        </div>
    );
};

export default LoginPage; 