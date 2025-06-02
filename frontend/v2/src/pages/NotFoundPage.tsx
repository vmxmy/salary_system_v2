import React from 'react';
import { useTranslation } from 'react-i18next';
import { Result, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // 引入 authStore

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authToken = useAuthStore((state) => state.authToken);
  const isAuthenticated = !!authToken; // 从 authToken 派生 isAuthenticated

  const handleBackHome = () => {
    if (isAuthenticated) {
      navigate('/dashboard'); // 如果已认证，返回仪表盘
    } else {
      navigate('/login'); // 否则去登录页
    }
  };
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('common:page_title.not_found')}
      extra={
        <Button type="primary" onClick={handleBackHome}>
           {isAuthenticated ? t('common:return_home') : t('common:return_login')}
        </Button>
      }
    />
  );
};

export default NotFoundPage; 