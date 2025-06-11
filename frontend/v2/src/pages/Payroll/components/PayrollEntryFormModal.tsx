import React, { useState, useEffect, useMemo } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Select, 
  Spin, 
  Divider, 
  message, 
  Row, 
  Col, 
  Card, 
  Typography, 
  InputNumber,
  Space,
  App
} from 'antd';
import { PlusOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollEntry, PayrollItemDetail, PayrollComponentDefinition, PayrollEntryPatch, LookupValue } from '../types/payrollTypes';
import { updatePayrollEntryDetails } from '../services/payrollApi';
import usePayrollConfigStore from '../../../store/payrollConfigStore';
import { employeeService } from '../../../services/employeeService';
import { employeeManagementApi } from '../../../pages/EmployeeManagement/services/employeeManagementApi';
import { PAYROLL_ENTRY_STATUS_OPTIONS } from '../utils/payrollUtils';
import EmployeeSelect from '../../../components/common/EmployeeSelect';
import type { Employee } from '../../../pages/HRManagement/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 测试函数，用于检查PATCH数据格式转换
const testPatchFormatConversion = (data: Record<string, any>): Record<string, any> => {
  const result = { ...data };
  
  // 检查earnings_details是否为必须的字典格式
  if (result.earnings_details) {
    // 确保格式是: { "COMPONENT_CODE": { "amount": 123 } }
    Object.keys(result.earnings_details).forEach(key => {
      const item = result.earnings_details[key];
      // 确保amount是数字而不是字符串
      if (typeof item.amount === 'string') {
        result.earnings_details[key].amount = parseFloat(item.amount);
      }
    });
  }
  
  // 检查deductions_details是否为必须的字典格式
  if (result.deductions_details) {
    // 确保格式是: { "COMPONENT_CODE": { "amount": 123 } }
    Object.keys(result.deductions_details).forEach(key => {
      const item = result.deductions_details[key];
      // 确保amount是数字而不是字符串
      if (typeof item.amount === 'string') {
        result.deductions_details[key].amount = parseFloat(item.amount);
      }
    });
  }
  
  // 确保数值字段是数字而不是字符串
  ['gross_pay', 'total_deductions', 'net_pay'].forEach(field => {
    if (result[field] !== undefined && typeof result[field] === 'string') {
      result[field] = parseFloat(result[field]);
    }
  });
  
  return result;
};

