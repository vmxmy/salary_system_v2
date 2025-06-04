import React from 'react';
import { Card, Space, Typography, Badge, Row, Col } from 'antd';
import { StatisticCard } from '@ant-design/pro-components';

const { Text } = Typography;

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  suffix?: string;
  prefix?: string;
  status?: 'default' | 'success' | 'processing' | 'error' | 'warning';
  trend?: {
    flag: 'up' | 'down';
    value: number | string;
  };
  description?: string;
  loading?: boolean;
  bordered?: boolean;
  colSpan?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  suffix,
  prefix,
  status = 'default',
  trend,
  description,
  loading = false,
  bordered = true,
  colSpan = { xs: 24, sm: 12, md: 6, lg: 6, xl: 6 },
  onClick
}) => {
  return (
    <StatisticCard
      bordered={bordered}
      loading={loading}
      colSpan={colSpan}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      statistic={{
        title,
        value,
        icon,
        suffix,
        prefix,
        status,
        trend: trend?.flag,
        description,
        valueStyle: {
          fontSize: '24px',
          fontWeight: 'bold',
        },
      }}
    />
  );
};

// 指标卡组
export interface MetricCardGroupProps {
  metrics: MetricCardProps[];
  direction?: 'row' | 'column';
  gutter?: number;
  loading?: boolean;
}

export const MetricCardGroup: React.FC<MetricCardGroupProps> = ({
  metrics,
  direction = 'row',
  gutter = 16,
  loading = false
}) => {
  if (direction === 'row') {
    return (
      <Row gutter={[gutter, gutter]}>
        {metrics.map((metric, index) => (
          <Col key={index} {...metric.colSpan}>
            <StatisticCard
              bordered={metric.bordered}
              loading={loading || metric.loading}
              onClick={metric.onClick}
              style={{ 
                cursor: metric.onClick ? 'pointer' : 'default',
                height: '100%'
              }}
              statistic={{
                title: metric.title,
                value: metric.value,
                icon: metric.icon,
                suffix: metric.suffix,
                prefix: metric.prefix,
                status: metric.status,
                trend: metric.trend?.flag,
                description: metric.description,
                valueStyle: {
                  fontSize: '24px',
                  fontWeight: 'bold',
                },
              }}
            />
          </Col>
        ))}
      </Row>
    );
  }

  // 垂直布局使用原来的方式
  return (
    <StatisticCard.Group direction={direction} style={{ gap: gutter }}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
          loading={loading || metric.loading}
        />
      ))}
    </StatisticCard.Group>
  );
};

export default MetricCard; 