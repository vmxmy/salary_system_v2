import React from 'react';
import { Button } from 'antd';
import { CalendarOutlined, PlusOutlined, ImportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const EmptyState: React.FC = () => {
  const { t } = useTranslation(['simplePayroll']);

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <CalendarOutlined />
      </div>
      <h2 className="empty-title">{t('simplePayroll:emptyState.title', '请先选择工资期间')}</h2>
      <p className="empty-description">
        {t('simplePayroll:emptyState.message', '选择一个工资期间后，您可以开始创建和管理工资数据。')}
      </p>
      <div className="empty-actions">
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          className="modern-button variant-primary size-md"
        >
          创建新期间
        </Button>
        <Button 
          icon={<ImportOutlined />}
          className="modern-button variant-secondary size-md"
        >
          导入数据
        </Button>
      </div>
    </div>
  );
}; 