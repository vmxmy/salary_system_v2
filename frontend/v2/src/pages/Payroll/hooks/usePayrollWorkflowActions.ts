import { message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { 
  PayrollWorkflowUtils, 
  PayrollWorkflowAsyncUtils, 
  PayrollWorkflowDialogUtils 
} from '../utils/payrollWorkflowUtils';
import type { UsePayrollWorkflowStateReturn } from './usePayrollWorkflowState';
import { PayrollWorkflowStatusService, WORKFLOW_STEPS } from '../services/payrollWorkflowStatusService';
import { payrollWorkflowApi } from '../services/payrollWorkflowApi';
import apiClient from '../../../api/apiClient';

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
   * 检查薪资周期数据 - 集成工作流状态管理
   */
  const checkDataForCycleStep1 = async (periodId: number | null) => {
    if (!periodId) {
      state.updatePeriodSelection(null);
      return;
    }

    state.updatePeriodSelection(periodId);
    state.setIsLoadingDataStep1(true);
    
    message.loading({ 
      content: '正在检查周期数据和工作流状态...', 
      key: 'checkData' 
    });

    try {
      // 1. 检查薪资数据
      const dataCheck = await PayrollWorkflowAsyncUtils.checkPeriodData(periodId);
      state.setHasDataForCycleStep1(dataCheck.hasData);
      
      // 2. 检查是否存在相关的薪资运行批次
      try {
        // 检查是否存在相关的薪资运行批次 - 暂时使用模拟检查
        const runsResponse = { data: [] as any[] }; // TODO: 实现 getPayrollRunsForPeriod API
        const activeRuns = runsResponse.data.filter((run: any) => run.status_lookup_value_id !== 5); // 排除已取消的
        
        if (activeRuns.length > 0) {
          // 存在活跃的运行批次，加载工作流状态
          const latestRun = activeRuns[activeRuns.length - 1];
          state.setCurrentPayrollRun(latestRun);
          await state.loadWorkflowStatus(latestRun.id);
          
          console.log('🔄 发现现有工作流:', { payrollRunId: latestRun.id, periodId });
        } else {
          // 没有活跃的运行批次
          state.setCurrentPayrollRun(null);
          state.setWorkflowStatus(null);
        }
      } catch (workflowError) {
        console.warn('获取工作流状态失败，但数据检查成功:', workflowError);
      }
      
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
   * 执行复制数据操作 - 集成工作流启动
   */
  const performCopyData = async () => {
    state.setIsLoadingDataStep1(true);
    message.loading({ 
      content: '正在复制上月数据并启动工作流...', 
      key: 'copyData' 
    });

    try {
      // 1. 复制上月数据
      const result = await PayrollWorkflowAsyncUtils.copyLastMonthData(state.selectedPeriodId!);
      
      if (result.success) {
        // 2. 数据复制成功，启动工作流
        try {
          await state.startWorkflow(state.selectedPeriodId!);
          
          // 3. 标记数据审核步骤为进行中
          await state.updateWorkflowStep(WORKFLOW_STEPS.DATA_REVIEW, {
            stepKey: WORKFLOW_STEPS.DATA_REVIEW,
            stepName: '薪资数据审核',
            status: 'in_progress',
            data: {
              data_source: 'copied_from_previous_period',
              entries_created: result.entries_created,
              started_at: new Date().toISOString()
            }
          });
          
          state.setHasDataForCycleStep1(true);
          console.log('✅ 数据复制完成并启动工作流:', { periodId: state.selectedPeriodId, entriesCreated: result.entries_created });
        } catch (workflowError) {
          console.warn('数据复制成功但启动工作流失败:', workflowError);
          state.setHasDataForCycleStep1(true); // 仍然标记有数据
        }
      }
      
      message.destroy('copyData');
      PayrollWorkflowUtils.showCopyDataResult(result.success, result.entries_created || 0, result.message, t);
    } catch (error) {
      console.error('复制上月数据失败:', error);
      message.destroy('copyData');
      message.error('复制数据失败，请重试');
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
   * 开始薪资计算 - 真实API集成
   */
  const handleStartCalculation = async (calculationModules: string[]): Promise<boolean> => {
    if (!PayrollWorkflowUtils.validatePeriodSelection(state.selectedPeriodId, t)) {
      return false;
    }

    // 检查是否存在工作流
    if (!state.currentPayrollRun) {
      message.error('请先启动工作流或检查薪资周期数据');
      return false;
    }

    try {
      console.log('🧮 开始执行薪资计算...', { modules: calculationModules, periodId: state.selectedPeriodId });
      
      // 1. 更新工作流步骤状态为进行中
      await state.updateWorkflowStep(WORKFLOW_STEPS.AUTO_CALCULATION, {
        stepKey: WORKFLOW_STEPS.AUTO_CALCULATION,
        stepName: '工资自动计算', 
        status: 'in_progress',
        data: {
          calculation_modules: calculationModules,
          started_at: new Date().toISOString()
        }
      });
      
      // 2. 调用真实的计算API
      const taskId = await performRealCalculation(state.selectedPeriodId!, calculationModules);
      
      state.setCalculationTaskId(taskId);
      message.info('薪资计算已启动，请稍候...');
      
      return true;
    } catch (error) {
      console.error('❌ 启动薪资计算失败:', error);
      
      // 标记计算步骤失败
      if (state.currentPayrollRun) {
        await state.updateWorkflowStep(WORKFLOW_STEPS.AUTO_CALCULATION, {
          stepKey: WORKFLOW_STEPS.AUTO_CALCULATION,
          stepName: '工资自动计算',
          status: 'failed',
          data: {
            error_message: error instanceof Error ? error.message : '计算启动失败',
            failed_at: new Date().toISOString()
          }
        });
      }
      
      message.error('启动薪资计算失败');
      return false;
    }
  };

  /**
   * 执行真实薪资计算
   */
  const performRealCalculation = async (periodId: number, calculationModules: string[]): Promise<string> => {
    try {
      // 生成任务ID
      const taskId = `payroll_calc_${periodId}_${Date.now()}`;
      
      console.log(`🧮 开始薪资计算...`, { 
        periodId, 
        modules: calculationModules,
        payrollRunId: state.currentPayrollRun?.id 
      });
      
      // 1. 尝试调用真实的薪资计算API
      try {
        const calculationResponse = await payrollWorkflowApi.triggerPayrollCalculation(
          state.currentPayrollRun!.id,
          {
            modules: calculationModules,
            force_recalculate: true
          }
        );
        
        const realTaskId = calculationResponse.task_id;
        console.log('✅ 薪资计算已启动:', { taskId: realTaskId });
        
        // 设置计算进度状态
        state.setCalculationProgress({
          task_id: realTaskId,
          status: 'processing',
          progress_percentage: 0,
          total_employees: 0,
          processed_employees: 0,
          estimated_remaining_time: undefined,
          error_message: undefined
        });
        
        return realTaskId;
      } catch (apiError: any) {
        console.warn('⚠️ 薪资计算API暂未实现，使用简化计算方案', apiError.message);
        
        // 回退到简化计算
        return await performFallbackCalculation(periodId, calculationModules);
      }
    } catch (error: any) {
      console.error('❌ 启动薪资计算失败:', error);
      message.error(`计算启动失败: ${error.message || '未知错误'}`);
      throw error;
    }
  };

  /**
   * 回退计算方案 - 当真实API不可用时使用
   */
  const performFallbackCalculation = async (periodId: number, calculationModules: string[]): Promise<string> => {
    const taskId = `fallback_calc_${periodId}_${Date.now()}`;
    
    try {
      console.log('🔄 使用简化计算方案...');
      message.info('正在使用简化计算方案，请稍候...');
      
      // 获取薪资条目数据 - 使用现有的API
      const entriesResponse = await apiClient.get('/payroll-entries', {
        params: {
          period_id: periodId,
          include_employee_details: true,
          size: 1000
        }
      });
      
      const entries = entriesResponse.data.data;
      console.log(`💰 获取到 ${entries.length} 条薪资记录`);
      
      // 设置初始进度
      state.setCalculationProgress({
        task_id: taskId,
        status: 'processing',
        progress_percentage: 0,
        total_employees: entries.length,
        processed_employees: 0,
        estimated_remaining_time: entries.length * 2, // 估计每条记录2秒
        error_message: undefined
      });
      
      // 批量计算并更新记录
      let successCount = 0;
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        try {
          // 计算合计
          const { grossPay, totalDeductions, netPay } = calculateEntryTotals(entry);
          
          // 更新记录 - 使用直接API调用
          await apiClient.put(`/payroll-entries/${entry.id}`, {
            gross_pay: grossPay,
            total_deductions: totalDeductions,
            net_pay: netPay
          });
          
          successCount++;
          
          // 更新进度
          const progress = Math.round(((i + 1) / entries.length) * 100);
          state.setCalculationProgress({
            task_id: taskId,
            status: 'processing',
            progress_percentage: progress,
            total_employees: entries.length,
            processed_employees: i + 1,
            estimated_remaining_time: (entries.length - i - 1) * 2,
            error_message: undefined
          });
          
          console.log(`💰 已处理 ${i + 1}/${entries.length} 条记录 (${progress}%)`);
          
          // 模拟处理时间
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (entryError) {
          console.error(`❌ 处理记录 ${entry.id} 失败:`, entryError);
        }
      }
      
      // 完成计算
      setTimeout(async () => {
        state.setCalculationProgress({
          task_id: taskId,
          status: 'completed',
          progress_percentage: 100,
          total_employees: entries.length,
          processed_employees: entries.length,
          estimated_remaining_time: 0,
          error_message: undefined
        });
        
        message.success(`🎉 薪资计算完成！成功处理了 ${successCount}/${entries.length} 条记录`);
        
        // 更新工作流步骤状态
        if (state.currentPayrollRun) {
          await state.updateWorkflowStep(WORKFLOW_STEPS.AUTO_CALCULATION, {
            stepKey: WORKFLOW_STEPS.AUTO_CALCULATION,
            stepName: '工资自动计算',
            status: 'completed',
            data: {
              calculation_modules: calculationModules,
              total_entries: entries.length,
              successful_entries: successCount,
              completed_at: new Date().toISOString()
            }
          });
          
          // 自动开始下一步
          await state.updateWorkflowStep(WORKFLOW_STEPS.PERIOD_REVIEW, {
            stepKey: WORKFLOW_STEPS.PERIOD_REVIEW,
            stepName: '工资周期复核',
            status: 'in_progress',
            data: {
              started_at: new Date().toISOString()
            }
          });
        }
        
        // 清除任务ID
        state.setCalculationTaskId(null);
      }, 2000);
      
      return taskId;
    } catch (error: any) {
      console.error('❌ 简化计算失败:', error);
      
      // 设置失败状态
      state.setCalculationProgress({
        task_id: taskId,
        status: 'failed',
        progress_percentage: 0,
        total_employees: 0,
        processed_employees: 0,
        error_message: error.message,
        estimated_remaining_time: undefined
      });
      
      throw error;
    }
  };

  /**
   * 计算单条记录的合计
   */
  const calculateEntryTotals = (entry: any) => {
    // 计算收入合计
    const grossPay = entry.earnings_details ? 
      Object.values(entry.earnings_details).reduce((sum: number, item: any) => 
        sum + (Number(item?.amount) || 0), 0) : 0;
    
    // 计算扣款合计
    const totalDeductions = entry.deductions_details ? 
      Object.values(entry.deductions_details).reduce((sum: number, item: any) => 
        sum + (Number(item?.amount) || 0), 0) : 0;

    // 计算实发工资
    const netPay = grossPay - totalDeductions;

    return {
      grossPay: Number(grossPay.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netPay: Number(netPay.toFixed(2))
    };
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