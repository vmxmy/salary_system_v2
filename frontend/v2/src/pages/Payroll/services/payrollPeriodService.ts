import React, { useEffect, useState } from 'react';
import * as payrollApi from '../services/payrollApi';
import type { PayrollPeriod } from '../types/payrollTypes';
import {
  ENABLE_PRODUCTION_RESTRICTIONS,
  PAYROLL_PERIOD_STATUS,
} from '../pages/PayrollBulkImportPage/constants';

import type { TFunction } from 'i18next';

// 获取薪资周期数据统计的函数 - 计算期间内不重复的员工数
export const fetchPeriodDataStats = async (
  periodIds: number[], 
  setPeriodDataStats: React.Dispatch<React.SetStateAction<Record<number, { count: number; loading: boolean }>>>,
  t: TFunction,
  appMessage: any
) => {
  const initialStats: Record<number, { count: number; loading: boolean }> = {};
  periodIds.forEach(id => {
    initialStats[id] = { count: 0, loading: true };
  });
  setPeriodDataStats(initialStats);
  
  const statsPromises = periodIds.map(async (periodId) => {
    try {
      // 获取该期间下的所有 payroll runs
      const runsResponse = await payrollApi.getPayrollRuns({
        period_id: periodId,
        size: 100
      });
      
      let uniqueEmployeeIds = new Set<number>();
      
      if (runsResponse.data && runsResponse.data.length > 0) {
        // 对每个 run，获取其 payroll entries 来统计不重复的员工
        const entriesPromises = runsResponse.data.map(async (run) => {
          try {
            const entriesResponse = await payrollApi.getPayrollEntries({
              payroll_run_id: run.id,
              size: 100 // 获取足够多的条目
            });
            
            if (entriesResponse.data && entriesResponse.data.length > 0) {
              entriesResponse.data.forEach(entry => {
                if (entry.employee_id) {
                  uniqueEmployeeIds.add(entry.employee_id);
                }
              });
            }
          } catch (error: any) {
            let errorMessage = t('common:message.error_fetching_details'); // 默认错误信息
            if (error.response && error.response.status === 422 && error.response.data && error.response.data.detail && error.response.data.detail.error && error.response.data.detail.error.message) {
              errorMessage = error.response.data.detail.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            appMessage.error(errorMessage);
            console.warn(`Failed to fetch entries for run ${run.id}:`, error);
          }
        });
        
        await Promise.all(entriesPromises);
      }
      
      return { periodId, count: uniqueEmployeeIds.size };
    } catch (error) {
      console.warn(`Failed to fetch stats for period ${periodId}:`, error);
      return { periodId, count: 0 };
    }
  });
  
  try {
    const results = await Promise.all(statsPromises);
    const newStats: Record<number, { count: number; loading: boolean }> = {};
    results.forEach(({ periodId, count }) => {
      newStats[periodId] = { count, loading: false };
    });
    setPeriodDataStats(newStats);
  } catch (error) {
    console.error('Failed to fetch period data stats:', error);
    const errorStats: Record<number, { count: number; loading: boolean }> = {};
    periodIds.forEach(id => {
      errorStats[id] = { count: 0, loading: false };
    });
    setPeriodDataStats(errorStats);
  }
};

// 过滤薪资周期的函数（根据环境和业务规则）
export const filterPayrollPeriods = (periods: PayrollPeriod[]): PayrollPeriod[] => {
  if (!ENABLE_PRODUCTION_RESTRICTIONS) {
    return periods;
  }
  
  return periods.filter(period => {
    const statusCode = period.status_lookup?.code;
    return statusCode === PAYROLL_PERIOD_STATUS.ACTIVE;
  });
};

// 检查周期是否允许导入数据
export const isPeriodImportAllowed = (period: PayrollPeriod): boolean => {
  if (!ENABLE_PRODUCTION_RESTRICTIONS) {
    return true;
  }
  
  const statusCode = period.status_lookup?.code;
  return statusCode === PAYROLL_PERIOD_STATUS.ACTIVE;
};

interface UsePayrollPeriodsResult {
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId: number | null;
  setSelectedPeriodId: React.Dispatch<React.SetStateAction<number | null>>;
  loadingPeriods: boolean;
  periodDataStats: Record<number, { count: number; loading: boolean }>;
  fetchPayrollPeriods: () => Promise<void>;
}

export const usePayrollPeriods = (t: TFunction, appMessage: any): UsePayrollPeriodsResult => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(false);
  const [periodDataStats, setPeriodDataStats] = useState<Record<number, { count: number; loading: boolean }>>({});

  const fetchPayrollPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const response = await payrollApi.getPayrollPeriods({
        size: 100,
      });
      
      const sortedPeriods = response.data.sort((a, b) => {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      });
      
      const filteredPeriods = filterPayrollPeriods(sortedPeriods);
      setPayrollPeriods(filteredPeriods);

      if (filteredPeriods.length > 0) {
        const periodIds = filteredPeriods.map(p => p.id);
        fetchPeriodDataStats(periodIds, setPeriodDataStats, t, appMessage);
      }
      
    } catch (error) {
      appMessage.error(t('periods_page.error_fetch_periods'));
      setPayrollPeriods([]);
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    fetchPayrollPeriods();
  }, [appMessage, t]);

  return {
    payrollPeriods,
    selectedPeriodId,
    setSelectedPeriodId,
    loadingPeriods,
    periodDataStats,
    fetchPayrollPeriods
  };
}; 