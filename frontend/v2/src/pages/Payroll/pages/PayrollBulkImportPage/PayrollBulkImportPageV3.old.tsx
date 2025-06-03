import React, { useState, useCallback, useEffect } from 'react';
import {
  Steps,
  Button,
  Card,
  Result,
  Space,
  Typography,
  Divider,
  Progress,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Upload,
  message,
  Input,
  Tabs,
  Table,
  Switch,
  Select,
  Form
} from 'antd';
import {
  CloudUploadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileExcelOutlined,
  TableOutlined,
  SettingOutlined,
  EyeOutlined,
  RocketOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import {
  validateBulkImportData,
  processRawTableData,
  executeBulkImport,
  getActivePayrollComponents,
  getActivePayrollPeriods,
  type BulkImportValidationResult,
  type FieldMappingRule
} from '../../services/payrollBulkImportApi';
import type {
  PayrollComponentDefinition,
  PayrollPeriod,
  RawPayrollEntryData,
  ValidatedPayrollEntryData,
  BulkCreatePayrollEntriesPayload,
  CreatePayrollEntryPayload
} from '../../types/payrollTypes';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;
const { TextArea } = Input;
const { Option, OptGroup } = Select;

interface ImportData {
  headers: string[];
  rows: any[][];
  totalRecords: number;
}

// 使用从API服务导入的类型定义
type MappingRule = FieldMappingRule;

// 兼容原有的ValidationResult接口
interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  errors: string[];
}

// 智能CSV编码处理函数
const handleEncodingIssues = (rawText: string, detectedEncoding: string): string => {
  try {
    // 不使用硬编码映射，而是通过提示用户和智能检测来处理
    
    // 1. 检查文本是否包含有效的CSV结构
    const hasValidStructure = rawText.includes(',') || rawText.includes('\t') || rawText.includes('\n');
    
    // 2. 检查是否包含明显的乱码字符
    const hasGarbledChars = /[À-ÿ]{2,}/.test(rawText) || rawText.includes('�');
    
    if (hasValidStructure && !hasGarbledChars) {
      // 文本结构正常，直接返回
      return rawText;
    }
    
    if (hasGarbledChars) {
      // 检测到乱码，建议用户重新保存文件
      console.log('⚠️ 检测到编码问题，建议用户转换文件编码');
      
      // 尝试基本的清理：移除明显的非文本字符
      let cleaned = rawText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
        .replace(/�/g, '?'); // 替换替换字符
      
      return cleaned;
    }
    
    return rawText;
  } catch (error) {
    console.log('❌ 编码处理失败，返回原始文本');
    return rawText;
  }
};

