import React, { useState, useEffect, useMemo } from 'react';
import { Column } from '@ant-design/charts';
import { Spin, Empty, Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

// 导入类型定义
interface SalaryRecord {
  _consolidated_data_id: number;
  employee_name?: string | null;
  pay_period_identifier?: string | null;
  sal_establishment_type_name?: string | null;
  sal_employee_type_key?: string | null;
  sal_basic_salary?: number | null;
  sal_post_salary?: number | null;
  sal_allowance?: number | null;
  sal_subsidy?: number | null;
  sal_performance_salary?: number | null;
  sal_other_allowance?: number | null;
  [key: string]: any; // 允许其他字段
}

// 图表数据接口
interface ChartDataItem {
  pay_period: string;
  type: string;
  value: number;
}

interface SalaryByTypeChartProps {
  data: SalaryRecord[];
  loading: boolean;
}

const { Title } = Typography;

const SalaryByTypeChart: React.FC<SalaryByTypeChartProps> = ({ data, loading }) => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  // 处理数据，按编制类型和月份汇总工资总额
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }

    // 按编制类型和月份分组，计算工资总额
    const groupedData: Record<string, Record<string, number>> = {};

    data.forEach(record => {
      if (!record.pay_period_identifier || !record.sal_establishment_type_name) {
        return; // 跳过没有月份或编制类型的记录
      }

      const payPeriod = record.pay_period_identifier;
      const establishmentType = record.sal_establishment_type_name;

      // 初始化分组
      if (!groupedData[payPeriod]) {
        groupedData[payPeriod] = {};
      }
      if (!groupedData[payPeriod][establishmentType]) {
        groupedData[payPeriod][establishmentType] = 0;
      }

      // 计算工资总额 (基本工资 + 岗位工资 + 津贴 + 补贴 + 绩效工资 + 其他津贴)
      const totalSalary =
        (record.sal_basic_salary || 0) +
        (record.sal_post_salary || 0) +
        (record.sal_allowance || 0) +
        (record.sal_subsidy || 0) +
        (record.sal_performance_salary || 0) +
        (record.sal_other_allowance || 0);

      // 累加到对应分组
      groupedData[payPeriod][establishmentType] += totalSalary;
    });

    // 转换为图表所需的数据格式
    const formattedData: ChartDataItem[] = [];
    Object.entries(groupedData).forEach(([payPeriod, typeData]) => {
      Object.entries(typeData).forEach(([type, value]) => {
        formattedData.push({
          pay_period: payPeriod,
          type,
          value: Math.round(value * 100) / 100, // 保留两位小数
        });
      });
    });

    // 按月份排序
    formattedData.sort((a, b) => a.pay_period.localeCompare(b.pay_period));
    setChartData(formattedData);
  }, [data]);

  // 图表配置
  const config = useMemo(() => {
    return {
      data: chartData,
      isStack: true,
      xField: 'pay_period',
      yField: 'value',
      seriesField: 'type',
      label: {
        // 数据标签
        position: 'middle', // 'top', 'middle', 'bottom'
        style: {
          fill: '#FFFFFF',
          opacity: 0.6,
        },
      },
      xAxis: {
        title: {
          text: t('charts.salaryByType.xAxisLabel'),
        },
      },
      yAxis: {
        title: {
          text: t('charts.salaryByType.yAxisLabel'),
        },
        label: {
          formatter: (value: number) => `¥${value.toLocaleString()}`,
        },
      },
      tooltip: {
        formatter: (datum: ChartDataItem) => {
          return { name: datum.type, value: `¥${datum.value.toLocaleString()}` };
        },
      },
      interactions: [{ type: 'element-active' }],
      legend: {
        position: 'top-right',
      },
      columnStyle: {
        radius: [4, 4, 0, 0], // 柱状图圆角
      },
    };
  }, [chartData, t]);

  return (
    <Card
      title={<Title level={5}>{t('charts.salaryByType.title')}</Title>}
      style={{ marginBottom: '16px' }}
      bodyStyle={{ height: '300px', padding: '12px' }}
    >
      {loading ? (
        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </div>
      ) : chartData.length > 0 ? (
        <Column {...config} />
      ) : (
        <Empty
          description={t('charts.salaryByType.noData')}
          style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        />
      )}
    </Card>
  );
};

export default SalaryByTypeChart;
