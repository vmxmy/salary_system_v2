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

import styles from './DashboardV3.module.less';

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
    { label: t('dashboard:unit_month'), value: 'monthly' },
    { label: t('dashboard:unit_quarter'), value: 'quarterly' },
    { label: t('dashboard:unit_year'), value: 'yearly' }
  ];
  
  // 仪表盘视图选项
  const DASHBOARD_VIEW_OPTIONS = [
    { label: t('dashboard:management_overview'), value: 'management' },
    { label: t('dashboard:data_analysis'), value: 'analytics' },
    { label: t('dashboard:risk_monitoring'), value: 'risk' }
  ];

  // 状态管理
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeDimension, setTimeDimension] = useState<string>('monthly');
  const [dashboardView, setDashboardView] = useState<string>('management');
  const [kpiDataState, setKpiDataState] = useState<any>(null); // New separate state for KPI data
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
      // 独立获取KPI数据，避免被其他API影响
      try {
        const kpiData = await dashboardService.getKpiData();
        console.log('KPI data fetched successfully:', kpiData);
        setKpiDataState(kpiData);
      } catch (kpiError) {
        console.error('Failed to fetch KPI data:', kpiError);
        setKpiDataState({
          currentEmployeeCount: 0,
          lastMonthPayrollTotal: 0,
          yearToDatePayrollTotal: 0,
        });
      }

      // 获取其他数据，即使失败也不影响KPI显示
      const [
        salaryTrend,
        departmentSalary,
        employeeGrades,
        payrollStatus,
        recentPayrollRuns
      ] = await Promise.allSettled([
        dashboardService.getSalaryTrend(),
        dashboardService.getDepartmentSalaryDistribution(),
        dashboardService.getEmployeeGradeDistribution(),
        dashboardService.getPayrollStatusDistribution(),
        dashboardService.getRecentPayrollRuns()
      ]);

      // 处理Promise.allSettled的结果
      const getSafeValue = (result: any, defaultValue: any) => {
        return result.status === 'fulfilled' ? result.value : defaultValue;
      };

      setDashboardData({
        kpiData: null, // KPI数据已经单独设置到kpiDataState
        salaryTrend: getSafeValue(salaryTrend, []),
        departmentSalary: getSafeValue(departmentSalary, []),
        employeeGrades: getSafeValue(employeeGrades, []),
        payrollStatus: getSafeValue(payrollStatus, []),
        recentPayrollRuns: getSafeValue(recentPayrollRuns, [])
      });

      if (!showLoading) {
        messageApi.success(t('dashboard:loading_dashboard'));
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      messageApi.error(t('dashboard:error_fetching_dashboard_data_retry'));
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
    messageApi.info(t('dashboard:time_dimension_switched', { dimension: TIME_DIMENSION_OPTIONS.find(opt => opt.value === value)?.label }));
  }, []);

  // 处理视图切换
  const handleViewChange = useCallback((value: string) => {
    setDashboardView(value);
    const viewName = DASHBOARD_VIEW_OPTIONS.find(opt => opt.value === value)?.label;
    messageApi.info(t('dashboard:view_switched', { viewName: viewName }));
  }, []);

  // 初始化数据
  useEffect(() => {
    console.log('DashboardV3: Component mounted.');
    fetchDashboardData();

    return () => {
      console.log('DashboardV3: Component unmounted.');
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    console.log('dashboardData changed:', dashboardData);
    if (dashboardData && dashboardData.kpiData) {
      console.log('KPI data is ready from combined state:', dashboardData.kpiData);
    }
  }, [dashboardData]);

  useEffect(() => {
    console.log('kpiDataState changed:', kpiDataState);
    if (kpiDataState) {
      console.log('KPI data is ready from separate state:', kpiDataState);
    }
  }, [kpiDataState]);

  // 渲染页面头部操作区
  const renderPageHeaderExtra = () => (
    <Space size={isMobile ? "small" : "middle"}>
      <Segmented
        options={TIME_DIMENSION_OPTIONS}
        value={timeDimension}
        onChange={handleTimeDimensionChange}
        size={isMobile ? "small" : "small"}
      />
      <Tooltip title={t('dashboard:refresh_data')}>
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
          <Tooltip title={t('dashboard:fullscreen_display')}>
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={() => messageApi.info(t('dashboard:fullscreen_feature_under_development'))}
            />
          </Tooltip>
          <Tooltip title={t('dashboard:dashboard_settings')}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => messageApi.info(t('dashboard:settings_feature_under_development'))}
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
              {t('dashboard:salary_management_dashboard_title')}
            </Title>
            <Tooltip title={t('dashboard:switch_view_based_on_role_needs_tooltip')}>
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
          <Spin size="large" tip={t('dashboard:loading_dashboard_data')}>
            <div style={{ width: 200, height: 100 }} />
          </Spin>
        </div>
      );
    }

    return (
      <Spin spinning={refreshing} tip={t('dashboard:data_updating')}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* KPI 概览区域 - 所有视图都显示 */}
          {(() => {
            console.log('Before render KpiOverviewSection - dashboardData:', dashboardData);
            console.log('Before render KpiOverviewSection - dashboardData.kpiData:', dashboardData?.kpiData);
            console.log('Before render KpiOverviewSection - kpiDataState:', kpiDataState);
            return null; // Return null to not render anything in JSX
          })()}
          <KpiOverviewSection 
            data={kpiDataState}
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
                data={kpiDataState}
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
                data={kpiDataState}
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
      header={{
        title: t('dashboard:salary_management_dashboard_title') + (isMobile ? t('dashboard:mobile_suffix') : t('dashboard:desktop_suffix')),
        extra: renderPageHeaderExtra(),
      }}
      className={styles.pageContainer}
    >
      {renderViewSelector()}
      {renderDashboardContent()}
    </PageContainer>
  );
};

export default DashboardV3;
