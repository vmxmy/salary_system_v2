import { nanoid } from 'nanoid';
import type { RawPayrollEntryData, ValidatedPayrollEntryData, PayrollComponentDefinition } from '../../types/payrollTypes'; // 假设类型路径, 移动 PayrollComponentDefinition 导入
import type { EarningDetailItem, DeductionDetailItem } from './constants'; // 移除 PayrollComponentDefinition 从这里
import { getComponentName } from './payrollPageUtils'; // 从新的文件名导入
import { formatCurrency as importedFormatCurrency } from './payrollPageUtils'; // 导入 formatCurrency
import type { TFunction } from 'i18next'; // 导入 TFunction 类型

// processPayrollRecord 函数定义
// 注意：已将 t 函数和 componentDefinitions 作为参数传入
export const processPayrollRecord = (record: RawPayrollEntryData, t: TFunction, componentDefinitions: PayrollComponentDefinition[]): RawPayrollEntryData => {
  // 确定人员类型 (REGULAR 或 HIRED)
  let personnelType: 'REGULAR' | 'HIRED' | 'UNKNOWN' = 'UNKNOWN';
  const rawIdentity = record.raw_personnel_identity || ''; // 使用原始人员身份字段

  if (rawIdentity) {
    if (rawIdentity.includes(t('payroll:auto_text_e59ca8')) || rawIdentity.includes(t('payroll:auto_text_e7bc96')) || rawIdentity.includes(t('payroll:auto_text_e59198'))) {
      personnelType = 'REGULAR';
    } else if (rawIdentity.includes(t('payroll:auto_text_e88198')) || rawIdentity.includes(t('payroll:auto_text_e59088')) || rawIdentity.includes(t('payroll:auto_text_e6b4be')) || rawIdentity.includes(t('payroll:auto_text_e59198')) || rawIdentity.includes(t('payroll:auto_text_e4b8b4'))) {
      personnelType = 'HIRED';
    }
  }
  record.personnel_type = personnelType;
  
  // 检查是否有月奖励绩效相关字段
  const possiblePerformanceFields = Object.keys(record).filter(key => 
    key.includes(t('payroll:auto_text_e5a596')) || key.includes(t('payroll:auto_text_e7bba9')) || key.includes('PERFORMANCE')
  );
  possiblePerformanceFields.forEach(field => {
    // console.log(t('payroll:auto_field__2020e9'), { field: field, value: record[field] });
  });
  
  // 特别检查earnings_details中的PERFORMANCE_BONUS
  if (record.earnings_details) {
    Object.keys(record.earnings_details).forEach(key => {
      if (key.includes('PERFORMANCE') || key.includes(t('payroll:auto_text_e7bba9')) || key.includes(t('payroll:auto_text_e5a596'))) {
        // console.log(t('payroll:auto_key__2020e9'), { key: key, value: record.earnings_details[key] });
      }
    });
    
    // 特别检查PERFORMANCE_BONUS
    if (record.earnings_details.PERFORMANCE_BONUS) {
      // console.log(t('payroll:auto_text_e5ad98'));
    } else {
      // console.log(t('payroll:auto_text_e69ca1'));
    }
  }
  
  // 确保嵌套结构存在
  if (!record.earnings_details) record.earnings_details = {};
  if (!record.deductions_details) record.deductions_details = {};

  // 处理姓名拆分
  if (record.employee_full_name && !record.last_name && !record.first_name) {
    const fullName = record.employee_full_name.trim();
    // 中文姓名拆分规则：第一个字符为姓，其余为名
    if (fullName.length >= 2) {
      record.last_name = fullName.substring(0, 1);
      record.first_name = fullName.substring(1);
    } else {
      record.last_name = fullName;
      record.first_name = '';
    }
    // 生成employee_name用于显示
    record.employee_name = fullName;
  } else if (record.last_name && record.first_name) {
    // 如果已经有姓和名，生成完整姓名
    record.employee_name = `${record.last_name}${record.first_name}`;
  }

  // 处理员工编号（非必填）
  if (!record.employee_code) {
    record.employee_code = null; // 明确设置为null而不是空字符串
  }

  // 准备员工匹配信息
  if (record.id_number && record.last_name && record.first_name) {
    record.employee_info = {
      last_name: record.last_name,
      first_name: record.first_name,
      id_number: record.id_number
    };
  }

  // 转换数字的辅助函数
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // 移除逗号、空格和其他非数字字符（保留小数点和负号）
      const cleanValue = value.replace(/[,\s]/g, '').trim();
      const num = parseFloat(cleanValue);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // 处理收入项，确保金额是数字
  const originalEarningsKeys = Object.keys(record.earnings_details as Record<string, EarningDetailItem>);
  
  // 特别检查PERFORMANCE_BONUS是否存在
  const hasPerformanceBonus = originalEarningsKeys.includes('PERFORMANCE_BONUS');
  if (hasPerformanceBonus) {
    // console.log(t('payroll:auto_text_e5ad98'));
  }
  
  Object.keys(record.earnings_details as Record<string, EarningDetailItem>).forEach(key => {
    const item = (record.earnings_details as Record<string, EarningDetailItem>)[key];
    let amount = 0;
    
    // 特别标记绩效字段
    const isPerformanceField = key.includes('PERFORMANCE') || key.includes(t('payroll:auto_text_e7bba9')) || key.includes(t('payroll:auto_text_e5a596'));
    if (isPerformanceField) {
      // console.log(t('payroll:auto_key__2020e9'), { key: key, amount: item.amount });
    }
    
    if (typeof item.amount === 'number' || typeof item.amount === 'string') {
      amount = toNumber(item.amount);
      if (isPerformanceField) {
        // console.log(t('payroll:auto_amount__2020e9'), { key: key, amount: amount });
      }
    } else if (item && typeof item.amount === 'object' && item.amount !== undefined) {
      // 处理金额可能被错误解析为对象的情况，例如 { value: "100.00" }
      amount = toNumber((item.amount as any).value !== undefined ? (item.amount as any).value : item.amount);
      if (isPerformanceField) {
        // console.log(t('payroll:auto_amount__2020e9'), { key: key, amount: amount });
      }
    } else {
      // console.warn(t('payroll:auto_key__2020e9'), { key: key });
      if (isPerformanceField) {
        // console.log(t('payroll:auto_key__2020e9'), { key: key });
      }
    }
    
    if (isPerformanceField) {
      // console.log(t('payroll:auto_key__2020e9'), { key: key, final_amount: amount });
    }
    
    // 如果金额为0或无效，删除该项（但在验证时会考虑原始数据）
    if (amount === 0) {
      if (isPerformanceField) {
        // console.log(t('payroll:auto_key__2020e9'), { key: key });
      }
      delete record.earnings_details[key];
    } else {
      record.earnings_details[key] = {
        amount: amount,
        name: getComponentName(key, 'earnings', componentDefinitions)
      };
      if (isPerformanceField) {
        // console.log(t('payroll:auto_key__2020e9'), { key: key, updated_item: record.earnings_details[key] });
      }
    }
  });
  
  
  // 再次检查PERFORMANCE_BONUS是否还存在
  const stillHasPerformanceBonus = Object.keys(record.earnings_details).includes('PERFORMANCE_BONUS');
  if (!hasPerformanceBonus && !stillHasPerformanceBonus) {
    // console.log(t('payroll:auto_text_e69ca1'));
  } else if (hasPerformanceBonus && !stillHasPerformanceBonus) {
    // console.log(t('payroll:auto_text_e588a0'));
  }

  // 处理扣除项，确保金额是数字
  Object.keys(record.deductions_details as Record<string, DeductionDetailItem>).forEach(key => {
    const item = (record.deductions_details as Record<string, DeductionDetailItem>)[key];
    let amount = 0;
    
    if (typeof item.amount === 'number' || typeof item.amount === 'string') {
      amount = toNumber(item.amount);
    } else if (item && typeof item.amount === 'object' && item.amount !== undefined) {
      amount = toNumber((item.amount as any).value !== undefined ? (item.amount as any).value : item.amount);
    }
    
    // 保留所有扣除项，包括金额为0的项（特别是标准扣发项如失业保险）
    record.deductions_details[key] = {
      amount: amount,
      name: getComponentName(key, 'deductions', componentDefinitions)
    };
  });

  // 计算总收入和总扣除
  let totalEarnings = 0;
  let totalDeductions = 0;
  
  // 计算总收入（排除统计字段）
  Object.entries(record.earnings_details as Record<string, EarningDetailItem>).forEach(([key, item]) => {
    if (item && typeof item.amount === 'number') {
      // 排除统计字段，不计入收入总和
      if (key !== 'ANNUAL_FIXED_SALARY_TOTAL' && key !== 'QUARTERLY_PERFORMANCE_Q1') {
        totalEarnings += item.amount;
      }
    }
  });
  
  // 计算总扣除
  Object.values(record.deductions_details as Record<string, DeductionDetailItem>).forEach((item) => {
    if (item && typeof item.amount === 'number') {
      totalDeductions += item.amount;
    }
  });
  
  // 转换主要金额字段为数字
  record.gross_pay = toNumber(record.gross_pay);
  record.net_pay = toNumber(record.net_pay);
  record.total_deductions = toNumber(record.total_deductions);
  
  // 优先使用原始的gross_pay和total_deductions值，只有在它们为0时才使用计算值
  // 这样可以避免因为删除0值项导致的总和不匹配问题
  if (!record.gross_pay || record.gross_pay === 0) {
    record.gross_pay = totalEarnings;
  }
  
  if (!record.total_deductions || record.total_deductions === 0) {
    record.total_deductions = totalDeductions;
  }
  
  // 如果没有净工资，计算净工资
  if (!record.net_pay || record.net_pay === 0) {
    record.net_pay = record.gross_pay - record.total_deductions;
  }
  
  // 设置 total_earnings 字段用于表格显示
  record.total_earnings = record.gross_pay;
  
  // 设置默认状态（使用动态获取的ID）
  // defaultPayrollEntryStatusId 应该作为参数传入或在此文件中定义/获取
  // 为了简单起见，暂时移除此逻辑或假设它已处理
  // if (!record.status_lookup_value_id && defaultPayrollEntryStatusId) {
  //   record.status_lookup_value_id = defaultPayrollEntryStatusId; 
  // }
  
  console.log(t('payroll:auto___personnel_type__e69c80'), {
    ...record,
    personnel_type: record.personnel_type // 确保在日志中也输出
  });
  
  return record;
};

