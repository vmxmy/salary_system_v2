// src/api/types.ts

// 通用 API 响应结构
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    size?: number;
    totalPages?: number;
    total?: number;
  };
}

// 通用 API 错误响应结构 (基于 v2 API 文档)
export interface ApiErrorResponse {
  error?: { // 单个错误对象的情况
    code: number;
    message: string;
    details?: string;
    errors?: Array<{ field: string; message: string }>;
  };
  errors?: Array<{ // 多个错误对象的情况
    code: string; // 例如 "VALIDATION_ERROR"
    message: string;
    field?: string;
    details?: string;
  }>;
}

// 用户登录响应 (根据 /v2/token 的典型行为)
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number; // 可选
  // user?: User; // 实际响应中不包含 user 对象，已移除
  user_id?: number; // 新增：用户的数字ID (如果后端在 /token 响应中提供)
  username?: string; // 新增：用户名 (如果后端在 /token 响应中提供)
  role?: string; // 新增：用户角色 (如果后端在 /token 响应中提供)
}

// 用户基本信息 (根据 /v2/users 端点和安全资源定义)
export interface User {
  id: string | number; // 假设有 id
  username: string;
  email?: string; // 可选
  is_active?: boolean; // 可选
  roles?: Role[]; // 假设用户关联角色
  permissions?: string[]; // 或者直接关联权限字符串列表
  // 其他员工相关信息可能来自 Employee 类型
  employee_id?: string | number; // 如果用户关联到员工
}

// 角色信息 (根据 /v2/roles 端点)
export interface Role {
  id: string | number;
  name: string;
  code?: string; // 角色代码，如 'admin', 'hr'
  permissions?: Permission[]; // 假设角色关联权限对象
}

// 权限信息 (根据 /v2/permissions 端点)
export interface Permission {
  id: string | number;
  name: string; // 例如 "查看员工列表"
  code?: string; // 权限代码，如 'employee:list', 'employee:create'
}

// 员工信息 (根据 /v2/employees 端点)
export interface Employee {
  id: string | number; // 通常是 employeeId
  employee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  hire_date?: string; // ISO Date string
  job_title_id?: number;
  department_id?: number;
  // ... 其他根据 API 文档和数据库结构定义的字段
  // 例如:
  // job_title?: JobTitle; // 如果 API 会嵌套返回
  // department?: Department; // 如果 API 会嵌套返回
}

// 部门信息 (根据 /v2/departments 端点)
export interface Department {
  id: string | number; // departmentId
  name: string;
  parent_id?: number | null;
  // ...
}

// 职位信息 (根据 /v2/job-titles 端点)
export interface JobTitle {
  id: string | number; // jobTitleId
  name: string;
  description?: string;
  // ...
}

// 查找类型 (根据 /v2/config/lookup-types)
export interface LookupType {
  id: string | number; // typeId
  type_code: string;
  type_name: string;
  description?: string;
}

// 查找值 (根据 /v2/config/lookup-values)
export interface LookupValue {
  id: string | number; // valueId
  lookup_type_id: number;
  value_code: string;
  value_name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  // lookup_type?: LookupType; // 如果 API 嵌套返回
}

// 可以继续添加其他 API 资源对应的类型... 