import React from 'react';
import { StatisticCard } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { ReportStatisticsProps } from './types';

const ReportStatistics: React.FC<ReportStatisticsProps> = ({ summary }) => {
  const { t } = useTranslation(['reportManagement', 'common']);

  return (
    <StatisticCard.Group style={{ marginBottom: 24 }}>
      <StatisticCard
        statistic={{
          title: t('totalEmployees', '员工总数'),
          value: summary.employee_count,
          suffix: t('people', '人')
        }}
      />
      <StatisticCard
        statistic={{
          title: t('totalBasicSalary', '基本工资总额'),
          value: summary.total_basic_salary,
          prefix: '¥',
          precision: 2
        }}
      />
      <StatisticCard
        statistic={{
          title: t('totalAllowance', '津贴总额'),
          value: summary.total_allowance,
          prefix: '¥',
          precision: 2
        }}
      />
      <StatisticCard
        statistic={{
          title: t('totalNetPay', '实发工资总额'),
          value: summary.total_net_pay,
          prefix: '¥',
          precision: 2
        }}
      />
    </StatisticCard.Group>
  );
};

export default ReportStatistics; 