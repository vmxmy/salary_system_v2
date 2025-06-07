import React, { useState, useEffect, useCallback } from 'react';
import { Steps, Card, Button, Space, Alert, Typography, Tag, Progress, Divider, message, Modal } from 'antd';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import {
  FileTextOutlined,
  CalculatorOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  BankOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  LoadingOutlined,
  WarningOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollRunResponse, PayrollPeriodResponse, AuditSummary, ReportGenerationRequest } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { WorkflowStepConfig, WorkflowAction } from './PayrollWorkflowGuide';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface EnhancedWorkflowGuideProps {
  selectedVersion: PayrollRunResponse | null;
  selectedPeriod: PayrollPeriodResponse | null; // 新增：当前选择的期间
  auditSummary: AuditSummary | null;
  onRefresh: () => void;
  onStepChange?: (stepKey: string) => void;
  onNavigateToBulkImport?: () => void;
  onDeleteVersion?: (versionId: number) => void; // Allow passing a delete handler
}

export const EnhancedWorkflowGuide: React.FC<EnhancedWorkflowGuideProps> = ({
  selectedVersion,
  selectedPeriod,
  auditSummary,
  onRefresh,
  onStepChange,
  onNavigateToBulkImport,
  onDeleteVersion
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({});
  const [anomaliesModalVisible, setAnomaliesModalVisible] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // 设置加载状态
  const setActionLoading = useCallback((actionKey: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [actionKey]: isLoading }));
  }, []);

  // 组件卸载时清理所有loading状态
  useEffect(() => {
    return () => {
      console.log('🧹 [EnhancedWorkflowGuide] 组件卸载，清理所有loading状态');
      setLoading({});
    };
  }, []);

  // 手动重置所有loading状态的函数
  const resetAllLoadingStates = () => {
    console.log('🔄 [EnhancedWorkflowGuide] 手动重置所有loading状态');
    setLoading({});
    message.info('已重置所有加载状态');
  };

  // 通用的带超时保护的异步操作包装器
  const withTimeout = async (
    actionKey: string, 
    asyncOperation: () => Promise<void>, 
    timeoutMs: number = 30000
  ) => {
    setActionLoading(actionKey, true);
    
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [${actionKey}] 操作超时，强制重置loading状态`);
      setActionLoading(actionKey, false);
      message.error(`${actionKey} 操作超时，请稍后重试`);
    }, timeoutMs);
    
    try {
      await asyncOperation();
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error; // 重新抛出错误让调用者处理
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  // 获取异常详情
  const handleViewAnomalies = async () => {
    if (!selectedVersion) return;
    
    setActionLoading('load_anomalies', true);
    try {
      const response = await simplePayrollApi.getAuditAnomalies({
        payroll_run_id: selectedVersion.id,
        page: 1,
        size: 100
      });
      setAnomalies(response.data || []);
      setAnomaliesModalVisible(true);
      console.log('✅ 异常详情获取成功:', response.data);
    } catch (error) {
      console.error('❌ 获取异常详情失败:', error);
      message.error('获取异常详情失败');
    } finally {
      setActionLoading('load_anomalies', false);
    }
  };

  // 忽略单个异常
  const handleIgnoreAnomaly = async (anomaly: any, index: number) => {
    if (!selectedVersion) return;
    
    try {
      await simplePayrollApi.ignoreAnomalies({
        anomaly_ids: [anomaly.id || `temp_${index}`],
        reason: '用户手动忽略'
      });
      message.success('已忽略该异常');
      
      // 重新获取异常列表
      await handleViewAnomalies();
      // 刷新审核摘要
      onRefresh();
    } catch (error) {
      console.error('❌ 忽略异常失败:', error);
      message.error('忽略异常失败');
    }
  };

  // 批量忽略所有异常
  const handleIgnoreAllAnomalies = async () => {
    if (!selectedVersion || anomalies.length === 0) return;
    
    confirm({
      title: '确认批量忽略',
      content: `确定要忽略所有 ${anomalies.length} 个异常吗？此操作将允许进入下一步。`,
      onOk: async () => {
        try {
          const anomalyIds = anomalies.map((anomaly, index) => anomaly.id || `temp_${index}`);
          await simplePayrollApi.ignoreAnomalies({
            anomaly_ids: anomalyIds,
            reason: '用户批量忽略'
          });
          message.success('已批量忽略所有异常');
          
          // 关闭模态框并刷新数据
          setAnomaliesModalVisible(false);
          onRefresh();
        } catch (error) {
          console.error('❌ 批量忽略失败:', error);
          message.error('批量忽略失败');
        }
      }
    });
  };

  // 根据工资运行状态确定当前步骤
  const getCurrentStepFromStatus = (statusName?: string): number => {
    switch (statusName) {
      case 'DRAFT':
      case '草稿':
        return 0; // 数据准备
      case 'PRUN_CALCULATED':
      case '已计算':
        return 1; // 审核检查
      case 'IN_REVIEW':
      case '审核中':
        return 2; // 审核批准
      case 'APPROVED_FOR_PAYMENT':
      case '批准支付':
        return 3; // 支付准备
      case 'PAID':
      case '已支付':
        return 4; // 完成归档
      default:
        return 0;
    }
  };

  // 更新当前步骤
  useEffect(() => {
    if (selectedVersion) {
      const step = getCurrentStepFromStatus(selectedVersion.status_name);
      setCurrentStep(step);
    }
  }, [selectedVersion]);

  // 自动执行审核检查
  useEffect(() => {
    if (selectedVersion && selectedVersion.status_name === '已计算') {
      autoRunAuditCheck();
    }
  }, [selectedVersion]);

  // 自动执行审核检查函数
  const autoRunAuditCheck = async () => {
    if (!selectedVersion) return;

    console.log('🔍 [EnhancedWorkflowGuide] 检查审核记录，版本ID:', selectedVersion.id);
    
    try {
      // 首先尝试获取现有的审核汇总
      let hasExistingAudit = false;
      let existingAuditData = null;
      
      try {
        const summaryResponse = await simplePayrollApi.getAuditSummary(selectedVersion.id);
        if (summaryResponse.data && summaryResponse.data.total_entries > 0) {
          hasExistingAudit = true;
          existingAuditData = summaryResponse.data;
          console.log('✅ [EnhancedWorkflowGuide] 发现现有审核数据:', existingAuditData);
        }
      } catch (error) {
        console.log('ℹ️ [EnhancedWorkflowGuide] 没有现有审核数据');
      }
      
      // 如果有现有审核数据，直接显示提示信息，不刷新页面
      if (hasExistingAudit && existingAuditData) {
        console.log('ℹ️ [EnhancedWorkflowGuide] 使用现有审核数据，不执行新的审核检查');
        message.info(`已加载现有审核记录：${existingAuditData.total_entries}条记录，${existingAuditData.total_anomalies}个异常`);
        // 移除 onRefresh() 调用，避免循环刷新
      } else {
        console.log('ℹ️ [EnhancedWorkflowGuide] 没有现有审核数据，等待用户手动执行审核检查');
        // 不自动执行审核检查，让用户手动决定是否执行
      }
    } catch (error) {
      console.error('❌ [EnhancedWorkflowGuide] 检查审核记录失败:', error);
      // 失败时不显示错误消息，让用户手动执行
    }
  };

  // API调用函数
  const handleRunAudit = async () => {
    if (!selectedVersion) return;
    
    await withTimeout('run_audit', async () => {
      console.log('🔍 [审核检查] 开始执行审核检查:', selectedVersion.id);
      await simplePayrollApi.runAuditCheck(selectedVersion.id);
      console.log('✅ [审核检查] 审核检查完成');
      message.success('审核检查完成');
      onRefresh();
    });
  };

  const handleRunAdvancedAudit = async () => {
    if (!selectedVersion) return;
    
    await withTimeout('run_advanced_audit', async () => {
      console.log('🔍 [高级审核] 开始执行高级审核检查:', selectedVersion.id);
      await simplePayrollApi.runAdvancedAuditCheck(selectedVersion.id);
      console.log('✅ [高级审核] 高级审核检查完成');
      message.success('高级审核完成');
      onRefresh();
    });
  };

  const handleRunCalculationEngine = async () => {
    if (!selectedVersion) return;
    
    setActionLoading('run_calculation', true);
    try {
      await simplePayrollApi.runSimpleCalculationEngine({
        payroll_run_id: selectedVersion.id,
        recalculate_all: true
      });
      message.success('计算引擎执行完成');
      onRefresh();
    } catch (error) {
      message.error('计算引擎执行失败');
    } finally {
      setActionLoading('run_calculation', false);
    }
  };

  // 一键复制上月数据
  const handleQuickCopyPrevious = async () => {
    if (!selectedPeriod) {
      console.log('❌ [一键复制] 没有选择期间，无法执行复制操作');
      return;
    }
    
    console.log('🚀 [一键复制] 开始执行一键复制操作:', {
      targetPeriod: {
        id: selectedPeriod.id,
        name: selectedPeriod.name,
        status: selectedPeriod.status_name
      }
    });
    
    setActionLoading('quick_copy', true);
    try {
      // 获取可复制的期间列表
      console.log('📋 [一键复制] 正在获取所有期间列表...');
      const periodsResponse = await simplePayrollApi.getPayrollPeriods({});
      
      console.log('📋 [一键复制] 获取到期间列表:', {
        totalCount: periodsResponse.data.length,
        periods: periodsResponse.data.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status_name,
          runs_count: p.runs_count
        }))
      });
      
      // 过滤可复制的期间 - 优化逻辑：优先选择有实际工资条目的期间
      const availablePeriods = periodsResponse.data.filter(p => 
        p.id !== selectedPeriod.id && 
        p.status_name !== 'empty' &&
        p.runs_count > 0 &&
        p.entries_count > 0  // 新增：必须有实际的工资条目
      );
      
      console.log('🔍 [一键复制] 过滤后的可复制期间:', {
        filteredCount: availablePeriods.length,
        filterCriteria: {
          excludeCurrentPeriod: selectedPeriod.id,
          excludeEmptyStatus: true,
          requireRunsCount: '>0',
          requireEntriesCount: '>0'  // 新增过滤条件
        },
        availablePeriods: availablePeriods.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status_name,
          runs_count: p.runs_count,
          entries_count: p.entries_count  // 显示条目数量
        }))
      });
      
      // 如果没有找到有条目的期间，尝试放宽条件（只要有运行记录）
      let fallbackPeriods: PayrollPeriodResponse[] = [];
      if (availablePeriods.length === 0) {
        fallbackPeriods = periodsResponse.data.filter(p => 
          p.id !== selectedPeriod.id && 
          p.status_name !== 'empty' &&
          p.runs_count > 0
        );
        
        console.log('⚠️ [一键复制] 没有找到有工资条目的期间，尝试使用有运行记录的期间:', {
          fallbackCount: fallbackPeriods.length,
          fallbackPeriods: fallbackPeriods.map(p => ({
            id: p.id,
            name: p.name,
            runs_count: p.runs_count,
            entries_count: p.entries_count
          }))
        });
      }
      
      const finalAvailablePeriods = availablePeriods.length > 0 ? availablePeriods : fallbackPeriods;
      
      if (finalAvailablePeriods.length === 0) {
        console.log('❌ [一键复制] 没有找到任何可复制的历史期间数据');
        message.warning('没有找到可复制的历史期间数据，请先确保其他期间有工资数据');
        return;
      }
      
      // 智能选择复制源：优先选择有条目数量最多的最新期间
      const sortedPeriods = finalAvailablePeriods.sort((a, b) => {
        // 首先按条目数量降序排序
        if (a.entries_count !== b.entries_count) {
          return b.entries_count - a.entries_count;
        }
        // 条目数量相同时，按ID降序排序（选择最新的）
        return b.id - a.id;
      });
      const latestPeriod = sortedPeriods[0];
      
      console.log('🎯 [一键复制] 选择复制源期间:', {
        selectedSource: {
          id: latestPeriod.id,
          name: latestPeriod.name,
          status: latestPeriod.status_name,
          runs_count: latestPeriod.runs_count,
          entries_count: latestPeriod.entries_count
        },
        selectionReason: availablePeriods.length > 0 
          ? '优先选择有工资条目数量最多的最新期间' 
          : '备选方案：选择有运行记录的最新期间（可能无工资条目）',
        selectionCriteria: {
          primaryFilter: '有工资条目的期间',
          fallbackFilter: '有运行记录的期间',
          sortingLogic: '按条目数量降序，然后按ID降序'
        },
        allSortedOptions: sortedPeriods.map(p => ({
          id: p.id,
          name: p.name,
          runs_count: p.runs_count,
          entries_count: p.entries_count
        }))
      });
      
      // 执行复制操作
      console.log('⚡ [一键复制] 开始执行复制操作:', {
        request: {
          period_id: selectedPeriod.id,
          generation_type: 'copy_previous',
          source_data: {
            source_period_id: latestPeriod.id
          },
          description: `一键复制 ${latestPeriod.name} 数据`
        }
      });
      
      const result = await simplePayrollApi.generatePayroll({
        period_id: selectedPeriod.id,
        generation_type: 'copy_previous',
        source_data: {
          source_period_id: latestPeriod.id
        },
        description: `一键复制 ${latestPeriod.name} 数据`
      });
      
      console.log('✅ [一键复制] 复制操作完成:', {
        result,
        sourceInfo: {
          id: latestPeriod.id,
          name: latestPeriod.name
        },
        targetInfo: {
          id: selectedPeriod.id,
          name: selectedPeriod.name
        }
      });
      
      // 检查复制结果，如果影响0条记录给出特殊提示
      if (result && result.data && result.data.total_entries === 0) {
        message.warning(`已从 ${latestPeriod.name} 创建工资运行，但源期间无工资条目数据。请通过批量导入或手动添加工资数据。`);
      } else {
        const entriesCount = result?.data?.total_entries;
        message.success(`已成功复制 ${latestPeriod.name} 的工资数据${entriesCount ? `（${entriesCount}条记录）` : ''}`);
      }
      onRefresh();
    } catch (error: any) {
      console.error('❌ [一键复制] 复制操作失败:', {
        error: error,
        errorMessage: error.message,
        errorResponse: error.response?.data,
        targetPeriod: selectedPeriod,
        stack: error.stack
      });
      message.error(error.message || '一键复制失败，请重试');
    } finally {
      setActionLoading('quick_copy', false);
      console.log('🏁 [一键复制] 操作结束，loading状态已重置');
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedVersion) return;
    
    // 检查是否有未解决的异常（排除已忽略的异常）
    if (auditSummary) {
      const effectiveErrorCount = auditSummary.error_count - (auditSummary.manually_ignored_count || 0);
      if (effectiveErrorCount > 0) {
        message.error('请先解决所有审核异常后再提交审核');
        return;
      }
    }

    confirm({
      title: '确认提交审核',
      content: '提交后将进入审批流程，期间数据不可修改。确定要提交吗？',
      onOk: async () => {
        setActionLoading('submit_review', true);
        try {
          await simplePayrollApi.updateAuditStatus({
            payroll_run_id: selectedVersion.id,
            status: 'IN_REVIEW'
          });
          message.success('已提交审核');
          onRefresh();
        } catch (error) {
          message.error('提交审核失败');
        } finally {
          setActionLoading('submit_review', false);
        }
      }
    });
  };

  const handleApprovePayment = async () => {
    if (!selectedVersion) return;
    
    confirm({
      title: '确认批准支付',
      content: '批准后将可以进行工资发放操作。确定要批准吗？',
      onOk: async () => {
        setActionLoading('approve_payment', true);
        try {
          await simplePayrollApi.updateAuditStatus({
            payroll_run_id: selectedVersion.id,
            status: 'APPROVED'
          });
          message.success('已批准支付');
          onRefresh();
        } catch (error) {
          message.error('批准支付失败');
        } finally {
          setActionLoading('approve_payment', false);
        }
      }
    });
  };

  const handleMarkAsPaid = async () => {
    if (!selectedVersion) return;
    
    confirm({
      title: '确认标记已支付',
      content: '确认工资已发放给员工？此操作不可撤销。',
      onOk: async () => {
        setActionLoading('mark_paid', true);
        try {
          await simplePayrollApi.updateAuditStatus({
            payroll_run_id: selectedVersion.id,
            status: 'APPROVED'
          });
          message.success('已标记为已支付');
          onRefresh();
        } catch (error) {
          message.error('标记失败');
        } finally {
          setActionLoading('mark_paid', false);
        }
      }
    });
  };

  // 获取步骤状态
  const getStepStatus = (stepIndex: number, currentStepIndex: number): 'wait' | 'process' | 'finish' | 'error' => {
    if (stepIndex < currentStepIndex) return 'finish';
    if (stepIndex === currentStepIndex) {
      // 检查当前步骤是否有错误
      if (stepIndex === 1 && auditSummary) {
        const effectiveErrorCount = auditSummary.error_count - (auditSummary.manually_ignored_count || 0);
        if (effectiveErrorCount > 0) {
          return 'error';
        }
      }
      return 'process';
    }
    return 'wait';
  };

  // 检查步骤是否可以执行
  const canExecuteStep = (stepIndex: number, currentStepIndex: number): boolean => {
    // 数据准备步骤：只要有选择期间就可以执行
    if (stepIndex === 0) {
      return !!selectedPeriod;
    }
    // 其他步骤：需要按顺序执行
    return stepIndex <= currentStepIndex;
  };

  // 检查是否可以进入下一步
  const canProceedToNext = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 1: // 审核检查步骤
        if (!auditSummary) return true;
        // 计算有效错误数量 = 总错误数 - 已忽略数量
        const effectiveErrorCount = auditSummary.error_count - (auditSummary.manually_ignored_count || 0);
        return effectiveErrorCount <= 0;
      default:
        return true;
    }
  };

  // 步骤配置
  const getStepsConfig = (): WorkflowStepConfig[] => {
    const statusName = selectedVersion?.status_name;
    const currentStepIndex = getCurrentStepFromStatus(statusName);

    return [
      {
        key: 'data_preparation',
        title: '数据准备',
        description: selectedVersion ? '导入和审核基础薪资数据' : '选择期间后开始创建工资数据',
        icon: <FileTextOutlined />,
        status: selectedVersion ? getStepStatus(0, currentStepIndex) : (selectedPeriod ? 'process' : 'wait'),
        disabled: !canExecuteStep(0, currentStepIndex),
        actions: [
          {
            key: 'quick_copy',
            label: '一键复制上月',
            type: 'primary',
            icon: <CopyOutlined />,
            disabled: !selectedPeriod, // 只要有选择期间就可以复制
            loading: loading.quick_copy,
            onClick: handleQuickCopyPrevious
          },
          {
            key: 'import_data',
            label: '批量导入',
            type: 'default',
            icon: <FileTextOutlined />,
            disabled: !selectedPeriod, // 修改：只要有选择期间就可以导入
            onClick: () => onNavigateToBulkImport?.()
          },
          {
            key: 'run_calculation',
            label: '运行计算引擎',
            type: 'default',
            icon: <CalculatorOutlined />,
            disabled: !selectedVersion, // 保持：需要有工资运行版本才能计算
            loading: loading.run_calculation,
            onClick: handleRunCalculationEngine
          }
        ],
        requirements: [
          '确保员工基础信息完整',
          '薪资组件配置正确',
          '考勤数据准确无误',
          '完成工资计算'
        ],
        tips: [
          '💡 推荐使用"一键复制上月"快速创建工资数据',
          '复制后可通过批量导入调整个别员工数据',
          '重点检查新入职和离职员工',
          '计算完成后状态会自动更新'
        ]
      },
      {
        key: 'audit_check',
        title: '审核检查',
        description: '执行自动审核和异常检测',
        icon: <AuditOutlined />,
        status: getStepStatus(1, currentStepIndex),
        disabled: !canExecuteStep(1, currentStepIndex),
        actions: [
          {
            key: 'run_audit',
            label: '运行审核',
            type: 'default',
            icon: <AuditOutlined />,
            disabled: !canExecuteStep(1, currentStepIndex),
            loading: loading.run_audit,
            onClick: handleRunAudit
          },
          {
            key: 'run_advanced_audit',
            label: '高级审核',
            type: 'dashed',
            icon: <AuditOutlined />,
            disabled: !canExecuteStep(1, currentStepIndex),
            loading: loading.run_advanced_audit,
            onClick: handleRunAdvancedAudit
          }
        ],
        requirements: [
          '所有数据完整性检查通过',
          '计算规则验证无误',
          '异常数据已处理或忽略'
        ],
        tips: [
          '审核异常必须全部处理完成才能进入下一步',
          '可以选择忽略非关键警告',
          '高级审核包含更详细的合规性检查'
        ]
      },
      {
        key: 'audit_approval',
        title: '审核批准',
        description: '等待管理员审核批准',
        icon: <CheckCircleOutlined />,
        status: getStepStatus(2, currentStepIndex),
        disabled: !canExecuteStep(2, currentStepIndex),
        actions: [
          {
            key: 'approve_payment',
            label: '批准支付',
            type: 'primary',
            icon: <CheckCircleOutlined />,
            disabled: !canExecuteStep(2, currentStepIndex),
            loading: loading.approve_payment,
            onClick: handleApprovePayment
          },
          {
            key: 'reject_payroll',
            label: '拒绝并退回',
            type: 'default',
            danger: true,
            icon: <ExclamationCircleOutlined />,
            disabled: !canExecuteStep(2, currentStepIndex),
            loading: loading.reject_payroll,
            onClick: () => {
              confirm({
                title: '确认拒绝',
                content: '拒绝后工资数据将退回到数据准备阶段，需要重新处理。确定要拒绝吗？',
                onOk: async () => {
                  setActionLoading('reject_payroll', true);
                  try {
                    await simplePayrollApi.updateAuditStatus({
                      payroll_run_id: selectedVersion!.id,
                      status: 'REJECTED'
                    });
                    message.success('已拒绝，工资数据已退回');
                    onRefresh();
                  } catch (error) {
                    message.error('拒绝操作失败');
                  } finally {
                    setActionLoading('reject_payroll', false);
                  }
                }
              });
            }
          }
        ],
        requirements: [
          '工资数据计算准确',
          '审核检查已通过',
          '所有异常已处理完毕',
          '符合发放条件'
        ],
        tips: [
          '请仔细检查工资数据的准确性',
          '确认符合公司薪资发放政策',
          '批准后即可进行支付操作',
          '如有问题可拒绝并退回修改'
        ]
      },
      {
        key: 'payment_preparation',
        title: '支付准备',
        description: '准备工资发放和银行文件',
        icon: <BankOutlined />,
        status: getStepStatus(3, currentStepIndex),
        disabled: !canExecuteStep(3, currentStepIndex),
                 actions: [
           {
             key: 'generate_reports',
             label: '一键生成报表',
             type: 'primary',
             icon: <FileTextOutlined />,
             disabled: !canExecuteStep(3, currentStepIndex),
             loading: loading.generate_reports,
             onClick: async () => {
               if (!selectedVersion) return;
               setActionLoading('generate_reports', true);
                                try {
                  // 调用真实的报表生成API
                  const reportRequest: ReportGenerationRequest = {
                    report_ids: [1, 2, 3, 4], // 工资明细表、汇总表、银行代发文件、个税报表
                    period_id: selectedVersion.period_id,
                    payroll_run_id: selectedVersion.id,
                    output_format: 'excel',
                    include_details: true,
                    filters: {
                      // 可以添加过滤条件
                    }
                  };
                  
                  const response = await simplePayrollApi.generateReports(reportRequest);
                  message.success('报表生成任务已启动！包括：工资明细表、汇总表、银行代发文件、个税报表');
                  console.log('✅ 报表生成任务启动成功:', response);
                } catch (error) {
                  console.error('❌ 报表生成失败:', error);
                  message.error('报表生成失败，请重试');
                } finally {
                 setActionLoading('generate_reports', false);
               }
             }
           },
           {
             key: 'generate_bank_file',
             label: '生成银行文件',
             type: 'default',
             icon: <BankOutlined />,
             disabled: !canExecuteStep(3, currentStepIndex),
             loading: loading.generate_bank_file,
             onClick: async () => {
               if (!selectedVersion) return;
               
               // 显示银行选择对话框
               const bankOptions = [
                 { label: '工商银行 (ICBC)', value: 'ICBC' },
                 { label: '建设银行 (CCB)', value: 'CCB' },
                 { label: '农业银行 (ABC)', value: 'ABC' },
                 { label: '中国银行 (BOC)', value: 'BOC' },
                 { label: '招商银行 (CMB)', value: 'CMB' },
                 { label: '通用格式', value: 'GENERIC' }
               ];
               
               const formatOptions = [
                 { label: 'TXT文本文件', value: 'txt' },
                 { label: 'CSV表格文件', value: 'csv' },
                 { label: 'Excel文件', value: 'excel' }
               ];
               
               // 这里可以用Modal.confirm或自定义Modal来选择银行和格式
               // 为了简化，先使用默认参数
               setActionLoading('generate_bank_file', true);
               try {
                 const response = await simplePayrollApi.generateBankFile({
                   payroll_run_id: selectedVersion.id,
                   bank_type: 'ICBC', // 默认工商银行
                   file_format: 'csv', // 默认CSV格式
                   include_summary: true
                 });
                 
                 // 创建下载链接，确保CSV文件使用UTF-8编码
                 const fileContent = response.data.file_format === 'csv' 
                   ? '\ufeff' + response.data.file_content  // 为CSV添加UTF-8 BOM
                   : response.data.file_content;
                 
                 const blob = new Blob([fileContent], { 
                   type: response.data.file_format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' 
                 });
                 const url = window.URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = response.data.file_name;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 window.URL.revokeObjectURL(url);
                 
                 message.success(`银行文件生成成功！共${response.data.total_records}条记录，总金额${response.data.total_amount}元`);
                 console.log('✅ 银行文件生成成功:', response.data.summary);
               } catch (error) {
                 console.error('❌ 银行文件生成失败:', error);
                 message.error('银行文件生成失败，请检查员工银行信息是否完整');
               } finally {
                 setActionLoading('generate_bank_file', false);
               }
             }
           },
           {
             key: 'mark_as_paid',
             label: '标记已支付',
             type: 'default',
             icon: <CheckCircleOutlined />,
             disabled: !canExecuteStep(3, currentStepIndex),
             loading: loading.mark_paid,
             onClick: handleMarkAsPaid
           }
         ],
                 requirements: [
           '工资已批准发放',
           '一键生成所有报表',
           '银行文件已生成',
           '支付渠道已确认',
           '员工账户信息正确'
         ],
         tips: [
           '先生成报表，包含工资明细、汇总、银行代发等',
           '确认报表数据准确无误',
           '支付完成后及时标记状态',
           '保留支付凭证和报表备查'
         ]
      },
      {
        key: 'completion',
        title: '完成归档',
        description: '工资发放完成，生成报表归档',
        icon: <FileTextOutlined />,
        status: getStepStatus(4, currentStepIndex),
        disabled: !canExecuteStep(4, currentStepIndex),
        actions: [
          {
            key: 'generate_reports',
            label: '生成报表',
            type: 'primary',
            icon: <FileTextOutlined />,
            disabled: !canExecuteStep(4, currentStepIndex),
            loading: loading.generate_reports,
            onClick: () => {
              message.info('报表生成功能开发中...');
            }
          },
          {
            key: 'archive_data',
            label: '数据归档',
            type: 'default',
            icon: <FileTextOutlined />,
            disabled: !canExecuteStep(4, currentStepIndex),
            loading: loading.archive_data,
            onClick: () => {
              message.info('数据归档功能开发中...');
            }
          }
        ],
        requirements: [
          '工资已成功发放',
          '所有数据已确认',
          '报表已生成',
          '归档流程已完成'
        ],
        tips: [
          '生成必要的工资报表',
          '保存重要数据备份',
          '完成合规性归档',
          '整个流程已结束'
        ]
      }
    ];
  };

  const stepsConfig = getStepsConfig();
  const currentStepConfig = stepsConfig[currentStep] || stepsConfig[0];

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <span className="typography-title-tertiary">智能流程引导</span>
        </Space>
      }
      style={{ height: '100%' }}
    >
      {/* 步骤进度条 */}
      <ProCard split="vertical" style={{ marginBottom: 24 }}>
        {stepsConfig.map((step, index) => (
          <ProCard 
            key={step.key}
            title={
              <Space>
                {step.icon}
                <span 
                  className="typography-label-primary"
                  style={{ 
                    color: step.status === 'finish' ? '#52c41a' : 
                           step.status === 'process' ? '#1890ff' : 
                           step.status === 'error' ? '#ff4d4f' : '#8c8c8c'
                  }}
                >
                  {step.title}
                </span>
              </Space>
            }
            colSpan="20%"
            style={{
              backgroundColor: step.status === 'process' ? '#f6ffed' : 'transparent',
              border: step.status === 'process' ? '1px solid #b7eb8f' : 'none'
            }}
          >
            <Typography.Text 
              className="typography-label-secondary"
              style={{ 
                color: step.status === 'finish' ? '#52c41a' : 
                       step.status === 'process' ? '#1890ff' : '#8c8c8c'
              }}
            >
              {step.description}
            </Typography.Text>
          </ProCard>
        ))}
      </ProCard>

      {/* 审核状态概览 */}
      {auditSummary && (currentStep === 1 || currentStep === 2) && (
        <Alert
          message={
            <Space>
              <span>审核状态：</span>
              {(() => {
                const effectiveErrorCount = auditSummary.error_count - (auditSummary.manually_ignored_count || 0);
                return (
                  <>
                    <Tag color={effectiveErrorCount > 0 ? 'red' : 'green'}>
                      {effectiveErrorCount > 0 ? '有异常' : '正常'}
                    </Tag>
                    <span>异常: {auditSummary.error_count}</span>
                    <span>已忽略: {auditSummary.manually_ignored_count || 0}</span>
                    <span>有效异常: {effectiveErrorCount}</span>
                    <span>警告: {auditSummary.warning_count}</span>
                  </>
                );
              })()}
            </Space>
          }
          type={(() => {
            const effectiveErrorCount = auditSummary.error_count - (auditSummary.manually_ignored_count || 0);
            return effectiveErrorCount > 0 ? 'error' : 'success';
          })()}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {/* 当前步骤详情 */}
      <div>
        <Title level={4} className="typography-title-tertiary" style={{ marginBottom: 16 }}>
          <Space>
            {currentStepConfig.icon}
            {currentStepConfig.title}
            {currentStepConfig.status === 'process' && <LoadingOutlined />}
            {currentStepConfig.status === 'error' && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        </Title>
        
        <Paragraph className="typography-body-secondary" style={{ marginBottom: 16 }}>
          {currentStepConfig.description}
        </Paragraph>

        {/* 操作按钮 */}
        <Space wrap style={{ marginBottom: 16 }}>
          {currentStepConfig.actions.map(action => (
            <Button
              key={action.key}
              type={action.type}
              icon={action.icon}
              disabled={action.disabled}
              loading={action.loading}
              danger={action.danger}
              onClick={action.onClick}
              size="small"
            >
              {action.label}
            </Button>
          ))}
          
          {/* 下一步按钮 */}
          {currentStep === 1 && canProceedToNext(1) && (
            <Button
              type="primary"
              icon={<RightOutlined />}
              loading={loading.submit_review}
              onClick={handleSubmitForReview}
              size="small"
            >
              提交审核
            </Button>
          )}
        </Space>

        {/* 审核批准步骤的特殊内容 */}
        {currentStep === 2 && selectedVersion && (
          <StatisticCard.Group style={{ marginBottom: 16 }}>
            <StatisticCard
              statistic={{
                title: '审核状态',
                value: selectedVersion.status_name,
                valueStyle: { color: '#1890ff' },
              }}
              chart={<Tag color="blue">{selectedVersion.status_name}</Tag>}
            />
            <StatisticCard
              statistic={{
                title: '应发总额',
                value: selectedVersion.total_gross_pay,
                precision: 2,
                prefix: '¥',
                valueStyle: { color: '#52c41a' },
              }}
            />
            <StatisticCard
              statistic={{
                title: '扣发总额',
                value: selectedVersion.total_deductions,
                precision: 2,
                prefix: '¥',
                valueStyle: { color: '#ff4d4f' },
              }}
            />
            <StatisticCard
              statistic={{
                title: '实发总额',
                value: selectedVersion.total_net_pay,
                precision: 2,
                prefix: '¥',
                valueStyle: { color: '#1890ff', fontSize: '20px' },
              }}
            />
          </StatisticCard.Group>
        )}

        {/* 阻塞提示 */}
        {currentStep === 1 && !canProceedToNext(1) && (
          <Alert
            message="无法进入下一步"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  {(() => {
                    const effectiveErrorCount = auditSummary ? auditSummary.error_count - (auditSummary.manually_ignored_count || 0) : 0;
                    return (
                      <>
                        还有 <strong style={{ color: '#ff4d4f' }}>{effectiveErrorCount}</strong> 个审核异常需要处理
                        {auditSummary && auditSummary.manually_ignored_count > 0 && (
                          <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                            (总计{auditSummary.error_count}个，已忽略{auditSummary.manually_ignored_count}个)
                          </span>
                        )}
                      </>
                    );
                  })()}
                </p>
                <Space>
                                     <Button
                     type="primary"
                     size="small"
                     icon={<ExclamationCircleOutlined />}
                     loading={loading.load_anomalies}
                     onClick={handleViewAnomalies}
                   >
                     查看异常详情
                   </Button>
                                     <Button
                     size="small"
                     onClick={handleIgnoreAllAnomalies}
                   >
                     批量忽略
                   </Button>
                </Space>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider />

        {/* 要求和提示 */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Text strong className="typography-label-primary">完成要求：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {currentStepConfig.requirements.map((req, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  <Text className="typography-body-secondary">{req}</Text>
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{ flex: 1 }}>
            <Text strong className="typography-label-primary">操作提示：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {currentStepConfig.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  <Text className="typography-body-secondary">{tip}</Text>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 状态提示 */}
      {!selectedVersion && (
        <Alert
          message="请先选择工资运行版本"
          description="选择一个工资运行版本后，系统将自动显示对应的操作步骤"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 异常详情模态框 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>审核异常详情</span>
            <Tag color="red">{anomalies.length} 个异常</Tag>
          </Space>
        }
        open={anomaliesModalVisible}
        onCancel={() => setAnomaliesModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setAnomaliesModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="ignore-all" 
            danger
            onClick={handleIgnoreAllAnomalies}
            disabled={anomalies.length === 0}
          >
            批量忽略全部
          </Button>,
          <Button 
            key="refresh" 
            type="primary" 
            onClick={() => {
              setAnomaliesModalVisible(false);
              onRefresh();
            }}
          >
            刷新数据
          </Button>
        ]}
      >
        {anomalies.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {anomalies.map((anomaly, index) => (
              <Card 
                key={index} 
                size="small" 
                style={{ marginBottom: 8 }}
                title={
                  <Space>
                    <Tag color="red">异常 #{index + 1}</Tag>
                    <Text strong className="typography-label-primary">{anomaly.anomaly_type || '数据异常'}</Text>
                  </Space>
                }
              >
                <div className="typography-body-secondary">
                  <p><strong>异常描述：</strong>{anomaly.description || anomaly.message || '未知异常'}</p>
                  {anomaly.employee_name && (
                    <p><strong>涉及员工：</strong>{anomaly.employee_name}</p>
                  )}
                  {anomaly.field_name && (
                    <p><strong>异常字段：</strong>{anomaly.field_name}</p>
                  )}
                  {anomaly.expected_value && (
                    <p><strong>期望值：</strong>{anomaly.expected_value}</p>
                  )}
                  {anomaly.actual_value && (
                    <p><strong>实际值：</strong>{anomaly.actual_value}</p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Space>
                                             <Button 
                         size="small" 
                         type="link"
                         onClick={() => handleIgnoreAnomaly(anomaly, index)}
                       >
                         忽略此异常
                       </Button>
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => {
                          console.log('修复异常:', anomaly);
                          message.info('修复功能开发中...');
                        }}
                      >
                        尝试修复
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text className="typography-body-secondary">暂无异常数据</Text>
          </div>
        )}
      </Modal>
    </Card>
  );
}; 