import React, { useState, useEffect } from 'react';
import { Typography, Alert, Progress, Tag, Button, Space, Row, Col, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { ProFormCheckbox } from '@ant-design/pro-form';
import type { ProColumns } from '@ant-design/pro-components';
import { EyeOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';

import type { UsePayrollWorkflowReturn } from '../../hooks/usePayrollWorkflow';
import type { PayrollEntry } from '../../types/payrollTypes';
// import type { PayrollCalculationProgress } from '../../services/payrollWorkflowApi';
type PayrollCalculationProgress = any; // 临时类型定义
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
    availablePeriods,
  } = workflow;

  // 明确类型注解以解决TypeScript推断问题
  const typedCalculationProgress: PayrollCalculationProgress | null = calculationProgress;

  // 获取当前选中周期的显示名称
  const [selectedPeriodName, setSelectedPeriodName] = useState<string | null>(null);
  
  // 加载周期名称
  useEffect(() => {
    const loadPeriodName = async () => {
      console.log('🔄 开始加载周期名称:', {
        selectedPeriodId,
        availablePeriodsLength: availablePeriods?.length || 0,
        availablePeriods: availablePeriods?.slice(0, 3).map(p => ({ id: p.id, name: p.name })) || []
      });
      
      if (!selectedPeriodId) {
        setSelectedPeriodName(null);
        return;
      }
      
      // 1. 首先尝试从 availablePeriods 中查找
      if (availablePeriods && availablePeriods.length > 0) {
        const period = availablePeriods.find(p => p.id === selectedPeriodId);
        console.log('🔍 在availablePeriods中查找周期:', { 
          selectedPeriodId, 
          foundPeriod: period ? { id: period.id, name: period.name } : null 
        });
        if (period?.name) {
          console.log('✅ 从availablePeriods获取到周期名称:', period.name);
          setSelectedPeriodName(period.name);
          return;
        }
      }
      
                   // 2. 如果 availablePeriods 没有数据，使用 apiClient 获取
      try {
        console.log(`🔍 通过API获取周期${selectedPeriodId}的名称...`);
        const { default: apiClient } = await import('../../../../api/apiClient');
        
        const periodResponse = await apiClient.get(`/payroll-periods/${selectedPeriodId}`);
        
        const periodName = periodResponse.data?.data?.name;
        console.log('✅ 获取到周期名称:', periodName);
        setSelectedPeriodName(periodName || `周期 #${selectedPeriodId}`);
      } catch (error) {
        console.error('❌ 获取周期名称失败:', error);
        setSelectedPeriodName(`周期 #${selectedPeriodId}`);
      }
    };
    
    loadPeriodName();
  }, [selectedPeriodId, availablePeriods]);

  // 加载预览数据
  useEffect(() => {
    if (selectedPeriodId && !typedCalculationProgress) {
      loadPreviewData();
    }
  }, [selectedPeriodId, calculationProgress]);

  // 计算完成后刷新数据
  useEffect(() => {
    if (typedCalculationProgress?.status === 'completed' && selectedPeriodId) {
      // 延迟刷新以确保数据已经更新
      setTimeout(() => {
        loadPreviewData();
      }, 1000);
    }
  }, [typedCalculationProgress?.status, selectedPeriodId]);

  /**
   * 加载薪资数据预览
   */
  const loadPreviewData = async () => {
    if (!selectedPeriodId) return;

    setPreviewLoading(true);
    try {
      console.log(`🔍 正在获取薪资周期 ${selectedPeriodId} 的预览数据...`);
      
      // 使用现有的 apiClient 而不是 fetch，避免认证和路径问题
      const { default: apiClient } = await import('../../../../api/apiClient');
      
      // 调试：检查认证状态
      const { store } = await import('../../../../store');
      const authState = store.getState().auth;
      console.log('🔐 认证状态检查:', {
        hasToken: !!authState.authToken,
        tokenLength: authState.authToken?.length,
        currentUser: authState.currentUser?.username,
        isLoadingUser: authState.isLoadingUser
      });
      
      if (!authState.authToken) {
        throw new Error('用户未登录或token已过期，请重新登录');
      }
      
      // 1. 先获取该周期的PayrollRuns
      console.log('📡 第一步：获取PayrollRuns...');
      console.log('📡 API请求详情:', {
        url: '/payroll-runs',
        params: { period_id: selectedPeriodId },
        authToken: authState.authToken?.substring(0, 20) + '...'
      });
      
      const runsResponse = await apiClient.get('/payroll-runs', {
        params: { period_id: selectedPeriodId }
      });
      
      if (!runsResponse.data?.data || runsResponse.data.data.length === 0) {
        console.log('⚠️ 当前周期下没有PayrollRun记录');
        setPreviewData([]);
        return;
      }
      
      // 2. 选择最新的PayrollRun（按运行日期倒序）
      const latestRun = runsResponse.data.data.sort((a: any, b: any) => 
        new Date(b.run_date).getTime() - new Date(a.run_date).getTime()
      )[0];
      
      console.log('📊 选择的PayrollRun:', latestRun);
      
      // 3. 获取该PayrollRun下的所有PayrollEntries
      console.log('📡 第二步：获取PayrollEntries...');
      const response = await apiClient.get('/payroll-entries', {
        params: {
          payroll_run_id: latestRun.id,
          include_employee_details: true,
          size: 100
        }
      });
      
      const apiResponse = response.data;
      const payrollEntries = apiResponse.data || [];
      
      console.log('📊 加载的薪资条目数据:', payrollEntries);
      console.log('📊 数据数量统计:', {
        entriesCount: payrollEntries.length,
        payrollRunId: latestRun.id,
        periodId: selectedPeriodId
      });

      // 转换API数据为预览格式
      const previewData: PayrollDataPreview[] = payrollEntries.map((entry: any) => {
        // 计算收入明细合计
        const totalEarnings = entry.earnings_details ? 
          Object.values(entry.earnings_details).reduce((sum: number, item: any) => 
            sum + (Number(item?.amount) || 0), 0) : 0;
        
        // 计算扣款明细合计
        const totalDeductions = entry.deductions_details ? 
          Object.values(entry.deductions_details).reduce((sum: number, item: any) => 
            sum + (Number(item?.amount) || 0), 0) : 0;

        const grossPay = totalEarnings;
        const netPay = grossPay - totalDeductions;

        // 从API数据中正确提取员工信息
        const employeeName = entry.employee ? 
          `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim() || '未知员工' 
          : '未知员工';
        
        const departmentName = entry.employee?.departmentName || 
          entry.employee?.current_department?.name || '未分配部门';
        
        const positionName = entry.employee?.actualPositionName || 
          entry.employee?.actual_position?.name || '未分配职位';

        return {
          id: entry.id,
          employee_name: employeeName,
          department_name: departmentName,
          position_name: positionName,
          base_salary: 0, // 基本工资需要从明细中提取
          allowances: totalEarnings, // 暂时用总收入表示
          deductions: totalDeductions,
          estimated_gross: grossPay,
          estimated_net: netPay
        };
      });

      setPreviewData(previewData);
      console.log(`✅ 成功加载 ${previewData.length} 条预览数据`);
      console.log('🎯 设置预览数据后的状态:', {
        previewDataLength: previewData.length,
        selectedPeriodId,
        selectedPeriodName
      });
    } catch (error) {
      console.error('❌ 加载预览数据失败:', error);
      // 如果API调用失败，可以设置空数据或使用模拟数据
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * 预览表格列定义
   */
  const previewColumns: ProColumns<PayrollDataPreview>[] = [
    {
      title: '员工信息',
      dataIndex: 'employee_name',
      width: 140,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.department_name}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>{record.position_name}</div>
        </div>
      )
    },
    {
      title: '收入明细合计',
      dataIndex: 'allowances',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const value = record.allowances || 0;
        return (
          <Text style={{ color: '#52c41a', fontWeight: 500 }}>
            ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '扣款明细合计',
      dataIndex: 'deductions',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const value = record.deductions || 0;
        return (
          <Text style={{ color: '#fa8c16', fontWeight: 500 }}>
            ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '计算前应发',
      dataIndex: 'estimated_gross',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const value = record.estimated_gross || 0;
        return (
          <Text style={{ color: '#1890ff' }}>
            ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '计算前实发',
      dataIndex: 'estimated_net',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const value = record.estimated_net || 0;
        return (
          <Text strong style={{ color: '#13c2c2' }}>
            ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '状态',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const hasData = record.estimated_gross > 0;
        
        if (typedCalculationProgress?.status === 'completed') {
          return <Tag color="success">已计算</Tag>;
        } else if (typedCalculationProgress?.status === 'processing') {
          return <Tag color="processing">计算中</Tag>;
        } else if (typedCalculationProgress?.status === 'failed') {
          return <Tag color="error">计算失败</Tag>;
        } else {
          return hasData ? (
            <Tag color="default">待计算</Tag>
          ) : (
            <Tag color="warning">无数据</Tag>
          );
        }
      }
    }
  ];

  return (
    <>
      {/* 计算参数概览 */}
      <ProCard title={t('payroll:workflow.steps.auto_calculation.params_title', '计算参数概览')} style={{ marginBottom: 24 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.selected_cycle', '选定周期')}>
            <Text>
              {(() => {
                const displayText = selectedPeriodName ? `${selectedPeriodName} (${previewData.length}人)` : t('common:status.not_selected', '未选择');
                console.log('🖥️ 渲染周期显示:', {
                  selectedPeriodName,
                  previewDataLength: previewData.length,
                  displayText
                });
                return displayText;
              })()}
            </Text>
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

      {/* 数据预览表格 */}
      {previewData.length > 0 && (
        <ProCard 
          title={typedCalculationProgress?.status === 'completed' ? "已完成合计计算的薪资数据" : "待计算薪资数据预览"}
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
              const totalEarnings = data.reduce((sum, item) => sum + item.allowances, 0);
              const totalDeductions = data.reduce((sum, item) => sum + item.deductions, 0);
              const totalGross = data.reduce((sum, item) => sum + item.estimated_gross, 0);
              const totalNet = data.reduce((sum, item) => sum + item.estimated_net, 0);
              const validCount = data.filter(item => item.estimated_gross > 0).length;
              
              return (
                <ProTable.Summary fixed>
                  <ProTable.Summary.Row>
                    <ProTable.Summary.Cell index={0}>
                      <Text strong>合计 ({validCount}/{data.length} 有效)</Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={1}>
                      <Text strong style={{ color: '#52c41a' }}>
                        ¥{totalEarnings.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={2}>
                      <Text strong style={{ color: '#fa8c16' }}>
                        ¥{totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={3}>
                      <Text strong style={{ color: '#1890ff' }}>
                        ¥{totalGross.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={4}>
                      <Text strong style={{ color: '#13c2c2' }}>
                        ¥{totalNet.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={5}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {typedCalculationProgress?.status === 'completed'
                          ? '✅ 合计计算已完成'
                          : typedCalculationProgress?.status === 'processing'
                            ? '⏳ 正在计算合计...'
                            : '⏸ 待执行合计计算'
                        }
                      </Text>
                    </ProTable.Summary.Cell>
                  </ProTable.Summary.Row>
                </ProTable.Summary>
              );
            }}
          />
        </ProCard>
      )}

      {/* 计算完成成功提示 */}
      {typedCalculationProgress?.status === 'completed' && (
        <Alert
          message="🎉 合计计算完成！"
          description={
            <div>
              <p>三项合计计算已成功完成，所有薪资记录的应发合计、扣款合计、实发合计都已重新计算并保存。</p>
              <div style={{ marginTop: 8, color: '#52c41a' }}>
                ✅ 应发合计 = 所有收入明细项目合计<br/>
                ✅ 扣款合计 = 所有扣款明细项目合计<br/>
                ✅ 实发合计 = 应发合计 - 扣款合计
              </div>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 计算进度显示 */}
      {typedCalculationProgress && typedCalculationProgress.status !== 'completed' && (
        <ProCard title={t('payroll:workflow.steps.auto_calculation.progress_title', '计算进度')} style={{ marginBottom: 24 }}>
          <Progress
            percent={typedCalculationProgress.progress_percentage}
            status={typedCalculationProgress?.status === 'failed' ? 'exception' : 'active'}
            format={(percent) => `${percent}% (${typedCalculationProgress.processed_employees}/${typedCalculationProgress.total_employees})`}
          />
          {typedCalculationProgress?.current_employee && (
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              {t('payroll:workflow.steps.auto_calculation.current_employee', '正在处理：')} {typedCalculationProgress.current_employee}
            </Text>
          )}
          {typedCalculationProgress?.estimated_remaining_time && (
            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
              {t('payroll:workflow.steps.auto_calculation.estimated_time', '预计剩余时间：')} {Math.ceil(typedCalculationProgress.estimated_remaining_time / 60)} 分钟
            </Text>
          )}
          
          {/* 计算状态详情 */}
          <ProDescriptions column={2} style={{ marginTop: 16 }}>
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.status', '计算状态')}>
              <Tag color={
                typedCalculationProgress?.status === 'failed' ? 'error' :
                typedCalculationProgress?.status === 'processing' ? 'processing' : 'success'
              }>
                {String(t(`payroll:workflow.steps.auto_calculation.status_${typedCalculationProgress?.status || 'unknown'}`, typedCalculationProgress?.status || '未知状态'))}
              </Tag>
            </ProDescriptions.Item>
            <ProDescriptions.Item label={t('payroll:workflow.steps.auto_calculation.task_id', '任务ID')}>
              <Text code>{typedCalculationProgress?.task_id}</Text>
            </ProDescriptions.Item>
          </ProDescriptions>
        </ProCard>
      )}

      {/* 计算引擎说明和操作 */}
      {!typedCalculationProgress && (
        <ProCard 
          title="🤖 智能合计计算引擎"
          extra={
            <Space>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={async () => {
                  console.log('🚀 开始薪资计算...');
                  message.loading('正在启动计算引擎...', 2);
                  
                  try {
                    // 检查是否有工作流，如果没有则自动创建
                    if (!workflow.currentPayrollRun && selectedPeriodId) {
                      console.log('🔄 当前没有工作流，自动启动工作流...');
                      message.loading('正在初始化工作流...', 1);
                      
                      // 启动工作流
                      if (workflow.startWorkflow) {
                        await workflow.startWorkflow(selectedPeriodId);
                        console.log('✅ 工作流启动成功');
                        
                        // 等待工作流启动完成
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      } else {
                        throw new Error('工作流启动功能不可用');
                      }
                    }
                    
                    // 执行计算
                    if (workflow.handleStartCalculation) {
                      const success = await workflow.handleStartCalculation(['summary']);
                      if (success) {
                        message.success('薪资计算已启动！');
                      } else {
                        message.error('薪资计算启动失败');
                      }
                    } else {
                      message.error('计算功能暂未实现');
                      console.log('🔍 可用的workflow方法:', Object.keys(workflow));
                    }
                  } catch (error: any) {
                    console.error('❌ 启动计算失败:', error);
                    message.error(`启动失败: ${error.message || '未知错误'}`);
                  }
                }}
                loading={typedCalculationProgress ? (typedCalculationProgress as PayrollCalculationProgress).status === 'processing' : false}
                size="large"
              >
                开始计算
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadPreviewData}
                loading={previewLoading}
              >
                刷新数据
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <div>
            <p>点击<strong>"开始计算"</strong>将启动智能合计计算。系统将基于已审核的薪资明细数据进行计算：</p>
            <Row gutter={[16, 8]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                  <div style={{ color: '#52c41a', fontWeight: 600, marginBottom: 4 }}>
                    💰 应发合计计算
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    汇总所有收入明细项目<br/>
                    （基本工资、岗位工资、津贴等）
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ padding: '12px', backgroundColor: '#fff7e6', borderRadius: '6px', border: '1px solid #ffd591' }}>
                  <div style={{ color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>
                    🏦 扣款合计计算
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    汇总所有扣款明细项目<br/>
                    （社保、公积金、个税等）
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '6px', border: '1px solid #91d5ff' }}>
                  <div style={{ color: '#1890ff', fontWeight: 600, marginBottom: 4 }}>
                    💎 实发合计计算
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    应发合计减去扣款合计<br/>
                    确保计算精度
                  </div>
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 16, padding: '8px 12px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
              <span style={{ color: '#52c41a' }}>💡 </span>
              <span style={{ fontSize: '13px' }}>
                计算过程完全基于已审核的明细数据，确保结果准确性和可追溯性
              </span>
            </div>
          </div>
        </ProCard>
      )}

      {/* 计算模块选择 */}
      <ProFormCheckbox.Group
        name="calculationModules"
        label={t('payroll:workflow.steps.auto_calculation.modules_label', '计算模块选择')}
        options={[
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_summary', '合计计算（应发、扣款、实发）'), 
            value: 'summary',
            disabled: typedCalculationProgress?.status === 'processing'
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_basic', '基本工资计算'), 
            value: 'basic',
            disabled: true // 暂时禁用
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_allowance', '津贴补贴计算'), 
            value: 'allowance',
            disabled: true // 暂时禁用
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_overtime', '加班费计算'), 
            value: 'overtime',
            disabled: true // 暂时禁用
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_social_insurance', '社保公积金计算'), 
            value: 'social_insurance',
            disabled: true // 暂时禁用
          },
          { 
            label: t('payroll:workflow.steps.auto_calculation.module_tax', '个人所得税计算'), 
            value: 'tax',
            disabled: true // 暂时禁用
          },
        ]}
        initialValue={['summary']}
        extra={
          <div>
            <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 4 }}>
              ✅ 合计计算：基于明细数据自动计算应发合计、扣款合计、实发合计
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              其他高级计算模块正在开发中，将在后续版本中开放使用
            </div>
          </div>
        }
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