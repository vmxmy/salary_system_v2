import React from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface LoginFormProps {
    onLoginSuccess: (values: { username?: string; password?: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [form] = Form.useForm();
    const { t } = useTranslation();

    const onFinish = (values: any) => {
        console.log('Login form submitted:', values);
        if (values.username && values.password) {
            onLoginSuccess({ username: values.username, password: values.password });
        } else {
            console.error('Username and password are required.');
            form.setFields([
                { name: 'username', errors: !values.username ? [t('login.usernameRequired')] : [] },
                { name: 'password', errors: !values.password ? [t('login.passwordRequired')] : [] },
            ]);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Card title={<Title level={3}>{t('login.formTitle')}</Title>} style={{ width: 350 }}>
                <Form
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                >
                    <Form.Item
                        label={t('login.usernameLabel')}
                        name="username"
                        rules={[{ required: true, message: t('login.usernameRequired') }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={t('login.passwordLabel')}
                        name="password"
                        rules={[{ required: true, message: t('login.passwordRequired') }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            {t('login.loginButton')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginForm;