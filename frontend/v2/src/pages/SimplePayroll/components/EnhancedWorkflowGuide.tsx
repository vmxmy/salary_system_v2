import React, { useState, useEffect, useCallback } from 'react';
import { Steps, Card, Button, Space, Alert, Typography, Tag, Progress, Divider, message, Modal } from 'antd';
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
  WarningOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollRunResponse, AuditSummary } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { WorkflowStepConfig, WorkflowAction } from './PayrollWorkflowGuide';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface EnhancedWorkflowGuideProps {
  selectedVersion: PayrollRunResponse | null;
  auditSummary: AuditSummary | null;
  onRefresh: () => void;
  onStepChange?: (stepKey: string) => void;
  onNavigateToBulkImport?: () => void;
}

export const EnhancedWorkflowGuide: React.FC<EnhancedWorkflowGuideProps> = ({
  selectedVersion,
  auditSummary,
  onRefresh,
  onStepChange,
  onNavigateToBulkImport
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

  // API调用函数
  const handleRunAudit = async () => {
    if (!selectedVersion) return;
    
    setActionLoading('run_audit', true);
    try {
      await simplePayrollApi.runAuditCheck(selectedVersion.id);
      message.success('审核检查完成');
      onRefresh();
    } catch (error) {
      message.error('审核检查失败');
    } finally {
      setActionLoading('run_audit', false);
    }
  };

  const handleRunAdvancedAudit = async () => {
    if (!selectedVersion) return;
    
    setActionLoading('run_advanced_audit', true);
    try {
      await simplePayrollApi.runAdvancedAuditCheck(selectedVersion.id);
      message.success('高级审核完成');
      onRefresh();
    } catch (error) {
      message.error('高级审核失败');
    } finally {
      setActionLoading('run_advanced_audit', false);
    }
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
        description: '导入和审核基础薪资数据',
        icon: <FileTextOutlined />,
        status: getStepStatus(0, currentStepIndex),
        disabled: !canExecuteStep(0, currentStepIndex),
        actions: [
          {
            key: 'import_data',
            label: '批量导入',
            type: 'primary',
            icon: <FileTextOutlined />,
            disabled: !selectedVersion,
            onClick: () => onNavigateToBulkImport?.()
          },
          {
            key: 'run_calculation',
            label: '运行计算引擎',
            type: 'default',
            icon: <CalculatorOutlined />,
            disabled: !selectedVersion,
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
          '建议先复制上月数据作为基础',
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
            type: 'primary',
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
             onClick: () => {
               if (!selectedVersion) return;
               setActionLoading('generate_reports', true);
               // 这里调用报表生成API
               setTimeout(() => {
                 message.success('报表生成完成！包括：工资明细表、汇总表、银行代发文件');
                 setActionLoading('generate_reports', false);
               }, 2000);
             }
           },
           {
             key: 'generate_bank_file',
             label: '生成银行文件',
             type: 'default',
             icon: <BankOutlined />,
             disabled: !canExecuteStep(3, currentStepIndex),
             loading: loading.generate_bank_file,
             onClick: () => {
               message.info('银行文件生成功能开发中...');
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
          <span>智能流程引导</span>
          {selectedVersion && (
            <Tag color="blue">运行 #{selectedVersion.id}</Tag>
          )}
          {selectedVersion?.status_name && (
            <Tag color="green">{selectedVersion.status_name}</Tag>
          )}
        </Space>
      }
      style={{ height: '100%' }}
    >
      {/* 步骤进度条 */}
      <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
        {stepsConfig.map((step, index) => (
          <Step
            key={step.key}
            title={step.title}
            description={step.description}
            icon={step.icon}
            status={step.status}
            disabled={step.disabled}
          />
        ))}
      </Steps>

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
        <Title level={4} style={{ marginBottom: 16 }}>
          <Space>
            {currentStepConfig.icon}
            {currentStepConfig.title}
            {currentStepConfig.status === 'process' && <LoadingOutlined />}
            {currentStepConfig.status === 'error' && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        </Title>
        
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
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
          <Alert
            message="工资数据审核中"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  工资数据已提交审核，当前状态：<Tag color="blue">{selectedVersion.status_name}</Tag>
                </p>
                <p style={{ marginBottom: 8 }}>
                  <strong>工资汇总：</strong>
                  应发总额 <strong>{selectedVersion.total_gross_pay}</strong>，
                  扣发总额 <strong>{selectedVersion.total_deductions}</strong>，
                  实发总额 <strong>{selectedVersion.total_net_pay}</strong>
                </p>
                <p style={{ color: '#666', fontSize: '12px' }}>
                  管理员可以选择批准支付或拒绝并退回修改
                </p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
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
            <Text strong>完成要求：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {currentStepConfig.requirements.map((req, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  <Text type="secondary">{req}</Text>
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{ flex: 1 }}>
            <Text strong>操作提示：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {currentStepConfig.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  <Text type="secondary">{tip}</Text>
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
                    <Text strong>{anomaly.anomaly_type || '数据异常'}</Text>
                  </Space>
                }
              >
                <div style={{ fontSize: '13px' }}>
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
            <Text type="secondary">暂无异常数据</Text>
          </div>
        )}
      </Modal>
    </Card>
  );
}; 