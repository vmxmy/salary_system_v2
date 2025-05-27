/**
 * 薪资相关工具函数
 */

/**
 * 智能判断组件是否为收入类型
 * @param type 组件类型
 * @returns 是否为收入类型
 */
export const isEarningComponentType = (type: string): boolean => {
  if (!type) return false;
  
  const lowerType = type.toLowerCase();
  return lowerType === 'earning' || 
         lowerType.includes('earning') || 
         lowerType === 'benefit';
  // 移除 STAT 类型的判断，因为 STAT 类型应该是统计字段，不是收入项
};

/**
 * 智能判断组件是否为扣除类型
 * @param type 组件类型
 * @returns 是否为扣除类型
 */
export const isDeductionComponentType = (type: string): boolean => {
  if (!type) return false;
  
  const lowerType = type.toLowerCase();
  return lowerType === 'deduction' || 
         lowerType.includes('deduction') || 
         lowerType.includes('tax') || 
         lowerType === 'calculation_base' ||
         lowerType === 'calculation_rate' ||
         lowerType === 'calculation_result';
};

/**
 * 获取组件类型显示的标签颜色
 * @param type 组件类型
 * @returns 颜色代码
 */
export const getComponentTypeColor = (type: string): string => {
  if (!type) return 'default';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType === 'earning') {
    return 'green';
  } else if (lowerType.includes('tax')) {
    return 'red';
  } else if (lowerType.includes('personal_deduction')) {
    return 'orange';
  } else if (lowerType.includes('employer_deduction')) {
    return 'purple';
  } else if (lowerType.includes('calculation')) {
    return 'blue';
  } else if (lowerType === 'benefit') {
    return 'cyan';
  } else if (lowerType === 'stat' || lowerType === 'statutory') {
    return 'geekblue';
  } else if (lowerType === 'deduction') {
    return 'red';
  } else if (lowerType === 'other') {
    return 'default';
  }
  
  // 判断是否为收入或扣除类型，作为兜底方案
  if (isEarningComponentType(type)) {
    return 'green';
  } else if (isDeductionComponentType(type)) {
    return 'red';
  }
  
  return 'default';
};

/**
 * 获取组件分类（用于界面展示分组）
 * @param type 组件类型
 * @returns 分类标识
 */
export const getComponentCategory = (type: string): 'earnings' | 'deductions' | 'calculation' | 'other' => {
  if (!type) return 'other';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('calculation')) {
    return 'calculation';
  } else if (isEarningComponentType(type)) {
    return 'earnings';
  } else if (isDeductionComponentType(type)) {
    return 'deductions';
  }
  
  return 'other';
}; 