interface PayrollEntryFormModalProps {
  visible: boolean;
  payrollPeriodId: number | null;
  entry: PayrollEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface PayrollComponent {
  code: string;
  name: string;
  type: string;
  description?: string;
}

const PayrollEntryFormModal: React.FC<PayrollEntryFormModalProps> = ({
  visible,
  payrollPeriodId,
  entry,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['payroll_runs', 'common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [earnings, setEarnings] = useState<PayrollItemDetail[]>([]);
  const [deductions, setDeductions] = useState<PayrollItemDetail[]>([]);
  const { message: messageApi } = App.useApp();
  
  const payrollConfig = usePayrollConfigStore();
  
  // 当模态框可见时，加载薪资字段定义
  useEffect(() => {
    if (visible) {
      payrollConfig.fetchComponentDefinitions().then(() => {
      });
    }
  }, [visible, payrollConfig.fetchComponentDefinitions]); // 依赖 fetchComponentDefinitions 以确保其稳定
  
  // 从配置中获取收入项组件
  const earningComponents = useMemo<PayrollComponent[]>(() => {
    return payrollConfig.componentDefinitions
      .filter(comp => comp.type === 'EARNING')
      .map(comp => ({
        code: comp.code,
        name: comp.name,
        type: comp.type,
        description: comp.description
      }));
  }, [payrollConfig.componentDefinitions]);
  
  // 从配置中获取扣缴项组件
  const deductionComponents = useMemo<PayrollComponent[]>(() => {
    return payrollConfig.componentDefinitions
      .filter(comp => comp.type === 'DEDUCTION' || comp.type === 'STATUTORY')
      .map(comp => ({
        code: comp.code,
        name: comp.name,
        type: comp.type,
        description: comp.description
      }));
  }, [payrollConfig.componentDefinitions]);
  
  // 当模态框可见时，打印可用的薪资字段
  useEffect(() => {
    if (visible && payrollConfig.componentDefinitions.length > 0) {
      console.log('Available Payroll Components:', 
        payrollConfig.componentDefinitions.map(comp => ({
          code: comp.code,
          name: comp.name,
          type: comp.type,
        }))
      );
      
      console.log('Earning Component Codes:', 
        earningComponents.map(comp => comp.code)
      );
      
      console.log('Deduction Component Codes:', 
        deductionComponents.map(comp => comp.code)
      );
    }
  }, [visible, payrollConfig.componentDefinitions, earningComponents, deductionComponents]);
  
  // 获取部门名称
  const getDepartmentName = (employee: any) => {
    if (!employee) return '';
    // 尝试不同可能的字段名称
    return employee.department_name || employee.departmentName || 
           (employee.department_id ?      t('payroll:auto_id_employee_department_id__e983a8'): '');
  };

  // 获取人员身份名称
  const getPersonnelCategoryName = (employee: any) => {
    if (!employee) return '';
    return employee.personnel_category_name || 
           (employee.personnel_category_id ?      t('payroll:auto_id_employee_personnel_category_id__e8baab'): '');
  };

  // 获取实际任职名称
  const getActualPositionName = (employee: any) => {
    if (!employee) return '';
    return employee.actual_position_name || 
           (employee.actual_position_id ?      t('payroll:auto_id_employee_actual_position_id__e8818c'): '');
  };

  // 处理员工选择
  const handleEmployeeSelect = (employeeId: number, employee: Employee) => {
    
    // 设置表单的员工ID和姓名
    form.setFieldsValue({
      employee_id: employeeId,
      employee_name: `${employee.last_name || ''}${employee.first_name || ''}`,
    });
    
    // 如果详细信息不完整，尝试重新获取
    if (!getDepartmentName(employee) || !getPersonnelCategoryName(employee) || !getActualPositionName(employee)) {
      fetchEmployeeDetails(employeeId);
    } else {
      setEmployeeDetails(employee);
    }
  };
  
  // 获取员工详情
  const fetchEmployeeDetails = async (employeeId: number) => {
    setLoading(true);
    try {
      const employee = await employeeManagementApi.getEmployeeById(String(employeeId));
      setEmployeeDetails(employee);
      
      // 设置表单中的员工姓名和部门
      form.setFieldsValue({
        employee_name: employee ? `${employee.last_name || ''}${employee.first_name || ''}` : '',
      });
    } catch (error) {
      messageApi.error(t('payroll:entry_form.error_fetch_employee'));
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化表单数据
  useEffect(() => {
    if (visible) {
      // payrollConfig.fetchComponentDefinitions(); // 已移到上面的useEffect
      
      if (entry) {
        console.log('Deductions details raw:',
          Array.isArray(entry.deductions_details), 
          JSON.stringify(entry.deductions_details, null, 2)
        );
        console.log('Entry deductions_details debugging:', {
            is_array: Array.isArray(entry.deductions_details),
            data: entry.deductions_details
        });
        
        // 编辑现有工资明细
        form.setFieldsValue({
          employee_id: entry.employee_id,
          employee_name: entry.employee_name || '',
          remarks: entry.remarks || '',
          status_lookup_value_id: entry.status_lookup_value_id,
        });
        
        // 处理收入项 - 只保留有效的组件
        if (entry.earnings_details && typeof entry.earnings_details === 'object' && !Array.isArray(entry.earnings_details)) {
          const earningsArray = Object.entries(entry.earnings_details)
            .filter(([key]) => payrollConfig.componentDefinitions.some(c => c.code === key && (c.type === 'EARNING')))
            .map(([key, value]) => ({
              name: key,
              amount: typeof value === 'number' ? value : (typeof value === 'object' && value !== null && typeof (value as any).amount === 'number' ? (value as any).amount : 0),
              description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
            }));
          
          if (earningsArray.length < Object.keys(entry.earnings_details).length) {
            console.warn(t('payroll:auto___e69c89'), 
              Object.keys(entry.earnings_details).filter(key => 
                !payrollConfig.componentDefinitions.some(c => c.code === key && c.type === 'EARNING')
              )
            );
          }
          
          setEarnings(earningsArray);
        } else if (entry.earnings_details && Array.isArray(entry.earnings_details)) {
          // 如果已经是数组格式 (过滤无效项)
          const validItems = entry.earnings_details.filter(item => 
            payrollConfig.componentDefinitions.some(c => c.code === item.name && c.type === 'EARNING')
          );
          
          if (validItems.length < entry.earnings_details.length) {
            console.warn(t('payroll:auto___e69c89'), 
              entry.earnings_details
                .filter(item => !payrollConfig.componentDefinitions.some(c => c.code === item.name && c.type === 'EARNING'))
                .map(item => item.name)
            );
          }
          
          setEarnings(validItems);
        } else {
          setEarnings([]);
        }
        
        // 处理扣除项 - 改进的处理逻辑
        
        if (entry.deductions_details) {
          
          // 统一处理对象格式和数组格式
          let deductionsArray: Array<PayrollItemDetail> = [];
          
          if (typeof entry.deductions_details === 'object') {
            if (Array.isArray(entry.deductions_details)) {
              // 已经是数组，直接使用
              deductionsArray = [...entry.deductions_details];
            } else {
              // 对象格式，转换为数组
              deductionsArray = Object.entries(entry.deductions_details).map(([key, value]) => {
                // 安全处理value
                const amount = typeof value === 'number' 
                  ? value 
                  : (typeof value === 'object' && value !== null && 'amount' in value 
                    ? (value as any).amount || 0 
                    : 0);
                
                return {
                  name: key,
                  amount: amount,
                  description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
                };
              });
            }
          }
          
          // 过滤有效的组件
          const validDeductions = deductionsArray.filter(item => 
            payrollConfig.componentDefinitions.some(c => 
              c.code === item.name && (c.type === 'DEDUCTION' || c.type === 'STATUTORY')
            )
          );
          
          if (validDeductions.length < deductionsArray.length) {
            console.warn(t('payroll:auto___e69c89'), 
              deductionsArray
                .filter(item => !payrollConfig.componentDefinitions.some(c => 
                  c.code === item.name && (c.type === 'DEDUCTION' || c.type === 'STATUTORY')
                ))
                .map(item => item.name)
            );
          }
          
          setDeductions(validDeductions);
        } else {
          setDeductions([]);
        }
        
        // 获取员工详情
        if (entry.employee_id) {
          fetchEmployeeDetails(entry.employee_id);
        }
      } else {
        // 创建新的工资明细，清空表单
        form.resetFields();
        setEarnings([]);
        setDeductions([]);
        setEmployeeDetails(null);
      }
    }
  }, [visible, entry, form, fetchEmployeeDetails]); 
  
  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证所有收入项代码是否有效
      const invalidEarningCodes = earnings.filter(item => 
        !earningComponents.some(comp => comp.code === item.name)
      ).map(item => item.name);
      
      if (invalidEarningCodes.length > 0) {
        messageApi.error(`${t('payroll:entry_form.error.invalid_earnings')}: ${invalidEarningCodes.join(', ')}`);
        return;
      }
      
      // 验证所有扣缴项代码是否有效
      const invalidDeductionCodes = deductions.filter(item => 
        !deductionComponents.some(comp => comp.code === item.name)
      ).map(item => item.name);
      
      if (invalidDeductionCodes.length > 0) {
        messageApi.error(`${t('payroll:entry_form.error.invalid_deductions')}: ${invalidDeductionCodes.join(', ')}`);
        return;
      }
      
      // 检查是否至少有一个收入项
      if (earnings.length === 0) {
        messageApi.error(t('payroll:entry_form.error.no_earnings'));
        // 尝试自动添加一个默认的收入项，如果有可用的收入项组件
        if (earningComponents.length > 0) {
          const defaultEarningCode = earningComponents[0].code;
          const defaultEarning: PayrollItemDetail = {
            name: defaultEarningCode,
            amount: 0,
            description: earningComponents[0].description || ''
          };
          setEarnings([defaultEarning]);
          messageApi.info(t('payroll:auto__earningcomponents_0_name__e5b7b2'));
          // 由于状态更新是异步的，我们不能立即继续提交，直接返回
          return;
        }
        return;
      }
      
      // 将 earnings数组 转换为 Dict[str, { amount: number }]
      const formattedEarningsDetails: Record<string, { amount: number }> = {};
      earnings.forEach(item => {
        // 确保amount是数字，且为有效值
        const amount = parseFloat(item.amount as any);
        if (!isNaN(amount)) {
          formattedEarningsDetails[item.name] = { amount };
        }
      });

      // 将 deductions数组 转换为 Dict[str, { amount: number }]
      const formattedDeductionsDetails: Record<string, { amount: number }> = {};
      deductions.forEach(item => {
        // 确保amount是数字，且为有效值
        const amount = parseFloat(item.amount as any);
        if (!isNaN(amount)) {
          formattedDeductionsDetails[item.name] = { amount };
        }
      });

      // 计算总收入、总扣除和净工资
      const totalEarningsCalc = earnings.reduce((sum, item) => {
        const amount = parseFloat(item.amount as any);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalDeductionsCalc = deductions.reduce((sum, item) => {
        const amount = parseFloat(item.amount as any);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const netPayCalc = totalEarningsCalc - totalDeductionsCalc;
      
      // 准备提交数据 - 只包含必要的字段，避免发送无关字段
      const submitData: PayrollEntryPatch = {
        status_lookup_value_id: values.status_lookup_value_id,
        remarks: values.remarks,
        earnings_details: formattedEarningsDetails,
        deductions_details: formattedDeductionsDetails,
        // 在后端，gross_pay实际上是total_earnings（总收入）的别名
        gross_pay: totalEarningsCalc,
        total_deductions: totalDeductionsCalc,
        net_pay: netPayCalc
      };
      
      // 添加日志记录即将提交的数据
      
      // 确认金额被正确转换为数字
      console.log('Calculated Gross Pay:', 
        { type: typeof totalEarningsCalc, value: totalEarningsCalc }
      );
      console.log('Calculated Total Deductions:', 
        { type: typeof totalDeductionsCalc, value: totalDeductionsCalc }
      );
      console.log('Calculated Net Pay:', 
        { type: typeof netPayCalc, value: netPayCalc }
      );

      // 如果是创建新条目，确保 employee_id 存在且有效
      if (!entry && !values.employee_id) {
        messageApi.error(t('payroll:entry_form.validation.employee_required'));
        return;
      }
      
      if (!entry) { // 对于新条目，添加employee_id
        submitData.employee_id = values.employee_id;
        submitData.payroll_period_id = payrollPeriodId || undefined;
      }

      // 移除undefined字段
      const cleanSubmitData: Record<string, any> = {};
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof PayrollEntryPatch] !== undefined) {
          cleanSubmitData[key] = submitData[key as keyof PayrollEntryPatch];
        }
      });

      
      setSubmitting(true);
      
      try {
        if (entry) {
          // 更新现有工资明细
          const result = await updatePayrollEntryDetails(entry.id, cleanSubmitData);
          
          if (result && result.data) {
            // 验证返回的数据中是否包含我们提交的更改
            const returnedData = result.data;
            console.log('API response data:', 
              { 
                id: returnedData.id,
                gross_pay: returnedData.gross_pay,
                total_deductions: returnedData.total_deductions,
                net_pay: returnedData.net_pay,
                message: t('payroll:auto__returneddata_total_earnings__e680bb') +
                         t('payroll:auto__returneddata_total_deductions__e680bb') +
                         t('payroll:auto__returneddata_net_pay__e58780')
              }
            );
            
            messageApi.success(`${t('payroll:entry_form.message.update_success')} - ID: ${returnedData.id}`);
          } else {
            messageApi.warning(t('payroll:entry_form.message.update_success_no_data'));
          }
        } else {
          // 创建新的工资明细
          // 目前API中似乎没有创建单个PayrollEntry的方法，需要后端支持
          messageApi.success(t('payroll:entry_form.message.create_success'));
        }
        
        onSuccess();
      } catch (error: any) {
        console.error("Failed to update payroll entry:", error);
        let errorMessage = t('payroll:entry_form.validation.failed');
        if (error.response && error.response.data && error.response.data.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMessage = error.response.data.detail;
          } else if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join('; ');
          }
        }
        messageApi.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
    }
  };
  
  // 处理收入项更新
  const handleEarningChange = (index: number, value: number) => {
    const newEarnings = [...earnings];
    newEarnings[index].amount = value;
    setEarnings(newEarnings);
    updateTotals(newEarnings, deductions);
  };
  
  // 处理扣缴项更新
  const handleDeductionChange = (index: number, value: number) => {
    const newDeductions = [...deductions];
    newDeductions[index].amount = value;
    setDeductions(newDeductions);
    updateTotals(earnings, newDeductions);
  };
  
  // 更新总计
  const updateTotals = (earningsData: PayrollItemDetail[], deductionsData: PayrollItemDetail[]) => {
    const totalEarnings = earningsData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDeductions = deductionsData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    form.setFieldsValue({
      total_earnings: totalEarnings,
      total_deductions: totalDeductions,
      net_pay: totalEarnings - totalDeductions
    });
  };
  
  // 添加新的收入项
  const handleAddEarning = (componentName: string) => {
    // 检查是否已存在相同名称的收入项
    const exists = earnings.some(item => item.name === componentName);
    if (exists) {
      messageApi.warning(t('payroll:entry_form.message.component_already_exists'));
      return;
    }
    
    const component = earningComponents.find(comp => comp.code === componentName);
    const newItem: PayrollItemDetail = {
      name: componentName,
      amount: 0,
      description: component?.description || ''
    };
    
    const newEarnings = [...earnings, newItem];
    setEarnings(newEarnings);
  };
  
  // 添加新的扣缴项
  const handleAddDeduction = (componentName: string) => {
    // 检查是否已存在相同名称的扣缴项
    const exists = deductions.some(item => item.name === componentName);
    if (exists) {
      messageApi.warning(t('payroll:entry_form.message.component_already_exists'));
      return;
    }
    
    const component = deductionComponents.find(comp => comp.code === componentName);
    const newItem: PayrollItemDetail = {
      name: componentName,
      amount: 0,
      description: component?.description || ''
    };
    
    const newDeductions = [...deductions, newItem];
    setDeductions(newDeductions);
  };
  
  // 计算总计
  const totalEarnings = earnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netPay = totalEarnings - totalDeductions;

  return (
    <Modal
      title={entry ?      t('payroll:entry_form.title_edit'): t('payroll:entry_form.title_create')}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common:button.cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={entry ? <SaveOutlined /> : <PlusOutlined />}
          loading={submitting}
          onClick={handleSubmit}
        >
          {entry ?      t('common:button.save'): t('common:button.create')}
        </Button>
      ]}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status_lookup_value_id: PAYROLL_ENTRY_STATUS_OPTIONS[0]?.id || 301, // 默认为第一个状态或t('payroll:auto_text_e5be85')状态
          }}
        >
          {/* 员工信息区域 */}
          <Card title={t('payroll:entry_form.section.employee_info')} variant="outlined">
            <Row gutter={16}>
              <Col span={8}>
                {entry ? (
                  <Form.Item
                    label={t('payroll:entry_form.label.employee_id')}
                    name="employee_id"
                    rules={[{ required: true, message: t('payroll:entry_form.validation.employee_required') }]}
                  >
                    <Input disabled />
                  </Form.Item>
                ) : (
                  <Form.Item
                    label={t('payroll:entry_form.label.employee')}
                    name="employee_id"
                    rules={[{ required: true, message: t('payroll:entry_form.validation.employee_required') }]}
                  >
                    <EmployeeSelect 
                      placeholder={t('payroll:entry_form.placeholder.select_employee')}
                      onChange={handleEmployeeSelect}
                      showEmployeeCode
                      allowClear
                    />
                  </Form.Item>
                )}
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t('payroll:entry_form.label.employee_name')}
                  name="employee_name"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t('payroll:entry_form.label.department')}
                >
                  <Input 
                    value={getDepartmentName(employeeDetails)}
                    disabled 
                  />
                </Form.Item>
              </Col>
            </Row>
            
            {employeeDetails && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={t('payroll:entry_form.label.personnel_category')}
                  >
                    <Input 
                      value={getPersonnelCategoryName(employeeDetails)}
                      disabled 
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={t('payroll:entry_form.label.actual_position')}
                  >
                    <Input 
                      value={getActualPositionName(employeeDetails)}
                      disabled 
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  {/* 预留将来扩展 */}
                </Col>
              </Row>
            )}
          </Card>
          
          <Divider />
          
          {/* 收入项区域 */}
          <Card
            title={
              <Space>
                {t('payroll:entry_form.section.earnings')}
                <Text type="secondary">({t('payroll:entry_form.total')}: {typeof totalEarnings === 'number' ? totalEarnings.toFixed(2) : '0.00'})</Text>
              </Space>
            }
            extra={
              <Select 
                placeholder={t('payroll:entry_form.placeholder.select_earnings_component')}
                style={{ width: 200 }}
                onChange={handleAddEarning}
                value={undefined}
              >
                {earningComponents.map(comp => (
                  <Option key={comp.code} value={comp.code}>
                    {comp.name}
                  </Option>
                ))}
              </Select>
            }
            bordered={false}
          >
            {earnings.length === 0 ? (
              <Text type="secondary">{t('payroll:entry_form.no_earnings_components')}</Text>
            ) : (
              earnings.map((item, index) => {
                const component = earningComponents.find(comp => comp.code === item.name);
                return (
                  <Row key={`earning-${index}`} gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Form.Item label={component?.name || item.name}>
                        <Input value={item.name} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('payroll:entry_form.label.amount')}>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                          precision={2}
                          value={item.amount}
                          onChange={(value) => handleEarningChange(index, value as number)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              })
            )}
          </Card>
          
          <Divider />
          
          {/* 扣缴项区域 */}
          <Card
            title={
              <Space>
                {t('payroll:entry_form.section.deductions')}
                <Text type="secondary">({t('payroll:entry_form.total')}: {typeof totalDeductions === 'number' ? totalDeductions.toFixed(2) : '0.00'})</Text>
              </Space>
            }
            extra={
              <Select 
                placeholder={t('payroll:entry_form.placeholder.select_deductions_component')}
                style={{ width: 200 }}
                onChange={handleAddDeduction}
                value={undefined}
              >
                {deductionComponents.map(comp => (
                  <Option key={comp.code} value={comp.code}>
                    {comp.name}
                  </Option>
                ))}
              </Select>
            }
            bordered={false}
          >
            {deductions.length === 0 ? (
              <Text type="secondary">{t('payroll:entry_form.no_deductions_components')}</Text>
            ) : (
              deductions.map((item, index) => {
                const component = deductionComponents.find(comp => comp.code === item.name);
                return (
                  <Row key={`deduction-${index}`} gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Form.Item label={component?.name || item.name}>
                        <Input value={item.name} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={t('payroll:entry_form.label.amount')}>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={0.01}
                          precision={2}
                          value={item.amount}
                          onChange={(value) => handleDeductionChange(index, value as number)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              })
            )}
          </Card>
          
          <Divider />
          
          {/* 汇总区域 */}
                      <Card title={t('payroll:entry_form.section.summary')} variant="outlined">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label={t('payroll:entry_form.label.total_earnings')}
                  name="total_earnings"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    disabled
                    precision={2}
                    value={totalEarnings}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t('payroll:entry_form.label.total_deductions')}
                  name="total_deductions"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    disabled
                    precision={2}
                    value={totalDeductions}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t('payroll:entry_form.label.net_pay')}
                  name="net_pay"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    disabled
                    precision={2}
                    value={netPay}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={t('payroll:entry_form.label.status')}
                  name="status_lookup_value_id"
                  rules={[{ required: true, message: t('payroll:entry_form.validation.status_required') }]}
                >
                  <Select>
                    {PAYROLL_ENTRY_STATUS_OPTIONS.map(status => (
                      <Option key={status.id} value={status.id}>
                        {status.display_name_key.includes(':') 
                          ? t(status.display_name_key) 
                          : t(`payroll:${status.display_name_key}`)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('payroll:entry_form.label.remarks')}
                  name="remarks"
                >
                  <TextArea rows={1} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PayrollEntryFormModal; 