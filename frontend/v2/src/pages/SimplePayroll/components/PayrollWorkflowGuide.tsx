import React, { useState, useEffect } from 'react';
import { Steps, Card, Button, Space, Alert, Typography, Tag, Progress, Divider } from 'antd';
import {
  FileTextOutlined,
  CalculatorOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  BankOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollRunResponse } from '../types/simplePayroll';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;

// 工作流步骤定义
export interface WorkflowStepConfig {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'wait' | 'process' | 'finish' | 'error';
  disabled: boolean;
  actions: WorkflowAction[];
  requirements: string[];
  tips: string[];
}

export interface WorkflowAction {
  key: string;
  label: string;
  type: 'primary' | 'default' | 'dashed' | 'link';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  onClick: () => void | Promise<void>;
}

interface PayrollWorkflowGuideProps {
  selectedVersion: PayrollRunResponse | null;
  onRefresh: () => void;
  onStepChange?: (stepKey: string) => void;
}

export const PayrollWorkflowGuide: React.FC<PayrollWorkflowGuideProps> = ({
  selectedVersion,
  onRefresh,
  onStepChange
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

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
        status: currentStepIndex > 0 ? 'finish' : currentStepIndex === 0 ? 'process' : 'wait',
        disabled: false,
        actions: [
          {
            key: 'import_data',
            label: '导入数据',
            type: 'primary',
            icon: <FileTextOutlined />,
            disabled: !selectedVersion,
            onClick: () => console.log('导入数据')
          },
          {
            key: 'review_data',
            label: '审核数据',
            type: 'default',
            disabled: !selectedVersion,
            onClick: () => console.log('审核数据')
          }
        ],
        requirements: [
          '确保员工基础信息完整',
          '薪资组件配置正确',
          '考勤数据准确无误'
        ],
        tips: [
          '建议先复制上月数据作为基础',
          '重点检查新入职和离职员工'
        ]
      },
      {
        key: 'audit_check',
        title: '审核检查',
        description: '执行自动审核和异常检测',
        icon: <AuditOutlined />,
        status: currentStepIndex > 1 ? 'finish' : currentStepIndex === 1 ? 'process' : 'wait',
        disabled: currentStepIndex < 1,
        actions: [
          {
            key: 'run_audit',
            label: '运行审核',
            type: 'primary',
            icon: <AuditOutlined />,
            disabled: currentStepIndex < 1,
            onClick: () => console.log('运行审核')
          },
          {
            key: 'fix_issues',
            label: '修复问题',
            type: 'default',
            disabled: currentStepIndex < 1,
            onClick: () => console.log('修复问题')
          }
        ],
        requirements: [
          '所有数据完整性检查通过',
          '计算规则验证无误',
          '异常数据已处理或忽略'
        ],
        tips: [
          '审核异常必须全部处理完成',
          '可以选择忽略非关键警告'
        ]
      },
      {
        key: 'approval_process',
        title: '审核批准',
        description: '提交审核并等待批准',
        icon: <CheckCircleOutlined />,
        status: currentStepIndex > 2 ? 'finish' : currentStepIndex === 2 ? 'process' : 'wait',
        disabled: currentStepIndex < 2,
        actions: [
          {
            key: 'submit_review',
            label: '提交审核',
            type: 'primary',
            icon: <CheckCircleOutlined />,
            disabled: currentStepIndex < 2,
            onClick: () => console.log('提交审核')
          }
        ],
        requirements: [
          '审核检查全部通过',
          '异常问题已解决',
          '数据准确性确认'
        ],
        tips: [
          '提交后将进入审批流程',
          '审批期间数据不可修改'
        ]
      },
      {
        key: 'payment_preparation',
        title: '支付准备',
        description: '生成支付文件和最终确认',
        icon: <BankOutlined />,
        status: currentStepIndex > 3 ? 'finish' : currentStepIndex === 3 ? 'process' : 'wait',
        disabled: currentStepIndex < 3,
        actions: [
          {
            key: 'generate_bank_file',
            label: '生成银行文件',
            type: 'primary',
            icon: <BankOutlined />,
            disabled: currentStepIndex < 3,
            onClick: () => console.log('生成银行文件')
          },
          {
            key: 'mark_paid',
            label: '标记已支付',
            type: 'default',
            disabled: currentStepIndex < 3,
            onClick: () => console.log('标记已支付')
          }
        ],
        requirements: [
          '审批流程已完成',
          '支付金额最终确认',
          '银行账户信息准确'
        ],
        tips: [
          '支付前请再次核对总金额',
          '确保银行账户余额充足'
        ]
      },
      {
        key: 'completion',
        title: '完成归档',
        description: '工资发放完成，数据归档',
        icon: <CheckCircleOutlined />,
        status: currentStepIndex >= 4 ? 'finish' : 'wait',
        disabled: currentStepIndex < 4,
        actions: [
          {
            key: 'archive_data',
            label: '归档数据',
            type: 'default',
            disabled: currentStepIndex < 4,
            onClick: () => console.log('归档数据')
          },
          {
            key: 'generate_reports',
            label: '生成报表',
            type: 'default',
            disabled: currentStepIndex < 4,
            onClick: () => console.log('生成报表')
          }
        ],
        requirements: [
          '工资发放已完成',
          '员工确认收到工资',
          '相关记录已保存'
        ],
        tips: [
          '归档后数据不可修改',
          '建议生成备份文件'
        ]
      }
    ];
  };

  const stepsConfig = getStepsConfig();
  const currentStepConfig = stepsConfig[currentStep];

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <span>工资流程引导</span>
          {selectedVersion && (
            <Tag color="blue">运行 #{selectedVersion.id}</Tag>
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

      {/* 当前步骤详情 */}
      {currentStepConfig && (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            {currentStepConfig.title}
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
          </Space>

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
      )}

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
    </Card>
  );
}; 