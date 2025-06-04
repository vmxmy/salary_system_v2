import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Typography, Space } from 'antd';

const { Title } = Typography;

const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>{t('pageTitle:employee_files')}</Title>
        
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Typography.Text type="secondary">
              {t('common:coming_soon')}
            </Typography.Text>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default EmployeeListPage;