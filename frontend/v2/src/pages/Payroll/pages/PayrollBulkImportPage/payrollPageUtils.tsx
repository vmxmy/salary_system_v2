import React from 'react'; // Added for JSX types if needed by render funcs
import { isEarningComponentType, isDeductionComponentType } from '../../../../utils/payrollUtils';
import type { PayrollComponentDefinition, ValidatedPayrollEntryData } from '../../types/payrollTypes'; // Updated import path
import type { TFunction } from 'i18next';

export const getComponentName = (
  key: string,
  type: 'earnings' | 'deductions',
  componentDefinitions: PayrollComponentDefinition[]
): string => {
  const filteredComponents = componentDefinitions.filter(comp => {
    if (type === 'earnings') {
      return (isEarningComponentType(comp.type) || comp.type === 'STAT') && comp.code === key;
    } else {
      return isDeductionComponentType(comp.type) && comp.code === key;
    }
  });

  if (filteredComponents.length > 0) {
    return filteredComponents[0].name;
  }
  return key;
};

export const formatCurrency = (value: any): string => {
  if (value == null || value === '') return '-';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? String(value) : `¥${num.toFixed(2)}`;
};

export const generateDynamicColumns = (
  data: ValidatedPayrollEntryData[],
  t: TFunction,
  componentDefinitions: PayrollComponentDefinition[],
  renderValidationErrorsFunc: (errors?: string[], record?: any) => React.ReactNode // 更新函数签名，支持传递记录数据
) => {
  if (!data || data.length === 0) return [];

  const baseColumns = [
    { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
    { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
    { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
    { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
  ];

  const earningsFields = new Set<string>();
  const deductionsFields = new Set<string>();
  
  data.forEach(record => {
    if (record.earnings_details) {
      Object.keys(record.earnings_details).forEach(key => earningsFields.add(key));
    }
    if (record.deductions_details) {
      Object.keys(record.deductions_details).forEach(key => deductionsFields.add(key));
    }
  });

  const earningsColumns = Array.from(earningsFields).map(field => ({
    title: getComponentName(field, 'earnings', componentDefinitions), // Use getComponentName from this file
    dataIndex: ['earnings_details', field, 'amount'],
    key: `earnings_${field}`,
    width: 120,
    render: (text: any) => formatCurrency(text) // Use formatCurrency from this file
  }));

  const deductionsColumns = Array.from(deductionsFields).map(field => ({
    title: getComponentName(field, 'deductions', componentDefinitions), // Use getComponentName from this file
    dataIndex: ['deductions_details', field, 'amount'],
    key: `deductions_${field}`,
    width: 120,
    render: (text: any) => formatCurrency(text) // Use formatCurrency from this file
  }));

  const summaryColumns = [
    { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) },
    { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) },
    { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) },
  ];

  const otherColumns = [
    { title: t('batch_import.table_header.status'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
    { title: t('batch_import.table_header.remarks'), dataIndex: 'remarks', key: 'remarks', width: 200, render: (text: any) => text || '-' },
    {
      title: t('batch_import.table_header.validation_errors'),
      dataIndex: 'validationErrors',
      key: 'validationErrors',
      width: 200,
      render: (errors: string[], record: any) => renderValidationErrorsFunc(errors, record) // 传递记录数据
    }
  ];

  return [...baseColumns, ...earningsColumns, ...deductionsColumns, ...summaryColumns, ...otherColumns];
};

// renderResultContent might also be moved here if it's a pure utility rendering function