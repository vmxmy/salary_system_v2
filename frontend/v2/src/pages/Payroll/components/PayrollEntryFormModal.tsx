import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
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
  App,
  Tabs,
  Alert,
  Checkbox,
  Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, SaveOutlined, MinusCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PayrollEntry, PayrollItemDetail, PayrollComponentDefinition, PayrollEntryPatch, CreatePayrollEntryPayload, LookupValue, PayrollRun } from '../types/payrollTypes';
import { updatePayrollEntryDetails, getPayrollEntryById, createPayrollEntry, getPayrollRuns } from '../services/payrollApi';
import usePayrollConfigStore from '../../../store/payrollConfigStore';
import { employeeService } from '../../../services/employeeService';
import { employeeManagementApi } from '../../../pages/EmployeeManagement/services/employeeManagementApi';
import { PAYROLL_ENTRY_STATUS_OPTIONS } from '../utils/payrollUtils';
import EmployeeSelect from '../../../components/common/EmployeeSelect';
import type { Employee } from '../../HRManagement/types';
import { getPayrollEntryStatusOptions, type DynamicStatusOption } from '../utils/dynamicStatusUtils';
import { lookupService } from '../../../services/lookupService';
import { simplePayrollApi } from '../../SimplePayroll/services/simplePayrollApi';
import { payrollModalApi, type PayrollModalData } from '../services/payrollModalApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
// 移除TabPane，使用items属性

// 允许输入负值的薪资组件代码 - 现在所有组件都允许负值
const ALLOW_NEGATIVE_COMPONENTS = [
  'REFUND_DEDUCTION_ADJUSTMENT', // 补扣退款调整
  'SOCIAL_INSURANCE_MAKEUP',     // 补扣社保
  'PERFORMANCE_BONUS_MAKEUP'     // 奖励绩效补扣发
];

