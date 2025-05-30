import React from 'react';
import { Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TestConnectionButtonProps } from './types';

const TestConnectionButton: React.FC<TestConnectionButtonProps> = ({
  loading,
  onClick
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);

  return (
    <Button
      type="primary"
      icon={<PlayCircleOutlined />}
      loading={loading}
      onClick={onClick}
    >
      测试连接
    </Button>
  );
};

export default TestConnectionButton; 