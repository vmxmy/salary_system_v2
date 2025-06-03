import React from 'react';
import { Space } from 'antd';
import MappingStatistics from './MappingStatistics';
import MappingTable from './MappingTable';
import ImportSettings from './ImportSettings';
import type { 
  MappingRule, 
  PayrollPeriod, 
  ImportSettings as ImportSettingsType,
  ImportData 
} from '../types/index';

interface SmartMappingProps {
  importData: ImportData;
  mappingRules: MappingRule[];
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  importSettings: ImportSettingsType;
  loading: boolean;
  onMappingRulesChange: (rules: MappingRule[]) => void;
  onPeriodChange: (periodId: number) => void;
  onSettingsChange: (settings: ImportSettingsType) => void;
  onValidateData: () => void;
  onBackToUpload: () => void;
}

const SmartMapping: React.FC<SmartMappingProps> = ({
  importData,
  mappingRules,
  payrollPeriods,
  selectedPeriodId,
  importSettings,
  loading,
  onMappingRulesChange,
  onPeriodChange,
  onSettingsChange,
  onValidateData,
  onBackToUpload
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 映射统计组件 */}
      <MappingStatistics mappingRules={mappingRules} />

      {/* 映射表格组件 */}
      <MappingTable 
        mappingRules={mappingRules}
        onMappingRulesChange={onMappingRulesChange}
      />

      {/* 导入设置组件 */}
      <ImportSettings
        payrollPeriods={payrollPeriods}
        selectedPeriodId={selectedPeriodId}
        importSettings={importSettings}
        loading={loading}
        onPeriodChange={onPeriodChange}
        onSettingsChange={onSettingsChange}
        onValidateData={onValidateData}
        onBackToUpload={onBackToUpload}
      />
    </Space>
  );
};

export default SmartMapping; 