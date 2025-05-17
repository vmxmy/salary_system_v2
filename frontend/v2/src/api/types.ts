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
  user: User; // Contains the full User object with roles and permissions
  // expires_in?: number; // Kept as optional or remove if not sent
  // user_id, username, role (old fields) are now part of the nested user object
}

// 用户基本信息 (根据 /v2/users 端点和安全资源定义)
export interface User {
  id: number; // Changed from string | number
  username: string;
  employee_id?: number; // Changed from string | number
  is_active: boolean; // No longer optional, assuming backend provides it
  created_at: string; // Or Date, depending on how it's parsed. Kept as string for now.
  roles: Role[];
  // email and permissions (direct on user) are removed as per new backend model focused on User.roles -> Role.permissions
}

// 角色信息 (根据 /v2/roles 端点)
export interface Role {
  id: number; // Changed from string | number
  code: string; // e.g., "sys_admin", "hr_manager"
  name: string; // e.g., "System Administrator", "HR Manager"
  permissions: Permission[];
}

// 权限信息 (根据 /v2/permissions 端点)
export interface Permission {
  id: number; // Changed from string | number
  code: string; // e.g., "employee:create", "payroll:view_all"
  description?: string;
}

// Payload for creating a new permission
export interface CreatePermissionPayload {
  code: string;
  description?: string;
}

// Payload for updating an existing permission
export interface UpdatePermissionPayload {
  code?: string;
  description?: string;
}

// Payload for creating a new role
export interface CreateRolePayload {
  code: string;
  name: string;
  description?: string;
  permission_ids?: number[];
}

// Payload for updating an existing role
export interface UpdateRolePayload {
  code?: string;
  name?: string;
  description?: string;
  permission_ids?: number[];
}

// Payload for creating a new user
export interface CreateUserPayload {
  username: string;
  password: string;
  employee_first_name?: string;
  employee_last_name?: string;
  employee_id_card?: string;
  role_ids?: number[];
  is_active?: boolean; // Defaults to true on backend typically
}

// Payload for updating an existing user
export interface UpdateUserPayload {
  employee_first_name?: string;
  employee_last_name?: string;
  employee_id_card?: string;
  is_active?: boolean;
  role_ids?: number[]; // For updating roles directly, if supported/chosen over separate endpoint
  // password?: string; // Password changes should be a separate, secure flow (e.g., reset password)
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

// General Paginated Response Structure (Ensure this or similar exists)
export interface PaginatedMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

// Department Types
export interface Department {
  id: number;
  code: string;
  name: string;
  parent_department_id?: number | null;
  description?: string | null; // Ensure description is here
  effective_date: string;
  end_date?: string | null;
  is_active: boolean;
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  parent_department_id?: number | null;
  description?: string | null; // Add description here
  effective_date: string;
  end_date?: string | null;
  is_active?: boolean;
}

export interface UpdateDepartmentPayload extends Partial<CreateDepartmentPayload> {
  // id is not part of payload, it's a path parameter
  // description is inherited if added to CreateDepartmentPayload and this extends Partial of it.
}

export interface DepartmentListResponse extends PaginatedResponse<Department> {}

// JobTitle Types
export interface JobTitle {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parent_job_title_id?: number | null;
  effective_date: string; // Consider using Date type
  end_date?: string | null;   // Consider using Date type
  is_active: boolean;
}

export interface CreateJobTitlePayload {
  code: string;
  name: string;
  description?: string | null;
  parent_job_title_id?: number | null;
  effective_date: string;
  end_date?: string | null;
  is_active?: boolean;
}

export interface UpdateJobTitlePayload extends Partial<CreateJobTitlePayload> {}

export interface JobTitleListResponse extends PaginatedResponse<JobTitle> {}

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