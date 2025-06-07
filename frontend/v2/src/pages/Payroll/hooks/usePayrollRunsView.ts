import { useState, useEffect, useCallback } from 'react';
import { payrollViewsApi, PayrollRunDetailView } from '../services/payrollViewsApi';
import type { TFunction } from 'i18next';

interface UsePayrollRunsViewOptions {
  period_id?: number;
  status_id?: number;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

interface UsePayrollRunsViewResult {
  runs: PayrollRunDetailView[];
  loading: boolean;
  error: string | null;
  selectedRunId: number | null;
  setSelectedRunId: (id: number | null) => void;
  fetchRuns: () => Promise<void>;
  refreshRuns: () => Promise<void>;
  getRunById: (id: number) => PayrollRunDetailView | undefined;
  getRunsByPeriod: (periodId: number) => PayrollRunDetailView[];
  getRunsByStatus: (statusName: string) => PayrollRunDetailView[];
  getTotalStats: () => {
    totalRuns: number;
    totalEntries: number;
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    averageGrossPay: number;
    averageNetPay: number;
  };
}

/**
 * 使用视图API的薪资运行Hook
 * 提供更丰富的数据和更好的性能
 */
export const usePayrollRunsView = (
  t: TFunction,
  appMessage: any,
  options: UsePayrollRunsViewOptions = {}
): UsePayrollRunsViewResult => {
  const {
    period_id,
    status_id,
    limit = 100,
    offset = 0,
    autoFetch = true
  } = options;

  const [runs, setRuns] = useState<PayrollRunDetailView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  /**
   * 获取薪资运行列表
   */
  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching payroll runs using view API...');
      
      const runsData = await payrollViewsApi.getPayrollRunsDetail({
        period_id,
        status_id,
        limit,
        offset
      });
      
      // 按发起时间降序排序
      const sortedRuns = runsData.sort((a, b) => {
        const dateA = new Date(a.run_date || a.created_at || 0).getTime();
        const dateB = new Date(b.run_date || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      setRuns(sortedRuns);
      
      // 如果没有选中的运行且有数据，自动选择第一个
      if (!selectedRunId && sortedRuns.length > 0) {
        setSelectedRunId(sortedRuns[0].id);
      }
      
      console.log(`✅ Successfully fetched ${sortedRuns.length} payroll runs`);
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail?.error?.message || 
                          err?.message || 
                          t('runs_page.error_fetch_runs');
      
      console.error('❌ Error fetching payroll runs:', err);
      setError(errorMessage);
      appMessage.error(errorMessage);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [period_id, status_id, limit, offset, selectedRunId, t, appMessage]);

  /**
   * 刷新数据
   */
  const refreshRuns = useCallback(async () => {
    await fetchRuns();
  }, [fetchRuns]);

  /**
   * 根据ID获取运行
   */
  const getRunById = useCallback((id: number): PayrollRunDetailView | undefined => {
    return runs.find(run => run.id === id);
  }, [runs]);

  /**
   * 根据周期ID获取运行
   */
  const getRunsByPeriod = useCallback((periodId: number): PayrollRunDetailView[] => {
    return runs.filter(run => run.payroll_period_id === periodId);
  }, [runs]);

  /**
   * 根据状态获取运行
   */
  const getRunsByStatus = useCallback((statusName: string): PayrollRunDetailView[] => {
    return runs.filter(run => run.status_name === statusName);
  }, [runs]);

  /**
   * 获取总体统计信息
   */
  const getTotalStats = useCallback(() => {
    const totalRuns = runs.length;
    const totalEntries = runs.reduce((sum, r) => sum + (r.total_entries || 0), 0);
    const totalGrossPay = runs.reduce((sum, r) => sum + (r.total_gross_pay || 0), 0);
    const totalNetPay = runs.reduce((sum, r) => sum + (r.total_net_pay || 0), 0);
    const totalDeductions = runs.reduce((sum, r) => sum + (r.total_deductions || 0), 0);
    
    const averageGrossPay = totalRuns > 0 ? totalGrossPay / totalRuns : 0;
    const averageNetPay = totalRuns > 0 ? totalNetPay / totalRuns : 0;

    return {
      totalRuns,
      totalEntries,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      averageGrossPay,
      averageNetPay
    };
  }, [runs]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchRuns();
    }
  }, [autoFetch, fetchRuns]);

  return {
    runs,
    loading,
    error,
    selectedRunId,
    setSelectedRunId,
    fetchRuns,
    refreshRuns,
    getRunById,
    getRunsByPeriod,
    getRunsByStatus,
    getTotalStats
  };
};

export default usePayrollRunsView; 