import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Typography, Alert, Row, Col, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials } from '../api/auth'; // 确保 LoginCredentials 在 api/auth.ts 中定义并导出

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const {
    loginAction,
    authToken,
    isLoadingUser,
    loginError,
    clearLoginError,
  } = useAuthStore();
  const [form] = Form.useForm();

  const isAuthenticated = !!authToken;
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (!isAuthenticated) {
        clearLoginError();
    }
  }, [isAuthenticated, clearLoginError, location.key]);

  const onFinish = async (values: any) => {
    console.log('[LoginPage] onFinish called with values:', values);
    const credentials: LoginCredentials = {
      username: values.username,
      password: values.password,
    };
    await loginAction(credentials);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Login form submission failed:', errorInfo);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' /* Removed background: '#f0f2f5' */ }}>
      <Col xs={20} sm={16} md={12} lg={8} xl={6}>
        <Card variant="outlined" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' /* REMOVE position: 'relative' */ }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' /* REMOVE marginTop: '40px' */ }}>
            {/* Changed logo to a text placeholder */}
            <div style={{ 
              height: '60px', // Approximate height for logo area
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px', 
              color: '#8c8c8c', // Lighter text color for placeholder
              // backgroundColor: '#f0f0f0', // Optional placeholder background
              // borderRadius: '4px', // Optional placeholder border radius
              marginBottom: '20px',
              border: '1px dashed #d9d9d9' // Placeholder border to mimic image
            }}>
              App Logo
            </div>
            <Title level={2} style={{ marginBottom: '24px' /* Added margin below title */ }}>{t('login_page_title')}</Title>
          </div>
          <Form
            form={form}
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label={t('username_label')}
              name="username"
              rules={[{ required: true, message: t('username_required_message') }]}
              style={{ marginBottom: '20px' }} // Adjusted spacing
            >
              <Input prefix={<UserOutlined />} size="large" autoComplete="username" /* Removed placeholder */ />
            </Form.Item>

            <Form.Item
              label={t('password_label')}
              name="password"
              rules={[{ required: true, message: t('password_required_message') }]}
              style={{ marginBottom: '12px' }} // Adjusted spacing
            >
              <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" /* Removed placeholder */ />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: '24px' /* Adjusted spacing */ }}>
              <Checkbox>{t('remember_me_checkbox')}</Checkbox>
            </Form.Item>

            {loginError && (
              <Form.Item style={{ marginBottom: '24px' /* Adjusted spacing */ }}>
                <Alert message={loginError} type="error" showIcon closable onClose={clearLoginError} />
              </Form.Item>
            )}

            <Form.Item style={{ marginBottom: '12px' }}>
              <Button type="primary" htmlType="submit" loading={isLoadingUser} style={{ width: '100%' }} size="large" shape="round">
                {t('login_button')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;