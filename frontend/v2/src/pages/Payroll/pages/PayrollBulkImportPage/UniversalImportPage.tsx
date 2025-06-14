/**
 * 通用批量导入页面
 * 支持多种导入模式：薪资数据、缴费基数等
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Steps, Card, Button, message, Table, Alert, Tag, Tooltip } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';

// 导入组件
import ImportModeSelector from './components/ImportModeSelector';
import UniversalDataUpload from './components/UniversalDataUpload';
import FieldMapping from './components/FieldMapping';
import { ImportStrategyFactory } from './strategies';
import type { ImportModeID, ImportModeConfig, RawImportData, ProcessedRow } from './types/universal';

const { Step } = Steps;

// --- DataPreview Sub-Component ---
const DataPreview: React.FC<{
  rawImportData: RawImportData;
  fieldMapping: Record<string, string>;
  modeConfig: ImportModeConfig;
}> = ({ rawImportData, fieldMapping, modeConfig }) => {
  const { rows, headers } = rawImportData;

  const { processedData, columns, errorCount } = useMemo(() => {
    // ... (logic from the previously attempted DataPreview.tsx)
    const invertedMapping: Record<string, string> = {};
    for (const key in fieldMapping) {
      if (fieldMapping[key]) {
        invertedMapping[fieldMapping[key]] = key;
      }
    }
    const requiredFields = modeConfig.requiredFields;
    const data = rows.map((row, rowIndex) => {
      const rowData: Record<string, any> = { key: `row-${rowIndex}` };
      const errors: { field: string, message: string }[] = [];
      headers.forEach((header, colIndex) => {
        const systemKey = invertedMapping[header];
        if (systemKey) {
          rowData[systemKey] = row[colIndex];
        }
      });
      requiredFields.forEach(field => {
        if (rowData[field.key] === null || rowData[field.key] === undefined || String(rowData[field.key]).trim() === '') {
          errors.push({ field: field.key, message: `${field.name} 是必填项` });
        }
      });
      rowData._errors = errors;
      return rowData;
    });

    const allSystemFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields];
    const tableColumns = Object.keys(invertedMapping).map(excelHeader => {
        const systemKey = invertedMapping[excelHeader];
        const fieldConfig = allSystemFields.find(f => f.key === systemKey);
        return {
            title: fieldConfig?.name || systemKey,
            dataIndex: systemKey,
            key: systemKey,
        };
    });

    tableColumns.push({
        title: '验证状态',
        key: 'status',
        fixed: 'right',
        width: 120,
        render: (_: any, record: any) => {
            if (record._errors.length > 0) {
                return (
                    <Tooltip title={record._errors.map((e: any) => e.message).join(', ')}>
                        <Tag color="red">错误</Tag>
                    </Tooltip>
                );
            }
            return <Tag color="green">通过</Tag>;
        },
    });

    const totalErrors = data.filter(d => d._errors.length > 0).length;
    return { processedData: data, columns: tableColumns, errorCount: totalErrors };
  }, [rows, headers, fieldMapping, modeConfig]);

  return (
    <Card title="数据预览与验证">
      <Alert
        message={`共 ${rows.length} 条记录，发现 ${errorCount} 条存在错误。`}
        type={errorCount > 0 ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 20 }}
      />
      <Table
        columns={columns}
        dataSource={processedData}
        pagination={{ pageSize: 5 }}
        bordered
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

const UniversalImportPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);

  // 状态管理
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<ImportModeID | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableModes, setAvailableModes] = useState<ImportModeConfig[]>([]);
  const [rawImportData, setRawImportData] = useState<RawImportData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<any>(null);

  // 派生状态：当前选择的模式配置
  const selectedModeConfig = useMemo(() => {
    return availableModes.find(m => m.id === selectedMode) || null;
  }, [selectedMode, availableModes]);

  // 派生状态：字段映射是否有效
  const isMappingValid = useMemo(() => {
    if (!selectedModeConfig) return false;
    const requiredFields = selectedModeConfig.requiredFields.map(f => f.key);
    const mappedRequiredFields = requiredFields.filter(key => fieldMapping[key]);
    return mappedRequiredFields.length === requiredFields.length;
  }, [fieldMapping, selectedModeConfig]);

  // 定义步骤
  const steps = [
    {
      title: t('payroll:bulk_import.steps.select_mode'),
    },
    {
      title: t('payroll:bulk_import.steps.upload_data'),
    },
    {
      title: t('payroll:bulk_import.steps.map_fields'),
    },
    {
      title: t('payroll:bulk_import.steps.preview_confirm'),
    },
    {
      title: t('payroll:bulk_import.steps.import_result'),
    },
  ];

  // 初始化可用模式
  useEffect(() => {
    const fetchModes = async () => {
      try {
        setLoading(true);
        const modes = await ImportStrategyFactory.getAllModeConfigs();
        const modesWithClientId = modes.map(mode => ({
          ...mode,
          clientId: nanoid(),
        }));
        setAvailableModes(modesWithClientId);
      } catch (error) {
        console.error('获取导入模式失败:', error);
        message.error('获取导入模式失败');
      } finally {
        setLoading(false);
      }
    };
    fetchModes();
  }, []);

  // 处理模式变更
  const handleModeChange = (modeId: ImportModeID) => {
    setSelectedMode(modeId);
  };

  // 处理文件解析
  const handleDataParsed = (headers: string[], rows: any[][]) => {
    if (headers.length > 0 && selectedMode) {
      setRawImportData({
        mode: selectedMode,
        headers,
        rows,
        totalRecords: rows.length,
      });
      message.success(t('payroll:bulk_import.upload.parse_success', { count: rows.length }));
    } else {
      setRawImportData(null); // 清除数据
    }
  };
  
  const handleUploadLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  }

  const handleMappingComplete = (mapping: Record<string, string>) => {
    setFieldMapping(mapping);
  };

  const handleImport = async () => {
    if (!selectedMode || !rawImportData || !fieldMapping) {
      message.error("无法执行导入：缺少模式、数据或字段映射。");
      return;
    }

    setLoading(true);
    try {
      const strategy = await ImportStrategyFactory.getStrategy(selectedMode);
      
      // 1. Process data using the mapping
      const processedData: ProcessedRow[] = strategy.processData(rawImportData, fieldMapping);

      // 2. Validate data (optional for now, can be expanded later)
      const validationResults = strategy.validateData(processedData);
      const validData = processedData.filter((_, index) => validationResults[index].isValid);

      if (validData.length === 0) {
        message.error("没有可供导入的有效数据。");
        setLoading(false);
        return;
      }

      // 3. Import valid data
      const result = await strategy.importData(validData);

      setImportResult(result);
      setCurrentStep(steps.length - 1); // Go to the last step
    } catch (error) {
      console.error("导入失败:", error);
      const errorMessage = error instanceof Error ? error.message : "导入过程中发生未知错误。";
      message.error(errorMessage);
      setImportResult({ success: false, message: errorMessage, successCount: 0, failedCount: rawImportData?.rows.length || 0 });
      setCurrentStep(steps.length - 1); // Also go to results page on failure
    } finally {
      setLoading(false);
    }
  };

  // 导航
  const handleNextStep = () => {
    if (currentStep === 0 && !selectedMode) {
      message.warning(t('payroll:bulk_import.steps.please_select_mode'));
      return;
    }
    if (currentStep === 1 && !rawImportData) {
      message.warning(t('payroll:bulk_import.upload.please_upload_file'));
      return;
    }
    if (currentStep === 2 && !isMappingValid) {
      message.warning(t('payroll:bulk_import.map.please_map_required_fields'));
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ImportModeSelector
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            availableModes={availableModes}
            loading={loading}
          />
        );
      case 1:
        return (
          <UniversalDataUpload
            onDataParsed={handleDataParsed}
            onLoadingChange={handleUploadLoadingChange}
          />
        );
      case 2: {
        if (!rawImportData || !selectedModeConfig) {
          return (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p>{t('common:errors.data_or_config_missing')}</p>
              <Button onClick={handlePrevStep}>{t('common:actions.previous_step')}</Button>
            </div>
          );
        }
        return (
          <FieldMapping
            rawImportData={rawImportData}
            modeConfig={selectedModeConfig}
            onMappingComplete={handleMappingComplete}
          />
        );
      }
      case 3:
        if (!rawImportData || !selectedModeConfig) {
           return <p>数据或配置丢失</p>
        }
        return (
          <DataPreview 
            rawImportData={rawImportData}
            fieldMapping={fieldMapping}
            modeConfig={selectedModeConfig}
          />
        );
      case 4:
        if (!importResult) {
          return <p>正在生成导入结果...</p>;
        }
        return (
          <Card title="导入结果">
            {importResult.success ? (
              <Alert
                message={`导入完成`}
                description={`成功导入 ${importResult.successCount} 条记录，失败 ${importResult.failedCount} 条。`}
                type="success"
                showIcon
              />
            ) : (
              <Alert
                message="导入失败"
                description={importResult.message}
                type="error"
                showIcon
              />
            )}
          </Card>
        );
      default:
        return <p>未知步骤</p>;
    }
  };

  return (
    <PageContainer title={t('payroll:bulk_import.title')}>
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 40 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <div className="steps-content" style={{ minHeight: '300px' }}>
          {renderStepContent()}
        </div>

        <div className="steps-action" style={{ marginTop: 24, textAlign: 'center' }}>
          {currentStep > 0 && (
            <Button style={{ marginRight: 16 }} onClick={handlePrevStep}>
              {t('common:actions.previous_step')}
            </Button>
          )}
          {currentStep === steps.length - 2 && ( // This is the Preview step
            <Button
              type="primary"
              onClick={handleImport}
              loading={loading}
            >
              {t('common:actions.execute_import')}
            </Button>
          )}
          {currentStep < steps.length - 2 && ( // All steps before Preview
             <Button
              type="primary"
              onClick={handleNextStep}
              disabled={
                (currentStep === 0 && !selectedMode) ||
                (currentStep === 1 && !rawImportData) ||
                (currentStep === 2 && !isMappingValid)
              }
            >
              {t('common:actions.next_step')}
            </Button>
          )}
          {currentStep === steps.length - 1 && ( // Final step, show a restart button
            <Button type="primary" onClick={() => setCurrentStep(0)}>
              {t('common:actions.start_new_import')}
            </Button>
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

export default UniversalImportPage; 