import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import type { 
  RawPayrollEntryData, 
  ValidatedPayrollEntryData, 
  PayrollComponentDefinition,
  BulkCreatePayrollEntriesResult 
} from '../../../types/payrollTypes';
import { processAndValidateJsonData } from '../dataProcessing';
import { formatCurrency } from '../payrollPageUtils';
import * as payrollApi from '../../../services/payrollApi';

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

export interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    record: { employee_id?: number; index: number };
    error: string;
  }>;
  createdEntries: any[];
}

export const usePayrollImport = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const { message } = App.useApp();

  // 核心状态
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ValidatedPayrollEntryData[] | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0
  });

  // 配置状态
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false);
  const [validationEnabled, setValidationEnabled] = useState<boolean>(true);
  const [showDetailedErrors, setShowDetailedErrors] = useState<boolean>(false);

  // 解析和预览数据
  const handleParseAndPreview = useCallback((
    componentDefinitions: PayrollComponentDefinition[]
  ) => {
    setParseError(null);
    
    if (!jsonInput.trim()) {
      setParseError(t('batch_import.validation.no_data_to_upload'));
      return;
    }

    try {
      const parsedJson = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsedJson)) {
        setParseError(t('batch_import.validation.json_not_array'));
        return;
      }
      
      if (parsedJson.length === 0) {
        setParseError(t('batch_import.validation.no_data_to_upload'));
        return;
      }

      const validatedDataArray = processAndValidateJsonData(
        parsedJson,
        t,
        componentDefinitions,
        formatCurrency,
        validationEnabled
      );
      
      setParsedData(validatedDataArray);

      // 计算验证摘要
      const totalRecords = validatedDataArray.length;
      const validRecordsCount = validatedDataArray.filter(record => record.__isValid).length;
      setValidationSummary({
        totalRecords,
        validRecords: validRecordsCount,
        invalidRecords: totalRecords - validRecordsCount,
      });

      setCurrentStep(1);
      message.success(t('batch_import.message.file_parsed_success', { count: totalRecords }));
    } catch (error) {
      setParseError(
        t('batch_import.message.file_parse_error') + 
        ': ' + 
        (error instanceof Error ? error.message : String(error))
      );
    }
  }, [jsonInput, t, validationEnabled, message]);

  // 批量上传
  const handleUpload = useCallback(async (
    selectedPeriodId: number | null,
    defaultPayrollEntryStatusId: number | null
  ) => {
    if (!parsedData || parsedData.length === 0) {
      message.error(t('batch_import.validation.no_data_to_upload'));
      return;
    }
    
    if (!selectedPeriodId) {
      message.error(t('batch_import.validation.period_required'));
      return;
    }

    const validRecords = parsedData.filter(record => 
      !record.validationErrors || record.validationErrors.length === 0
    );

    if (validRecords.length === 0) {
      message.error(t('batch_import.validation.no_valid_data_to_upload'));
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setCurrentStep(2);

    try {
      const payloadEntries = validRecords.map(record => {
        const { 
          _clientId, 
          validationErrors, 
          originalIndex, 
          employee_name, 
          department_name, 
          position_name, 
          status_lookup_value_name, 
          employee_full_name, 
          last_name, 
          first_name, 
          id_number, 
          employee_code, 
          ...apiPayload 
        } = record;
        
        return {
          employee_id: apiPayload.employee_id || 0,
          payroll_period_id: selectedPeriodId,
          payroll_run_id: 0,
          gross_pay: apiPayload.gross_pay,
          total_deductions: apiPayload.total_deductions,
          net_pay: apiPayload.net_pay,
          status_lookup_value_id: apiPayload.status_lookup_value_id || defaultPayrollEntryStatusId || 1,
          remarks: apiPayload.remarks,
          earnings_details: apiPayload.earnings_details,
          deductions_details: apiPayload.deductions_details || {},
          employee_info: apiPayload.employee_info
        };
      });

      const bulkPayload = {
        payroll_period_id: selectedPeriodId,
        entries: payloadEntries,
        overwrite_mode: overwriteMode,
      };

      const response = await payrollApi.bulkCreatePayrollEntries(bulkPayload);
      
      // 处理响应
      const errors = Array.isArray(response.errors) ? response.errors : [];
      const createdEntries = Array.isArray(response.created_entries) ? response.created_entries : [];
      
      setUploadResult({
        successCount: response.success_count || 0,
        errorCount: response.error_count || 0,
        errors: errors.map(err => ({
          record: { employee_id: err.employee_id, index: err.index },
          error: err.error
        })),
        createdEntries
      });

      message.success(t('batch_import.message.upload_success', { count: response.success_count }));
      
      if (response.error_count > 0) {
        message.warning(t('batch_import.message.upload_partial_success', { 
          success: response.success_count, 
          error: response.error_count 
        }));
      }

      setCurrentStep(3);
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = t('common:error.unknown');
      
      // 检查重复记录错误
      const errorString = JSON.stringify(error.response?.data || error.message || error);
      if (errorString.includes('duplicate key value violates unique constraint') || 
          errorString.includes('uq_payroll_entries_employee_period_run') ||
          errorString.includes('already exists')) {
        errorMessage = t('payroll:auto_text_e6a380');
      } else if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : t('batch_import.message.upload_failed');
      }

      message.error(errorMessage);
      setCurrentStep(1);
    } finally {
      setUploading(false);
    }
  }, [parsedData, overwriteMode, t, message]);

  // 重新开始
  const handleStartAgain = useCallback(() => {
    setCurrentStep(0);
    setJsonInput('');
    setParsedData(null);
    setUploadResult(null);
    setParseError(null);
    setValidationSummary({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });
  }, []);

  return {
    // 状态
    currentStep,
    uploading,
    jsonInput,
    parseError,
    parsedData,
    uploadResult,
    validationSummary,
    overwriteMode,
    validationEnabled,
    showDetailedErrors,

    // 状态更新函数
    setJsonInput,
    setOverwriteMode,
    setValidationEnabled,
    setShowDetailedErrors,
    setCurrentStep,

    // 操作函数
    handleParseAndPreview,
    handleUpload,
    handleStartAgain
  };
}; 