import React from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Alert,
  Typography
} from 'antd';
import {
  PlayCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { APIConnectionSettingsProps } from './types';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const APIConnectionSettings: React.FC<APIConnectionSettingsProps> = ({
  form,
  connectionStatus,
  onTestConnection,
  onDetectFields,
  testingConnection,
  detectingFields
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);

  return (
    <>
      {connectionStatus.tested && (
        <Alert
          type={connectionStatus.success ? 'success' : 'error'}
          message={connectionStatus.message}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            connectionStatus.responseTime && (
              <Text type="secondary">
                响应时间: {connectionStatus.responseTime}ms
              </Text>
            )
          }
        />
      )}

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="connection_type"
              label="连接类型"
              rules={[{ required: true, message: '请选择连接类型' }]}
            >
              <Select placeholder="请选择连接类型">
                <Option value="postgresql">PostgreSQL</Option>
                <Option value="mysql">MySQL</Option>
                <Option value="sqlserver">SQL Server</Option>
                <Option value="oracle">Oracle</Option>
                <Option value="sqlite">SQLite</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="schema_name"
              label="模式名"
              rules={[{ required: true, message: '请输入模式名' }]}
            >
              <Input placeholder="public" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="table_name" label="表名">
              <Input placeholder="请输入表名" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="custom_query" label="自定义查询">
          <TextArea
            rows={6}
            placeholder="SELECT * FROM your_table WHERE conditions..."
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={testingConnection}
            onClick={onTestConnection}
          >
            测试连接
          </Button>
          <Button
            icon={<SyncOutlined />}
            loading={detectingFields}
            onClick={onDetectFields}
            disabled={!connectionStatus.success}
          >
            检测字段
          </Button>
        </Space>
      </div>
    </>
  );
};

export default APIConnectionSettings; 