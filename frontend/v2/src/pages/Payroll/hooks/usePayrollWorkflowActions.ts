import { message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { 
  PayrollWorkflowUtils, 
  PayrollWorkflowAsyncUtils, 
  PayrollWorkflowDialogUtils 
} from '../utils/payrollWorkflowUtils';
import type { UsePayrollWorkflowStateReturn } from './usePayrollWorkflowState';

export interface UsePayrollWorkflowActionsReturn {
  // 数据操作函数
  checkDataForCycleStep1: (periodId: number | null) => Promise<void>;
  handleCopyLastMonthDataStep1: () => Promise<void>;
  handleNavigateToBulkImportStep1: () => void;
  
  // 计算操作函数
  handleStartCalculation: (calculationModules: string[]) => Promise<boolean>;
  
  // 导出操作函数
  handleExportReport: (reportType: 'detail' | 'summary' | 'bank') => Promise<void>;
}

/**
 * 薪资工作流业务逻辑钩子
 * 专注于业务操作，依赖状态管理钩子
 */
export const usePayrollWorkflowActions = (
  state: UsePayrollWorkflowStateReturn
): UsePayrollWorkflowActionsReturn => {
  const { t } = useTranslation(['payroll', 'common']);
  const navigate = useNavigate();

  /**
   * 检查薪资周期数据
   */
  const checkDataForCycleStep1 = async (periodId: number | null) => {
    if (!periodId) {
      state.updatePeriodSelection(null);
      return;
    }

    state.updatePeriodSelection(periodId);
    state.setIsLoadingDataStep1(true);
    
    message.loading({ 
      content: t('payroll:workflow.steps.data_review.form.payroll_period', '正在检查周期数据...'), 
      key: 'checkData' 
    });

    try {
      const dataCheck = await PayrollWorkflowAsyncUtils.checkPeriodData(periodId);
      state.setHasDataForCycleStep1(dataCheck.hasData);
      message.destroy('checkData');
      
      PayrollWorkflowUtils.showDataCheckResult(dataCheck.hasData, dataCheck.entryCount, t);
    } catch (error) {
      console.error('检查薪资周期数据失败:', error);
      message.destroy('checkData');
      message.error(t('common:error.operation_failed', '检查数据失败'));
      state.setHasDataForCycleStep1(false);
    } finally {
      state.setIsLoadingDataStep1(false);
    }
  };

  /**
   * 复制上月数据
   */
  const handleCopyLastMonthDataStep1 = async () => {
    if (!PayrollWorkflowUtils.validatePeriodSelection(state.selectedPeriodId, t)) {
      return;
    }

    return new Promise<void>((resolve) => {
      const dialogConfig = PayrollWorkflowDialogUtils.getCopyDataConfirmConfig(t);
      Modal.confirm({
        ...dialogConfig,
        onOk: async () => {
          await performCopyData();
          resolve();
        },
        onCancel: () => resolve(),
      });
    });
  };

  /**
   * 执行复制数据操作
   */
  const performCopyData = async () => {

    state.setIsLoadingDataStep1(true);
    message.loading({ 
      content: t('payroll:workflow.steps.data_review.data_initialization.copy_last_month', '正在复制上月数据...'), 
      key: 'copyData' 
    });

    try {
      const result = await PayrollWorkflowAsyncUtils.copyLastMonthData(state.selectedPeriodId!);
      message.destroy('copyData');
      
      PayrollWorkflowUtils.showCopyDataResult(result.success, result.entries_created || 0, result.message, t);
      
      if (result.success) {
        state.setHasDataForCycleStep1(true);
      }
    } catch (error) {
      console.error('复制上月数据失败:', error);
      message.destroy('copyData');
      message.error(t('payroll:workflow.steps.data_review.data_initialization.copy_failed', '复制数据失败'));
    } finally {
      state.setIsLoadingDataStep1(false);
    }
  };

  /**
   * 跳转到批量导入页面
   */
  const handleNavigateToBulkImportStep1 = () => {
    if (!PayrollWorkflowUtils.validatePeriodSelection(state.selectedPeriodId, t)) {
      return;
    }
    
    // 跳转到批量导入页面，并传递周期ID
    navigate('/finance/payroll/bulk-import', { 
      state: { targetPeriodId: state.selectedPeriodId } 
    });
  };

  /**
   * 创建薪资运行批次并开始计算
   */
  const handleStartCalculation = async (calculationModules: string[]): Promise<boolean> => {
    if (!PayrollWorkflowUtils.validatePeriodSelection(state.selectedPeriodId, t)) {
      return false;
    }

    try {
      // 1. 创建薪资运行批次
      const payrollRunResponse = await PayrollWorkflowAsyncUtils.createPayrollRun(
        state.selectedPeriodId!, 
        calculationModules
      );

      const payrollRun = payrollRunResponse.data;
      state.setCurrentPayrollRun(payrollRun);

      // 2. 触发薪资计算
      const calculationResponse = await PayrollWorkflowAsyncUtils.triggerCalculation(
        payrollRun.id, 
        calculationModules
      );

      state.setCalculationTaskId(calculationResponse.task_id);
      message.info(t('payroll:workflow.steps.auto_calculation.calculation_in_progress', '工资计算已启动...'));
      
      return true;
    } catch (error) {
      console.error('启动计算失败:', error);
      message.error(t('payroll:workflow.messages.operation_failed', '启动计算失败'));
      return false;
    }
  };

  /**
   * 导出报表
   */
  const handleExportReport = async (reportType: 'detail' | 'summary' | 'bank') => {
    if (!state.currentPayrollRun) {
      message.error(t('common:error.no_data', '没有可导出的数据'));
      return;
    }

    try {
      const blob = await PayrollWorkflowAsyncUtils.exportPayrollReport(
        state.currentPayrollRun.id, 
        reportType
      );
      
      const filename = PayrollWorkflowUtils.generateExportFilename(
        state.currentPayrollRun.id, 
        reportType
      );
      
      PayrollWorkflowUtils.downloadFile(blob, filename);
      message.success(t('common:success.export', '导出成功'));
    } catch (error) {
      console.error('导出报表失败:', error);
      message.error(t('common:error.export_failed', '导出失败'));
    }
  };

  return {
    checkDataForCycleStep1,
    handleCopyLastMonthDataStep1,
    handleNavigateToBulkImportStep1,
    handleStartCalculation,
    handleExportReport,
  };
}; 