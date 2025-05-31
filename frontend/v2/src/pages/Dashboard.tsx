import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Empty, Tag, Progress } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../components/common/EnhancedProTable';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  UserOutlined, 
  AuditOutlined, 
  MoneyCollectOutlined, 
  DollarCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { 
  Line, 
  Pie, 
  Column, 
  Area,
  type PieConfig, 
  type ColumnConfig
} from '@ant-design/charts';
import { 
  dashboardService, 
  type DashboardKpiData,
  type SalaryTrendItem,
  type DepartmentSalaryItem,
  type EmployeeGradeItem,
  type PayrollStatusItem,
  type RecentPayrollRun
} from '../services/dashboardService';

const { Title, Text } = Typography;

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
  const [kpiData, setKpiData] = useState<DashboardKpiData | null>(null);
  const [salaryTrend, setSalaryTrend] = useState<SalaryTrendItem[]>([]);
  const [departmentSalary, setDepartmentSalary] = useState<DepartmentSalaryItem[]>([]);
  const [employeeGrades, setEmployeeGrades] = useState<EmployeeGradeItem[]>([]);
  const [payrollStatus, setPayrollStatus] = useState<PayrollStatusItem[]>([]);
  const [recentPayrollRuns, setRecentPayrollRuns] = useState<RecentPayrollRun[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingKpis(true);
        const kpis = await dashboardService.getKpiData();
        setKpiData(kpis);
      } catch (error) {
        console.error({t('common:auto_kpi__e88eb7')}, error);
      } finally {
        setLoadingKpis(false);
      }

      try {
        setLoadingCharts(true);
        const [trend, dept, grades, status, recent] = await Promise.all([
          dashboardService.getSalaryTrend(),
          dashboardService.getDepartmentSalaryDistribution(),
          dashboardService.getEmployeeGradeDistribution(),
          dashboardService.getPayrollStatusDistribution(),
          dashboardService.getRecentPayrollRuns(),
        ]);
        
        setSalaryTrend(trend);
        setDepartmentSalary(dept);
        setEmployeeGrades(grades);
        setPayrollStatus(status);
        setRecentPayrollRuns(recent);
      } catch (error) {
        console.error({t('common:auto___e88eb7')}, error);
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
  
  const renderStatisticChange = (change: number) => {
    if (change === 0) return null;
    const isPositive = change >= 0;
    const color = isPositive ? '#3f8600' : '#cf1322';
    return (
      <span style={{ color, fontSize: '11px', marginLeft: '4px' }}> 
        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(change)}%
      </span>
    );
  };

  // 薪资趋势图配置
  const salaryTrendConfig = {
    data: salaryTrend,
    xField: 'month',
    yField: 'totalPayroll',
    height: 280,
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    line: {
      color: '#1890ff',
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
        name: {t('common:auto_text_e896aa')},
        value: {t('common:auto__datum_totalpayroll_10000_tofixed_2__247b28')},
      }),
    },
    yAxis: {
      label: {
        formatter: (v: any) => {t('common:auto__parsefloat_v_10000_tofixed_0__247b28')},
      },
    },
  };

  // 部门薪资分布图配置
  const departmentSalaryConfig: PieConfig = {
    data: departmentSalary,
    angleField: 'totalPayroll',
    colorField: 'departmentName',
    radius: 0.8,
    innerRadius: 0.6,
    height: 280,
    label: {
      content: ({ percent }: any) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 12,
        textAlign: 'center',
      },
    },
    legend: {
      layout: 'horizontal',
      position: 'bottom',
      itemSpacing: 8,
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.departmentName,
        value: {t('common:auto__datum_totalpayroll_10000_tofixed_2__247b28')},
      }),
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
  };

  // 员工职级分布图配置
  const employeeGradeConfig: ColumnConfig = {
    data: employeeGrades,
    xField: 'gradeName',
    yField: 'count',
    height: 280,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top',
      style: {
        fill: '#333333',
        opacity: 0.8,
      },
    },
    color: '#52c41a',
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.gradeName,
        value: {t('common:auto__datum_count__datum_percentage_tofixed_1__247b64')},
      }),
    },
  };

  // 最近薪资审核表格列配置
  const payrollRunColumns: ProColumns<RecentPayrollRun>[] = [
    {
      title: {t('common:auto_text_e896aa')},
      dataIndex: 'periodName',
      key: 'periodName',
      ellipsis: true,
      valueType: 'text',
    },
    {
      title: {t('common:auto_text_e78ab6')},
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        {t('common:auto_text_e5b7b2')}: { text: {t('common:auto_text_e5b7b2')}, status: 'Success' },
        {t('common:auto_text_e8bf9b')}: { text: {t('common:auto_text_e8bf9b')}, status: 'Processing' },
        {t('common:auto_text_e5be85')}: { text: {t('common:auto_text_e5be85')}, status: 'Warning' },
        {t('common:auto_text_e5b7b2')}: { text: {t('common:auto_text_e5b7b2')}, status: 'Error' },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          {t('common:auto_text_e5b7b2')}: 'success',
          {t('common:auto_text_e8bf9b')}: 'processing',
          {t('common:auto_text_e5be85')}: 'warning',
          {t('common:auto_text_e5b7b2')}: 'error',
        };
        return <Tag color={colorMap[record.status] || 'default'}>{record.status}</Tag>;
      },
    },
    {
      title: {t('common:auto_text_e680bb')},
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      valueType: 'money',
      render: (_, record) => {t('common:auto__record_totalamount_10000_tofixed_2__247b28')},
    },
    {
      title: {t('common:auto_text_e59198')},
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      valueType: 'digit',
      render: (_, record) => {t('common:auto__record_employeecount__247b72')},
    },
  ];

  if (loadingKpis || !kpiData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
        <Spin size="large" tip={t('common:auto___e58aa0')}>
          <div style={{ width: '100px', height: '100px' }} /> 
        </Spin>
      </div>
    );
  }
  
  const employeeChange = getStatisticChange(kpiData.totalEmployees, kpiData.totalEmployeesLastMonth);
  const payrollChange = getStatisticChange(kpiData.monthlyPayroll, kpiData.monthlyPayrollLastMonth);
  const avgSalaryChange = getStatisticChange(kpiData.averageSalary, kpiData.averageSalaryLastMonth);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* KPI 指标卡片 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={kpiCardStyle} hoverable>
            <div>
              <Statistic
                title={t('common:auto_text_e59198')}
                value={kpiData.totalEmployees} 
                valueStyle={{ color: employeeChange >= 0 ? '#3f8600' : '#cf1322' }}
                formatter={() => ( 
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
                    <span style={{ fontSize: '22px' }}>{kpiData.totalEmployees.toLocaleString()}</span>
                  </span>
                )}
              />
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
              较上期 {renderStatisticChange(employeeChange)}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={kpiCardStyle} hoverable>
            <div>
              <Statistic
                title={t('common:auto_text_e69cac')}
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
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={kpiCardStyle} hoverable>
            <div>
              <Statistic
                title={t('common:auto_text_e5b9b3')}
                value={kpiData.averageSalary}
                precision={0}
                valueStyle={{ color: avgSalaryChange >= 0 ? '#3f8600' : '#cf1322' }}
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
        </Col>
        
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card style={kpiCardStyle} hoverable>
            <div>
              <Statistic
                title={t('common:auto_text_e5be85')}
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
            <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
              {kpiData.activePayrollRuns > 0 && {t('common:auto__kpidata_activepayrollruns__247b6b')}}
            </div>
          </Card>
        </Col>
      </Row>

      <Spin spinning={loadingCharts} tip={t('common:auto___e59bbe')}>
        {/* 薪资趋势图 */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title={<Title level={5} style={{ margin: 0 }}>💰 薪资总额趋势 (近6个月)</Title>} style={chartCardStyle}>
              {(!loadingCharts && salaryTrend.length > 0) ? 
                <Area {...salaryTrendConfig} /> : 
                <div style={{height: '312px', display:'flex', justifyContent:'center', alignItems:'center'}}>
                  {loadingCharts ? <Spin/> : <Empty description={t('common:auto_text_e69a82')} />}
                </div>
              }
            </Card>
          </Col>
        </Row>

        {/* 部门分布和职级分布 */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={24} md={12}>
            <Card title={<Title level={5} style={{ margin: 0 }}>🏢 部门薪资占比</Title>} style={chartCardStyle}>
              {(!loadingCharts && departmentSalary.length > 0) ? 
                <Pie {...departmentSalaryConfig} /> : 
                <div style={{height: '312px', display:'flex', justifyContent:'center', alignItems:'center'}}>
                  {loadingCharts ? <Spin/> : <Empty description={t('common:auto_text_e69a82')} />}
                </div>
              }
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={12}>
            <Card title={<Title level={5} style={{ margin: 0 }}>🎯 员工职级分布</Title>} style={chartCardStyle}>
              {(!loadingCharts && employeeGrades.length > 0) ? 
                <Column {...employeeGradeConfig} /> : 
                <div style={{height: '312px', display:'flex', justifyContent:'center', alignItems:'center'}}>
                  {loadingCharts ? <Spin/> : <Empty description={t('common:auto_text_e69a82')} />}
                </div>
              }
            </Card>
          </Col>
        </Row>

        {/* 最近薪资审核记录 */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title={<Title level={5} style={{ margin: 0 }}>📋 最近薪资审核记录</Title>} style={chartCardStyle}>
              {(!loadingCharts && recentPayrollRuns.length > 0) ? 
                <EnhancedProTable
                  dataSource={recentPayrollRuns}
                  columns={payrollRunColumns}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  search={false}
                  enableAdvancedFeatures={false}
                  showToolbar={false}
                /> : 
                <div style={{height: '200px', display:'flex', justifyContent:'center', alignItems:'center'}}>
                  {loadingCharts ? <Spin/> : <Empty description={t('common:auto_text_e69a82')} />}
                </div>
              }
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default DashboardPage;