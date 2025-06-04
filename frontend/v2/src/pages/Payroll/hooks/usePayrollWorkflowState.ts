import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';

import type { PayrollPeriod, PayrollRun } from '../types/payrollTypes';
import type { PayrollSummaryStats, PayrollCalculationProgress } from '../services/payrollWorkflowApi';
import { PayrollWorkflowUtils, PayrollWorkflowAsyncUtils } from '../utils/payrollWorkflowUtils';

export interface PayrollWorkflowState {
  // 基础状态
  selectedCycleForStep1: string | null;
  selectedPeriodId: number | null;
  hasDataForCycleStep1: boolean;
  isLoadingDataStep1: boolean;
  
  // 真实数据状态
  availablePeriods: PayrollPeriod[];
  currentPayrollRun: PayrollRun | null;
  calculationProgress: PayrollCalculationProgress | null;
  calculationSummary: PayrollSummaryStats | null;
  isLoadingPeriods: boolean;
  calculationTaskId: string | null;
}

export interface PayrollWorkflowStateActions {
  // 状态更新函数
  setSelectedPeriodId: (periodId: number | null) => void;
  setHasDataForCycleStep1: (hasData: boolean) => void;
  setIsLoadingDataStep1: (loading: boolean) => void;
  setAvailablePeriods: (periods: PayrollPeriod[]) => void;
  setCurrentPayrollRun: (payrollRun: PayrollRun | null) => void;
  setCalculationProgress: (progress: PayrollCalculationProgress | null) => void;
  setCalculationSummary: (summary: PayrollSummaryStats | null) => void;
  setIsLoadingPeriods: (loading: boolean) => void;
  setCalculationTaskId: (taskId: string | null) => void;
  
  // 复合操作函数
  updatePeriodSelection: (periodId: number | null) => void;
  resetCalculationState: () => void;
  resetWorkflowState: () => void;
}

export interface UsePayrollWorkflowStateReturn extends PayrollWorkflowState, PayrollWorkflowStateActions {}

/**
 * 薪资工作流状态管理钩子
 * 专注于状态管理，不包含业务逻辑
 */
export const usePayrollWorkflowState = (): UsePayrollWorkflowStateReturn => {
  const { t } = useTranslation(['payroll', 'common']);

  // 基础状态管理
  const [selectedCycleForStep1, setSelectedCycleForStep1] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodIdState] = useState<number | null>(null);
  const [hasDataForCycleStep1, setHasDataForCycleStep1] = useState<boolean>(false);
  const [isLoadingDataStep1, setIsLoadingDataStep1] = useState<boolean>(false);
  
  // 真实数据状态
  const [availablePeriods, setAvailablePeriods] = useState<PayrollPeriod[]>([]);
  const [currentPayrollRun, setCurrentPayrollRun] = useState<PayrollRun | null>(null);
  const [calculationProgress, setCalculationProgress] = useState<PayrollCalculationProgress | null>(null);
  const [calculationSummary, setCalculationSummary] = useState<PayrollSummaryStats | null>(null);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState<boolean>(false);
  const [calculationTaskId, setCalculationTaskId] = useState<string | null>(null);

  // 组件挂载时加载薪资周期列表
  useEffect(() => {
    loadAvailablePeriods();
  }, []);

  // 轮询计算进度
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (calculationTaskId) {
      intervalId = setInterval(async () => {
        try {
          const progress = await PayrollWorkflowAsyncUtils.getCalculationProgress(calculationTaskId);
          setCalculationProgress(progress);
          
          if (PayrollWorkflowUtils.isCalculationFinished(progress.status)) {
            clearInterval(intervalId);
            setCalculationTaskId(null);
            
            if (PayrollWorkflowUtils.isCalculationSuccessful(progress.status)) {
              message.success(t('payroll:workflow.messages.operation_success', '计算完成！'));
              // 加载计算结果汇总
              if (currentPayrollRun) {
                loadCalculationSummary(currentPayrollRun.id);
              }
            } else {
              message.error(t('payroll:workflow.messages.operation_failed', '计算失败：') + progress.error_message);
            }
          }
        } catch (error) {
          console.error('获取计算进度失败:', error);
          clearInterval(intervalId);
          setCalculationTaskId(null);
        }
      }, 2000); // 每2秒查询一次
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [calculationTaskId, currentPayrollRun, t]);

  /**
   * 加载可用的薪资周期列表
   */
  const loadAvailablePeriods = async () => {
    setIsLoadingPeriods(true);
    try {
      const periods = await PayrollWorkflowAsyncUtils.loadPayrollPeriods();
      setAvailablePeriods(periods);
    } catch (error) {
      message.error(t('common:error.fetch_failed', '获取数据失败'));
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  /**
   * 加载计算结果汇总
   */
  const loadCalculationSummary = async (payrollRunId: number) => {
    try {
      const summary = await PayrollWorkflowAsyncUtils.getCalculationSummary(payrollRunId);
      setCalculationSummary(summary);
    } catch (error) {
      message.error(t('common:error.fetch_failed', '获取计算汇总失败'));
    }
  };

  /**
   * 设置选中的周期ID并更新相关状态
   */
  const setSelectedPeriodId = (periodId: number | null) => {
    setSelectedPeriodIdState(periodId);
    
    if (periodId) {
      const selectedPeriod = PayrollWorkflowUtils.findPeriodById(availablePeriods, periodId);
      const periodName = PayrollWorkflowUtils.formatPeriodName(selectedPeriod, periodId);
      setSelectedCycleForStep1(periodName);
    } else {
      setSelectedCycleForStep1(null);
      setHasDataForCycleStep1(false);
    }
  };

  /**
   * 更新周期选择（复合操作）
   */
  const updatePeriodSelection = (periodId: number | null) => {
    setSelectedPeriodId(periodId);
    if (!periodId) {
      setHasDataForCycleStep1(false);
    }
  };

  /**
   * 重置计算相关状态
   */
  const resetCalculationState = () => {
    setCalculationProgress(null);
    setCalculationSummary(null);
    setCalculationTaskId(null);
    setCurrentPayrollRun(null);
  };

  /**
   * 重置整个工作流状态
   */
  const resetWorkflowState = () => {
    setSelectedPeriodId(null);
    setHasDataForCycleStep1(false);
    setIsLoadingDataStep1(false);
    resetCalculationState();
  };

  return {
    // 状态
    selectedCycleForStep1,
    selectedPeriodId,
    hasDataForCycleStep1,
    isLoadingDataStep1,
    availablePeriods,
    currentPayrollRun,
    calculationProgress,
    calculationSummary,
    isLoadingPeriods,
    calculationTaskId,
    
    // 状态更新函数
    setSelectedPeriodId,
    setHasDataForCycleStep1,
    setIsLoadingDataStep1,
    setAvailablePeriods,
    setCurrentPayrollRun,
    setCalculationProgress,
    setCalculationSummary,
    setIsLoadingPeriods,
    setCalculationTaskId,
    
    // 复合操作函数
    updatePeriodSelection,
    resetCalculationState,
    resetWorkflowState,
  };
}; 