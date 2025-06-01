import React, { useEffect, useState } from 'react';
import * as payrollApi from '../services/payrollApi';
import type { PayrollPeriod } from '../types/payrollTypes';
import {
  ENABLE_PRODUCTION_RESTRICTIONS,
  PAYROLL_PERIOD_STATUS,
} from '../pages/PayrollBulkImportPage/constants';

import type { TFunction } from 'i18next';

// 获取薪资周期数据统计的函数 - 使用PayrollRun的total_employees字段
export const fetchPeriodDataStats = async (
  periodIds: number[], 
  setPeriodDataStats: React.Dispatch<React.SetStateAction<Record<number, { count: number; loading: boolean }>>>
) => {
  const initialStats: Record<number, { count: number; loading: boolean }> = {};
  periodIds.forEach(id => {
    initialStats[id] = { count: 0, loading: true };
  });
  setPeriodDataStats(initialStats);
  
  const statsPromises = periodIds.map(async (periodId) => {
    try {
      const runsResponse = await payrollApi.getPayrollRuns({
        period_id: periodId,
        size: 100
      });
      
      let totalCount = 0;
      if (runsResponse.data && runsResponse.data.length > 0) {
        totalCount = runsResponse.data.reduce((sum, run) => {
          return sum + (run.total_employees || 0);
        }, 0);
      }
      return { periodId, count: totalCount };
    } catch (error) {
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
        fetchPeriodDataStats(periodIds, setPeriodDataStats);
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