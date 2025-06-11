import { useState, useCallback, useEffect } from 'react';
import {
  validateBulkImportData,
  processRawTableData,
  executeBulkImport,
  getActivePayrollComponents,
  getActivePayrollPeriods
} from '../../../services/payrollBulkImportApi';
import { performSmartMapping, applySmartMappingToRules, DEFAULT_CONFIG } from '../utils/smartMapping';
import { DEFAULT_IMPORT_SETTINGS } from '../types/constants';
import type {
  ImportData,
  MappingRule,
  ValidationResult,
  ImportSettings,
  ImportResult,
  PayrollComponentDefinition,
  PayrollPeriod,
  ValidatedPayrollEntryData,
  BulkCreatePayrollEntriesPayload,
  CreatePayrollEntryPayload,
  BulkImportValidationResult
} from '../types/index';
import { message } from 'antd';

export const useImportFlow = () => {
  // 核心状态
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 进度状态
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    message: '',
    stage: '' // 'validating', 'importing', 'completed'
  });
  
  // 数据状态
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([]);
  const [validationResult, setValidationResult] = useState<BulkImportValidationResult | null>(null);
  const [processedData, setProcessedData] = useState<ValidatedPayrollEntryData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // 配置状态
  const [payrollComponents, setPayrollComponents] = useState<PayrollComponentDefinition[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [importSettings, setImportSettings] = useState<ImportSettings>(DEFAULT_IMPORT_SETTINGS);

  // 初始化数据加载
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        const [components, periods] = await Promise.all([
          getActivePayrollComponents(),
          getActivePayrollPeriods()
        ]);
        
        setPayrollComponents(components);
        setPayrollPeriods(periods);
        
        console.log('✅ 初始数据加载成功:', {
          componentsCount: components.length,
          periodsCount: periods.length
        });
      } catch (error: any) {
        console.error('❌ 初始数据加载失败:', error);
        message.error(`数据加载失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 处理数据解析成功
  const handleDataParsed = useCallback((data: ImportData) => {
    setImportData(data);
    
    // 生成空的映射规则，等待用户手动映射或使用智能映射
    const emptyRules: MappingRule[] = data.headers.map(header => ({
      sourceField: header,
      targetField: '',
      confidence: 0,
      category: 'base',
      required: false
    }));
    setMappingRules(emptyRules);
    
    // 进入映射步骤
    setCurrentStep(1);
  }, []);

  // 验证数据
  const validateData = useCallback(async () => {
    if (!importData || !selectedPeriodId) {
      message.error('请先选择薪资周期');
      return;
    }
    
    try {
      setLoading(true);
      setProgress({
        current: 0,
        total: importData.rows.length,
        message: '正在处理数据映射...',
        stage: 'validating'
      });
      
      // 处理原始表格数据
      const rawData = processRawTableData(
        importData.headers,
        importData.rows,
        mappingRules
      );
      
      setProgress({
        current: Math.floor(rawData.length * 0.2),
        total: rawData.length,
        message: '正在验证数据...',
        stage: 'validating'
      });
      
      console.log('🔄 开始验证数据:', {
        headers: importData.headers,
        totalRows: importData.rows.length,
        mappingRulesCount: mappingRules.length,
        processedDataCount: rawData.length
      });
      
      // 调用后台验证API，传递覆盖模式参数
      const result = await validateBulkImportData(
        rawData, 
        selectedPeriodId, 
        importSettings.overwriteExisting
      );
      
      setProgress({
        current: rawData.length,
        total: rawData.length,
        message: '验证完成',
        stage: 'completed'
      });
      
      setValidationResult(result);
      setProcessedData(result.validatedData);
      setCurrentStep(2);
      
      console.log('✅ 数据验证完成:', result);
      
      if (result.invalid > 0) {
        message.warning(`验证完成：${result.valid} 条有效记录，${result.invalid} 条无效记录`);
      } else {
        message.success(`验证完成：所有 ${result.valid} 条记录均有效`);
      }
      
    } catch (error: any) {
      console.error('❌ 数据验证失败:', error);
      message.error(`数据验证失败: ${error.message}`);
      setProgress({
        current: 0,
        total: 0,
        message: '验证失败',
        stage: ''
      });
    } finally {
      setLoading(false);
      // 不重置进度，让用户看到完成状态
    }
  }, [importData, selectedPeriodId, mappingRules, importSettings]);

  // 执行导入
  const executeImport = useCallback(async () => {
    if (!selectedPeriodId || !processedData || processedData.length === 0) {
      message.error('没有可导入的数据记录');
      return;
    }
    
    // 过滤出有效的数据记录
    const validEntries = processedData.filter(entry => 
      entry.__isValid !== false
    );
    
    if (validEntries.length === 0) {
      message.error('没有有效的数据记录可以导入');
      return;
    }

    try {
      setLoading(true);
      setProgress({
        current: 0,
        total: validEntries.length,
        message: '正在准备导入数据...',
        stage: 'importing'
      });
      
      // 转换为API需要的格式
      const createPayrollEntries: CreatePayrollEntryPayload[] = validEntries.map(entry => ({
        employee_id: entry.employee_id || 0,
        payroll_period_id: selectedPeriodId,
        payroll_run_id: 0,
        gross_pay: entry.gross_pay,
        total_deductions: entry.total_deductions,
        net_pay: entry.net_pay,
        status_lookup_value_id: 64, // 已计算状态
        remarks: entry.remarks || '',
        earnings_details: entry.earnings_details,
        deductions_details: entry.deductions_details,
        employee_info: entry.employee_info
      }));
      
      setProgress({
        current: Math.floor(validEntries.length * 0.1),
        total: validEntries.length,
        message: '正在执行批量导入...',
        stage: 'importing'
      });
      
      // 构建批量导入载荷
      const bulkPayload: BulkCreatePayrollEntriesPayload = {
        payroll_period_id: selectedPeriodId,
        entries: createPayrollEntries,
        overwrite_mode: importSettings.overwriteExisting
      };
      
      console.log('🚀 开始执行批量导入:', {
        periodId: selectedPeriodId,
        totalEntries: createPayrollEntries.length,
        overwriteMode: importSettings.overwriteExisting
      });
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.current < prev.total * 0.8) {
            return {
              ...prev,
              current: prev.current + Math.floor(prev.total * 0.1),
              message: `正在导入第 ${prev.current + Math.floor(prev.total * 0.1)} 条记录...`
            };
          }
          return prev;
        });
      }, 1000);
      
      try {
        // 执行批量导入
        const result = await executeBulkImport(bulkPayload);
        
        clearInterval(progressInterval);
        
        setProgress({
          current: validEntries.length,
          total: validEntries.length,
          message: '导入完成',
          stage: 'completed'
        });
        
        console.log('✅ 批量导入完成:', result);
        
        setImportResult(result);
        setCurrentStep(3);
        
        if (result.error_count > 0) {
          message.warning(
            `导入完成：成功 ${result.success_count} 条，失败 ${result.error_count} 条`
          );
        } else {
          message.success(`导入完成：成功导入 ${result.success_count} 条记录`);
        }
      } catch (importError) {
        clearInterval(progressInterval);
        throw importError;
      }
      
    } catch (error: any) {
      console.error('❌ 批量导入失败:', error);
      
      setProgress({
        current: 0,
        total: 0,
        message: '导入失败',
        stage: ''
      });
      
      setImportResult({
        success_count: 0,
        error_count: validEntries.length,
        errors: [{
          index: 0,
          error: error.message || '网络错误或服务器异常'
        }]
      });
      
      setCurrentStep(3);
      message.error(`导入失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, processedData, importSettings]);

  // 重置状态
  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setImportData(null);
    setMappingRules([]);
    setValidationResult(null);
    setProcessedData([]);
    setImportResult(null);
    setSelectedPeriodId(null);
    setImportSettings(DEFAULT_IMPORT_SETTINGS);
    setProgress({
      current: 0,
      total: 0,
      message: '',
      stage: ''
    });
  }, []);

  return {
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
  };
}; 