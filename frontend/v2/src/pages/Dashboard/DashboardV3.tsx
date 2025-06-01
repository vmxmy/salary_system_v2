import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Row, 
  Col, 
  Card, 
  Spin, 
  message, 
  Typography, 
  Segmented, 
  Space,
  Button,
  Tooltip,
  Grid,
  App
} from 'antd';
import { 
  ReloadOutlined, 
  FullscreenOutlined,
  SettingOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import dayjs from 'dayjs';

import {
  KpiOverviewSection,
  PayrollAnalysisSection,
  ManagementEfficiencySection,
  ComplianceRiskSection
} from './components';
import { dashboardService } from '../../services/dashboardService';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface DashboardData {
  kpiData: any;
  salaryTrend: any[];
  departmentSalary: any[];
  employeeGrades: any[];
  payrollStatus: any[];
  recentPayrollRuns: any[];
}

const DashboardV3: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const screens = useBreakpoint();
  const { message: messageApi } = App.useApp();
  
  // 时间维度选项
  const TIME_DIMENSION_OPTIONS = [
    { label: t('dashboard:auto_text_e69c88'), value: 'monthly' },
    { label: t('dashboard:auto_text_e5ada3'), value: 'quarterly' },
    { label: t('dashboard:auto_text_e5b9b4'), value: 'yearly' }
  ];
  
  // 仪表盘视图选项
  const DASHBOARD_VIEW_OPTIONS = [
    { label: t('dashboard:auto___f09f92'), value: 'management' },
    { label: t('dashboard:auto___f09f93'), value: 'analytics' },
    { label: t('dashboard:auto___e29aa0'), value: 'risk' }
  ];

  // 状态管理
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeDimension, setTimeDimension] = useState<string>('monthly');
  const [dashboardView, setDashboardView] = useState<string>('management');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    kpiData: null,
    salaryTrend: [],
    departmentSalary: [],
    employeeGrades: [],
    payrollStatus: [],
    recentPayrollRuns: []
  });

  // 根据屏幕大小判断是否为移动设备
  const isMobile = !screens.md;

  // 获取仪表盘数据
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    
    try {
      const [
        kpiData,
        salaryTrend,
        departmentSalary,
        employeeGrades,
        payrollStatus,
        recentPayrollRuns
      ] = await Promise.all([
        dashboardService.getKpiData(),
        dashboardService.getSalaryTrend(),
        dashboardService.getDepartmentSalaryDistribution(),
        dashboardService.getEmployeeGradeDistribution(),
        dashboardService.getPayrollStatusDistribution(),
        dashboardService.getRecentPayrollRuns()
      ]);

      setDashboardData({
        kpiData,
        salaryTrend,
        departmentSalary,
        employeeGrades,
        payrollStatus,
        recentPayrollRuns
      });

      if (!showLoading) {
        messageApi.success(t('dashboard:auto___f09f93'));
      }
    } catch (error) {
      messageApi.error(t('dashboard:auto____e29d8c'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // 处理时间维度变化
  const handleTimeDimensionChange = useCallback((value: string) => {
    setTimeDimension(value);
    // 这里可以根据时间维度重新获取数据
    messageApi.info(t('dashboard:auto___time_dimension_options_find_opt_opt_value_value_label__f09f93'));
  }, []);

  // 处理视图切换
  const handleViewChange = useCallback((value: string) => {
    setDashboardView(value);
    const viewName = DASHBOARD_VIEW_OPTIONS.find(opt => opt.value === value)?.label;
    messageApi.info(t('dashboard:auto___viewname__f09f94'));
  }, []);

  // 初始化数据
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 渲染页面头部操作区
  const renderPageHeaderExtra = () => (
    <Space size={isMobile ? "small" : "middle"}>
      <Segmented
        options={TIME_DIMENSION_OPTIONS}
        value={timeDimension}
        onChange={handleTimeDimensionChange}
        size={isMobile ? "small" : "small"}
      />
      <Tooltip title={t('dashboard:auto_text_e588b7')}>
        <Button
          type="text"
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefresh}
          loading={refreshing}
          size={isMobile ? "small" : "middle"}
        />
      </Tooltip>
      {!isMobile && (
        <>
          <Tooltip title={t('dashboard:auto_text_e585a8')}>
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={() => messageApi.info(t('dashboard:auto___f09f94'))}
            />
          </Tooltip>
          <Tooltip title={t('dashboard:auto_text_e4bbaa')}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => messageApi.info(t('dashboard:auto___e29a99'))}
            />
          </Tooltip>
        </>
      )}
    </Space>
  );

  // 渲染视图切换器
  const renderViewSelector = () => (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Row justify="space-between" align={isMobile ? "top" : "middle"} gutter={[0, 8]}>
        <Col xs={24} md={12}>
          <Space align="center">
            <Title level={5} style={{ margin: 0 }}>
              📈 薪资管理仪表盘
            </Title>
            <Tooltip title={t('dashboard:auto_text_e6a0b9')}>
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Space>
        </Col>
        <Col xs={24} md={12} style={{ textAlign: isMobile ? 'center' : 'right' }}>
          <Segmented
            options={DASHBOARD_VIEW_OPTIONS}
            value={dashboardView}
            onChange={handleViewChange}
            size={isMobile ? 'small' : 'middle'}
            block={isMobile}
          />
        </Col>
      </Row>
    </Card>
  );

  // 渲染仪表盘内容
  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh' 
        }}>
          <Spin size="large" tip={t('dashboard:auto____f09f93')}>
            <div style={{ width: 200, height: 100 }} />
          </Spin>
        </div>
      );
    }

    return (
      <Spin spinning={refreshing} tip={t('dashboard:auto____f09f94')}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* KPI 概览区域 - 所有视图都显示 */}
          <KpiOverviewSection 
            data={dashboardData.kpiData}
            timeDimension={timeDimension}
          />

          {/* 根据选择的视图显示不同内容 */}
          {dashboardView === 'management' && (
            <>
              <ManagementEfficiencySection 
                recentPayrollRuns={dashboardData.recentPayrollRuns}
                payrollStatus={dashboardData.payrollStatus}
                timeDimension={timeDimension}
              />
              <ComplianceRiskSection 
                data={dashboardData.kpiData}
                timeDimension={timeDimension}
              />
            </>
          )}

          {dashboardView === 'analytics' && (
            <PayrollAnalysisSection 
              salaryTrend={dashboardData.salaryTrend}
              departmentSalary={dashboardData.departmentSalary}
              employeeGrades={dashboardData.employeeGrades}
              timeDimension={timeDimension}
            />
          )}

          {dashboardView === 'risk' && (
            <>
              <ComplianceRiskSection 
                data={dashboardData.kpiData}
                timeDimension={timeDimension}
                expanded={true}
              />
              <ManagementEfficiencySection 
                recentPayrollRuns={dashboardData.recentPayrollRuns}
                payrollStatus={dashboardData.payrollStatus}
                timeDimension={timeDimension}
                riskFocused={true}
              />
            </>
          )}
        </Space>
      </Spin>
    );
  };

  return (
    <PageContainer
      title={false}
      extra={renderPageHeaderExtra()}
      content={renderViewSelector()}
    >
      {/* 开发环境响应式调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <Card size="small" style={{ marginBottom: 16, background: '#f0f2f5' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            📱 响应式调试: 
            {screens.xs && ' XS'}
            {screens.sm && ' SM'}
            {screens.md && ' MD'}
            {screens.lg && ' LG'}
            {screens.xl && ' XL'}
            {screens.xxl && ' XXL'}
            {isMobile ?      t('dashboard:auto____2028e7'): t('dashboard:auto____2028e6')}
          </Text>
        </Card>
      )}
      {renderDashboardContent()}
    </PageContainer>
  );
};

export default DashboardV3;
