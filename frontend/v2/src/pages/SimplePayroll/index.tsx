import React from 'react';
import { Layout, Row, Col, Spin, Tag, Affix, DatePicker, Select, Space, Divider, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { CalendarOutlined, BranchesOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// 引入拆分后的组件和Hook
import { usePayrollPageLogic } from './hooks/usePayrollPageLogic';
import { EnhancedPayrollStatistics } from './components/EnhancedPayrollStatistics';
import { QuickActions } from './components/QuickActions';
import { EmptyState } from './components/EmptyState';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { PayrollDataModal } from './components/PayrollDataModal';
import './styles-modern.less';

const { Header, Content } = Layout;
const { Option } = Select;

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

      {/* 当前薪资周期悬浮显示 - 使用系统统一卡片风格 */}
      <Affix offsetTop={0}>
        <Card className="period-indicator-card modern-card">
          <div className="period-indicator-content">
            <div className="period-info">
              <CalendarOutlined className="indicator-icon" /> 当前周期:
            </div>
            <DatePicker
              picker="month"
              value={currentPeriod ? dayjs(currentPeriod.start_date) : undefined}
              onChange={(date) => {
                if (date) {
                  handleDateChange(date.year(), date.month() + 1);
                }
              }}
              format="YYYY年MM月"
              allowClear={false}
              bordered={false}
              suffixIcon={null}
              className="period-picker"
              dropdownClassName="period-picker-dropdown"
            />
            
            <Divider type="vertical" className="indicator-divider" />
            
            <div className="version-info">
              <BranchesOutlined className="indicator-icon" /> 版本:
            </div>
            {versions && versions.length > 0 ? (
              <Select
                value={selectedVersionId}
                onChange={handleVersionChange}
                bordered={false}
                className="version-picker"
                dropdownClassName="version-picker-dropdown"
                suffixIcon={null}
                disabled={!currentPeriod || versions.length === 0}
              >
                {versions.map(version => (
                  <Option key={version.id} value={version.id}>
                    V{version.version_number} {version.description ? `(${version.description})` : ''}
                  </Option>
                ))}
              </Select>
            ) : (
              <span className="no-version">无版本</span>
            )}
          </div>
        </Card>
      </Affix>

      {/* Main Content Area */}
      <Content className="payroll-content">
        {periodsLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <>
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