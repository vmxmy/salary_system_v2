import { useState, useCallback, useEffect } from 'react';
import {
  validateBulkImportData,
  processRawTableData,
  executeBulkImport,
  getActivePayrollComponents,
  getActivePayrollPeriods
} from '../../../services/payrollBulkImportApi';
import { generateSmartMapping } from '../utils/fieldMapping';
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
  CreatePayrollEntryPayload
} from '../types/index';
import { message } from 'antd';

export const useImportFlow = () => {
  // 核心状态
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 数据状态
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
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
    
    // 生成智能映射规则
    const rules = generateSmartMapping(data.headers);
    setMappingRules(rules);
    
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
      
      // 处理原始表格数据
      const rawData = processRawTableData(
        importData.headers,
        importData.rows,
        mappingRules
      );
      
      console.log('🔄 开始验证数据:', {
        headers: importData.headers,
        totalRows: importData.rows.length,
        mappingRulesCount: mappingRules.length,
        processedDataCount: rawData.length
      });
      
      // 调用后台验证API，传递覆盖模式参数
      const validationResult = await validateBulkImportData(
        rawData, 
        selectedPeriodId, 
        importSettings.overwriteExisting
      );
      
      // 转换验证结果格式
      let result: ValidationResult = {
        total: validationResult.total,
        valid: validationResult.valid,
        invalid: validationResult.invalid,
        warnings: validationResult.warnings,
        errors: validationResult.errors
      };
      
      // 前端额外处理：如果启用覆盖模式且有错误，再次尝试转换
      if (importSettings.overwriteExisting && result.errors && result.errors.length > 0) {
        console.log('🔍 前端额外处理覆盖模式:', {
          originalResult: result,
          overwriteMode: importSettings.overwriteExisting
        });
        
        const processedErrors: string[] = [];
        let convertedWarnings = 0;
        
        result.errors.forEach((error, index) => {
          const errorLower = error.toLowerCase();
          
          // 更宽泛的重复记录错误检测
          const isDuplicateError = 
            error.includes('已存在') || 
            error.includes('duplicate') || 
            error.includes('重复') ||
            error.includes('唯一') ||
            error.includes('冲突') ||
            errorLower.includes('exists') ||
            errorLower.includes('conflict') ||
            errorLower.includes('unique') ||
            errorLower.includes('constraint') ||
            // 如果所有记录都是错误，可能都是重复记录
            (result.valid === 0 && result.invalid === result.total);
            
          console.log(`🔍 前端错误检查 ${index + 1}:`, {
            error,
            isDuplicateError
          });
          
          if (isDuplicateError) {
            convertedWarnings++;
            console.log('⚠️ 前端：转换重复记录错误为警告:', error);
          } else {
            processedErrors.push(error);
          }
        });
        
        // 如果没有找到明确的重复错误，但启用了覆盖模式且所有记录都无效，
        // 假设都是重复记录错误
        if (convertedWarnings === 0 && result.valid === 0 && result.invalid > 0) {
          console.log('🔍 前端：假设所有无效记录都是重复记录');
          convertedWarnings = result.invalid;
          processedErrors.length = 0; // 清空错误
        }
        
        if (convertedWarnings > 0) {
          result = {
            ...result,
            errors: processedErrors,
            warnings: (result.warnings || 0) + convertedWarnings,
            valid: result.valid + convertedWarnings,
            invalid: Math.max(0, result.invalid - convertedWarnings)
          };
          
          console.log('✅ 前端覆盖模式处理完成:', {
            convertedWarnings,
            newResult: result
          });
        }
      }
      
      setValidationResult(result);
      setProcessedData(validationResult.validatedData);
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
    } finally {
      setLoading(false);
    }
  }, [importData, selectedPeriodId, mappingRules]);

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
      
      // 执行批量导入
      const result = await executeBulkImport(bulkPayload);
      
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
      
    } catch (error: any) {
      console.error('❌ 批量导入失败:', error);
      
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
  }, []);

  return {
    // 状态
    currentStep,
    loading,
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