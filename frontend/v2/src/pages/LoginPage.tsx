import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Typography, Alert, Row, Col, Card, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { login, clearLoginError } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store';
import type { LoginCredentials } from '../api/auth'; // 确保 LoginCredentials 在 api/auth.ts 中定义并导出
import hyperchainLogoPath from '../assets/images/hyperchainLogo.svg'; // Import the logo

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ready, i18n } = useTranslation(['common', 'auth']); // 明确指定使用的命名空间
  const dispatch = useDispatch<AppDispatch>();
  
  // 从 Redux store 获取状态
  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const isLoadingUser = useSelector((state: RootState) => state.auth.isLoadingUser);
  const loginError = useSelector((state: RootState) => state.auth.loginError);
  
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
        dispatch(clearLoginError());
    }
  }, [isAuthenticated, dispatch, location.key]);

  const onFinish = async (values: any) => {
    const credentials: LoginCredentials = {
      username: values.username,
      password: values.password,
    };
    dispatch(login(credentials));
  };

  const onFinishFailed = (errorInfo: any) => {
  };

  if (!ready) {
    return <Spin tip={t('common:loading.generic_loading_text')} size="large" style={{ display: 'block', marginTop: '50px' }}><div style={{ padding: 50 }} /></Spin>;
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' /* Removed background: '#f0f2f5' */ }}>
      <Col xs={20} sm={16} md={12} lg={8} xl={6}>
        <Card variant="outlined" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' /* REMOVE position: 'relative' */ }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' /* REMOVE marginTop: '40px' */ }}>
            {/* Changed logo to a text placeholder */}
            <img src={hyperchainLogoPath} alt="App Logo" style={{ height: '50px', marginBottom: '20px' }} />
            <Title level={2} style={{ marginBottom: '24px' /* Added margin below title */ }}>{t('login_page_title', { ns: 'auth' })}</Title>
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
              label={t('username_label', { ns: 'common' })}
              name="username"
              rules={[{ required: true, message: t('username_required_message', { ns: 'auth' }) }]}
              style={{ marginBottom: '20px' }} // Adjusted spacing
            >
              <Input prefix={<UserOutlined />} size="large" autoComplete="username" /* Removed placeholder */ />
            </Form.Item>

            <Form.Item
              label={t('password_label', { ns: 'common' })}
              name="password"
              rules={[{ required: true, message: t('password_required_message', { ns: 'auth' }) }]}
              style={{ marginBottom: '12px' }} // Adjusted spacing
            >
              <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" /* Removed placeholder */ />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>{t('remember_me_checkbox', { ns: 'common' })}</Checkbox>
            </Form.Item>

            {loginError && (
              <Form.Item>
                <Alert 
                  message={t('auth:error.login_failed')} 
                  description={
                    loginError && typeof loginError === 'string' && loginError.includes(t('common:auto_text_e69c8d')) ? (
                      <>
                        <div>{loginError}</div>
                        <div style={{ marginTop: 8 }}>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => window.location.reload()}
                          >
                            {t('common:button.refresh_and_retry')}
                          </Button>
                        </div>
                      </>
                    ) : loginError
                  }
                  type="error"
                  showIcon
                  closable
                  onClose={() => dispatch(clearLoginError())}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoadingUser} style={{ width: '100%' }} size="large" shape="round">
                {t('login_button', { ns: 'common' })}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;