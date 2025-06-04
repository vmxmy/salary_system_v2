import React, { useState, useEffect } from 'react';
import { Typography, Alert, Progress, Tag, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { ProFormCheckbox } from '@ant-design/pro-form';
import type { ProColumns } from '@ant-design/pro-components';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';

import type { UsePayrollWorkflowReturn } from '../../hooks/usePayrollWorkflow';
import type { PayrollEntry } from '../../types/payrollTypes';
import { CalculationResultSummary } from './CalculationResultSummary';

const { Text } = Typography;

interface AutoCalculationStepProps {
  workflow: UsePayrollWorkflowReturn;
}

interface PayrollDataPreview {
  id: number;
  employee_name: string;
  department_name: string;
  position_name: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  estimated_gross: number;
  estimated_net: number;
}

/**
 * 工资自动计算步骤组件
 * 集成薪资计算引擎，支持模块化计算和实时进度监控
 */
export const AutoCalculationStep: React.FC<AutoCalculationStepProps> = ({ workflow }) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [previewData, setPreviewData] = useState<PayrollDataPreview[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const {
    selectedPeriodId,
    currentPayrollRun,
    calculationProgress,
  } = workflow;

  // 加载预览数据
  useEffect(() => {
    if (selectedPeriodId && !calculationProgress) {
      loadPreviewData();
    }
  }, [selectedPeriodId, calculationProgress]);

  /**
   * 加载薪资数据预览
   */
  const loadPreviewData = async () => {
    if (!selectedPeriodId) return;

    setPreviewLoading(true);
    try {
      // 这里应该调用API获取预览数据
      // const response = await payrollWorkflowApi.getPayrollPreview(selectedPeriodId);
      
      // 模拟预览数据
      const mockPreviewData: PayrollDataPreview[] = [
        {
          id: 1,
          employee_name: '张三',
          department_name: '技术部',
          position_name: '软件工程师',
          base_salary: 12000,
          allowances: 3000,
          deductions: 2800,
          estimated_gross: 15000,
          estimated_net: 12200
        },
        {
          id: 2,
          employee_name: '李四',
          department_name: '技术部',
          position_name: '高级工程师',
          base_salary: 18000,
          allowances: 4000,
          deductions: 4200,
          estimated_gross: 22000,
          estimated_net: 17800
        },
        {
          id: 3,
          employee_name: '王五',
          department_name: '产品部',
          position_name: '产品经理',
          base_salary: 15000,
          allowances: 2500,
          deductions: 3300,
          estimated_gross: 17500,
          estimated_net: 14200
        }
      ];

      setPreviewData(mockPreviewData);
    } catch (error) {
      console.error('加载预览数据失败:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * 预览表格列定义
   */
  const previewColumns: ProColumns<PayrollDataPreview>[] = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      width: 100,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.department_name}</div>
        </div>
      )
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      width: 120
    },
    {
      title: '基本工资',
      dataIndex: 'base_salary',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '津贴补贴',
      dataIndex: 'allowances',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '预计扣除',
      dataIndex: 'deductions',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '预计应发',
      dataIndex: 'estimated_gross',
      width: 100,
      align: 'right',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '预计实发',
      dataIndex: 'estimated_net',
      width: 100,
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: '#52c41a' }}>
          ¥{value?.toLocaleString() || 0}
        </Text>
      )
    }
  ];

  return (
    <>
      {/* 计算参数概览 */}
      <ProCard title={t('payroll:workflow.steps.auto_calculation.params_title', '计算参数概览')} style={{ marginBottom: 24 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.selected_cycle', '选定周期')}>
            <Text>{selectedPeriodId ? `2025-04 (${previewData.length}人)` : t('common:status.not_selected', '未选择')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.employee_count', '参与员工数')}>
            {currentPayrollRun ? `${currentPayrollRun.total_employees || 0} ${t('common:units.people', '人')}` : `${previewData.length} ${t('common:units.people', '人')}`}
          </ProDescriptions.Item>
          {currentPayrollRun && (
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.run_id', '运行批次ID')}>
              <Tag color="blue">{currentPayrollRun.id}</Tag>
            </ProDescriptions.Item>
          )}
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.calculation_engine', '计算引擎')}>
            <Tag color="green">{t('payroll:workflow.steps.auto_calculation.engine_version', 'PayrollCalculationEngine v2.0')}</Tag>
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>

      {/* 数据预览表格 - 计算前显示 */}
      {!calculationProgress && previewData.length > 0 && (
        <ProCard 
          title="待计算薪资数据预览"
          extra={
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadPreviewData}
                loading={previewLoading}
                size="small"
              >
                刷新
              </Button>
              <Button 
                icon={<EyeOutlined />}
                type="primary"
                size="small"
              >
                查看详情
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <ProTable<PayrollDataPreview>
            dataSource={previewData}
            columns={previewColumns}
            loading={previewLoading}
            rowKey="id"
            search={false}
            pagination={false}
            size="small"
            scroll={{ x: 700 }}
            summary={(data) => {
              const totalGross = data.reduce((sum, item) => sum + item.estimated_gross, 0);
              const totalNet = data.reduce((sum, item) => sum + item.estimated_net, 0);
              const totalDeductions = data.reduce((sum, item) => sum + item.deductions, 0);
              
              return (
                <ProTable.Summary fixed>
                  <ProTable.Summary.Row>
                    <ProTable.Summary.Cell index={0} colSpan={5}>
                      <Text strong>合计</Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={5}>
                      <Text strong>¥{totalGross.toLocaleString()}</Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={6}>
                      <Text strong style={{ color: '#52c41a' }}>
                        ¥{totalNet.toLocaleString()}
                      </Text>
                    </ProTable.Summary.Cell>
                  </ProTable.Summary.Row>
                </ProTable.Summary>
              );
            }}
          />
        </ProCard>
      )}

      {/* 计算进度显示 */}
      {calculationProgress && (
        <ProCard title={t('payroll:workflow.steps.auto_calculation.progress_title', '计算进度')} style={{ marginBottom: 24 }}>
          <Progress 
            percent={calculationProgress.progress_percentage} 
            status={calculationProgress.status === 'failed' ? 'exception' : 'active'}
            format={(percent) => `${percent}% (${calculationProgress.processed_employees}/${calculationProgress.total_employees})`}
          />
          {calculationProgress.current_employee && (
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              {t('payroll:workflow.steps.auto_calculation.current_employee', '正在处理：')} {calculationProgress.current_employee}
            </Text>
          )}
          {calculationProgress.estimated_remaining_time && (
            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
              {t('payroll:workflow.steps.auto_calculation.estimated_time', '预计剩余时间：')} {Math.ceil(calculationProgress.estimated_remaining_time / 60)} 分钟
            </Text>
          )}
          
          {/* 计算状态详情 */}
          <ProDescriptions column={2} style={{ marginTop: 16 }}>
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.status', '计算状态')}>
              <Tag color={calculationProgress.status === 'completed' ? 'success' : calculationProgress.status === 'failed' ? 'error' : 'processing'}>
                {t(`payroll:workflow.steps.auto_calculation.status_${calculationProgress.status}`, calculationProgress.status)}
              </Tag>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.task_id', '任务ID')}>
              <Text code>{calculationProgress.task_id}</Text>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>
      )}

      {/* 计算引擎说明 */}
      {!calculationProgress && (
        <Alert 
          message={t('payroll:workflow.steps.auto_calculation.engine_info_title', '自动化薪资计算引擎')}
          description={
            <div>
              <p>{t('payroll:workflow.steps.auto_calculation.engine_info_desc', '点击"下一步"将启动自动化薪资计算引擎。系统将按照以下流程进行计算：')}</p>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>{t('payroll:workflow.steps.auto_calculation.engine_step_1', '1. 基础薪资计算：基本工资、岗位津贴、绩效奖金')}</li>
                <li>{t('payroll:workflow.steps.auto_calculation.engine_step_2', '2. 社保公积金计算：养老、医疗、失业、工伤、生育保险及住房公积金')}</li>
                <li>{t('payroll:workflow.steps.auto_calculation.engine_step_3', '3. 个人所得税计算：累进税率计算，支持专项附加扣除')}</li>
                <li>{t('payroll:workflow.steps.auto_calculation.engine_step_4', '4. 考勤数据集成：出勤统计、加班费用、请假扣款')}</li>
                <li>{t('payroll:workflow.steps.auto_calculation.engine_step_5', '5. 结果汇总验证：数据一致性检查和异常处理')}</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 计算模块选择 */}
      <ProFormCheckbox.Group
        name="calculationModules"
        label={t('payroll:workflow.steps.auto_calculation.modules_label', '计算模块选择')}
        options={[
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_basic', '基本工资计算'), 
            value: 'basic',
            disabled: calculationProgress?.status === 'processing'
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_allowance', '津贴补贴计算'), 
            value: 'allowance',
            disabled: calculationProgress?.status === 'processing'
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_overtime', '加班费计算'), 
            value: 'overtime',
            disabled: calculationProgress?.status === 'processing'
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_social_insurance', '社保公积金计算'), 
            value: 'social_insurance',
            disabled: calculationProgress?.status === 'processing'
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_tax', '个人所得税计算'), 
            value: 'tax',
            disabled: calculationProgress?.status === 'processing'
          },
        ]}
        initialValue={['basic', 'allowance', 'overtime', 'social_insurance', 'tax']}
        extra={t('payroll:workflow.steps.auto_calculation.modules_extra', '选择需要执行的计算模块。建议保持全选以确保计算结果的完整性。')}
      />

      {/* 计算结果汇总 - 仅在计算完成后显示 */}
      <CalculationResultSummary workflow={workflow} />

      {/* 计算引擎技术说明 */}
      <ProCard 
        title={t('payroll:workflow.steps.auto_calculation.technical_info_title', '计算引擎技术特性')} 
        style={{ marginTop: 24 }}
        size="small"
        type="inner"
      >
        <ProDescriptions column={1} size="small">
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_precision', '计算精度')}>
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_precision_desc', '使用Decimal类型确保金额计算精度，避免浮点数误差')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_async', '异步处理')}>
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_async_desc', '支持大批量员工数据的异步计算，提供实时进度反馈')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_validation', '数据验证')}>
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_validation_desc', '完整的输入验证和计算结果校验机制')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.tech_audit', '审计追踪')}>
            <Text type="secondary">{t('payroll:workflow.steps.auto_calculation.tech_audit_desc', '详细的计算日志和操作审计，支持问题追溯')}</Text>
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
    </>
  );
}; 