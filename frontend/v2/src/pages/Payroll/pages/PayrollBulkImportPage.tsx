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
  Tag,
  Row,
  Col
} from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, PlaySquareOutlined, TableOutlined, DatabaseOutlined, FileAddOutlined, PartitionOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageLayout from '../../../components/common/PageLayout';
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
  PayrollComponentDefinition,
  BulkCreatePayrollEntriesResult
} from '../types/payrollTypes';
import {
  IS_PRODUCTION,
  ENABLE_PRODUCTION_RESTRICTIONS,
  PAYROLL_PERIOD_STATUS
} from './PayrollBulkImportPage/constants';
import type {
  EarningDetailItem,
  DeductionDetailItem,
  UploadResult,
  ValidationSummary
} from './PayrollBulkImportPage/constants';

// EarningDetailItem and DeductionDetailItem are moved to ./constants.ts

import TableTextConverter from '../../../components/common/TableTextConverter';
import PayrollPeriodSelector from '../../../components/common/PayrollPeriodSelector';
import { getPayrollPeriodStatusIdByCode } from '../utils/dynamicStatusUtils';
import { lookupService } from '../../../services/lookupService';
import {
  usePayrollApiFields,
  usePayrollMappingRules,
  getComponentName
} from './components/PayrollFieldMapper';
import { formatCurrency, generateDynamicColumns } from './PayrollBulkImportPage/payrollPageUtils'; // Import formatCurrency and generateDynamicColumns
// import { processPayrollRecord } from './PayrollBulkImportPage/dataProcessing'; // Removed duplicate import
// validateRecord, validateRegularSpecifics, validateHiredSpecifics 应该也从 dataProcessing 导入，稍后处理
import {
  processPayrollRecord, // This will be the single import for processPayrollRecord
  validateRecord,
  validateRegularSpecifics,
  validateHiredSpecifics,
  processAndValidateJsonData // Add processAndValidateJsonData to imports
} from './PayrollBulkImportPage/dataProcessing';
import { usePayrollPeriods, fetchPeriodDataStats, filterPayrollPeriods, isPeriodImportAllowed } from '../services/payrollPeriodService'; // Import the new hook and functions

// 环境配置和业务规则 (moved to constants.ts)
// const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// const ENABLE_PRODUCTION_RESTRICTIONS = IS_PRODUCTION; // 可以通过环境变量控制

// 薪资周期状态常量 (moved to constants.ts)
// const PAYROLL_PERIOD_STATUS = {
//   ACTIVE: 'ACTIVE',     // 活动状态 - 允许导入
//   CLOSED: 'CLOSED',     // 已关闭 - 生产环境禁止导入
//   ARCHIVED: 'ARCHIVED'  // 已归档 - 生产环境禁止导入
// } as const;

