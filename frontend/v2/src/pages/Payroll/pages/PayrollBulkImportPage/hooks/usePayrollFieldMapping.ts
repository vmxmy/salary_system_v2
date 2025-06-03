import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PayrollComponentDefinition } from '../../../types/payrollTypes';
import { isEarningComponentType, isDeductionComponentType } from '../../../../../utils/payrollUtils';

export interface PayrollApiField {
  key: string;
  label: string;
  required: boolean;
  category: 'base' | 'earning' | 'deduction' | 'calculated' | 'ignore';
  description?: string;
}

export interface FieldMappingRule {
  sourceField: string;
  targetField: string;
  confidence: number; // 0-1, 映射置信度
  category: 'base' | 'earning' | 'deduction' | 'calculated' | 'ignore';
  reason: string; // 映射原因说明
}

/**
 * 智能字段映射Hook
 * 解决硬编码和统计字段冲突问题
 */
export const usePayrollFieldMapping = (componentDefinitions: PayrollComponentDefinition[]) => {
  const { t } = useTranslation(['payroll', 'common']);

  // 动态生成API字段列表 - 过滤掉统计字段
  const payrollApiFields = useMemo(() => {
    // 基础字段映射
    const baseFields: PayrollApiField[] = [
      { 
        key: 'employee_code', 
        label: t('batch_import.fields.employee_code'), 
        required: false,
        category: 'base',
        description: '员工编号用于匹配员工身份'
      },
      { 
        key: 'employee_full_name', 
        label: t('batch_import.fields.employee_full_name'), 
        required: true,
        category: 'base',
        description: '员工姓名，必填字段'
      },
      { 
        key: 'id_number', 
        label: t('batch_import.fields.id_number'), 
        required: true,
        category: 'base',
        description: '身份证号，用于员工身份验证'
      },
      { 
        key: 'gross_pay', 
        label: t('batch_import.fields.gross_pay'), 
        required: true,
        category: 'calculated',
        description: '应发工资总额，通常由系统计算'
      },
      { 
        key: 'net_pay', 
        label: t('batch_import.fields.net_pay'), 
        required: true,
        category: 'calculated',
        description: '实发工资，通常由系统计算'
      },
      { 
        key: 'total_deductions', 
        label: t('batch_import.fields.total_deductions'), 
        required: false,
        category: 'calculated',
        description: '扣除总额，通常由系统计算'
      },
      { 
        key: 'remarks', 
        label: t('batch_import.fields.remarks'), 
        required: false,
        category: 'base',
        description: '备注信息'
      },
    ];
    
    // 动态添加收入字段 - 排除STAT和计算类型
    const earningFields = componentDefinitions
      .filter(comp => {
        // 只包含真正的收入组件，排除统计和计算结果
        return isEarningComponentType(comp.type) &&
               comp.type !== 'STAT' &&
               !comp.calculation_logic; // 排除标记为计算字段的组件 (有计算逻辑则认为是计算字段)
      })
      .map(comp => ({
        key: `earnings_details.${comp.code}.amount`,
        label: comp.name,
        required: false,
        category: 'earning' as const,
        description: `收入项：${comp.description || comp.name}`
      }));
    
    // 动态添加扣除字段 - 只包含手动输入的扣除项
    const deductionFields = componentDefinitions
      .filter(comp => {
        return isDeductionComponentType(comp.type) &&
               !comp.calculation_logic; // 排除自动计算的扣除项（如社保、税收）(有计算逻辑则认为是计算字段)
      })
      .map(comp => ({
        key: `deductions_details.${comp.code}.amount`,
        label: comp.name,
        required: false,
        category: 'deduction' as const,
        description: `扣除项：${comp.description || comp.name}`
      }));

    return [...baseFields, ...earningFields, ...deductionFields];
  }, [componentDefinitions, t]);

  // 智能字段映射规则生成器
  const generateIntelligentMapping = useMemo(() => {
    return (sourceFields: string[]): FieldMappingRule[] => {
      const mappingRules: FieldMappingRule[] = [];
      
      for (const sourceField of sourceFields) {
        const rule = analyzeFieldSemantics(sourceField, payrollApiFields, componentDefinitions);
        mappingRules.push(rule);
      }
      
      return mappingRules.sort((a, b) => b.confidence - a.confidence);
    };
  }, [payrollApiFields, componentDefinitions]);

  return {
    payrollApiFields,
    generateIntelligentMapping
  };
};

/**
 * 智能字段语义分析
 * 基于字段名称、上下文和组件定义进行智能映射
 */
function analyzeFieldSemantics(
  sourceField: string, 
  apiFields: PayrollApiField[], 
  componentDefinitions: PayrollComponentDefinition[]
): FieldMappingRule {
  const fieldLower = sourceField.toLowerCase().trim();
  
  // 1. 直接匹配 - 最高优先级
  const exactMatch = findExactMatch(fieldLower, apiFields);
  if (exactMatch) {
    return {
      sourceField,
      targetField: exactMatch.key,
      confidence: 0.95,
      category: exactMatch.category,
      reason: '字段名称精确匹配'
    };
  }

  // 2. 语义分析 - 基于关键词匹配
  const semanticMatch = analyzeFieldKeywords(fieldLower, apiFields, componentDefinitions);
  if (semanticMatch) {
    return semanticMatch;
  }

  // 3. 默认忽略规则
  return {
    sourceField,
    targetField: '__IGNORE_FIELD__',
    confidence: 0.1,
    category: 'ignore',
    reason: '无法识别的字段类型，建议手动映射'
  };
}

