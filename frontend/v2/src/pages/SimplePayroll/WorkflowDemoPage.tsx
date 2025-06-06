import React, { useState } from 'react';
import { Layout, Card, Row, Col, Select, Space, Button, Tag, Typography } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { PayrollWorkflowGuide } from './components/PayrollWorkflowGuide';
import type { PayrollRunResponse, AuditSummary } from './types/simplePayroll';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

// 模拟数据
const mockPayrollRuns: PayrollRunResponse[] = [
  {
    id: 50,
    version_number: 1,
    status_name: 'PRUN_CALCULATED',
    initiated_at: '2024-01-15T10:00:00Z',
    calculated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 52,
    version_number: 2,
    status_name: '已计算',
    initiated_at: '2024-01-16T09:00:00Z',
    calculated_at: '2024-01-16T09:45:00Z'
  },
  {
    id: 53,
    version_number: 3,
    status_name: 'IN_REVIEW',
    initiated_at: '2024-01-17T08:00:00Z',
    calculated_at: '2024-01-17T08:30:00Z'
  }
];

const mockAuditSummary: AuditSummary = {
  total_entries: 53,
  total_anomalies: 5,
  error_count: 2,
  warning_count: 3,
  auto_fixable_count: 1
};

const WorkflowDemoPage: React.FC = () => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [selectedRunId, setSelectedRunId] = useState<number>(52);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const selectedRun = mockPayrollRuns.find(run => run.id === selectedRunId);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    console.log('刷新数据');
  };

  const handleNavigateToBulkImport = () => {
    console.log('导航到批量导入页面');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 页面标题 */}
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            工资流程引导演示
          </Title>
        </div>
      </Header>

      <Content style={{ padding: '24px' }}>
        {/* 说明区域 */}
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>💡 智能流程引导系统</Title>
          <Paragraph>
            这是一个全新设计的工资处理流程引导系统，旨在为用户提供直观、清晰的操作指导。
            系统会根据当前工资运行的状态，自动显示对应的操作步骤和可用功能。
          </Paragraph>
          
          <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
            <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>✨ 主要特性：</Title>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>📊 <strong>智能状态识别</strong>：自动识别当前工资运行状态，显示对应操作</li>
              <li>🎯 <strong>步骤式引导</strong>：清晰的步骤进度条，用户始终知道当前位置</li>
              <li>🔒 <strong>条件控制</strong>：只有满足条件才能进入下一步，确保流程正确性</li>
              <li>⚡ <strong>一键操作</strong>：每个步骤提供相应的快捷操作按钮</li>
              <li>💡 <strong>智能提示</strong>：提供操作要求和实用提示</li>
            </ul>
          </div>
        </Card>

        {/* 控制区域 */}
        <Card style={{ marginBottom: 24 }}>
          <Space size="large">
            <div>
              <label style={{ marginRight: 8 }}>选择工资运行：</label>
              <Select
                style={{ width: 300 }}
                value={selectedRunId}
                onChange={setSelectedRunId}
              >
                {mockPayrollRuns.map(run => (
                  <Select.Option key={run.id} value={run.id}>
                    <div>
                      <div>运行 #{run.id} - 版本 {run.version_number}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        状态: {run.status_name}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {selectedRun && (
              <div>
                <label style={{ marginRight: 8 }}>当前状态：</label>
                <Tag 
                  color={
                    selectedRun.status_name === '已计算' || selectedRun.status_name === 'PRUN_CALCULATED' ? 'blue' :
                    selectedRun.status_name === 'IN_REVIEW' ? 'orange' :
                    selectedRun.status_name === 'APPROVED' ? 'green' :
                    'default'
                  }
                  style={{ fontSize: '13px', padding: '4px 8px' }}
                >
                  {selectedRun.status_name}
                </Tag>
              </div>
            )}

            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </Card>

        {/* 工作流引导组件展示 */}
        <Row gutter={[24, 24]}>
          {/* 增强版工作流引导 */}
          <Col xs={24} lg={12}>
            <EnhancedWorkflowGuide
              selectedVersion={selectedRun || null}
              auditSummary={selectedRun?.status_name === '已计算' || selectedRun?.status_name === 'PRUN_CALCULATED' ? mockAuditSummary : null}
              onRefresh={handleRefresh}
              onNavigateToBulkImport={handleNavigateToBulkImport}
            />
          </Col>

          {/* 基础版工作流引导 */}
          <Col xs={24} lg={12}>
            <PayrollWorkflowGuide
              selectedVersion={selectedRun || null}
              onRefresh={handleRefresh}
            />
          </Col>
        </Row>

        {/* 使用说明 */}
        <Card style={{ marginTop: 24 }}>
          <Title level={4}>🎮 使用说明</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{ background: '#f0f7ff', padding: '16px', borderRadius: '6px' }}>
                <Title level={5} style={{ color: '#1890ff' }}>左侧：增强版引导</Title>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>集成实际API调用</li>
                  <li>智能状态检测</li>
                  <li>条件控制和阻塞提示</li>
                  <li>实时审核状态显示</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ background: '#fff7e6', padding: '16px', borderRadius: '6px' }}>
                <Title level={5} style={{ color: '#fa8c16' }}>右侧：基础版引导</Title>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>纯UI展示组件</li>
                  <li>步骤流程可视化</li>
                  <li>操作要求和提示</li>
                  <li>可扩展的配置结构</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </Content>
    </Layout>
  );
};

export default WorkflowDemoPage; 