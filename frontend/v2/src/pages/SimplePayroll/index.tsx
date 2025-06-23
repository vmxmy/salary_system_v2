import React from 'react';
import { Layout, Spin, Affix } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';


// 引入拆分后的组件和Hook
import { usePayrollPageLogic } from './hooks/usePayrollPageLogic';
import { EnhancedPayrollStatistics } from './components/EnhancedPayrollStatistics';
import { QuickActions } from './components/QuickActions';
import { EmptyState } from './components/EmptyState';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { PayrollDataModal } from './components/PayrollDataModal';
import { PayrollContextBar } from './components/PayrollContextBar';
// 现代化设计系统样式已通过主样式文件全局导入

const { Header, Content } = Layout;

const SimplePayrollPage: React.FC = () => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  
  // 使用业务逻辑Hook
  const {
    // State
    selectedPeriodId,
    selectedVersionId,
    payrollDataModalVisible,
    payrollStats,
    dataIntegrityStats,
    
    // Data
    currentPeriod,
    currentVersion,
    versions,
    auditSummary,
    
    // Loading states
    periodsLoading,
    auditLoading,
    
    // Actions
    setPayrollDataModalVisible,
    
    // Handlers
    handleRefresh,
    handleRefreshAfterDelete,
    handleVersionRefresh,
    handleAuditRefresh,
    resetLoadingStates,
    handleNavigateToBulkImport,
    handleImportTaxData,
    handleDateChange,
    handleDeleteVersion,
    handleVersionChange
  } = usePayrollPageLogic();

  // 格式化当前选择的薪资周期
  const formattedPeriod = currentPeriod?.start_date 
    ? dayjs(currentPeriod.start_date).format('YYYY年MM月') 
    : '未选择';

  return (
    <Layout className="simple-payroll-modern">
      {/* Page Header Area */}
      <Header className="payroll-header">
        <div className="header-content">
          <h1 className="header-title">{t('simplePayroll:title')}</h1>
          <p className="header-subtitle">{t('simplePayroll:subtitle')}</p>
        </div>
      </Header>

      {/* Fixed Context Bar */}
      <PayrollContextBar
        currentPeriod={currentPeriod || null}
        currentVersion={currentVersion || null}
        onPeriodChange={() => {
          // 触发期间切换逻辑
          // 这里可以打开期间选择器或执行其他操作
          console.log('切换薪资周期');
        }}
        onVersionChange={() => {
          // 触发版本切换逻辑
          console.log('切换工资运行版本');
        }}
        onSettings={() => {
          // 打开设置面板
          console.log('打开设置');
        }}
        onDateChange={handleDateChange}
      />

      {/* Main Content Area */}
      <Content className="payroll-content">
        {periodsLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Enhanced Statistics Section */}
            <EnhancedPayrollStatistics
              selectedVersionId={selectedVersionId}
              currentPeriod={currentPeriod}
              currentVersion={currentVersion}
              versions={versions}
              payrollStats={payrollStats}
              dataIntegrityStats={dataIntegrityStats}
              auditSummary={auditSummary}
              auditLoading={auditLoading}
              resetLoadingStates={resetLoadingStates}
            />

            {/* Main Content Grid */}
            <div className="main-grid">
              {/* Sidebar Controls */}
              <div className="sidebar-controls">
                <QuickActions
                  selectedPeriodId={selectedPeriodId}
                  selectedVersionId={selectedVersionId}
                  handleNavigateToBulkImport={handleNavigateToBulkImport}
                  handleImportTaxData={handleImportTaxData}
                  setPayrollDataModalVisible={setPayrollDataModalVisible}
                  onRefresh={handleRefresh}
                  onRefreshAfterDelete={handleRefreshAfterDelete}
                />
              </div>

              {/* Main Workspace */}
              <div className="main-workspace">
                {!selectedPeriodId ? (
                  <EmptyState />
                ) : (
                  <EnhancedWorkflowGuide 
                    selectedPeriod={currentPeriod || null}
                    selectedVersion={currentVersion || null}
                    auditSummary={auditSummary}
                    onRefresh={handleRefresh}
                    onAuditRefresh={handleAuditRefresh}
                    onVersionRefresh={handleVersionRefresh}
                    onDeleteVersion={handleDeleteVersion}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </Content>

      {/* 工资数据浏览模态框 */}
      <PayrollDataModal
        visible={payrollDataModalVisible}
        onClose={() => setPayrollDataModalVisible(false)}
        periodId={selectedPeriodId || 0}
        periodName={currentPeriod?.name}
      />
    </Layout>
  );
};

export default SimplePayrollPage; 