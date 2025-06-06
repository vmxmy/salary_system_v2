import apiClient from '../../../api/apiClient';
import { message } from 'antd';
import type { PayrollPeriod, PayrollRun } from '../types/payrollTypes';
import type { PayrollWorkflowStatus, WorkflowStepData } from './payrollWorkflowApi';

// 工作流步骤定义
export const WORKFLOW_STEPS = {
  DATA_REVIEW: 'salaryReview',
  AUTO_CALCULATION: 'salaryCalculation', 
  PERIOD_REVIEW: 'periodReview',
  PERIOD_APPROVAL: 'periodApproval',
  PAYROLL_DISTRIBUTION: 'payrollDistribution'
} as const;

// 薪资周期状态ID - 通过动态获取
export const PAYROLL_PERIOD_STATUS_IDS = {
  PLANNED: 137,    // 计划中
  ACTIVE: 134,     // 活动/进行中
  CLOSED: 135,     // 已关闭
  ARCHIVED: 136    // 已归档
} as const;

// 薪资运行状态ID - 根据数据库实际值调整
export const PAYROLL_RUN_STATUS_IDS = {
  NEW_RUN: 170,        // 新建运行 (NEW_RUN)
  PENDING_CALC: 60,    // 待计算 (PRUN_PENDING_CALC)
  CALCULATED: 61,      // 已计算 (PRUN_CALCULATED)
  APPROVED_PAY: 62,    // 批准支付 (PRUN_APPROVED_PAY)
  PAID: 63            // 已支付 (PRUN_PAID)
} as const;

/**
 * 工作流状态管理服务
 */
export class PayrollWorkflowStatusService {
  
