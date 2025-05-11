import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api'; // Assuming apiClient is configured
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const RegisterPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        setError(null);
        console.log('Register form values:', values);

        // Basic client-side check for password match (Antd validator also does this)
        if (values.password !== values.confirmPassword) {
            setError(t('registerPage.errors.passwordMismatch'));
            setLoading(false);
            return;
        }

        try {
            // Prepare payload for the API (matches schemas.UserRegister)
            const payload = {
                username: values.username,
                email: values.email,
                password: values.password,
            };

            // Use apiClient to post to the /register endpoint
            await apiClient.post('/register', payload); 
            
            message.success(t('registerPage.messages.registerSuccess'));
            navigate('/login'); // Redirect to login page on success

        } catch (err: any) {
            console.error("Registration failed:", err);
            // Extract error message from backend response if available
            const errorDetail = err.response?.data?.detail || err.message || t('registerPage.errors.unknownError');
            setError(errorDetail);
            message.error(`${t('registerPage.errors.registrationFailed')}: ${errorDetail}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', borderRadius: '4px' }}>
            <Title level={2} style={{ textAlign: 'center' }}>{t('registerPage.title')}</Title>
            <Form
                form={form}
                name="register"
                onFinish={onFinish}
                scrollToFirstError
            >
                {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 24 }} />}

                <Form.Item
                    name="username"
                    rules={[{ required: true, message: t('registerPage.validation.usernameRequired') }]}
                >
                    <Input prefix={<UserOutlined />} placeholder={t('registerPage.placeholders.username')} />
                </Form.Item>

                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: t('registerPage.validation.emailRequired') },
                        { type: 'email', message: t('registerPage.validation.emailInvalid') },
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder={t('registerPage.placeholders.email')} />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[
                        { required: true, message: t('registerPage.validation.passwordRequired') },
                        { min: 8, message: t('registerPage.validation.passwordMinLength') }
                        // Add more complex password rules if needed (regex)
                    ]}
                    hasFeedback // Shows validation status icon
                >
                    <Input.Password prefix={<LockOutlined />} placeholder={t('registerPage.placeholders.password')} />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    dependencies={['password']} // Depends on the password field
                    hasFeedback
                    rules={[
                        { required: true, message: t('registerPage.validation.confirmPasswordRequired') },
                        // Validator function to check if it matches the password field
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t('registerPage.validation.passwordMismatchError')));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder={t('registerPage.placeholders.confirmPassword')} />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                        {t('registerPage.buttons.register')}
                    </Button>
                </Form.Item>
                
                <div style={{ textAlign: 'center' }}>
                    {t('registerPage.alreadyHaveAccount')} <Link to="/login">{t('registerPage.loginLink')}</Link>
                </div>
            </Form>
        </div>
    );
};

export default RegisterPage; 