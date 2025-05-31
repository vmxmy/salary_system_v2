import React from 'react';
import { Card, Row, Col, Empty } from 'antd';
import { Area, Pie, Column } from '@ant-design/charts';
import { LineChartOutlined, PieChartOutlined, BarChartOutlined } from '@ant-design/icons';

interface PayrollAnalysisSectionProps {
  salaryTrend: any[];
  departmentSalary: any[];
  employeeGrades: any[];
  timeDimension: string;
}

const PayrollAnalysisSection: React.FC<PayrollAnalysisSectionProps> = ({
  salaryTrend,
  departmentSalary,
  employeeGrades,
  timeDimension
}) => {

  // 薪酬趋势图配置 - 政府部门特色
  const salaryTrendConfig = {
    data: salaryTrend,
    xField: 'period',
    yField: 'totalPayroll',
    height: 300,
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    line: {
      color: '#1890ff',
      size: 2,
    },
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#1890ff',
        stroke: '#ffffff',
        lineWidth: 2,
      },
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: {t('dashboard:auto_text_e8b4a2')},
        value: {t('dashboard:auto__datum_totalpayroll_10000_tofixed_2__247b28')},
      }),
    },
    yAxis: {
      label: {
        formatter: (v: any) => {t('dashboard:auto__parsefloat_v_10000_tofixed_0__247b28')},
      },
    },
    xAxis: {
      label: {
        style: {
          fontSize: 12,
        },
      },
    },
    annotations: [
      {
        type: 'line',
        start: ['min', 'median'],
        end: ['max', 'median'],
        style: {
          stroke: '#ff4d4f',
          lineDash: [4, 4],
        },
        text: {
          content: {t('dashboard:auto_text_e9a284')},
          position: 'start',
          style: {
            fill: '#ff4d4f',
          },
        },
      },
    ],
  };

  // 单位薪酬分布图配置 - 政府机关特色
  const departmentSalaryConfig = {
    data: departmentSalary.map(item => ({
      ...item,
      departmentName: item.departmentName.replace({t('dashboard:auto_text_e983a8')}, '').replace({t('dashboard:auto_text_e7a791')}, {t('dashboard:auto_text_e7a791')}).replace({t('dashboard:auto_text_e5a484')}, {t('dashboard:auto_text_e5a484')})
    })),
    angleField: 'totalPayroll',
    colorField: 'departmentName',
    radius: 0.8,
    innerRadius: 0.6,
    height: 300,
    label: {
      content: ({ percent }: any) => `${(percent * 100).toFixed(1)}%`,
      style: {
        fontSize: 12,
        textAlign: 'center',
      },
    },
    legend: {
      layout: 'horizontal',
      position: 'bottom',
      itemSpacing: 8,
      maxRow: 2,
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.departmentName,
        value: {t('dashboard:auto__datum_totalpayroll_10000_tofixed_2__247b28')},
      }),
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
    statistic: {
      title: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: {t('dashboard:auto_text_e8b4a2')},
      },
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: {t('dashboard:auto__departmentsalary_reduce_sum_item_sum_item_totalpayroll_0_10000_tofixed_1__247b28')},
      },
    },
  };

  // 公务员职级分布图配置 - 政府等级特色
  const employeeGradeConfig = {
    data: employeeGrades.map(item => ({
      ...item,
      gradeName: item.gradeName
        .replace({t('dashboard:auto_text_e9ab98')}, {t('dashboard:auto_text_e6ada3')})
        .replace({t('dashboard:auto_text_e4b8ad')}, {t('dashboard:auto_text_e589af')})
        .replace({t('dashboard:auto_text_e5889d')}, {t('dashboard:auto_text_e4b8ad')})
        .replace({t('dashboard:auto_text_e59198')}, {t('dashboard:auto_text_e7a791')})
    })),
    xField: 'gradeName',
    yField: 'count',
    height: 300,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top',
      style: {
        fill: '#333333',
        opacity: 0.8,
        fontSize: 12,
      },
    },
    color: ({ gradeName }: any) => {
      // 政府职级配色方案
      const gradeColors = {
        {t('dashboard:auto_text_e6ada3')}: '#722ed1', // 紫色 - 最高级
        {t('dashboard:auto_text_e589af')}: '#1890ff', // 蓝色 - 高级
        {t('dashboard:auto_text_e4b8ad')}: '#52c41a',   // 绿色 - 中级
        {t('dashboard:auto_text_e7a791')}: '#faad14',   // 橙色 - 基础级
        {t('dashboard:auto_text_e58a9e')}: '#f5222d', // 红色 - 初级
        {t('dashboard:auto_text_e585b6')}: '#13c2c2'    // 青色 - 其他
      };
      return gradeColors[gradeName as keyof typeof gradeColors] || '#999999';
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: {t('dashboard:auto__datum_gradename__247b64')},
        value: {t('dashboard:auto__datum_count__datum_percentage_tofixed_1_0__247b64')},
      }),
    },
    xAxis: {
      label: {
        style: {
          fontSize: 12,
        },
      },
    },
    yAxis: {
      label: {
        formatter: (v: any) => {t('dashboard:auto__v__247b76')},
      },
    },
  };

  // 津贴补贴分析数据（模拟）
  const allowanceData = [
    { type: {t('dashboard:auto_text_e5b297')}, amount: 180000, percentage: 35.2 },
    { type: {t('dashboard:auto_text_e59cb0')}, amount: 120000, percentage: 23.5 },
    { type: {t('dashboard:auto_text_e4baa4')}, amount: 80000, percentage: 15.7 },
    { type: {t('dashboard:auto_text_e9809a')}, amount: 60000, percentage: 11.8 },
    { type: {t('dashboard:auto_text_e58aa0')}, amount: 45000, percentage: 8.8 },
    { type: {t('dashboard:auto_text_e585b6')}, amount: 25000, percentage: 4.9 },
  ];

  const allowanceConfig = {
    data: allowanceData,
    xField: 'type',
    yField: 'amount',
    height: 300,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top',
      style: {
        fill: '#333333',
        opacity: 0.8,
        fontSize: 11,
      },
      formatter: (datum: any) => `${(datum.amount / 1000).toFixed(0)}K`,
    },
    color: '#52c41a',
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: {t('dashboard:auto__datum_amount_10000_tofixed_2__datum_percentage__247b28')},
      }),
    },
    xAxis: {
      label: {
        style: {
          fontSize: 11,
        },
      },
    },
    yAxis: {
      label: {
        formatter: (v: any) => {t('dashboard:auto__parsefloat_v_10000_tofixed_0__247b28')},
      },
    },
  };

  return (
    <div>
      {/* 财政薪酬支出趋势分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChartOutlined style={{ color: '#1890ff' }} />
                <span>📈 财政薪酬支出趋势</span>
                <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
                  (近6个{timeDimension === 'monthly' ? {t('dashboard:auto_text_e69c88')} : timeDimension === 'quarterly' ? {t('dashboard:auto_text_e5ada3')} : {t('dashboard:auto_text_e5b9b4')}})
                </span>
              </div>
            }
            extra={
              <span style={{ fontSize: '12px', color: '#666' }}>
                💰 含基本工资、津贴补贴、绩效工资
              </span>
            }
          >
            {salaryTrend.length > 0 ? (
              <Area {...salaryTrendConfig} />
            ) : (
              <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description={t('dashboard:auto_text_e69a82')} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 薪酬结构分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 单位薪酬分布 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#52c41a' }} />
                <span>🏛️ 单位薪酬分布</span>
              </div>
            }
            extra={
              <span style={{ fontSize: '12px', color: '#666' }}>
                按行政单位统计
              </span>
            }
          >
            {departmentSalary.length > 0 ? (
              <Pie {...departmentSalaryConfig} />
            ) : (
              <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description={t('dashboard:auto_text_e69a82')} />
              </div>
            )}
          </Card>
        </Col>

        {/* 公务员职级分布 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                <span>🎖️ 公务员职级分布</span>
              </div>
            }
            extra={
              <span style={{ fontSize: '12px', color: '#666' }}>
                按国家公务员职级
              </span>
            }
          >
            {employeeGrades.length > 0 ? (
              <Column {...employeeGradeConfig} />
            ) : (
              <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description={t('dashboard:auto_text_e69a82')} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 津贴补贴结构分析 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined style={{ color: '#fa8c16' }} />
                <span>💼 津贴补贴结构分析</span>
              </div>
            }
            extra={
              <span style={{ fontSize: '12px', color: '#666' }}>
                各类津贴补贴支出统计
              </span>
            }
          >
            <Column {...allowanceConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PayrollAnalysisSection;
