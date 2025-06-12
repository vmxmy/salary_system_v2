import { message } from 'antd';
import type { TFunction } from 'i18next';

// import { payrollWorkflowApi } from '../services/payrollWorkflowApi';
const payrollWorkflowApi = {} as any; // 临时定义
import type { PayrollPeriod } from '../types/payrollTypes';

/**
 * 薪资工作流工具函数集合
 */
export class PayrollWorkflowUtils {
  /**
   * 根据周期ID查找周期信息
   */
  static findPeriodById(periods: PayrollPeriod[], periodId: number | null): PayrollPeriod | null {
    if (!periodId || !periods.length) return null;
    return periods.find(p => p.id === periodId) || null;
  }

  /**
   * 格式化周期显示名称
   */
  static formatPeriodName(period: PayrollPeriod | null, periodId: number | null): string | null {
    if (!period && !periodId) return null;
    return period?.name || `周期${periodId}`;
  }

  /**
   * 验证周期选择
   */
  static validatePeriodSelection(periodId: number | null, t: TFunction): boolean {
    if (!periodId) {
      message.warning(t('payroll:workflow.steps.data_review.form.payroll_period', '请先选择一个薪资周期'));
      return false;
    }
    return true;
  }

  /**
   * 显示数据检查结果消息
   */
  static showDataCheckResult(hasData: boolean, entryCount: number, t: TFunction): void {
    if (hasData) {
      message.success(`✅ 当前薪资周期已有数据，共 ${entryCount} 条记录，可以继续进行审核`);
    } else {
      message.info(t('payroll:workflow.steps.data_review.data_initialization.no_data_message', 
        '当前薪资周期暂无数据，请选择数据初始化方式'));
    }
  }

  /**
   * 显示复制数据结果消息
   */
  static showCopyDataResult(success: boolean, entriesCreated: number, errorMessage: string, t: TFunction): void {
    if (success) {
      message.success(`🎉 成功复制上月薪资数据，共创建 ${entriesCreated} 条记录，现在可以开始审核`);
    } else {
      message.error(`❌ 复制数据失败：${errorMessage}`);
    }
  }

  /**
   * 创建下载链接并触发下载
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * 生成导出文件名
   */
  static generateExportFilename(payrollRunId: number, reportType: string): string {
    return `payroll_${reportType}_${payrollRunId}.xlsx`;
  }

  /**
   * 格式化计算模块列表
   */
  static formatCalculationModules(modules: string[]): string {
    return modules.join(', ');
  }

  /**
   * 创建薪资运行备注
   */
  static createPayrollRunNotes(calculationModules: string[]): string {
    return `工作流自动创建 - 计算模块: ${this.formatCalculationModules(calculationModules)}`;
  }

  /**
   * 判断计算是否完成
   */
  static isCalculationFinished(status: string): boolean {
    return status === 'completed' || status === 'failed';
  }

  /**
   * 判断计算是否成功
   */
  static isCalculationSuccessful(status: string): boolean {
    return status === 'completed';
  }

  /**
   * 获取当前日期字符串 (YYYY-MM-DD)
   */
  static getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * 异步工作流操作函数
 */
export class PayrollWorkflowAsyncUtils {
  /**
   * 加载薪资周期列表
   */
  static async loadPayrollPeriods(): Promise<PayrollPeriod[]> {
    try {
      const response = await payrollWorkflowApi.getAvailablePayrollPeriods();
      return response.data || [];
    } catch (error) {
      console.error('获取薪资周期列表失败:', error);
      throw error;
    }
  }

  /**
   * 检查薪资周期数据
   */
  static async checkPeriodData(periodId: number) {
    try {
      return await payrollWorkflowApi.checkPayrollPeriodData(periodId);
    } catch (error) {
      console.error('检查薪资周期数据失败:', error);
      throw error;
    }
  }

  /**
   * 复制上月数据
   */
  static async copyLastMonthData(periodId: number) {
    try {
      return await payrollWorkflowApi.copyLastMonthData(periodId);
    } catch (error) {
      console.error('复制上月数据失败:', error);
      throw error;
    }
  }

  /**
   * 创建薪资运行批次
   */
  static async createPayrollRun(periodId: number, calculationModules: string[]) {
    try {
      return await payrollWorkflowApi.createPayrollRun({
        payroll_period_id: periodId,
        run_date: PayrollWorkflowUtils.getCurrentDateString(),
        status_lookup_value_id: 1, // 假设1是"处理中"状态
        notes: PayrollWorkflowUtils.createPayrollRunNotes(calculationModules)
      });
    } catch (error) {
      console.error('创建薪资运行批次失败:', error);
      throw error;
    }
  }

  /**
   * 触发薪资计算
   */
  static async triggerCalculation(payrollRunId: number, calculationModules: string[]) {
    try {
      return await payrollWorkflowApi.triggerPayrollCalculation(
        payrollRunId, 
        { modules: calculationModules }
      );
    } catch (error) {
      console.error('触发薪资计算失败:', error);
      throw error;
    }
  }

  /**
   * 获取计算进度
   */
  static async getCalculationProgress(taskId: string) {
    try {
      return await payrollWorkflowApi.getCalculationProgress(taskId);
    } catch (error) {
      console.error('获取计算进度失败:', error);
      throw error;
    }
  }

  /**
   * 获取计算汇总
   */
  static async getCalculationSummary(payrollRunId: number) {
    try {
      return await payrollWorkflowApi.getCalculationSummary(payrollRunId);
    } catch (error) {
      console.error('获取计算汇总失败:', error);
      throw error;
    }
  }

  /**
   * 导出薪资报表
   */
  static async exportPayrollReport(payrollRunId: number, reportType: 'detail' | 'summary' | 'bank') {
    try {
      return await payrollWorkflowApi.exportPayrollReport(payrollRunId, reportType);
    } catch (error) {
      console.error('导出报表失败:', error);
      throw error;
    }
  }
}

/**
 * 对话框配置工具函数
 */
export class PayrollWorkflowDialogUtils {
  /**
   * 获取复制上月数据确认对话框配置
   */
  static getCopyDataConfirmConfig(t: TFunction) {
    return {
      title: t('payroll:workflow.steps.data_review.data_initialization.copy_confirm_title', '确认复制上月数据'),
      content: t('payroll:workflow.steps.data_review.data_initialization.copy_confirm_content', 
        '确定要复制上个月的薪资数据到当前周期吗？'),
      okText: t('common:actions.confirm', '确认'),
      cancelText: t('common:actions.cancel', '取消'),
    };
  }
} 