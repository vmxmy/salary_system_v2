import React from 'react';
import { Typography, message } from 'antd';
import {
  SolutionOutlined,
  CalculatorOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@ant-design/pro-components';
import { StepsForm } from '@ant-design/pro-form';

// 导入新的钩子和组件
import { usePayrollWorkflow } from './hooks';
import { DataReviewStep } from './components/WorkflowSteps/DataReviewStep';
import { AutoCalculationStep } from './components/WorkflowSteps/AutoCalculationStep';
import { PayrollReviewStep } from './components/WorkflowSteps/PayrollReviewStep';

const { Title } = Typography;

// 定义工作流步骤的类型
interface WorkflowStepConfig {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const PayrollWorkflowPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  
  // 使用组合钩子
  const workflow = usePayrollWorkflow();

  // 定义工作流的各个阶段的配置
  const workflowStepConfigs: WorkflowStepConfig[] = [
    {
      key: 'salaryReview',
      title: t('payroll:workflow.steps.data_review.title', '薪资数据审核'),
      description: t('payroll:workflow.steps.data_review.description', '审核员工基础薪资、调整和变动记录'),
      icon: <SolutionOutlined />,
    },
    {
      key: 'salaryCalculation',
      title: t('payroll:workflow.steps.auto_calculation.title', '工资自动计算'),
      description: t('payroll:workflow.steps.auto_calculation.description', '系统根据预设规则和已审核数据执行计算'),
      icon: <CalculatorOutlined />,
    },
    {
      key: 'periodReview',
      title: t('payroll:workflow.steps.period_review.title', '工资周期复核'),
      description: t('payroll:workflow.steps.period_review.description', '复核整个工资周期的计算结果和报表'),
      icon: <AuditOutlined />,
    },
    {
      key: 'periodApproval',
      title: t('payroll:workflow.steps.period_approval.title', '工资周期批准'),
      description: t('payroll:workflow.steps.period_approval.description', '最终批准当前工资周期，准备发放'),
      icon: <CheckCircleOutlined />,
    },
    {
      key: 'payrollDistribution',
      title: t('payroll:workflow.steps.payroll_distribution.title', '工资发放与归档'),
      description: t('payroll:workflow.steps.payroll_distribution.description', '执行工资发放，生成工资条，并归档相关记录'),
      icon: <DollarCircleOutlined />,
    },
  ];

  return (
    <PageContainer 
      title={
        <Title level={4} style={{ margin: 0 }}>
          {t('payroll:workflow.page_title', '工资计算与发放工作流')}
        </Title>
      }
    >
      <StepsForm
        onFinish={async (values) => {
          console.log('整个工作流完成，数据:', values);
          message.success(t('payroll:workflow.messages.workflow_completed', '整个工资计算与发放流程已成功完成！'));
          return true;
        }}
        formProps={{
          validateMessages: {
            required: t('common:validations.required', '此项为必填项'),
          },
        }}
      >
        {/* Step 1: 薪资数据审核 */}
        <StepsForm.StepForm
          name={workflowStepConfigs[0].key}
          title={workflowStepConfigs[0].title}
          stepProps={{
            description: workflowStepConfigs[0].description,
            icon: workflowStepConfigs[0].icon,
          }}
          onFinish={async (values) => {
            if (!workflow.hasDataForCycleStep1 && workflow.selectedCycleForStep1) {
              message.error(t('payroll:workflow.steps.data_review.validation.must_initialize_data', 
                '请先初始化或导入当前周期的薪资数据，才能继续下一步'));
              return false;
            }
            console.log(`步骤 ${workflowStepConfigs[0].key} 完成，数据:`, values);
            message.success(t('payroll:workflow.messages.step_completed', 
              '步骤 "{stepTitle}" 已完成', { stepTitle: workflowStepConfigs[0].title }));
            return true;
          }}
        >
          <DataReviewStep workflow={workflow} />
        </StepsForm.StepForm>

        {/* Step 2: 工资自动计算 */}
        <StepsForm.StepForm
          name={workflowStepConfigs[1].key}
          title={workflowStepConfigs[1].title}
          stepProps={{
            description: workflowStepConfigs[1].description,
            icon: workflowStepConfigs[1].icon,
          }}
          onFinish={async (values) => {
            const calculationModules = values.calculationModules || [];
            const success = await workflow.handleStartCalculation(calculationModules);
            
            if (!success) {
              return false;
            }
            
            console.log(`步骤 ${workflowStepConfigs[1].key} 完成，数据:`, values);
            message.success(t('payroll:workflow.messages.step_completed', 
              '步骤 "{stepTitle}" 已完成', { stepTitle: workflowStepConfigs[1].title }));
            return true;
          }}
        >
          <AutoCalculationStep workflow={workflow} />
        </StepsForm.StepForm>

        {/* Step 3: 工资周期复核 */}
        <StepsForm.StepForm
          name={workflowStepConfigs[2].key}
          title={workflowStepConfigs[2].title}
          stepProps={{
            description: workflowStepConfigs[2].description,
            icon: workflowStepConfigs[2].icon,
          }}
           onFinish={async (values) => {
            console.log(`步骤 ${workflowStepConfigs[2].key} 完成，数据:`, values);
            message.success(t('payroll:workflow.messages.step_completed', 
              '步骤 "{stepTitle}" 已完成', { stepTitle: workflowStepConfigs[2].title }));
            return true;
          }}
        >
          <PayrollReviewStep workflow={workflow} />
        </StepsForm.StepForm>

        {/* Step 4: 工资周期批准 */}
        <StepsForm.StepForm
          name={workflowStepConfigs[3].key}
          title={workflowStepConfigs[3].title}
          stepProps={{
            description: workflowStepConfigs[3].description,
            icon: workflowStepConfigs[3].icon,
          }}
           onFinish={async (values) => {
            console.log(`步骤 ${workflowStepConfigs[3].key} 完成，数据:`, values);
            message.success(t('payroll:workflow.messages.step_completed', 
              '步骤 "{stepTitle}" 已完成', { stepTitle: workflowStepConfigs[3].title }));
            return true;
          }}
        >
          {/* TODO: 实现工资周期批准步骤组件 */}
          <div>工资周期批准步骤 - 待实现</div>
        </StepsForm.StepForm>

        {/* Step 5: 工资发放与归档 */}
        <StepsForm.StepForm
          name={workflowStepConfigs[4].key}
          title={workflowStepConfigs[4].title}
          stepProps={{
            description: workflowStepConfigs[4].description,
            icon: workflowStepConfigs[4].icon,
          }}
           onFinish={async (values) => {
            console.log(`步骤 ${workflowStepConfigs[4].key} 完成，数据:`, values);
            message.success(t('payroll:workflow.messages.step_completed', 
              '步骤 "{stepTitle}" 已完成', { stepTitle: workflowStepConfigs[4].title }));
            return true;
          }}
        >
          {/* TODO: 实现工资发放与归档步骤组件 */}
          <div>工资发放与归档步骤 - 待实现</div>
        </StepsForm.StepForm>
      </StepsForm>
    </PageContainer>
  );
};

export default PayrollWorkflowPage; 