// UploadResult and ValidationSummary interfaces are moved to constants.ts

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const PayrollBulkImportPage: React.FC = () => {
  // useTranslation hook is called below, t and ready will be available in this scope.

  // Adapter function for TableTextConverter's processResultRecord prop
  const adaptedProcessRecordForTable = (recordFromTable: Record<string, any>): Record<string, any> => {
    // Assume recordFromTable can be cast or mapped to RawPayrollEntryData
    // This might need more sophisticated mapping if the structures differ significantly.
    const rawRecord = recordFromTable as unknown as RawPayrollEntryData;

    // Call the main processing function with additional context
    // t and componentDefinitions are accessible from the component's scope
    const processedRecord = processPayrollRecord(rawRecord, t, componentDefinitions);
    
    // Return as Record<string, any> as expected by TableTextConverter
    return processedRecord as Record<string, any>;
  };
  const { t, ready } = useTranslation(['payroll', 'common']); // Single call to useTranslation
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const textAreaRef = useRef<TextAreaRef>(null);
  const [parsedData, setParsedData] = useState<ValidatedPayrollEntryData[] | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({ totalRecords: 0, validRecords: 0, invalidRecords: 0 });
  const [activeTab, setActiveTab] = useState<string>('table'); // 默认显示表格输入
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false);
  const [validationEnabled, setValidationEnabled] = useState<boolean>(true); // 默认启用校验
  const [showDetailedErrors, setShowDetailedErrors] = useState<boolean>(false);
  
  // 使用新的 usePayrollPeriods Hook
  const { 
    payrollPeriods,
    selectedPeriodId,
    setSelectedPeriodId,
    loadingPeriods,
    periodDataStats,
    fetchPayrollPeriods
  } = usePayrollPeriods(t, message);

  // 添加组件定义状态
  const [componentDefinitions, setComponentDefinitions] = useState<PayrollComponentDefinition[]>([]);
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false);
  
  // 添加状态ID缓存
  const [defaultPayrollEntryStatusId, setDefaultPayrollEntryStatusId] = useState<number | null>(null);
  
  // 获取动态映射规则的Hooks
  const payrollApiFields = useMemo(() => {
    // 基础字段映射
    const baseFields = [
      { key: 'employee_code', label: t('batch_import.fields.employee_code'), required: false },
      { key: 'employee_full_name', label: t('batch_import.fields.employee_full_name'), required: true },
      { key: 'id_number', label: t('batch_import.fields.id_number'), required: true },
      { key: 'gross_pay', label: t('batch_import.fields.gross_pay'), required: true },
      { key: 'total_deductions', label: t('batch_import.fields.total_deductions'), required: true },
      { key: 'net_pay', label: t('batch_import.fields.net_pay'), required: true },
      { key: 'remarks', label: t('batch_import.fields.remarks'), required: false },
    ];
    
    // 动态添加收入字段 - 使用工具函数判断类型，包含STAT类型的统计字段
    const earningFields = componentDefinitions
      .filter(comp => isEarningComponentType(comp.type) || comp.type === 'STAT')
      .map(comp => ({
        key: `earnings_details.${comp.code}.amount`,
        label: comp.name + (comp.type === 'STAT' ?      t('payroll:auto____2028e7'): ''),
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
    return result;
  }, [componentDefinitions, t]);
  
  // 动态生成字段映射规则
  const payrollMappingRules = useMemo(() => {
    const mappingRules: Record<string, string> = {
      // 忽略字段（非工资相关）- 使用特殊标识便于审核
      [t('batch_import.mapping.serial_number')]: '__IGNORE_FIELD__',
      // t('batch_import.mapping.personnel_identity'): '__IGNORE_FIELD__', // 保留这个给下面更具体的映射
      [t('batch_import.mapping.personnel_level')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.salary_unified')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.fiscal_support')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.department')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.department_name')]: '__IGNORE_FIELD__',
      
      // 新增：映射t('payroll:auto_text_e4baba')到一个内部字段
      [t('batch_import.mapping.personnel_identity')]: 'raw_personnel_identity',
      [t('payroll:auto_text_e4baba')]: 'raw_personnel_identity', // 直接中文映射
      
      // 员工匹配字段
      [t('batch_import.mapping.personnel_number')]: 'employee_code',
      [t('batch_import.mapping.employee_id')]: 'employee_code',
      [t('batch_import.mapping.employee_number')]: 'employee_code',
      [t('batch_import.mapping.work_number')]: 'employee_code',
      [t('batch_import.mapping.personnel_name')]: 'employee_full_name',
      [t('batch_import.mapping.name')]: 'employee_full_name',
      [t('batch_import.mapping.employee_name')]: 'employee_full_name',
      [t('batch_import.mapping.id_card')]: 'id_number',
      [t('batch_import.mapping.id_number')]: 'id_number',
      [t('batch_import.mapping.id_card_number')]: 'id_number',
      
      // 计算字段
      [t('batch_import.mapping.gross_salary')]: 'gross_pay',
      [t('batch_import.mapping.total_income')]: 'gross_pay',
      [t('batch_import.mapping.salary_total')]: 'gross_pay',
      [t('batch_import.mapping.total_earnings')]: 'gross_pay',
      [t('batch_import.mapping.gross_total')]: 'gross_pay',
      [t('batch_import.mapping.net_salary')]: 'net_pay',
      [t('batch_import.mapping.net_pay')]: 'net_pay',
      [t('batch_import.mapping.actual_amount')]: 'net_pay',
      [t('batch_import.mapping.net_total')]: 'net_pay',
      [t('batch_import.mapping.deduction_total')]: 'total_deductions',
      [t('batch_import.mapping.total_deductions')]: 'total_deductions',
      [t('batch_import.mapping.deduction_amount')]: 'total_deductions',
      [t('batch_import.mapping.total_deduction_amount')]: 'total_deductions',
      [t('batch_import.mapping.should_deduct_total')]: 'total_deductions',
      
      // 其他字段
      [t('batch_import.mapping.remarks')]: 'remarks',
      [t('batch_import.mapping.description')]: 'remarks',
    };
    
    // 动态添加收入项映射规则（包含STAT统计字段）
    componentDefinitions
      .filter(comp => isEarningComponentType(comp.type) || comp.type === 'STAT')
      .forEach(comp => {
        // 使用组件code作为映射目标
        mappingRules[comp.name] = `earnings_details.${comp.code}.amount`;
      });
    
    // 动态添加扣除项映射规则
    componentDefinitions
      .filter(comp => isDeductionComponentType(comp.type))
      .forEach(comp => {
        // 使用组件code作为映射目标
        mappingRules[comp.name] = `deductions_details.${comp.code}.amount`;
      });
    
    // 添加基于提供数据的具体映射
    const specificMappings: Record<string, string> = {
      // 收入项 - 基础工资类（使用新的复合字段组件）
      [t('components.earnings.position_tech_grade_salary')]: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
      [t('payroll:auto____e8818c')]: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
      [t('payroll:auto___e8818c')]: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
      
      [t('components.earnings.grade_position_level_salary')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
      [t('payroll:auto____e7baa7')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
      [t('payroll:auto___e7baa7')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
      [t('components.earnings.grade_salary')]: 'earnings_details.GRADE_SALARY.amount',
      [t('payroll:auto_text_e7baa7')]: 'earnings_details.GRADE_SALARY.amount',
      [t('components.earnings.position_salary_general')]: 'earnings_details.POSITION_SALARY_GENERAL.amount',
      [t('payroll:auto_text_e5b297')]: 'earnings_details.POSITION_SALARY_GENERAL.amount',
      
      [t('components.earnings.staff_salary_grade')]: 'earnings_details.STAFF_SALARY_GRADE.amount',
      [t('payroll:auto_text_e896aa')]: 'earnings_details.STAFF_SALARY_GRADE.amount',
      [t('components.earnings.basic_salary')]: 'earnings_details.BASIC_SALARY.amount',
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_SALARY.amount',
      
      // 收入项 - 绩效类
      [t('components.earnings.basic_performance_award')]: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount',
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount',
      [t('components.earnings.basic_performance_salary')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
      [t('payroll:auto_text_e69c88')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
      [t('components.earnings.performance_bonus')]: 'earnings_details.PERFORMANCE_BONUS.amount',
      [t('payroll:auto_text_e69c88')]: 'earnings_details.PERFORMANCE_BONUS.amount',
      [t('payroll:auto_text_e5a596')]: 'earnings_details.PERFORMANCE_BONUS.amount',
      [t('payroll:auto_text_e5a596')]: 'earnings_details.PERFORMANCE_BONUS.amount',
      [t('payroll:auto_text_e7bba9')]: 'earnings_details.PERFORMANCE_BONUS.amount',
      
      // 收入项 - 津贴补贴类
      [t('components.earnings.reform_allowance_1993')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
      [t('payroll:auto_93_3933e5')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
      [t('payroll:auto_text_e4b99d')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
      [t('components.earnings.only_child_parent_bonus')]: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount',
      [t('payroll:auto_text_e78bac')]: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount',
      [t('components.earnings.civil_standard_allowance')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
      [t('payroll:auto_text_e585ac')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
      [t('payroll:auto_text_e585ac')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
      [t('components.earnings.traffic_allowance')]: 'earnings_details.TRAFFIC_ALLOWANCE.amount',
      [t('payroll:auto_text_e585ac')]: 'earnings_details.TRAFFIC_ALLOWANCE.amount',
      [t('components.earnings.position_allowance')]: 'earnings_details.POSITION_ALLOWANCE.amount',
      [t('payroll:auto_text_e5b297')]: 'earnings_details.POSITION_ALLOWANCE.amount',
      [t('components.earnings.petition_allowance')]: 'earnings_details.PETITION_ALLOWANCE.amount',
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
      [t('payroll:auto_text_e4bfa1')]: 'earnings_details.PETITION_ALLOWANCE.amount',
      [t('components.earnings.township_allowance')]: 'earnings_details.TOWNSHIP_ALLOWANCE.amount',
      [t('payroll:auto_text_e4b9a1')]: 'earnings_details.TOWNSHIP_ALLOWANCE.amount',
      
      // 收入项 - 补发类
      [t('components.earnings.back_pay')]: 'earnings_details.BACK_PAY.amount',
      [t('payroll:auto_text_e8a1a5')]: 'earnings_details.BACK_PAY.amount',
      
      // 收入项 - 试用期
      [t('components.earnings.probation_salary')]: 'earnings_details.PROBATION_SALARY.amount',
      [t('payroll:auto_text_e8a781')]: 'earnings_details.PROBATION_SALARY.amount',
      [t('payroll:auto_text_e8af95')]: 'earnings_details.PROBATION_SALARY.amount',
      
      // 扣除项 - 社保类
      [t('components.deductions.pension_personal_amount')]: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
      [t('components.deductions.medical_ins_personal_amount')]: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
      [t('components.deductions.occupational_pension_personal_amount')]: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount',
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount',
      [t('components.deductions.unemployment_personal_amount')]: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
      [t('components.deductions.housing_fund_personal')]: 'deductions_details.HOUSING_FUND_PERSONAL.amount',
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.HOUSING_FUND_PERSONAL.amount',
      [t('payroll:auto_text_e8a1a5')]: 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', // 社保补扣专用字段
      
      // 扣除项 - 税收类
      [t('components.deductions.personal_income_tax')]: 'deductions_details.PERSONAL_INCOME_TAX.amount',
      [t('payroll:auto_text_e4b8aa')]: 'deductions_details.PERSONAL_INCOME_TAX.amount',
      
      // === 聘用人员专用字段映射 ===
      // 收入项 - 聘用人员特有
      [t('payroll:auto_text_e7bba9')]: 'earnings_details.PERFORMANCE_SALARY.amount',
      [t('payroll:auto_text_e8a1a5')]: 'earnings_details.ALLOWANCE_GENERAL.amount',
      [t('payroll:auto_text_e59fba')]: 'earnings_details.BASIC_PERFORMANCE.amount',
      [t('payroll:auto_text_e6b4a5')]: 'earnings_details.GENERAL_ALLOWANCE.amount',
      [t('payroll:auto_text_e5ada3')]: 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount',
      
      // 扣除调整项 - 聘用人员特有
      [t('payroll:auto_text_e4b880')]: 'deductions_details.ONE_TIME_DEDUCTION_ADJUSTMENT.amount',
      [t('payroll:auto_text_e7bba9')]: 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount',
      [t('payroll:auto_text_e5a596')]: 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount',
      [t('payroll:auto____e8a1a5')]: 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount',
      [t('payroll:auto_2022_e8a1a5')]: 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount',
      
      // 统计字段 - 不参与收入计算，但需要存储
      [t('payroll:auto_text_e59bba')]: 'earnings_details.ANNUAL_FIXED_SALARY_TOTAL.amount',
      [t('payroll:auto_1_31e5ad')]: 'earnings_details.QUARTERLY_PERFORMANCE_Q1.amount',
      
      // 标识类字段 - 聘用人员特有（这些字段会被忽略，不参与计算）
      [t('payroll:auto_text_e5b7a5')]: '__IGNORE_FIELD__', // 忽略标识字段
      [t('payroll:auto_text_e8b4a2')]: '__IGNORE_FIELD__', // 忽略标识字段
    };
    
    // 合并映射规则
    Object.assign(mappingRules, specificMappings);
    
    // 添加容错映射规则（处理可能的空格和特殊字符）
    const tolerantMappings: Record<string, string> = {};
    Object.keys(mappingRules).forEach(key => {
      // 创建去除空格的版本
      const trimmedKey = key.replace(/\s+/g, '');
      if (trimmedKey !== key) {
        tolerantMappings[trimmedKey] = mappingRules[key];
      }
      // 创建去除所有空白字符的版本
      const noSpaceKey = key.replace(/\s/g, '');
      if (noSpaceKey !== key && noSpaceKey !== trimmedKey) {
        tolerantMappings[noSpaceKey] = mappingRules[key];
      }
    });
    
    Object.assign(mappingRules, tolerantMappings);
    
    return mappingRules;
  }, [componentDefinitions, t]);
  
  // 加载薪资字段定义
  useEffect(() => {
    const fetchComponentDefinitions = async () => {
      setLoadingComponents(true);
      try {
        // 直接使用payrollConfigService，移除备用机制
        const response = await getPayrollComponentDefinitions({ 
          is_enabled: true,
          size: 100  // 增加分页大小以获取更多组件
        });
        setComponentDefinitions(response.data);
        
        if (response.data.length > 0) {
          if (response.meta && response.meta.total > response.data.length) {
          }
        } else {
        }
      } catch (error: any) {
        
        // 显示用户友好的错误信息
        if (error.response?.status === 403) {
          message.error(t('batch_import.error_permission_denied', { defaultValue: t('payroll:auto___e69d83') }));
        } else if (error.response?.status === 404) {
          message.error(t('batch_import.error_api_not_found', { defaultValue: t('payroll:auto_api__415049') }));
        } else {
          message.error(t('batch_import.error_fetch_components', { defaultValue: t('payroll:auto___e88eb7') }));
        }
        
        // 设置空数组，避免页面崩溃
        setComponentDefinitions([]);
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

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    if (parseError) {
      setParseError(null);
    }
  };

  const handlePeriodChange = (value: number | null) => {
    setSelectedPeriodId(value);
    const selectedPeriod = payrollPeriods.find(p => p.id === value);
    console.log({
      id: value,
      name: selectedPeriod?.name,
      status: selectedPeriod?.status_lookup?.name,
      dateRange: `${selectedPeriod?.start_date} ~ ${selectedPeriod?.end_date}`,
    });
  };

  // processAndValidateJsonData function has been moved to dataProcessing.ts

  const handleParseAndPreview = () => {
    // 如果在表格输入标签，提示用户使用表格转换器
    if (activeTab === 'table') {
      message.info(t('batch_import.message.use_table_converter_first'));
      return;
    }
    
    
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

      const validatedDataArray = processAndValidateJsonData(
        parsedJson,
        t,
        componentDefinitions,
        formatCurrency, // Assuming formatCurrency is imported from payrollPageUtils
        validationEnabled
      );
      setParsedData(validatedDataArray);

      // Calculate and set validation summary
      const totalRecords = validatedDataArray.length;
      const validRecordsCount = validatedDataArray.filter(record => record.__isValid).length;
      setValidationSummary({
        totalRecords: totalRecords,
        validRecords: validRecordsCount,
        invalidRecords: totalRecords - validRecordsCount,
      });

      setCurrentStep(1);
      message.success(t('batch_import.message.file_parsed_success', { count: totalRecords }));
    } catch (error) {
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
    
    // 生产环境额外安全检查：确保选中的周期允许导入
    if (ENABLE_PRODUCTION_RESTRICTIONS) {
      const selectedPeriod = payrollPeriods.find(p => p.id === selectedPeriodId);
      if (selectedPeriod && !isPeriodImportAllowed(selectedPeriod)) {
        message.error(t('payroll:auto___e7949f'));
        return;
      }
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
        const { _clientId, validationErrors, originalIndex, employee_name, department_name, position_name, status_lookup_value_name, employee_full_name, last_name, first_name, id_number, employee_code, ...apiPayload } = record;
        
        // 创建符合API要求的数据结构
        const entryPayload: CreatePayrollEntryPayload = {
          employee_id: apiPayload.employee_id || 0,  // 如果没有employee_id，传0让后端通过employee_info匹配
          payroll_period_id: selectedPeriodId, // 添加必需的payroll_period_id字段
          payroll_run_id: 0, // 这个值会在后端根据payroll_period_id创建或查找合适的payroll_run
          gross_pay: apiPayload.gross_pay,
          total_deductions: apiPayload.total_deductions,
          net_pay: apiPayload.net_pay,
          status_lookup_value_id: apiPayload.status_lookup_value_id || defaultPayrollEntryStatusId || 1, // 使用动态获取的状态ID，如果都没有则使用默认值1
          remarks: apiPayload.remarks,
          earnings_details: apiPayload.earnings_details,
          deductions_details: apiPayload.deductions_details || {},
          // 添加员工匹配信息
          employee_info: apiPayload.employee_info
        };
        
        return entryPayload;
      });

      const bulkPayload = {
        payroll_period_id: selectedPeriodId,
        entries: payloadEntries,
        overwrite_mode: overwriteMode,
      };

      console.log('Bulk payload debugging:', {
        payroll_period_id: selectedPeriodId,
        entries_count: payloadEntries.length,
        overwrite_mode: overwriteMode,
        selected_period_name: payrollPeriods.find(p => p.id === selectedPeriodId)?.name,
      });
      
      // 添加更详细的调试信息
      if (payloadEntries.length > 0) {
        const firstEntry = payloadEntries[0];
        if (firstEntry.deductions_details) {
          Object.entries(firstEntry.deductions_details).forEach(([code, detail]) => {
            // Add some console.log here to inspect details if needed
          });
        }
      }

      const response = await payrollApi.bulkCreatePayrollEntries(bulkPayload);
      
      // 使用新的响应格式
      const result = response;
      
      // 添加更多调试信息
      console.log('Bulk upload result debugging:', {
        success_count: result?.success_count,
        error_count: result?.error_count,
        errors: result?.errors,
        created_entries: result?.created_entries,
      });
      
      // 添加详细的错误信息输出
      if (result?.errors && result.errors.length > 0) {
        result.errors.forEach((err: any, index: number) => {
          console.log(`Error ${index + 1}:`, {
            employee_id: err.employee_id,
            employee_name: err.employee_name,
            index: err.index,
            error: err.error,
            detail: err.detail || err.message || t('payroll:auto_text_e697a0'),
          });
        });
        
        // 检查第一个错误的详细信息
        if (result.errors[0]) {
          console.log('First error detail:', result.errors[0]);
        }
      }
      
      try {
        // 检查result是否存在必需的字段
        if (!result || typeof result.success_count === 'undefined' || typeof result.error_count === 'undefined') {
          throw new Error(t('payroll:auto_text_e5938d'));
        }
        
        // 确保errors是数组
        const errors = Array.isArray(result.errors) ? result.errors : [];
        const createdEntries = Array.isArray(result.created_entries) ? result.created_entries : [];
        
        setUploadResult({
          successCount: result.success_count || 0,
          errorCount: result.error_count || 0,
          errors: errors.map(err => ({
            record: { employee_id: err.employee_id, index: err.index },
            error: err.error
          })),
          createdEntries: createdEntries
        });
      } catch (resultError) {
        throw resultError;
      }
      
      message.success(t('batch_import.message.upload_success', { count: result.success_count }));
      
      if (result.error_count > 0) {
        message.warning(t('batch_import.message.upload_partial_success', { 
          success: result.success_count, 
          error: result.error_count 
        }));
      }

      setCurrentStep(3);
    } catch (error: any) {
      
      let extractedErrorMessage = t('common:error.unknown');
      let detailedErrorMessage = '';
      let isDuplicateError = false;
      
      // 检查是否是重复记录错误
      const errorString = JSON.stringify(error.response?.data || error.message || error);
      if (errorString.includes('duplicate key value violates unique constraint') || 
          errorString.includes('uq_payroll_entries_employee_period_run') ||
          errorString.includes('already exists')) {
        isDuplicateError = true;
        extractedErrorMessage = t('payroll:auto_text_e6a380');
        detailedErrorMessage = t('payroll:auto____e983a8');
      } else if (error.response?.data?.detail) {
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

      // 显示不同类型的错误消息
      if (isDuplicateError) {
        message.error({
          content: (
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>❌ {t('payroll:auto_text_e58fbc')}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('payroll:auto_text_e983a8')}
              </div>
              <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 4 }}>
                💡 {t('payroll:auto_text_e8a7a3')}
              </div>
            </div>
          ),
          duration: 8
        });
      } else {
        message.error(`${t('batch_import.message.upload_failed_prefix')} ${extractedErrorMessage}`);
      }
      
      setUploadResult({
        successCount: 0,
        errorCount: validRecords.length,
        errors: validRecords.map(record => ({ 
            record,
            error: isDuplicateError ? t('payroll:auto___e8afa5') : extractedErrorMessage 
        })),
        createdEntries: [] 
      });
      setCurrentStep(3); 
    } finally {
      setUploading(false);
    }
  };

  const renderValidationErrors = (errors?: string[]) => {
    if (!errors || errors.length === 0) return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />;
    return (
      <Tooltip 
        title={<div className={styles.validationErrorsInTable}><ul>{errors.map((e, i) => <li key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>)}</ul></div>}
        styles={{ body: { whiteSpace: 'normal', maxWidth: 400 } }}
      >
        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
      </Tooltip>
    );
  };

  // generateDynamicColumns function has been moved to payrollPageUtils.tsx
  // The local formatCurrency function inside it was also moved.

  // 使用动态列或静态列
  const columns = useMemo(() => {
    if (parsedData && parsedData.length > 0) {
      // Call imported generateDynamicColumns and pass necessary arguments
      return generateDynamicColumns(parsedData, t, componentDefinitions, renderValidationErrors);
    }
    // formatCurrencyDefault is no longer needed here as generateDynamicColumns uses the global formatCurrency

    // 默认静态列（用于初始状态）
    return [
      { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
      { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
      { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) }, // Use imported formatCurrency
      { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) }, // Use imported formatCurrency
      { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) }, // Use imported formatCurrency
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
  }, [parsedData, t, componentDefinitions]);

  const resultErrorColumns = [
    { title: t('batch_import.results_table.employee_id'), dataIndex: ['record', 'employee_id'], key: 'employee_id', render: (text: any, item:any) => item.record?.employee_id || '-' },
    { title: t('batch_import.results_table.employee_name'), dataIndex: ['record', 'employee_name'], key: 'employee_name', render: (text: any, item:any) => item.record?.employee_name || '-' },
    { 
      title: t('batch_import.results_table.error_message'), 
      dataIndex: 'error', 
      key: 'error',
      render: (error: any) => {
        if (error === null || error === undefined) return '-';
        const errorText = typeof error === 'object' ? JSON.stringify(error) : String(error);
        
        // 检查是否是重复记录错误
        if (errorText.includes(t('payroll:auto_text_e5b7b2')) || errorText.includes(t('payroll:auto_text_e8a686')) || errorText.includes('duplicate')) {
          return (
            <div>
              <div style={{ color: '#ff4d4f', marginBottom: 4 }}>
                🔄 {errorText}
              </div>
              <div style={{ fontSize: '12px', color: '#1890ff' }}>
                💡 {t('payroll:auto_text_e8a7a3')}
              </div>
            </div>
          );
        }
        
        return errorText;
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
      
      // 使用正确的翻译方式，确保参数被替换
      title = t('payroll:batch_import.results.all_failed_at_server', { count: uploadResult.errorCount });
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
            {/* 检查是否有重复记录错误，显示特殊提示 */}
            {uploadResult.errors.some(err => 
              String(err.error).includes(t('payroll:auto_text_e5b7b2')) || 
              String(err.error).includes(t('payroll:auto_text_e8a686')) || 
              String(err.error).includes('duplicate')
            ) && (
              <Alert
                message={t('payroll:auto_text_e6a380')}
                description={
                  <div>
                    <p>{t('payroll:auto_text_e983a8')}</p>
                    <p><strong>{t('payroll:auto_text_e8a7a3')}</strong></p>
                    <ol style={{ marginLeft: 16, marginBottom: 0 }}>
                      <li>{t('payroll:auto_text_e9878d')}</li>
                      <li>{t('payroll:auto_json_4a534f')}</li>
                      <li>{t('payroll:auto_text_e8a686')}</li>
                      <li>{t('payroll:auto_text_e9878d')}</li>
                    </ol>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button 
                    size="small" 
                    type="primary" 
                    onClick={handleStartAgain}
                  >
                    {t('batch_import.button.re_import')}
                  </Button>
                }
              />
            )}
            
            <Button 
              type="link" 
              onClick={() => setShowDetailedErrors(!showDetailedErrors)}
              style={{ marginBottom: 16 }}
            >
              {showDetailedErrors 
                ? t('batch_import.button.hide_error_details') : t('batch_import.button.show_error_details')}
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
                  rowClassName={() => styles.invalidRow}
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



  return (
    <PageLayout
      title={t('batch_import.page_title')}
      actions={
        <Space>
          <Button
            onClick={() => navigate('/payroll/entries')}
            shape="round"
          >
            {t('batch_import.button.back_to_entries')}
          </Button>
        </Space>
      }
    >
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
              <PayrollPeriodSelector
                value={selectedPeriodId}
                onChange={handlePeriodChange}
                mode="form"
                required={true}
                showDataStats={true}
                enableProductionRestrictions={ENABLE_PRODUCTION_RESTRICTIONS}
              />

              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                  {
                    key: 'table',
                    label: <><TableOutlined /> {t('batch_import.tab.table_input')}</>,
                    children: (
                      <div className={styles.tabContentContainer}>
                        <TableTextConverter
                          namespace="payroll"
                          defaultApiFields={payrollApiFields}
                          predefinedMappingRules={payrollMappingRules}
                          processResultRecord={adaptedProcessRecordForTable} // Use the adapter function
                          onConvertToJson={(jsonData) => {
                            // 将转换后的JSON数据设置到输入框
                            setJsonInput(JSON.stringify(jsonData, null, 2));
                            // 切换到JSON标签页
                            setActiveTab('json');
                            // 显示成功消息
                            message.success(t('batch_import.message.table_converted_success', { count: jsonData.length }));
                          }}
                        />
                      </div>
                    )
                  },
                  {
                    key: 'json',
                    label: <><FileTextOutlined /> {t('batch_import.tab.json_input')}</>,
                    children: (
                      <div className={styles.tabContentContainer}>
                        <TextArea
                          ref={textAreaRef}
                          value={jsonInput}
                          onChange={handleJsonInputChange}
                          className={styles.jsonInputArea}
                          placeholder={t('batch_import.placeholder.enter_json')}
                          autoSize={{ minRows: 10, maxRows: 20 }}
                        />
                        
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

                        <Row gutter={16} align="middle" style={{ marginTop: '10px', marginBottom: '20px' }}>
                          <Col>
                            <Tooltip title={t('batch_import.help.overwrite_mode')}>
                              <Form.Item 
                                label={t('batch_import.options.overwrite_mode')} 
                                valuePropName="checked"
                                style={{ marginBottom: 0 }}
                              >
                                <Switch 
                                  checked={overwriteMode}
                                  onChange={setOverwriteMode} 
                                />
                              </Form.Item>
                            </Tooltip>
                          </Col>
                          <Col>
                            <Tooltip title={t('batch_import.help.validation_mode_tooltip')}> 
                              <Form.Item 
                                label={t('batch_import.options.validation_mode_label')} 
                                valuePropName="checked"
                                style={{ marginBottom: 0 }}
                              >
                                <Switch 
                                  checked={validationEnabled}
                                  onChange={setValidationEnabled} 
                                />
                              </Form.Item>
                            </Tooltip>
                          </Col>
                        </Row>
                      </div>
                    )
                  }
                ]}
              />
            </Form>
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
                rowClassName={(record) => {
                  // 如果记录有验证错误，标红显示
                  return record.validationErrors && record.validationErrors.length > 0 
                    ? styles.invalidRow 
                    : '';
                }}
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
    </PageLayout>
  );
};

export default PayrollBulkImportPage;