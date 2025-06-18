import React from 'react';
import { Layout, Row, Col, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

// 引入拆分后的组件和Hook
import { usePayrollPageLogic } from './hooks/usePayrollPageLogic';
import { EnhancedPayrollStatistics } from './components/EnhancedPayrollStatistics';
import { PayrollHeaderControls } from './components/PayrollHeaderControls';
import { QuickActions } from './components/QuickActions';
import { EmptyState } from './components/EmptyState';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { PayrollDataModal } from './components/PayrollDataModal';
import './styles-modern.less';

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

  return (
    <Layout className="simple-payroll-modern">
      {/* Page Header Area */}
      <Header className="payroll-header">
        <div className="header-content">
          <h1 className="header-title">{t('simplePayroll:title')}</h1>
          <p className="header-subtitle">{t('simplePayroll:subtitle')}</p>
        </div>
      </Header>

      {/* Main Content Area */}
      <Content className="payroll-content">
        {periodsLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Header Controls - Primary Action Section */}
            <div className="header-controls-section">
              <PayrollHeaderControls
                currentPeriod={currentPeriod}
                currentVersion={currentVersion}
                versions={versions}
                selectedVersionId={selectedVersionId}
                handleDateChange={handleDateChange}
                onVersionChange={handleVersionChange}
                payrollStats={payrollStats}
              />
            </div>

            {/* Enhanced Statistics Section - Full Width */}
            <div className="stats-grid">
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
            </div>

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