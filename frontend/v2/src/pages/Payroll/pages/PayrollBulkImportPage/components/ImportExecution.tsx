import React from 'react';
import {
  Card,
  Result,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ImportExecutionProps {
  loading: boolean;
  importResult: {
    success_count: number;
    error_count: number;
    errors?: Array<{
      index: number;
      employee_id?: number;
      error: string;
    }>;
  } | null;
  onContinueImport: () => void;
  onViewResults: () => void;
}

const ImportExecution: React.FC<ImportExecutionProps> = ({
  loading,
  importResult,
  onContinueImport,
  onViewResults
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Card>
          <div style={{ padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 24 }} />
            <Title level={3}>正在导入数据...</Title>
            <Progress percent={60} status="active" style={{ marginBottom: 16 }} />
            <Text type="secondary">请耐心等待，正在处理您的薪资数据</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!importResult) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Result
          status="error"
          title="导入异常"
          subTitle="未获取到导入结果，请重试"
          extra={[
            <Button key="retry" onClick={onContinueImport}>
              返回重试
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Result
          status={importResult.error_count === 0 ? "success" : importResult.success_count > 0 ? "warning" : "error"}
          title={
            importResult.error_count === 0 
              ? "导入完成！" 
              : importResult.success_count > 0 
                ? "部分导入成功" 
                : "导入失败"
          }
          subTitle={
            importResult.error_count === 0 
              ? `成功导入 ${importResult.success_count} 条薪资记录`
              : `成功导入 ${importResult.success_count} 条记录，失败 ${importResult.error_count} 条记录`
          }
          extra={[
            <Button type="primary" key="view" onClick={onViewResults}>
              查看导入结果
            </Button>,
            <Button key="new" onClick={onContinueImport}>
              继续导入
            </Button>,
          ]}
        />

        {/* 导入结果统计 */}
        <Card title="导入结果统计">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="成功记录"
                value={importResult.success_count}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="失败记录"
                value={importResult.error_count}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="成功率"
                value={Math.round((importResult.success_count / (importResult.success_count + importResult.error_count)) * 100)}
                suffix="%"
                valueStyle={{ 
                  color: importResult.error_count === 0 ? '#3f8600' : '#fa8c16' 
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* 错误详情 */}
        {importResult.error_count > 0 && importResult.errors && (
          <Card title="错误详情">
            <Alert
              type="error"
              showIcon
              message={`发现 ${importResult.error_count} 条记录导入失败`}
              description={
                <div style={{ marginTop: 8 }}>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>
                        <Text strong>第 {error.index + 1} 行</Text>
                        {error.employee_id && <Text type="secondary"> (员工ID: {error.employee_id})</Text>}
                        : {error.error}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li key="more">
                        <Text type="secondary">... 还有 {importResult.errors.length - 10} 个错误</Text>
                      </li>
                    )}
                  </ul>
                </div>
              }
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ImportExecution; 