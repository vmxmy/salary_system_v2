import React from 'react';
import { useTranslation } from 'react-i18next';
import { Result, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const isAuthenticated = !!authToken; // 从 authToken 派生 isAuthenticated

  const handleBackHome = () => {
    if (isAuthenticated) {
      navigate('/simple-payroll'); // 如果已认证，返回简单工资页面
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