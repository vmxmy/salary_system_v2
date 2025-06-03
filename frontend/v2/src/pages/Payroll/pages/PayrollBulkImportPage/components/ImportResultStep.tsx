import React from 'react';
import {
  Card,
  Result,
  Button,
  Space,
  Typography,
  Alert,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Collapse
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadResult } from '../hooks/usePayrollImport';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ImportResultStepProps {
  uploadResult: UploadResult | null;
  onStartAgain: () => void;
  onNavigateToEntries: () => void;
}

const ImportResultStep: React.FC<ImportResultStepProps> = ({
  uploadResult,
  onStartAgain,
  onNavigateToEntries
}) => {
  const { t } = useTranslation(['payroll', 'common']);

  if (!uploadResult) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Text>{t('batch_import.result.no_result')}</Text>
      </div>
    );
  }

  const { successCount, errorCount, errors, createdEntries } = uploadResult;
  const isFullSuccess = errorCount === 0;
  const isPartialSuccess = successCount > 0 && errorCount > 0;
  const isFullFailure = successCount === 0 && errorCount > 0;

  // 错误表格列定义
  const errorColumns = [
    {
      title: t('batch_import.result.error_table.index'),
      dataIndex: ['record', 'index'],
      key: 'index',
      width: 80,
      render: (index: number) => index + 1
    },
    {
      title: t('batch_import.result.error_table.employee_id'),
      dataIndex: ['record', 'employee_id'],
      key: 'employee_id',
      width: 120,
      render: (employeeId: number) => employeeId || '-'
    },
    {
      title: t('batch_import.result.error_table.error_message'),
      dataIndex: 'error',
      key: 'error',
      render: (error: string) => (
        <Text type="danger">{error}</Text>
      )
    }
  ];

  // 渲染结果状态
  const renderResultStatus = () => {
    if (isFullSuccess) {
      return (
        <Result
          status="success"
          title={t('batch_import.result.success_title')}
          subTitle={t('batch_import.result.success_subtitle', { count: successCount })}
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        />
      );
    }

    if (isPartialSuccess) {
      return (
        <Result
          status="warning"
          title={t('batch_import.result.partial_title')}
          subTitle={t('batch_import.result.partial_subtitle', { 
            success: successCount, 
            error: errorCount 
          })}
          icon={<WarningOutlined style={{ color: '#faad14' }} />}
        />
      );
    }

    if (isFullFailure) {
      return (
        <Result
          status="error"
          title={t('batch_import.result.failure_title')}
          subTitle={t('batch_import.result.failure_subtitle', { count: errorCount })}
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        />
      );
    }

    return null;
  };

  // 渲染统计信息
  const renderStatistics = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={8}>
        <Card>
          <Statistic
            title={t('batch_import.result.statistics.total_processed')}
            value={successCount + errorCount}
            prefix={<ExclamationCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title={t('batch_import.result.statistics.successful')}
            value={successCount}
            valueStyle={{ color: '#3f8600' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title={t('batch_import.result.statistics.failed')}
            value={errorCount}
            valueStyle={{ color: '#cf1322' }}
            prefix={<CloseCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  // 渲染错误详情
  const renderErrorDetails = () => {
    if (!errors || errors.length === 0) return null;

    return (
      <Card style={{ marginBottom: 24 }}>
        <Title level={5}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          {t('batch_import.result.error_details_title')}
        </Title>
        
        <Alert
          message={t('batch_import.result.error_alert_title')}
          description={t('batch_import.result.error_alert_desc')}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={errorColumns}
          dataSource={errors}
          rowKey={(record, index) => `error-${index}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true
          }}
          size="small"
        />
      </Card>
    );
  };

  // 渲染成功详情
  const renderSuccessDetails = () => {
    if (successCount === 0) return null;

    return (
      <Collapse ghost style={{ marginBottom: 24 }}>
        <Panel
          header={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text strong>
                {t('batch_import.result.success_details_title', { count: successCount })}
              </Text>
            </Space>
          }
          key="success-details"
        >
          <Alert
            message={t('batch_import.result.success_alert_title')}
            description={t('batch_import.result.success_alert_desc', { count: successCount })}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          {createdEntries && createdEntries.length > 0 && (
            <div>
              <Text type="secondary">
                {t('batch_import.result.created_entries_preview')}
              </Text>
              <ul style={{ marginTop: 8 }}>
                {createdEntries.slice(0, 5).map((entry: any, index: number) => (
                  <li key={index}>
                    <Text>
                      {t('batch_import.result.entry_item', {
                        id: entry.id,
                        employeeName: entry.employee_name || entry.employee_id,
                        amount: entry.net_pay
                      })}
                    </Text>
                  </li>
                ))}
                {createdEntries.length > 5 && (
                  <li>
                    <Text type="secondary">
                      {t('batch_import.result.more_entries', { 
                        count: createdEntries.length - 5 
                      })}
                    </Text>
                  </li>
                )}
              </ul>
            </div>
          )}
        </Panel>
      </Collapse>
    );
  };

  // 渲染操作建议
  const renderActionSuggestions = () => (
    <Card style={{ marginBottom: 24 }}>
      <Title level={5}>{t('batch_import.result.next_steps_title')}</Title>
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {isFullSuccess && (
          <Alert
            message={t('batch_import.result.success_suggestion')}
            type="success"
            showIcon
          />
        )}
        
        {isPartialSuccess && (
          <Alert
            message={t('batch_import.result.partial_suggestion')}
            description={t('batch_import.result.partial_suggestion_desc')}
            type="warning"
            showIcon
          />
        )}
        
        {isFullFailure && (
          <Alert
            message={t('batch_import.result.failure_suggestion')}
            description={t('batch_import.result.failure_suggestion_desc')}
            type="error"
            showIcon
          />
        )}
      </Space>
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>{t('batch_import.step.result')}</Title>
        <Text type="secondary">
          {t('batch_import.step.result_subtitle')}
        </Text>
      </div>

      {/* 结果状态 */}
      <Card style={{ marginBottom: 24 }}>
        {renderResultStatus()}
      </Card>

      {/* 统计信息 */}
      {renderStatistics()}

      {/* 操作建议 */}
      {renderActionSuggestions()}

      {/* 成功详情 */}
      {renderSuccessDetails()}

      {/* 错误详情 */}
      {renderErrorDetails()}

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Space size="large">
          <Button
            icon={<ReloadOutlined />}
            onClick={onStartAgain}
            size="large"
          >
            {t('batch_import.button.start_again')}
          </Button>
          
          {successCount > 0 && (
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={onNavigateToEntries}
              size="large"
            >
              {t('batch_import.button.view_entries')}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ImportResultStep; 