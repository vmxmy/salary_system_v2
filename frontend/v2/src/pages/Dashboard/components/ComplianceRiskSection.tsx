import React from 'react';
import { Row, Col, Card, Alert, Progress, Typography, Space, Badge, List, Tag, Tooltip } from 'antd';
import { 
  SecurityScanOutlined, 
  WarningOutlined, 
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  BankOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';

const { Text, Title } = Typography;

interface ComplianceRiskSectionProps {
  data: any;
  timeDimension: string;
  expanded?: boolean;
}

const ComplianceRiskSection: React.FC<ComplianceRiskSectionProps> = ({ 
  data, 
  timeDimension, 
  expanded = false 
}) => {
  // 政府部门合规性数据
  const complianceData = {
    auditCompliance: 98.5, // 审计署合规率
    fiscalDiscipline: 99.2, // 财政纪律合规率
    civilServantLaw: 96.8, // 公务员法合规率
    salaryStandard: 94.3, // 薪酬标准合规率
    budgetCompliance: 91.7, // 预算执行合规率
    antiCorruption: 99.8, // 廉政建设合规率
  };

  // 政府部门风险预警数据
  const riskAlerts = [
    {
      id: 1,
      type: 'budget_overrun',
      title: '预算超支风险',
      description: '某单位薪酬支出接近年度预算上限',
      level: 'high',
      affectedEmployees: 25,
      potentialCost: 150000,
      dueDate: '2024-06-01',
      department: '财政局'
    },
    {
      id: 2,
      type: 'audit_finding',
      title: '审计发现问题',
      description: '津贴发放标准与规定不符',
      level: 'high',
      affectedEmployees: 12,
      potentialCost: 80000,
      dueDate: '2024-05-25',
      department: '人事局'
    },
    {
      id: 3,
      type: 'salary_standard_violation',
      title: '薪酬标准违规',
      description: '部分岗位薪酬超出国家标准',
      level: 'medium',
      affectedEmployees: 8,
      potentialCost: 45000,
      dueDate: '2024-06-10',
      department: '组织部'
    },
    {
      id: 4,
      type: 'fiscal_discipline',
      title: '财政纪律检查',
      description: '发现违规发放补贴情况',
      level: 'medium',
      affectedEmployees: 5,
      potentialCost: 30000,
      dueDate: '2024-06-15',
      department: '纪委监委'
    }
  ];

  // 政府部门证件到期提醒
  const expiringDocuments = [
    { type: '公务员证', count: 15, nearestExpiry: '2024-06-05' },
    { type: '职业资格证', count: 12, nearestExpiry: '2024-06-10' },
    { type: '保密协议', count: 8, nearestExpiry: '2024-06-20' },
    { type: '廉政承诺书', count: 6, nearestExpiry: '2024-07-01' },
    { type: '任职文件', count: 4, nearestExpiry: '2024-07-15' }
  ];

  // 获取风险级别颜色
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#999';
    }
  };

  // 获取合规率状态
  const getComplianceStatus = (rate: number) => {
    if (rate >= 98) return { status: 'success' as const, color: '#52c41a' };
    if (rate >= 95) return { status: 'active' as const, color: '#faad14' };
    return { status: 'exception' as const, color: '#ff4d4f' };
  };

  return (
    <div>
      {/* 政府合规性状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <AuditOutlined style={{ color: '#52c41a' }} />
                <span>🏛️ 政府合规监察</span>
              </Space>
            }
            extra={
              <Space>
                <Tag color="blue">审计署监管</Tag>
                <Tag color="green">财政部监督</Tag>
                <Tag color="orange">纪委监察</Tag>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <StatisticCard
                  statistic={{
                    title: '审计署合规率',
                    value: complianceData.auditCompliance,
                    precision: 1,
                    suffix: '%',
                    valueStyle: { color: getComplianceStatus(complianceData.auditCompliance).color },
                  }}
                  chart={
                    <Progress 
                      percent={complianceData.auditCompliance} 
                      status={getComplianceStatus(complianceData.auditCompliance).status}
                      strokeColor={getComplianceStatus(complianceData.auditCompliance).color}
                      showInfo={false}
                      size="small"
                    />
                  }
                  style={{ height: 100 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <StatisticCard
                  statistic={{
                    title: '财政纪律合规率',
                    value: complianceData.fiscalDiscipline,
                    precision: 1,
                    suffix: '%',
                    valueStyle: { color: getComplianceStatus(complianceData.fiscalDiscipline).color },
                  }}
                  chart={
                    <Progress 
                      percent={complianceData.fiscalDiscipline} 
                      status={getComplianceStatus(complianceData.fiscalDiscipline).status}
                      strokeColor={getComplianceStatus(complianceData.fiscalDiscipline).color}
                      showInfo={false}
                      size="small"
                    />
                  }
                  style={{ height: 100 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <StatisticCard
                  statistic={{
                    title: '公务员法合规率',
                    value: complianceData.civilServantLaw,
                    precision: 1,
                    suffix: '%',
                    valueStyle: { color: getComplianceStatus(complianceData.civilServantLaw).color },
                  }}
                  chart={
                    <Progress 
                      percent={complianceData.civilServantLaw} 
                      status={getComplianceStatus(complianceData.civilServantLaw).status}
                      strokeColor={getComplianceStatus(complianceData.civilServantLaw).color}
                      showInfo={false}
                      size="small"
                    />
                  }
                  style={{ height: 100 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <StatisticCard
                  statistic={{
                    title: '薪酬标准合规率',
                    value: complianceData.salaryStandard,
                    precision: 1,
                    suffix: '%',
                    valueStyle: { color: getComplianceStatus(complianceData.salaryStandard).color },
                  }}
                  chart={
                    <Progress 
                      percent={complianceData.salaryStandard} 
                      status={getComplianceStatus(complianceData.salaryStandard).status}
                      strokeColor={getComplianceStatus(complianceData.salaryStandard).color}
                      showInfo={false}
                      size="small"
                    />
                  }
                  style={{ height: 100 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <StatisticCard
                  statistic={{
                    title: '预算执行合规率',
                    value: complianceData.budgetCompliance,
                    precision: 1,
                    suffix: '%',
                    valueStyle: { color: getComplianceStatus(complianceData.budgetCompliance).color },
                  }}
                  chart={
                    <Progress 
                      percent={complianceData.budgetCompliance} 
                      status={getComplianceStatus(complianceData.budgetCompliance).status}
                      strokeColor={getComplianceStatus(complianceData.budgetCompliance).color}
                      showInfo={false}
                      size="small"
                    />
                  }
                  style={{ height: 100 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <StatisticCard
                  statistic={{
                    title: '廉政建设合规率',
                    value: complianceData.antiCorruption,
                    precision: 1,
                    suffix: '%',
                    valueStyle: { color: getComplianceStatus(complianceData.antiCorruption).color },
                  }}
                  chart={
                    <Progress 
                      percent={complianceData.antiCorruption} 
                      status={getComplianceStatus(complianceData.antiCorruption).status}
                      strokeColor={getComplianceStatus(complianceData.antiCorruption).color}
                      showInfo={false}
                      size="small"
                    />
                  }
                  style={{ height: 100 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 监察风险预警 */}
        <Col xs={24} lg={expanded ? 24 : 12}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>⚠️ 监察风险预警</span>
                <Badge count={riskAlerts.filter(alert => alert.level === 'high').length} />
              </Space>
            }
            extra={
              <Space>
                <Tag color="red">高风险: {riskAlerts.filter(alert => alert.level === 'high').length}</Tag>
                <Tag color="orange">中风险: {riskAlerts.filter(alert => alert.level === 'medium').length}</Tag>
              </Space>
            }
          >
            <List
              dataSource={riskAlerts}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        status={alert.level === 'high' ? 'error' : alert.level === 'medium' ? 'warning' : 'success'} 
                      />
                    }
                    title={
                      <Space>
                        <Text strong style={{ color: getRiskLevelColor(alert.level) }}>
                          {alert.title}
                        </Text>
                        <Tag color="blue">{alert.department}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{alert.description}</Text>
                        <Space size={16}>
                          <Text type="secondary">
                            <ExclamationCircleOutlined /> 涉及人员: {alert.affectedEmployees}人
                          </Text>
                          <Text type="secondary">
                            <BankOutlined /> 潜在损失: ¥{alert.potentialCost.toLocaleString()}
                          </Text>
                          <Text type="secondary">
                            <ClockCircleOutlined /> 整改期限: {alert.dueDate}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 证件到期提醒 */}
        <Col xs={24} lg={expanded ? 24 : 12}>
          <Card 
            title={
              <Space>
                <FileProtectOutlined style={{ color: '#1890ff' }} />
                <span>📋 证件到期提醒</span>
                <Badge count={expiringDocuments.reduce((sum, doc) => sum + doc.count, 0)} />
              </Space>
            }
          >
            <List
              dataSource={expiringDocuments}
              renderItem={(doc) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                    title={
                      <Space>
                        <Text strong>{doc.type}</Text>
                        <Badge count={doc.count} style={{ backgroundColor: '#faad14' }} />
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        最近到期: {doc.nearestExpiry}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 合规建议 */}
      {expanded && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                  <span>💡 合规建议</span>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Alert
                    message="审计整改建议"
                    description="建议建立薪酬发放审批流程，确保所有津贴补贴发放符合国家标准。"
                    type="info"
                    showIcon
                    icon={<AuditOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Alert
                    message="财政纪律提醒"
                    description="严格按照预算执行薪酬支出，避免超预算发放和违规发放。"
                    type="warning"
                    showIcon
                    icon={<BankOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Alert
                    message="廉政风险防控"
                    description="定期开展薪酬发放专项检查，防范廉政风险和违纪违法行为。"
                    type="success"
                    showIcon
                    icon={<SafetyCertificateOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ComplianceRiskSection;