// --- Validation Functions ---

// Specific validation for REGULAR personnel
export const validateRegularSpecifics = (record: RawPayrollEntryData, t: TFunction): string[] => {
  const errors: string[] = [];
  // Add validation rules specific to regular staff
  // Example: if (!record.some_regular_specific_field) errors.push(t('validation.regular_field_required'));
  return errors;
};

// Specific validation for HIRED personnel
export const validateHiredSpecifics = (record: RawPayrollEntryData, t: TFunction): string[] => {
  const errors: string[] = [];
  // Add validation rules specific to hired staff
  // Example: if (!record.some_hired_specific_field) errors.push(t('validation.hired_field_required'));
  return errors;
};

// Main validation function for a single record
export const validateRecord = (
  record: RawPayrollEntryData,
  index: number,
  t: TFunction,
  formatCurrencyParam: (value: any) => string, // Renamed to avoid conflict if any, and to use imported one
  // validateRegularSpecifics and validateHiredSpecifics are now in the same file
): string[] => {
  const errors: string[] = [];
  const recordDescription = `${t('batch_import.record_at_index', { index: index + 1 })} (${record.employee_name || record.id_number || t('common:unknown')})`;

  // Basic required fields
  if (!record.employee_full_name && !record.employee_name) errors.push(t('batch_import.validation.employee_name_required', { record: recordDescription }));
  if (!record.id_number) errors.push(t('batch_import.validation.id_number_required', { record: recordDescription }));
  if (record.gross_pay === undefined || record.gross_pay === null || isNaN(record.gross_pay)) {
    errors.push(t('batch_import.validation.gross_pay_invalid', { record: recordDescription }));
  }
  if (record.total_deductions === undefined || record.total_deductions === null || isNaN(record.total_deductions)) {
    errors.push(t('batch_import.validation.total_deductions_invalid', { record: recordDescription }));
  }
  if (record.net_pay === undefined || record.net_pay === null || isNaN(record.net_pay)) {
    errors.push(t('batch_import.validation.net_pay_invalid', { record: recordDescription }));
  }
  
  // Balance check: Gross Pay - Total Deductions = Net Pay (within tolerance)
  const calculatedNetPay = (record.gross_pay || 0) - (record.total_deductions || 0);
  const tolerance = 0.01; // Allow 1 cent difference for floating point issues
  if (Math.abs(calculatedNetPay - (record.net_pay || 0)) > tolerance) {
    errors.push(
      t('batch_import.validation.balance_mismatch', {
        record: recordDescription,
        gross_pay: importedFormatCurrency(record.gross_pay),
        total_deductions: importedFormatCurrency(record.total_deductions),
        net_pay: importedFormatCurrency(record.net_pay),
        calculated_net_pay: importedFormatCurrency(calculatedNetPay),
      })
    );
  }

  // Personnel type specific validations
  if (record.personnel_type === 'REGULAR') {
    errors.push(...validateRegularSpecifics(record, t));
  } else if (record.personnel_type === 'HIRED') {
    errors.push(...validateHiredSpecifics(record, t));
  } else {
    // errors.push(t('batch_import.validation.unknown_personnel_type', { record: recordDescription }));
  }
  
  // Check for employee matching info
  if (!record.employee_info || !record.employee_info.id_number || (!record.employee_info.last_name && !record.employee_info.first_name)) {
    // This might be an acceptable state if employee_id is provided and valid
    // errors.push(t('batch_import.validation.missing_employee_match_info', { record: recordDescription }));
  }

  return errors;
};

