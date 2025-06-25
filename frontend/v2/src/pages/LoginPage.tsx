import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Checkbox, Typography, Alert, Row, Col, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { login, clearLoginError } from '../store/authSlice';
import type { RootState, AppDispatch } from '../store';
import type { LoginCredentials } from '../api/auth'; // 确保 LoginCredentials 在 api/auth.ts 中定义并导出
import hyperchainLogoPath from '../assets/images/hyperchainLogo.svg'; // Import the logo
import { ModernCard } from '../components/common/ModernCard';
import { ModernButton } from '../components/common/ModernButton';
import { ModernInput, ModernPassword } from '../components/common/ModernInput';
import StandardForm from '../components/common/StandardForm';
import styles from './LoginPage.module.css';
import '../components/common/LoginInputOverride.css';
import { useDisableFormAutocomplete, createDecoyForm } from '../hooks/useDisableAutocomplete';

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
  
  // 生成唯一的输入框ID
  const [inputIds] = useState({
    username: `username_${Math.random().toString(36).substr(2, 9)}`,
    password: `password_${Math.random().toString(36).substr(2, 9)}`
  });

  const isAuthenticated = !!authToken;
  const from = location.state?.from?.pathname || '/simple-payroll';

  // 禁用登录表单的自动填充
  useDisableFormAutocomplete('.login-form');
  
  // 创建诱饵表单并清理浏览器记住的数据
  useEffect(() => {
    createDecoyForm();
    
    // 清空输入框的值
    const timer = setTimeout(() => {
      if (form) {
        form.setFieldsValue({
          username: '',
          password: ''
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [form]);

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

  const onFinish = async (values: { username: string; password: string; remember?: boolean }) => {
    const credentials: LoginCredentials = {
      username: values.username.trim(),
      password: values.password,
    };
    dispatch(login(credentials));
  };

  const onFinishFailed = (errorInfo: unknown) => {
    console.error('Login form validation failed:', errorInfo);
  };

  if (!ready) {
    return <Spin tip={t('common:loading.generic_loading_text')} size="large"><div /></Spin>;
  }

  return (
    <Row justify="center" align="middle" className={styles.loginContainer}>
      <Col xs={20} sm={16} md={12} lg={8} xl={6}>
        <ModernCard variant="outlined" className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <img src={hyperchainLogoPath} alt="App Logo" className={styles.loginLogo} />
            <Title level={2} className={styles.loginTitle}>{t('login_page_title', { ns: 'auth' })}</Title>
          </div>
          <StandardForm
            form={form}
            name={`login_${Date.now()}`}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            className={`${styles.loginForm} login-form`}
          >
            <Form.Item
              label={t('username_label', { ns: 'common' })}
              name="username"
              rules={[
                { required: true, message: t('username_required_message', { ns: 'auth' }) },
                { type: 'string', min: 2, max: 50, message: '用户名长度必须在2-50字符之间' },
                { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符' }
              ]}
            >
              <ModernInput 
                prefix={<UserOutlined aria-hidden="true" />} 
                size="large" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                variant="outlined"
                placeholder=""
                maxLength={50}
                name={inputIds.username}
                id={inputIds.username}
              />
            </Form.Item>

            <Form.Item
              label={t('password_label', { ns: 'common' })}
              name="password"
              rules={[
                { required: true, message: t('password_required_message', { ns: 'auth' }) }
              ]}
            >
              <ModernPassword 
                prefix={<LockOutlined aria-hidden="true" />} 
                size="large" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                variant="outlined"
                placeholder=""
                maxLength={128}
                name={inputIds.password}
                id={inputIds.password}
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" className={styles.rememberMe}>
              <Checkbox>{t('remember_me_checkbox', { ns: 'common' })}</Checkbox>
            </Form.Item>

            {loginError && (
              <Form.Item className={styles.loginError}>
                <Alert 
                  message={t('auth:error.login_failed')} 
                  description={
                    loginError && typeof loginError === 'string' && loginError.includes(t('common:auto_text_e69c8d')) ? (
                      <>
                        <div>{loginError}</div>
                        <div>
                          <ModernButton
                            variant="ghost"
                            size="small"
                            onClick={() => window.location.reload()}
                          >
                            {t('common:button.refresh_and_retry')}
                          </ModernButton>
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
              <ModernButton 
                variant="primary" 
                htmlType="submit" 
                loading={isLoadingUser} 
                size="large" 
                fullWidth
                className={styles.loginButton}
              >
                {t('login_button', { ns: 'common' })}
              </ModernButton>
            </Form.Item>
          </StandardForm>
        </ModernCard>
      </Col>
    </Row>
  );
};

export default LoginPage;