const PayrollBulkImportPageV3: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [textInput, setTextInput] = useState('');
  
  // 真实数据相关状态
  const [payrollComponents, setPayrollComponents] = useState<PayrollComponentDefinition[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [processedData, setProcessedData] = useState<ValidatedPayrollEntryData[]>([]);
  const [importSettings, setImportSettings] = useState({
    skipInvalidRecords: true,
    overwriteExisting: false,
    sendNotification: true
  });

  // 导入结果状态
  const [importResult, setImportResult] = useState<{
    success_count: number;
    error_count: number;
    errors?: Array<{
      index: number;
      employee_id?: number;
      error: string;
    }>;
  } | null>(null);

  // 初始化数据加载
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // 并行加载薪资组件和周期数据
        const [components, periods] = await Promise.all([
          getActivePayrollComponents(),
          getActivePayrollPeriods()
        ]);
        
        setPayrollComponents(components);
        setPayrollPeriods(periods);
        
        console.log('✅ 初始数据加载成功:', {
          componentsCount: components.length,
          periodsCount: periods.length
        });
      } catch (error: any) {
        console.error('❌ 初始数据加载失败:', error);
        message.error(`数据加载失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 步骤配置
  const steps = [
    {
      title: '数据准备',
      description: '上传或输入薪资数据',
      icon: <CloudUploadOutlined />,
      content: 'upload'
    },
    {
      title: '智能映射',
      description: '自动匹配字段映射',
      icon: <SettingOutlined />,
      content: 'mapping'
    },
    {
      title: '数据预览',
      description: '预览和验证数据',
      icon: <EyeOutlined />,
      content: 'preview'
    },
    {
      title: '执行导入',
      description: '完成数据导入',
      icon: <RocketOutlined />,
      content: 'execute'
    }
  ];

  // 字段名称映射函数
  const getFieldDisplayName = (fieldCode: string): string => {
    const fieldNameMap: Record<string, string> = {
      // 基础字段
      'employee_full_name': '员工姓名',
      'employee_code': '员工工号', 
      'department': '部门',
      'id_number': '身份证号码',
      'employee_category': '人员身份',
      'job_level': '人员职级',
      
      // 收入字段
      'earnings_details.BASIC_SALARY.amount': '基本工资',
      'earnings_details.POSITION_SALARY_GENERAL.amount': '岗位工资',
      'earnings_details.GRADE_SALARY.amount': '级别工资',
      'earnings_details.SALARY_GRADE.amount': '薪级工资',
      'earnings_details.PERFORMANCE_SALARY.amount': '绩效工资',
      'earnings_details.PERFORMANCE_BONUS.amount': '奖励性绩效工资',
      'earnings_details.BASIC_PERFORMANCE_SALARY.amount': '基础性绩效工资',
      'earnings_details.BASIC_PERFORMANCE.amount': '基础绩效',
      'earnings_details.BASIC_PERFORMANCE_AWARD.amount': '基础绩效奖',
      'earnings_details.GENERAL_ALLOWANCE.amount': '津贴',
      'earnings_details.ALLOWANCE_GENERAL.amount': '补助',
      'earnings_details.TRAFFIC_ALLOWANCE.amount': '公务交通补贴',
      'earnings_details.TOWNSHIP_ALLOWANCE.amount': '乡镇工作补贴',
      'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount': '公务员规范后津补贴',
      'earnings_details.POSITION_ALLOWANCE.amount': '岗位职务补贴',
      'earnings_details.PETITION_ALLOWANCE.amount': '信访工作人员岗位工作津贴',
      'earnings_details.ONLY_CHILD_PARENT_BONUS.amount': '独生子女父母奖励金',
      'earnings_details.REFORM_ALLOWANCE_1993.amount': '九三年工改保留津补贴',
      'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount': '季度绩效考核薪酬',
      'earnings_details.PROBATION_SALARY.amount': '试用期工资',
      'earnings_details.BACK_PAY.amount': '补发工资',
      'earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount': '奖励绩效补发',
      'earnings_details.POSITION_TECH_GRADE_SALARY.amount': '职务/技术等级工资',
      'earnings_details.GRADE_POSITION_LEVEL_SALARY.amount': '级别/岗位级别工资',
      'earnings_details.STAFF_SALARY_GRADE.amount': '事业单位人员薪级工资',

      // 个人扣除字段
      'deductions_details.PERSONAL_INCOME_TAX.amount': '个人所得税',
      'deductions_details.HOUSING_FUND_PERSONAL.amount': '个人缴住房公积金',
      'deductions_details.PENSION_PERSONAL_AMOUNT.amount': '养老保险个人应缴金额',
      'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount': '医疗保险个人缴纳金额',
      'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount': '失业个人应缴金额',
      'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount': '职业年金个人应缴费额',
      'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount': '补扣（退）款',
      'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount': '补扣社保',
      'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount': '补扣2022年医保款',
      'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount': '绩效奖金补扣发',
      'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount': '奖励绩效补扣发',
      'deductions_details.ONE_TIME_ADJUSTMENT.amount': '一次性补扣发',

      // 单位缴费字段
      'employer_deductions.HOUSING_FUND_EMPLOYER.amount': '单位缴住房公积金',
      'employer_deductions.PENSION_EMPLOYER_AMOUNT.amount': '养老保险单位应缴金额',
      'employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount': '医疗保险单位缴纳金额',
      'employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount': '失业单位应缴金额',
      'employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount': '职业年金单位应缴费额',
      'employer_deductions.INJURY_EMPLOYER_AMOUNT.amount': '工伤单位应缴金额',
      'employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount': '大病医疗单位缴纳',

      // 计算结果字段
      'calculation_results.TAXABLE_INCOME.amount': '应纳税所得额',
      'calculation_results.TAX_DEDUCTION_AMOUNT.amount': '扣除额',
      'calculation_results.TAX_EXEMPT_AMOUNT.amount': '免税额',
      'calculation_results.QUICK_DEDUCTION.amount': '速算扣除数',
      'calculation_results.AFTER_TAX_SALARY.amount': '税后工资',

      // 统计字段
      'stats.ANNUAL_FIXED_SALARY_TOTAL.amount': '固定薪酬全年应发数',
      'stats.QUARTERLY_PERFORMANCE_Q1.amount': '1季度绩效考核薪酬',

      // 其他字段
      'other_fields.UNIFIED_PAYROLL_FLAG': '工资统发标记',
      'other_fields.FISCAL_SUPPORT_FLAG': '财政供养标记',

      // 特殊字段
      '__CALCULATED_FIELD__': '【计算字段】由系统自动计算',
      '__SOCIAL_INSURANCE_GROUP__': '【社保组合】建议拆分为具体险种', 
      '__IGNORE_FIELD__': '【忽略】不导入此字段',
      '__ROW_NUMBER__': '【行号】用于标识记录序号'
    };

    return fieldNameMap[fieldCode] || fieldCode;
  };

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    try {
      console.log('📂 开始解析Excel文件:', file.name);
      
      // 验证文件类型
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!validTypes.includes(file.type)) {
        throw new Error('不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件');
      }
      
      // 动态导入xlsx库
      const XLSX = await import('xlsx');
      
      let workbook;
      
      // 根据文件类型处理不同的编码
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        // CSV文件需要特殊处理编码
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // 智能编码检测和处理
        let csvText = '';
        let detectedEncoding = 'unknown';
        
        // 检测BOM (字节顺序标记)
        const hasBOM = uint8Array.length >= 3 && 
                      uint8Array[0] === 0xEF && 
                      uint8Array[1] === 0xBB && 
                      uint8Array[2] === 0xBF;
        
        if (hasBOM) {
          // 检测到UTF-8 BOM，移除BOM后解码
          const withoutBOM = uint8Array.slice(3);
          csvText = new TextDecoder('utf-8').decode(withoutBOM);
          detectedEncoding = 'utf-8-bom';
          console.log('✅ 检测到UTF-8 BOM，使用UTF-8编码解析');
        } else {
          // 没有BOM，需要智能检测编码
          try {
            // 首先尝试UTF-8解码
            csvText = new TextDecoder('utf-8', { fatal: true }).decode(uint8Array);
            
            // 检查解码结果的质量
            const hasReplacementChars = csvText.includes('\uFFFD');
            const hasValidChineseChars = /[\u4e00-\u9fff]/.test(csvText);
            const hasCommonCsvStructure = csvText.includes(',') || csvText.includes('\n');
            
            if (hasReplacementChars) {
              throw new Error('UTF-8解码包含替换字符');
            }
            
            // 如果包含有效的中文字符或CSV结构，认为UTF-8解码成功
            if (hasValidChineseChars || hasCommonCsvStructure) {
              detectedEncoding = 'utf-8';
              console.log('✅ UTF-8编码解析成功');
            } else {
              // 可能是纯ASCII文件，但UTF-8解码成功
              detectedEncoding = 'utf-8';
              console.log('✅ 使用UTF-8编码解析（可能是ASCII文件）');
            }
          } catch (utf8Error) {
            console.log('⚠️ UTF-8解码失败，尝试处理GBK编码文件...');
            
            // UTF-8解码失败，可能是GBK编码
            // 使用Latin-1作为中介来保持字节完整性
            const rawText = new TextDecoder('latin1').decode(uint8Array);
            
                                      // 智能处理编码问题
             csvText = handleEncodingIssues(rawText, 'gbk-like');
             detectedEncoding = 'encoding-issues-handled';
             console.log('⚠️ 检测到编码问题，已进行基本处理');
          }
        }
        
        console.log('📝 检测到的编码:', detectedEncoding);
        console.log('📝 解码后的CSV文本预览:', csvText.substring(0, 200));
        
        // 如果检测到编码问题，给用户友好提示
        if (detectedEncoding === 'encoding-issues-handled') {
          message.warning({
            content: (
              <div>
                <div>检测到CSV文件编码问题，可能显示乱码</div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  建议解决方案：
                  <br />• 用Excel打开CSV文件，另存为"UTF-8 CSV"格式
                  <br />• 或使用记事本打开，选择"另存为" → 编码选择"UTF-8"
                </div>
              </div>
            ),
            duration: 6
          });
        }
        
        // 使用XLSX解析CSV文本
        workbook = XLSX.read(csvText, { 
          type: 'string',
          raw: true // 保持原始数据格式
        });
      } else {
        // Excel文件正常处理
        const arrayBuffer = await file.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      }
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Excel文件中没有找到工作表');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // 将工作表转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // 使用数组格式而不是对象格式
        defval: '', // 空单元格默认值
        raw: false // 不保留原始值，转换为字符串
      });
      
      console.log('📊 解析的原始数据:', jsonData);
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel文件为空或无法解析');
      }
      
      // 提取表头和数据行
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];
      
      // 过滤掉完全空白的行
      const filteredRows = dataRows.filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
      );
      
      if (!headers || headers.length === 0) {
        throw new Error('未找到有效的表头信息');
      }
      
      if (filteredRows.length === 0) {
        throw new Error('文件中没有找到有效的数据行');
      }
      
      // 清理表头，移除空白字符
      const cleanHeaders = headers.map(header => 
        header ? String(header).trim() : `未命名列${headers.indexOf(header) + 1}`
      );
      
      const parsedData: ImportData = {
        headers: cleanHeaders,
        rows: filteredRows,
        totalRecords: filteredRows.length
      };
      
      console.log('✅ Excel解析成功:', {
        fileName: file.name,
        headers: parsedData.headers,
        totalRecords: parsedData.totalRecords,
        sampleRow: parsedData.rows[0]
      });
      
      setImportData(parsedData);
      
      // 基于真实数据库组件的智能映射逻辑
      const rules: MappingRule[] = parsedData.headers.map((header: string) => {
        const fieldLower = header.toLowerCase();
        
        // 基础字段映射
        if (fieldLower.includes('姓名') || fieldLower.includes('人员姓名')) {
          return { sourceField: header, targetField: 'employee_full_name', confidence: 0.95, category: 'base', required: true };
        }
        if (fieldLower.includes('工号') || fieldLower.includes('编号') || fieldLower.includes('人员编号')) {
          return { sourceField: header, targetField: 'employee_code', confidence: 0.90, category: 'base', required: false };
        }
        if (fieldLower.includes('部门')) {
          return { sourceField: header, targetField: 'department', confidence: 0.85, category: 'base', required: false };
        }
        if (fieldLower.includes('身份证')) {
          return { sourceField: header, targetField: 'id_number', confidence: 0.88, category: 'base', required: false };
        }
        if (fieldLower.includes('序号')) {
          return { sourceField: header, targetField: '__ROW_NUMBER__', confidence: 0.70, category: 'ignore', required: false };
        }
        
        // 收入字段映射 (基于真实数据库组件)
        if (fieldLower.includes('基本工资') || fieldLower === '基本薪资') {
          return { sourceField: header, targetField: 'earnings_details.BASIC_SALARY.amount', confidence: 0.98, category: 'earning', required: false };
        }
        if (fieldLower.includes('岗位工资')) {
          return { sourceField: header, targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('级别工资')) {
          return { sourceField: header, targetField: 'earnings_details.GRADE_SALARY.amount', confidence: 0.92, category: 'earning', required: false };
        }
        if (fieldLower.includes('薪级工资')) {
          return { sourceField: header, targetField: 'earnings_details.SALARY_GRADE.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('绩效工资') && !fieldLower.includes('基础')) {
          return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('奖金') || fieldLower.includes('绩效奖')) {
          return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.85, category: 'earning', required: false };
        }
        if (fieldLower.includes('津贴') && !fieldLower.includes('信访') && !fieldLower.includes('岗位')) {
          return { sourceField: header, targetField: 'earnings_details.GENERAL_ALLOWANCE.amount', confidence: 0.82, category: 'earning', required: false };
        }
        if (fieldLower.includes('补助')) {
          return { sourceField: header, targetField: 'earnings_details.ALLOWANCE_GENERAL.amount', confidence: 0.80, category: 'earning', required: false };
        }
        if (fieldLower.includes('交通补贴') || fieldLower.includes('公务交通')) {
          return { sourceField: header, targetField: 'earnings_details.TRAFFIC_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('乡镇补贴') || fieldLower.includes('乡镇工作补贴')) {
          return { sourceField: header, targetField: 'earnings_details.TOWNSHIP_ALLOWANCE.amount', confidence: 0.92, category: 'earning', required: false };
        }
        if (fieldLower.includes('基础绩效工资') || fieldLower.includes('基础性绩效')) {
          return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('基础绩效奖')) {
          return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('基础绩效') && !fieldLower.includes('工资') && !fieldLower.includes('奖')) {
          return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE.amount', confidence: 0.86, category: 'earning', required: false };
        }
        if (fieldLower.includes('奖励性绩效工资')) {
          return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('独生子女') || fieldLower.includes('父母奖励金')) {
          return { sourceField: header, targetField: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount', confidence: 0.93, category: 'earning', required: false };
        }
        if (fieldLower.includes('公务员规范') || fieldLower.includes('规范后津补贴')) {
          return { sourceField: header, targetField: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('岗位职务补贴') || fieldLower.includes('职务补贴')) {
          return { sourceField: header, targetField: 'earnings_details.POSITION_ALLOWANCE.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('信访工作') || fieldLower.includes('信访津贴') || fieldLower.includes('信访岗位津贴')) {
          return { sourceField: header, targetField: 'earnings_details.PETITION_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('季度绩效') || fieldLower.includes('季度考核') || fieldLower.includes('季度绩效考核薪酬')) {
          return { sourceField: header, targetField: 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('试用期工资')) {
          return { sourceField: header, targetField: 'earnings_details.PROBATION_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('补发工资') || fieldLower.includes('工资补发')) {
          return { sourceField: header, targetField: 'earnings_details.BACK_PAY.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('职务等级工资') || fieldLower.includes('技术等级工资')) {
          return { sourceField: header, targetField: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount', confidence: 0.86, category: 'earning', required: false };
        }
        if (fieldLower.includes('工改保留') || fieldLower.includes('九三年')) {
          return { sourceField: header, targetField: 'earnings_details.REFORM_ALLOWANCE_1993.amount', confidence: 0.84, category: 'earning', required: false };
        }
        if (fieldLower.includes('事业单位') && fieldLower.includes('薪级')) {
          return { sourceField: header, targetField: 'earnings_details.STAFF_SALARY_GRADE.amount', confidence: 0.82, category: 'earning', required: false };
        }
        
        // 扣除字段映射 (基于真实数据库组件)
        if (fieldLower.includes('个人所得税') || fieldLower.includes('个税')) {
          return { sourceField: header, targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount', confidence: 0.95, category: 'deduction', required: false };
        }
        if (fieldLower.includes('住房公积金') || (fieldLower.includes('公积金') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('养老保险') || (fieldLower.includes('养老') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('医疗保险') || (fieldLower.includes('医保') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('失业保险') || (fieldLower.includes('失业') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount', confidence: 0.88, category: 'deduction', required: false };
        }
        if (fieldLower.includes('职业年金')) {
          return { sourceField: header, targetField: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('补扣') && (fieldLower.includes('社保') || fieldLower.includes('保险'))) {
          return { sourceField: header, targetField: 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
        }
        if (fieldLower.includes('2022') && fieldLower.includes('医保')) {
          return { sourceField: header, targetField: 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount', confidence: 0.88, category: 'deduction', required: false };
        }
        if (fieldLower.includes('绩效奖金') && fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount', confidence: 0.86, category: 'deduction', required: false };
        }
        if (fieldLower.includes('奖励绩效') && fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount', confidence: 0.84, category: 'deduction', required: false };
        }
        if (fieldLower.includes('一次性') && fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: 'deductions_details.ONE_TIME_ADJUSTMENT.amount', confidence: 0.82, category: 'deduction', required: false };
        }
        if (fieldLower.includes('补扣') && (fieldLower.includes('退') || fieldLower.includes('款'))) {
          return { sourceField: header, targetField: 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
        }
        
        // 计算结果字段识别
        if (fieldLower.includes('应发') || fieldLower.includes('总收入') || fieldLower.includes('合计收入') || fieldLower.includes('应发工资')) {
          return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
        }
        if (fieldLower.includes('实发') || fieldLower.includes('净收入') || fieldLower.includes('到手') || fieldLower.includes('实发工资')) {
          return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
        }
        if (fieldLower.includes('扣发合计') || fieldLower.includes('扣除合计') || fieldLower.includes('总扣除')) {
          return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
        }
        
        // 统计和标识字段
        if (fieldLower.includes('固定薪酬全年应发数') || fieldLower.includes('年度固定薪酬')) {
          return { sourceField: header, targetField: 'stats.ANNUAL_FIXED_SALARY_TOTAL.amount', confidence: 0.95, category: 'stat', required: false };
        }
        if (fieldLower.includes('工资统发')) {
          return { sourceField: header, targetField: 'other_fields.UNIFIED_PAYROLL_FLAG', confidence: 0.90, category: 'other', required: false };
        }
        if (fieldLower.includes('财政供养')) {
          return { sourceField: header, targetField: 'other_fields.FISCAL_SUPPORT_FLAG', confidence: 0.90, category: 'other', required: false };
        }
        if (fieldLower.includes('人员身份') || fieldLower.includes('员工身份')) {
          return { sourceField: header, targetField: 'employee_category', confidence: 0.85, category: 'base', required: false };
        }
        if (fieldLower.includes('人员职级') || fieldLower.includes('职级')) {
          return { sourceField: header, targetField: 'job_level', confidence: 0.85, category: 'base', required: false };
        }
        
        // 社保组合处理
        if (fieldLower.includes('社保') && !fieldLower.includes('个人') && !fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: '__SOCIAL_INSURANCE_GROUP__', confidence: 0.60, category: 'ignore', required: false };
        }
        
        // 默认处理 - 确保不丢弃任何字段
        const category = fieldLower.includes('工资') || fieldLower.includes('薪') || fieldLower.includes('奖') || fieldLower.includes('津贴') || fieldLower.includes('补助') ? 'earning' : 
                        fieldLower.includes('税') || fieldLower.includes('扣') || fieldLower.includes('保险') || fieldLower.includes('公积金') ? 'deduction' : 
                        fieldLower.includes('应发') || fieldLower.includes('实发') || fieldLower.includes('合计') ? 'calculated' :
                        'base';
        
        return {
          sourceField: header,
          targetField: category === 'earning' ? `earnings_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
                      category === 'deduction' ? `deductions_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
                      category === 'calculated' ? '__CALCULATED_FIELD__' :
                      `__UNMAPPED_${header.toUpperCase().replace(/[^\w]/g, '_')}__`,
          confidence: 0.40,
          category,
          required: false
        };
      });
      
      setMappingRules(rules);
      setCurrentStep(1);
      message.success('文件解析成功！');
    } catch (error) {
      message.error('文件解析失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理文本输入
  const handleTextInput = useCallback(() => {
    if (!textInput.trim()) {
      message.warning('请输入数据内容');
      return;
    }

    setLoading(true);
    try {
      const lines = textInput.trim().split('\n');
      const headers = lines[0].split('\t').map(h => h.trim());
      const rows = lines.slice(1).map(line => 
        line.split('\t').map(cell => {
          const trimmed = cell.trim();
          // 将空字符串转换为null，符合数据处理最佳实践
          return trimmed === '' ? null : trimmed;
        })
      );
      
      const data: ImportData = {
        headers,
        rows,
        totalRecords: rows.length
      };
      
      setImportData(data);
      
      // 基于真实数据库组件的智能映射逻辑
      const rules: MappingRule[] = headers.map(header => {
        const fieldLower = header.toLowerCase();
        
        // 基础字段映射
        if (fieldLower.includes('姓名') || fieldLower.includes('人员姓名')) {
          return { sourceField: header, targetField: 'employee_full_name', confidence: 0.95, category: 'base', required: true };
        }
        if (fieldLower.includes('工号') || fieldLower.includes('编号') || fieldLower.includes('人员编号')) {
          return { sourceField: header, targetField: 'employee_code', confidence: 0.90, category: 'base', required: false };
        }
        if (fieldLower.includes('部门')) {
          return { sourceField: header, targetField: 'department', confidence: 0.85, category: 'base', required: false };
        }
        if (fieldLower.includes('身份证')) {
          return { sourceField: header, targetField: 'id_number', confidence: 0.88, category: 'base', required: false };
        }
        if (fieldLower.includes('序号')) {
          return { sourceField: header, targetField: '__ROW_NUMBER__', confidence: 0.70, category: 'ignore', required: false };
        }
        
        // 收入字段映射 (基于真实数据库组件)
        if (fieldLower.includes('基本工资') || fieldLower === '基本薪资') {
          return { sourceField: header, targetField: 'earnings_details.BASIC_SALARY.amount', confidence: 0.98, category: 'earning', required: false };
        }
        if (fieldLower.includes('岗位工资')) {
          return { sourceField: header, targetField: 'earnings_details.POSITION_SALARY_GENERAL.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('级别工资')) {
          return { sourceField: header, targetField: 'earnings_details.GRADE_SALARY.amount', confidence: 0.92, category: 'earning', required: false };
        }
        if (fieldLower.includes('薪级工资')) {
          return { sourceField: header, targetField: 'earnings_details.SALARY_GRADE.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('绩效工资') && !fieldLower.includes('基础')) {
          return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_SALARY.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('奖金') || fieldLower.includes('绩效奖')) {
          return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.85, category: 'earning', required: false };
        }
        if (fieldLower.includes('津贴') && !fieldLower.includes('信访') && !fieldLower.includes('岗位')) {
          return { sourceField: header, targetField: 'earnings_details.GENERAL_ALLOWANCE.amount', confidence: 0.82, category: 'earning', required: false };
        }
        if (fieldLower.includes('补助')) {
          return { sourceField: header, targetField: 'earnings_details.ALLOWANCE_GENERAL.amount', confidence: 0.80, category: 'earning', required: false };
        }
        if (fieldLower.includes('交通补贴') || fieldLower.includes('公务交通')) {
          return { sourceField: header, targetField: 'earnings_details.TRAFFIC_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('乡镇补贴') || fieldLower.includes('乡镇工作补贴')) {
          return { sourceField: header, targetField: 'earnings_details.TOWNSHIP_ALLOWANCE.amount', confidence: 0.92, category: 'earning', required: false };
        }
        if (fieldLower.includes('基础绩效工资') || fieldLower.includes('基础性绩效')) {
          return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('基础绩效奖')) {
          return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE_AWARD.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('基础绩效') && !fieldLower.includes('工资') && !fieldLower.includes('奖')) {
          return { sourceField: header, targetField: 'earnings_details.BASIC_PERFORMANCE.amount', confidence: 0.86, category: 'earning', required: false };
        }
        if (fieldLower.includes('奖励性绩效工资')) {
          return { sourceField: header, targetField: 'earnings_details.PERFORMANCE_BONUS.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('独生子女') || fieldLower.includes('父母奖励金')) {
          return { sourceField: header, targetField: 'earnings_details.ONLY_CHILD_PARENT_BONUS.amount', confidence: 0.93, category: 'earning', required: false };
        }
        if (fieldLower.includes('公务员规范') || fieldLower.includes('规范后津补贴')) {
          return { sourceField: header, targetField: 'earnings_details.CIVIL_STANDARD_ALLOWANCE.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('岗位职务补贴') || fieldLower.includes('职务补贴')) {
          return { sourceField: header, targetField: 'earnings_details.POSITION_ALLOWANCE.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('信访工作') || fieldLower.includes('信访津贴') || fieldLower.includes('信访岗位津贴')) {
          return { sourceField: header, targetField: 'earnings_details.PETITION_ALLOWANCE.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('季度绩效') || fieldLower.includes('季度考核') || fieldLower.includes('季度绩效考核薪酬')) {
          return { sourceField: header, targetField: 'earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount', confidence: 0.95, category: 'earning', required: false };
        }
        if (fieldLower.includes('试用期工资')) {
          return { sourceField: header, targetField: 'earnings_details.PROBATION_SALARY.amount', confidence: 0.90, category: 'earning', required: false };
        }
        if (fieldLower.includes('补发工资') || fieldLower.includes('工资补发')) {
          return { sourceField: header, targetField: 'earnings_details.BACK_PAY.amount', confidence: 0.88, category: 'earning', required: false };
        }
        if (fieldLower.includes('职务等级工资') || fieldLower.includes('技术等级工资')) {
          return { sourceField: header, targetField: 'earnings_details.POSITION_TECH_GRADE_SALARY.amount', confidence: 0.86, category: 'earning', required: false };
        }
        if (fieldLower.includes('工改保留') || fieldLower.includes('九三年')) {
          return { sourceField: header, targetField: 'earnings_details.REFORM_ALLOWANCE_1993.amount', confidence: 0.84, category: 'earning', required: false };
        }
        if (fieldLower.includes('事业单位') && fieldLower.includes('薪级')) {
          return { sourceField: header, targetField: 'earnings_details.STAFF_SALARY_GRADE.amount', confidence: 0.82, category: 'earning', required: false };
        }
        
        // 扣除字段映射 (基于真实数据库组件)
        if (fieldLower.includes('个人所得税') || fieldLower.includes('个税')) {
          return { sourceField: header, targetField: 'deductions_details.PERSONAL_INCOME_TAX.amount', confidence: 0.95, category: 'deduction', required: false };
        }
        if (fieldLower.includes('住房公积金') || (fieldLower.includes('公积金') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.HOUSING_FUND_PERSONAL.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('养老保险') || (fieldLower.includes('养老') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('医疗保险') || (fieldLower.includes('医保') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('失业保险') || (fieldLower.includes('失业') && fieldLower.includes('个人'))) {
          return { sourceField: header, targetField: 'deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount', confidence: 0.88, category: 'deduction', required: false };
        }
        if (fieldLower.includes('职业年金')) {
          return { sourceField: header, targetField: 'deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount', confidence: 0.90, category: 'deduction', required: false };
        }
        if (fieldLower.includes('补扣') && (fieldLower.includes('社保') || fieldLower.includes('保险'))) {
          return { sourceField: header, targetField: 'deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
        }
        if (fieldLower.includes('2022') && fieldLower.includes('医保')) {
          return { sourceField: header, targetField: 'deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount', confidence: 0.88, category: 'deduction', required: false };
        }
        if (fieldLower.includes('绩效奖金') && fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: 'deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount', confidence: 0.86, category: 'deduction', required: false };
        }
        if (fieldLower.includes('奖励绩效') && fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: 'deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount', confidence: 0.84, category: 'deduction', required: false };
        }
        if (fieldLower.includes('一次性') && fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: 'deductions_details.ONE_TIME_ADJUSTMENT.amount', confidence: 0.82, category: 'deduction', required: false };
        }
        if (fieldLower.includes('补扣') && (fieldLower.includes('退') || fieldLower.includes('款'))) {
          return { sourceField: header, targetField: 'deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount', confidence: 0.85, category: 'deduction', required: false };
        }
        
        // 计算结果字段识别
        if (fieldLower.includes('应发') || fieldLower.includes('总收入') || fieldLower.includes('合计收入') || fieldLower.includes('应发工资')) {
          return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
        }
        if (fieldLower.includes('实发') || fieldLower.includes('净收入') || fieldLower.includes('到手') || fieldLower.includes('实发工资')) {
          return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
        }
        if (fieldLower.includes('扣发合计') || fieldLower.includes('扣除合计') || fieldLower.includes('总扣除')) {
          return { sourceField: header, targetField: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false };
        }
        
        // 统计和标识字段
        if (fieldLower.includes('固定薪酬全年应发数') || fieldLower.includes('年度固定薪酬')) {
          return { sourceField: header, targetField: 'stats.ANNUAL_FIXED_SALARY_TOTAL.amount', confidence: 0.95, category: 'stat', required: false };
        }
        if (fieldLower.includes('工资统发')) {
          return { sourceField: header, targetField: 'other_fields.UNIFIED_PAYROLL_FLAG', confidence: 0.90, category: 'other', required: false };
        }
        if (fieldLower.includes('财政供养')) {
          return { sourceField: header, targetField: 'other_fields.FISCAL_SUPPORT_FLAG', confidence: 0.90, category: 'other', required: false };
        }
        if (fieldLower.includes('人员身份') || fieldLower.includes('员工身份')) {
          return { sourceField: header, targetField: 'employee_category', confidence: 0.85, category: 'base', required: false };
        }
        if (fieldLower.includes('人员职级') || fieldLower.includes('职级')) {
          return { sourceField: header, targetField: 'job_level', confidence: 0.85, category: 'base', required: false };
        }
        
        // 社保组合处理
        if (fieldLower.includes('社保') && !fieldLower.includes('个人') && !fieldLower.includes('补扣')) {
          return { sourceField: header, targetField: '__SOCIAL_INSURANCE_GROUP__', confidence: 0.60, category: 'ignore', required: false };
        }
        
        // 默认处理 - 确保不丢弃任何字段
        const category = fieldLower.includes('工资') || fieldLower.includes('薪') || fieldLower.includes('奖') || fieldLower.includes('津贴') || fieldLower.includes('补助') ? 'earning' : 
                        fieldLower.includes('税') || fieldLower.includes('扣') || fieldLower.includes('保险') || fieldLower.includes('公积金') ? 'deduction' : 
                        fieldLower.includes('应发') || fieldLower.includes('实发') || fieldLower.includes('合计') ? 'calculated' :
                        'base';
        
        return {
          sourceField: header,
          targetField: category === 'earning' ? `earnings_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
                      category === 'deduction' ? `deductions_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
                      category === 'calculated' ? '__CALCULATED_FIELD__' :
                      `__UNMAPPED_${header.toUpperCase().replace(/[^\w]/g, '_')}__`,
          confidence: 0.40,
          category,
          required: false
        };
      });
      
      setMappingRules(rules);
      setCurrentStep(1);
      message.success('数据解析成功！');
    } catch (error) {
      message.error('数据解析失败，请检查数据格式');
    } finally {
      setLoading(false);
    }
  }, [textInput]);

  // 验证数据
  const validateData = useCallback(async () => {
    if (!importData || !selectedPeriodId) {
      message.error('请先选择薪资周期');
      return;
    }
    
    try {
      setLoading(true);
      
      // 处理原始表格数据
      const rawData = processRawTableData(
        importData.headers,
        importData.rows,
        mappingRules
      );
      
      console.log('🔄 开始验证数据:', {
        headers: importData.headers,
        totalRows: importData.rows.length,
        mappingRulesCount: mappingRules.length,
        processedDataCount: rawData.length
      });
      
      // 调用后台验证API
      const validationResult = await validateBulkImportData(rawData, selectedPeriodId);
      
      // 转换验证结果格式
      const result: ValidationResult = {
        total: validationResult.total,
        valid: validationResult.valid,
        invalid: validationResult.invalid,
        warnings: validationResult.warnings,
        errors: validationResult.errors
      };
      
      setValidationResult(result);
      setProcessedData(validationResult.validatedData);
      setCurrentStep(2);
      
      console.log('✅ 数据验证完成:', result);
      
      if (result.invalid > 0) {
        message.warning(`验证完成：${result.valid} 条有效记录，${result.invalid} 条无效记录`);
      } else {
        message.success(`验证完成：所有 ${result.valid} 条记录均有效`);
      }
      
    } catch (error: any) {
      console.error('❌ 数据验证失败:', error);
      message.error(`数据验证失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [importData, selectedPeriodId, mappingRules]);

  // 执行导入
  const executeImport = useCallback(async () => {
    console.log('🔄 执行导入函数被调用:', {
      selectedPeriodId,
      processedDataLength: processedData?.length,
      processedData: processedData,
      importSettings
    });
    
    if (!selectedPeriodId) {
      console.error('❌ 缺少薪资周期ID');
      message.error('请先选择薪资周期');
      return;
    }
    
    if (!processedData) {
      console.error('❌ processedData 为空');
      message.error('没有处理过的数据，请先完成数据验证');
      return;
    }
    
    if (processedData.length === 0) {
      console.error('❌ processedData 长度为0');
      message.error('没有可导入的数据记录');
      return;
    }
    
    // 过滤出有效的数据记录
    const validEntries = processedData.filter(entry => 
      entry.__isValid !== false // 只导入有效记录
    );
    
    console.log('🔄 过滤后的有效数据:', {
      totalProcessedData: processedData.length,
      validEntriesCount: validEntries.length,
      sampleValidEntry: validEntries[0]
    });
    
    if (validEntries.length === 0) {
      console.error('❌ 没有有效的数据记录');
      message.error('没有有效的数据记录可以导入');
      return;
    }

    try {
      setLoading(true);
      
      // 转换为API需要的格式
      const createPayrollEntries: CreatePayrollEntryPayload[] = validEntries.map(entry => ({
        employee_id: entry.employee_id || 0, // 后端会根据employee_info匹配
        payroll_period_id: selectedPeriodId,
        payroll_run_id: 0, // 后端会自动创建或分配
        gross_pay: entry.gross_pay,
        total_deductions: entry.total_deductions,
        net_pay: entry.net_pay,
        status_lookup_value_id: 64, // 使用"已计算"状态ID (PENTRY_CALCULATED)，表示数据已录入
        remarks: entry.remarks || '',
        earnings_details: entry.earnings_details,
        deductions_details: entry.deductions_details,
        employee_info: entry.employee_info
      }));
      
      // 构建批量导入载荷
      const bulkPayload: BulkCreatePayrollEntriesPayload = {
        payroll_period_id: selectedPeriodId,
        entries: createPayrollEntries,
        overwrite_mode: importSettings.overwriteExisting
      };
      
      console.log('🚀 开始执行批量导入:', {
        periodId: selectedPeriodId,
        totalEntries: createPayrollEntries.length,
        overwriteMode: importSettings.overwriteExisting
      });
      
      // 执行批量导入
      const result = await executeBulkImport(bulkPayload);
      
      console.log('✅ 批量导入完成:', result);
      
      // 保存导入结果
      setImportResult(result);
      setCurrentStep(3);
      
      if (result.error_count > 0) {
        message.warning(
          `导入完成：成功 ${result.success_count} 条，失败 ${result.error_count} 条`
        );
      } else {
        message.success(`导入完成：成功导入 ${result.success_count} 条记录`);
      }
      
      // 可选：发送通知
      if (importSettings.sendNotification) {
        // 这里可以添加通知逻辑
        console.log('📧 发送导入完成通知');
      }
      
    } catch (error: any) {
      console.error('❌ 批量导入失败:', error);
      
      // 设置失败结果
      setImportResult({
        success_count: 0,
        error_count: validEntries.length,
        errors: [{
          index: 0,
          error: error.message || '网络错误或服务器异常'
        }]
      });
      
      setCurrentStep(3);
      message.error(`导入失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, processedData, importSettings]);

  // 渲染数据上传步骤
  const renderUploadStep = () => (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <BulbOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={3}>准备您的薪资数据</Title>
        <Paragraph type="secondary">
          支持多种数据输入方式，系统将自动识别和处理您的数据
        </Paragraph>
      </div>

      <Tabs activeKey={inputMethod} onChange={(key) => setInputMethod(key as any)} centered>
        <TabPane 
          tab={
            <span>
              <FileExcelOutlined />
              文件上传
            </span>
          } 
          key="upload"
        >
          <div style={{ padding: '24px 0' }}>
            <Dragger
              name="file"
              multiple={false}
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
              showUploadList={false}
              style={{ padding: 40 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 18, marginBottom: 8 }}>
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 14 }}>
                支持 Excel (.xlsx, .xls) 和 CSV 格式文件
              </p>
            </Dragger>
            
            <Alert
              style={{ marginTop: 16 }}
              message="文件格式要求"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>第一行必须是字段标题</li>
                  <li>每行代表一个员工的薪资记录</li>
                  <li>建议包含：姓名、工号、基本工资等字段</li>
                  <li><strong>CSV文件编码：</strong>推荐使用UTF-8编码，避免中文乱码</li>
                  <li><strong>编码转换：</strong>Excel → 另存为 → CSV UTF-8 / 记事本 → 另存为 → UTF-8编码</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TableOutlined />
              表格粘贴
            </span>
          } 
          key="paste"
        >
          <div style={{ padding: '24px 0' }}>
            <TextArea
              rows={10}
              placeholder="请从Excel复制表格数据粘贴到此处..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleTextInput}
                loading={loading}
                disabled={!textInput.trim()}
              >
                解析数据
              </Button>
            </div>
            
            <Alert
              style={{ marginTop: 16 }}
              message="粘贴说明"
              description="从Excel选中数据区域，复制后直接粘贴到上方文本框，系统会自动识别表格结构"
              type="info"
              showIcon
            />
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );

  // 渲染智能映射步骤
  const renderMappingStep = () => {
    const categoryStats = mappingRules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highConfidenceCount = mappingRules.filter(r => r.confidence >= 0.8).length;
    const lowConfidenceCount = mappingRules.filter(r => r.confidence < 0.6).length;

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 映射统计 */}
        <Card title="映射分析概况">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总字段数"
                value={mappingRules.length}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="高置信度"
                value={highConfidenceCount}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="需确认"
                value={lowConfidenceCount}
                valueStyle={{ color: lowConfidenceCount > 0 ? '#cf1322' : '#3f8600' }}
                prefix={<QuestionCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="映射成功率"
                value={Math.round((highConfidenceCount / mappingRules.length) * 100)}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 字段分类统计 */}
        <Card title="字段分类统计">
          <Row gutter={16}>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {categoryStats.base || 0}
                </div>
                <Tag color="blue">基础信息</Tag>
              </div>
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                  {categoryStats.earning || 0}
                </div>
                <Tag color="green">收入项</Tag>
              </div>
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                  {categoryStats.deduction || 0}
                </div>
                <Tag color="orange">扣除项</Tag>
              </div>
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                  {categoryStats.calculated || 0}
                </div>
                <Tag color="purple">计算项</Tag>
              </div>
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#13c2c2' }}>
                  {categoryStats.stat || 0}
                </div>
                <Tag color="cyan">统计项</Tag>
              </div>
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#eb2f96' }}>
                  {categoryStats.other || 0}
                </div>
                <Tag color="magenta">其他</Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 映射详情表格 */}
        <Card title="字段映射详情">
          <Table
            dataSource={mappingRules}
            rowKey="sourceField"
            pagination={false}
            columns={[
              {
                title: '源字段',
                dataIndex: 'sourceField',
                width: 150,
              },
              {
                title: '目标字段',
                dataIndex: 'targetField',
                width: 200,
                render: (text, record) => (
                  <Select
                    style={{ width: '100%' }}
                    value={text}
                    placeholder="请选择目标字段"
                    showSearch
                    allowClear
                    filterOption={(input, option) => {
                      // 支持搜索选项的value和children内容
                      const value = option?.value?.toString().toLowerCase() || '';
                      const children = option?.children?.toString().toLowerCase() || '';
                      const searchText = input.toLowerCase();
                      
                      // 搜索字段代码和中文名称
                      return value.includes(searchText) || children.includes(searchText);
                    }}
                    optionFilterProp="children"
                    onChange={(value) => {
                      const newRules = mappingRules.map(r => 
                        r.sourceField === record.sourceField 
                          ? { ...r, targetField: value }
                          : r
                      );
                      setMappingRules(newRules);
                    }}
                  >
                    {/* 基础信息字段 */}
                    <Option value="employee_full_name">员工姓名</Option>
                    <Option value="employee_code">员工工号</Option>
                    <Option value="department">部门</Option>
                    
                    {/* 收入字段组 - EARNING */}
                    <OptGroup label="💰 收入项目">
                      <Option value="earnings_details.BASIC_SALARY.amount">基本工资</Option>
                      <Option value="earnings_details.POSITION_SALARY_GENERAL.amount">岗位工资</Option>
                      <Option value="earnings_details.GRADE_SALARY.amount">级别工资</Option>
                      <Option value="earnings_details.SALARY_GRADE.amount">薪级工资</Option>
                      <Option value="earnings_details.PERFORMANCE_SALARY.amount">绩效工资</Option>
                      <Option value="earnings_details.PERFORMANCE_BONUS.amount">奖励性绩效工资</Option>
                      <Option value="earnings_details.BASIC_PERFORMANCE_SALARY.amount">基础性绩效工资</Option>
                      <Option value="earnings_details.BASIC_PERFORMANCE.amount">基础绩效</Option>
                      <Option value="earnings_details.BASIC_PERFORMANCE_AWARD.amount">基础绩效奖</Option>
                      <Option value="earnings_details.GENERAL_ALLOWANCE.amount">津贴</Option>
                      <Option value="earnings_details.ALLOWANCE_GENERAL.amount">补助</Option>
                      <Option value="earnings_details.TRAFFIC_ALLOWANCE.amount">公务交通补贴</Option>
                      <Option value="earnings_details.TOWNSHIP_ALLOWANCE.amount">乡镇工作补贴</Option>
                      <Option value="earnings_details.CIVIL_STANDARD_ALLOWANCE.amount">公务员规范后津补贴</Option>
                      <Option value="earnings_details.POSITION_ALLOWANCE.amount">岗位职务补贴</Option>
                      <Option value="earnings_details.PETITION_ALLOWANCE.amount">信访工作人员岗位工作津贴</Option>
                      <Option value="earnings_details.ONLY_CHILD_PARENT_BONUS.amount">独生子女父母奖励金</Option>
                      <Option value="earnings_details.REFORM_ALLOWANCE_1993.amount">九三年工改保留津补贴</Option>
                      <Option value="earnings_details.QUARTERLY_PERFORMANCE_ASSESSMENT.amount">季度绩效考核薪酬</Option>
                      <Option value="earnings_details.PROBATION_SALARY.amount">试用期工资</Option>
                      <Option value="earnings_details.BACK_PAY.amount">补发工资</Option>
                      <Option value="earnings_details.PERFORMANCE_BONUS_BACK_PAY.amount">奖励绩效补发</Option>
                      <Option value="earnings_details.POSITION_TECH_GRADE_SALARY.amount">职务/技术等级工资</Option>
                      <Option value="earnings_details.GRADE_POSITION_LEVEL_SALARY.amount">级别/岗位级别工资</Option>
                      <Option value="earnings_details.STAFF_SALARY_GRADE.amount">事业单位人员薪级工资</Option>
                    </OptGroup>
                    
                    {/* 个人扣除字段组 - PERSONAL_DEDUCTION */}
                    <OptGroup label="📉 个人扣除项">
                      <Option value="deductions_details.PERSONAL_INCOME_TAX.amount">个人所得税</Option>
                      <Option value="deductions_details.HOUSING_FUND_PERSONAL.amount">个人缴住房公积金</Option>
                      <Option value="deductions_details.PENSION_PERSONAL_AMOUNT.amount">养老保险个人应缴金额</Option>
                      <Option value="deductions_details.MEDICAL_INS_PERSONAL_AMOUNT.amount">医疗保险个人缴纳金额</Option>
                      <Option value="deductions_details.UNEMPLOYMENT_PERSONAL_AMOUNT.amount">失业个人应缴金额</Option>
                      <Option value="deductions_details.OCCUPATIONAL_PENSION_PERSONAL_AMOUNT.amount">职业年金个人应缴费额</Option>
                      <Option value="deductions_details.REFUND_DEDUCTION_ADJUSTMENT.amount">补扣（退）款</Option>
                      <Option value="deductions_details.SOCIAL_INSURANCE_ADJUSTMENT.amount">补扣社保</Option>
                      <Option value="deductions_details.MEDICAL_2022_DEDUCTION_ADJUSTMENT.amount">补扣2022年医保款</Option>
                      <Option value="deductions_details.PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT.amount">绩效奖金补扣发</Option>
                      <Option value="deductions_details.REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT.amount">奖励绩效补扣发</Option>
                    </OptGroup>
                    
                    {/* 一般扣除字段组 - DEDUCTION */}
                    <OptGroup label="🔻 其他扣除项">
                      <Option value="deductions_details.ONE_TIME_ADJUSTMENT.amount">一次性补扣发</Option>
                      <Option value="deductions_details.PERFORMANCE_BONUS_ADJUSTMENT.amount">绩效奖金补扣发</Option>
                      <Option value="deductions_details.REFUND_ADJUSTMENT.amount">补扣（退）款</Option>
                      <Option value="deductions_details.REWARD_PERFORMANCE_ADJUSTMENT.amount">奖励绩效补扣发</Option>
                    </OptGroup>
                    
                    {/* 单位扣除字段组 - EMPLOYER_DEDUCTION (通常不用于导入，但提供选择) */}
                    <OptGroup label="🏢 单位缴费项（参考）">
                      <Option value="employer_deductions.HOUSING_FUND_EMPLOYER.amount">单位缴住房公积金</Option>
                      <Option value="employer_deductions.PENSION_EMPLOYER_AMOUNT.amount">养老保险单位应缴金额</Option>
                      <Option value="employer_deductions.MEDICAL_INS_EMPLOYER_AMOUNT.amount">医疗保险单位缴纳金额</Option>
                      <Option value="employer_deductions.UNEMPLOYMENT_EMPLOYER_AMOUNT.amount">失业单位应缴金额</Option>
                      <Option value="employer_deductions.OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT.amount">职业年金单位应缴费额</Option>
                      <Option value="employer_deductions.INJURY_EMPLOYER_AMOUNT.amount">工伤单位应缴金额</Option>
                      <Option value="employer_deductions.SERIOUS_ILLNESS_EMPLOYER_AMOUNT.amount">大病医疗单位缴纳</Option>
                    </OptGroup>
                    
                    {/* 计算结果字段组 - CALCULATION_RESULT */}
                    <OptGroup label="📊 计算结果项">
                      <Option value="calculation_results.TAXABLE_INCOME.amount">应纳税所得额</Option>
                      <Option value="calculation_results.TAX_DEDUCTION_AMOUNT.amount">扣除额</Option>
                      <Option value="calculation_results.TAX_EXEMPT_AMOUNT.amount">免税额</Option>
                      <Option value="calculation_results.QUICK_DEDUCTION.amount">速算扣除数</Option>
                      <Option value="calculation_results.AFTER_TAX_SALARY.amount">税后工资</Option>
                    </OptGroup>
                    
                    {/* 统计字段组 - STAT */}
                    <OptGroup label="📈 统计项">
                      <Option value="stats.ANNUAL_FIXED_SALARY_TOTAL.amount">固定薪酬全年应发数</Option>
                      <Option value="stats.QUARTERLY_PERFORMANCE_Q1.amount">1季度绩效考核薪酬</Option>
                    </OptGroup>
                    
                    {/* 特殊标记字段 */}
                    <OptGroup label="🏷️ 特殊字段">
                      <Option value="__CALCULATED_FIELD__">【计算字段】由系统自动计算</Option>
                      <Option value="__SOCIAL_INSURANCE_GROUP__">【社保组合】建议拆分为具体险种</Option>
                      <Option value="__IGNORE_FIELD__">【忽略】不导入此字段</Option>
                    </OptGroup>
                  </Select>
                ),
              },
              {
                title: '置信度',
                dataIndex: 'confidence',
                width: 120,
                render: (value) => (
                  <div>
                    <Progress
                      percent={Math.round(value * 100)}
                      size="small"
                      status={value >= 0.8 ? 'success' : value >= 0.6 ? 'normal' : 'exception'}
                    />
                  </div>
                ),
              },
              {
                title: '字段类型',
                dataIndex: 'category',
                width: 100,
                render: (category: string) => {
                  const config: Record<string, { color: string; text: string }> = {
                    base: { color: 'blue', text: '基础' },
                    earning: { color: 'green', text: '收入' },
                    deduction: { color: 'orange', text: '扣除' },
                    calculated: { color: 'purple', text: '计算' },
                    ignore: { color: 'default', text: '忽略' },
                    stat: { color: '#1890ff', text: '统计' },
                    other: { color: '#fa8c16', text: '其他' }
                  };
                  const { color, text } = config[category] || config.base;
                  return <Tag color={color}>{text}</Tag>;
                },
              },
              {
                title: '必填',
                dataIndex: 'required',
                width: 80,
                render: (required) => required ? <Tag color="red">必填</Tag> : <Tag>可选</Tag>,
              },
            ]}
          />
        </Card>

        {/* 智能建议 */}
        {lowConfidenceCount > 0 && (
          <Alert
            type="warning"
            showIcon
            message="发现映射置信度较低的字段"
            description={`有 ${lowConfidenceCount} 个字段的映射置信度较低，建议手动调整映射关系以确保数据准确性。`}
            action={
              <Button size="small" type="text">
                查看详情
              </Button>
            }
          />
        )}

        {/* 薪资周期选择 */}
        <Card title="薪资周期设置">
          <Form layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item 
                  label="选择薪资周期" 
                  required
                  validateStatus={!selectedPeriodId ? 'error' : 'success'}
                  help={!selectedPeriodId ? '请选择要导入数据的薪资周期' : ''}
                >
                  <Select 
                    placeholder="请选择薪资周期" 
                    style={{ width: '100%' }}
                    value={selectedPeriodId}
                    onChange={setSelectedPeriodId}
                    showSearch
                    filterOption={(input, option) => {
                      const label = option?.children?.toString().toLowerCase() || '';
                      return label.includes(input.toLowerCase());
                    }}
                    optionLabelProp="label"
                  >
                    {payrollPeriods.map(period => {
                      const recordCount = period.employee_count || 0;
                      const hasRecords = recordCount > 0;
                      
                      return (
                        <Option 
                          key={period.id} 
                          value={period.id}
                          label={period.name}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                              {period.name}
                            </span>
                            <span style={{ 
                              marginLeft: 8,
                              color: hasRecords ? '#52c41a' : '#8c8c8c',
                              fontSize: '12px'
                            }}>
                              {hasRecords ? (
                                <Tag color="green">
                                  📊 {recordCount} 条记录
                                </Tag>
                              ) : (
                                <Tag color="default">
                                  📄 无记录
                                </Tag>
                              )}
                            </span>
                          </div>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="导入选项">
                  <Space direction="vertical">
                    <div>
                      <Switch 
                        checked={importSettings.skipInvalidRecords}
                        onChange={(checked) => setImportSettings(prev => ({...prev, skipInvalidRecords: checked}))}
                      /> 跳过无效记录
                    </div>
                    <div>
                      <Switch 
                        checked={importSettings.overwriteExisting}
                        onChange={(checked) => setImportSettings(prev => ({...prev, overwriteExisting: checked}))}
                      /> 覆盖已存在记录
                    </div>
                    <div>
                      <Switch 
                        checked={importSettings.sendNotification}
                        onChange={(checked) => setImportSettings(prev => ({...prev, sendNotification: checked}))}
                      /> 发送完成通知
                    </div>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button 
              size="large" 
              onClick={() => setCurrentStep(0)}
            >
              返回上一步
            </Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={validateData} 
              loading={loading}
              disabled={!selectedPeriodId}
            >
              确认映射，开始验证
            </Button>
          </Space>
        </div>
      </Space>
    );
  };

  // 渲染数据预览步骤
  const renderPreviewStep = () => {
    if (!validationResult || !importData) return null;

    const successRate = Math.round((validationResult.valid / validationResult.total) * 100);

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 验证结果统计 */}
        <Card title="数据验证结果">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总记录数"
                value={validationResult.total}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="有效记录"
                value={validationResult.valid}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="无效记录"
                value={validationResult.invalid}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="成功率"
                value={successRate}
                suffix="%"
                valueStyle={{ color: successRate >= 90 ? '#3f8600' : '#fa8c16' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 数据样本预览 */}
        <Card title="数据样本预览">
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <Table
              dataSource={importData.rows.slice(0, 5).map((row, index) => {
                const record: any = { key: index };
                importData.headers.forEach((header, i) => {
                  record[header] = row[i];
                });
                return record;
              })}
              columns={importData.headers.map((header, colIndex) => ({
                title: header,
                dataIndex: header,
                key: `col-${colIndex}`,
                width: 120, // 固定列宽以确保滚动效果
                ellipsis: {
                  showTitle: false
                },
                render: (value) => (
                  <span title={value || '(空)'} style={{ 
                    display: 'inline-block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {value === null || value === '' ? (
                      <Text type="secondary" italic>(空)</Text>
                    ) : (
                      value
                    )}
                  </span>
                )
              }))}
              pagination={false}
              size="small"
              scroll={{ 
                x: Math.max(800, importData.headers.length * 120), // 动态计算最小滚动宽度
                y: 240 // 固定表格高度，超出部分垂直滚动
              }}
              bordered
            />
          </div>
          {importData.totalRecords > 5 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">
                显示前5条记录，共 {importData.totalRecords} 条记录
              </Text>
            </div>
          )}
          
          {/* 添加操作提示 */}
          <Alert
            style={{ marginTop: 12 }}
            message="预览说明"
            description="表格支持水平和垂直滚动，可以查看所有字段内容。空单元格显示为「(空)」，鼠标悬停可查看完整内容。"
            type="info"
            showIcon
            closable
          />
        </Card>

        {/* 导入设置 */}
        <Card title="导入设置">
          <Form layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="当前选择的薪资周期">
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#f6ffed', 
                    border: '1px solid #b7eb8f',
                    borderRadius: '6px'
                  }}>
                    <Text strong>
                      {payrollPeriods.find(p => p.id === selectedPeriodId)?.name || '未选择周期'}
                    </Text>
                    {selectedPeriodId && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {payrollPeriods.find(p => p.id === selectedPeriodId)?.start_date} ~ {payrollPeriods.find(p => p.id === selectedPeriodId)?.end_date}
                      </div>
                    )}
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="导入选项">
                  <Space direction="vertical">
                    <div>
                      <Switch 
                        checked={importSettings.skipInvalidRecords}
                        onChange={(checked) => setImportSettings(prev => ({...prev, skipInvalidRecords: checked}))}
                      /> 跳过无效记录
                    </div>
                    <div>
                      <Switch 
                        checked={importSettings.overwriteExisting}
                        onChange={(checked) => setImportSettings(prev => ({...prev, overwriteExisting: checked}))}
                      /> 覆盖已存在记录
                    </div>
                    <div>
                      <Switch 
                        checked={importSettings.sendNotification}
                        onChange={(checked) => setImportSettings(prev => ({...prev, sendNotification: checked}))}
                      /> 发送完成通知
                    </div>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 无效记录详情 */}
        {validationResult.invalid > 0 && processedData && (
          <Card 
            title="无效记录详情"
            extra={
              <Button 
                type="primary" 
                danger
                icon={<WarningOutlined />}
                onClick={() => {
                  // 过滤掉无效记录，只保留有效记录
                  const validRecords = processedData.filter(record => record.__isValid);
                  setProcessedData(validRecords);
                  
                  // 更新验证结果
                  setValidationResult(prev => ({
                    ...prev!,
                    total: validRecords.length,
                    invalid: 0,
                    valid: validRecords.length
                  }));
                  
                  message.success(`已丢弃 ${validationResult.invalid} 条无效记录，保留 ${validRecords.length} 条有效记录`);
                }}
              >
                丢弃无效记录
              </Button>
            }
          >
            <Alert
              type="error"
              showIcon
              message={`发现 ${validationResult.invalid} 条无效记录`}
              description="以下记录存在验证错误，您可以手动修正后重新导入，或者直接丢弃这些无效记录"
              style={{ marginBottom: 16 }}
            />
            
            {/* 无效记录表格 */}
            <Table
              dataSource={processedData.filter(record => !record.__isValid)}
              columns={[
                {
                  title: '行号',
                  dataIndex: 'originalIndex',
                  key: 'originalIndex',
                  width: 80,
                  render: (index) => (index || 0) + 1,
                },
                {
                  title: '员工姓名',
                  dataIndex: 'employee_full_name',
                  key: 'employee_full_name',
                  width: 120,
                  render: (text, record) => text || record.employee_name || '未知',
                },
                {
                  title: '身份证号',
                  dataIndex: 'id_number',
                  key: 'id_number',
                  width: 150,
                  render: (text) => text || '-',
                },
                {
                  title: '应发工资',
                  dataIndex: 'gross_pay',
                  key: 'gross_pay',
                  width: 100,
                  render: (value) => value !== undefined ? `¥${Number(value).toFixed(2)}` : '-',
                },
                {
                  title: '实发工资',
                  dataIndex: 'net_pay',
                  key: 'net_pay',
                  width: 100,
                  render: (value) => value !== undefined ? `¥${Number(value).toFixed(2)}` : '-',
                },
                {
                  title: '错误原因',
                  dataIndex: '__errors',
                  key: '__errors',
                  render: (errors: string[]) => (
                    <div>
                      {errors && errors.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16, color: '#ff4d4f' }}>
                          {errors.map((error, index) => (
                            <li key={index} style={{ fontSize: '12px' }}>{error}</li>
                          ))}
                        </ul>
                      ) : (
                        <Text type="secondary">未知错误</Text>
                      )}
                    </div>
                  ),
                },
              ]}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条无效记录`
              }}
              size="small"
              bordered
              scroll={{ x: 800 }}
            />

            {/* 通用错误信息 */}
            {validationResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>通用错误信息：</Text>
                <ul style={{ margin: '8px 0 0 0', color: '#ff4d4f' }}>
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={() => setCurrentStep(1)}>返回映射</Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={executeImport}
              loading={loading}
              disabled={validationResult.valid === 0}
            >
              开始导入 ({validationResult.valid} 条记录)
            </Button>
            
            {/* 当有无效记录时，提供快速操作提示 */}
            {validationResult.invalid > 0 && (
              <Alert
                type="info"
                showIcon
                message="操作提示"
                description="您可以直接导入有效记录，或使用上方的'丢弃无效记录'按钮清理数据后再导入"
                style={{ marginTop: 16, textAlign: 'left' }}
              />
            )}
          </Space>
        </div>
      </Space>
    );
  };

  // 渲染执行导入步骤
  const renderExecuteStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      {loading ? (
        <Card>
          <div style={{ padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 24 }} />
            <Title level={3}>正在导入数据...</Title>
            <Progress percent={60} status="active" style={{ marginBottom: 16 }} />
            <Text type="secondary">请耐心等待，正在处理您的薪资数据</Text>
          </div>
        </Card>
      ) : importResult ? (
        // 根据实际导入结果显示状态
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Result
            status={importResult.error_count === 0 ? "success" : importResult.success_count > 0 ? "warning" : "error"}
            title={
              importResult.error_count === 0 
                ? "导入完成！" 
                : importResult.success_count > 0 
                  ? "部分导入成功" 
                  : "导入失败"
            }
            subTitle={
              importResult.error_count === 0 
                ? `成功导入 ${importResult.success_count} 条薪资记录`
                : `成功导入 ${importResult.success_count} 条记录，失败 ${importResult.error_count} 条记录`
            }
            extra={[
              <Button type="primary" key="view">
                查看导入结果
              </Button>,
              <Button key="new" onClick={() => {
                setCurrentStep(0);
                setImportData(null);
                setMappingRules([]);
                setValidationResult(null);
                setImportResult(null);
                setTextInput(''); // 清空粘贴文本框
              }}>
                继续导入
              </Button>,
            ]}
          />

          {/* 导入结果统计 */}
          <Card title="导入结果统计">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="成功记录"
                  value={importResult.success_count}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="失败记录"
                  value={importResult.error_count}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="成功率"
                  value={Math.round((importResult.success_count / (importResult.success_count + importResult.error_count)) * 100)}
                  suffix="%"
                  valueStyle={{ 
                    color: importResult.error_count === 0 ? '#3f8600' : '#fa8c16' 
                  }}
                />
              </Col>
            </Row>
          </Card>

          {/* 错误详情 */}
          {importResult.error_count > 0 && importResult.errors && (
            <Card title="错误详情">
              <Alert
                type="error"
                showIcon
                message={`发现 ${importResult.error_count} 条记录导入失败`}
                description={
                  <div style={{ marginTop: 8 }}>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>
                          <Text strong>第 {error.index + 1} 行</Text>
                          {error.employee_id && <Text type="secondary"> (员工ID: {error.employee_id})</Text>}
                          : {error.error}
                        </li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li key="more">
                          <Text type="secondary">... 还有 {importResult.errors.length - 10} 个错误</Text>
                        </li>
                      )}
                    </ul>
                  </div>
                }
              />
            </Card>
          )}
        </Space>
      ) : (
        <Result
          status="error"
          title="导入异常"
          subTitle="未获取到导入结果，请重试"
          extra={[
            <Button key="retry" onClick={() => setCurrentStep(2)}>
              返回重试
            </Button>,
          ]}
        />
      )}
    </div>
  );

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderMappingStep();
      case 2:
        return renderPreviewStep();
      case 3:
        return renderExecuteStep();
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="薪资批量导入"
      subTitle="智能化薪资数据批量导入工具"
      tags={[
        <Tag key="smart" color="blue">智能映射</Tag>,
        <Tag key="batch" color="green">批量处理</Tag>
      ]}
      extra={[
        <Button key="help" icon={<QuestionCircleOutlined />}>
          导入帮助
        </Button>
      ]}
      breadcrumb={{
        routes: [
          { path: '/finance', breadcrumbName: '财务管理' },
          { path: '/finance/payroll', breadcrumbName: '薪资管理' },
          { path: '/finance/payroll/bulk-import', breadcrumbName: '批量导入' }
        ]
      }}
    >
      <Card>
        {/* 步骤指示器 */}
        <Steps 
          current={currentStep} 
          style={{ marginBottom: 32 }}
          size="default"
        >
          {steps.map((step, index) => (
            <Steps.Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        <Divider />

        {/* 步骤内容 */}
        <div style={{ minHeight: 400 }}>
          {renderStepContent()}
        </div>
      </Card>
    </PageContainer>
  );
};

export default PayrollBulkImportPageV3; 