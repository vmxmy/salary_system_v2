import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PayrollComponentDefinition } from '../../types/payrollTypes';

// 生成薪资API字段映射
export const usePayrollApiFields = (componentDefinitions: PayrollComponentDefinition[], t: any) => {
  return useMemo(() => {
    const baseFields = [
      { key: 'employee_code', label: t('batch_import.fields.employee_code'), required: false },
      { key: 'employee_full_name', label: t('batch_import.fields.employee_full_name'), required: true },
      { key: 'id_number', label: t('batch_import.fields.id_number'), required: true },
      { key: 'gross_pay', label: t('batch_import.fields.gross_pay'), required: true },
      { key: 'total_deductions', label: t('batch_import.fields.total_deductions'), required: true },
      { key: 'net_pay', label: t('batch_import.fields.net_pay'), required: true },
      { key: 'remarks', label: t('batch_import.fields.remarks'), required: false },
    ];
    
    const earningFields = componentDefinitions
      .filter(comp => comp.type === 'EARNING' || comp.type === 'STAT')
      .map(comp => ({
        key: `earnings_details.${comp.code}.amount`,
        label: comp.name + (comp.type === 'STAT' ? {t('payroll:auto____2028e7')} : ''),
        required: false
      }));
    
    const deductionFields = componentDefinitions
      .filter(comp => comp.type === 'DEDUCTION')
      .map(comp => ({
        key: `deductions_details.${comp.code}.amount`,
        label: comp.name,
        required: false
      }));

    return [...baseFields, ...earningFields, ...deductionFields];
  }, [componentDefinitions, t]);
};

// 生成字段映射规则
export const usePayrollMappingRules = (componentDefinitions: PayrollComponentDefinition[], t: any) => {
  return useMemo(() => {
    const mappingRules: Record<string, string> = {
      // 基础字段映射
      [t('batch_import.mapping.serial_number')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.personnel_identity')]: 'raw_personnel_identity',
      [t('batch_import.mapping.personnel_level')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.salary_unified')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.fiscal_support')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.department')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.department_name')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.personnel_number')]: 'employee_code',
      [t('batch_import.mapping.employee_id')]: 'employee_code',
      [t('batch_import.mapping.employee_number')]: 'employee_code',
      [t('batch_import.mapping.work_number')]: 'employee_code',
      [t('batch_import.mapping.personnel_name')]: 'employee_full_name',
      [t('batch_import.mapping.name')]: 'employee_full_name',
      [t('batch_import.mapping.employee_name')]: 'employee_full_name',
      [t('batch_import.mapping.id_card')]: 'id_number',
      [t('batch_import.mapping.id_number')]: 'id_number',
      [t('batch_import.mapping.id_card_number')]: 'id_number',
      [t('batch_import.mapping.gross_salary')]: 'gross_pay',
      [t('batch_import.mapping.total_income')]: 'gross_pay',
      [t('batch_import.mapping.salary_total')]: 'gross_pay',
      [t('batch_import.mapping.total_earnings')]: 'gross_pay',
      [t('batch_import.mapping.gross_total')]: 'gross_pay',
      [t('batch_import.mapping.net_salary')]: 'net_pay',
      [t('batch_import.mapping.net_pay')]: 'net_pay',
      [t('batch_import.mapping.actual_amount')]: 'net_pay',
      [t('batch_import.mapping.net_total')]: 'net_pay',
      [t('batch_import.mapping.deduction_total')]: 'total_deductions',
      [t('batch_import.mapping.total_deductions')]: 'total_deductions',
      [t('batch_import.mapping.deduction_amount')]: 'total_deductions',
      [t('batch_import.mapping.total_deduction_amount')]: 'total_deductions',
      [t('batch_import.mapping.should_deduct_total')]: 'total_deductions',
      [t('batch_import.mapping.remarks')]: 'remarks',
      [t('batch_import.mapping.description')]: 'remarks',
    };
    
    // 动态添加收入项映射规则
    componentDefinitions
      .filter(comp => comp.type === 'EARNING' || comp.type === 'STAT')
      .forEach(comp => {
        mappingRules[comp.name] = `earnings_details.${comp.code}.amount`;
      });
    
    // 动态添加扣除项映射规则
    componentDefinitions
      .filter(comp => comp.type === 'DEDUCTION')
      .forEach(comp => {
        mappingRules[comp.name] = `deductions_details.${comp.code}.amount`;
      });
    
    // 添加容错映射规则
    Object.keys(mappingRules).forEach(key => {
      const trimmedKey = key.replace(/\s+/g, '');
      if (trimmedKey !== key) {
        mappingRules[trimmedKey] = mappingRules[key];
      }
      const noSpaceKey = key.replace(/\s/g, '');
      if (noSpaceKey !== key && noSpaceKey !== trimmedKey) {
        mappingRules[noSpaceKey] = mappingRules[key];
      }
    });
    
    return mappingRules;
  }, [componentDefinitions, t]);
};

// 获取组件名称
export const getComponentName = (
  componentDefinitions: PayrollComponentDefinition[], 
  key: string, 
  type: 'earnings' | 'deductions'
): string => {
  const filteredComponents = componentDefinitions.filter(comp => {
    if (type === 'earnings') {
      return (comp.type === 'EARNING' || comp.type === 'STAT') && comp.code === key;
    } else {
      return comp.type === 'DEDUCTION' && comp.code === key;
    }
  });
  
  return filteredComponents[0]?.name || key;
};