import apiClient from '../../../api/apiClient';
import type {
  RawPayrollEntryData,
  ValidatedPayrollEntryData,
  CreatePayrollEntryPayload,
  BulkCreatePayrollEntriesPayload,
  BulkCreatePayrollEntriesResult,
  PayrollComponentDefinition,
  PayrollPeriod,
  ApiListResponse,
  ApiSingleResponse,
  PayrollEntry
} from '../types/payrollTypes';
import { OverwriteMode } from '../types/payrollTypes';

// 批量导入数据验证结果接口
export interface BulkImportValidationResult {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  errors: string[];
  validatedData: ValidatedPayrollEntryData[];
}

// 字段映射规则接口
export interface FieldMappingRule {
  sourceField: string;
  targetField: string;
  confidence: number;
  category: 'base' | 'earning' | 'deduction' | 'calculated' | 'ignore' | 'stat' | 'other';
  required: boolean;
}

// 预处理的导入数据接口
export interface ProcessedImportData {
  mappingRules: FieldMappingRule[];
  rawData: RawPayrollEntryData[];
  headers: string[];
  totalRecords: number;
}

// 新增：中文姓名拆分工具函数
const commonTwoCharSurnames = ["欧阳", "太史", "端木", "上官", "司马", "东方", "独孤", "南宫", "万俟", "闻人", "夏侯", "诸葛", "尉迟", "公羊", "赫连", "澹台", "皇甫", "宗政", "濮阳", "公冶", "太叔", "申屠", "公孙", "慕容", "仲孙", "钟离", "长孙", "宇文", "司徒", "鲜于", "司空", "闾丘", "子车", "亓官", "司寇", "巫马", "公西", "颛孙", "壤驷", "公良", "漆雕", "乐正", "宰父", "谷梁", "拓跋", "夹谷", "轩辕", "令狐", "段干", "百里", "呼延", "东郭", "南门", "羊舌", "微生", "公户", "公玉", "公仪", "梁丘", "公仲", "公上", "公门", "公山", "公坚", "左丘", "公伯", "西门", "公祖", "第五", "公乘", "贯丘", "公皙", "南荣", "东里", "东宫", "仲长", "子书", "子桑", "即墨", "达奚", "褚师"];

function splitChineseName(fullName: string): { lastName: string; firstName: string } {
  if (!fullName || fullName.length < 2) {
    return { lastName: fullName || '', firstName: '' };
  }
  const twoCharSurname = commonTwoCharSurnames.find(surname => fullName.startsWith(surname));
  if (twoCharSurname && fullName.length > 2) {
    return { lastName: twoCharSurname, firstName: fullName.substring(2) };
  }
  return { lastName: fullName.substring(0, 1), firstName: fullName.substring(1) };
}

/**
 * 验证批量导入薪资数据
 * @param data 原始薪资条目数据
 * @param periodId 薪资周期ID
 * @param overwriteMode 覆写模式
 * @returns 验证结果
 */