  /**
   * 获取工作流状态
   */
  static async getWorkflowStatus(payrollRunId: number): Promise<PayrollWorkflowStatus> {
    try {
      const response = await apiClient.get<PayrollWorkflowStatus>(`/payroll-runs/${payrollRunId}/workflow-status`);
      return response.data;
    } catch (error) {
      console.warn('工作流状态API暂未实现，使用默认状态');
      
      // 返回默认工作流状态
      return {
        payroll_run_id: payrollRunId,
        current_step: WORKFLOW_STEPS.DATA_REVIEW,
        steps: [
          { 
            stepKey: WORKFLOW_STEPS.DATA_REVIEW, 
            stepName: '薪资数据审核', 
            status: 'pending', 
            data: {},
            timestamp: new Date().toISOString()
          },
          { 
            stepKey: WORKFLOW_STEPS.AUTO_CALCULATION, 
            stepName: '工资自动计算', 
            status: 'pending', 
            data: {},
            timestamp: new Date().toISOString()
          },
          { 
            stepKey: WORKFLOW_STEPS.PERIOD_REVIEW, 
            stepName: '工资周期复核', 
            status: 'pending', 
            data: {},
            timestamp: new Date().toISOString()
          },
          { 
            stepKey: WORKFLOW_STEPS.PERIOD_APPROVAL, 
            stepName: '工资周期批准', 
            status: 'pending', 
            data: {},
            timestamp: new Date().toISOString()
          },
          { 
            stepKey: WORKFLOW_STEPS.PAYROLL_DISTRIBUTION, 
            stepName: '工资发放与归档', 
            status: 'pending', 
            data: {},
            timestamp: new Date().toISOString()
          }
        ],
        overall_status: 'not_started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  /**
   * 更新工作流步骤状态
   */
  static async updateWorkflowStep(
    payrollRunId: number, 
    stepKey: string, 
    stepData: Partial<WorkflowStepData>
  ): Promise<PayrollWorkflowStatus> {
    try {
      const response = await apiClient.patch<PayrollWorkflowStatus>(`/payroll-runs/${payrollRunId}/workflow-status`, {
        step_key: stepKey,
        step_data: stepData
      });
      return response.data;
    } catch (error) {
      console.warn('工作流状态更新API暂未实现，记录本地状态变更');
      
      // 如果API不可用，仍然记录状态变更
      console.log('🔄 工作流状态更新:', {
        payrollRunId,
        stepKey,
        stepData,
        timestamp: new Date().toISOString()
      });
      
      // 返回更新后的模拟状态
      const currentStatus = await this.getWorkflowStatus(payrollRunId);
      const stepIndex = currentStatus.steps.findIndex(step => step.stepKey === stepKey);
      
      if (stepIndex >= 0) {
        currentStatus.steps[stepIndex] = {
          ...currentStatus.steps[stepIndex],
          ...stepData,
          timestamp: new Date().toISOString()
        };
        
        // 更新当前步骤
        if (stepData.status === 'completed') {
          const nextStepIndex = stepIndex + 1;
          if (nextStepIndex < currentStatus.steps.length) {
            currentStatus.current_step = currentStatus.steps[nextStepIndex].stepKey;
          }
        } else if (stepData.status === 'in_progress') {
          currentStatus.current_step = stepKey;
        }
        
        // 更新总体状态
        const allCompleted = currentStatus.steps.every(step => step.status === 'completed');
        const anyInProgress = currentStatus.steps.some(step => step.status === 'in_progress');
        const anyFailed = currentStatus.steps.some(step => step.status === 'failed');
        
        if (allCompleted) {
          currentStatus.overall_status = 'completed';
        } else if (anyFailed) {
          currentStatus.overall_status = 'failed';
        } else if (anyInProgress) {
          currentStatus.overall_status = 'in_progress';
        }
        
        currentStatus.updated_at = new Date().toISOString();
      }
      
      return currentStatus;
    }
  }

  /**
   * 更新薪资周期状态
   */
  static async updatePayrollPeriodStatus(periodId: number, statusId: number): Promise<PayrollPeriod> {
    try {
      const response = await apiClient.put<{ data: PayrollPeriod }>(`/payroll-periods/${periodId}`, {
        status_lookup_value_id: statusId
      });
      
      console.log('✅ 薪资周期状态更新成功:', {
        periodId,
        newStatusId: statusId,
        timestamp: new Date().toISOString()
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ 更新薪资周期状态失败:', error);
      message.error(`更新薪资周期状态失败: ${error.message || '未知错误'}`);
      throw error;
    }
  }

  /**
   * 更新薪资运行状态
   */
  static async updatePayrollRunStatus(runId: number, statusId: number): Promise<PayrollRun> {
    try {
      const response = await apiClient.put<{ data: PayrollRun }>(`/payroll-runs/${runId}`, {
        status_lookup_value_id: statusId
      });
      
      console.log('✅ 薪资运行状态更新成功:', {
        runId,
        newStatusId: statusId,
        timestamp: new Date().toISOString()
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ 更新薪资运行状态失败:', error);
      message.error(`更新薪资运行状态失败: ${error.message || '未知错误'}`);
      throw error;
    }
  }

  /**
   * 开始工作流 - 创建薪资运行并初始化状态
   */
  static async startWorkflow(periodId: number): Promise<{ payrollRun: PayrollRun; workflowStatus: PayrollWorkflowStatus }> {
    try {
      // 1. 创建薪资运行
      const createRunResponse = await apiClient.post<{ data: PayrollRun }>('/payroll-runs', {
        payroll_period_id: periodId,
        run_date: new Date().toISOString().split('T')[0],
        status_lookup_value_id: PAYROLL_RUN_STATUS_IDS.NEW_RUN,
        initiated_by_user_id: 17, // admin用户ID
        notes: '工作流自动创建的薪资运行批次'
      });
      
      const payrollRun = createRunResponse.data.data;
      
      // 2. 更新薪资周期状态为"活动"
      await this.updatePayrollPeriodStatus(periodId, PAYROLL_PERIOD_STATUS_IDS.ACTIVE);
      
      // 3. 初始化工作流状态
      const workflowStatus = await this.updateWorkflowStep(payrollRun.id, WORKFLOW_STEPS.DATA_REVIEW, {
        stepKey: WORKFLOW_STEPS.DATA_REVIEW,
        stepName: '薪资数据审核',
        status: 'in_progress',
        data: { started_at: new Date().toISOString() }
      });
      
      console.log('🚀 工作流启动成功:', {
        payrollRunId: payrollRun.id,
        periodId,
        timestamp: new Date().toISOString()
      });
      
      return { payrollRun, workflowStatus };
    } catch (error: any) {
      console.error('❌ 启动工作流失败:', error);
      message.error(`启动工作流失败: ${error.message || '未知错误'}`);
      throw error;
    }
  }

  /**
   * 完成工作流步骤
   */
  static async completeWorkflowStep(
    payrollRunId: number, 
    stepKey: string, 
    stepData?: Record<string, any>
  ): Promise<PayrollWorkflowStatus> {
    const completedStepData: Partial<WorkflowStepData> = {
      stepKey,
      status: 'completed',
      data: {
        ...stepData,
        completed_at: new Date().toISOString()
      }
    };
    
    return await this.updateWorkflowStep(payrollRunId, stepKey, completedStepData);
  }

  /**
   * 工作流步骤失败
   */
  static async failWorkflowStep(
    payrollRunId: number, 
    stepKey: string, 
    errorMessage: string,
    stepData?: Record<string, any>
  ): Promise<PayrollWorkflowStatus> {
    const failedStepData: Partial<WorkflowStepData> = {
      stepKey,
      status: 'failed',
      data: {
        ...stepData,
        error_message: errorMessage,
        failed_at: new Date().toISOString()
      }
    };
    
    return await this.updateWorkflowStep(payrollRunId, stepKey, failedStepData);
  }

  /**
   * 开始下一个工作流步骤
   */
  static async startNextStep(
    payrollRunId: number, 
    nextStepKey: string
  ): Promise<PayrollWorkflowStatus> {
    const nextStepData: Partial<WorkflowStepData> = {
      stepKey: nextStepKey,
      status: 'in_progress',
      data: {
        started_at: new Date().toISOString()
      }
    };
    
    return await this.updateWorkflowStep(payrollRunId, nextStepKey, nextStepData);
  }

  /**
   * 完成整个工作流
   */
  static async completeWorkflow(payrollRunId: number, periodId: number): Promise<void> {
    try {
      // 1. 完成最后一个步骤
      await this.completeWorkflowStep(payrollRunId, WORKFLOW_STEPS.PAYROLL_DISTRIBUTION, {
        workflow_completed: true
      });
      
      // 2. 更新薪资运行状态为"已完成"  
      await this.updatePayrollRunStatus(payrollRunId, PAYROLL_RUN_STATUS_IDS.APPROVED_PAY);
      
      // 3. 更新薪资周期状态为"已关闭"
      await this.updatePayrollPeriodStatus(periodId, PAYROLL_PERIOD_STATUS_IDS.CLOSED);
      
      console.log('🎉 工作流完成:', {
        payrollRunId,
        periodId,
        timestamp: new Date().toISOString()
      });
      
      message.success('工作流已完成！薪资周期已关闭。');
    } catch (error: any) {
      console.error('❌ 完成工作流失败:', error);
      message.error(`完成工作流失败: ${error.message || '未知错误'}`);
      throw error;
    }
  }
} 