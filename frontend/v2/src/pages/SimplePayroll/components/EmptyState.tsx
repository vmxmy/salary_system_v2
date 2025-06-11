import React from 'react';
import { Card } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const EmptyState: React.FC = () => {
  const { t } = useTranslation(['simplePayroll']);

  return (
    <Card className="empty-state-card">
      <div className="empty-state-content">
        <CalendarOutlined style={{ fontSize: '48px', color: '#ccc' }} />
        <h2 className="typography-title-tertiary">{t('simplePayroll:emptyState.title')}</h2>
        <p className="typography-body-secondary">{t('simplePayroll:emptyState.message')}</p>
      </div>
    </Card>
  );
}; 