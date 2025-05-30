// frontend/v2/src/pages/Admin/ReportManagement/TestConnectionButton.tsx
import React from 'react';
import { Button, Space, Typography, Spin } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import type { ConnectionTestResult } from './types';

const { Text } = Typography;

interface Props {
  onTest: () => Promise<ConnectionTestResult>;
  testing: boolean;
  connectionStatus: {
    tested: boolean;
    success: boolean;
    message: string;
    responseTime?: number;
  };
}

const TestConnectionButton: React.FC<Props> = ({ onTest, testing, connectionStatus }) => {
  return (
    <Space className="test-btn">
      <Button
        type="primary"
        onClick={onTest}
        loading={testing}
        icon={testing ? <Spin indicator={<SyncOutlined spin />} /> : <PlayCircleOutlined />}
      >
        测试连接
      </Button>
      {connectionStatus.tested && (
        <Space>
          {connectionStatus.success ? (
            <CheckCircleOutlined style={{ color: 'green' }} />
          ) : (
            <ExclamationCircleOutlined style={{ color: 'red' }} />
          )}
          <Text type={connectionStatus.success ? 'success' : 'danger'}>
            {connectionStatus.message}
          </Text>
          {connectionStatus.success && connectionStatus.responseTime !== undefined && (
            <Text type="secondary">({connectionStatus.responseTime} ms)</Text>
          )}
        </Space>
      )}
    </Space>
  );
};

export default TestConnectionButton;