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
        name: '财政薪酬支出',
        value: `${(datum.totalPayroll / 10000).toFixed(2)} 万元`,
      }),
    },
    yAxis: {
      label: {
        formatter: (v: any) => `${(parseFloat(v) / 10000).toFixed(0)}万`,
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
          content: '预算基准线',
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
      departmentName: item.departmentName.replace('部门', '').replace('科', '科室').replace('处', '处室')
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
        value: `${(datum.totalPayroll / 10000).toFixed(2)} 万元`,
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
        content: '财政支出',
      },
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: `${(departmentSalary.reduce((sum, item) => sum + item.totalPayroll, 0) / 10000).toFixed(1)}万`,
      },
    },
  };

  // 公务员职级分布图配置 - 政府等级特色
  const employeeGradeConfig = {
    data: employeeGrades.map(item => ({
      ...item,
      gradeName: item.gradeName
        .replace('高级', '正高级')
        .replace('中级', '副高级')
        .replace('初级', '中级')
        .replace('员工', '科员')
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
        '正高级': '#722ed1', // 紫色 - 最高级
        '副高级': '#1890ff', // 蓝色 - 高级
        '中级': '#52c41a',   // 绿色 - 中级
        '科员': '#faad14',   // 橙色 - 基础级
        '办事员': '#f5222d', // 红色 - 初级
        '其他': '#13c2c2'    // 青色 - 其他
      };
      return gradeColors[gradeName as keyof typeof gradeColors] || '#999999';
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: `${datum.gradeName}职级`,
        value: `${datum.count} 人 (${datum.percentage?.toFixed(1) || 0}%)`,
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
        formatter: (v: any) => `${v}人`,
      },
    },
  };

  // 津贴补贴分析数据（模拟）
  const allowanceData = [
    { type: '岗位津贴', amount: 180000, percentage: 35.2 },
    { type: '地区补贴', amount: 120000, percentage: 23.5 },
    { type: '交通补贴', amount: 80000, percentage: 15.7 },
    { type: '通讯补贴', amount: 60000, percentage: 11.8 },
    { type: '加班补贴', amount: 45000, percentage: 8.8 },
    { type: '其他补贴', amount: 25000, percentage: 4.9 },
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
        value: `${(datum.amount / 10000).toFixed(2)} 万元 (${datum.percentage}%)`,
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
        formatter: (v: any) => `${(parseFloat(v) / 10000).toFixed(0)}万`,
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
                  (近6个{timeDimension === 'monthly' ? '月' : timeDimension === 'quarterly' ? '季度' : '年'})
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
                <Empty description="暂无财政薪酬支出数据" />
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
                <Empty description="暂无单位薪酬数据" />
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
                <Empty description="暂无职级分布数据" />
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