/**
 * 精确匹配查找
 */
function findExactMatch(fieldLower: string, apiFields: PayrollApiField[]): PayrollApiField | null {
  // 直接名称匹配
  for (const field of apiFields) {
    if (field.label.toLowerCase() === fieldLower) {
      return field;
    }
  }
  
  // 组件代码匹配（从key中提取）
  for (const field of apiFields) {
    const codeMatch = field.key.match(/\.([A-Z_]+)\./);
    if (codeMatch && fieldLower.includes(codeMatch[1].toLowerCase())) {
      return field;
    }
  }
  
  return null;
}

/**
 * 关键词语义分析
 */
function analyzeFieldKeywords(
  fieldLower: string, 
  apiFields: PayrollApiField[], 
  componentDefinitions: PayrollComponentDefinition[]
): FieldMappingRule | null {
  
  // 基础字段关键词映射
  const baseFieldKeywords = {
    'employee_code': ['人员编号', '员工编号', '工号', '编号'],
    'employee_full_name': ['姓名', '人员姓名', '员工姓名', '名字'],
    'id_number': ['身份证', '身份证号', '证件号'],
    'remarks': ['备注', '说明', '描述']
  };

  // 检查基础字段
  for (const [targetKey, keywords] of Object.entries(baseFieldKeywords)) {
    if (keywords.some(keyword => fieldLower.includes(keyword))) {
      const apiField = apiFields.find(f => f.key === targetKey);
      if (apiField) {
        return {
          sourceField: fieldLower,
          targetField: targetKey,
          confidence: 0.8,
          category: apiField.category,
          reason: `关键词匹配: ${keywords.find(k => fieldLower.includes(k))}`
        };
      }
    }
  }

  // 计算字段识别 - 这些字段通常应该被标记为计算字段或忽略
  const calculatedKeywords = [
    '应发', '实发', '合计', '总计', '总额', '统计', '汇总', 
    '全年', '年度', '累计', '小计'
  ];
  
  if (calculatedKeywords.some(keyword => fieldLower.includes(keyword))) {
    // 如果是明显的统计/计算字段，建议忽略或映射到计算字段
    if (fieldLower.includes('应发')) {
      return {
        sourceField: fieldLower,
        targetField: 'gross_pay',
        confidence: 0.7,
        category: 'calculated',
        reason: '识别为应发工资（通常由系统计算）'
      };
    } else if (fieldLower.includes('实发')) {
      return {
        sourceField: fieldLower,
        targetField: 'net_pay',
        confidence: 0.7,
        category: 'calculated',
        reason: '识别为实发工资（通常由系统计算）'
      };
    } else {
      return {
        sourceField: fieldLower,
        targetField: '__IGNORE_FIELD__',
        confidence: 0.6,
        category: 'ignore',
        reason: '识别为统计字段，建议忽略以避免计算冲突'
      };
    }
  }

  // 扣除字段识别
  const deductionKeywords = [
    '扣', '保险', '公积金', '税', '罚', '减'
  ];
  
  if (deductionKeywords.some(keyword => fieldLower.includes(keyword))) {
    // 社保类字段通常是自动计算的，建议忽略
    const socialInsuranceKeywords = ['养老', '医疗', '失业', '工伤', '生育', '公积金'];
    if (socialInsuranceKeywords.some(keyword => fieldLower.includes(keyword))) {
      return {
        sourceField: fieldLower,
        targetField: '__IGNORE_FIELD__',
        confidence: 0.8,
        category: 'ignore',
        reason: '社保扣除项通常由系统自动计算，建议忽略'
      };
    }
  }

  // 组件名称匹配
  for (const comp of componentDefinitions) {
    if (fieldLower.includes(comp.name.toLowerCase()) || 
        (comp.description && fieldLower.includes(comp.description.toLowerCase()))) {
      
      // 根据组件类型确定分类
      let category: 'earning' | 'deduction' | 'ignore';
      let confidence = 0.75;
      let reason = `匹配到组件: ${comp.name}`;
      
      if (comp.type === 'STAT' || comp.calculation_logic) {
        category = 'ignore';
        reason += '（统计/计算字段，建议忽略）';
        confidence = 0.9;
      } else if (isEarningComponentType(comp.type)) {
        category = 'earning';
      } else if (isDeductionComponentType(comp.type)) {
        category = 'deduction';
      } else {
        category = 'ignore';
        reason += '（未知类型，建议忽略）';
      }
      
      return {
        sourceField: fieldLower,
        targetField: category === 'ignore' ? '__IGNORE_FIELD__' : `${category === 'earning' ? 'earnings' : 'deductions'}_details.${comp.code}.amount`,
        confidence,
        category,
        reason
      };
    }
  }

  return null;
} 