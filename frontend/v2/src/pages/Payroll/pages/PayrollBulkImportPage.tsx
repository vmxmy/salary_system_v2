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
import TableTextConverter from '../../../components/common/TableTextConverter';
import PayrollPeriodSelector from '../../../components/common/PayrollPeriodSelector';
import { getPayrollPeriodStatusIdByCode } from '../utils/dynamicStatusUtils';
import { lookupService } from '../../../services/lookupService';

// 环境配置和业务规则
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_PRODUCTION_RESTRICTIONS = IS_PRODUCTION; // 可以通过环境变量控制

// 薪资周期状态常量（这些值应该与后端lookup_values表中的实际ID对应）
const PAYROLL_PERIOD_STATUS = {
  ACTIVE: 'ACTIVE',     // 活动状态 - 允许导入
  CLOSED: 'CLOSED',     // 已关闭 - 生产环境禁止导入
  ARCHIVED: 'ARCHIVED'  // 已归档 - 生产环境禁止导入
} as const;

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
  const [validationEnabled, setValidationEnabled] = useState<boolean>(true); // 默认启用校验
  const [showDetailedErrors, setShowDetailedErrors] = useState<boolean>(false);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(false);
  
  // 添加薪资周期数据统计状态
  const [periodDataStats, setPeriodDataStats] = useState<Record<number, { count: number; loading: boolean }>>({});
  
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
        label: comp.name + (comp.type === 'STAT' ? ' (统计)' : ''),
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
    console.log('=== payrollApiFields 生成详情 ===');
    console.log('componentDefinitions数量:', componentDefinitions.length);
    console.log('基础字段数量:', baseFields.length);
    console.log('收入字段数量:', earningFields.length);
    console.log('扣除字段数量:', deductionFields.length);
    console.log('总字段数量:', result.length);
    console.log('生成的payrollApiFields:', result);
    console.log('=== 详情结束 ===');
    return result;
      }, [componentDefinitions, t]);
  
  // 动态生成字段映射规则
  const payrollMappingRules = useMemo(() => {
    const mappingRules: Record<string, string> = {
      // 忽略字段（非工资相关）- 使用特殊标识便于审核
      [t('batch_import.mapping.serial_number')]: '__IGNORE_FIELD__',
      // [t('batch_import.mapping.personnel_identity')]: '__IGNORE_FIELD__', // 保留这个给下面更具体的映射
      [t('batch_import.mapping.personnel_level')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.salary_unified')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.fiscal_support')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.department')]: '__IGNORE_FIELD__',
      [t('batch_import.mapping.department_name')]: '__IGNORE_FIELD__',
      
      // 新增：映射"人员身份"到一个内部字段
      [t('batch_import.mapping.personnel_identity')]: 'raw_personnel_identity',
      '人员身份': 'raw_personnel_identity', // 直接中文映射
      
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
      '职务/技术等级 工资': 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
      '职务/技术等级工资': 'earnings_details.POSITION_TECH_GRADE_SALARY.amount',
      
      [t('components.earnings.grade_position_level_salary')]: 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
      '级别/岗位级别 工资': 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
      '级别/岗位级别工资': 'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount',
      [t('components.earnings.grade_salary')]: 'earnings_details.GRADE_SALARY.amount',
      '级别工资': 'earnings_details.GRADE_SALARY.amount',
      [t('components.earnings.position_salary_general')]: 'earnings_details.POSITION_SALARY_GENERAL.amount',
      '岗位工资': 'earnings_details.POSITION_SALARY_GENERAL.amount',
      
      [t('components.earnings.staff_salary_grade')]: 'earnings_details.STAFF_SALARY_GRADE.amount',
      '薪级工资': 'earnings_details.STAFF_SALARY_GRADE.amount',
      [t('components.earnings.basic_salary')]: 'earnings_details.BASIC_SALARY.amount',
      '基本工资': 'earnings_details.BASIC_SALARY.amount',
      
      // 收入项 - 绩效类
      [t('components.earnings.basic_performance_award')]: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount',
      '基础绩效奖': 'earnings_details.BASIC_PERFORMANCE_AWARD.amount',
      [t('components.earnings.basic_performance_salary')]: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
      '月基础绩效': 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
      '基础性绩效工资': 'earnings_details.BASIC_PERFORMANCE_SALARY.amount',
      [t('components.earnings.performance_bonus')]: 'earnings_details.PERFORMANCE_BONUS.amount',
      '月奖励绩效': 'earnings_details.PERFORMANCE_BONUS.amount',
      '奖励性绩效工资': 'earnings_details.PERFORMANCE_BONUS.amount',
      '奖励绩效': 'earnings_details.PERFORMANCE_BONUS.amount',
      '绩效奖励': 'earnings_details.PERFORMANCE_BONUS.amount',
      
      // 收入项 - 津贴补贴类
      [t('components.earnings.reform_allowance_1993')]: 'earnings_details.REFORM_ALLOWANCE_1993.amount',
      '93年工改保留补贴': 'earnings_details.REFORM_ALLOWANCE_1993.amount',
      '九三年工改保留津补贴': 'earnings_details.REFORM_ALLOWANCE_1993.amount',
      [t('components.earnings.only_child_parent_bonus')]: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount',
      '独生子女父母奖励金': 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount',
      [t('components.earnings.civil_standard_allowance')]: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
      '公务员规范性津贴补贴': 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
      '公务员规范后津补贴': 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount',
      [t('components.earnings.traffic_allowance')]: 'earnings_details.TRAFFIC_ALLOWANCE.amount',
      '公务交通补贴': 'earnings_details.TRAFFIC_ALLOWANCE.amount',
      [t('components.earnings.position_allowance')]: 'earnings_details.POSITION_ALLOWANCE.amount',
      '岗位职务补贴': 'earnings_details.POSITION_ALLOWANCE.amount',
      [t('components.earnings.petition_allowance')]: 'earnings_details.PETITION_ALLOWANCE.amount',
      '信访工作人员岗位津贴': 'earnings_details.PETITION_ALLOWANCE.amount',
      '信访工作人员岗位工作津贴': 'earnings_details.PETITION_ALLOWANCE.amount',
      '信访岗位津贴': 'earnings_details.PETITION_ALLOWANCE.amount',
      '信访津贴': 'earnings_details.PETITION_ALLOWANCE.amount',
      [t('components.earnings.township_allowance')]: 'earnings_details.TOWNSHIP_ALLOWANCE.amount',
      '乡镇工作补贴': 'earnings_details.TOWNSHIP_ALLOWANCE.amount',
      
      // 收入项 - 补发类
      [t('components.earnings.back_pay')]: 'earnings_details.BACK_PAY.amount',
      '补发工资': 'earnings_details.BACK_PAY.amount',
      
      // 收入项 - 试用期
      [t('components.earnings.probation_salary')]: 'earnings_details.PROBATION_SALARY.amount',
      '见习试用期工资': 'earnings_details.PROBATION_SALARY.amount',
      '试用期工资': 'earnings_details.PROBATION_SALARY.amount',
      
      // 扣除项 - 社保类
      [t('components.deductions.pension_personal_amount')]: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
      '个人缴养老保险费': 'deductions_details.PENSION_PERSONAL_AMOUNT.amount',
      [t('components.deductions.medical_ins_personal_amount')]: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
      '个人缴医疗保险费': 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount',
      [t('components.deductions.occupational_pension_personal_amount')]: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount',
      '个人缴职业年金': 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount',
      [t('components.deductions.unemployment_personal_amount')]: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
      '个人缴失业保险费': 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount',
      [t('components.deductions.housing_fund_personal')]: 'deductions_details.HOUSING_FUND_PERSONAL.amount',
      '个人缴住房公积金': 'deductions_details.HOUSING_FUND_PERSONAL.amount',
      '补扣社保': 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', // 社保补扣专用字段
      
      // 扣除项 - 税收类
      [t('components.deductions.personal_income_tax')]: 'deductions_details.PERSONAL_INCOME_TAX.amount',
      '个人所得税': 'deductions_details.PERSONAL_INCOME_TAX.amount',
      
      // === 聘用人员专用字段映射 ===
      // 收入项 - 聘用人员特有
      '绩效工资': 'earnings_details.PERFORMANCE_SALARY.amount',
      '补助': 'earnings_details.ALLOWANCE_GENERAL.amount',
      '基础绩效': 'earnings_details.BASIC_PERFORMANCE.amount',
      '津贴': 'earnings_details.GENERAL_ALLOWANCE.amount',
      '季度绩效考核薪酬': 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount',
      
      // 扣除调整项 - 聘用人员特有
      '一次性补扣发': 'deductions_details.ONE_TIME_DEDUCTION_ADJUSTMENT.amount',
      '绩效奖金补扣发': 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount',
      '奖励绩效补扣发': 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount',
      '补扣（退）款': 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount',
      '补扣2022年医保款': 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount',
      
      // 统计字段 - 不参与收入计算，但需要存储
      '固定薪酬全年应发数': 'earnings_details.ANNUAL_FIXED_SALARY_TOTAL.amount',
      '1季度绩效考核薪酬': 'earnings_details.QUARTERLY_PERFORMANCE_Q1.amount',
      
      // 标识类字段 - 聘用人员特有（这些字段会被忽略，不参与计算）
      '工资统发': '__IGNORE_FIELD__', // 忽略标识字段
      '财政供养': '__IGNORE_FIELD__', // 忽略标识字段
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
  
  // 动态获取组件名称的函数
  const getComponentName = (key: string, type: 'earnings' | 'deductions'): string => {
    const filteredComponents = componentDefinitions.filter(comp => {
      if (type === 'earnings') {
        // 对于收入类型，包含真正的收入项和统计字段
        return (isEarningComponentType(comp.type) || comp.type === 'STAT') && comp.code === key;
      } else {
        return isDeductionComponentType(comp.type) && comp.code === key;
      }
    });
    
    if (filteredComponents.length > 0) {
      return filteredComponents[0].name;
    }
    return key; // 如果找不到匹配的组件，返回原始key
  };
  
  // 获取薪资周期数据统计的函数 - 使用PayrollRun的total_employees字段
  const fetchPeriodDataStats = async (periodIds: number[]) => {
    console.log('🔍 开始获取薪资周期数据统计...');
    
    // 初始化加载状态
    const initialStats: Record<number, { count: number; loading: boolean }> = {};
    periodIds.forEach(id => {
      initialStats[id] = { count: 0, loading: true };
    });
    setPeriodDataStats(initialStats);
    
    // 并发获取所有周期的数据统计
    const statsPromises = periodIds.map(async (periodId) => {
      try {
        console.log(`📊 获取周期 ${periodId} 的数据统计...`);
        
        // 获取该周期下的所有payroll_run（后端已经计算好total_employees）
        const runsResponse = await payrollApi.getPayrollRuns({
          period_id: periodId,
          size: 100 // 获取该周期下的所有run
        });
        
        let totalCount = 0;
        
        // 如果有payroll_run，直接使用后端计算好的total_employees字段
        if (runsResponse.data && runsResponse.data.length > 0) {
          // 直接累加所有run的total_employees（这是最简单快速的方法）
          // 注意：这可能会重复计算同一员工在多个run中的情况，但通常一个周期只有一个run
          totalCount = runsResponse.data.reduce((sum, run) => {
            return sum + (run.total_employees || 0);
          }, 0);
          
          console.log(`📊 周期 ${periodId} 的run列表:`, runsResponse.data.map(run => ({
            id: run.id,
            total_employees: run.total_employees,
            run_date: run.run_date
          })));
          console.log(`📊 周期 ${periodId} 累计员工数: ${totalCount}`);
          
          // 如果该周期有多个run，我们需要去重统计（但这种情况很少见）
          if (runsResponse.data.length > 1) {
            console.log(`⚠️ 周期 ${periodId} 有多个run，可能存在员工重复计算`);
            // 如果真的需要精确去重，可以在这里添加去重逻辑
            // 但为了性能，我们暂时使用简单累加
          }
        }
        
        console.log(`📊 周期 ${periodId} 有 ${totalCount} 个员工的薪资记录`);
        return { periodId, count: totalCount };
      } catch (error) {
        console.error(`❌ 获取周期 ${periodId} 数据统计失败:`, error);
        return { periodId, count: 0 };
      }
    });
    
    try {
      const results = await Promise.all(statsPromises);
      
      // 更新统计数据
      const newStats: Record<number, { count: number; loading: boolean }> = {};
      results.forEach(({ periodId, count }) => {
        newStats[periodId] = { count, loading: false };
      });
      
      setPeriodDataStats(newStats);
      console.log('✅ 薪资周期数据统计获取完成:', newStats);
    } catch (error) {
      console.error('❌ 获取薪资周期数据统计失败:', error);
      // 设置所有为非加载状态
      const errorStats: Record<number, { count: number; loading: boolean }> = {};
      periodIds.forEach(id => {
        errorStats[id] = { count: 0, loading: false };
      });
      setPeriodDataStats(errorStats);
    }
  };

  // 过滤薪资周期的函数（根据环境和业务规则）
  const filterPayrollPeriods = (periods: PayrollPeriod[]): PayrollPeriod[] => {
    if (!ENABLE_PRODUCTION_RESTRICTIONS) {
      // 开发环境：显示所有周期
      return periods;
    }
    
    // 生产环境：只显示活动状态的周期
    return periods.filter(period => {
      const statusCode = period.status_lookup?.code;
      return statusCode === PAYROLL_PERIOD_STATUS.ACTIVE;
    });
  };

  // 检查周期是否允许导入数据
  const isPeriodImportAllowed = (period: PayrollPeriod): boolean => {
    if (!ENABLE_PRODUCTION_RESTRICTIONS) {
      return true; // 开发环境允许所有周期
    }
    
    const statusCode = period.status_lookup?.code;
    return statusCode === PAYROLL_PERIOD_STATUS.ACTIVE;
  };

  // 加载薪资周期数据
  useEffect(() => {
    const fetchPayrollPeriods = async () => {
      setLoadingPeriods(true);
      try {
        console.log('🚀 开始获取薪资周期数据...');
        console.log('📡 API调用参数:', { size: 100 });
        
        // 获取薪资周期，在生产环境中只显示活动状态的周期
        const response = await payrollApi.getPayrollPeriods({
          size: 100, // 修改为最大允许值100，降低超出限制的风险
          // TODO: 在生产环境中应该添加状态过滤，只显示活动状态的薪资周期
          // status_lookup_value_id: ACTIVE_STATUS_ID, // 取消注释以启用生产环境限制
        });
        
        console.log('📡 API响应状态:', response ? 'SUCCESS' : 'FAILED');
        console.log('📡 API响应完整数据:', JSON.stringify(response, null, 2));
        
        // 特别检查第一个周期的status_lookup字段
        if (response.data && response.data.length > 0) {
          const firstPeriod = response.data[0] as any; // 使用any类型来检查字段
          console.log('🔍 第一个周期的字段检查:');
          console.log('  - 是否有status字段:', 'status' in firstPeriod);
          console.log('  - 是否有status_lookup字段:', 'status_lookup' in firstPeriod);
          console.log('  - status值:', firstPeriod.status);
          console.log('  - status_lookup值:', firstPeriod.status_lookup);
          console.log('  - 所有字段名:', Object.keys(firstPeriod));
        }
        console.log('📡 response.data类型:', typeof response.data);
        console.log('📡 response.data是否为数组:', Array.isArray(response.data));
        console.log('📡 response.data长度:', response.data?.length);
        
        if (response.data && response.data.length > 0) {
          console.log('📡 第一个周期的原始数据:', JSON.stringify(response.data[0], null, 2));
          console.log('📡 第一个周期的status_lookup:', response.data[0].status_lookup);
          console.log('📡 第一个周期的status_lookup_value_id:', response.data[0].status_lookup_value_id);
        }
        
        // 按日期倒序排列，最新的月份在前面
        const sortedPeriods = response.data.sort((a, b) => {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
        
        // 根据环境和业务规则过滤薪资周期
        const filteredPeriods = filterPayrollPeriods(sortedPeriods);
        
        console.log('🔄 排序后的周期数据:');
        sortedPeriods.forEach((period, index) => {
          console.log(`  ${index + 1}. ${period.name}:`);
          console.log(`     - status_lookup_value_id: ${period.status_lookup_value_id}`);
          console.log(`     - status_lookup: ${JSON.stringify(period.status_lookup)}`);
        });
        
        if (ENABLE_PRODUCTION_RESTRICTIONS) {
          console.log(`🔒 生产环境限制：从 ${sortedPeriods.length} 个周期中过滤出 ${filteredPeriods.length} 个活动周期`);
        }
        
        setPayrollPeriods(filteredPeriods);
        // 记录获取到的总数
        console.log(`✅ 成功加载${sortedPeriods.length}个薪资周期，总共${response.meta?.total || 0}个`);
        console.log('📅 薪资周期列表:', sortedPeriods.map(p => `${p.name} (${p.status_lookup?.name || 'Unknown'})`));
        
        // 获取每个周期的数据统计
        if (sortedPeriods.length > 0) {
          const periodIds = sortedPeriods.map(p => p.id);
          fetchPeriodDataStats(periodIds);
        }
        
        // 详细检查所有周期的数据结构
        console.log('🔍 详细检查所有薪资周期的数据结构:');
        sortedPeriods.forEach((period, index) => {
          console.log(`\n--- 薪资周期 ${index + 1}: ${period.name} ---`);
          console.log('完整数据:', JSON.stringify(period, null, 2));
          console.log('status_lookup_value_id:', period.status_lookup_value_id);
          console.log('status_lookup字段存在:', !!period.status_lookup);
          if (period.status_lookup) {
            console.log('status_lookup内容:', JSON.stringify(period.status_lookup, null, 2));
            console.log('status_lookup.id:', period.status_lookup.id);
            console.log('status_lookup.code:', period.status_lookup.code);
            console.log('status_lookup.name:', period.status_lookup.name);
          } else {
            console.log('❌ status_lookup字段为空或未定义');
          }
          console.log('--- 结束 ---\n');
        });
        
        // 检查API响应的原始数据
        console.log('🔍 API响应原始数据:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('❌ Error fetching payroll periods:', error);
        message.error(t('periods_page.error_fetch_periods'));
      } finally {
        setLoadingPeriods(false);
      }
    };

    fetchPayrollPeriods();
  }, [message, t]);
  
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
        console.log('获取的薪资字段定义:', response);
        console.log('API响应元数据:', response.meta);
        setComponentDefinitions(response.data);
        
        if (response.data.length > 0) {
          console.log(`成功加载${response.data.length}个薪资字段定义`);
          if (response.meta && response.meta.total > response.data.length) {
            console.warn(`注意：总共有${response.meta.total}个组件，但只加载了${response.data.length}个`);
          }
        } else {
          console.warn('加载的薪资字段定义为空');
        }
      } catch (error: any) {
        console.error('Error fetching payroll component definitions:', error);
        console.error('错误详情:', error.response?.data || error.message);
        console.error('错误状态码:', error.response?.status);
        
        // 显示用户友好的错误信息
        if (error.response?.status === 403) {
          message.error(t('batch_import.error_permission_denied', { defaultValue: '权限不足，无法获取薪资字段定义' }));
        } else if (error.response?.status === 404) {
          message.error(t('batch_import.error_api_not_found', { defaultValue: 'API端点不存在，请联系管理员' }));
        } else {
          message.error(t('batch_import.error_fetch_components', { defaultValue: '获取薪资字段定义失败，请稍后重试' }));
        }
        
        // 设置空数组，避免页面崩溃
        setComponentDefinitions([]);
      } finally {
        setLoadingComponents(false);
      }
    };
    
    fetchComponentDefinitions();
  }, [message, t]);

  // 获取默认薪资条目状态ID
  useEffect(() => {
    const fetchDefaultPayrollEntryStatusId = async () => {
      try {
        console.log('开始获取默认薪资条目状态ID...');
        // 首先尝试获取"已计算"状态的ID
        const calculatedStatusId = await lookupService.getLookupValueIdByCode('PAYROLL_ENTRY_STATUS', 'CALCULATED');
        if (calculatedStatusId) {
          setDefaultPayrollEntryStatusId(calculatedStatusId);
          console.log(`成功获取默认薪资条目状态ID (CALCULATED): ${calculatedStatusId}`);
          return;
        }
        
        // 如果找不到CALCULATED，尝试PENTRY_CALCULATED
        const pentryCalculatedStatusId = await lookupService.getLookupValueIdByCode('PAYROLL_ENTRY_STATUS', 'PENTRY_CALCULATED');
        if (pentryCalculatedStatusId) {
          setDefaultPayrollEntryStatusId(pentryCalculatedStatusId);
          console.log(`成功获取默认薪资条目状态ID (PENTRY_CALCULATED): ${pentryCalculatedStatusId}`);
          return;
        }
        
        console.warn('未找到CALCULATED或PENTRY_CALCULATED状态，尝试获取第一个可用状态');
        // 如果都找不到，获取第一个可用的状态
        const allStatuses = await lookupService.getPayrollEntryStatusesLookup();
        if (allStatuses.length > 0) {
          const firstStatusId = Number(allStatuses[0].id);
          setDefaultPayrollEntryStatusId(firstStatusId);
          console.log(`使用第一个可用状态ID: ${firstStatusId} (${allStatuses[0].name})`);
        } else {
          console.error('无法获取任何薪资条目状态');
          setDefaultPayrollEntryStatusId(null);
        }
      } catch (error) {
        console.error('获取默认薪资条目状态ID失败:', error);
        setDefaultPayrollEntryStatusId(null);
      }
    };

    fetchDefaultPayrollEntryStatusId();
  }, []);

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
    console.log(`\n=== 开始处理记录: ${record.employee_full_name || record.employee_name || 'Unknown'} ===`);
    console.log('原始记录:', JSON.stringify(record, null, 2));
    
    // 新增：处理人员类型 (personnel_type)
    let personnelType: 'REGULAR' | 'HIRED' | 'UNKNOWN' = 'UNKNOWN';
    const rawIdentity = record.raw_personnel_identity as string || '';
    if (rawIdentity) {
      if (rawIdentity.includes('正编') || rawIdentity.includes('在编') || rawIdentity.includes('事业') || rawIdentity.includes('行政')) {
        personnelType = 'REGULAR';
      } else if (rawIdentity.includes('聘用') || rawIdentity.includes('合同') || rawIdentity.includes('派遣') || rawIdentity.includes('员额') || rawIdentity.includes('临聘')) {
        personnelType = 'HIRED';
      }
    }
    record.personnel_type = personnelType;
    console.log(`识别到的人员身份: "${rawIdentity}", 标准化类型: ${personnelType}`);
    
    // 检查是否有月奖励绩效相关字段
    const possiblePerformanceFields = Object.keys(record).filter(key => 
      key.includes('奖励') || key.includes('绩效') || key.includes('PERFORMANCE')
    );
    console.log('发现的绩效相关字段:', possiblePerformanceFields);
    possiblePerformanceFields.forEach(field => {
      console.log(`${field}: ${record[field]}`);
    });
    
    // 特别检查earnings_details中的PERFORMANCE_BONUS
    if (record.earnings_details) {
      console.log('🎯 检查earnings_details中的绩效字段:');
      Object.keys(record.earnings_details).forEach(key => {
        if (key.includes('PERFORMANCE') || key.includes('绩效') || key.includes('奖励')) {
          console.log(`🎯 发现绩效字段: ${key} = ${JSON.stringify(record.earnings_details[key])}`);
        }
      });
      
      // 特别检查PERFORMANCE_BONUS
      if (record.earnings_details.PERFORMANCE_BONUS) {
        console.log('🎯 找到PERFORMANCE_BONUS字段:', record.earnings_details.PERFORMANCE_BONUS);
      } else {
        console.warn('⚠️ 未找到PERFORMANCE_BONUS字段');
      }
    }
    
    // 确保嵌套结构存在
    if (!record.earnings_details) record.earnings_details = {};
    if (!record.deductions_details) record.deductions_details = {};

    // 处理姓名拆分
    if (record.employee_full_name && !record.last_name && !record.first_name) {
      const fullName = record.employee_full_name.trim();
      // 中文姓名拆分规则：第一个字符为姓，其余为名
      if (fullName.length >= 2) {
        record.last_name = fullName.substring(0, 1);
        record.first_name = fullName.substring(1);
      } else {
        record.last_name = fullName;
        record.first_name = '';
      }
      // 生成employee_name用于显示
      record.employee_name = fullName;
    } else if (record.last_name && record.first_name) {
      // 如果已经有姓和名，生成完整姓名
      record.employee_name = `${record.last_name}${record.first_name}`;
    }

    // 处理员工编号（非必填）
    if (!record.employee_code) {
      record.employee_code = null; // 明确设置为null而不是空字符串
    }

    // 准备员工匹配信息
    if (record.id_number && record.last_name && record.first_name) {
      record.employee_info = {
        last_name: record.last_name,
        first_name: record.first_name,
        id_number: record.id_number
      };
    }

    // 转换数字的辅助函数
    const toNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // 移除逗号、空格和其他非数字字符（保留小数点和负号）
        const cleanValue = value.replace(/[,\s]/g, '').trim();
        const num = parseFloat(cleanValue);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    // 处理收入项，确保金额是数字
    console.log('处理前的收入项:', JSON.stringify(record.earnings_details, null, 2));
    const originalEarningsKeys = Object.keys(record.earnings_details);
    console.log('原始收入项字段数量:', originalEarningsKeys.length);
    
    // 特别检查PERFORMANCE_BONUS是否存在
    const hasPerformanceBonus = originalEarningsKeys.includes('PERFORMANCE_BONUS');
    console.log('🎯 处理前是否有PERFORMANCE_BONUS:', hasPerformanceBonus);
    if (hasPerformanceBonus) {
      console.log('🎯 PERFORMANCE_BONUS原始值:', record.earnings_details.PERFORMANCE_BONUS);
    }
    
    Object.keys(record.earnings_details).forEach(key => {
      const item = record.earnings_details[key];
      let amount = 0;
      
      console.log(`处理收入项 ${key}:`, item);
      
      // 特别标记绩效字段
      const isPerformanceField = key.includes('PERFORMANCE') || key.includes('绩效') || key.includes('奖励');
      if (isPerformanceField) {
        console.log(`🎯 处理绩效收入项: ${key}`);
        console.log(`🎯 原始item类型:`, typeof item);
        console.log(`🎯 原始item值:`, JSON.stringify(item, null, 2));
      }
      
      if (typeof item === 'number' || typeof item === 'string') {
        amount = toNumber(item);
        if (isPerformanceField) {
          console.log(`🎯 直接转换: ${item} -> ${amount}`);
        }
      } else if (item && typeof item === 'object' && item.amount !== undefined) {
        amount = toNumber(item.amount);
        if (isPerformanceField) {
          console.log(`🎯 从对象提取amount: ${item.amount} -> ${amount}`);
        }
      } else {
        if (isPerformanceField) {
          console.error(`🚨 绩效字段无法处理的数据类型: ${typeof item}`, item);
        }
      }
      
      console.log(`${key} 转换后金额:`, amount);
      if (isPerformanceField) {
        console.log(`🎯 绩效字段转换后金额: ${key} = ${amount}`);
        console.log(`🎯 金额是否为0: ${amount === 0}`);
        console.log(`🎯 金额是否为NaN: ${isNaN(amount)}`);
      }
      
      // 如果金额为0或无效，删除该项（但在验证时会考虑原始数据）
      if (amount === 0) {
        console.log(`删除0值收入项: ${key}`);
        if (isPerformanceField) {
          console.error(`🚨 删除了绩效字段: ${key} (金额为0)`);
          console.error(`🚨 删除原因分析:`);
          console.error(`  - 原始值:`, item);
          console.error(`  - 转换后:`, amount);
          console.error(`  - 是否严格等于0:`, amount === 0);
        }
        delete record.earnings_details[key];
      } else {
        record.earnings_details[key] = {
          amount: amount,
          name: getComponentName(key, 'earnings')
        };
        console.log(`保留收入项 ${key}:`, record.earnings_details[key]);
        if (isPerformanceField) {
          console.log(`🎯 保留绩效字段: ${key} =`, record.earnings_details[key]);
        }
      }
    });
    
    console.log('处理后的收入项:', JSON.stringify(record.earnings_details, null, 2));
    
    // 再次检查PERFORMANCE_BONUS是否还存在
    const stillHasPerformanceBonus = Object.keys(record.earnings_details).includes('PERFORMANCE_BONUS');
    console.log('🎯 处理后是否还有PERFORMANCE_BONUS:', stillHasPerformanceBonus);
    if (!hasPerformanceBonus && !stillHasPerformanceBonus) {
      console.warn('⚠️ PERFORMANCE_BONUS字段从始至终都不存在');
    } else if (hasPerformanceBonus && !stillHasPerformanceBonus) {
      console.error('🚨 PERFORMANCE_BONUS字段在处理过程中丢失了！');
    }

    // 处理扣除项，确保金额是数字
    Object.keys(record.deductions_details).forEach(key => {
      const item = record.deductions_details[key];
      let amount = 0;
      
      if (typeof item === 'number' || typeof item === 'string') {
        amount = toNumber(item);
      } else if (item && typeof item === 'object' && item.amount !== undefined) {
        amount = toNumber(item.amount);
      }
      
      // 保留所有扣除项，包括金额为0的项（特别是标准扣发项如失业保险）
      record.deductions_details[key] = {
        amount: amount,
        name: getComponentName(key, 'deductions')
      };
    });

    // 计算总收入和总扣除
    let totalEarnings = 0;
    let totalDeductions = 0;
    
    // 计算总收入（排除统计字段）
    Object.entries(record.earnings_details).forEach(([key, item]: [string, any]) => {
      if (item && typeof item.amount === 'number') {
        // 排除统计字段，不计入收入总和
        if (key !== 'ANNUAL_FIXED_SALARY_TOTAL' && key !== 'QUARTERLY_PERFORMANCE_Q1') {
          totalEarnings += item.amount;
        }
      }
    });
    
    // 计算总扣除
    Object.values(record.deductions_details).forEach((item: any) => {
      if (item && typeof item.amount === 'number') {
        totalDeductions += item.amount;
      }
    });
    
    // 转换主要金额字段为数字
    record.gross_pay = toNumber(record.gross_pay);
    record.net_pay = toNumber(record.net_pay);
    record.total_deductions = toNumber(record.total_deductions);
    
    // 优先使用原始的gross_pay和total_deductions值，只有在它们为0时才使用计算值
    // 这样可以避免因为删除0值项导致的总和不匹配问题
    if (!record.gross_pay || record.gross_pay === 0) {
      record.gross_pay = totalEarnings;
    }
    
    if (!record.total_deductions || record.total_deductions === 0) {
      record.total_deductions = totalDeductions;
    }
    
    // 如果没有净工资，计算净工资
    if (!record.net_pay || record.net_pay === 0) {
      record.net_pay = record.gross_pay - record.total_deductions;
    }
    
    // 设置 total_earnings 字段用于表格显示
    record.total_earnings = record.gross_pay;
    
    // 设置默认状态（使用动态获取的ID）
    if (!record.status_lookup_value_id && defaultPayrollEntryStatusId) {
      record.status_lookup_value_id = defaultPayrollEntryStatusId; // 使用动态获取的状态ID
    }
    
    console.log('最终处理结果 (包含 personnel_type):', {
      ...record,
      personnel_type: record.personnel_type // 确保在日志中也输出
    });
    console.log('- gross_pay:', record.gross_pay);
    console.log('- total_deductions:', record.total_deductions);
    console.log('- net_pay:', record.net_pay);
    console.log('- 收入项数量:', Object.keys(record.earnings_details).length);
    console.log('- 扣除项数量:', Object.keys(record.deductions_details).length);
    console.log('=== 记录处理完成 ===\n');
    
    return record;
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    if (parseError) { 
      setParseError(null);
    }
  };

  const handlePeriodChange = (value: number | null) => {
    setSelectedPeriodId(value);
    const selectedPeriod = payrollPeriods.find(p => p.id === value);
    console.log('🎯 用户选择薪资周期:', {
      id: value,
      name: selectedPeriod?.name,
      status: selectedPeriod?.status_lookup?.name,
      dateRange: `${selectedPeriod?.start_date} ~ ${selectedPeriod?.end_date}`
    });
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
      
      const fieldErrors = validationEnabled ? validateRecord(typedRecord, index) : []; 
      
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
    const recordDescription = `Record ${index} (Employee: ${record.employee_name || 'Unknown'}, Type: ${record.personnel_type || 'N/A'})`;

    // --- Helper: Calculate sums from deduction_details ---
    let allDeductionsSum = 0;
    let standardDeductionsSum = 0; // For REGULAR staff: social insurance + tax
    const allDeductionsBreakdown: string[] = [];
    const standardDeductionsBreakdown: string[] = [];

    if (record.deductions_details && Object.keys(record.deductions_details).length > 0) {
      const standardDeductionComponentCodes = [
        'PENSION_PERSONAL_AMOUNT',           
        'MEDICAL_INS_PERSONAL_AMOUNT',       
        'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT', 
        'UNEMPLOYMENT_PERSONAL_AMOUNT',      
        'HOUSING_FUND_PERSONAL',            
        'PERSONAL_INCOME_TAX'               
      ];
      // Keywords for broader matching if needed, can be refined
      const standardKeywords = ['PENSION', 'MEDICAL', 'UNEMPLOYMENT', 'HOUSING_FUND', 'TAX'];

      Object.entries(record.deductions_details).forEach(([key, item]: [string, any]) => {
        if (item && typeof item.amount === 'number' && !isNaN(item.amount)) {
          allDeductionsSum += item.amount;
          allDeductionsBreakdown.push(`${key}: ${item.amount}`);

          const isStandardByCode = standardDeductionComponentCodes.includes(key);
          const isStandardByKeyword = standardKeywords.some(kw => key.toUpperCase().includes(kw));
          // TODO: Add Chinese name matching from componentDefinitions if more robust matching is needed

          if (isStandardByCode || isStandardByKeyword) {
            standardDeductionsSum += item.amount;
            standardDeductionsBreakdown.push(`${key}: ${item.amount} (Standard)`);
          }
        }
      });
    }
    // --- End Helper ---

    // 验证员工匹配信息
    if (!record.employee_id) {
      // employee_id不是必填，但需要验证是否有足够的匹配信息
      if (!record.employee_info || !record.employee_info.last_name || !record.employee_info.first_name || !record.employee_info.id_number) {
        errors.push(t('batch_import.validation.missing_employee_match_info'));
      }
    }
    
    // 验证数值字段
    if (typeof record.gross_pay !== 'number' || isNaN(record.gross_pay)) {
      errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'gross_pay' }));
    }
    
    if (typeof record.total_deductions !== 'number' || isNaN(record.total_deductions)) {
      errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'total_deductions' }));
    }
    
    if (typeof record.net_pay !== 'number' || isNaN(record.net_pay)) {
      errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'net_pay' }));
    }

    // 验证净工资计算是否正确：实发合计 = 应发合计 - 所有扣款项 (使用函数开头计算的allDeductionsSum)
    // 注意：allDeductionsSum 和 allDeductionsBreakdown 已经在函数开头计算过，这里直接复用
    const calculatedNetPay = record.gross_pay - allDeductionsSum; // 复用函数开头的 allDeductionsSum
    console.log(`\n=== 净工资验证详情 (${recordDescription}) ===`);
    console.log('应发工资 (gross_pay):', record.gross_pay);
    console.log('所有扣款项明细 (复用):', allDeductionsBreakdown); // 复用函数开头的 allDeductionsBreakdown
    console.log('所有扣款项总和 (复用):', allDeductionsSum);
    console.log('计算的净工资 (gross_pay - allDeductionsSum):', calculatedNetPay);
    console.log('记录中的净工资 (net_pay):', record.net_pay);
    
    if (Math.abs(calculatedNetPay - record.net_pay) > 0.01) { // 允许0.01的浮点误差
      console.log('❌ 净工资验证失败!');
      console.log(`预期: ${calculatedNetPay.toFixed(2)}, 实际: ${record.net_pay.toFixed(2)}, 差额: ${Math.abs(calculatedNetPay - record.net_pay).toFixed(2)}`);
      errors.push(t('batch_import.validation.net_pay_mismatch', { record: recordDescription }));
    } else {
      console.log('✅ 净工资验证通过');
    }
    console.log('=== 净工资验证结束 ===\n');

    // 验证收入项
    if (!record.earnings_details || Object.keys(record.earnings_details).length === 0) {
      errors.push(t('batch_import.validation.earnings_required'));
    } else {
      // 验证收入项总和是否与gross_pay匹配（排除统计字段）
      let earningsSum = 0;
      const earningsBreakdown: string[] = [];
      
      Object.entries(record.earnings_details).forEach(([key, item]) => {
        if (typeof item.amount !== 'number' || isNaN(item.amount)) {
          errors.push(t('batch_import.validation.invalid_amount', { record: recordDescription, field: 'earnings_details' }));
        } else {
          // 排除统计字段，不计入收入总和验证
          if (key !== 'ANNUAL_FIXED_SALARY_TOTAL' && key !== 'QUARTERLY_PERFORMANCE_Q1') {
            earningsSum += item.amount;
            earningsBreakdown.push(`${key}: ${item.amount}`);
          } else {
            earningsBreakdown.push(`${key}: ${item.amount} (统计字段，不计入总和)`);
          }
        }
      });
      
      // 详细日志输出
      console.log(`=== 收入项验证详情 (${recordDescription}) ===`);
      console.log('原始应发工资 (gross_pay):', record.gross_pay);
      console.log('收入项明细:', earningsBreakdown);
      console.log('收入项总和 (earningsSum):', earningsSum);
      console.log('差异 (Math.abs(earningsSum - record.gross_pay)):', Math.abs(earningsSum - record.gross_pay));
      console.log('收入项数量:', Object.keys(record.earnings_details).length);
      console.log('完整收入项对象:', JSON.stringify(record.earnings_details, null, 2));
      
      // 只有当收入项总和大于0且与应发工资不匹配时才报错
      // 这样可以处理某些收入项为空值被删除的情况
      if (earningsSum > 0 && Math.abs(earningsSum - record.gross_pay) > 0.01) {
        console.log('❌ 验证失败: 收入项总和与应发工资不匹配');
        errors.push(t('batch_import.validation.gross_pay_mismatch', { record: recordDescription }));
      } else {
        console.log('✅ 验证通过: 收入项总和匹配');
      }
      console.log('=== 验证详情结束 ===\n');
    }

    // --- Type-Specific Validations ---
    if (record.personnel_type === 'REGULAR') {
      validateRegularSpecifics(record, errors, recordDescription, standardDeductionsSum, allDeductionsSum, t);
    } else if (record.personnel_type === 'HIRED') {
      validateHiredSpecifics(record, errors, recordDescription, standardDeductionsSum, allDeductionsSum, t);
    } else {
      // Handle UNKNOWN or other types if necessary, perhaps with a generic or lenient check
      console.warn(`Skipping type-specific deduction validation for unknown personnel_type: ${record.personnel_type}`, recordDescription);
      // As a fallback for UNKNOWN, we could check if total_deductions matches allDeductionsSum
      if (Math.abs(allDeductionsSum - record.total_deductions) > 0.01) {
        errors.push(t('batch_import.validation.total_deductions_mismatch_details_sum_unknown_type', { record: recordDescription }));
      }
    }

    return errors;
  };

  // Helper function for REGULAR staff specific validations
  const validateRegularSpecifics = (
    record: RawPayrollEntryData, 
    errors: string[], 
    recordDescription: string,
    standardDeductionsSum: number, // Calculated sum of only standard social insurance & tax
    allDeductionsSum: number, // Calculated sum of ALL deduction items
    t: Function // Pass translation function
  ) => {
    console.log(`\n🛡️ Running REGULAR specific validations for ${recordDescription}`);
    // 正编人员: 扣发合计 (total_deductions) == 五险一金 + 个人所得税 (standardDeductionsSum)
    if (Math.abs(standardDeductionsSum - record.total_deductions) > 0.01) {
      console.log('\n❌ REGULAR: 扣发合计验证失败!');
      console.log(`  预期扣发合计 (用户提供): ${record.total_deductions.toFixed(2)}`);
      console.log(`  计算的标准扣除总和 (五险一金+税): ${standardDeductionsSum.toFixed(2)}`);
      console.log(`  计算的所有扣除总和 (参考): ${allDeductionsSum.toFixed(2)}`);
      console.log(`  差异 (用户扣发合计 vs 标准扣除): ${Math.abs(standardDeductionsSum - record.total_deductions).toFixed(2)}`);
      errors.push(t('batch_import.validation.regular.total_deductions_mismatch_standard', { record: recordDescription }));
    } else {
      console.log('\n✅ REGULAR: 扣发合计验证通过 (等于标准五险一金+税).');
    }
    // TODO: Add other REGULAR specific validations (e.g., required fields, value ranges)
  };

  // Helper function for HIRED staff specific validations
  const validateHiredSpecifics = (
    record: RawPayrollEntryData, 
    errors: string[], 
    recordDescription: string,
    standardDeductionsSum: number, // Calculated sum of only standard social insurance & tax (for reference)
    allDeductionsSum: number, // Calculated sum of ALL deduction items
    t: Function // Pass translation function
  ) => {
    console.log(`\n🛡️ Running HIRED specific validations for ${recordDescription}`);
    // 聘用人员: 扣发合计 (total_deductions) == 所有扣除明细的总和 (allDeductionsSum)
    if (Math.abs(allDeductionsSum - record.total_deductions) > 0.01) {
      console.log('\n❌ HIRED: 扣发合计验证失败!');
      console.log(`  预期扣发合计 (用户提供): ${record.total_deductions.toFixed(2)}`);
      console.log(`  计算的所有扣除总和: ${allDeductionsSum.toFixed(2)}`);
      console.log(`  计算的标准扣除总和 (参考): ${standardDeductionsSum.toFixed(2)}`);
      console.log(`  差异 (用户扣发合计 vs 所有明细总和): ${Math.abs(allDeductionsSum - record.total_deductions).toFixed(2)}`);
      errors.push(t('batch_import.validation.hired.total_deductions_mismatch_all_details', { record: recordDescription }));
    } else {
      console.log('\n✅ HIRED: 扣发合计验证通过 (等于所有扣除明细总和).');
    }
    // TODO: Add other HIRED specific validations
  };

  const handleParseAndPreview = () => {
    // 如果在表格输入标签，提示用户使用表格转换器
    if (activeTab === 'table') {
      message.info(t('batch_import.message.use_table_converter_first', '请先在表格转换器中完成数据转换'));
      return;
    }
    
    console.log('=== 开始解析和预览数据 ===');
    
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
    
    // 生产环境额外安全检查：确保选中的周期允许导入
    if (ENABLE_PRODUCTION_RESTRICTIONS) {
      const selectedPeriod = payrollPeriods.find(p => p.id === selectedPeriodId);
      if (selectedPeriod && !isPeriodImportAllowed(selectedPeriod)) {
        message.error('生产环境限制：只能向活动状态的薪资周期导入数据');
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
        overwrite_mode: overwriteMode
      };

      console.log('📤 准备上传薪资数据:', {
        payroll_period_id: selectedPeriodId,
        entries_count: payloadEntries.length,
        overwrite_mode: overwriteMode,
        selected_period_name: payrollPeriods.find(p => p.id === selectedPeriodId)?.name
      });
      
      // 添加更详细的调试信息
      console.log('📤 详细检查第一条记录的扣除项:');
      if (payloadEntries.length > 0) {
        const firstEntry = payloadEntries[0];
        console.log('第一条记录完整数据:', JSON.stringify(firstEntry, null, 2));
        if (firstEntry.deductions_details) {
          console.log('扣除项代码列表:', Object.keys(firstEntry.deductions_details));
          Object.entries(firstEntry.deductions_details).forEach(([code, detail]) => {
            console.log(`  ${code}:`, detail);
          });
          console.log('是否包含SOCIAL_INSURANCE_ADJUSTMENT:', 'SOCIAL_INSURANCE_ADJUSTMENT' in firstEntry.deductions_details);
        }
      }

      const response = await payrollApi.bulkCreatePayrollEntries(bulkPayload);
      
      console.log('📥 批量上传响应:', response);
      console.log('📥 响应类型:', typeof response);
      console.log('📥 响应keys:', response ? Object.keys(response) : 'response is null/undefined');
      
      // 使用新的响应格式
      const result = response;
      
      // 添加更多调试信息
      console.log('📥 解析result:', {
        success_count: result?.success_count,
        error_count: result?.error_count,
        errors: result?.errors,
        created_entries: result?.created_entries
      });
      
      // 添加详细的错误信息输出
      if (result?.errors && result.errors.length > 0) {
        console.log('🚨 批量导入错误详情:');
        result.errors.forEach((err: any, index: number) => {
          console.log(`  错误 ${index + 1}:`, {
            employee_id: err.employee_id,
            employee_name: err.employee_name,
            index: err.index,
            error: err.error,
            detail: err.detail || err.message || '无详细信息'
          });
        });
        
        // 检查第一个错误的详细信息
        if (result.errors[0]) {
          console.log('🚨 第一个错误的完整对象:', JSON.stringify(result.errors[0], null, 2));
        }
      }
      
      try {
        // 检查result是否存在必需的字段
        if (!result || typeof result.success_count === 'undefined' || typeof result.error_count === 'undefined') {
          console.error('❌ 响应数据缺少必需字段:', result);
          throw new Error('响应数据格式不正确');
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
        console.error('❌ 处理响应数据时出错:', resultError);
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
      console.error("Bulk upload failed:", error.response?.data || error);
      
      let extractedErrorMessage = t('common:error.unknown');
      let detailedErrorMessage = '';
      let isDuplicateError = false;
      
      // 检查是否是重复记录错误
      const errorString = JSON.stringify(error.response?.data || error.message || error);
      if (errorString.includes('duplicate key value violates unique constraint') || 
          errorString.includes('uq_payroll_entries_employee_period_run') ||
          errorString.includes('already exists')) {
        isDuplicateError = true;
        extractedErrorMessage = '检测到重复的薪资记录';
        detailedErrorMessage = '部分员工在当前薪资周期中已存在薪资记录。请启用覆盖模式以更新现有记录。';
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
                <strong>❌ 导入失败：检测到重复记录</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                部分员工在当前薪资周期中已存在记录
              </div>
              <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 4 }}>
                💡 解决方案：在JSON输入页面启用"覆盖模式"开关
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
            error: isDuplicateError ? '该员工在当前薪资周期已存在记录，请启用覆盖模式' : extractedErrorMessage 
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

  // 动态生成表格列
  const generateDynamicColumns = (data: ValidatedPayrollEntryData[]) => {
    if (!data || data.length === 0) return [];

    // 基础列
    const baseColumns = [
      { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
      { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
      { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
    ];

    // 收集所有收入项字段
    const earningsFields = new Set<string>();
    const deductionsFields = new Set<string>();
    
    data.forEach(record => {
      if (record.earnings_details) {
        Object.keys(record.earnings_details).forEach(key => earningsFields.add(key));
      }
      if (record.deductions_details) {
        Object.keys(record.deductions_details).forEach(key => deductionsFields.add(key));
      }
    });

    // 安全的数字格式化函数
    const formatCurrency = (value: any): string => {
      if (value == null || value === '') return '-';
      const num = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(num) ? '-' : `¥${num.toFixed(2)}`;
    };

    // 生成收入项列
    const earningsColumns = Array.from(earningsFields).map(field => ({
      title: getComponentName(field, 'earnings'),
      dataIndex: ['earnings_details', field, 'amount'],
      key: `earnings_${field}`,
      width: 120,
      render: (text: any) => formatCurrency(text)
    }));

    // 生成扣除项列
    const deductionsColumns = Array.from(deductionsFields).map(field => ({
      title: getComponentName(field, 'deductions'),
      dataIndex: ['deductions_details', field, 'amount'],
      key: `deductions_${field}`,
      width: 120,
      render: (text: any) => formatCurrency(text)
    }));

    // 汇总列
    const summaryColumns = [
      { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrency(text) },
      { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrency(text) },
      { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrency(text) },
    ];

    // 其他列
    const otherColumns = [
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

    return [...baseColumns, ...earningsColumns, ...deductionsColumns, ...summaryColumns, ...otherColumns];
  };

  // 使用动态列或静态列
  const columns = useMemo(() => {
    if (parsedData && parsedData.length > 0) {
      return generateDynamicColumns(parsedData);
    }
    // 安全的数字格式化函数（用于默认列）
    const formatCurrencyDefault = (value: any): string => {
      if (value == null || value === '') return '-';
      const num = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(num) ? '-' : `¥${num.toFixed(2)}`;
    };

    // 默认静态列（用于初始状态）
    return [
      { title: t('batch_import.table_header.employee_id'), dataIndex: 'employee_id', key: 'employee_id', width: 120 },
      { title: t('batch_import.table_header.employee_name'), dataIndex: 'employee_name', key: 'employee_name', width: 120 },
      { title: t('batch_import.table_header.department'), dataIndex: 'department_name', key: 'department_name', width: 150, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.position'), dataIndex: 'position_name', key: 'position_name', width: 150, render: (text: any) => text || '-' },
      { title: t('batch_import.table_header.total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', width: 120, render: (text: any) => formatCurrencyDefault(text) },
      { title: t('batch_import.table_header.total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', width: 120, render: (text: any) => formatCurrencyDefault(text) },
      { title: t('batch_import.table_header.net_pay'), dataIndex: 'net_pay', key: 'net_pay', width: 120, render: (text: any) => formatCurrencyDefault(text) },
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
  }, [parsedData, t, getComponentName]);

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
        if (errorText.includes('已存在记录') || errorText.includes('覆盖模式') || errorText.includes('duplicate')) {
          return (
            <div>
              <div style={{ color: '#ff4d4f', marginBottom: 4 }}>
                🔄 {errorText}
              </div>
              <div style={{ fontSize: '12px', color: '#1890ff' }}>
                💡 解决方案：返回第一步，在JSON输入页面启用"覆盖模式"开关
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
      console.log('📝 翻译调试 - errorCount:', uploadResult.errorCount);
      console.log('📝 翻译调试 - 翻译键:', 'batch_import.results.all_failed_at_server');
      console.log('📝 翻译调试 - 参数:', { count: uploadResult.errorCount });
      
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
              String(err.error).includes('已存在记录') || 
              String(err.error).includes('覆盖模式') || 
              String(err.error).includes('duplicate')
            ) && (
              <Alert
                message="检测到重复记录"
                description={
                  <div>
                    <p>部分员工在当前薪资周期中已存在薪资记录。</p>
                    <p><strong>解决方案：</strong></p>
                    <ol style={{ marginLeft: 16, marginBottom: 0 }}>
                      <li>点击下方"重新导入"按钮返回第一步</li>
                      <li>在"JSON输入"标签页中找到"覆盖模式"开关</li>
                      <li>启用覆盖模式开关</li>
                      <li>重新执行导入操作</li>
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
                    重新导入
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
                          processResultRecord={processPayrollRecord}
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