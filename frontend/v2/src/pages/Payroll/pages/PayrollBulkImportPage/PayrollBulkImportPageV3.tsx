import React from 'react';
import {
  Steps,
  Card,
  Divider,
  Tag,
  Button
} from 'antd';
import {
  QuestionCircleOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';

// 导入拆分后的组件
import DataUpload from './components/DataUpload';
import SmartMapping from './components/SmartMapping';
import DataPreview from './components/DataPreview';
import ImportExecution from './components/ImportExecution';

// 导入状态管理Hook
import { useImportFlow } from './hooks/useImportFlow';

// 导入常量配置
import { STEPS_CONFIG } from './types/constants';

const PayrollBulkImportPageV3: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  
  // 使用状态管理Hook
  const {
    // 状态
    currentStep,
    loading,
    progress,
    importData,
    mappingRules,
    validationResult,
    processedData,
    importResult,
    payrollComponents,
    payrollPeriods,
      selectedPeriodId,
    importSettings,
    
    // 操作
    setCurrentStep,
    setLoading,
    setMappingRules,
    setSelectedPeriodId,
    setImportSettings,
    handleDataParsed,
    validateData,
    executeImport,
    resetFlow
  } = useImportFlow();

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <DataUpload
                loading={loading}
            onDataParsed={handleDataParsed}
            onLoadingChange={setLoading}
          />
        );
        
      case 1:
    return (
          <SmartMapping
            importData={importData!}
            mappingRules={mappingRules}
            payrollPeriods={payrollPeriods}
            selectedPeriodId={selectedPeriodId}
            importSettings={importSettings}
            loading={loading}
            onMappingRulesChange={setMappingRules}
            onPeriodChange={setSelectedPeriodId}
            onSettingsChange={setImportSettings}
            onValidateData={validateData}
            onBackToUpload={() => setCurrentStep(0)}
          />
        );
        
      case 2:
                      return (
          <DataPreview
            validationResult={validationResult!}
            importData={importData!}
            payrollPeriods={payrollPeriods}
            selectedPeriodId={selectedPeriodId}
            importSettings={importSettings}
            processedData={processedData}
            onSettingsChange={setImportSettings}
            onExecuteImport={executeImport}
            onBackToMapping={() => setCurrentStep(1)}
              loading={loading}
            progress={progress}
            rawImportData={importData!}
            fieldMapping={mappingRules.reduce((acc, rule) => ({ ...acc, [rule.sourceField]: rule.targetField }), {})}
            modeConfig={{
              id: 'payroll',
              name: '薪资导入',
              description: '薪资数据批量导入',
              icon: '💰',
              fields: [],
              requiredFields: [],
              optionalFields: [],
              validationRules: [],
              apiEndpoints: {
                validate: '/v2/payroll/validate',
                execute: '/v2/payroll/import',
                getRefData: []
              },
              fieldMappingHints: []
            }}
          />
        );
        
      case 3:
    return (
          <ImportExecution
              loading={loading}
            importResult={importResult}
            onContinueImport={resetFlow}
            onViewResults={() => {
              // 可以导航到薪资记录查看页面
              console.log('查看导入结果');
            }}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="薪资批量导入"
      subTitle="智能化薪资数据批量导入工具"
      tags={[
        <Tag key="smart" color="blue">智能映射</Tag>,
        <Tag key="batch" color="green">批量处理</Tag>
      ]}
      extra={[
        <Button key="help" icon={<QuestionCircleOutlined />}>
          导入帮助
        </Button>
      ]}
      breadcrumb={{
        routes: [
          { path: '/finance', breadcrumbName: '财务管理' },
          { path: '/finance/payroll', breadcrumbName: '薪资管理' },
          { path: '/finance/payroll/bulk-import', breadcrumbName: '批量导入' }
        ]
      }}
    >
      <Card>
        {/* 步骤指示器 */}
        <Steps 
          current={currentStep} 
          style={{ marginBottom: 32 }}
          size="default"
        >
          {STEPS_CONFIG.map((step, index) => (
            <Steps.Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        <Divider />

        {/* 步骤内容 */}
        <div style={{ minHeight: 400 }}>
          {renderStepContent()}
        </div>
      </Card>
    </PageContainer>
  );
};

export default PayrollBulkImportPageV3; 