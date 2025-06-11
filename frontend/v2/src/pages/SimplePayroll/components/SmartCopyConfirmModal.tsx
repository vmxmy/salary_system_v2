import React from 'react';
import { Modal, Alert, Descriptions, Card, Row, Col, Button, Space, Typography, Divider } from 'antd';
import { ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ExistingDataInfo {
  target_period_id: number;
  target_period_name: string;
  has_any_data: boolean;
  payroll_data: {
    has_data: boolean;
    runs_count: number;
    total_entries: number;
    runs: Array<{
      id: number;
      run_date: string;
      status_name: string;
      entries_count: number;
      total_gross_pay: number;
      total_net_pay: number;
    }>;
  };
  salary_configs: {
    has_data: boolean;
    configs_count: number;
    employees_with_configs: number;
  };
  summary: {
    total_payroll_runs: number;
    total_payroll_entries: number;
    total_salary_configs: number;
    employees_with_configs: number;
  };
}

interface CopyAction {
  action: string;
  label: string;
  description: string;
  force_overwrite: boolean;
}

interface SmartCopyConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (forceOverwrite: boolean) => void;
  existingData: ExistingDataInfo;
  sourcePeriodName: string;
  loading?: boolean;
}

export const SmartCopyConfirmModal: React.FC<SmartCopyConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  existingData,
  sourcePeriodName,
  loading = false
}) => {
  const handleActionClick = (action: CopyAction) => {
    console.log('🎯 [SmartCopyConfirmModal] 用户选择操作:', action);
    onConfirm(action.force_overwrite);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const actions: CopyAction[] = [
    {
      action: "create_new_version",
      label: "创建新版本（推荐）",
      description: "保留现有数据，创建新的工资运行版本。薪资配置会被智能更新。",
      force_overwrite: false
    },
    {
      action: "overwrite_replace", 
      label: "强制覆盖",
      description: "⚠️ 将直接更新现有的薪资配置数据，可能覆盖手动调整的内容。",
      force_overwrite: true
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>确认复制操作</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      maskClosable={false}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* 警告提示 */}
        <Alert
          type="warning"
          showIcon
          message="检测到目标期间已有数据"
          description={`目标期间「${existingData.target_period_name}」已包含工资记录和薪资配置，请选择处理方式。`}
          style={{ marginBottom: 24 }}
        />

        {/* 现有数据概览 */}
        <Card 
          title={
            <Space>
              <InfoCircleOutlined />
              <span>现有数据概览</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card type="inner" title="工资记录">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="工资运行次数">
                    <Text strong>{existingData.summary.total_payroll_runs}</Text> 次
                  </Descriptions.Item>
                  <Descriptions.Item label="工资条目总数">
                    <Text strong>{existingData.summary.total_payroll_entries}</Text> 条
                  </Descriptions.Item>
                </Descriptions>
                
                {existingData.payroll_data.runs.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>最近运行记录：</Text>
                    {existingData.payroll_data.runs.slice(0, 2).map((run, index) => (
                      <div key={run.id} style={{ fontSize: '12px', marginTop: 4 }}>
                        <Text type="secondary">
                          {formatDate(run.run_date)} - {run.status_name} - {run.entries_count}条 - {formatAmount(run.total_net_pay)}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
            
            <Col span={12}>
              <Card type="inner" title="薪资配置">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="配置记录数">
                    <Text strong>{existingData.summary.total_salary_configs}</Text> 条
                  </Descriptions.Item>
                  <Descriptions.Item label="涉及员工数">
                    <Text strong>{existingData.summary.employees_with_configs}</Text> 人
                  </Descriptions.Item>
                </Descriptions>
                <Alert
                  type="info"
                  message="包含社保基数、公积金基数等配置"
                  style={{ marginTop: 8, fontSize: '12px' }}
                  showIcon={false}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 复制操作说明 */}
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: '#1890ff' }} />
              <span>复制操作说明</span>
            </Space>
          }
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Paragraph>
            <Text strong>从源期间：</Text>{sourcePeriodName}
            <br />
            <Text strong>到目标期间：</Text>{existingData.target_period_name}
          </Paragraph>
          
          <Paragraph type="secondary" style={{ fontSize: '13px' }}>
            • <Text strong>工资条目：</Text>将创建新的工资运行版本，不会覆盖现有记录<br />
            • <Text strong>薪资配置：</Text>会更新员工的社保基数、公积金基数等配置信息<br />
            • <Text strong>影响范围：</Text>所有活跃员工的薪资配置都可能被更新
          </Paragraph>
        </Card>

        {/* 操作选择 */}
        <Title level={5}>请选择处理方式：</Title>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {actions.map((action, index) => (
            <Card
              key={action.action}
              hoverable
              size="small"
              style={{
                border: action.force_overwrite ? '1px solid #ff7875' : '1px solid #1890ff',
                backgroundColor: action.force_overwrite ? '#fff2f0' : '#f6ffed'
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <Row align="middle" justify="space-between">
                <Col flex={1}>
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: '14px' }}>
                      {action.label}
                      {!action.force_overwrite && <Text type="success"> ✓</Text>}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {action.description}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Button
                    type={action.force_overwrite ? "default" : "primary"}
                    onClick={() => handleActionClick(action)}
                    loading={loading}
                    danger={action.force_overwrite}
                  >
                    选择此方式
                  </Button>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>

        <Divider />

        {/* 底部操作 */}
        <Row justify="end">
          <Space>
            <Button onClick={onCancel} disabled={loading}>
              取消
            </Button>
          </Space>
        </Row>
      </div>
    </Modal>
  );
};

export default SmartCopyConfirmModal; 