export const validateBulkImportData = async (
  data: RawPayrollEntryData[],
  periodId: number,
  overwriteMode: OverwriteMode = OverwriteMode.NONE
): Promise<BulkImportValidationResult> => {
  try {
    console.log('🔄 开始验证薪资数据:', {
      totalRecords: data.length,
      periodId,
      overwriteMode,
      sampleRecord: data[0]
    });

    // 转换为后端期望的格式，添加必填字段
    const entries: CreatePayrollEntryPayload[] = data.map(entry => ({
      // employee_id 可选 - 后端会根据employee_info进行匹配
      payroll_period_id: periodId,
      payroll_run_id: 0, // 后端会自动创建或分配
      status_lookup_value_id: 60, // 60 = "待计算" 状态
      
      // 数据字段
      gross_pay: entry.gross_pay || 0,
      total_deductions: entry.total_deductions || 0,
      net_pay: entry.net_pay || 0,
      earnings_details: entry.earnings_details || {},
      deductions_details: entry.deductions_details || {},
      remarks: entry.remarks || '',
      
      // 员工匹配信息
      employee_info: entry.employee_info || undefined
    }));

    const payload = {
      payroll_period_id: periodId,
      entries,
      overwrite_mode: overwriteMode
    };

    const response = await apiClient.post<BulkImportValidationResult>(
      '/payroll-entries/bulk/validate',
      payload,
      {
        timeout: 300000 // 5分钟超时
      }
    );
    
    const validationResult = response.data;
    
    console.log('✅ 薪资数据验证成功:', validationResult);
    return validationResult;
  } catch (error: any) {
    console.error('❌ 薪资数据验证失败:', error);
    
    // 提取详细错误信息
    let errorMessage = '数据验证失败';
    if (error.response?.data?.detail?.error?.message) {
      errorMessage = error.response.data.detail.error.message;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 处理原始表格数据，转换为标准的薪资记录格式
 * @param headers 表头数组
 * @param rows 数据行数组
 * @param mappingRules 字段映射规则
 * @returns 处理后的薪资数据
 */
export const processRawTableData = (
  headers: string[],
  rows: any[][],
  mappingRules: FieldMappingRule[]
): RawPayrollEntryData[] => {
  const processedData: RawPayrollEntryData[] = [];
  
  // 创建映射索引
  const fieldMapping = new Map<string, string>();
  mappingRules.forEach(rule => {
    fieldMapping.set(rule.sourceField, rule.targetField);
  });

  rows.forEach((row, rowIndex) => {
    const entry: RawPayrollEntryData = {
      _clientId: `import_${rowIndex}_${Date.now()}`,
      originalIndex: rowIndex,
      gross_pay: 0,
      total_deductions: 0,
      net_pay: 0,
      earnings_details: {},
      deductions_details: {},
    };

    // 处理每个字段
    headers.forEach((header, colIndex) => {
      const value = row[colIndex];
      const targetField = fieldMapping.get(header);
      
      if (!targetField || value === undefined || value === null || value === '') {
        return;
      }

      // 新增：处理姓名自动拆分
      if (targetField === 'split_full_name') {
        const fullName = String(value).trim();
        const { lastName, firstName } = splitChineseName(fullName);
        entry.last_name = lastName;
        entry.first_name = firstName;
        entry.employee_name = fullName; // 保留完整姓名
      }
      // 处理基础字段
      else if (targetField === 'lastName') {
        entry.last_name = String(value).trim();
      } else if (targetField === 'firstName') {
        entry.first_name = String(value).trim();
      } else if (targetField === 'employee_code') {
        entry.employee_code = String(value).trim();
      } else if (targetField === 'id_number') {
        // 🔧 修复：身份证号特殊处理，确保保持完整性
        if (value !== null && value !== undefined && value !== '') {
          // 🔧 增强修复：处理数字类型的身份证号，避免精度丢失
          if (typeof value === 'number') {
            // 使用 Math.round 确保整数，然后转字符串
            entry.id_number = Math.round(value).toString();
          } else {
            entry.id_number = String(value).trim();
          }
          
          // 🔍 调试：记录身份证号处理过程
          console.log('🔍 [身份证号处理]:', {
            原始值: value,
            原始类型: typeof value,
            处理后: entry.id_number,
            处理后类型: typeof entry.id_number,
            长度: entry.id_number.length
          });
          
          // 🔧 验证身份证号格式
          const idPattern = /^\d{17}[\dXx]$/;
          if (!idPattern.test(entry.id_number)) {
            console.warn('⚠️ [身份证号格式警告]:', {
              身份证号: entry.id_number,
              格式正确: false
            });
          }
        } else {
          entry.id_number = '';
        }
      } else if (targetField === 'department') {
        entry.department_name = String(value).trim();
      } else if (targetField === 'employee_category') {
        entry.raw_personnel_identity = String(value).trim();
        // 标准化人员类型
        const identity = String(value).trim();
        if (identity.includes('聘用') || identity.includes('临时')) {
          entry.personnel_type = 'HIRED';
          entry.__isHiredPersonnel = true;
        } else if (identity.includes('在编')) {
          entry.personnel_type = 'REGULAR';
          entry.__isHiredPersonnel = false;
        } else {
          entry.personnel_type = 'UNKNOWN';
        }
      } else if (targetField === 'job_level') {
        // 可以添加职级处理逻辑
      }
      
      // 处理计算字段
      else if (targetField === 'gross_pay') {
        entry.gross_pay = parseFloat(String(value)) || 0;
      } else if (targetField === 'total_deductions') {
        entry.total_deductions = parseFloat(String(value)) || 0;
      } else if (targetField === 'net_pay') {
        entry.net_pay = parseFloat(String(value)) || 0;
      }
      
      // 处理收入字段
      else if (targetField.startsWith('earnings_details.')) {
        const componentCode = targetField.match(/earnings_details\.(.+)\.amount/)?.[1];
        if (componentCode) {
          const amount = parseFloat(String(value)) || 0;
          if (amount > 0) {
            entry.earnings_details[componentCode] = { amount };
          }
        }
      }
      
      // 处理扣除字段
      else if (targetField.startsWith('deductions_details.')) {
        const componentCode = targetField.match(/deductions_details\.(.+)\.amount/)?.[1];
        if (componentCode) {
          const amount = parseFloat(String(value)) || 0;
          if (amount > 0) {
            entry.deductions_details[componentCode] = { amount };
          }
        }
      }
      
      // 处理其他字段
      else if (targetField.startsWith('other_fields.')) {
        // 暂时忽略其他字段，或者添加特殊处理逻辑
      }
    });

    // 设置总收入（通常等于应发合计）
    entry.total_earnings = entry.gross_pay;
    
    // 构造完整的 employee_name
    if (entry.last_name && entry.first_name && !entry.employee_name) {
      entry.employee_name = `${entry.last_name}${entry.first_name}`;
    }

    // 设置员工信息用于后端匹配
    if (entry.last_name && entry.first_name) {
      entry.employee_info = {
        last_name: entry.last_name,
        first_name: entry.first_name,
        id_number: entry.id_number || '', // 🔧 修复：确保身份证号正确传递
      };
      
      // 🔍 调试：记录employee_info构建过程
      console.log('🔍 [employee_info构建]:', {
        员工姓名: `${entry.last_name}${entry.first_name}`,
        身份证号: entry.id_number,
        employee_info: entry.employee_info
      });
    }

    processedData.push(entry);
  });

  return processedData;
};

/**
 * 执行批量导入薪资数据
 * @param data 批量导入载荷
 * @returns 导入结果
 */
export const executeBulkImport = async (
  data: BulkCreatePayrollEntriesPayload
): Promise<BulkCreatePayrollEntriesResult> => {
  try {
    console.log('🚀 开始执行批量导入:', {
      periodId: data.payroll_period_id,
      entriesCount: data.entries.length,
      overwriteMode: data.overwrite_mode
    });

    // 为批量导入设置更长的超时时间（10分钟）
    const response = await apiClient.post<BulkCreatePayrollEntriesResult>(
      '/payroll-entries/bulk',
      data,
      {
        timeout: 600000 // 10分钟超时
      }
    );
    
    console.log('✅ 批量导入成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ 批量导入失败:', error);
    
    // 提取详细错误信息
    let errorMessage = '批量导入失败';
    if (error.response?.data?.detail?.error?.message) {
      errorMessage = error.response.data.detail.error.message;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 获取活跃的薪资组件定义 - 🚀 使用优化接口
 * @returns 薪资组件定义列表
 */
export const getActivePayrollComponents = async (): Promise<PayrollComponentDefinition[]> => {
  try {
    // 🚀 优先使用高性能优化接口
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      '/views-optimized/payroll-component-definitions',
      {
        params: {
          is_active: true,
          size: 100 // API 限制最大为 100
        }
      }
    );
    
    return response.data.data;
  } catch (error: any) {
    console.warn('⚠️ 优化接口失败，降级到原接口:', error.message);
    
    // 降级到原接口
    try {
      const fallbackResponse = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
        '/views-optimized/payroll-component-definitions',
        {
          params: {
            is_active: true,
            size: 100
          }
        }
      );
      
      return fallbackResponse.data.data;
    } catch (fallbackError: any) {
      console.error('❌ 获取薪资组件定义失败:', fallbackError);
      throw new Error(`获取薪资组件定义失败: ${fallbackError.response?.data?.detail?.error?.message || fallbackError.message}`);
    }
  }
};

/**
 * 获取活跃的薪资周期列表
 * @returns 薪资周期列表
 */
export const getActivePayrollPeriods = async (): Promise<PayrollPeriod[]> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollPeriod>>(
      '/simple-payroll/periods', 
      {
        params: {
          is_active: true,
          size: 100
        },
        timeout: 10000 // 10秒超时
      }
    );
    
    return response.data.data;
  } catch (error: any) {
    console.error('❌ 获取薪资周期失败:', error);
    throw new Error(`获取薪资周期失败: ${error.response?.data?.detail?.error?.message || error.message}`);
  }
};

/**
 * 💡 获取薪资组件定义列表（支持参数）
 * 专门为动态映射表提供的方法
 * @param params 查询参数
 * @returns 薪资组件定义列表
 */
export const getPayrollComponentDefinitions = async (params: {
  is_active?: boolean;
  size?: number;
  type?: string;
}): Promise<ApiListResponse<PayrollComponentDefinition>> => {
  try {
    console.log('🔍 [getPayrollComponentDefinitions] 获取工资组件定义:', params);
    
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      '/config/payroll-component-definitions',
      {
        params: {
          is_active: true,
          size: 200,
          ...params
        }
      }
    );
    
    console.log('✅ [getPayrollComponentDefinitions] 获取成功:', {
      count: response.data.data?.length || 0,
      total: response.data.meta?.total || 0
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [getPayrollComponentDefinitions] 获取失败:', error);
    
    // 提取详细错误信息
    let errorMessage = '获取工资组件定义失败';
    if (error.response?.data?.detail?.error?.message) {
      errorMessage = error.response.data.detail.error.message;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 基于后端薪资组件定义动态生成字段映射规则
 * @param headers 表头数组
 * @param components 薪资组件定义列表
 * @returns 智能映射规则
 */
export const generateDynamicFieldMapping = (
  headers: string[],
  components: PayrollComponentDefinition[]
): FieldMappingRule[] => {
  console.log('🧠 开始动态生成字段映射:', {
    headersCount: headers.length,
    componentsCount: components.length,
    headers,
    componentCodes: components.map(c => c.code)
  });

  // 创建组件映射索引
  const componentsByCode = new Map<string, PayrollComponentDefinition>();
  const componentsByName = new Map<string, PayrollComponentDefinition>();
  const componentsByDisplayOrder = new Map<number, PayrollComponentDefinition>();
  
  components.forEach(component => {
    componentsByCode.set(component.code, component);
    componentsByName.set(component.name, component);
    // display_order 属性可能不存在，暂时注释掉
    // if (component.display_order) {
    //   componentsByDisplayOrder.set(component.display_order, component);
    // }
  });

  // 预定义的基础字段映射（固定不变）
  const baseFieldMappings: Record<string, { target: string; confidence: number; category: FieldMappingRule['category']; required: boolean }> = {
    // 员工基础信息
    '姓名': { target: 'employee_full_name', confidence: 0.95, category: 'base', required: true },
    '人员姓名': { target: 'employee_full_name', confidence: 0.95, category: 'base', required: true },
    '员工姓名': { target: 'employee_full_name', confidence: 0.95, category: 'base', required: true },
    '工号': { target: 'employee_code', confidence: 0.90, category: 'base', required: false },
    '员工工号': { target: 'employee_code', confidence: 0.90, category: 'base', required: false },
    '人员编号': { target: 'employee_code', confidence: 0.90, category: 'base', required: false },
    '部门': { target: 'department', confidence: 0.85, category: 'base', required: false },
    '身份证': { target: 'id_number', confidence: 0.88, category: 'base', required: false },
    '身份证号': { target: 'id_number', confidence: 0.88, category: 'base', required: false },
    '身份证号码': { target: 'id_number', confidence: 0.88, category: 'base', required: false },
    '人员身份': { target: 'employee_category', confidence: 0.85, category: 'base', required: false },
    '员工身份': { target: 'employee_category', confidence: 0.85, category: 'base', required: false },
    '人员职级': { target: 'job_level', confidence: 0.85, category: 'base', required: false },
    '职级': { target: 'job_level', confidence: 0.85, category: 'base', required: false },
    '序号': { target: '__ROW_NUMBER__', confidence: 0.70, category: 'ignore', required: false },
    '行号': { target: '__ROW_NUMBER__', confidence: 0.70, category: 'ignore', required: false },
    
    // 计算结果字段
    '应发': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '应发合计': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '总收入': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '合计收入': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '实发': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '实发合计': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '净收入': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '到手': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '扣发合计': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '扣除合计': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false },
    '总扣除': { target: '__CALCULATED_FIELD__', confidence: 0.70, category: 'calculated', required: false }
  };

  const mappingRules: FieldMappingRule[] = headers.map(header => {
    const headerLower = header.toLowerCase();
    const headerTrimmed = header.trim();
    
    // 1. 首先检查基础字段映射
    for (const [pattern, mapping] of Object.entries(baseFieldMappings)) {
      if (headerTrimmed.includes(pattern) || headerLower.includes(pattern.toLowerCase())) {
        return {
          sourceField: header,
          targetField: mapping.target,
          confidence: mapping.confidence,
          category: mapping.category,
          required: mapping.required
        };
      }
    }

    // 2. 动态匹配薪资组件
    let bestMatch: { component: PayrollComponentDefinition; confidence: number } | null = null;

    // 遍历所有薪资组件，寻找最佳匹配
    for (const component of components) {
      let confidence = 0;
      
      // 精确匹配组件名称
      if (component.name === headerTrimmed) {
        confidence = 0.98;
      }
      // 包含匹配组件名称
      else if (headerTrimmed.includes(component.name) || component.name.includes(headerTrimmed)) {
        confidence = 0.90;
      }
      // 匹配组件描述
      else if (component.description && (
        headerTrimmed.includes(component.description) || 
        component.description.includes(headerTrimmed)
      )) {
        confidence = 0.85;
      }
      // 关键词匹配
      else {
        // 使用组件名称中的关键词进行模糊匹配
        const componentKeywords = component.name.replace(/[^\u4e00-\u9fff\w]/g, '').split('').filter(w => w.length > 0);
        const headerKeywords = headerTrimmed.replace(/[^\u4e00-\u9fff\w]/g, '').split('').filter(w => w.length > 0);
        
        let matchCount = 0;
        let totalKeywords = Math.max(componentKeywords.length, headerKeywords.length);
        
        componentKeywords.forEach(keyword => {
          if (headerKeywords.some(h => h.includes(keyword) || keyword.includes(h))) {
            matchCount++;
          }
        });
        
        if (matchCount > 0 && totalKeywords > 0) {
          confidence = (matchCount / totalKeywords) * 0.75; // 最高0.75的置信度
          
          // 如果匹配度太低，不采用
          if (confidence < 0.3) {
            confidence = 0;
          }
        }
      }

      // 更新最佳匹配
      if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { component, confidence };
      }
    }

    // 3. 如果找到了最佳匹配的组件
    if (bestMatch && bestMatch.confidence >= 0.3) {
      const { component, confidence } = bestMatch;
      
      // 根据组件类型确定目标字段和分类
      let targetField: string;
      let category: FieldMappingRule['category'];
      
      switch (component.type) {
        case 'EARNING':
          targetField = `earnings_details.${component.code}.amount`;
          category = 'earning';
          break;
        case 'PERSONAL_DEDUCTION':
        case 'DEDUCTION':
          targetField = `deductions_details.${component.code}.amount`;
          category = 'deduction';
          break;
        case 'EMPLOYER_DEDUCTION':
          targetField = `deductions_details.${component.code}.amount`;
          category = 'deduction';
          break;
        // case 'CALCULATION_RESULT':
        //   targetField = `calculation_results.${component.code}.amount`;
        //   category = 'calculated';
        //   break;
        case 'STAT':
          targetField = `stats.${component.code}.amount`;
          category = 'stat';
          break;
        default:
          targetField = `other_fields.${component.code}`;
          category = 'other';
      }

      return {
        sourceField: header,
        targetField,
        confidence,
        category,
        required: false
      };
    }

    // 4. 社保组合处理（通用匹配）
    if (headerLower.includes('社保') && !headerLower.includes('个人') && !headerLower.includes('补扣')) {
      return {
        sourceField: header,
        targetField: '__SOCIAL_INSURANCE_GROUP__',
        confidence: 0.60,
        category: 'ignore',
        required: false
      };
    }

    // 5. 默认处理 - 根据字段特征推断类型
    const inferredCategory = headerLower.includes('工资') || headerLower.includes('薪') || 
                            headerLower.includes('奖') || headerLower.includes('津贴') || 
                            headerLower.includes('补助') ? 'earning' : 
                            headerLower.includes('税') || headerLower.includes('扣') || 
                            headerLower.includes('保险') || headerLower.includes('公积金') ? 'deduction' : 
                            headerLower.includes('应发') || headerLower.includes('实发') || 
                            headerLower.includes('合计') ? 'calculated' : 'base';

    const defaultTargetField = inferredCategory === 'earning' ? 
      `earnings_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
      inferredCategory === 'deduction' ? 
      `deductions_details.${header.toUpperCase().replace(/[^\w]/g, '_')}.amount` :
      inferredCategory === 'calculated' ? '__CALCULATED_FIELD__' :
      `__UNMAPPED_${header.toUpperCase().replace(/[^\w]/g, '_')}__`;

    return {
      sourceField: header,
      targetField: defaultTargetField,
      confidence: 0.40,
      category: inferredCategory,
      required: false
    };
  });

  console.log('✅ 动态字段映射生成完成:', {
    totalRules: mappingRules.length,
    highConfidence: mappingRules.filter(r => r.confidence >= 0.8).length,
    mediumConfidence: mappingRules.filter(r => r.confidence >= 0.6 && r.confidence < 0.8).length,
    lowConfidence: mappingRules.filter(r => r.confidence < 0.6).length,
    mappingsByCategory: mappingRules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  return mappingRules;
};

/**
 * 根据薪资组件定义生成选择器选项
 * @param components 薪资组件定义列表
 * @returns 分组的选择器选项
 */
export const generateComponentSelectOptions = (components: PayrollComponentDefinition[]) => {
  const optionGroups: Record<string, Array<{ value: string; label: string; component: PayrollComponentDefinition }>> = {
    base: [],
    earning: [],
    deduction: [],
    calculated: [],
    stat: [],
    special: []
  };

  // 基础字段选项（固定）
  optionGroups.base = [
    { value: 'employee_full_name', label: '员工姓名', component: null as any },
    { value: 'employee_code', label: '员工工号', component: null as any },
    { value: 'department', label: '部门', component: null as any },
    { value: 'id_number', label: '身份证号码', component: null as any },
    { value: 'employee_category', label: '人员身份', component: null as any },
    { value: 'job_level', label: '人员职级', component: null as any }
  ];

  // 动态生成组件选项
  components.forEach(component => {
    let targetGroup: string;
    let targetField: string;

    switch (component.type) {
      case 'EARNING':
        targetGroup = 'earning';
        targetField = `earnings_details.${component.code}.amount`;
        break;
      case 'PERSONAL_DEDUCTION':
      case 'DEDUCTION':
        targetGroup = 'deduction';
        targetField = `deductions_details.${component.code}.amount`;
        break;
      case 'EMPLOYER_DEDUCTION':
        targetGroup = 'deduction';
        targetField = `deductions_details.${component.code}.amount`;
        break;
      // case 'CALCULATION_RESULT':
      //   targetGroup = 'calculated';
      //   targetField = `calculation_results.${component.code}.amount`;
      //   break;
      case 'STAT':
        targetGroup = 'stat';
        targetField = `stats.${component.code}.amount`;
        break;
      default:
        targetGroup = 'special';
        targetField = `other_fields.${component.code}`;
    }

    optionGroups[targetGroup].push({
      value: targetField,
      label: component.name,
      component
    });
  });

  // 特殊字段选项（固定）
  optionGroups.special.push(
    { value: '__CALCULATED_FIELD__', label: '【计算字段】由系统自动计算', component: null as any },
    { value: '__SOCIAL_INSURANCE_GROUP__', label: '【社保组合】建议拆分为具体险种', component: null as any },
    { value: '__IGNORE_FIELD__', label: '【忽略】不导入此字段', component: null as any },
    { value: '__ROW_NUMBER__', label: '【行号】用于标识记录序号', component: null as any },
    { value: '__UNMAPPED_FIELD__', label: '【未映射】需要手动指定目标字段', component: null as any }
  );

  // 按组件名称排序（display_order属性暂时不可用）
  Object.keys(optionGroups).forEach(groupKey => {
    optionGroups[groupKey].sort((a, b) => {
      if (!a.component || !b.component) return 0;
      return a.component.name.localeCompare(b.component.name);
    });
  });

  return optionGroups;
};

/**
 * 获取薪资数据 - 用于 PayrollDataModal
 * @param filters 筛选参数
 * @returns 薪资数据响应
 */
export const getPayrollData = async (filters: {
  periodId?: string;
  departmentId?: string;
  employeeId?: string;
  page?: number;
  size?: number;
  [key: string]: any;
}) => {
  try {
    console.log('🔄 [getPayrollData] 开始获取薪资数据', { filters });
    
    // 构建查询参数
    const params = new URLSearchParams();
    if (filters.size) params.append('limit', filters.size.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.departmentId) params.append('department_id', filters.departmentId);
    if (filters.employeeId) params.append('employee_id', filters.employeeId);
    
    // 使用现有的批量模态框API
    const periodId = filters.periodId || filters.period_id;
    if (!periodId) {
      throw new Error('Period ID is required');
    }
    
    const url = `/reports/payroll-modal/period/${periodId}?${params.toString()}`;
    const response = await apiClient.get(url);
    
    console.log('✅ [getPayrollData] API响应成功', {
      dataLength: response.data?.length || 0,
      url
    });
    
    // 转换数据格式以匹配 React Query Hook 的期望
    const modalDataList = response.data || [];
    const transformedData = modalDataList.map((modalData: any, index: number) => ({
      id: modalData.薪资条目id || index,
      key: modalData.薪资条目id || `row-${index}`,
      薪资条目id: modalData.薪资条目id,
      员工编号: modalData.基础信息?.员工编号,
      员工姓名: modalData.基础信息?.员工姓名,
      部门名称: modalData.基础信息?.部门名称,
      职位名称: modalData.基础信息?.职位名称,
      人员类别: modalData.基础信息?.人员类别,
      编制: modalData.基础信息?.编制,
      薪资期间名称: modalData.基础信息?.薪资期间名称,
      应发合计: modalData.汇总信息?.应发合计,
      扣除合计: modalData.汇总信息?.扣除合计,
      实发合计: modalData.汇总信息?.实发合计,
      // 添加应发明细
      ...modalData.应发明细,
      // 添加扣除明细
      ...modalData.扣除明细?.个人扣缴项目,
      ...modalData.扣除明细?.单位扣缴项目,
      // 添加计算参数
      ...modalData.计算参数
    }));
    
    return {
      data: transformedData,
      total: transformedData.length,
      page: filters.page || 1,
      size: filters.size || 100,
    };
  } catch (error: any) {
    console.error('❌ [getPayrollData] 获取薪资数据失败', error);
    throw error;
  }
}; 