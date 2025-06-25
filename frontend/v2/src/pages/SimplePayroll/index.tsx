import React from 'react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

// Layout components
import { PageLayout, FlexLayout, GridLayout, Box } from '../../components/Layout';

// 引入拆分后的组件和Hook
import { usePayrollPageLogic } from './hooks/usePayrollPageLogic';
import { EnhancedPayrollStatistics } from './components/EnhancedPayrollStatistics';
import { QuickActions } from './components/QuickActions';
import { EmptyState } from './components/EmptyState';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { PayrollDataModal } from './components/PayrollDataModal';
import { PayrollContextBar } from './components/PayrollContextBar';
// 现代化设计系统样式已通过主样式文件全局导入

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
    <PageLayout
      title={t('simplePayroll:title')}
      subtitle={t('simplePayroll:subtitle')}
      showCard={false}
      fullWidth={true}
    >
      {/* Fixed Context Bar - 使用 sticky 定位替代 Affix */}
      <Box
        position="sticky"
        style={{
          top: 0,
          zIndex: 100,
          marginBottom: '24px',
          marginLeft: '-24px',
          marginRight: '-24px',
          marginTop: '-24px'
        }}
      >
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
      </Box>

      {/* Main Content Area */}
      {periodsLoading ? (
        <FlexLayout justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spin size="large" />
        </FlexLayout>
      ) : (
        <Box>
          {/* Enhanced Statistics Section */}
          <Box mb="6">
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
          </Box>

          {/* Main Content Grid */}
          <GridLayout
            columns="300px 1fr"
            gap="6"
            colsSm={1}
            colsMd={1}
            colsLg={2}
          >
            {/* Sidebar Controls */}
            <Box>
              <QuickActions
                selectedPeriodId={selectedPeriodId}
                selectedVersionId={selectedVersionId}
                handleNavigateToBulkImport={handleNavigateToBulkImport}
                handleImportTaxData={handleImportTaxData}
                setPayrollDataModalVisible={setPayrollDataModalVisible}
                onRefresh={handleRefresh}
                onRefreshAfterDelete={handleRefreshAfterDelete}
              />
            </Box>

            {/* Main Workspace */}
            <Box>
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
            </Box>
          </GridLayout>
        </Box>
      )}

      {/* 工资数据浏览模态框 */}
      <PayrollDataModal
        visible={payrollDataModalVisible}
        onClose={() => setPayrollDataModalVisible(false)}
        periodId={selectedPeriodId}
        versionId={selectedVersionId}
      />
    </PageLayout>
  );
};

export default SimplePayrollPage;