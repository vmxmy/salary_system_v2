import { nanoid } from 'nanoid';
import type {
  RawPayrollEntryData,
  ValidatedPayrollEntryData,
  PayrollComponentDefinition
} from '../../types/payrollTypes';

// 将值转换为数字
export const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // 处理带逗号的数字字符串
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// 处理薪资记录
export const processPayrollRecord = (
  record: Record<string, any>,
  componentDefinitions: PayrollComponentDefinition[]
): ValidatedPayrollEntryData => {
  const processed: RawPayrollEntryData = {
    employee_code: record.employee_code || '',
    employee_full_name: record.employee_full_name || '',
    id_number: record.id_number || '',
    gross_pay: 0,
    total_deductions: 0,
    net_pay: 0,
    remarks: record.remarks || '',
    earnings_details: {},
    deductions_details: {},
    raw_personnel_identity: record.raw_personnel_identity || '',
    __isHiredPersonnel: record.raw_personnel_identity?.includes('正式聘用') || false
  };

  // 处理收入详情
  Object.keys(record)
    .filter(key => key.startsWith('earnings_details.'))
    .forEach(key => {
      const [_, code] = key.split('.');
      const amount = toNumber(record[key]);
      if (amount !== 0) {
        processed.earnings_details[code] = { amount };
      }
    });

  // 处理扣除详情
  Object.keys(record)
    .filter(key => key.startsWith('deductions_details.'))
    .forEach(key => {
      const [_, code] = key.split('.');
      const amount = toNumber(record[key]);
      if (amount !== 0) {
        processed.deductions_details[code] = { amount };
      }
    });

  // 计算总收入
  Object.values(processed.earnings_details).forEach(item => {
    processed.gross_pay += item.amount;
  });

  // 计算总扣除
  Object.values(processed.deductions_details).forEach(item => {
    processed.total_deductions += item.amount;
  });

  // 计算净收入
  processed.net_pay = processed.gross_pay - processed.total_deductions;

  // 验证并返回结果
  return {
    ...processed,
    __isValid: true,
    __errors: [],
    __rowId: nanoid(),
    __isNew: true
  };
};