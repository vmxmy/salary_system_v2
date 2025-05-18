import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Empty } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, AuditOutlined, MoneyCollectOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { Line, Pie, Column, Gauge, type LineConfig, type PieConfig, type ColumnConfig, type GaugeConfig } from '@ant-design/charts';
// 假设我们有一个API服务来获取数据，这里我们先用模拟函数替代
// import { getDashboardKpis, getSalaryTrend, getDepartmentSalaryDistribution, getEmployeeGradeDistribution } from '../services/dashboardService';

const { Title, Text } = Typography;

// 模拟 API 数据类型 (实际项目中应从后端 API 定义获取)
interface KpiData {
  totalEmployees: number;
  totalEmployeesLastMonth: number;
  monthlyPayroll: number;
  monthlyPayrollLastMonth: number;
  pendingApprovals: number;
  averageSalary: number;
  averageSalaryLastMonth: number;
}

interface SalaryTrendItem {
  month: string;
  totalPayroll: number;
}

interface DepartmentSalaryItem {
  department: string;
  totalPayroll: number;
}

interface EmployeeGradeItem {
  grade: string;
  count: number;
}

// 模拟 API 调用 (实际项目中会是异步的，并从API获取)
const mockFetchKpis = (): Promise<KpiData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalEmployees: 1320,
        totalEmployeesLastMonth: 1250,
        monthlyPayroll: 1250000,
        monthlyPayrollLastMonth: 1200000,
        pendingApprovals: 5,
        averageSalary: 8333,
        averageSalaryLastMonth: 8275,
      });
    }, 500);
  });
};

const mockFetchSalaryTrend = (): Promise<SalaryTrendItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { month: '10-13', totalPayroll: 500000 },
        { month: '10-14', totalPayroll: 450000 },
        { month: '10-15', totalPayroll: 300000 },
        { month: '10-16', totalPayroll: 600000 },
      ]);
    }, 700);
  });
};

const mockFetchDepartmentSalary = (): Promise<DepartmentSalaryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { department: 'PD', totalPayroll: 1600 },
        { department: 'FE', totalPayroll: 1000 },
        { department: 'UX', totalPayroll: 400 },
      ]);
    }, 600);
  });
};

const mockFetchEmployeeGrades = (): Promise<EmployeeGradeItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { grade: 'P4', count: 60 },
        { grade: 'P5', count: 50 },
        { grade: 'P6', count: 30 },
        { grade: 'P7', count: 10 },
      ]);
    }, 800);
  });
};

const cardBaseStyle: React.CSSProperties = {
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  border: 'none',
  padding: '16px',
};

const kpiCardStyle: React.CSSProperties = {
  ...cardBaseStyle,
  height: '175px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const chartCardStyle: React.CSSProperties = {
  ...cardBaseStyle,
};

