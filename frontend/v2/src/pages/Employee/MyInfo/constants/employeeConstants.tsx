/**
 * 员工个人信息页面相关常量
 */
import React from 'react';
import { 
  UserOutlined, 
  PhoneOutlined, 
  ContactsOutlined, 
  BookOutlined 
} from '@ant-design/icons';
import type { FormStepConfig } from '../types/employee';

// 表单步骤配置
export const FORM_STEPS: FormStepConfig[] = [
  {
    key: 'basic',
    title: 'personal.editForm.steps.basic.title',
    description: 'personal.editForm.steps.basic.description',
    icon: <UserOutlined />,
  },
  {
    key: 'contact',
    title: 'personal.editForm.steps.contact.title', 
    description: 'personal.editForm.steps.contact.description',
    icon: <PhoneOutlined />,
  },
  {
    key: 'work',
    title: 'personal.editForm.steps.work.title',
    description: 'personal.editForm.steps.work.description', 
    icon: <ContactsOutlined />,
  },
  {
    key: 'education',
    title: 'personal.editForm.steps.education.title',
    description: 'personal.editForm.steps.education.description',
    icon: <BookOutlined />,
  },
];

// 字段分组配置
export const FIELD_GROUPS = {
  BASIC: [
    'first_name',
    'last_name', 
    'date_of_birth',
    'gender_lookup_value_id',
    'id_number',
    'nationality',
    'ethnicity',
  ],
  CONTACT: [
    'email',
    'phone_number',
    'home_address', 
    'emergency_contact_name',
    'emergency_contact_phone',
  ],
  WORK: [
    'department_id',
    'personnel_category_id',
    'actual_position_id',
    'employment_type_lookup_value_id',
    'job_position_level_lookup_value_id',
    'hire_date',
    'first_work_date',
    'current_position_start_date',
    'career_position_level_date',
    'interrupted_service_years',
  ],
  EDUCATION: [
    'education_level_lookup_value_id',
    'marital_status_lookup_value_id',
    'political_status_lookup_value_id',
  ],
  SALARY: [
    'salary_level_lookup_value_id',
    'salary_grade_lookup_value_id',
    'ref_salary_level_lookup_value_id',
    'social_security_client_number',
  ],
} as const;

// 只读字段（不允许编辑）
export const READONLY_FIELDS = [
  'employee_code',
  'created_at',
  'updated_at',
  'id',
] as const;

// 必填字段
export const REQUIRED_FIELDS = [
  'first_name',
  'last_name',
  'hire_date',
] as const;

// 敏感信息字段（需要脱敏显示）
export const SENSITIVE_FIELDS = {
  ID_NUMBER: 'id_number',
  PHONE_NUMBER: 'phone_number',
  SOCIAL_SECURITY_CLIENT_NUMBER: 'social_security_client_number',
} as const;

// 查询键
export const QUERY_KEYS = {
  MY_INFO: 'my-employee-info',
  LOOKUPS: 'employee-lookups',
} as const;

// 缓存时间配置（毫秒）
export const CACHE_TIME = {
  MY_INFO: 10 * 60 * 1000, // 10分钟
  LOOKUPS: 30 * 60 * 1000, // 30分钟
} as const;

// 默认头像
export const DEFAULT_AVATAR = '/assets/images/default-avatar.png';

// 表单布局配置
export const FORM_LAYOUT = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

// 表单项布局配置
export const FORM_ITEM_LAYOUT = {
  small: { span: 12 },
  medium: { span: 16 },
  large: { span: 24 },
};

// 响应式断点
export const BREAKPOINTS = {
  xs: 480,
  sm: 576, 
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

// 卡片最小高度
export const CARD_MIN_HEIGHT = 400;

// 表单验证消息模板
export const VALIDATION_MESSAGES = {
  required: 'personal.validation.required',
  email: 'personal.validation.email',
  phone: 'personal.validation.phone',
  idNumber: 'personal.validation.idNumber',
  date: 'personal.validation.date',
  maxLength: 'personal.validation.maxLength',
  minLength: 'personal.validation.minLength',
} as const;

// 表单步骤
export const FORM_STEPS_CONST = {
  BASIC: 'basic',
  CONTACT: 'contact', 
  WORK: 'work',
  EDUCATION: 'education',
} as const;

// 默认页面大小
export const DEFAULT_PAGE_SIZE = 20; 