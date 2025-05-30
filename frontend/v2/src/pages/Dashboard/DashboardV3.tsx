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
  Grid
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

// 时间维度选项
const TIME_DIMENSION_OPTIONS = [
  { label: '月度', value: 'monthly' },
  { label: '季度', value: 'quarterly' },
  { label: '年度', value: 'yearly' }
];

// 仪表盘视图选项
const DASHBOARD_VIEW_OPTIONS = [
  { label: '💼 管理概览', value: 'management' },
  { label: '📊 数据分析', value: 'analytics' },
  { label: '⚠️ 风险监控', value: 'risk' }
];

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
        message.success('📊 仪表盘数据已更新');
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      message.error('❌ 获取仪表盘数据失败，请稍后重试');
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
    message.info(`📅 已切换到${TIME_DIMENSION_OPTIONS.find(opt => opt.value === value)?.label}视图`);
  }, []);

  // 处理视图切换
  const handleViewChange = useCallback((value: string) => {
    setDashboardView(value);
    const viewName = DASHBOARD_VIEW_OPTIONS.find(opt => opt.value === value)?.label;
    message.info(`🔄 已切换到${viewName}`);
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
      <Tooltip title="刷新数据">
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
          <Tooltip title="全屏显示">
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={() => message.info('🔍 全屏功能开发中')}
            />
          </Tooltip>
          <Tooltip title="仪表盘设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => message.info('⚙️ 设置功能开发中')}
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
            <Tooltip title="根据不同角色需求切换视图">
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
          <Spin size="large" tip="📊 正在加载仪表盘数据...">
            <div style={{ width: 200, height: 100 }} />
          </Spin>
        </div>
      );
    }

    return (
      <Spin spinning={refreshing} tip="🔄 数据更新中...">
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
            {isMobile ? ' (移动端)' : ' (桌面端)'}
          </Text>
        </Card>
      )}
      {renderDashboardContent()}
    </PageContainer>
  );
};

export default DashboardV3;
