import React from 'react';
import { Result, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const UnauthorizedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authToken = useSelector((state: RootState) => state.auth.authToken);
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
      status="403"
      title="403"
      subTitle={t('common:auto____e68ab1')}
      extra={
        <Button type="primary" onClick={handleBackHome}>
          {isAuthenticated ?      t('common:auto_text_e8bf94'): t('common:auto_text_e58ebb')}
        </Button>
      }
    />
  );
};

export default UnauthorizedPage; 