const DashboardPage: React.FC = () => {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [salaryTrend, setSalaryTrend] = useState<SalaryTrendItem[]>([]);
  const [departmentSalary, setDepartmentSalary] = useState<DepartmentSalaryItem[]>([]);
  const [employeeGrades, setEmployeeGrades] = useState<EmployeeGradeItem[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingKpis(true);
        const kpis = await mockFetchKpis();
        setKpiData(kpis);
      } catch (error) {
        console.error("Failed to fetch KPI data:", error);
        // 在这里可以设置错误状态并在UI中显示
      } finally {
        setLoadingKpis(false);
      }

      try {
        setLoadingCharts(true);
        const [trend, dept, grades] = await Promise.all([
          mockFetchSalaryTrend(),
          mockFetchDepartmentSalary(),
          mockFetchEmployeeGrades(),
        ]);
        setSalaryTrend(trend);
        setDepartmentSalary(dept);
        setEmployeeGrades(grades);
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoadingCharts(false);
      }
    };
    fetchData();
  }, []);

  const getStatisticChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
  };
  
  const renderStatisticChange = (change: number, isKpiGauge: boolean = false) => {
    if (change === 0 && !isKpiGauge) return null;
    const isPositive = change >= 0;
    const color = isPositive ? '#3f8600' : '#cf1322';
    if (isKpiGauge) {
        return <Text style={{ fontSize: '12px', color, marginLeft: '4px' }}>{isPositive ? '↑' : '↓'}{Math.abs(change)}%</Text>;
    }
    return (
      <span style={{ color, fontSize: '11px', marginLeft: '4px' }}> 
        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change)}%
      </span>
    );
  };

  const salaryTrendConfig: LineConfig = {
    data: salaryTrend,
    xField: 'month',
    yField: 'totalPayroll',
    height: 280,
    point: { size: 5, shape: 'diamond' },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    tooltip: {
      formatter: (datum: any) => ({ name: '薪资总额', value: `${(datum.totalPayroll / 10000).toFixed(2)} 万` }),
    },
    yAxis: {
      label: {
        formatter: (v: any) => `${(parseFloat(v) / 10000).toFixed(0)} 万`,
      },
    },
  };

  const departmentSalaryConfig: PieConfig = {
    data: departmentSalary,
    angleField: 'totalPayroll',
    colorField: 'department',
    radius: 0.75,
    innerRadius: 0.6,
    height: 280,
    label: {
      formatter: (datum: any) => {
          if (datum && typeof datum.department === 'string' && typeof datum.totalPayroll === 'number') {
              return `${datum.department}\n${datum.totalPayroll}`;
          }
          return '';
      },
      style: {
        textAlign: 'center',
        fontSize: 11,
      },
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
    legend: { layout: 'horizontal', position: 'bottom', itemSpacing: 8 },
    tooltip: {
        formatter: (datum: any) => ({ name: datum.department, value: `${datum.totalPayroll}` }),
    }
  };

  const employeeGradeConfig: ColumnConfig = {
    data: employeeGrades,
    xField: 'grade',
    yField: 'count',
    height: 280,
    label: {
      position: 'top',
      style: {
        fill: '#333333',
        opacity: 0.7,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      grade: { alias: '职级' },
      count: { alias: '人数' },
    },
  };

  if (loadingKpis || !kpiData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}><Spin size="large" tip="加载仪表盘数据中..." /></div>;
  }
  
  const employeeChange = kpiData ? getStatisticChange(kpiData.totalEmployees, kpiData.totalEmployeesLastMonth) : 0;
  const payrollChange = kpiData ? getStatisticChange(kpiData.monthlyPayroll, kpiData.monthlyPayrollLastMonth) : 0;
  const avgSalaryChange = kpiData ? getStatisticChange(kpiData.averageSalary, kpiData.averageSalaryLastMonth) : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          {kpiData ? (
            <Card style={kpiCardStyle} hoverable>
              <div>
                <Statistic
                  title="员工人数"
                  value={kpiData.totalEmployees} 
                  valueStyle={{ color: employeeChange >= 0 ? '#3f8600' : '#cf1322' }}
                  formatter={() => ( 
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
                      <span style={{ fontSize: '22px' }}>{kpiData?.totalEmployees.toLocaleString()}</span>
                    </span>
                  )}
                />
              </div>
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                较上期 {renderStatisticChange(employeeChange)}
              </div>
            </Card>
          ) : (
            <Card style={{...kpiCardStyle, justifyContent: 'center', alignItems: 'center' }}>
              <Spin tip="加载中..." />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          {kpiData ? (
            <Card style={kpiCardStyle} hoverable>
              <div>
                <Statistic
                  title="本月薪资"
                  value={kpiData.monthlyPayroll}
                  precision={2}
                  valueStyle={{ color: payrollChange >= 0 ? '#3f8600' : '#cf1322' }}
                  formatter={(value) => (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <MoneyCollectOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
                      <span style={{ fontSize: '22px' }}>{(Number(value)/10000).toFixed(2)}</span>
                      <span style={{ fontSize: '12px', marginLeft: '4px', color: 'rgba(0,0,0,0.65)' }}>万元</span>
                    </span>
                  )}
                />
              </div>
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  较上期 {renderStatisticChange(payrollChange)}
              </div>
            </Card>
          ) : (
            <Card style={{...kpiCardStyle, justifyContent: 'center', alignItems: 'center' }}>
               <Spin tip="加载中..." />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          {kpiData ? (
            <Card style={kpiCardStyle} hoverable>
              <div>
                <Statistic
                  title="平均薪资"
                  value={kpiData.averageSalary}
                  precision={0}
                  valueStyle={{ color: avgSalaryChange >=0 ? '#3f8600' : '#cf1322' }}
                  formatter={(value) => (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <DollarCircleOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
                      <span style={{ fontSize: '22px' }}>{Number(value).toLocaleString()}</span>
                      <span style={{ fontSize: '12px', marginLeft: '4px', color: 'rgba(0,0,0,0.65)' }}>元</span>
                    </span>
                  )}
                />
              </div>
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  较上期 {renderStatisticChange(avgSalaryChange)}
              </div>
            </Card>
          ) : (
            <Card style={{...kpiCardStyle, justifyContent: 'center', alignItems: 'center' }}> 
              <Spin tip="加载中..." />
            </Card>
          )}
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          {kpiData ? (
            <Card style={kpiCardStyle} hoverable>
              <div>
                <Statistic
                  title="待办任务"
                  value={kpiData.pendingApprovals}
                  valueStyle={{ color: kpiData.pendingApprovals > 0 ? '#cf1322' : '#3f8600' }}
                  formatter={(value) => ( 
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <AuditOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
                      <span style={{ fontSize: '22px' }}>{Number(value).toLocaleString()}</span>
                    </span>
                  )}
                />
              </div>
              <div style={{ height: 'calc(11px + 4px)' }}></div>
            </Card>
          ) : (
            <Card style={{...kpiCardStyle, justifyContent: 'center', alignItems: 'center' }}>
              <Spin tip="加载中..." />
            </Card>
          )}
        </Col>
      </Row>

      <Spin spinning={loadingCharts && !loadingKpis} tip="图表加载中...">
        <div>
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card title={<Title level={5} style={{ margin: 0 }}>薪资总额趋势 (近6个月)</Title>} style={chartCardStyle}>
                {(!loadingCharts && salaryTrend.length > 0) ? <Line {...salaryTrendConfig} /> : <div style={{height: '312px', display:'flex', justifyContent:'center', alignItems:'center'}}>{loadingCharts ? <Spin/> : <Empty description="暂无薪资趋势数据" />}</div>}
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} sm={24} md={12}>
              <Card title={<Title level={5} style={{ margin: 0 }}>部门薪资占比</Title>} style={chartCardStyle}>
                {(!loadingCharts && departmentSalary.length > 0) ? <Pie {...departmentSalaryConfig} /> : <div style={{height: '312px', display:'flex', justifyContent:'center', alignItems:'center'}}>{loadingCharts ? <Spin/> : <Empty description="暂无部门薪资数据" />}</div>}
              </Card>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Card title={<Title level={5} style={{ margin: 0 }}>员工职级分布</Title>} style={chartCardStyle}>
                {(!loadingCharts && employeeGrades.length > 0) ? <Column {...employeeGradeConfig} /> : <div style={{height: '312px', display:'flex', justifyContent:'center', alignItems:'center'}}>{loadingCharts ? <Spin/> : <Empty description="暂无员工职级数据" />}</div>}
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </div>
  );
};

export default DashboardPage;