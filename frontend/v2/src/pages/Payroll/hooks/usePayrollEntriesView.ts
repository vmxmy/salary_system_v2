import { useState, useEffect, useCallback } from 'react';
import { payrollViewsApi } from '../services/payrollViewsApi';
import type { PayrollEntryDetailedView } from '../services/payrollViewsApi';
import type { TFunction } from 'i18next';

interface UsePayrollEntriesViewOptions {
  period_id?: number;
  employee_id?: number;
  department_id?: number;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

interface UsePayrollEntriesViewResult {
  entries: PayrollEntryDetailedView[];
  loading: boolean;
  error: string | null;
  selectedEntryId: number | null;
  setSelectedEntryId: (id: number | null) => void;
  fetchEntries: () => Promise<void>;
  refreshEntries: () => Promise<void>;
  getEntryById: (id: number) => PayrollEntryDetailedView | undefined;
  getEntriesByPeriod: (periodId: number) => PayrollEntryDetailedView[];
  getEntriesByEmployee: (employeeId: number) => PayrollEntryDetailedView[];
  getEntriesByDepartment: (departmentName: string) => PayrollEntryDetailedView[];
  getTotalStats: () => {
    totalEntries: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    averageGrossPay: number;
    averageNetPay: number;
    totalBasicSalary: number;
    totalPerformanceSalary: number;
    totalAllowance: number;
    totalIncomeTax: number;
    totalSocialInsurance: number;
  };
  getEarningsBreakdown: () => Record<string, number>;
  getDeductionsBreakdown: () => Record<string, number>;
}

/**
 * 使用视图API的薪资条目Hook
 * 提供展开的JSONB字段和详细的汇总信息
 */
export const usePayrollEntriesView = (
  t: TFunction,
  appMessage: any,
  options: UsePayrollEntriesViewOptions = {}
): UsePayrollEntriesViewResult => {
  const {
    period_id,
    employee_id,
    department_id,
    limit = 100,
    offset = 0,
    autoFetch = true
  } = options;

  const [entries, setEntries] = useState<PayrollEntryDetailedView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  /**
   * 获取薪资条目列表
   */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching payroll entries using view API...');
      
      const entriesData = await payrollViewsApi.getPayrollEntriesDetailed({
        period_id,
        employee_id,
        department_id,
        limit,
        offset
      });
      
      // 按更新时间降序排序
      const sortedEntries = entriesData.sort((a, b) => {
        const dateA = new Date(a.updated_at || 0).getTime();
        const dateB = new Date(b.updated_at || 0).getTime();
        return dateB - dateA;
      });
      
      setEntries(sortedEntries);
      
      // 如果没有选中的条目且有数据，自动选择第一个
      if (!selectedEntryId && sortedEntries.length > 0) {
        setSelectedEntryId(sortedEntries[0].id);
      }
      
      console.log(`✅ Successfully fetched ${sortedEntries.length} payroll entries`);
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail?.error?.message || 
                          err?.message || 
                          t('entries_page.error_fetch_entries');
      
      console.error('❌ Error fetching payroll entries:', err);
      setError(errorMessage);
      appMessage.error(errorMessage);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period_id, employee_id, department_id, limit, offset, selectedEntryId, t, appMessage]);

  /**
   * 刷新数据
   */
  const refreshEntries = useCallback(async () => {
    await fetchEntries();
  }, [fetchEntries]);

  /**
   * 根据ID获取条目
   */
  const getEntryById = useCallback((id: number): PayrollEntryDetailedView | undefined => {
    return entries.find(entry => entry.id === id);
  }, [entries]);

  /**
   * 根据周期ID获取条目
   */
  const getEntriesByPeriod = useCallback((periodId: number): PayrollEntryDetailedView[] => {
    return entries.filter(entry => entry.payroll_period_id === periodId);
  }, [entries]);

  /**
   * 根据员工ID获取条目
   */
  const getEntriesByEmployee = useCallback((employeeId: number): PayrollEntryDetailedView[] => {
    return entries.filter(entry => entry.employee_id === employeeId);
  }, [entries]);

  /**
   * 根据部门名称获取条目
   */
  const getEntriesByDepartment = useCallback((departmentName: string): PayrollEntryDetailedView[] => {
    return entries.filter(entry => entry.department_name === departmentName);
  }, [entries]);

  /**
   * 获取总体统计信息
   */
  const getTotalStats = useCallback(() => {
    const totalEntries = entries.length;
    const totalGrossPay = entries.reduce((sum, e) => sum + e.gross_pay, 0);
    const totalNetPay = entries.reduce((sum, e) => sum + e.net_pay, 0);
    const totalDeductions = entries.reduce((sum, e) => sum + e.total_deductions, 0);
    
    const averageGrossPay = totalEntries > 0 ? totalGrossPay / totalEntries : 0;
    const averageNetPay = totalEntries > 0 ? totalNetPay / totalEntries : 0;
    
    // 收入明细汇总
    const totalBasicSalary = entries.reduce((sum, e) => sum + (e.basic_salary || 0), 0);
    const totalPerformanceSalary = entries.reduce((sum, e) => sum + (e.performance_salary || 0), 0);
    const totalAllowance = entries.reduce((sum, e) => sum + (e.allowance || 0), 0);
    
    // 扣除明细汇总
    const totalIncomeTax = entries.reduce((sum, e) => sum + (e.personal_income_tax || 0), 0);
    const totalSocialInsurance = entries.reduce((sum, e) => sum + (e.social_insurance_total || 0), 0);

    return {
      totalEntries,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      averageGrossPay,
      averageNetPay,
      totalBasicSalary,
      totalPerformanceSalary,
      totalAllowance,
      totalIncomeTax,
      totalSocialInsurance
    };
  }, [entries]);

  /**
   * 获取收入明细分解
   */
  const getEarningsBreakdown = useCallback((): Record<string, number> => {
    return {
      '基本工资': entries.reduce((sum, e) => sum + (e.basic_salary || 0), 0),
      '绩效工资': entries.reduce((sum, e) => sum + (e.performance_salary || 0), 0),
      '岗位工资': entries.reduce((sum, e) => sum + (e.position_salary || 0), 0),
      '级别工资': entries.reduce((sum, e) => sum + (e.grade_salary || 0), 0),
      '综合津补贴': entries.reduce((sum, e) => sum + (e.allowance || 0), 0),
      '补贴': entries.reduce((sum, e) => sum + (e.subsidy || 0), 0),
      '基础绩效': entries.reduce((sum, e) => sum + (e.basic_performance_salary || 0), 0),
      '交通补贴': entries.reduce((sum, e) => sum + (e.traffic_allowance || 0), 0),
      '独生子女父母奖励费': entries.reduce((sum, e) => sum + (e.only_child_bonus || 0), 0),
      '乡镇工作补贴': entries.reduce((sum, e) => sum + (e.township_allowance || 0), 0),
      '岗位津贴': entries.reduce((sum, e) => sum + (e.position_allowance || 0), 0),
      // 注释掉不存在的字段
      // '公务员规范津补贴': entries.reduce((sum, e) => sum + (e.civil_servant_allowance || 0), 0),
      // '补发工资': entries.reduce((sum, e) => sum + (e.back_pay || 0), 0),
    };
  }, [entries]);

  /**
   * 获取扣除明细分解
   */
  const getDeductionsBreakdown = useCallback((): Record<string, number> => {
    return {
      '个人所得税': entries.reduce((sum, e) => sum + (e.personal_income_tax || 0), 0),
      '社会保险个人': entries.reduce((sum, e) => sum + (e.social_insurance_personal || 0), 0),
      '住房公积金个人': entries.reduce((sum, e) => sum + (e.housing_fund_personal || 0), 0),
      '工会费': entries.reduce((sum, e) => sum + (e.union_fee || 0), 0),
      '其他扣除': entries.reduce((sum, e) => sum + (e.other_deductions || 0), 0),
      // 注释掉不存在的字段
      // '养老保险个人': entries.reduce((sum, e) => sum + (e.pension_personal || 0), 0),
      // '医疗保险个人': entries.reduce((sum, e) => sum + (e.medical_personal || 0), 0),
      // '失业保险个人': entries.reduce((sum, e) => sum + (e.unemployment_personal || 0), 0),
      // '职业年金个人': entries.reduce((sum, e) => sum + (e.annuity_personal || 0), 0),
      // '调整扣款': entries.reduce((sum, e) => sum + (e.adjustment_deduction || 0), 0),
      // '社保调整': entries.reduce((sum, e) => sum + (e.social_security_adjustment || 0), 0),
    };
  }, [entries]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchEntries();
    }
  }, [autoFetch, fetchEntries]);

  return {
    entries,
    loading,
    error,
    selectedEntryId,
    setSelectedEntryId,
    fetchEntries,
    refreshEntries,
    getEntryById,
    getEntriesByPeriod,
    getEntriesByEmployee,
    getEntriesByDepartment,
    getTotalStats,
    getEarningsBreakdown,
    getDeductionsBreakdown
  };
};

export default usePayrollEntriesView; 