// Removed the first (skeletal) definition of processAndValidateJsonData.
// The version below is the one moved from the main file.

// processAndValidateJsonData function (moved from PayrollBulkImportPage.tsx)
// Note: Dependencies like validateRecord, t, formatCurrency, componentDefinitions need to be handled.
export const processAndValidateJsonData = (
  jsonData: any[],
  t: TFunction, // Added t
  componentDefinitions: PayrollComponentDefinition[], // Added componentDefinitions
  formatCurrencyParam: (value: any) => string, // Renamed to use imported one
  validationEnabled: boolean // Added validationEnabled from main component state
  // validateRecord should be available in this file or imported
): ValidatedPayrollEntryData[] => {
  let hasAnyErrorsInBatch = false; // This state might need to be managed differently or returned
  let localValidRecords = 0;
  let localInvalidRecords = 0;

  const processedAndValidatedData = jsonData.map((rawRecord, index) => {
    // First, process the record (type conversion, defaults, etc.)
    // Assuming processPayrollRecord is already in this file and exported
    const processedRecord = processPayrollRecord(rawRecord as RawPayrollEntryData, t, componentDefinitions);

    const typedRecord: RawPayrollEntryData = {
      ...processedRecord, // Use the already processed record
      _clientId: processedRecord._clientId || nanoid(), 
      originalIndex: index, 
    };
    
    // Then, validate the processed record
    // Assuming validateRecord is also in this file and exported, and takes these params
    const fieldErrors = validationEnabled ? validateRecord(typedRecord, index, t, importedFormatCurrency) : [];
    
    const validatedRecord: ValidatedPayrollEntryData = {
      ...typedRecord,
      validationErrors: fieldErrors.length > 0 ? fieldErrors : undefined,
      __isValid: fieldErrors.length === 0,
      __errors: fieldErrors, // Keep for compatibility if needed
      __rowId: typedRecord._clientId || nanoid(), // Ensure __rowId is always a string
      __isNew: true // Mark as new by default
    };

    if (fieldErrors.length > 0) {
      hasAnyErrorsInBatch = true;
      localInvalidRecords++;
    } else {
      localValidRecords++;
    }
    return validatedRecord;
  });
  
  // setValidationSummary should be called in the component that uses this function
  // This function should ideally just return the data and error summary.
  // For now, returning data. Summary update will be handled in the component.
  // Or, return an object: { data: processedAndValidatedData, summary: { totalRecords: jsonData.length, validRecords: localValidRecords, invalidRecords: localInvalidRecords } }

  return processedAndValidatedData; 
  // Consider returning summary as well, e.g.:
  // return {
  //   data: processedAndValidatedData,
  //   summary: {
  //     totalRecords: jsonData.length,
  //     validRecords: localValidRecords,
  //     invalidRecords: localInvalidRecords,
  //     hasAnyErrorsInBatch
  //   }
  // };
};