// 五险一金个人扣缴项目代码
const SOCIAL_INSURANCE_DEDUCTION_CODES = [
  'PENSION_PERSONAL_AMOUNT',           // 养老保险(个人)
  'MEDICAL_PERSONAL_AMOUNT',           // 医疗保险(个人)
  'UNEMPLOYMENT_PERSONAL_AMOUNT',      // 失业保险(个人)
  'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT', // 职业年金(个人)
  'HOUSING_FUND_PERSONAL'              // 住房公积金(个人)
];

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
  payrollRunId?: number | null; // 添加可选的工资运行ID
  entry: PayrollEntry | null;
  onClose: () => void;
  onSuccess: (shouldRefresh?: boolean) => void;
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
  payrollRunId,
  entry,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('payrollEntryForm');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [earnings, setEarnings] = useState<PayrollItemDetail[]>([]);
  const [deductions, setDeductions] = useState<PayrollItemDetail[]>([]);
  const [statusOptions, setStatusOptions] = useState<DynamicStatusOption[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [defaultPayrollRunId, setDefaultPayrollRunId] = useState<number | null>(null);
  const [socialInsuranceBase, setSocialInsuranceBase] = useState<number>(0);
  const [housingFundBase, setHousingFundBase] = useState<number>(0);
  const [occupationalPensionBase, setOccupationalPensionBase] = useState<number>(0);
  const [updatingInsuranceBase, setUpdatingInsuranceBase] = useState<boolean>(false);
  const [adjustingItems, setAdjustingItems] = useState<Set<string>>(new Set()); // 正在调整的项目
  const { message: messageApi } = App.useApp();
  
  // 新增：模态框API数据状态
  const [modalData, setModalData] = useState<PayrollModalData | null>(null);
  const [loadingModalData, setLoadingModalData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  
  const payrollConfig = usePayrollConfigStore();
  
  // 防抖的手动调整API调用
  const debouncedManualAdjustment = useRef(
    debounce(async (entryId: number, componentCode: string, amount: number, reason: string) => {
      try {
        const response = await simplePayrollApi.manuallyAdjustDeduction(entryId, {
          component_code: componentCode,
          amount: amount,
          reason: reason
        });
        
        if (response.data) {
          console.log('手动调整金额已更新:', response.data);
          // 不需要更新本地状态，因为值已经在输入框中改变了
        }
      } catch (error: any) {
        console.error('更新手动调整金额失败:', error);
        messageApi.error(`更新失败: ${error.response?.data?.detail || error.message}`);
      }
    }, 500)
  ).current;
  
  // 加载动态状态选项
  useEffect(() => {
    const loadStatusOptions = async () => {
      setLoadingStatus(true);
      try {
        const options = await lookupService.getPayrollEntryStatusOptions();
                 const dynamicOptions: DynamicStatusOption[] = options
           .filter(item => item.id && item.code && item.name)
           .map(item => ({
             id: item.id!,
             code: item.code!,
             name: item.name!,
           }));
        setStatusOptions(dynamicOptions);
        console.log('✅ [PayrollEntryFormModal] 动态状态选项加载成功:', dynamicOptions);
      } catch (error) {
        console.error('❌ [PayrollEntryFormModal] 状态选项加载失败:', error);
        messageApi.error(t('common.statusOptionsLoadFailed', { ns: 'common' }));
      } finally {
        setLoadingStatus(false);
      }
    };

    if (visible) {
      loadStatusOptions();
    }
  }, [visible, messageApi, t]);
  
  // 当状态选项加载完成后，设置表单的状态值
  useEffect(() => {
    if (visible && statusOptions.length > 0) {
      if (entry) {
        // 编辑模式：使用条目的现有状态
        console.log('✅ [PayrollEntryFormModal] 状态选项已加载，设置编辑模式状态值:', {
          entry_status: entry.status_lookup_value_id,
          available_options: statusOptions.map(opt => ({ id: opt.id, name: opt.name }))
        });
        form.setFieldsValue({
          status_lookup_value_id: entry.status_lookup_value_id,
        });
      } else {
        // 创建模式：优先使用"已录入"状态，如果没有则使用第一个状态选项
        const entryStatus = statusOptions.find(opt => opt.code === 'PENTRY_ENTRY');
        const defaultStatusId = entryStatus ? entryStatus.id : statusOptions[0].id;
        console.log('✅ [PayrollEntryFormModal] 状态选项已加载，设置创建模式默认状态值:', defaultStatusId);
        form.setFieldsValue({
          status_lookup_value_id: defaultStatusId,
        });
      }
    }
  }, [visible, entry, statusOptions, form]);
  
  // 使用新的模态框API加载数据
  useEffect(() => {
    const fetchModalData = async () => {
      if (visible && entry && entry.id) {
        setLoadingModalData(true);
        try {
          console.log('🔄 [PayrollEntryFormModal] 使用模态框API获取数据:', entry.id);
          const data = await payrollModalApi.getPayrollModalData(entry.id);
          setModalData(data);
          
          console.log('✅ [PayrollEntryFormModal] 模态框API数据加载成功:', data);
          
          // 设置基础信息到表单
          form.setFieldsValue({
            employee_id: {
              id: data.基础信息.员工编号, 
              name: data.基础信息.员工姓名
            },
            employee_name: data.基础信息.员工姓名,
            department: data.基础信息.部门名称,
            personnel_category: data.基础信息.人员类别,
            actual_position: data.基础信息.职位名称,
          });
          
        } catch (error) {
          console.error('❌ [PayrollEntryFormModal] 模态框API数据加载失败:', error);
          messageApi.error('获取薪资数据失败，将使用传统方式加载');
          // 如果新API失败，回退到原有逻辑
          await fetchLatestEntryDataFallback();
        } finally {
          setLoadingModalData(false);
        }
      }
    };

    const fetchLatestEntryDataFallback = async () => {
      if (visible && entry && entry.id) {
        try {
          console.log('🔄 [PayrollEntryFormModal] 回退：重新获取最新的工资条目数据:', entry.id);
          const result = await getPayrollEntryById(entry.id);
          const latestEntry = result.data;
          
          // 修正回退逻辑
          if (latestEntry.employee) {
            const fullName = `${latestEntry.employee.last_name || ''}${latestEntry.employee.first_name || ''}`;
            form.setFieldsValue({
              employee_id: {
                id: latestEntry.employee_id,
                name: fullName
              },
              employee_name: fullName,
            });
          }
          
          console.log('✅ [PayrollEntryFormModal] 获取到最新数据:', {
            old_status: entry.status_lookup_value_id,
            new_status: latestEntry.status_lookup_value_id,
            entry_id: latestEntry.id
          });
          
          // 如果状态选项已加载，立即设置最新的状态值
          if (statusOptions.length > 0) {
            form.setFieldsValue({
              status_lookup_value_id: latestEntry.status_lookup_value_id,
            });
          }
          
          // 更新entry对象的状态值（用于后续的useEffect）
          if (entry.status_lookup_value_id !== latestEntry.status_lookup_value_id) {
            entry.status_lookup_value_id = latestEntry.status_lookup_value_id;
          }
        } catch (error) {
          console.error('❌ [PayrollEntryFormModal] 获取最新数据失败:', error);
          messageApi.error(t('payroll.entry_form.error_fetch_latest_data'));
        }
      }
    };

    fetchModalData();
  }, [visible, entry?.id, statusOptions, form, messageApi, t]);
  
  // 当模态框可见时，加载薪资字段定义
  useEffect(() => {
    if (visible) {
      payrollConfig.fetchComponentDefinitions().then(() => {
      });
    }
  }, [visible]); // 移除 fetchComponentDefinitions 依赖，避免循环
  
  // 获取默认的 payroll_run_id
  useEffect(() => {
    const fetchDefaultPayrollRun = async () => {
      if (visible && payrollPeriodId && !entry) { // 只在创建新条目时获取
        try {
          const runs = await getPayrollRuns({ 
            period_id: payrollPeriodId,
            size: 1,
            page: 1
          });
          
          if (runs.data && runs.data.length > 0) {
            const latestRun = runs.data[0];
            setDefaultPayrollRunId(latestRun.id);
            console.log('✅ [PayrollEntryFormModal] 找到默认工资运行:', latestRun.id);
          } else {
            console.log('⚠️ [PayrollEntryFormModal] 未找到该期间的工资运行');
            setDefaultPayrollRunId(null);
            messageApi.warning(t('payroll.entry_form.warning_no_payroll_run_found'));
          }
        } catch (error) {
          console.error('❌ [PayrollEntryFormModal] 获取默认工资运行失败:', error);
          setDefaultPayrollRunId(null);
          messageApi.error(t('payroll.entry_form.error_fetch_default_payroll_run'));
        }
      }
    };

    fetchDefaultPayrollRun();
  }, [visible, payrollPeriodId, entry, messageApi, t]);
  
  // 获取组件的类型，兼容不同的字段名
  const getComponentType = (comp: any): string => {
    return comp.type || comp.component_type || comp.category || comp.kind || '';
  };
  
  // 从配置中获取收入项组件
  const earningComponents = useMemo<PayrollComponent[]>(() => {
    return payrollConfig.componentDefinitions
      .filter(comp => {
        const type = getComponentType(comp);
        return type === 'EARNING' || type === 'Earning';
      })
      .map(comp => ({
        code: comp.code,
        name: comp.name,
        type: getComponentType(comp),
        description: comp.description
      }));
  }, [payrollConfig.componentDefinitions]);
  
  // 从配置中获取扣缴项组件
  const deductionComponents = useMemo<PayrollComponent[]>(() => {
    return payrollConfig.componentDefinitions
      .filter(comp => {
        const type = getComponentType(comp);
        return type === 'DEDUCTION' || type === 'Deduction' || 
               type === 'STATUTORY' || type === 'Statutory' ||
               type === 'PERSONAL_DEDUCTION' || type === 'Personal_Deduction';
      })
      .map(comp => ({
        code: comp.code,
        name: comp.name,
        type: getComponentType(comp),
        description: comp.description
      }));
  }, [payrollConfig.componentDefinitions]);
  
  // 当模态框可见时，打印可用的薪资字段
  useEffect(() => {
    if (visible && payrollConfig.componentDefinitions.length > 0) {
      console.log('🔍 [PayrollEntryFormModal] 原始组件定义数据:', payrollConfig.componentDefinitions.slice(0, 3));
      
      console.log('Available Payroll Components:', 
        payrollConfig.componentDefinitions.map(comp => ({
          code: comp.code,
          name: comp.name,
          type: comp.type,
          // 检查所有可能的type字段名
          component_type: (comp as any).component_type,
          category: (comp as any).category,
          kind: (comp as any).kind,
          allKeys: Object.keys(comp)
        })).slice(0, 5)
      );
      
      console.log('Earning Component Codes:', 
        earningComponents.map(comp => comp.code)
      );
      
      console.log('Deduction Component Codes:', 
        deductionComponents.map(comp => comp.code)
      );
    }
  }, [visible, payrollConfig.componentDefinitions.length]); // 只依赖长度，避免循环
  
  // 获取部门名称
  const getDepartmentName = (employee: any) => {
    return employeeDetails?.department_name || t('common.notApplicable', { ns: 'common' });
  };

  // 获取人员身份名称
  const getPersonnelCategoryName = (employee: any) => {
    return employeeDetails?.personnel_category_name || t('common.notApplicable', { ns: 'common' });
  };

  // 获取实际任职名称
  const getActualPositionName = (employee: any) => {
    return employeeDetails?.actual_position_name || t('common.notApplicable', { ns: 'common' });
  };

  // 处理员工选择
  const handleEmployeeSelect = (employeeId: number, employee: Employee) => {
    // 添加调试日志
    console.log('📝 [handleEmployeeSelect] 员工选择：', {
      employeeId,
      employee,
      hasEmployeeObject: !!employee
    });
    
    if (employee) {
        setEmployeeDetails(employee);
        
        // 确保正确设置employee_id
        form.setFieldsValue({
            employee_id: employeeId,  // 使用参数中的employeeId，而不是employee.id
            department: getDepartmentName(employee),
            personnel_category: getPersonnelCategoryName(employee),
            actual_position: getActualPositionName(employee),
        });
        
        // 添加调试日志确认表单已更新
        console.log('✅ [handleEmployeeSelect] 表单值已设置：', {
            employee_id: employeeId,
            department: getDepartmentName(employee),
            personnel_category: getPersonnelCategoryName(employee),
            actual_position: getActualPositionName(employee),
        });
    } else {
        console.warn('⚠️ [handleEmployeeSelect] 无效的员工对象，清除相关字段');
        setEmployeeDetails(null);
        form.setFieldsValue({
            employee_id: undefined, // 确保清除员工ID
            department: null,
            personnel_category: null,
            actual_position: null,
        });
    }
  };
  
  // 获取员工详情
  const fetchEmployeeDetails = useCallback(async (employeeId: number) => {
    setLoading(true);
    try {
      const employee = await employeeManagementApi.getEmployeeById(String(employeeId));
      setEmployeeDetails(employee);
      
      // 设置表单中的员工姓名和部门
      form.setFieldsValue({
        employee_name: employee ? `${employee.last_name || ''}${employee.first_name || ''}` : '',
      });

      // 获取员工缴费基数
      await fetchEmployeeInsuranceBase(employeeId);
    } catch (error) {
      messageApi.error(t('payroll:entry_form.error_fetch_employee'));
    } finally {
      setLoading(false);
    }
  }, [form, messageApi, t]);

  // 获取员工缴费基数
  const fetchEmployeeInsuranceBase = useCallback(async (employeeId: number) => {
    if (employeeId && payrollPeriodId) {
      try {
        console.log(`🔍 [fetchEmployeeInsuranceBase] 开始获取员工缴费基数: {employeeId: ${employeeId}, payrollPeriodId: ${payrollPeriodId}}`);
        const response = await simplePayrollApi.getEmployeeInsuranceBase(employeeId, payrollPeriodId);
        console.log(`✅ [fetchEmployeeInsuranceBase] 获取成功:`, response.data);
        if (response.data) {
          form.setFieldsValue({
            social_insurance_base: response.data.social_insurance_base,
            housing_fund_base: response.data.housing_fund_base,
            occupational_pension_base: response.data.occupational_pension_base,
          });
          setSocialInsuranceBase(response.data.social_insurance_base || 0);
          setHousingFundBase(response.data.housing_fund_base || 0);
          setOccupationalPensionBase(response.data.occupational_pension_base || 0);
        }
      } catch (error) {
        console.error('❌ [fetchEmployeeInsuranceBase] 获取员工缴费基数失败:', error);
        message.error(t('error.fetch_employee_insurance_base'));
      }
    }
  }, [payrollPeriodId, form, t]);

  // 更新员工缴费基数
  const updateEmployeeInsuranceBase = useCallback(async (employeeId: number, socialBase: number, housingBase: number, occupationalBase?: number) => {
    if (!payrollPeriodId) return;
    
    setUpdatingInsuranceBase(true);
    try {
      console.log('💾 [updateEmployeeInsuranceBase] 开始更新员工缴费基数:', {
        employeeId,
        payrollPeriodId,
        socialBase,
        housingBase,
        occupationalBase
      });
      
      const updateData: any = {
        social_insurance_base: socialBase,
        housing_fund_base: housingBase,
      };
      
      if (occupationalBase !== undefined) {
        updateData.occupational_pension_base = occupationalBase;
      }
      
      const response = await simplePayrollApi.updateEmployeeInsuranceBase(employeeId, payrollPeriodId, updateData);
      
      console.log('✅ [updateEmployeeInsuranceBase] 更新成功:', response.data);
      messageApi.success('缴费基数更新成功');
    } catch (error) {
      console.error('❌ [updateEmployeeInsuranceBase] 更新员工缴费基数失败:', error);
      messageApi.error('缴费基数更新失败');
    } finally {
      setUpdatingInsuranceBase(false);
    }
  }, [payrollPeriodId, messageApi]);

  // 手动更新缴费基数按钮处理函数
  const handleUpdateInsuranceBase = useCallback(async () => {
    // 获取员工ID，优先使用entry中的，如果是创建模式则从表单中获取
    const employeeId = entry?.employee_id || form.getFieldValue('employee_id');
    
    if (!employeeId) {
      messageApi.error('请先选择员工');
      return;
    }
    
    await updateEmployeeInsuranceBase(
      employeeId, 
      socialInsuranceBase, 
      housingFundBase, 
      occupationalPensionBase
    );
  }, [entry?.employee_id, form, socialInsuranceBase, housingFundBase, occupationalPensionBase, updateEmployeeInsuranceBase, messageApi]);
  
  // 初始化表单数据
  useEffect(() => {
    if (visible) {
      // payrollConfig.fetchComponentDefinitions(); // 已移到上面的useEffect
      
      if (entry) {
        console.log('🔍 [PayrollEntryFormModal] 初始化表单数据:', {
          entry_id: entry.id,
          earnings_details: entry.earnings_details,
          deductions_details: entry.deductions_details,
          componentDefinitions_length: payrollConfig.componentDefinitions.length,
          componentDefinitions: payrollConfig.componentDefinitions.map(c => ({ code: c.code, type: c.type }))
        });
        
        // 特别打印五险一金的手动调整状态
        if (entry.deductions_details) {
          const socialInsuranceStatus = {};
          SOCIAL_INSURANCE_DEDUCTION_CODES.forEach(code => {
            const deduction = entry.deductions_details[code];
            if (deduction) {
              socialInsuranceStatus[code] = {
                amount: deduction.amount,
                is_manual: deduction.is_manual,
                auto_calculated: deduction.auto_calculated,
                manual_at: deduction.manual_at
              };
            }
          });
          console.log('🔍 [手动调整] 五险一金状态:', socialInsuranceStatus);
        }
        
        console.log('Deductions details raw:',
          Array.isArray(entry.deductions_details), 
          JSON.stringify(entry.deductions_details, null, 2)
        );
        console.log('Entry deductions_details debugging:', {
            is_array: Array.isArray(entry.deductions_details),
            data: entry.deductions_details
        });
        
        // 编辑现有工资明细 - 延迟设置状态值，等待状态选项加载完成
        form.setFieldsValue({
          employee_id: entry.employee_id,
          employee_name: entry.employee_name || '',
          remarks: entry.remarks || '',
        });
        
        // 状态值将在状态选项加载完成后通过单独的useEffect设置
        
        // 处理收入项 - 如果组件定义还没加载，先加载所有数据
        if (entry.earnings_details && typeof entry.earnings_details === 'object' && !Array.isArray(entry.earnings_details)) {
          const earningsArray = Object.entries(entry.earnings_details).map(([key, value]) => ({
            name: key,
            amount: typeof value === 'number' ? value : (typeof value === 'object' && value !== null && typeof (value as any).amount === 'number' ? (value as any).amount : 0),
            description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
          }));
          
                     // 如果组件定义已加载，则过滤有效组件
           if (payrollConfig.componentDefinitions.length > 0) {
             const validEarnings = earningsArray.filter(item => 
               payrollConfig.componentDefinitions.some(c => {
                 const type = getComponentType(c);
                 return c.code === item.name && (type === 'EARNING' || type === 'Earning');
               })
             );
            
                         if (validEarnings.length < earningsArray.length) {
               console.warn('⚠️ 发现无效的收入项组件:', 
                 earningsArray
                   .filter(item => !payrollConfig.componentDefinitions.some(c => {
                     const type = getComponentType(c);
                     return c.code === item.name && (type === 'EARNING' || type === 'Earning');
                   }))
                   .map(item => item.name)
               );
            }
            
            setEarnings(validEarnings);
          } else {
            // 组件定义还没加载，先显示所有数据
            console.log('📝 组件定义还未加载，先显示所有收入项数据');
            setEarnings(earningsArray);
          }
        } else if (entry.earnings_details && Array.isArray(entry.earnings_details)) {
          // 如果已经是数组格式
                     if (payrollConfig.componentDefinitions.length > 0) {
             // 组件定义已加载，过滤有效项
              const validItems = entry.earnings_details.filter(item => 
                payrollConfig.componentDefinitions.some(c => {
                  const type = getComponentType(c);
                  return c.code === item.name && (type === 'EARNING' || type === 'Earning');
                })
              );
            
                          if (validItems.length < entry.earnings_details.length) {
                console.warn('⚠️ 发现无效的收入项组件:', 
                  entry.earnings_details
                    .filter(item => !payrollConfig.componentDefinitions.some(c => {
                      const type = getComponentType(c);
                      return c.code === item.name && (type === 'EARNING' || type === 'Earning');
                    }))
                    .map(item => item.name)
                );
            }
            
            setEarnings(validItems);
          } else {
            // 组件定义还没加载，先显示所有数据
            console.log('📝 组件定义还未加载，先显示所有收入项数据(数组格式)');
            setEarnings(entry.earnings_details);
          }
        } else {
          setEarnings([]);
        }
        
        // 处理扣除项 - 改进的处理逻辑
        
        if (entry.deductions_details) {
          console.log('🎯 [数据加载] 原始扣除项数据:', {
            type: typeof entry.deductions_details,
            isArray: Array.isArray(entry.deductions_details),
            keys: !Array.isArray(entry.deductions_details) ? Object.keys(entry.deductions_details) : null,
            raw_data: entry.deductions_details
          });
          
          // 统一处理对象格式和数组格式
          let deductionsArray: Array<PayrollItemDetail> = [];
          
          if (typeof entry.deductions_details === 'object') {
            if (Array.isArray(entry.deductions_details)) {
              // 已经是数组，确保包含所有必要字段
              deductionsArray = entry.deductions_details.map(item => ({
                name: item.name,
                amount: item.amount || 0,
                description: item.description || payrollConfig.componentDefinitions.find(c => c.code === item.name)?.description || '',
                is_manual: Boolean(item.is_manual),
                manual_at: item.manual_at,
                manual_by: item.manual_by,
                manual_reason: item.manual_reason,
                auto_calculated: item.auto_calculated,
                allowNegative: item.allowNegative
              }));
            } else {
              // 对象格式，转换为数组
              deductionsArray = Object.entries(entry.deductions_details).map(([key, value]) => {
                // 处理不同格式的value
                if (typeof value === 'number') {
                  return {
                    name: key,
                    amount: value,
                    description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
                  };
                } else if (typeof value === 'object' && value !== null) {
                  // 完整的对象格式，保留所有手动调整信息
                  const valueObj = value as any;
                  const itemData = {
                    name: key,
                    amount: valueObj.amount || 0,
                    description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || '',
                    is_manual: Boolean(valueObj.is_manual),
                    manual_at: valueObj.manual_at,
                    manual_by: valueObj.manual_by,
                    manual_reason: valueObj.manual_reason,
                    auto_calculated: valueObj.auto_calculated
                  };
                  
                  // 调试日志
                  if (SOCIAL_INSURANCE_DEDUCTION_CODES.includes(key)) {
                    console.log(`[手动调整] 加载扣除项 ${key}:`, {
                      raw_value: valueObj,
                      is_manual_raw: valueObj.is_manual,
                      is_manual_type: typeof valueObj.is_manual,
                      is_manual_converted: itemData.is_manual,
                      amount: itemData.amount,
                      auto_calculated: itemData.auto_calculated,
                      manual_at: itemData.manual_at
                    });
                  }
                  
                  return itemData;
                } else {
                  return {
                    name: key,
                    amount: 0,
                    description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
                  };
                }
              });
            }
          }
          
          // 如果组件定义已加载，则过滤有效组件
          if (payrollConfig.componentDefinitions.length > 0) {
            const validDeductions = deductionsArray.filter(item => 
              payrollConfig.componentDefinitions.some(c => {
                const type = getComponentType(c);
                return c.code === item.name && (
                  type === 'DEDUCTION' || type === 'Deduction' || 
                  type === 'STATUTORY' || type === 'Statutory' ||
                  type === 'PERSONAL_DEDUCTION' || type === 'Personal_Deduction'
                );
              })
            );
            
            if (validDeductions.length < deductionsArray.length) {
              console.warn('⚠️ 发现无效的扣除项组件:', 
                deductionsArray
                  .filter(item => !payrollConfig.componentDefinitions.some(c => {
                    const type = getComponentType(c);
                    return c.code === item.name && (
                      type === 'DEDUCTION' || type === 'Deduction' || 
                      type === 'STATUTORY' || type === 'Statutory' ||
                      type === 'PERSONAL_DEDUCTION' || type === 'Personal_Deduction'
                    );
                  }))
                  .map(item => item.name)
              );
            }
            
            // 调试：打印所有扣除项的手动调整状态
            console.log('📋 [手动调整] 过滤前扣除项数量:', deductionsArray.length);
            console.log('📋 [手动调整] 过滤后扣除项数量:', validDeductions.length);
            console.log('📋 [手动调整] 所有扣除项状态:', validDeductions.map(item => ({
              name: item.name,
              is_manual: item.is_manual,
              is_manual_type: typeof item.is_manual,
              amount: item.amount,
              auto_calculated: item.auto_calculated
            })));
            
            // 特别检查五险一金的状态
            const socialInsuranceItems = validDeductions.filter(item => 
              SOCIAL_INSURANCE_DEDUCTION_CODES.includes(item.name)
            );
            console.log('🏦 [手动调整] 五险一金项目:', socialInsuranceItems);
            
            // 调试：设置状态前的数据
            console.log('📝 [setDeductions] 即将设置的扣除项数据:', validDeductions);
            console.log('📝 [setDeductions] 五险一金手动调整状态汇总:', 
              validDeductions
                .filter(item => SOCIAL_INSURANCE_DEDUCTION_CODES.includes(item.name))
                .map(item => ({
                  name: item.name,
                  is_manual: item.is_manual,
                  checked: Boolean(item.is_manual)
                }))
            );
            
            setDeductions(validDeductions);
          } else {
            // 组件定义还没加载，先显示所有数据
            console.log('📝 组件定义还未加载，先显示所有扣除项数据');
            setDeductions(deductionsArray);
          }
        } else {
          setDeductions([]);
        }
        
        // 获取员工详情和缴费基数
        if (entry.employee_id) {
          fetchEmployeeDetails(entry.employee_id);
          fetchEmployeeInsuranceBase(entry.employee_id);
        }
      } else {
        // 创建新的工资明细，清空表单
        form.resetFields();
        setEarnings([]);
        setDeductions([]);
        setEmployeeDetails(null);
      }
    }
  }, [visible, entry, form, fetchEmployeeDetails, payrollConfig.componentDefinitions]);

  useEffect(() => {
    if (employeeDetails) {
      console.log('✅ [PayrollEntryFormModal] 接收到员工详情:', JSON.stringify(employeeDetails, null, 2));
      form.setFieldsValue({
        employee_name: employeeDetails.full_name,
        department: employeeDetails.department_name,
        personnel_category: employeeDetails.personnel_category_name,
        actual_position: employeeDetails.position_name,
      });
    }
  }, [employeeDetails, form]);

  // 当earnings或deductions变化时，自动更新汇总项
  useEffect(() => {
    // 只有在模态框可见且Form实例已初始化时才更新总计
    if (visible && form) {
    updateTotals(earnings, deductions);
    }
  }, [earnings, deductions, visible, form]);
  
  // 当组件定义加载完成后，重新过滤earnings和deductions
  useEffect(() => {
    if (visible && entry && payrollConfig.componentDefinitions.length > 0) {
      console.log('🔄 [PayrollEntryFormModal] 组件定义已加载，重新过滤数据');
      
      let newEarnings: Array<PayrollItemDetail> = [];
      let newDeductions: Array<PayrollItemDetail> = [];
      
      // 重新过滤收入项
      if (entry.earnings_details) {
        let earningsArray: Array<PayrollItemDetail> = [];
        
        if (typeof entry.earnings_details === 'object' && !Array.isArray(entry.earnings_details)) {
          earningsArray = Object.entries(entry.earnings_details).map(([key, value]) => ({
            name: key,
            amount: typeof value === 'number' ? value : (typeof value === 'object' && value !== null && typeof (value as any).amount === 'number' ? (value as any).amount : 0),
            description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
          }));
        } else if (Array.isArray(entry.earnings_details)) {
          earningsArray = [...entry.earnings_details];
        }
        
        newEarnings = earningsArray.filter(item => 
          payrollConfig.componentDefinitions.some(c => {
            const type = getComponentType(c);
            return c.code === item.name && (type === 'EARNING' || type === 'Earning');
          })
        );
        
        console.log('✅ 过滤后的收入项:', newEarnings);
        setEarnings(newEarnings);
      }
      
      // 重新过滤扣除项
      if (entry.deductions_details) {
        let deductionsArray: Array<PayrollItemDetail> = [];
        
        if (typeof entry.deductions_details === 'object') {
          if (Array.isArray(entry.deductions_details)) {
            // 确保数组格式也保留手动调整信息
            deductionsArray = entry.deductions_details.map(item => ({
              name: item.name,
              amount: item.amount || 0,
              description: item.description || payrollConfig.componentDefinitions.find(c => c.code === item.name)?.description || '',
              is_manual: Boolean(item.is_manual),
              manual_at: item.manual_at,
              manual_by: item.manual_by,
              manual_reason: item.manual_reason,
              auto_calculated: item.auto_calculated,
              allowNegative: item.allowNegative
            }));
            
            console.log('🔄 [第二次处理] 数组格式扣除项:', deductionsArray.filter(item => 
              SOCIAL_INSURANCE_DEDUCTION_CODES.includes(item.name)
            ).map(item => ({
              name: item.name,
              is_manual: item.is_manual,
              amount: item.amount
            })));
          } else {
            deductionsArray = Object.entries(entry.deductions_details).map(([key, value]) => {
              if (typeof value === 'number') {
                return {
                  name: key,
                  amount: value,
                  description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
                };
              } else if (typeof value === 'object' && value !== null) {
                const valueObj = value as any;
                return {
                  name: key,
                  amount: valueObj.amount || 0,
                  description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || '',
                  is_manual: Boolean(valueObj.is_manual),
                  manual_at: valueObj.manual_at,
                  manual_by: valueObj.manual_by,
                  manual_reason: valueObj.manual_reason,
                  auto_calculated: valueObj.auto_calculated
                };
              } else {
                return {
                  name: key,
                  amount: 0,
                  description: payrollConfig.componentDefinitions.find(c => c.code === key)?.description || ''
                };
              }
            });
          }
        }
        
        newDeductions = deductionsArray.filter(item => 
          payrollConfig.componentDefinitions.some(c => {
            const type = getComponentType(c);
            return c.code === item.name && (
              type === 'DEDUCTION' || type === 'Deduction' || 
              type === 'STATUTORY' || type === 'Statutory' ||
              type === 'PERSONAL_DEDUCTION' || type === 'Personal_Deduction'
            );
          })
        );
        
        console.log('✅ 过滤后的扣除项:', newDeductions);
        
        // 检查过滤后的五险一金手动调整状态
        const filteredSocialInsurance = newDeductions.filter(item => 
          SOCIAL_INSURANCE_DEDUCTION_CODES.includes(item.name)
        );
        console.log('🔍 [第二次处理] 过滤后的五险一金手动调整状态:', 
          filteredSocialInsurance.map(item => ({
            name: item.name,
            is_manual: item.is_manual,
            is_manual_type: typeof item.is_manual,
            amount: item.amount,
            auto_calculated: item.auto_calculated,
            manual_at: item.manual_at
          }))
        );
        
        setDeductions(newDeductions);
      }
      
      // 在数据设置完成后，更新汇总项
      setTimeout(() => {
        if (visible && form) {
        updateTotals(newEarnings, newDeductions);
        }
      }, 0);
    }
  }, [visible, entry, payrollConfig.componentDefinitions.length]);
  
  // 处理表单提交
  const handleSubmit = async () => {
    try {
      console.log('🔄 [PayrollEntryFormModal] Save button clicked - starting submit process');
      console.log('🔄 [PayrollEntryFormModal] Entry ID:', entry?.id);
      console.log('🔄 [PayrollEntryFormModal] onSuccess callback:', typeof onSuccess);
      
      const values = await form.validateFields();
      console.log('🔄 [PayrollEntryFormModal] Form validation passed, values:', values);
      
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

      // 将 deductions数组 转换为 Dict[str, { amount: number, ... }]，保留手动调整信息
      const formattedDeductionsDetails: Record<string, any> = {};
      deductions.forEach(item => {
        // 确保amount是数字，且为有效值
        const amount = parseFloat(item.amount as any);
        if (!isNaN(amount)) {
          // 基本数据
          const deductionData: any = { amount };
          
          // 如果有手动调整信息，保留完整数据
          console.log(`🔍 [保存检查] ${item.name}: is_manual=${item.is_manual}, type=${typeof item.is_manual}, Boolean=${Boolean(item.is_manual)}`);
          if (item.is_manual) {
            console.log(`✅ [保存] 保存${item.name}的手动调整信息`);
            deductionData.is_manual = true;
            deductionData.manual_at = item.manual_at;
            deductionData.manual_by = item.manual_by;
            deductionData.manual_reason = item.manual_reason;
            if (item.auto_calculated !== undefined) {
              deductionData.auto_calculated = item.auto_calculated;
            }
          } else {
            console.log(`❌ [保存] ${item.name}的is_manual为false，不保存手动调整信息`);
          }
          
          formattedDeductionsDetails[item.name] = deductionData;
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
      
      // 添加调试日志：检查提交时手动调整状态
      console.log('🔍 [保存] 提交时deductions数组状态:', deductions.map(item => ({
        name: item.name,
        amount: item.amount,
        is_manual: item.is_manual,
        is_manual_type: typeof item.is_manual,
        manual_at: item.manual_at,
        auto_calculated: item.auto_calculated
      })));
      
      console.log('🔍 [保存] 提交时formattedDeductionsDetails:', formattedDeductionsDetails);
      
      // 特别检查HOUSING_FUND_PERSONAL的完整数据
      if (formattedDeductionsDetails.HOUSING_FUND_PERSONAL) {
        console.log('🔍 [保存] HOUSING_FUND_PERSONAL完整数据:', formattedDeductionsDetails.HOUSING_FUND_PERSONAL);
      }
      
      // 特别检查五险一金的状态
      const socialInsuranceInSubmit = deductions.filter(item => 
        SOCIAL_INSURANCE_DEDUCTION_CODES.includes(item.name)
      );
      console.log('🔍 [保存] 五险一金提交状态:', socialInsuranceInSubmit.map(item => ({
        name: item.name,
        is_manual: item.is_manual,
        in_formatted_data: formattedDeductionsDetails[item.name]
      })));
      
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

      // 如果是创建新条目，确保 employee_id 和 status_lookup_value_id 存在且有效
      if (!entry && !values.employee_id) {
        messageApi.error(t('payroll:entry_form.validation.employee_required'));
        return;
      }
      
      if (!values.status_lookup_value_id) {
        messageApi.error(t('payroll:entry_form.validation.status_required'));
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
          console.log('🔄 [PayrollEntryFormModal] Calling updatePayrollEntryDetails API...');
          console.log('🔍 [API调用] 最终提交数据:', {
            entry_id: entry.id,
            submitData: cleanSubmitData,
            deductions_details: cleanSubmitData.deductions_details,
            housing_fund_in_submit: cleanSubmitData.deductions_details?.HOUSING_FUND_PERSONAL
          });
          
          // 详细检查每个五险一金字段的提交数据
          const socialInsuranceSubmitData = {};
          SOCIAL_INSURANCE_DEDUCTION_CODES.forEach(code => {
            if (cleanSubmitData.deductions_details && cleanSubmitData.deductions_details[code]) {
              socialInsuranceSubmitData[code] = cleanSubmitData.deductions_details[code];
            }
          });
          console.log('🔍 [API调用] 五险一金提交数据详情:', socialInsuranceSubmitData);
          const result = await updatePayrollEntryDetails(entry.id, cleanSubmitData);
          console.log('✅ [PayrollEntryFormModal] API call successful:', result);
          
          // 检查API返回的数据是否包含手动调整信息
          if (result && result.data && result.data.deductions_details) {
            console.log('🔍 [API响应] 返回的deductions_details:', result.data.deductions_details);
            if (result.data.deductions_details.HOUSING_FUND_PERSONAL) {
              console.log('🔍 [API响应] HOUSING_FUND_PERSONAL数据:', result.data.deductions_details.HOUSING_FUND_PERSONAL);
            }
          }
          
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
          
          console.log('🔄 [PayrollEntryFormModal] Calling onSuccess callback...');
          onSuccess?.();
          console.log('✅ [PayrollEntryFormModal] Submit process completed successfully');
        } else {
          // 创建新的工资明细
          if (!payrollPeriodId) {
            messageApi.error('缺少工资期间ID');
            return;
          }
          
          const finalPayrollRunId = payrollRunId || defaultPayrollRunId;
          if (!finalPayrollRunId) {
            messageApi.error('缺少工资运行ID，无法创建工资条目。请先创建该期间的工资运行。');
            return;
          }
          
          // 准备创建数据
          const createData: CreatePayrollEntryPayload = {
            employee_id: values.employee_id,
            payroll_period_id: payrollPeriodId,
            payroll_run_id: finalPayrollRunId,
            gross_pay: totalEarningsCalc,
            total_deductions: totalDeductionsCalc,
            net_pay: netPayCalc,
            status_lookup_value_id: values.status_lookup_value_id,
            remarks: values.remarks || '',
            earnings_details: formattedEarningsDetails,
            deductions_details: formattedDeductionsDetails
          };
          
          const result = await createPayrollEntry(createData);
          
          if (result && result.data) {
            messageApi.success(`${t('payroll:entry_form.message.create_success')} - ID: ${result.data.id}`);
          } else {
            messageApi.success(t('payroll:entry_form.message.create_success'));
          }
          console.log('🔄 [PayrollEntryFormModal] Calling onSuccess callback (create mode)...');
          onSuccess();
          console.log('✅ [PayrollEntryFormModal] Submit process completed successfully (create mode)');
        }
      } catch (error: any) {
        console.error("❌ [PayrollEntryFormModal] Failed to update payroll entry:", error);
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
        console.error('❌ [PayrollEntryFormModal] Form validation failed:', error);
        
        // 详细记录错误信息，帮助诊断问题
        if (error && typeof error === 'object') {
          if ('errorFields' in error) {
            const formErrors = (error as any).errorFields;
            console.error('表单验证错误字段:', JSON.stringify(formErrors, null, 2));
            
            // 获取第一个错误字段的错误信息
            const firstErrorMsg = formErrors && formErrors.length > 0 
              ? formErrors[0].errors[0]
              : '请检查表单数据';
              
            // 显示具体的字段错误信息
            messageApi.error(firstErrorMsg || t('payroll.entry_form.validation.check_form'));
            return;
          }
        }
        
        // 默认错误消息
        messageApi.error(t('payroll.entry_form.validation.check_form'));
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
  const handleDeductionChange = async (index: number, value: number) => {
    const newDeductions = [...deductions];
    const item = newDeductions[index];
    item.amount = value;
    
    // 如果是手动调整项且有entry ID，使用防抖调用API更新
    if (item.is_manual && entry && entry.id) {
      debouncedManualAdjustment(entry.id, item.name, value, item.manual_reason || '手动调整金额');
    }
    
    setDeductions(newDeductions);
    updateTotals(earnings, newDeductions);
  };

  // 处理手动调整状态切换
  const handleManualAdjustmentToggle = async (index: number, checked: boolean) => {
    const item = deductions[index];
    const itemKey = `${index}-${item.name}`;
    
    // 如果正在处理中，忽略
    if (adjustingItems.has(itemKey)) {
      return;
    }
    
    // 如果是新创建的条目（没有entry），只更新本地状态
    if (!entry || !entry.id) {
      const newDeductions = [...deductions];
      const newItem = newDeductions[index];
      
      if (checked) {
        newItem.is_manual = true;
        newItem.manual_at = new Date().toISOString();
        newItem.manual_by = 'current_user';
        if (newItem.auto_calculated === undefined) {
          newItem.auto_calculated = newItem.amount;
        }
      } else {
        newItem.is_manual = false;
        if (newItem.auto_calculated !== undefined) {
          newItem.amount = newItem.auto_calculated;
        }
        delete newItem.manual_at;
        delete newItem.manual_by;
        delete newItem.manual_reason;
      }
      
      setDeductions(newDeductions);
      updateTotals(earnings, newDeductions);
      return;
    }
    
    // 对于已存在的条目，调用API
    setAdjustingItems(prev => new Set(prev).add(itemKey));
    
    if (checked) {
      // 调用手动调整API
      try {
        console.log('📤 [手动调整] 发送请求:', {
          entry_id: entry.id,
          component_code: item.name,
          amount: item.amount,
          current_is_manual: item.is_manual,
          timestamp: new Date().toISOString()
        });
        
        const response = await simplePayrollApi.manuallyAdjustDeduction(entry.id, {
          component_code: item.name,
          amount: item.amount,
          reason: '手动调整'
        });
        
        console.log('📥 [手动调整] API响应完整数据:', {
          status: response.status,
          message: response.message,
          data: response.data,
          timestamp: new Date().toISOString()
        });
        
        // 验证API响应数据完整性
        if (response.data) {
          console.log('🔍 [手动调整] 响应数据验证:', {
            has_is_manual: 'is_manual' in response.data,
            is_manual_value: response.data.is_manual,
            is_manual_type: typeof response.data.is_manual,
            has_manual_at: 'manual_at' in response.data,
            manual_at_value: response.data.manual_at,
            has_manual_by: 'manual_by' in response.data,
            manual_by_value: response.data.manual_by,
            component_code: response.data.component_code,
            adjusted_amount: response.data.adjusted_amount,
            original_amount: response.data.original_amount
          });
        } else {
          console.warn('⚠️ [手动调整] API响应中没有data字段');
        }
        
        if (response.data) {
          messageApi.success('已标记为手动调整');
          
          // 更新本地状态（使用API返回的值）
          const newDeductions = [...deductions];
          const newItem = newDeductions[index];
          
          console.log('🔄 [手动调整] 更新前的本地状态:', {
            name: newItem.name,
            is_manual: newItem.is_manual,
            is_manual_type: typeof newItem.is_manual,
            amount: newItem.amount,
            auto_calculated: newItem.auto_calculated,
            manual_at: newItem.manual_at
          });
          
          newItem.is_manual = response.data.is_manual;
          newItem.manual_at = response.data.manual_at;
          newItem.manual_by = response.data.manual_by;
          newItem.manual_reason = response.data.manual_reason;
          newItem.auto_calculated = response.data.original_amount || item.amount;
          
          console.log('✅ [手动调整] 更新后的本地状态:', {
            name: newItem.name,
            is_manual: newItem.is_manual,
            is_manual_type: typeof newItem.is_manual,
            amount: newItem.amount,
            auto_calculated: newItem.auto_calculated,
            manual_at: newItem.manual_at,
            api_provided_is_manual: response.data.is_manual,
            api_provided_is_manual_type: typeof response.data.is_manual
          });
          
          setDeductions(newDeductions);
          updateTotals(earnings, newDeductions);
          
          // 验证状态设置是否成功
          setTimeout(() => {
            console.log('🎯 [手动调整] 状态设置后验证 (setTimeout):', {
              deductions_count: deductions.length,
              target_item: deductions.find(d => d.name === item.name),
              target_item_is_manual: deductions.find(d => d.name === item.name)?.is_manual,
              all_social_insurance_manual_status: deductions
                .filter(d => SOCIAL_INSURANCE_DEDUCTION_CODES.includes(d.name))
                .map(d => ({ name: d.name, is_manual: d.is_manual }))
            });
          }, 100);
          
          // 不立即刷新，因为这会导致状态丢失
          // 手动调整的状态已经在本地更新，不需要立即从服务器刷新
        }
      } catch (error: any) {
        console.error('手动调整API调用失败:', error);
        messageApi.error(`手动调整失败: ${error.response?.data?.detail || error.message}`);
      } finally {
        setAdjustingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }
    } else {
      // 取消手动调整 - 恢复自动计算值
      try {
        // 这里可以调用一个"取消手动调整"的API，或者直接更新为自动计算值
        const newDeductions = [...deductions];
        const newItem = newDeductions[index];
        
        if (newItem.auto_calculated !== undefined) {
          // 调用API更新为自动计算值
          const response = await simplePayrollApi.manuallyAdjustDeduction(entry.id, {
            component_code: item.name,
            amount: newItem.auto_calculated,
            reason: '取消手动调整，恢复自动计算值'
          });
          
          if (response.data) {
            messageApi.success('已恢复为自动计算值');
            
            // 更新本地状态
            newItem.is_manual = false;
            newItem.amount = newItem.auto_calculated;
            delete newItem.manual_at;
            delete newItem.manual_by;
            delete newItem.manual_reason;
            
            setDeductions(newDeductions);
            updateTotals(earnings, newDeductions);
            
            // 不立即刷新，避免状态丢失
          }
        }
      } catch (error: any) {
        console.error('恢复自动计算值失败:', error);
        messageApi.error(`恢复失败: ${error.response?.data?.detail || error.message}`);
      } finally {
        setAdjustingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }
    }
  };
  
  // 更新总计
  const updateTotals = (earningsData: PayrollItemDetail[], deductionsData: PayrollItemDetail[]) => {
    // 确保 form 实例存在且已连接
    if (!form || !visible) {
      return;
    }
    
    const totalEarnings = earningsData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDeductions = deductionsData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    try {
    form.setFieldsValue({
      total_earnings: totalEarnings,
      total_deductions: totalDeductions,
      net_pay: totalEarnings - totalDeductions
    });
    } catch (error) {
      console.warn('⚠️ [updateTotals] Form 实例未就绪，跳过更新:', error);
    }
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
      description: component?.description || '',
      // 为特定字段类型设置允许负值
      allowNegative: ALLOW_NEGATIVE_COMPONENTS.includes(componentName) || 
                     ALLOW_NEGATIVE_COMPONENTS.includes(component?.type || '')
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
      description: component?.description || '',
      // 为特定字段类型设置允许负值
      allowNegative: ALLOW_NEGATIVE_COMPONENTS.includes(componentName) || 
                     ALLOW_NEGATIVE_COMPONENTS.includes(component?.type || '')
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
      title={entry ? t('payroll:entry_form.title_edit') : t('payroll:entry_form.title_create')}
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
          {entry ? t('common:button.save') : t('common:button.create')}
        </Button>
      ]}
    >
      <Spin spinning={loading || loadingModalData}>
        {/* 如果有模态框数据，显示增强的编辑界面 */}
        {modalData && (
          <Alert
            message="数据加载成功"
            description={`正在编辑 ${modalData.基础信息.员工姓名} 的薪资记录`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          initialValues={{
              status_lookup_value_id: 64, // 默认使用64(已录入)状态
          }}
        >
              {/* 员工信息区域 */}
              <Card title={t('section.employee_info')} variant="outlined">
            <Row gutter={16}>
              <Col span={8}>
                {entry ? (
                  <Form.Item
                    label={t('label.employee_id')}
                    name="employee_id"
                    rules={[{ required: true, message: t('validation.employee_required') }]}
                  >
                    <Input disabled />
                  </Form.Item>
                ) : (
                  <Form.Item
                    label={t('label.employee')}
                    name="employee_id"
                    rules={[{ required: true, message: t('validation.employee_required') }]}
                  >
                    <EmployeeSelect 
                      placeholder={t('placeholder.select_employee')}
                      onChange={handleEmployeeSelect}
                      showEmployeeCode
                      allowClear
                    />
                  </Form.Item>
                )}
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t('label.employee_name')}
                  name="employee_name"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={t('label.department')}
                  name="department"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            
            {employeeDetails && (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label={t('label.personnel_category')}
                      name="personnel_category"
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={t('label.actual_position')}
                      name="actual_position"
                    >
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    {/* 预留将来扩展 */}
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label={t('label.social_insurance_base')}
                      name="social_insurance_base"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={undefined}
                        step={0.01}
                        precision={2}
                        onChange={(value) => {
                          // 确保 value 为数字类型
                          const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
                          setSocialInsuranceBase(numValue);
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={t('label.housing_fund_base')}
                      name="housing_fund_base"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={undefined}
                        step={0.01}
                        precision={2}
                        onChange={(value) => {
                          // 确保 value 为数字类型
                          const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
                          setHousingFundBase(numValue);
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={t('label.occupational_pension_base')}
                      name="occupational_pension_base"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={undefined}
                        step={0.01}
                        precision={2}
                        onChange={(value) => {
                          // 确保 value 为数字类型
                          const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
                          setOccupationalPensionBase(numValue);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                {/* 更新缴费基数按钮 */}
                {(entry?.employee_id || (!entry && employeeDetails)) && (
                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={updatingInsuranceBase}
                        onClick={handleUpdateInsuranceBase}
                        style={{ width: '100%' }}
                      >
                        更新缴费基数
                      </Button>
                    </Col>
                  </Row>
                )}
              </>
            )}
              </Card>
          
          <Divider />
          
          {/* 收入项区域 */}
          <Card
            title={
              <Space>
                {t('section.earnings')}
                <Text type="secondary">({t('total')}: {typeof totalEarnings === 'number' ? totalEarnings.toFixed(2) : '0.00'})</Text>
              </Space>
            }
            extra={
              <Form.Item label={t('label.add_earning')}>
                <Select 
                  style={{ width: '100%' }}
                  placeholder={t('placeholder.select_earning_component')}
                  onChange={handleAddEarning}
                  value={undefined}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {earningComponents.map(comp => (
                    <Option key={comp.code} value={comp.code}>
                      {comp.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            }
            variant="borderless"
          >
            {earnings.length === 0 ? (
              <Text type="secondary">{t('no_earnings_components')}</Text>
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
                      <Form.Item label={t('label.amount')}>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={undefined}
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
                {t('section.deductions')}
                <Text type="secondary">({t('total')}: {typeof totalDeductions === 'number' ? totalDeductions.toFixed(2) : '0.00'})</Text>
              </Space>
            }
            extra={
              <Form.Item label={t('label.add_deduction')}>
                <Select 
                  style={{ width: '100%' }}
                  placeholder={t('placeholder.select_deduction_component')}
                  onChange={handleAddDeduction}
                  value={undefined}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {deductionComponents.map(comp => (
                    <Option key={comp.code} value={comp.code}>
                      {comp.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            }
            variant="borderless"
          >
            {deductions.length === 0 ? (
              <Text type="secondary">{t('no_deductions_components')}</Text>
            ) : (
              deductions.map((item, index) => {
                const component = deductionComponents.find(comp => comp.code === item.name);
                const isSocialInsuranceItem = SOCIAL_INSURANCE_DEDUCTION_CODES.includes(item.name);
                
                // 调试日志：复选框渲染时的状态
                if (isSocialInsuranceItem) {
                  console.log(`🔲 [复选框渲染] ${item.name}:`, {
                    index,
                    is_manual: item.is_manual,
                    is_manual_type: typeof item.is_manual,
                    is_manual_boolean: Boolean(item.is_manual),
                    checked_value: Boolean(item.is_manual),
                    amount: item.amount,
                    auto_calculated: item.auto_calculated,
                    manual_at: item.manual_at,
                    full_item: item
                  });
                }
                
                return (
                  <Row key={`deduction-${index}`} gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Form.Item label={
                        <span>
                          {component?.name || item.name}
                          {item.is_manual && (
                            <Tooltip title={`手动调整于 ${new Date(item.manual_at || '').toLocaleString()}`}>
                              <LockOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                            </Tooltip>
                          )}
                        </span>
                      }>
                        <Input value={item.name} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={isSocialInsuranceItem ? 10 : 12}>
                      <Form.Item label={t('label.amount')}>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={undefined}
                          step={0.01}
                          precision={2}
                          value={item.amount}
                          onChange={(value) => handleDeductionChange(index, value as number)}
                          addonAfter={item.is_manual ? <LockOutlined style={{ color: '#1890ff' }} /> : null}
                        />
                      </Form.Item>
                    </Col>
                    {isSocialInsuranceItem && (
                      <Col span={2}>
                        <Form.Item label=" " colon={false}>
                          <Tooltip title={item.is_manual ? '取消手动调整' : '手动调整'}>
                            <Checkbox
                              checked={Boolean(item.is_manual)}
                              onChange={(e) => handleManualAdjustmentToggle(index, e.target.checked)}
                              disabled={adjustingItems.has(`${index}-${item.name}`)}
                            >
                              手调
                            </Checkbox>
                          </Tooltip>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                );
              })
            )}
          </Card>
          
          
          <Divider />
          
          {/* 汇总区域 */}
                      <Card title={t('section.summary')} variant="outlined">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label={t('label.total_earnings')}
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
                  label={t('label.total_deductions')}
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
                  label={t('label.net_pay')}
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
                  label={t('label.status')}
                  name="status_lookup_value_id"
                  rules={[{ required: true, message: t('validation.status_required') }]}
                >
                  <Select>
                    {statusOptions.map(status => (
                      <Option key={status.id} value={status.id}>
                        {status.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('label.remarks')}
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