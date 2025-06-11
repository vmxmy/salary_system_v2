/**
 * 员工信息表单验证规则
 */
import type { Rule } from 'antd/es/form';
import { REQUIRED_FIELDS, VALIDATION_MESSAGES } from '../constants/employeeConstants.tsx';

/**
 * 创建必填验证规则
 * @param fieldName 字段名
 * @param customMessage 自定义错误消息
 * @returns 验证规则
 */
export const createRequiredRule = (fieldName?: string, customMessage?: string): Rule => ({
  required: true,
  message: customMessage || VALIDATION_MESSAGES.required,
});

/**
 * 邮箱验证规则
 */
export const emailRule: Rule = {
  type: 'email',
  message: VALIDATION_MESSAGES.email,
};

/**
 * 手机号验证规则
 */
export const phoneRule: Rule = {
  pattern: /^1[3-9]\d{9}$/,
  message: VALIDATION_MESSAGES.phone,
};

/**
 * 身份证号验证规则
 */
export const idNumberRule: Rule = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    
    // 18位身份证正则
    const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    
    if (idCardRegex.test(value)) {
      return Promise.resolve();
    }
    
    return Promise.reject(new Error(VALIDATION_MESSAGES.idNumber));
  },
};

/**
 * 日期验证规则
 * @param required 是否必填
 * @returns 验证规则数组
 */
export const createDateRules = (required = false): Rule[] => {
  const rules: Rule[] = [];
  
  if (required) {
    rules.push(createRequiredRule());
  }
  
  rules.push({
    validator: (_, value) => {
      if (!value) return Promise.resolve();
      
      // 检查日期是否有效
      if (value && value.isValid && !value.isValid()) {
        return Promise.reject(new Error(VALIDATION_MESSAGES.date));
      }
      
      return Promise.resolve();
    },
  });
  
  return rules;
};

/**
 * 长度验证规则
 * @param min 最小长度
 * @param max 最大长度
 * @returns 验证规则
 */
export const createLengthRule = (min?: number, max?: number): Rule => ({
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    
    const length = String(value).length;
    
    if (min && length < min) {
      return Promise.reject(new Error(`${VALIDATION_MESSAGES.minLength}: ${min}`));
    }
    
    if (max && length > max) {
      return Promise.reject(new Error(`${VALIDATION_MESSAGES.maxLength}: ${max}`));
    }
    
    return Promise.resolve();
  },
});

/**
 * 数字范围验证规则
 * @param min 最小值
 * @param max 最大值
 * @returns 验证规则
 */
export const createNumberRangeRule = (min?: number, max?: number): Rule => ({
  validator: (_, value) => {
    if (value === null || value === undefined || value === '') {
      return Promise.resolve();
    }
    
    const num = Number(value);
    
    if (isNaN(num)) {
      return Promise.reject(new Error('请输入有效的数字'));
    }
    
    if (min !== undefined && num < min) {
      return Promise.reject(new Error(`数值不能小于 ${min}`));
    }
    
    if (max !== undefined && num > max) {
      return Promise.reject(new Error(`数值不能大于 ${max}`));
    }
    
    return Promise.resolve();
  },
});

/**
 * 社保客户号验证规则
 */
export const socialSecurityRule: Rule = {
  pattern: /^\d{10,20}$/,
  message: '社保客户号应为10-20位数字',
};

/**
 * 工作年限验证规则
 */
export const workYearsRule: Rule = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    
    const years = Number(value);
    
    if (isNaN(years)) {
      return Promise.reject(new Error('请输入有效的年数'));
    }
    
    if (years < 0) {
      return Promise.reject(new Error('工作年限不能为负数'));
    }
    
    if (years > 50) {
      return Promise.reject(new Error('工作年限不能超过50年'));
    }
    
    return Promise.resolve();
  },
};

/**
 * 获取字段验证规则
 * @param fieldName 字段名
 * @returns 验证规则数组
 */
export const getFieldRules = (fieldName: string): Rule[] => {
  const rules: Rule[] = [];
  
  // 检查是否为必填字段
  if (REQUIRED_FIELDS.includes(fieldName as any)) {
    rules.push(createRequiredRule());
  }
  
  // 根据字段名添加特定验证规则
  switch (fieldName) {
    case 'email':
      rules.push(emailRule);
      break;
      
    case 'phone_number':
    case 'emergency_contact_phone':
      rules.push(phoneRule);
      break;
      
    case 'id_number':
      rules.push(idNumberRule);
      break;
      
    case 'social_security_client_number':
      rules.push(socialSecurityRule);
      break;
      
    case 'interrupted_service_years':
      rules.push(workYearsRule);
      break;
      
    case 'first_name':
    case 'last_name':
      rules.push(createLengthRule(1, 50));
      break;
      
    case 'nationality':
    case 'ethnicity':
      rules.push(createLengthRule(undefined, 50));
      break;
      
    case 'home_address':
      rules.push(createLengthRule(undefined, 500));
      break;
      
    case 'emergency_contact_name':
      rules.push(createLengthRule(undefined, 100));
      break;
      
    case 'date_of_birth':
    case 'hire_date':
    case 'first_work_date':
    case 'current_position_start_date':
    case 'career_position_level_date':
      rules.push(...createDateRules(REQUIRED_FIELDS.includes(fieldName as any)));
      break;
  }
  
  return rules;
};

/**
 * 验证出生日期是否合理
 * @param birthDate 出生日期
 * @returns 验证结果
 */
export const validateBirthDate = (birthDate: any): Promise<void> => {
  if (!birthDate) return Promise.resolve();
  
  const birth = birthDate.valueOf ? birthDate.valueOf() : new Date(birthDate).getTime();
  const now = new Date().getTime();
  const minAge = 16; // 最小年龄
  const maxAge = 100; // 最大年龄
  
  const ageInYears = (now - birth) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (ageInYears < minAge) {
    return Promise.reject(new Error(`年龄不能小于${minAge}岁`));
  }
  
  if (ageInYears > maxAge) {
    return Promise.reject(new Error(`年龄不能大于${maxAge}岁`));
  }
  
  return Promise.resolve();
};

/**
 * 验证入职日期是否合理
 * @param hireDate 入职日期
 * @param birthDate 出生日期（可选）
 * @returns 验证结果
 */
export const validateHireDate = (hireDate: any, birthDate?: any): Promise<void> => {
  if (!hireDate) return Promise.resolve();
  
  const hire = hireDate.valueOf ? hireDate.valueOf() : new Date(hireDate).getTime();
  const now = new Date().getTime();
  
  // 入职日期不能晚于当前日期
  if (hire > now) {
    return Promise.reject(new Error('入职日期不能晚于当前日期'));
  }
  
  // 如果有出生日期，检查入职时年龄是否合理
  if (birthDate) {
    const birth = birthDate.valueOf ? birthDate.valueOf() : new Date(birthDate).getTime();
    const ageAtHire = (hire - birth) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (ageAtHire < 16) {
      return Promise.reject(new Error('入职时年龄不能小于16岁'));
    }
  }
  
  return Promise.resolve();
}; 