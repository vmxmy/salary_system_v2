import { useState, useEffect, useCallback } from 'react';
import { payrollViewsApi, PayrollPeriodDetailView } from '../services/payrollViewsApi';
import type { TFunction } from 'i18next';

interface UsePayrollPeriodsViewOptions {
  is_active?: boolean;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

interface UsePayrollPeriodsViewResult {
  periods: PayrollPeriodDetailView[];
  loading: boolean;
  error: string | null;
  selectedPeriodId: number | null;
  setSelectedPeriodId: (id: number | null) => void;
  fetchPeriods: () => Promise<void>;
  refreshPeriods: () => Promise<void>;
  getPeriodById: (id: number) => PayrollPeriodDetailView | undefined;
  getActivePeriods: () => PayrollPeriodDetailView[];
  getTotalStats: () => {
    totalPeriods: number;
    activePeriods: number;
    totalRuns: number;
    totalEntries: number;
  };
}

/**
 * 使用视图API的薪资周期Hook
 * 提供更丰富的数据和更好的性能
 */
export const usePayrollPeriodsView = (
  t: TFunction,
  appMessage: any,
  options: UsePayrollPeriodsViewOptions = {}
): UsePayrollPeriodsViewResult => {
  const {
    is_active,
    limit = 100,
    offset = 0,
    autoFetch = true
  } = options;

  const [periods, setPeriods] = useState<PayrollPeriodDetailView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  /**
   * 获取薪资周期列表
   */
  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching payroll periods using view API...');
      
      const periodsData = await payrollViewsApi.getPayrollPeriodsDetail({
        is_active,
        limit,
        offset
      });
      
      // 按开始日期降序排序
      const sortedPeriods = periodsData.sort((a, b) => {
        const dateA = new Date(a.start_date || '1970-01-01').getTime();
        const dateB = new Date(b.start_date || '1970-01-01').getTime();
        return dateB - dateA;
      });
      
      setPeriods(sortedPeriods);
      
      // 如果没有选中的周期且有数据，自动选择第一个活跃的周期
      if (!selectedPeriodId && sortedPeriods.length > 0) {
        const firstActivePeriod = sortedPeriods.find(p => p.status_lookup_value_id === 1); // 假设1是活跃状态
        if (firstActivePeriod) {
          setSelectedPeriodId(firstActivePeriod.id);
        }
      }
      
      console.log(`✅ Successfully fetched ${sortedPeriods.length} payroll periods`);
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail?.error?.message || 
                          err?.message || 
                          t('periods_page.error_fetch_periods');
      
      console.error('❌ Error fetching payroll periods:', err);
      setError(errorMessage);
      appMessage.error(errorMessage);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [is_active, limit, offset, selectedPeriodId, t, appMessage]);

  /**
   * 刷新数据
   */
  const refreshPeriods = useCallback(async () => {
    await fetchPeriods();
  }, [fetchPeriods]);

  /**
   * 根据ID获取周期
   */
  const getPeriodById = useCallback((id: number): PayrollPeriodDetailView | undefined => {
    return periods.find(period => period.id === id);
  }, [periods]);

  /**
   * 获取活跃的周期
   */
  const getActivePeriods = useCallback((): PayrollPeriodDetailView[] => {
    return periods.filter(period => period.status_lookup_value_id === 1); // 假设1是活跃状态
  }, [periods]);

  /**
   * 获取总体统计信息
   */
  const getTotalStats = useCallback(() => {
    const totalPeriods = periods.length;
    const activePeriods = periods.filter(p => p.status_lookup_value_id === 1).length;
    const totalRuns = periods.reduce((sum, p) => sum + (p.total_runs || 0), 0);
    const totalEntries = periods.reduce((sum, p) => sum + (p.total_entries || 0), 0);

    return {
      totalPeriods,
      activePeriods,
      totalRuns,
      totalEntries
    };
  }, [periods]);

  // 自动获取数据
  useEffect(() => {
    if (autoFetch) {
      fetchPeriods();
    }
  }, [autoFetch, fetchPeriods]);

  return {
    periods,
    loading,
    error,
    selectedPeriodId,
    setSelectedPeriodId,
    fetchPeriods,
    refreshPeriods,
    getPeriodById,
    getActivePeriods,
    getTotalStats
  };
};

export default usePayrollPeriodsView; 