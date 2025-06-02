import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Row, Col, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  MoneyCollectOutlined, 
  CalendarOutlined,
  BankOutlined
} from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';

const { Text } = Typography;

interface KpiOverviewSectionProps {
  data: any;
  timeDimension: string;
}

const KpiOverviewSection: React.FC<KpiOverviewSectionProps> = ({ data, timeDimension }) => {
  const { t } = useTranslation();

  console.log('KpiOverviewSection render - data:', data);
  console.log('KpiOverviewSection render - data type:', typeof data);
  console.log('KpiOverviewSection render - data keys:', data ? Object.keys(data) : 'null');

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Typography.Text type="secondary">{t('dashboard:auto_text_e69a82')}</Typography.Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <span>📊 薪资管理概览</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[24, 16]}>
        {/* 当前员工数量 */}
        <Col xs={24} sm={12} md={8}>
          <StatisticCard
            statistic={{
              title: '当前员工数量',
              value: data.currentEmployeeCount,
              icon: <UserOutlined style={{ color: '#1890ff' }} />,
              description: (
                <Text type="secondary">在职员工总数</Text>
              ),
            }}
            style={{ height: 120 }}
          />
        </Col>

        {/* 上个月薪资总额 */}
        <Col xs={24} sm={12} md={8}>
          <StatisticCard
            statistic={{
              title: '上个月薪资总额',
              value: data.lastMonthPayrollTotal,
              precision: 2,
              suffix: '万元',
              valueStyle: { color: '#52c41a' },
              icon: <MoneyCollectOutlined style={{ color: '#52c41a' }} />,
              description: (
                <Text type="secondary">上月已完成薪资发放</Text>
              ),
              formatter: (value) => `${(Number(value) / 10000).toFixed(2)}`,
            }}
            style={{ height: 120 }}
          />
        </Col>

        {/* 今年目前为止的薪资总额 */}
        <Col xs={24} sm={12} md={8}>
          <StatisticCard
            statistic={{
              title: '今年薪资总额',
              value: data.yearToDatePayrollTotal,
              precision: 2,
              suffix: '万元',
              valueStyle: { color: '#722ed1' },
              icon: <CalendarOutlined style={{ color: '#722ed1' }} />,
              description: (
                <Text type="secondary">年初至今累计发放</Text>
              ),
              formatter: (value) => `${(Number(value) / 10000).toFixed(2)}`,
            }}
            style={{ height: 120 }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default KpiOverviewSection;
