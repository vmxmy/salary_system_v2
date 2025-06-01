import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Row, Col, Space, Typography, Progress, Statistic, Tooltip } from 'antd';
import { 
  UserOutlined, 
  MoneyCollectOutlined, 
  DollarCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  PercentageOutlined,
  BankOutlined,
  FileTextOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';

const { Text } = Typography;

interface KpiOverviewSectionProps {
  data: any;
  timeDimension: string;
}

const KpiOverviewSection: React.FC<KpiOverviewSectionProps> = ({ data, timeDimension }) => {
  const { t } = useTranslation();
  if (!data) {
    return null;
  }

  // 计算变化百分比
  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
  };

  // 渲染变化趋势
  const renderTrend = (change: number, showIcon = true) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    const color = isPositive ? '#52c41a' : '#ff4d4f';
    const Icon = isPositive ? ArrowUpOutlined : ArrowDownOutlined;
    
    return (
      <Space size={2}>
        {showIcon && <Icon style={{ color, fontSize: '12px' }} />}
        <Text style={{ color, fontSize: '12px' }}>
          {Math.abs(change)}%
        </Text>
      </Space>
    );
  };

  const employeeChange = getChangePercentage(data.totalEmployees, data.totalEmployeesLastMonth);
  const payrollChange = getChangePercentage(data.monthlyPayroll, data.monthlyPayrollLastMonth);
  const avgSalaryChange = getChangePercentage(data.averageSalary, data.averageSalaryLastMonth);

  // 政府部门特色指标
  const budgetExecution = 78.5; // 预算执行率
  const fiscalAllocationRate = 92.3; // 财政拨款到位率
  const staffingRatio = 96.8; // 编制使用率
  const complianceRate = 99.2; // 薪酬合规率

  return (
    <Card 
      title={
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <span>🏛️ 财政人事概览</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]}>
        {/* 在编人员总数 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatisticCard
            statistic={{
              title: t('dashboard:auto_text_e59ca8'),
              value: data.totalEmployees,
              icon: <UserOutlined style={{ color: '#1890ff' }} />,
              description: (
                <Space>
                  <Text type="secondary">较上期</Text>
                  {renderTrend(employeeChange)}
                </Space>
              ),
            }}
            style={{ height: 120 }}
          />
        </Col>

        {/* 薪酬支出总额 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatisticCard
            statistic={{
              title: `${timeDimension === 'monthly' ? t('dashboard:auto_text_e69c88'): timeDimension === 'quarterly' ? t('dashboard:auto_text_e5ada3'): t('dashboard:auto_text_e5b9b4')}薪酬支出`,
              value: data.monthlyPayroll,
              precision: 2,
              suffix: t('dashboard:auto_text_e4b887'),
              valueStyle: { color: '#52c41a' },
              icon: <MoneyCollectOutlined style={{ color: '#52c41a' }} />,
              description: (
                <Space>
                  <Text type="secondary">较上期</Text>
                  {renderTrend(payrollChange)}
                </Space>
              ),
              formatter: (value) => `${(Number(value) / 10000).toFixed(2)}`,
            }}
            style={{ height: 120 }}
          />
        </Col>

        {/* 人均薪酬水平 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatisticCard
            statistic={{
              title: t('dashboard:auto_text_e4baba'),
              value: data.averageSalary,
              precision: 0,
              suffix: t('dashboard:auto_text_e58583'),
              valueStyle: { color: '#722ed1' },
              icon: <DollarCircleOutlined style={{ color: '#722ed1' }} />,
              description: (
                <Space>
                  <Text type="secondary">较上期</Text>
                  {renderTrend(avgSalaryChange)}
                </Space>
              ),
            }}
            style={{ height: 120 }}
          />
        </Col>

        {/* 预算执行率 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatisticCard
            statistic={{
              title: t('dashboard:auto_text_e9a284'),
              value: budgetExecution,
              precision: 1,
              suffix: '%',
              valueStyle: { color: budgetExecution > 90 ? '#ff4d4f' : budgetExecution > 75 ? '#fa8c16' : '#52c41a' },
              icon: <PercentageOutlined style={{ color: '#fa8c16' }} />,
              description: (
                <Tooltip title={t('dashboard:auto___e5b9b4')}>
                  <Text type="secondary">年度预算进度</Text>
                </Tooltip>
              ),
            }}
            style={{ height: 120 }}
          />
        </Col>
      </Row>

      {/* 政府部门特色指标 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" title={t('dashboard:auto___f09f92')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>财政拨款到位率</Text>
                <Progress 
                  percent={fiscalAllocationRate} 
                  status={fiscalAllocationRate < 80 ? 'exception' : 'active'}
                  strokeColor={fiscalAllocationRate < 80 ? '#ff4d4f' : '#52c41a'}
                />
              </div>
              <div>
                <Text strong>薪酬支出合规率</Text>
                <Progress 
                  percent={complianceRate} 
                  status={complianceRate < 95 ? 'exception' : 'success'}
                  strokeColor={complianceRate < 95 ? '#ff4d4f' : '#52c41a'}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card size="small" title={t('dashboard:auto___f09f91')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>编制使用率</Text>
                <Progress 
                  percent={staffingRatio} 
                  status={staffingRatio > 98 ? 'exception' : 'active'}
                  strokeColor={staffingRatio > 98 ? '#ff4d4f' : '#1890ff'}
                />
              </div>
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Text type="secondary">在编: {data.totalEmployees}人</Text>
                <Text type="secondary">编制: {Math.ceil(data.totalEmployees / (staffingRatio / 100))}人</Text>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card size="small" title={t('dashboard:auto___f09f93')}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={t('dashboard:auto_text_e5be85')}
                  value={data.pendingApprovals}
                  valueStyle={{ 
                    color: data.pendingApprovals > 0 ? '#ff4d4f' : '#52c41a',
                    fontSize: '18px'
                  }}
                  prefix={<AuditOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('dashboard:auto_text_e5b7a5')}
                  value={data.activePayrollRuns}
                  valueStyle={{ 
                    color: data.activePayrollRuns > 0 ? '#1890ff' : '#999',
                    fontSize: '18px'
                  }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default KpiOverviewSection;
