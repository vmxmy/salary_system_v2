import React, { useState, useEffect } from 'react';
import { Typography, Space, Button, Alert, Spin, Tag, message, Tooltip, Modal, Form, Input, InputNumber, Card, Row, Col } from 'antd';
import { CopyOutlined, UploadOutlined, EyeOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { ProFormTextArea, ProFormRadio } from '@ant-design/pro-form';
import type { ProColumns } from '@ant-design/pro-components';

import type { UsePayrollWorkflowReturn } from '../../hooks/usePayrollWorkflow';
import type { PayrollEntry } from '../../types/payrollTypes';
import PayrollPeriodSelector from '../../../../components/common/PayrollPeriodSelector';
import apiClient from '../../../../api/apiClient';
// import { WORKFLOW_STEPS } from '../../services/payrollWorkflowStatusService';
const WORKFLOW_STEPS = {}; // 临时定义

// 简单的货币格式化函数
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const { Text } = Typography;

interface DataReviewStepProps {
  workflow: UsePayrollWorkflowReturn;
}

interface PayrollDataForReview extends PayrollEntry {
  // 添加审核相关字段
  data_completeness?: 'complete' | 'incomplete' | 'warning';
  validation_status?: 'valid' | 'invalid' | 'pending';
  validation_notes?: string;
  last_updated?: string;
  department_name?: string;
  position_name?: string;
}

/**
 * 薪资数据审核步骤组件
 */
export const DataReviewStep: React.FC<DataReviewStepProps> = ({ workflow }) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [reviewData, setReviewData] = useState<PayrollDataForReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [dataStats, setDataStats] = useState({
    total: 0,
    complete: 0,
    incomplete: 0,
    warning: 0
  });
  
  // 分页状态管理
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `第 ${range[0]}-${range[1]} 条/共 ${total} 条记录`,
    pageSizeOptions: ['10', '20', '50', '100'],
    onChange: (page: number, size: number) => {
      setPagination(prev => ({ ...prev, current: page, pageSize: size }));
    },
    onShowSizeChange: (current: number, size: number) => {
      setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
    }
  });

  // 编辑状态管理
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollDataForReview | null>(null);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);
  
  // 编辑表单中的计算值
  const [calculatedSummary, setCalculatedSummary] = useState({
    grossPay: 0,
    totalDeductions: 0,
    netPay: 0
  });

  const {
    selectedPeriodId,
    hasDataForCycleStep1,
    isLoadingDataStep1,
    setSelectedPeriodId,
    checkDataForCycleStep1,
    handleCopyLastMonthDataStep1,
    handleNavigateToBulkImportStep1,
  } = workflow;

  // 加载审核数据
  useEffect(() => {
    if (selectedPeriodId && hasDataForCycleStep1) {
      loadReviewData();
    }
  }, [selectedPeriodId, hasDataForCycleStep1]);

  /**
   * 加载审核数据
   */
  const loadReviewData = async () => {
    if (!selectedPeriodId) return;

    setReviewLoading(true);
    try {
      console.log(`🔍 正在获取薪资周期 ${selectedPeriodId} 的数据...`);
      console.log('🔍 周期参数详情:', {
        selectedPeriodId,
        type: typeof selectedPeriodId,
        isNumber: Number.isInteger(selectedPeriodId),
        stringValue: String(selectedPeriodId)
      });
      
      // 1. 先获取该薪资周期下的所有PayrollRuns
      console.log('📡 第一步：获取PayrollRuns...');
      const runsResponse = await apiClient.get('/payroll-runs', {
        params: {
          period_id: selectedPeriodId,
          size: 100,
          page: 1
        }
      });
      
      console.log('🔍 PayrollRuns响应:', runsResponse.data);
      
      const runsData = runsResponse.data?.data || [];
      if (runsData.length === 0) {
        console.log('⚠️ 该薪资周期暂无PayrollRun数据');
        setReviewData([]);
        setDataStats({ total: 0, complete: 0, incomplete: 0, warning: 0 });
        setPagination(prev => ({ ...prev, total: 0, current: 1 }));
        return;
      }
      
      // 2. 选择最新的PayrollRun（按run_date降序，取第一个）
      const sortedRuns = runsData.sort((a: any, b: any) => 
        new Date(b.run_date || b.created_at).getTime() - new Date(a.run_date || a.created_at).getTime()
      );
      const latestRun = sortedRuns[0];
      
      console.log('📊 选择最新的PayrollRun:', {
        runId: latestRun.id,
        runDate: latestRun.run_date,
        status: latestRun.status_lookup_value_id
      });
      
      // 3. 获取该PayrollRun下的所有PayrollEntries
      console.log('📡 第二步：获取PayrollEntries...');
      console.log('📡 API请求参数:', {
        url: '/payroll-entries',
        params: {
          payroll_run_id: latestRun.id,  // 使用payroll_run_id而不是period_id
          include_employee_details: true,
          include_payroll_period: true,
          size: 100,
          page: 1
        }
      });
      
      const response = await apiClient.get('/payroll-entries', {
        params: {
          payroll_run_id: latestRun.id,  // 使用payroll_run_id而不是period_id
          include_employee_details: true,
          include_payroll_period: true,
          size: 100,
          page: 1
        }
      });
      
      const apiResponse = response.data;
      const payrollEntries = apiResponse.data || [];
      
      console.log('🔍 API响应数据:', apiResponse);
      console.log('📊 薪资条目数据:', payrollEntries);
      console.log(`📈 API返回 ${payrollEntries.length} 条记录`);

      // 转换API数据为审核数据格式
      const reviewData: PayrollDataForReview[] = payrollEntries.map((entry: any) => {
        // 智能计算实际金额，确保正确处理字符串格式的数字
        const grossAmount = Number(entry.gross_pay) > 0 ? Number(entry.gross_pay) : 
          (entry.earnings_details ? Object.values(entry.earnings_details).reduce((sum: number, item: any) => 
            sum + (Number(item?.amount) || 0), 0) : 0);
        
        const deductionsAmount = Number(entry.total_deductions) > 0 ? Number(entry.total_deductions) :
          (entry.deductions_details ? Object.values(entry.deductions_details).reduce((sum: number, item: any) => 
            sum + (Number(item?.amount) || 0), 0) : 0);

        const netAmount = grossAmount - deductionsAmount;

        // 根据计算后的数据完整性判断状态
        let data_completeness: 'complete' | 'incomplete' | 'warning' = 'complete';
        let validation_status: 'valid' | 'invalid' | 'pending' = 'valid';
        let validation_notes = '';

        // 从API数据中正确提取员工信息
        const employeeName = entry.employee ? 
          `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim() || '未知员工' 
          : '未知员工';

        // 检查基础数据完整性
        if (!employeeName || employeeName === '未知员工' || grossAmount <= 0) {
          data_completeness = 'incomplete';
          validation_status = 'invalid';
          validation_notes = '基础薪资数据不完整';
        } else if (!entry.earnings_details || Object.keys(entry.earnings_details).length === 0) {
          data_completeness = 'warning';
          validation_status = 'pending';
          validation_notes = '薪资组件详情缺失';
        } else if (netAmount <= 0) {
          data_completeness = 'warning';
          validation_status = 'pending';
          validation_notes = '实发合计异常';
        }
        
        const departmentName = entry.employee?.departmentName || 
          entry.employee?.current_department?.name || '未分配部门';
        
        const positionName = entry.employee?.actualPositionName || 
          entry.employee?.actual_position?.name || '未分配职位';

        return {
          ...entry,
          employee_name: employeeName,
          department_name: departmentName,
          position_name: positionName,
          data_completeness,
          validation_status,
          validation_notes,
          last_updated: entry.updated_at || entry.created_at || new Date().toISOString()
        };
      });

      setReviewData(reviewData);
      
      // 计算统计信息
      const stats = {
        total: reviewData.length,
        complete: reviewData.filter(item => item.data_completeness === 'complete').length,
        incomplete: reviewData.filter(item => item.data_completeness === 'incomplete').length,
        warning: reviewData.filter(item => item.data_completeness === 'warning').length
      };
      setDataStats(stats);
      
      // 更新分页总数，但保持当前页码（除非超出范围）
      setPagination(prev => {
        const maxPage = Math.ceil(reviewData.length / prev.pageSize) || 1;
        const currentPage = prev.current > maxPage ? 1 : prev.current;
        return {
          ...prev, 
          total: reviewData.length,
          current: currentPage
        };
      });

      console.log(`✅ 加载薪资审核数据成功: ${reviewData.length} 条记录`);
      console.log('📊 数据统计:', {
        total: reviewData.length,
        payrollRunId: latestRun.id,
        payrollRunStatus: latestRun.status_lookup_value_id
      });
      
      if (reviewData.length === 0) {
        console.log('⚠️ 当前PayrollRun暂无数据，可能需要先导入或复制数据');
      }
    } catch (error: any) {
      const errorMessage = error.message || '未知错误';
      message.error(`加载审核数据失败: ${errorMessage}`);
      console.error('❌ 加载审核数据失败:', error);
      console.error('🔍 错误详情:', {
        selectedPeriodId,
        hasDataForCycleStep1,
        errorMessage,
        stack: error.stack
      });
      
      // 如果API调用失败，设置空数据
      setReviewData([]);
      setDataStats({ total: 0, complete: 0, incomplete: 0, warning: 0 });
      setPagination(prev => ({ ...prev, total: 0, current: 1 }));
    } finally {
      setReviewLoading(false);
    }
  };

  // 处理薪资周期选择变化
  const handlePeriodChange = (periodId: number | null) => {
    console.log('🔄 周期选择变化:', { 
      selectedPeriodId: periodId, 
      type: typeof periodId,
      isNumber: Number.isInteger(periodId)
    });
    setSelectedPeriodId(periodId);
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, current: 1 }));
    if (periodId) {
      checkDataForCycleStep1(periodId);
    }
  };

  /**
   * 打开编辑模态框
   */
  const handleEditRecord = (record: PayrollDataForReview) => {
    console.log('🖊️ 编辑薪资记录详情:', {
      employee_name: record.employee_name,
      earnings_details: record.earnings_details,
      deductions_details: record.deductions_details,
      earnings_count: record.earnings_details ? Object.keys(record.earnings_details).length : 0,
      deductions_count: record.deductions_details ? Object.keys(record.deductions_details).length : 0
    });
    
    setEditingRecord(record);
    
    // 填充表单数据（不包含汇总字段，因为汇总字段由系统计算）
    const formData: Record<string, any> = {
      employee_name: record.employee_name,
      department_name: record.department_name,
      position_name: record.position_name,
      validation_notes: record.validation_notes || '',
    };
    
    // 填充收入明细
    if (record.earnings_details) {
      Object.entries(record.earnings_details).forEach(([code, item]: [string, any]) => {
        formData[`earnings_${code}`] = Number(item.amount) || 0;
      });
    }
    
    // 填充扣款明细
    if (record.deductions_details) {
      Object.entries(record.deductions_details).forEach(([code, item]: [string, any]) => {
        formData[`deductions_${code}`] = Number(item.amount) || 0;
      });
    }
    
    editForm.setFieldsValue(formData);
    
    console.log('📋 表单填充数据:', formData);
    
    // 初始化计算汇总 - 延迟执行确保表单已更新
    setTimeout(() => {
      const summary = calculateEditFormSummary();
      console.log('💰 初始化汇总计算:', summary);
      console.log('📊 表单当前值:', editForm.getFieldsValue());
    }, 200);
    
    setEditModalVisible(true);
  };

  /**
   * 关闭编辑模态框
   */
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
  };

  /**
   * 保存编辑的薪资记录
   */
  const handleSaveEdit = async (values: any) => {
    if (!editingRecord) return;
    
    setEditLoading(true);
    try {
      console.log('💾 保存编辑的薪资记录:', values);
      
      // 重新计算汇总值以确保准确性
      const finalSummary = calculateEditFormSummary();
      
      // 构建更新数据（使用系统计算的汇总值）
      const updateData: Record<string, any> = {
        id: editingRecord.id,
        gross_pay: finalSummary.grossPay,
        total_deductions: finalSummary.totalDeductions,
        net_pay: finalSummary.netPay,
        validation_notes: values.validation_notes,
        earnings_details: {} as Record<string, any>,
        deductions_details: {} as Record<string, any>
      };
      
      // 收集收入明细数据
      Object.keys(values).forEach(key => {
        if (key.startsWith('earnings_')) {
          const code = key.replace('earnings_', '');
          const originalDetails = editingRecord.earnings_details as Record<string, any>;
          const originalItem = originalDetails?.[code];
          if (originalItem) {
            (updateData.earnings_details as Record<string, any>)[code] = {
              ...originalItem,
              amount: values[key]
            };
          }
        }
      });
      
      // 收集扣款明细数据
      Object.keys(values).forEach(key => {
        if (key.startsWith('deductions_')) {
          const code = key.replace('deductions_', '');
          const originalDetails = editingRecord.deductions_details as Record<string, any>;
          const originalItem = originalDetails?.[code];
          if (originalItem) {
            (updateData.deductions_details as Record<string, any>)[code] = {
              ...originalItem,
              amount: values[key]
            };
          }
        }
      });
      
      // 调用API更新薪资记录
      const response = await apiClient.put(`/payroll-entries/${editingRecord.id}`, updateData);
      
      if (response.status === 200) {
        message.success('薪资记录更新成功');
        handleCloseEditModal();
        // 重新加载数据
        await loadReviewData();
      }
    } catch (error: any) {
      console.error('❌ 保存薪资记录失败:', error);
      message.error(`保存失败: ${error.message || '未知错误'}`);
    } finally {
      setEditLoading(false);
    }
  };

  /**
   * 获取数据完整性标签颜色
   */
  const getCompletenessColor = (status: string) => {
    switch (status) {
      case 'complete': return 'green';
      case 'warning': return 'orange';
      case 'incomplete': return 'red';
      default: return 'default';
    }
  };

  /**
   * 获取数据完整性标签文本
   */
  const getCompletenessText = (status: string) => {
    switch (status) {
      case 'complete': return '完整';
      case 'warning': return '警告';
      case 'incomplete': return '不完整';
      default: return '未知';
    }
  };

  /**
   * 获取验证状态标签颜色
   */
  const getValidationColor = (status: string) => {
    switch (status) {
      case 'valid': return 'green';
      case 'pending': return 'orange';
      case 'invalid': return 'red';
      default: return 'default';
    }
  };

  /**
   * 获取验证状态标签文本
   */
  const getValidationText = (status: string) => {
    switch (status) {
      case 'valid': return '有效';
      case 'pending': return '待验证';
      case 'invalid': return '无效';
      default: return '未知';
    }
  };

  /**
   * 渲染收入明细（基于API数据动态排序）
   */
  const renderEarningsDetails = (earnings_details: any) => {
    if (!earnings_details || Object.keys(earnings_details).length === 0) {
      return <Text type="secondary">无收入明细</Text>;
    }

    // 基于API返回的数据动态排序
    const sortedEarnings = Object.entries(earnings_details)
      .map(([code, item]: [string, any]) => ({
        code,
        item,
        // 使用API返回的display_order或sort_order，如果没有则使用默认值999
        order: item.display_order ?? item.sort_order ?? item.order ?? 999,
        // 使用API返回的name，如果没有则使用code
        displayName: item.name || item.display_name || code
      }))
      .sort((a, b) => {
        // 首先按order排序，如果order相同则按名称排序
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.displayName.localeCompare(b.displayName, 'zh-CN');
      });

    const earningsItems = sortedEarnings.map(({ code, item, displayName }) => {
      const amount = Number(item.amount) || 0;
      const tooltipTitle = `代码: ${code}${item.description ? `\n说明: ${item.description}` : ''}`;
      
      return (
        <Tooltip key={code} title={tooltipTitle} placement="left">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, cursor: 'help' }}>
            <Text 
              style={{ 
                fontSize: '11px', 
                maxWidth: '120px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName}
            </Text>
            <Text style={{ fontSize: '11px', fontWeight: 500, color: amount > 0 ? '#52c41a' : '#999' }}>
              ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </Text>
          </div>
        </Tooltip>
      );
    });

    return (
      <div style={{ maxWidth: 220 }}>
        {earningsItems.length > 0 ? earningsItems : (
          <Text type="secondary" style={{ fontSize: '11px' }}>暂无收入项目</Text>
        )}
      </div>
    );
  };

  /**
   * 渲染扣款明细（基于API数据动态排序）
   */
  const renderDeductionsDetails = (deductions_details: any) => {
    if (!deductions_details || Object.keys(deductions_details).length === 0) {
      return <Text type="secondary">无扣款明细</Text>;
    }

    // 基于API返回的数据动态排序
    const sortedDeductions = Object.entries(deductions_details)
      .map(([code, item]: [string, any]) => ({
        code,
        item,
        // 使用API返回的display_order或sort_order，如果没有则使用默认值999
        order: item.display_order ?? item.sort_order ?? item.order ?? 999,
        // 使用API返回的name，如果没有则使用code
        displayName: item.name || item.display_name || code
      }))
      .sort((a, b) => {
        // 首先按order排序，如果order相同则按名称排序
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.displayName.localeCompare(b.displayName, 'zh-CN');
      });

    const deductionsItems = sortedDeductions.map(({ code, item, displayName }) => {
      const amount = Number(item.amount) || 0;
      const tooltipTitle = `代码: ${code}${item.description ? `\n说明: ${item.description}` : ''}`;
      
      return (
        <Tooltip key={code} title={tooltipTitle} placement="left">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, cursor: 'help' }}>
            <Text 
              style={{ 
                fontSize: '11px', 
                maxWidth: '120px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName}
            </Text>
            <Text style={{ fontSize: '11px', fontWeight: 500, color: amount > 0 ? '#fa8c16' : '#999' }}>
              ¥{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </Text>
          </div>
        </Tooltip>
      );
    });

    return (
      <div style={{ maxWidth: 220 }}>
        {deductionsItems.length > 0 ? deductionsItems : (
          <Text type="secondary" style={{ fontSize: '11px' }}>暂无扣款项目</Text>
        )}
      </div>
    );
  };

  /**
   * 计算单条记录的应发合计
   */
  const calculateGrossPay = (record: PayrollDataForReview): number => {
    // 首先尝试使用API返回的gross_pay字段
    let grossAmount = Number(record.gross_pay) || 0;
    
    // 如果gross_pay为0，则从earnings_details计算
    if (grossAmount === 0 && record.earnings_details) {
      grossAmount = Object.values(record.earnings_details).reduce((sum, item: any) => {
        const amount = Number(item?.amount) || 0;
        return sum + amount;
      }, 0);
    }
    
    return grossAmount;
  };

  /**
   * 计算单条记录的总扣款
   */
  const calculateTotalDeductions = (record: PayrollDataForReview): number => {
    // 首先尝试使用API返回的total_deductions字段
    let deductionsAmount = Number(record.total_deductions) || 0;
    
    // 如果total_deductions为0，则从deductions_details计算
    if (deductionsAmount === 0 && record.deductions_details) {
      deductionsAmount = Object.values(record.deductions_details).reduce((sum, item: any) => {
        const amount = Number(item?.amount) || 0;
        return sum + amount;
      }, 0);
    }
    
    return deductionsAmount;
  };

  /**
   * 计算单条记录的实发合计
   */
  const calculateNetPay = (record: PayrollDataForReview): number => {
    const grossAmount = calculateGrossPay(record);
    const deductionsAmount = calculateTotalDeductions(record);
    return grossAmount - deductionsAmount;
  };

  // 编辑表单实时计算函数
  const calculateEditFormSummary = () => {
    const formValues = editForm.getFieldsValue();
    console.log('🧮 开始计算汇总 - 表单值:', formValues);
    console.log('🧮 编辑记录明细:', {
      earnings: editingRecord?.earnings_details,
      deductions: editingRecord?.deductions_details
    });
    
    // 直接从表单字段中计算，不依赖editingRecord状态
    let grossPay = 0;
    let totalDeductions = 0;
    const earningsDebug: any[] = [];
    const deductionsDebug: any[] = [];
    
    // 遍历表单所有字段
    Object.keys(formValues).forEach(fieldName => {
      const value = formValues[fieldName];
      const numValue = Number(value) || 0;
      
      if (fieldName.startsWith('earnings_') && value != null && !isNaN(value)) {
        const code = fieldName.replace('earnings_', '');
        earningsDebug.push({ code, fieldName, value, numValue });
        grossPay += numValue;
      } else if (fieldName.startsWith('deductions_') && value != null && !isNaN(value)) {
        const code = fieldName.replace('deductions_', '');
        deductionsDebug.push({ code, fieldName, value, numValue });
        totalDeductions += numValue;
      }
    });
    
    console.log('💰 收入计算详情:', earningsDebug, '总额:', grossPay);
    console.log('📉 扣款计算详情:', deductionsDebug, '总额:', totalDeductions);
    
    // 计算实发合计
    const netPay = Math.max(0, grossPay - totalDeductions);
    
    const newSummary = {
      grossPay: Number(grossPay.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netPay: Number(netPay.toFixed(2))
    };
    
    console.log('✅ 最终汇总结果:', newSummary);
    setCalculatedSummary(newSummary);
    return newSummary;
  };

  /**
   * 审核表格列定义
   */
  const reviewColumns: ProColumns<PayrollDataForReview>[] = [
    {
      title: '员工信息',
      dataIndex: 'employee_name',
      width: 140,
      fixed: 'left',
      sorter: (a, b) => (a.employee_name || '').localeCompare(b.employee_name || '', 'zh-CN'),
      filters: Array.from(new Set(reviewData.map(item => item.department_name).filter(Boolean)))
        .map(dept => ({ text: dept!, value: dept! })),
      onFilter: (value, record) => record.department_name === value,
      filterSearch: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.employee_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.department_name}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>{record.position_name}</div>
        </div>
      )
    },
    {
      title: '收入明细',
      dataIndex: 'earnings_details',
      width: 240,
      sorter: (a, b) => {
        const aCount = a.earnings_details ? Object.keys(a.earnings_details).length : 0;
        const bCount = b.earnings_details ? Object.keys(b.earnings_details).length : 0;
        return aCount - bCount;
      },
      filters: [
        { text: '有收入项目', value: 'has_earnings' },
        { text: '无收入项目', value: 'no_earnings' },
      ],
      onFilter: (value, record) => {
        const hasEarnings = record.earnings_details && Object.keys(record.earnings_details).length > 0;
        return value === 'has_earnings' ? hasEarnings : !hasEarnings;
      },
      render: (_, record) => renderEarningsDetails(record.earnings_details)
    },
    {
      title: '应发合计',
      dataIndex: 'gross_pay',
      width: 110,
      align: 'right',
      sorter: (a, b) => calculateGrossPay(a) - calculateGrossPay(b),
      filters: [
        { text: '≥ 10,000', value: 'high' },
        { text: '5,000 - 9,999', value: 'medium' },
        { text: '1,000 - 4,999', value: 'low' },
        { text: '< 1,000', value: 'very_low' },
        { text: '= 0', value: 'zero' },
      ],
      onFilter: (value, record) => {
        const amount = calculateGrossPay(record);
        switch (value) {
          case 'high': return amount >= 10000;
          case 'medium': return amount >= 5000 && amount < 10000;
          case 'low': return amount >= 1000 && amount < 5000;
          case 'very_low': return amount > 0 && amount < 1000;
          case 'zero': return amount === 0;
          default: return true;
        }
      },
      render: (_, record) => {
        const grossAmount = calculateGrossPay(record);
        return (
          <Text strong={grossAmount > 0} style={{ color: grossAmount > 0 ? '#52c41a' : '#999' }}>
            ¥{grossAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '扣款明细',
      dataIndex: 'deductions_details',
      width: 240,
      sorter: (a, b) => {
        const aCount = a.deductions_details ? Object.keys(a.deductions_details).length : 0;
        const bCount = b.deductions_details ? Object.keys(b.deductions_details).length : 0;
        return aCount - bCount;
      },
      filters: [
        { text: '有扣款项目', value: 'has_deductions' },
        { text: '无扣款项目', value: 'no_deductions' },
      ],
      onFilter: (value, record) => {
        const hasDeductions = record.deductions_details && Object.keys(record.deductions_details).length > 0;
        return value === 'has_deductions' ? hasDeductions : !hasDeductions;
      },
      render: (_, record) => renderDeductionsDetails(record.deductions_details)
    },
    {
      title: '扣款合计',
      dataIndex: 'total_deductions',
      width: 110,
      align: 'right',
      sorter: (a, b) => calculateTotalDeductions(a) - calculateTotalDeductions(b),
      filters: [
        { text: '≥ 2,000', value: 'high' },
        { text: '1,000 - 1,999', value: 'medium' },
        { text: '500 - 999', value: 'low' },
        { text: '< 500', value: 'very_low' },
        { text: '= 0', value: 'zero' },
      ],
      onFilter: (value, record) => {
        const amount = calculateTotalDeductions(record);
        switch (value) {
          case 'high': return amount >= 2000;
          case 'medium': return amount >= 1000 && amount < 2000;
          case 'low': return amount >= 500 && amount < 1000;
          case 'very_low': return amount > 0 && amount < 500;
          case 'zero': return amount === 0;
          default: return true;
        }
      },
      render: (_, record) => {
        const deductionsAmount = calculateTotalDeductions(record);
        return (
          <Text style={{ color: deductionsAmount > 0 ? '#fa8c16' : '#999' }}>
            ¥{deductionsAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '实发合计',
      dataIndex: 'net_pay',
      width: 110,
      align: 'right',
      sorter: (a, b) => calculateNetPay(a) - calculateNetPay(b),
      defaultSortOrder: 'descend', // 默认按实发合计降序排列
      filters: [
        { text: '≥ 8,000', value: 'high' },
        { text: '5,000 - 7,999', value: 'medium' },
        { text: '2,000 - 4,999', value: 'low' },
        { text: '< 2,000', value: 'very_low' },
        { text: '≤ 0', value: 'zero_or_negative' },
      ],
      onFilter: (value, record) => {
        const amount = calculateNetPay(record);
        switch (value) {
          case 'high': return amount >= 8000;
          case 'medium': return amount >= 5000 && amount < 8000;
          case 'low': return amount >= 2000 && amount < 5000;
          case 'very_low': return amount > 0 && amount < 2000;
          case 'zero_or_negative': return amount <= 0;
          default: return true;
        }
      },
      render: (_, record) => {
        const netAmount = calculateNetPay(record);
        return (
          <Text strong style={{ color: netAmount > 0 ? '#1890ff' : '#999' }}>
            ¥{netAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        );
      }
    },
    {
      title: '数据完整性',
      dataIndex: 'data_completeness',
      width: 120,
      sorter: (a, b) => {
        const order = { 'complete': 3, 'warning': 2, 'incomplete': 1 };
        const aVal = order[a.data_completeness as keyof typeof order] || 0;
        const bVal = order[b.data_completeness as keyof typeof order] || 0;
        return aVal - bVal;
      },
      filters: [
        { text: '完整', value: 'complete' },
        { text: '警告', value: 'warning' },
        { text: '不完整', value: 'incomplete' },
      ],
      onFilter: (value, record) => record.data_completeness === value,
      render: (_, record) => (
        <div>
          <Tag color={getCompletenessColor(record.data_completeness || 'incomplete')}>
            {getCompletenessText(record.data_completeness || 'incomplete')}
          </Tag>
          {record.validation_notes && (
            <Tooltip title={record.validation_notes}>
              <ExclamationCircleOutlined style={{ color: '#fa8c16', marginLeft: 4 }} />
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '验证状态',
      dataIndex: 'validation_status',
      width: 100,
      sorter: (a, b) => {
        const order = { 'valid': 3, 'pending': 2, 'invalid': 1 };
        const aVal = order[a.validation_status as keyof typeof order] || 0;
        const bVal = order[b.validation_status as keyof typeof order] || 0;
        return aVal - bVal;
      },
      filters: [
        { text: '有效', value: 'valid' },
        { text: '待验证', value: 'pending' },
        { text: '无效', value: 'invalid' },
      ],
      onFilter: (value, record) => record.validation_status === value,
      render: (_, record) => (
        <Tag color={getValidationColor(record.validation_status || 'pending')}>
          {getValidationText(record.validation_status || 'pending')}
        </Tag>
      )
    },
    {
      title: '最后更新',
      dataIndex: 'last_updated',
      width: 140,
      sorter: (a, b) => {
        const aTime = a.last_updated ? new Date(a.last_updated).getTime() : 0;
        const bTime = b.last_updated ? new Date(b.last_updated).getTime() : 0;
        return aTime - bTime;
      },
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {record.last_updated ? new Date(record.last_updated).toLocaleString() : '-'}
        </Text>
      )
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑记录">
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditRecord(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 计算汇总统计
  const calculateSummaryStats = (data: readonly PayrollDataForReview[]) => {
    // 过滤有效数据（非空、有员工信息的记录）
    const validData = data.filter(entry => {
      const grossAmount = calculateGrossPay(entry);
      return entry.employee && 
             entry.employee.id && 
             grossAmount > 0;
    });

    const stats = validData.reduce((acc, entry) => {
      // 使用统一的计算函数
      const grossAmount = calculateGrossPay(entry);
      const deductionsAmount = calculateTotalDeductions(entry);
      const netAmount = calculateNetPay(entry);

      acc.totalGross += grossAmount;
      acc.totalDeductions += deductionsAmount;
      acc.totalNet += netAmount;
      acc.validCount++;
      
      return acc;
    }, {
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      validCount: 0
    });

    return {
      totalRecords: data.length,
      validRecords: stats.validCount,
      totalAmount: stats.totalGross,
      formattedTotalAmount: formatCurrency(stats.totalGross),
      formattedTotalDeductions: formatCurrency(stats.totalDeductions),
      formattedTotalNet: formatCurrency(stats.totalNet)
    };
  };

  return (
    <>
      {/* 工作流状态显示 */}
      {workflow.workflowStatus && (
        <ProCard title="工作流状态" style={{ marginBottom: 24 }}>
          <ProDescriptions column={3}>
            <ProDescriptions.Item label="当前步骤">
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>薪资数据审核</Text>
                <Tag color="processing">进行中</Tag>
              </Space>
            </ProDescriptions.Item>
            <ProDescriptions.Item label="薪资周期">
              <Text>{workflow.selectedPeriodId ? `周期 #${workflow.selectedPeriodId}` : '未选择'}</Text>
            </ProDescriptions.Item>
            <ProDescriptions.Item label="运行批次">
              <Text>{workflow.currentPayrollRun?.id ? `批次 #${workflow.currentPayrollRun.id}` : '未创建'}</Text>
            </ProDescriptions.Item>
          </ProDescriptions>
          
          {workflow.workflowStatus.steps && (WORKFLOW_STEPS as any).DATA_REVIEW && workflow.workflowStatus.steps[(WORKFLOW_STEPS as any).DATA_REVIEW] && (
            <Alert
              message="工作流已启动"
              description={`数据审核步骤已开始，开始时间: ${new Date((workflow.workflowStatus.steps[(WORKFLOW_STEPS as any).DATA_REVIEW] as any)?.data?.started_at || '').toLocaleString()}`}
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </ProCard>
      )}

      {/* 审核要点说明 */}
      <ProCard title={t('payroll:workflow.steps.data_review.review_points.title', '审核要点')} style={{ marginBottom: 24 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.employee_data', '员工基础信息完整性')}>
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.employee_data_desc', '确保员工信息、部门、职位等基础数据完整准确')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.attendance_data', '考勤数据准确性')}>
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.attendance_data_desc', '核实出勤天数、加班时长、请假记录等考勤数据')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.component_config', '薪资组件配置正确性')}>
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.component_config_desc', '检查基本工资、津贴、扣款等薪资组件配置')}</Text>
          </ProDescriptions.Item>
          <ProDescriptions.Item label={t('payroll:workflow.steps.data_review.review_points.calculation_rules', '计算规则有效性')}>
            <Text type="secondary">{t('payroll:workflow.steps.data_review.review_points.calculation_rules_desc', '确认社保、公积金、个税等计算规则设置正确')}</Text>
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
      
      {/* 薪资周期选择 */}
      <PayrollPeriodSelector
        value={selectedPeriodId}
        onChange={handlePeriodChange}
        mode="card"
        cardTitle={t('payroll:workflow.steps.data_review.form.payroll_period', '薪资周期选择')}
        showSelectedStatus={true}
        showDataStats={true}
        autoSelectLatestWithData={false}
        style={{ marginBottom: 24 }}
        placeholder={t('payroll:workflow.steps.data_review.form.payroll_period_placeholder', '请选择薪资周期')}
      />

      {/* 数据加载状态 */}
      {isLoadingDataStep1 && (
        <div style={{textAlign: 'center', padding: '20px'}}>
          <Spin size="large" tip={t('common:messages.loadingData', '数据加载/处理中...')} />
        </div>
      )}

      {/* 数据初始化选项 */}
      {!isLoadingDataStep1 && !hasDataForCycleStep1 && selectedPeriodId && (
        <ProCard 
          title={t('payroll:workflow.steps.data_review.data_initialization.title', '初始化当前周期薪资数据')} 
          bordered 
          headerBordered 
          style={{ margin: '24px 0' }}
          headStyle={{background: '#f0f8ff'}}
        >
          <Alert
            message={t('payroll:workflow.steps.data_review.data_initialization.no_data_title', '当前薪资周期尚无数据')}
            description={t('payroll:workflow.steps.data_review.data_initialization.no_data_message', 
              '请选择以下任一方式，为当前选定的薪资周期生成或导入薪资基础数据。')}
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary" 
              icon={<CopyOutlined />}
              onClick={handleCopyLastMonthDataStep1}
              block
              disabled={isLoadingDataStep1}
            >
              {t('payroll:workflow.steps.data_review.data_initialization.copy_last_month', '一键复制上月薪资数据')}
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={handleNavigateToBulkImportStep1}
              block
              disabled={isLoadingDataStep1}
            >
              {t('payroll:workflow.steps.data_review.data_initialization.bulk_import', '通过批量导入页面导入新数据')}
            </Button>
          </Space>
        </ProCard>
      )}

      {/* 薪资数据审核表格 */}
      {!isLoadingDataStep1 && hasDataForCycleStep1 && (
        <>
          {/* 数据统计概览 */}
          <ProCard title="数据审核概览" style={{ marginBottom: 24 }}>
            <ProDescriptions column={4}>
              <ProDescriptions.Item label="总记录数">
                <Text strong style={{ fontSize: '16px' }}>{dataStats.total}</Text>
              </ProDescriptions.Item>
              <ProDescriptions.Item label="完整数据">
                <Text style={{ color: '#52c41a', fontSize: '16px', fontWeight: 500 }}>
                  {dataStats.complete}
                </Text>
              </ProDescriptions.Item>
              <ProDescriptions.Item label="警告数据">
                <Text style={{ color: '#fa8c16', fontSize: '16px', fontWeight: 500 }}>
                  {dataStats.warning}
                </Text>
              </ProDescriptions.Item>
              <ProDescriptions.Item label="不完整数据">
                <Text style={{ color: '#ff4d4f', fontSize: '16px', fontWeight: 500 }}>
                  {dataStats.incomplete}
                </Text>
              </ProDescriptions.Item>
            </ProDescriptions>
            
            {(dataStats.warning > 0 || dataStats.incomplete > 0) && (
              <Alert
                message="发现需要关注的数据"
                description="存在警告或不完整的薪资数据，请仔细审核后再进行下一步操作。"
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </ProCard>


          {/* 薪资数据审核表格 */}
          <ProTable<PayrollDataForReview>
            headerTitle="薪资数据审核明细"
            dataSource={reviewData}
            columns={reviewColumns}
            loading={reviewLoading}
            rowKey="id"
            search={false}
            toolbar={{
              filter: true,
            }}
            options={{
              fullScreen: true,
              reload: () => {
                loadReviewData();
                return Promise.resolve();
              },
              setting: true,
              density: true
            }}
            pagination={pagination}
            scroll={{ x: 1520 }}
            summary={(currentPageData) => {
              // 计算所有数据的合计（不仅仅是当前页）
              const allDataStats = calculateSummaryStats(reviewData);
              // 计算当前页数据的合计
              const currentPageStats = calculateSummaryStats(currentPageData);
              const validRecords = currentPageData.filter(item => item.validation_status === 'valid').length;
              
              return (
                <ProTable.Summary fixed>
                  <ProTable.Summary.Row>
                    <ProTable.Summary.Cell index={0}>
                      {/* 员工信息列 */}
                      <Space direction="vertical" size={2}>
                        <Text strong>当前页: {validRecords}/{currentPageData.length}</Text>
                        <Text strong style={{ color: '#1890ff' }}>总计: {allDataStats.validRecords}/{allDataStats.totalRecords}</Text>
                      </Space>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={1}>
                      {/* 收入明细列 - 显示项目数量统计 */}
                      <Text type="secondary">
                        {reviewData.length > 0 && reviewData.some(item => item.earnings_details) 
                          ? `${Object.keys(reviewData[0]?.earnings_details || {}).length}个项目`
                          : '-'
                        }
                      </Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={2}>
                      {/* 应发合计列 */}
                      <Space direction="vertical" size={2}>
                        <Text style={{ color: '#52c41a', fontSize: '12px' }}>
                          当前页: {currentPageStats.formattedTotalAmount}
                        </Text>
                        <Text strong style={{ color: '#52c41a' }}>
                          总计: {allDataStats.formattedTotalAmount}
                        </Text>
                      </Space>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={3}>
                      {/* 扣款明细列 - 显示项目数量统计 */}
                      <Text type="secondary">
                        {reviewData.length > 0 && reviewData.some(item => item.deductions_details) 
                          ? `${Object.keys(reviewData[0]?.deductions_details || {}).length}个项目`
                          : '-'
                        }
                      </Text>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={4}>
                      {/* 扣款合计列 */}
                      <Space direction="vertical" size={2}>
                        <Text style={{ color: '#fa8c16', fontSize: '12px' }}>
                          当前页: {currentPageStats.formattedTotalDeductions}
                        </Text>
                        <Text strong style={{ color: '#fa8c16' }}>
                          总计: {allDataStats.formattedTotalDeductions}
                        </Text>
                      </Space>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={5}>
                      {/* 实发合计列 */}
                      <Space direction="vertical" size={2}>
                        <Text style={{ color: '#1890ff', fontSize: '12px' }}>
                          当前页: {currentPageStats.formattedTotalNet}
                        </Text>
                        <Text strong style={{ color: '#1890ff' }}>
                          总计: {allDataStats.formattedTotalNet}
                        </Text>
                      </Space>
                    </ProTable.Summary.Cell>
                    <ProTable.Summary.Cell index={6} colSpan={4}>
                      {/* 其他列合并显示统计信息 */}
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text type="secondary">
                          智能计算汇总（含明细数据）
                        </Text>
                      </Space>
                    </ProTable.Summary.Cell>
                  </ProTable.Summary.Row>
                </ProTable.Summary>
              );
            }}
          />

          {/* 审核表单 */}
          <ProCard title="审核确认" style={{ marginTop: 24 }}>
            <ProFormTextArea
              name="reviewComments"
              label={t('payroll:workflow.steps.data_review.form.review_comments', '审核备注')}
              placeholder={t('payroll:workflow.steps.data_review.form.review_comments_placeholder', '请输入审核备注或说明')}
              fieldProps={{ rows: 4 }}
              rules={[{ required: true, message: t('payroll:workflow.steps.data_review.form.review_comments_required', '审核备注不能为空')}]}
            />
            <ProFormRadio.Group
              name="reviewResult"
              label={t('payroll:workflow.steps.data_review.form.review_result', '审核结果')}
              options={[
                { label: t('payroll:workflow.steps.data_review.form.review_result_pass', '审核通过'), value: 'pass' },
                { label: t('payroll:workflow.steps.data_review.form.review_result_adjust', '需调整 (退回)'), value: 'adjust' },
              ]}
              rules={[{ required: true, message: t('payroll:workflow.steps.data_review.form.review_result_required', '请选择审核结果') }]}
            />
          </ProCard>
        </>
      )}

      {/* 编辑薪资记录模态框 */}
      <Modal
        title={`编辑薪资记录 - ${editingRecord?.employee_name || ''}`}
        open={editModalVisible}
        onCancel={handleCloseEditModal}
        width="90%"
        style={{ top: 30, maxWidth: '1000px' }}
        footer={[
          <Button key="cancel" onClick={handleCloseEditModal}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            loading={editLoading}
            onClick={() => editForm.submit()}
          >
            保存
          </Button>,
        ]}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSaveEdit}
          onValuesChange={() => {
            // 表单值变化时实时计算汇总
            setTimeout(() => calculateEditFormSummary(), 10);
          }}
        >
          {/* 基本信息（只读） */}
          <Card size="small" title="基本信息" style={{ marginBottom: 12 }}>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label="员工姓名" name="employee_name" style={{ marginBottom: 8 }}>
                  <Input disabled style={{ fontWeight: 500 }} size="small" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="部门" name="department_name" style={{ marginBottom: 8 }}>
                  <Input disabled size="small" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="职位" name="position_name" style={{ marginBottom: 8 }}>
                  <Input disabled size="small" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 收入和扣款明细 - 响应式布局 */}
          <Row gutter={[16, 12]} style={{ marginBottom: 12 }}>
            {/* 收入明细分组 */}
            <Col xs={24} lg={12}>
              {editingRecord?.earnings_details && Object.keys(editingRecord.earnings_details).length > 0 && (
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <span style={{ color: '#52c41a' }}>💰 收入明细</span>
                      <Tag color="success">{Object.keys(editingRecord.earnings_details).length}项</Tag>
                    </Space>
                  } 
                  style={{ height: '100%' }}
                >
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.entries(editingRecord.earnings_details)
                      .sort(([, a], [, b]) => {
                        // 按显示顺序或名称排序
                        const orderA = (a as any).display_order || (a as any).sort_order || (a as any).order || 999;
                        const orderB = (b as any).display_order || (b as any).sort_order || (b as any).order || 999;
                        return orderA - orderB;
                      })
                      .map(([code, item]: [string, any]) => (
                        <Form.Item 
                          key={code}
                          label={
                            <Space>
                              <span style={{ fontSize: '13px' }}>{item.name || code}</span>
                              {item.description && (
                                <Tooltip title={item.description}>
                                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                                </Tooltip>
                              )}
                            </Space>
                          }
                          name={`earnings_${code}`}
                          style={{ marginBottom: 12 }}
                          rules={[
                            { required: item.is_required !== false, message: '请输入金额' },
                            { type: 'number', min: 0, message: '金额不能为负数' }
                          ]}
                        >
                          <InputNumber 
                            style={{ width: '100%', maxWidth: '200px' }}
                            size="small"
                            min={0}
                            precision={2}
                            placeholder="请输入金额"
                            prefix="¥"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value!.replace(/\¥\s?|(,*)/g, '') as any}
                          />
                        </Form.Item>
                      ))}
                  </div>
                </Card>
              )}
            </Col>

            {/* 扣款明细分组 */}
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title={
                  <Space>
                    <span style={{ color: '#fa8c16' }}>📉 扣款明细</span>
                    <Tag color="warning">
                      {editingRecord?.deductions_details ? Object.keys(editingRecord.deductions_details).length : 0}项
                    </Tag>
                  </Space>
                } 
                style={{ height: '100%' }}
              >
                {editingRecord?.deductions_details && Object.keys(editingRecord.deductions_details).length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.entries(editingRecord.deductions_details)
                      .sort(([, a], [, b]) => {
                        // 按显示顺序或名称排序
                        const orderA = (a as any).display_order || (a as any).sort_order || (a as any).order || 999;
                        const orderB = (b as any).display_order || (b as any).sort_order || (b as any).order || 999;
                        return orderA - orderB;
                      })
                      .map(([code, item]: [string, any]) => (
                        <Form.Item 
                          key={code}
                          label={
                            <Space>
                              <span style={{ fontSize: '13px' }}>{item.name || code}</span>
                              {item.description && (
                                <Tooltip title={item.description}>
                                  <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                                </Tooltip>
                              )}
                            </Space>
                          }
                          name={`deductions_${code}`}
                          style={{ marginBottom: 12 }}
                          rules={[
                            { required: item.is_required !== false, message: '请输入金额' },
                            { type: 'number', min: 0, message: '金额不能为负数' }
                          ]}
                        >
                          <InputNumber 
                            style={{ width: '100%', maxWidth: '200px' }}
                            size="small"
                            min={0}
                            precision={2}
                            placeholder="请输入金额"
                            prefix="¥"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value!.replace(/\¥\s?|(,*)/g, '') as any}
                          />
                        </Form.Item>
                      ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '15px', color: '#999', fontSize: '13px' }}>
                    <span>该员工当前没有扣款项目</span>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* 汇总信息（只读，系统计算） */}
          <Card 
            size="small" 
            title={
              <Space>
                <span style={{ color: '#1890ff' }}>📊 汇总信息</span>
                <Tag color="processing">系统自动计算</Tag>
              </Space>
            } 
            style={{ marginBottom: 12 }}
          >
            <Row gutter={12}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>应发合计</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    ¥{calculatedSummary.grossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#fff7e6', borderRadius: '4px', border: '1px solid #ffd591' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>扣款合计</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                    ¥{calculatedSummary.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>实发合计</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    ¥{calculatedSummary.netPay.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 备注信息 */}
          <Card size="small" title="备注信息">
            <Form.Item 
              label="验证备注" 
              name="validation_notes"
              extra="可选填写此次修改的原因或说明"
              style={{ marginBottom: 8 }}
            >
              <Input.TextArea 
                rows={2}
                size="small"
                placeholder="请输入验证备注或调整说明..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </>
  );
}; 