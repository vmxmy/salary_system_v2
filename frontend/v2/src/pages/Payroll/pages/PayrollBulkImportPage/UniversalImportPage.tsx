/**
 * 通用批量导入页面
 * 支持多种导入模式：薪资数据、缴费基数等
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Steps, Card, Button, message as staticMessage, Table, Alert, Tag, Tooltip, App, Collapse, Typography } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { PageContainer } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';

// 导入组件
import ImportModeSelector from './components/ImportModeSelector';
import UniversalDataUpload from './components/UniversalDataUpload';
import FieldMapping from './components/FieldMapping';
import PayrollPeriodSelector from './components/PayrollPeriodSelector';
import { OverwriteModeSelector } from './components/OverwriteModeSelector';
import ImportResultStep from './components/ImportResultStep';
import { usePayrollPeriods } from '../../services/payrollPeriodService';
import { ImportStrategyFactory } from './strategies';
import { DEFAULT_IMPORT_SETTINGS } from './constants/overwriteMode';
import type { ImportModeID, ImportModeConfig, RawImportData, ProcessedRow, ValidationResult, ImportSettings } from './types/universal';
import type { UploadResult } from './types/constants';
import { OverwriteMode } from '../../types/payrollTypes';

const { Step } = Steps;
const { Panel } = Collapse;
const { Text } = Typography;

// --- DataPreview Sub-Component (Dumbed down) ---
const DataPreview: React.FC<{
  processedData: ProcessedRow[];
  validationResults: ValidationResult[];
  modeConfig: ImportModeConfig;
  importSettings: ImportSettings;
  onSettingsChange: (settings: ImportSettings) => void;
}> = ({ processedData, validationResults, modeConfig, importSettings, onSettingsChange }): React.ReactElement => {
  
  console.log('🔍 [DataPreview] 接收到的数据:', { 
    processedDataCount: processedData.length,
    firstRowData: processedData[0]?.data,
    validationResultsCount: validationResults.length
  });
  
  const { columns, errorCount } = useMemo(() => {
    const allSystemFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields];
    const mappedSystemKeys = Object.keys(processedData[0]?.data || {});
    
    console.log('🔍 [DataPreview] 字段分析:', {
      allSystemFields: allSystemFields.map(f => f.key),
      mappedSystemKeys,
      earnings_details: processedData[0]?.data?.earnings_details,
      deductions_details: processedData[0]?.data?.deductions_details
    });

    const tableColumns: ColumnType<ProcessedRow>[] = mappedSystemKeys.map(systemKey => {
      const fieldConfig = allSystemFields.find(f => f.key === systemKey);
      
      // 为 JSONB 字段添加自定义渲染
      if (systemKey === 'earnings_details' || systemKey === 'deductions_details') {
        return {
          title: fieldConfig?.name || systemKey,
          dataIndex: ['data', systemKey],
          key: systemKey,
          width: 300,
          render: (value: Record<string, any>) => {
            console.log(`🔍 [DataPreview] 渲染 ${systemKey}:`, { value, type: typeof value });
            
            if (!value || typeof value !== 'object' || Object.keys(value).length === 0) {
              console.log(`⚠️ [DataPreview] ${systemKey} 为空或无效:`, value);
              return <Text type="secondary">-</Text>;
            }
            
            const items = Object.entries(value).map(([code, detail]: [string, any]) => {
              const amount = detail?.amount || detail;
              console.log(`🔍 [DataPreview] ${systemKey} 组件:`, { code, detail, amount });
              return (
                <div key={code} style={{ marginBottom: 4 }}>
                  <Tag color="blue" style={{ fontSize: '12px' }}>
                    {code}: ¥{typeof amount === 'number' ? amount.toFixed(2) : amount}
                  </Tag>
                </div>
              );
            });
            
            console.log(`✅ [DataPreview] ${systemKey} 渲染 ${items.length} 个组件`);
            
            return (
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {items}
              </div>
            );
          }
        };
      }
      
      // 普通字段
      return {
        title: fieldConfig?.name || systemKey,
        dataIndex: ['data', systemKey],
        key: systemKey,
      };
    });

    tableColumns.push({
      title: '验证状态',
      key: 'status',
      width: 150,
      render: (_: any, record: ProcessedRow) => {
        const result = validationResults.find(r => r.clientId === record._meta.clientId);
        
        if (!result) {
          return <Tag color="gray">未验证</Tag>;
        }
        
        // 构建详细的错误和警告信息
        const errorMessages: string[] = [];
        const warningMessages: string[] = [];
        
        // 处理错误信息
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(error => {
            if (typeof error === 'string') {
              errorMessages.push(error);
            } else if (error && typeof error === 'object') {
              if (error.message) {
                errorMessages.push(error.message);
              } else if (error.field) {
                errorMessages.push(`${error.field}: ${error.message || '验证失败'}`);
              } else {
                errorMessages.push(JSON.stringify(error));
              }
            }
          });
        }
        
        // 处理警告信息
        if (result.warnings && Array.isArray(result.warnings)) {
          result.warnings.forEach(warning => {
            if (typeof warning === 'string') {
              warningMessages.push(warning);
            } else if (warning && typeof warning === 'object') {
              if (warning.message) {
                warningMessages.push(warning.message);
              } else {
                warningMessages.push(JSON.stringify(warning));
              }
            }
          });
        }
        
        // 构建提示信息
        const tooltipContent = [];
        if (errorMessages.length > 0) {
          tooltipContent.push('错误：');
          tooltipContent.push(...errorMessages.map(msg => `• ${msg}`));
        }
        if (warningMessages.length > 0) {
          if (tooltipContent.length > 0) tooltipContent.push('');
          tooltipContent.push('警告：');
          tooltipContent.push(...warningMessages.map(msg => `• ${msg}`));
        }
        
        if (!result.isValid) {
          return (
            <Tooltip 
              title={
                <div style={{ whiteSpace: 'pre-line' }}>
                  {tooltipContent.length > 0 ? tooltipContent.join('\n') : '验证失败，无详细信息'}
                </div>
              }
              overlayStyle={{ maxWidth: '400px' }}
            >
              <Tag color="red">
                错误 {errorMessages.length > 0 && `(${errorMessages.length})`}
              </Tag>
            </Tooltip>
          );
        }
        
        if (warningMessages.length > 0) {
          return (
            <Tooltip 
              title={
                <div style={{ whiteSpace: 'pre-line' }}>
                  {tooltipContent.join('\n')}
                </div>
              }
              overlayStyle={{ maxWidth: '400px' }}
            >
              <Tag color="orange">
                警告 ({warningMessages.length})
              </Tag>
            </Tooltip>
          );
        }
        
        return <Tag color="green">通过</Tag>;
      },
    });

    const totalErrors = validationResults.filter(r => !r.isValid).length;
    return { columns: tableColumns, errorCount: totalErrors };
  }, [processedData, validationResults, modeConfig]);

  // 检测是否有已存在的员工记录
  const { hasExistingRecords, existingEmployeeCount } = useMemo(() => {
    let existingCount = 0;
    let hasExisting = false;
    
    validationResults.forEach(result => {
      // 检查多种可能的重复记录提示
      const hasExistingWarning = result.warnings?.some(w => {
        const message = w.message?.toLowerCase() || '';
        return message.includes('已存在') || 
               message.includes('already exists') ||
               message.includes('duplicate') ||
               message.includes('重复') ||
               message.includes('exists') ||
               message.includes('found existing');
      });
      
      // 也检查错误信息中的重复提示
      const hasExistingError = result.errors?.some(e => {
        const message = e.message?.toLowerCase() || '';
        return message.includes('已存在') || 
               message.includes('already exists') ||
               message.includes('duplicate') ||
               message.includes('重复') ||
               message.includes('exists') ||
               message.includes('found existing');
      });
      
      if (hasExistingWarning || hasExistingError) {
        existingCount++;
        hasExisting = true;
      }
    });
    
    console.log(`🔍 [智能覆盖模式] 检测结果: 已存在记录=${hasExisting}, 数量=${existingCount}`);
    
    return { 
      hasExistingRecords: hasExisting, 
      existingEmployeeCount: existingCount 
    };
  }, [validationResults, processedData]);

  const handleOverwriteModeChange = (mode: OverwriteMode) => {
    onSettingsChange({
      ...importSettings,
      overwriteMode: mode
    });
  };

  // 当没有重复记录时，自动设置为追加模式
  React.useEffect(() => {
    if (!hasExistingRecords && importSettings.overwriteMode !== OverwriteMode.NONE) {
      onSettingsChange({
        ...importSettings,
        overwriteMode: OverwriteMode.NONE
      });
    }
  }, [hasExistingRecords, importSettings.overwriteMode, onSettingsChange]);

  // 收集所有错误和警告信息用于详细展示
  const { errorDetails, warningDetails } = useMemo(() => {
    const errors: Array<{ rowIndex: number; employeeName: string; messages: string[] }> = [];
    const warnings: Array<{ rowIndex: number; employeeName: string; messages: string[] }> = [];
    
    processedData.forEach((row, index) => {
      const result = validationResults.find(r => r.clientId === row._meta.clientId);
      if (!result) return;
      
      const employeeName = row.data.employee_name || row.data.last_name || `第${index + 1}行`;
      
      // 收集错误信息
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        const errorMessages: string[] = [];
        result.errors.forEach(error => {
          if (typeof error === 'string') {
            errorMessages.push(error);
          } else if (error && typeof error === 'object') {
            if (error.message) {
              errorMessages.push(error.message);
            } else if (error.field) {
              errorMessages.push(`${error.field}: ${error.message || '验证失败'}`);
            }
          }
        });
        if (errorMessages.length > 0) {
          errors.push({ rowIndex: index + 1, employeeName, messages: errorMessages });
        }
      }
      
      // 收集警告信息
      if (result.warnings && Array.isArray(result.warnings) && result.warnings.length > 0) {
        const warningMessages: string[] = [];
        result.warnings.forEach(warning => {
          if (typeof warning === 'string') {
            warningMessages.push(warning);
          } else if (warning && typeof warning === 'object' && warning.message) {
            warningMessages.push(warning.message);
          }
        });
        if (warningMessages.length > 0) {
          warnings.push({ rowIndex: index + 1, employeeName, messages: warningMessages });
        }
      }
    });
    
    return { errorDetails: errors, warningDetails: warnings };
  }, [processedData, validationResults]);

  return (
    <div>
      {/* 智能显示覆盖模式选择器：只有当检测到已存在记录时才显示 */}
      {hasExistingRecords && (
        <Card title="导入设置" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Alert
              message="检测到重复记录"
              description={`发现 ${existingEmployeeCount} 名员工在当前周期已有薪资记录，请选择处理方式。`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </div>
          <OverwriteModeSelector
            value={importSettings.overwriteMode}
            onChange={handleOverwriteModeChange}
            existingCount={existingEmployeeCount}
            showOnlyWhenNeeded={true}
          />
        </Card>
      )}
      
      {/* 当没有重复记录时，显示提示信息 */}
      {!hasExistingRecords && (
        <Card title="导入设置" style={{ marginBottom: 16 }}>
          <Alert
            message="无重复记录"
            description="所有员工在当前周期都没有薪资记录，将直接添加新记录。"
            type="success"
            showIcon
          />
        </Card>
      )}
      
      <Card title="数据预览与验证">
        <Alert
          message={`共 ${processedData.length} 条记录，发现 ${errorCount} 条存在错误。`}
          type={errorCount > 0 ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Table
          columns={columns}
          dataSource={processedData}
          rowKey={record => record._meta.clientId}
          pagination={{ pageSize: 5 }}
          bordered
          scroll={{ x: 'max-content' }}
        />
        
        {/* 可折叠的详细错误和警告信息展示 */}
        {(errorDetails.length > 0 || warningDetails.length > 0) && (
          <Collapse 
            style={{ marginTop: 16 }}
            size="small"
            ghost
          >
            {errorDetails.length > 0 && (
              <Panel 
                header={
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                    🚨 详细错误信息 ({errorDetails.length} 条)
                  </span>
                } 
                key="errors"
              >
                <Alert
                  message={`发现 ${errorDetails.length} 条错误记录`}
                  description={
                    <div style={{ marginTop: 12 }}>
                      {errorDetails.map((error, index) => (
                        <div key={index} style={{ 
                          marginBottom: 12, 
                          padding: '8px 12px', 
                          backgroundColor: '#fff2f0', 
                          border: '1px solid #ffccc7',
                          borderRadius: '4px'
                        }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            color: '#cf1322',
                            marginBottom: 4
                          }}>
                            第{error.rowIndex}行 - {error.employeeName}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {error.messages.map((msg, msgIndex) => (
                              <li key={msgIndex} style={{ 
                                color: '#ff4d4f',
                                marginBottom: 2
                              }}>
                                {msg}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  }
                  type="error"
                  showIcon
                />
              </Panel>
            )}
            
            {warningDetails.length > 0 && (
              <Panel 
                header={
                  <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                    ⚠️ 详细警告信息 ({warningDetails.length} 条)
                  </span>
                } 
                key="warnings"
              >
                <Alert
                  message={`发现 ${warningDetails.length} 条警告记录`}
                  description={
                    <div style={{ marginTop: 12 }}>
                      {warningDetails.map((warning, index) => (
                        <div key={index} style={{ 
                          marginBottom: 12, 
                          padding: '8px 12px', 
                          backgroundColor: '#fffbe6', 
                          border: '1px solid #ffe58f',
                          borderRadius: '4px'
                        }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            color: '#d46b08',
                            marginBottom: 4
                          }}>
                            第{warning.rowIndex}行 - {warning.employeeName}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {warning.messages.map((msg, msgIndex) => (
                              <li key={msgIndex} style={{ 
                                color: '#fa8c16',
                                marginBottom: 2
                              }}>
                                {msg}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  }
                  type="warning"
                  showIcon
                />
              </Panel>
            )}
          </Collapse>
        )}
      </Card>
    </div>
  );
};

const UniversalImportPage: React.FC = () => {
  const { t } = useTranslation('bulkImport');
  const { message } = App.useApp(); // 使用 antd 的 App hook

  // 使用 hook 获取薪资周期相关状态
  const {
    payrollPeriods,
    selectedPeriodId,
    setSelectedPeriodId,
    loadingPeriods,
  } = usePayrollPeriods(t, message);

  // 状态管理
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableModes, setAvailableModes] = useState<ImportModeConfig[]>([]);
  const [rawImportData, setRawImportData] = useState<RawImportData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<UploadResult | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedRow[] | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [importSettings, setImportSettings] = useState<ImportSettings>(DEFAULT_IMPORT_SETTINGS);

  // 派生状态：当前选择的模式配置
  const selectedModeConfig = useMemo(() => {
    return availableModes.find(m => m.id === selectedMode) || null;
  }, [selectedMode, availableModes]);

  // 派生状态：字段映射是否有效
  const isMappingValid = useMemo(() => {
    if (!selectedModeConfig) return false;
    const requiredFields = selectedModeConfig.requiredFields.map(f => f.key);
    const mappedValues = Object.values(fieldMapping);
    // 确保每个必填字段都被映射了
    return requiredFields.every(key => mappedValues.includes(key));
  }, [fieldMapping, selectedModeConfig]);

  // 定义步骤
  const steps = [
    {
      title: t('steps.select_period'),
    },
    {
      title: t('steps.select_mode'),
    },
    {
      title: t('steps.upload_data'),
    },
    {
      title: t('steps.map_fields'),
    },
    {
      title: t('steps.preview_confirm'),
    },
    {
      title: t('steps.import_result'),
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
  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
  };

  // 处理文件解析
  const handleDataParsed = useCallback((headers: string[], rows: any[][]) => {
    if (headers.length > 0 && selectedMode) {
      setRawImportData({
        mode: selectedMode,
        headers,
        rows,
        totalRecords: rows.length,
      });
      message.success(t('upload.parse_success', { count: rows.length }));
    } else {
      setRawImportData(null); // 清除数据
    }
  }, [selectedMode, t, message]);
  
  const handleUploadLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  }

  const handleMappingComplete = (mapping: Record<string, string>) => {
    setFieldMapping(mapping);
  };

  const handleImport = async () => {
    if (!selectedMode || !rawImportData || !validationResults || !processedData || !selectedPeriodId || !ImportStrategyFactory.hasMode(selectedMode)) {
      message.error("无法执行导入：数据未验证、缺少薪资周期或导入模式无效。");
      return;
    }

    setLoading(true);
    try {
      const strategy = await ImportStrategyFactory.getStrategy(selectedMode);
      
      const validData = processedData.filter(row => 
        validationResults.find(r => r.clientId === row._meta.clientId)?.isValid
      );

      if (validData.length === 0) {
        message.error("没有可供导入的有效数据。");
        setLoading(false);
        return;
      }

      // 3. Import valid data
      const result = await strategy.importData(validData, selectedPeriodId!, importSettings.overwriteMode);

      setImportResult(result);
      setCurrentStep(steps.length - 1); // Go to the last step
    } catch (error) {
      console.error("导入失败:", error);
      const errorMessage = error instanceof Error ? error.message : "导入过程中发生未知错误。";
      message.error(errorMessage);
      const totalRecords = rawImportData?.rows.length || 0;
      const errorResult: UploadResult = {
        success_count: 0,
        error_count: totalRecords,
        errors: [{
          index: 0,
          error: errorMessage
        }],
        successCount: 0,
        errorCount: totalRecords,
        createdEntries: []
      };
      setImportResult(errorResult);
      setCurrentStep(steps.length - 1); // Also go to results page on failure
    } finally {
      setLoading(false);
    }
  };

  // 导航
  const handleNextStep = async () => {
    if (currentStep === 0 && !selectedPeriodId) {
      message.warning(t('steps.please_select_period'));
      return;
    }
    if (currentStep === 1 && !selectedMode) {
      message.warning(t('steps.please_select_mode'));
      return;
    }
    if (currentStep === 2 && !rawImportData) {
      message.warning(t('upload.please_upload_file'));
      return;
    }
    if (currentStep === 3 && !isMappingValid) {
      message.warning(t('map.please_map_required_fields'));
      return;
    }

    // 在进入预览步骤前，执行处理和验证
    if (currentStep === 3) {
      if (!selectedMode || !rawImportData || !fieldMapping || !selectedPeriodId || !ImportStrategyFactory.hasMode(selectedMode)) {
        message.error("无法预览：缺少周期、模式、数据、字段映射或导入模式无效。");
        return;
      }
      setLoading(true);
      try {
        console.log('🔍 [UniversalImportPage] 开始数据处理:', {
          selectedMode,
          fieldMapping,
          rawImportDataHeaders: rawImportData.headers,
          rawImportDataRowCount: rawImportData.rows.length
        });
        
        const strategy = await ImportStrategyFactory.getStrategy(selectedMode);
        const processed = strategy.processData(rawImportData, fieldMapping);
        
        console.log('🔍 [UniversalImportPage] 数据处理完成:', {
          processedCount: processed.length,
          firstProcessedData: processed[0]?.data,
          earnings_details_first: processed[0]?.data?.earnings_details,
          deductions_details_first: processed[0]?.data?.deductions_details
        });
        
        // 先用默认的追加模式进行验证，获取重复记录信息
        const validation = await strategy.validateData(processed, selectedPeriodId, OverwriteMode.NONE);
        
        console.log('🔍 [UniversalImportPage] 验证完成:', {
          validationCount: validation.length,
          validationExample: validation[0]
        });
        
        setProcessedData(processed);
        setValidationResults(validation);
      } catch (error) {
        console.error("数据处理或验证失败:", error);
        const errorMessage = error instanceof Error ? error.message : "数据处理或验证时发生未知错误。";
        message.error(errorMessage);
        return; // 阻止进入下一步
      } finally {
        setLoading(false);
      }
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
          <PayrollPeriodSelector
            periods={payrollPeriods}
            selectedPeriodId={selectedPeriodId}
            onChange={setSelectedPeriodId}
            loading={loadingPeriods}
          />
        );
      case 1:
        return (
          <ImportModeSelector
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            availableModes={availableModes}
            loading={loading}
          />
        );
      case 2:
        return (
          <UniversalDataUpload
            onDataParsed={handleDataParsed}
            onLoadingChange={handleUploadLoadingChange}
          />
        );
      case 3: {
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
      case 4:
        if (!processedData || !validationResults || !selectedModeConfig) {
           return <p>{t('common:errors.data_missing_or_not_validated')}</p>
        }
        return (
          <DataPreview 
            processedData={processedData}
            validationResults={validationResults}
            modeConfig={selectedModeConfig}
            importSettings={importSettings}
            onSettingsChange={setImportSettings}
          />
        );
      case 5:
        return (
          <ImportResultStep
            uploadResult={importResult}
            onStartAgain={() => {
              setCurrentStep(0);
              setImportResult(null);
              setRawImportData(null);
              setFieldMapping({});
              setProcessedData(null);
              setValidationResults(null);
            }}
            onNavigateToEntries={() => {
              // Navigate to payroll entries page
              window.location.href = '/payroll/runs';
            }}
          />
        );
      default:
        return <p>{t('common:errors.unknown_step')}</p>;
    }
  };

  return (
    <PageContainer title={t('title')}>
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
              disabled={!validationResults || validationResults.every(r => !r.isValid)}
            >
              {t('common:actions.execute_import')}
            </Button>
          )}
          {currentStep < steps.length - 2 && ( // All steps before Preview
             <Button
              type="primary"
              onClick={handleNextStep}
              loading={loading}
              disabled={
                (currentStep === 0 && !selectedPeriodId) ||
                (currentStep === 1 && !selectedMode) ||
                (currentStep === 2 && !rawImportData) ||
                (currentStep === 3 && !isMappingValid)
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