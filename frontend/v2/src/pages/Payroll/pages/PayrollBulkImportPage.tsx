import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Button,
  Alert,
  Typography,
  Table,
  Space,
  Steps,
  Card,
  Input,
  App,
  Tabs,
  Switch,
  Tooltip,
  Result,
  Spin,
  Form,
  Select,
  Tag
} from 'antd';
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, PlaySquareOutlined, TableOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { useNavigate } from 'react-router-dom';
import styles from './PayrollBulkImportPage.module.less';
import { nanoid } from 'nanoid';
import * as payrollApi from '../services/payrollApi';
import { getPayrollComponentDefinitions } from '../../../services/payrollConfigService';
import { isEarningComponentType, isDeductionComponentType } from '../../../utils/payrollUtils';
import type { 
  RawPayrollEntryData, 
  ValidatedPayrollEntryData, 
  PayrollPeriod, 
  ApiListResponse, 
  CreatePayrollEntryPayload,
  PayrollComponentDefinition 
} from '../types/payrollTypes';
import TableTextConverter from '../../../components/common/TableTextConverter';
import { PAYROLL_PERIOD_STATUS } from '../constants/payrollConstants';

interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: { record: any; error: string }[];
  createdEntries?: any[]; 
}

interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const PayrollBulkImportPage: React.FC = () => {
  const { t, ready } = useTranslation(['payroll', 'common']);
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const textAreaRef = useRef<any>(null);
  const [parsedData, setParsedData] = useState<ValidatedPayrollEntryData[] | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });
  const [activeTab, setActiveTab] = useState<string>('table'); // 默认显示表格输入
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false);
  const [showDetailedErrors, setShowDetailedErrors] = useState<boolean>(false);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(false);
  
  // 添加组件定义状态
  const [componentDefinitions, setComponentDefinitions] = useState<PayrollComponentDefinition[]>([]);
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false);
  
  // 获取动态映射规则的Hooks
  const payrollApiFields = useMemo(() => {
    // 基础字段映射
    const baseFields = [
      { key: 'employee_id', label: '员工ID', required: true },
      { key: 'employee_name', label: '员工姓名', required: true },
      { key: 'department_name', label: '部门名称', required: false },
      { key: 'position_name', label: '职位名称', required: false },
      { key: 'total_earnings', label: '总收入', required: true },
      { key: 'total_deductions', label: '总扣除', required: true },
      { key: 'net_pay', label: '净工资', required: true },
      { key: 'status_lookup_value_name', label: '状态', required: false },
      { key: 'remarks', label: '备注', required: false },
    ];
    
    // 动态添加收入字段 - 使用工具函数判断类型
    const earningFields = componentDefinitions
      .filter(comp => isEarningComponentType(comp.type))
      .map(comp => ({
        key: `earnings_details.${comp.code}.amount`,
        label: comp.name,
        required: false
      }));
    
    // 动态添加扣除字段 - 使用工具函数判断类型
    const deductionFields = componentDefinitions
      .filter(comp => isDeductionComponentType(comp.type))
      .map(comp => ({
        key: `deductions_details.${comp.code}.amount`,
        label: comp.name,
        required: false
      }));

    const result = [...baseFields, ...earningFields, ...deductionFields];
    console.log('生成的payrollApiFields:', result);
    return result;
  }, [componentDefinitions]);
  
  // 动态生成字段映射规则
  const payrollMappingRules = useMemo(() => {
    const mappingRules: Record<string, string> = {
      '序号': '',
      '员工ID': 'employee_id',
      '员工工号': 'employee_id',
      '工号': 'employee_id',
      '姓名': 'employee_name',
      '员工姓名': 'employee_name',
      '部门': 'department_name',
      '部门名称': 'department_name',
      '职位': 'position_name',
      '职务': 'position_name',
      '岗位': 'position_name',
      '总收入': 'total_earnings',
      '工资总额': 'total_earnings',
      '总计收入': 'total_earnings',
      '总扣除': 'total_deductions',
      '扣除总额': 'total_deductions',
      '总计扣除': 'total_deductions',
      '净工资': 'net_pay',
      '实发工资': 'net_pay',
      '实发金额': 'net_pay',
      '状态': 'status_lookup_value_name',
      '备注': 'remarks',
      '说明': 'remarks',
    };
    
    // 动态添加收入项映射规则 - 使用工具函数判断类型
    componentDefinitions
      .filter(comp => isEarningComponentType(comp.type))
      .forEach(comp => {
        mappingRules[comp.name] = `earnings_details.${comp.code}.amount`;
        // 添加常见别名
        if (comp.code === 'BASIC_SALARY') {
          mappingRules['基本薪资'] = `earnings_details.${comp.code}.amount`;
        }
        if (comp.code === 'PERFORMANCE_BONUS') {
          mappingRules['绩效'] = `earnings_details.${comp.code}.amount`;
          mappingRules['奖金'] = `earnings_details.${comp.code}.amount`;
        }
      });
    
    // 动态添加扣除项映射规则 - 使用工具函数判断类型
    componentDefinitions
      .filter(comp => isDeductionComponentType(comp.type))
      .forEach(comp => {
        mappingRules[comp.name] = `deductions_details.${comp.code}.amount`;
        // 添加常见别名
        if (comp.code === 'PERSONAL_INCOME_TAX') {
          mappingRules['所得税'] = `deductions_details.${comp.code}.amount`;
          mappingRules['个税'] = `deductions_details.${comp.code}.amount`;
        }
        if (comp.code === 'PENSION_PERSONAL_AMOUNT') {
          mappingRules['养老'] = `deductions_details.${comp.code}.amount`;
          mappingRules['养老保险'] = `deductions_details.${comp.code}.amount`;
        }
        if (comp.code === 'MEDICAL_INS_PERSONAL_AMOUNT') {
          mappingRules['医保'] = `deductions_details.${comp.code}.amount`;
          mappingRules['医疗保险'] = `deductions_details.${comp.code}.amount`;
        }
      });
    
    return mappingRules;
  }, [componentDefinitions]);
  
  // 动态获取组件名称的函数
  const getComponentName = (key: string, type: 'earnings' | 'deductions'): string => {
    const filteredComponents = componentDefinitions.filter(comp => {
      if (type === 'earnings') {
        return isEarningComponentType(comp.type) && comp.code === key;
      } else {
        return isDeductionComponentType(comp.type) && comp.code === key;
      }
    });
    
    if (filteredComponents.length > 0) {
      return filteredComponents[0].name;
    }
    return key; // 如果找不到匹配的组件，返回原始key
  };
  
  // 加载薪资周期数据
  useEffect(() => {
    const fetchPayrollPeriods = async () => {
      setLoadingPeriods(true);
      try {
        // 获取所有薪资周期，使用status_lookup_value_id筛选活动状态
        const response = await payrollApi.getPayrollPeriods({
          size: 100, // 修改为最大允许值100，降低超出限制的风险
          // 使用ACTIVE状态的lookup value id进行过滤
          // 如果需要获取所有状态，可以不传此参数
          status_lookup_value_id: Number(getActiveStatusId()) // 确保是数字类型
        });
        setPayrollPeriods(response.data);
        // 记录获取到的总数
        console.log(`成功加载${response.data.length}个薪资周期，总共${response.meta?.total || 0}个`);
      } catch (error) {
        console.error('Error fetching payroll periods:', error);
        message.error(t('periods_page.error_fetch_periods'));
      } finally {
        setLoadingPeriods(false);
      }
    };

    fetchPayrollPeriods();
  }, [message, t]);
  
  // 加载薪资组件定义
  useEffect(() => {
    const fetchComponentDefinitions = async () => {
      setLoadingComponents(true);
      try {
        // 使用payrollConfigService的getPayrollComponentDefinitions
        const response = await getPayrollComponentDefinitions({ is_enabled: true });
        console.log('从config API获取的薪资组件定义:', response);
        setComponentDefinitions(response.data);
        if (response.data.length > 0) {
          console.log(`成功加载${response.data.length}个薪资组件定义`);
        } else {
          console.warn('加载的薪资组件定义为空');
          // 如果从config API返回空，尝试使用payroll API
          try {
            const fallbackResponse = await payrollApi.getPayrollComponentDefinitions({ is_enabled: true });
            console.log('从payroll API获取的薪资组件定义:', fallbackResponse);
            setComponentDefinitions(fallbackResponse.data);
            console.log(`使用备用API加载了${fallbackResponse.data.length}个薪资组件定义`);
          } catch (fallbackError) {
            console.error('备用API也失败了:', fallbackError);
          }
        }
      } catch (error) {
        console.error('Error fetching payroll component definitions from config API:', error);
        message.error(t('batch_import.error_fetch_components', { defaultValue: '获取薪资组件定义失败，使用默认组件' }));
        // 尝试使用payroll API作为备用
        try {
          const fallbackResponse = await payrollApi.getPayrollComponentDefinitions({ is_enabled: true });
          console.log('从payroll API获取的薪资组件定义:', fallbackResponse);
          setComponentDefinitions(fallbackResponse.data);
          console.log(`使用备用API加载了${fallbackResponse.data.length}个薪资组件定义`);
        } catch (fallbackError) {
          console.error('备用API也失败了:', fallbackError);
        }
      } finally {
        setLoadingComponents(false);
      }
    };
    
    fetchComponentDefinitions();
  }, [message, t]);

  useEffect(() => {
    if (jsonInput && textAreaRef.current) {
      if (textAreaRef.current.resizableTextArea && textAreaRef.current.resizableTextArea.textArea) {
        textAreaRef.current.resizableTextArea.textArea.focus();
      } else if (typeof textAreaRef.current.focus === 'function') {
        textAreaRef.current.focus();
      }
    }
  }, [jsonInput]);

  // 处理结果记录
  const processPayrollRecord = (record: Record<string, any>) => {
    // 确保嵌套结构存在
    if (!record.earnings_details) record.earnings_details = {};
    if (!record.deductions_details) record.deductions_details = {};

    // 设置名称
    Object.keys(record.earnings_details).forEach(key => {
      if (typeof record.earnings_details[key] === 'number' || (typeof record.earnings_details[key] === 'object' && record.earnings_details[key] !== null && typeof record.earnings_details[key].amount === 'number')) {
         const amount = typeof record.earnings_details[key] === 'number' ? record.earnings_details[key] : record.earnings_details[key].amount;
        record.earnings_details[key] = {
          amount: amount,
          name: getComponentName(key, 'earnings')
        };
      }
    });

    Object.keys(record.deductions_details).forEach(key => {
       if (typeof record.deductions_details[key] === 'number' || (typeof record.deductions_details[key] === 'object' && record.deductions_details[key] !== null && typeof record.deductions_details[key].amount === 'number')) {
        const amount = typeof record.deductions_details[key] === 'number' ? record.deductions_details[key] : record.deductions_details[key].amount;
        record.deductions_details[key] = {
          amount: amount,
          name: getComponentName(key, 'deductions')
        };
      }
    });

    // 计算总收入和总扣除
    let totalEarnings = 0;
    let totalDeductions = 0;
    
    // 计算总收入
    Object.values(record.earnings_details).forEach((item: any) => {
      if (item && typeof item.amount === 'number') {
        totalEarnings += item.amount;
      }
    });
    
    // 计算总扣除
    Object.values(record.deductions_details).forEach((item: any) => {
      if (item && typeof item.amount === 'number') {
        totalDeductions += item.amount;
      }
    });
    
    // 如果用户未映射总收入/总扣除字段，使用计算的值
    if (!record.total_earnings || record.total_earnings === 0) {
      record.total_earnings = totalEarnings;
    }
    
    if (!record.total_deductions || record.total_deductions === 0) {
      record.total_deductions = totalDeductions;
    }
    
    // 如果用户未映射净工资字段，计算净工资
    if (!record.net_pay || record.net_pay === 0) {
      record.net_pay = record.total_earnings - record.total_deductions;
    }
    
    // 设置默认状态
    if (!record.status_lookup_value_name) {
      record.status_lookup_value_name = '已计算';
    }
    
    return record;
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    if (parseError) { 
      setParseError(null);
    }
  };

  const handlePeriodChange = (value: number) => {
    setSelectedPeriodId(value);
  };

  const processAndValidateJsonData = (jsonData: any[]): ValidatedPayrollEntryData[] => {
    let hasAnyErrorsInBatch = false;
    let localValidRecords = 0;
    let localInvalidRecords = 0;

    const processedAndValidatedData = jsonData.map((rawRecord, index) => {
      const typedRecord: RawPayrollEntryData = {
        ...rawRecord, 
        _clientId: nanoid(), 
        originalIndex: index, 
      };
      
      const fieldErrors = validateRecord(typedRecord, index); 
      
      const validatedRecord: ValidatedPayrollEntryData = {
        ...typedRecord,
        validationErrors: fieldErrors.length > 0 ? fieldErrors : undefined,
      };

      if (fieldErrors.length > 0) {
        hasAnyErrorsInBatch = true;
        localInvalidRecords++;
      } else {
        localValidRecords++;
      }
      return validatedRecord;
    });
    
    setValidationSummary({ 
      totalRecords: jsonData.length, 
      validRecords: localValidRecords, 
      invalidRecords: localInvalidRecords 
    });

    if (hasAnyErrorsInBatch) {
      // message.warning(t('bulk_import.validation.batch_has_errors'));
    }
    return processedAndValidatedData;
  };

  const validateRecord = (record: RawPayrollEntryData, index: number): string[] => {
    const errors: string[] = [];
    const recordDescription = `Record ${index} (Employee ID: ${record.employee_id || 'N/A'}, Name: ${record.employee_name || 'Unknown'})`;

    // 验证必填字段
    if (!record.employee_id) errors.push(t('batch_import.validation.employee_id_required'));
    if (!record.employee_name) errors.push(t('batch_import.validation.employee_name_required'));
    
    // 验证数值字段
    if (typeof record.total_earnings !== 'number' || isNaN(record.total_earnings)) {
      errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'total_earnings' }));
    }
    
    if (typeof record.total_deductions !== 'number' || isNaN(record.total_deductions)) {
      errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'total_deductions' }));
    }
    
    if (typeof record.net_pay !== 'number' || isNaN(record.net_pay)) {
      errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'net_pay' }));
    }

    // 验证净工资计算是否正确
    const calculatedNetPay = record.total_earnings - record.total_deductions;
    if (Math.abs(calculatedNetPay - record.net_pay) > 0.01) { // 允许0.01的浮点误差
      errors.push(t('batch_import.validation.net_pay_mismatch', { record: recordDescription }));
    }

    // 验证收入项
    if (!record.earnings_details || Object.keys(record.earnings_details).length === 0) {
      errors.push(t('batch_import.validation.earnings_required'));
    } else {
      // 验证收入项总和是否与total_earnings匹配
      let earningsSum = 0;
      Object.values(record.earnings_details).forEach(item => {
        if (typeof item.amount !== 'number' || isNaN(item.amount)) {
          errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'earnings_details' }));
        } else {
          earningsSum += item.amount;
        }
      });
      
      if (Math.abs(earningsSum - record.total_earnings) > 0.01) { // 允许0.01的浮点误差
        errors.push(t('batch_import.validation.total_earnings_mismatch', { record: recordDescription }));
      }
    }

    // 如果有扣减项，验证扣减项总和是否与total_deductions匹配
    if (record.deductions_details && Object.keys(record.deductions_details).length > 0) {
      let deductionsSum = 0;
      Object.values(record.deductions_details).forEach(item => {
        if (typeof item.amount !== 'number' || isNaN(item.amount)) {
          errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'deductions_details' }));
        } else {
          deductionsSum += item.amount;
        }
      });
      
      if (Math.abs(deductionsSum - record.total_deductions) > 0.01) { // 允许0.01的浮点误差
        errors.push(t('batch_import.validation.total_deductions_mismatch', { record: recordDescription }));
      }
    }

    return errors;
  };

  const handleParseAndPreview = () => {
    if (!jsonInput.trim()) {
      setParseError(t('batch_import.validation.no_data_to_upload'));
      return;
    }

    try {
      const parsedJson = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsedJson)) {
        setParseError(t('batch_import.validation.json_not_array'));
        return;
      }
      
      if (parsedJson.length === 0) {
        setParseError(t('batch_import.validation.no_data_to_upload'));
        return;
      }

      const validatedData = processAndValidateJsonData(parsedJson);
      setParsedData(validatedData);
      setCurrentStep(1);
      message.success(t('batch_import.message.file_parsed_success', { count: validatedData.length }));
    } catch (error) {
      console.error('JSON parse error:', error);
      setParseError(t('batch_import.message.file_parse_error') + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleUpload = async () => {
    if (!parsedData || parsedData.length === 0) {
      message.error(t('batch_import.validation.no_data_to_upload'));
      return;
    }
    
    if (!selectedPeriodId) {
      message.error(t('batch_import.validation.period_required'));
      return;
    }
    
    const validRecords = parsedData.filter(record => !record.validationErrors || record.validationErrors.length === 0);

    if (validRecords.length === 0) {
      message.error(t('batch_import.validation.no_valid_data_to_upload'));
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setCurrentStep(2);

    try {
      const payloadEntries = validRecords.map(record => {
        const { _clientId, validationErrors, originalIndex, employee_name, department_name, position_name, status_lookup_value_name, ...apiPayload } = record;
        
        // 创建符合API要求的数据结构
        const entryPayload: CreatePayrollEntryPayload = {
          employee_id: apiPayload.employee_id,
          payroll_run_id: 0, // 这个值会在后端根据payroll_period_id创建或查找合适的payroll_run
          total_earnings: apiPayload.total_earnings,
          total_deductions: apiPayload.total_deductions,
          net_pay: apiPayload.net_pay,
          status_lookup_value_id: apiPayload.status_lookup_value_id || 1, // 假设1是默认状态ID
          remarks: apiPayload.remarks,
          earnings_details: apiPayload.earnings_details,
          deductions_details: apiPayload.deductions_details
        };
        
        return entryPayload;
      });

      const bulkPayload = {
        payroll_period_id: selectedPeriodId,
        entries: payloadEntries,
        overwrite_mode: overwriteMode
      };

      const response = await payrollApi.bulkCreatePayrollEntries(bulkPayload);
      
      const entriesCreated = response.data;
      message.success(t('batch_import.message.upload_success', { count: entriesCreated.length }));

      setUploadResult({
        successCount: entriesCreated.length,
        errorCount: parsedData.length - validRecords.length,
        errors: parsedData.filter(r => r.validationErrors && r.validationErrors.length > 0).map(r => ({record: r, error: r.validationErrors!.join('; ')})),
        createdEntries: entriesCreated.map((entry, index) => ({...entry, _clientId: `success_${Date.now()}_${index}`}))
      });
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Bulk upload failed:", error.response?.data || error);
      
      let extractedErrorMessage = t('common:error.unknown');
      let detailedErrorMessage = '';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          extractedErrorMessage = error.response.data.detail;
          detailedErrorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
          extractedErrorMessage = `${t('batch_import.message.upload_failed_with_errors', { count: error.response.data.detail.length })}`;
          detailedErrorMessage = error.response.data.detail
            .map((errItem: any) => errItem.msg || JSON.stringify(errItem))
            .join('\n');
        } else if (typeof error.response.data.detail === 'object') {
          extractedErrorMessage = error.response.data.detail.msg || t('batch_import.message.upload_failed_with_details');
          detailedErrorMessage = JSON.stringify(error.response.data.detail, null, 2);
        } else {
          extractedErrorMessage = t('batch_import.message.upload_failed');
          detailedErrorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.message) {
        extractedErrorMessage = String(error.message);
        detailedErrorMessage = String(error.message);
      }

      message.error(`${t('batch_import.message.upload_failed_prefix')} ${extractedErrorMessage}`);
      
      setUploadResult({
        successCount: 0,
        errorCount: validRecords.length,
        errors: validRecords.map(record => ({ 
            record,
            error: extractedErrorMessage 
        })),
        createdEntries: [] 
      });
      setCurrentStep(3); 
    } finally {
      setUploading(false);
    }
  };

  const renderValidationErrors = (errors?: string[]) => {
    if (!errors || errors.length === 0) return <CheckCircleOutlined style={{ color: 'green' }} />;
    return (
      <Tooltip 
        title={<div className={styles.validationErrorsInTable}><ul>{errors.map((e, i) => <li key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>)}</ul></div>}
        overlayInnerStyle={{ whiteSpace: 'normal', maxWidth: 400 }}
      >
        <CloseCircleOutlined style={{ color: 'red' }} />
      </Tooltip>
    );
  };

  const columns = [
    { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
    { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
    { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
    { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
    { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: number) => `¥${text.toFixed(2)}` },
    { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: number) => `¥${text.toFixed(2)}` },
    { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: number) => `¥${text.toFixed(2)}` },
    { title: t('batch_import.table_header.status'), dataIndex: 'status_lookup_value_name', key: 'status_lookup_value_name', width: 100, render: (text: any) => text || '-' },
    { title: t('batch_import.table_header.remarks'), dataIndex: 'remarks', key: 'remarks', width: 200, render: (text: any) => text || '-' },
    {
      title: t('batch_import.table_header.validation_errors'),
      dataIndex: 'validationErrors',
      key: 'validationErrors',
      width: 200,
      render: renderValidationErrors
    }
  ];

  const resultErrorColumns = [
    { title: t('batch_import.results_table.employee_id'), dataIndex: ['record', 'employee_id'], key: 'employee_id', render: (text: any, item:any) => item.record?.employee_id || '-' },
    { title: t('batch_import.results_table.employee_name'), dataIndex: ['record', 'employee_name'], key: 'employee_name', render: (text: any, item:any) => item.record?.employee_name || '-' },
    { 
      title: t('batch_import.results_table.error_message'), 
      dataIndex: 'error', 
      key: 'error',
      render: (error: any) => {
        if (error === null || error === undefined) return '-';
        return typeof error === 'object' ? JSON.stringify(error) : String(error);
      }
    },
  ];

  const handleStartAgain = () => {
    setCurrentStep(0);
    setParsedData(null);
    setJsonInput('');
    setUploadResult(null);
    setParseError(null);
    setValidationSummary({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });
  };

  const renderResultContent = () => {
    if (!uploadResult) return null;

    const isAllSuccess = uploadResult.successCount > 0 && uploadResult.errorCount === 0;
    const isPartialSuccess = uploadResult.successCount > 0 && uploadResult.errorCount > 0;
    const isAllFailed = uploadResult.successCount === 0 && uploadResult.errorCount > 0;

    let title, icon;

    if (isAllSuccess) {
      title = t('batch_import.results.all_success', { count: uploadResult.successCount });
      icon = <CheckCircleOutlined />;
    } else if (isPartialSuccess) {
      title = t('batch_import.results.partial_success', { success: uploadResult.successCount, error: uploadResult.errorCount });
      icon = <WarningOutlined />;
    } else if (isAllFailed) {
      title = t('batch_import.results.all_failed_at_server', { count: uploadResult.errorCount });
      icon = <CloseCircleOutlined />;
    } else {
      title = t('batch_import.results.no_records_processed_at_server');
      icon = <WarningOutlined />;
    }

    return (
      <Result
        status={isAllSuccess ? 'success' : isPartialSuccess ? 'warning' : 'error'}
        title={title}
        icon={icon}
        extra={[
          <Button 
            type="primary" 
            key="import-another" 
            onClick={handleStartAgain}
          >
            {t('batch_import.button.import_another_file')}
          </Button>
        ]}
      >
        {uploadResult.errors.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Button 
              type="link" 
              onClick={() => setShowDetailedErrors(!showDetailedErrors)}
              style={{ marginBottom: 16 }}
            >
              {showDetailedErrors 
                ? t('batch_import.button.hide_error_details') 
                : t('batch_import.button.show_error_details')}
            </Button>
            
            {showDetailedErrors && (
              <div className={styles.errorTableContainer}>
                <Title level={5}>{t('batch_import.results_table.title_failed_records')}</Title>
                <Table 
                  dataSource={uploadResult.errors} 
                  columns={resultErrorColumns} 
                  rowKey={(record, index) => `error_${index}`}
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </div>
            )}
          </div>
        )}

        {uploadResult.createdEntries && uploadResult.createdEntries.length > 0 && showDetailedErrors && (
          <div className={styles.successTableContainer} style={{ marginTop: 24 }}>
            <Title level={5}>{t('batch_import.results_table.title_successfully_imported_records_preview')}</Title>
            <Table 
              dataSource={uploadResult.createdEntries.slice(0, 100)} 
              columns={columns.filter(col => col.key !== 'validationErrors')} 
              rowKey="_clientId"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </div>
        )}
      </Result>
    );
  };

  // 监听表格转换器的结果事件
  useEffect(() => {
    const handleTableConverterResult = (event: any) => {
      const { jsonData } = event.detail;
      if (jsonData && Array.isArray(jsonData)) {
        // 将转换后的JSON数据设置到输入框
        setJsonInput(JSON.stringify(jsonData, null, 2));
        // 切换到JSON标签页
        setActiveTab('json');
        // 显示成功消息
        message.success(t('batch_import.message.table_converted_success', { count: jsonData.length }));
      }
    };

    window.addEventListener('tableConverterResult', handleTableConverterResult);
    return () => {
      window.removeEventListener('tableConverterResult', handleTableConverterResult);
    };
  }, [message, t]);

  // 获取活动状态的ID
  const getActiveStatusId = (): number | undefined => {
    // 这里应该从系统配置或常量中获取状态ID
    // 因为我们使用了lookup表，所以需要根据实际配置获取
    return PAYROLL_PERIOD_STATUS.ACTIVE;
  };

  return (
    <PageHeaderLayout pageTitle={t('batch_import.page_title')}>
      <Card>
        <Steps current={currentStep} className={styles.stepsContainer}>
          <Step title={t('batch_import.steps.input_data')} icon={<FileTextOutlined />} />
          <Step title={t('batch_import.steps.preview_data')} icon={<PlaySquareOutlined />} />
          <Step title={t('batch_import.steps.upload_progress')} />
          <Step title={t('batch_import.steps.results')} />
        </Steps>

        {parseError && (
          <Alert
            message={parseError}
            type="error"
            showIcon
            closable
            onClose={() => setParseError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {currentStep === 0 && (
          <>
            <Form layout="vertical">
              <Form.Item 
                label={t('batch_import.label.period_selection')} 
                help={t('batch_import.help.period_selection')}
                required
              >
                <Select
                  placeholder={t('runs_page.form.placeholder.payroll_period')}
                  onChange={handlePeriodChange}
                  value={selectedPeriodId}
                  loading={loadingPeriods}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => 
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  popupMatchSelectWidth={false}
                  styles={{
                    popup: {
                      root: {
                        minWidth: '300px'
                      }
                    }
                  }}
                >
                  {payrollPeriods.map(period => (
                    <Option key={period.id} value={period.id}>
                      {period.name} ({period.start_date} ~ {period.end_date})
                      {period.status_lookup && period.status_lookup.value_code !== 'ACTIVE' && (
                        <Tag color={
                          period.status_lookup.value_code === 'CLOSED' ? 'blue' : 
                          period.status_lookup.value_code === 'ARCHIVED' ? 'gray' : 'gold'
                        } style={{ marginLeft: 8 }}>
                          {period.status_lookup.display_name}
                        </Tag>
                      )}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
              >
                <Tabs.TabPane key="table" tab={<><TableOutlined /> {t('batch_import.tab.table_input')}</>}>
                  <div className={styles.tabContentContainer}>
                    <TableTextConverter
                      namespace="payroll"
                      defaultApiFields={payrollApiFields}
                      predefinedMappingRules={payrollMappingRules}
                      processResultRecord={processPayrollRecord}
                    />
                  </div>
                </Tabs.TabPane>
                <Tabs.TabPane key="json" tab={<><FileTextOutlined /> {t('batch_import.tab.json_input')}</>}>
                  <div className={styles.tabContentContainer}>
                    <TextArea
                      ref={textAreaRef}
                      value={jsonInput}
                      onChange={handleJsonInputChange}
                      className={styles.jsonInputArea}
                      placeholder={t('batch_import.placeholder.enter_json')}
                      autoSize={{ minRows: 10, maxRows: 20 }}
                    />
                  </div>
                </Tabs.TabPane>
              </Tabs>

              <Form.Item 
                label={t('batch_import.label.overwrite_mode')} 
                help={t('batch_import.help.overwrite_mode')}
                valuePropName="checked"
              >
                <Switch checked={overwriteMode} onChange={setOverwriteMode} />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  onClick={handleParseAndPreview} 
                  icon={<PlaySquareOutlined />} 
                  disabled={!jsonInput.trim() || !selectedPeriodId}
                >
                  {t('batch_import.button.parse_and_preview')}
                </Button>
              </Form.Item>
            </Form>

            <Paragraph type="secondary" className={styles.helperText}>
              {t('batch_import.help.data_format_guidance_intro')}
              <pre>
                {loadingComponents ? '加载组件定义中...' : (() => {
                  // 获取部分收入组件和扣除组件用于示例
                  const earningComponents = componentDefinitions
                    .filter(comp => comp.type === 'EARNING')
                    .slice(0, 2); // 只取前两个作为示例
                  
                  const deductionComponents = componentDefinitions
                    .filter(comp => comp.type === 'DEDUCTION' || comp.type === 'PERSONAL_DEDUCTION')
                    .slice(0, 2); // 只取前两个作为示例
                  
                  // 构建示例数据
                  const exampleEarningsDetails = earningComponents.reduce((acc, comp) => {
                    acc[comp.code] = { 
                      amount: comp.code === 'BASIC_SALARY' ? 10000 : 5000, 
                      name: comp.name 
                    };
                    return acc;
                  }, {} as Record<string, any>);
                  
                  const exampleDeductionsDetails = deductionComponents.reduce((acc, comp) => {
                    acc[comp.code] = { 
                      amount: comp.code === 'PERSONAL_INCOME_TAX' ? 2000 : 1000, 
                      name: comp.name 
                    };
                    return acc;
                  }, {} as Record<string, any>);
                  
                  // 如果没有获取到组件定义，使用默认示例
                  if (earningComponents.length === 0) {
                    exampleEarningsDetails['BASIC_SALARY'] = { amount: 10000, name: '基本工资' };
                    exampleEarningsDetails['PERFORMANCE_BONUS'] = { amount: 5000, name: '绩效奖金' };
                  }
                  
                  if (deductionComponents.length === 0) {
                    exampleDeductionsDetails['PERSONAL_INCOME_TAX'] = { amount: 2000, name: '个人所得税' };
                    exampleDeductionsDetails['PENSION_PERSONAL_AMOUNT'] = { amount: 1000, name: '养老保险个人应缴金额' };
                  }
                  
                  const exampleData = [{
                    employee_id: 1,
                    employee_name: "张三",
                    department_name: "研发部",
                    position_name: "高级工程师",
                    total_earnings: 15000,
                    total_deductions: 3000,
                    net_pay: 12000,
                    status_lookup_value_name: "已计算",
                    remarks: "绩效优秀",
                    earnings_details: exampleEarningsDetails,
                    deductions_details: exampleDeductionsDetails
                  }];
                  
                  return JSON.stringify(exampleData, null, 2) + "\n  // ...更多记录";
                })()}
              </pre>
              {t('batch_import.notes.refer_to_documentation_for_fields')}
            </Paragraph>
          </>
        )}

        {currentStep === 1 && parsedData && (
          <>
            <Card title={t('batch_import.card_title.preview_data_count', { count: parsedData.length })}>
              <Alert
                message={
                  <Space>
                    <span>{t('common:records_total', { total: validationSummary.totalRecords })}</span>
                    <span>{t('common:records_valid', { count: validationSummary.validRecords })}</span>
                    <span>{t('common:records_invalid', { count: validationSummary.invalidRecords })}</span>
                  </Space>
                }
                type={validationSummary.invalidRecords > 0 ? "warning" : "success"}
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <p>{t('batch_import.notes.preview_warning_max_100')}</p>
              
              <Table 
                dataSource={parsedData.slice(0, 100)} 
                columns={columns} 
                rowKey="_clientId"
                size="small"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setCurrentStep(0)}>{t('common:button.back')}</Button>
                <Button 
                  type="primary" 
                  onClick={handleUpload}
                  disabled={validationSummary.validRecords === 0 || !selectedPeriodId}
                >
                  {t('common:button.upload')}
                </Button>
              </div>
            </Card>
          </>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>{t('batch_import.message.upload_in_progress')}</p>
          </div>
        )}

        {currentStep === 3 && renderResultContent()}
      </Card>
    </PageHeaderLayout>
  );
};

export default PayrollBulkImportPage;