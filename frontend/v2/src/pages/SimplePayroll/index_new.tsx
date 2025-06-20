import React from 'react';
import { Layout, Row, Col, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

// 引入拆分后的组件和Hook
import { usePayrollPageLogic } from './hooks/usePayrollPageLogic';
import { PayrollStatistics } from './components/PayrollStatistics';
import { PayrollControls } from './components/PayrollControls';
import { QuickActions } from './components/QuickActions';
import { EmptyState } from './components/EmptyState';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { PayrollDataModal } from './components/PayrollDataModal';
import './styles.less';

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
    handleDeleteVersion
  } = usePayrollPageLogic();

  return (
    <Layout className="simple-payroll-layout">
      {/* Page Header Area */}
      <Header className="payroll-header">
        <div className="header-content">
          <h1 className="header-title">{t('simplePayroll:title')}</h1>
          <p className="header-subtitle">{t('simplePayroll:subtitle')}</p>
        </div>
      </Header>

      {/* Main Content Area */}
      <Content className="payroll-content-area">
        {periodsLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {/* Statistics Card - Full Width - Only show when version is selected */}
            <Col span={24}>
              <PayrollStatistics
                selectedVersionId={selectedVersionId}
                currentPeriod={currentPeriod}
                currentVersion={currentVersion}
                versions={versions}
                payrollStats={payrollStats}
                dataIntegrityStats={{
                  socialInsuranceBaseCount: 0,
                  housingFundBaseCount: 0,
                  occupationalPensionBaseCount: 0,
                  incomeTaxPositiveCount: 0,
                  loading: false
                }}
                auditSummary={auditSummary}
                auditLoading={auditLoading}
                resetLoadingStates={resetLoadingStates}
              />
            </Col>

            {/* 左列：控制面板和快捷操作 */}
            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
              {/* 核心控制 */}
              <PayrollControls
                currentPeriod={currentPeriod}
                handleDateChange={handleDateChange}
              />

              {/* 快捷操作 */}
              <QuickActions
                selectedPeriodId={selectedPeriodId}
                selectedVersionId={selectedVersionId}
                handleNavigateToBulkImport={handleNavigateToBulkImport}
                handleImportTaxData={handleImportTaxData}
                setPayrollDataModalVisible={setPayrollDataModalVisible}
                onRefresh={handleRefresh}
                onRefreshAfterDelete={handleRefreshAfterDelete}
              />
            </Col>

            {/* Right Column: Workflow and Information */}
            <Col xs={24} lg={16}>
              {!selectedPeriodId ? (
                <EmptyState />
              ) : (
                <Row gutter={[24, 24]}>
                  {/* Workflow Guide Card */}
                  <Col span={24}>
                    <EnhancedWorkflowGuide 
                      selectedPeriod={currentPeriod || null}
                      selectedVersion={currentVersion || null}
                      auditSummary={auditSummary}
                      onRefresh={handleRefresh}
                      onAuditRefresh={handleAuditRefresh}
                      onVersionRefresh={handleVersionRefresh}
                      onDeleteVersion={handleDeleteVersion}
                    />
                  </Col>
                </Row>
              )}
            </Col>
          </Row>
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