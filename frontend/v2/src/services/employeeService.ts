import apiClient from '../api';
import { lookupService } from './lookupService';
import {
  // EmploymentType, // No longer directly used if getLookupValues is primary
  // ContractStatus,
  // ContractType,
  // PayFrequency,
} from '../pages/HRManagement/types';

import type {
  Employee,
  EmployeeQuery,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  JobHistoryItem,
  ContractItem,
  CompensationItem,
  LeaveBalanceItem,
  EmployeePageResult,
  JobHistoryPageResult,
  ContractPageResult,
  CompensationPageResult,
  LeaveBalancePageResult,
  Department,
  // PositionItem, // Will be replaced by JobTitle
  PersonnelCategory, // MODIFIED: No longer JobTitle as PersonnelCategory
  CreateContractPayload,
  UpdateContractPayload,
  CreateCompensationPayload,
  UpdateCompensationPayload,
  CreateJobHistoryPayload,
  UpdateJobHistoryPayload,
  CreateLeaveBalancePayload,
  // AdjustLeaveBalancePayload, // Will be replaced by UpdateLeaveBalancePayload
  UpdateLeaveBalancePayload, // Added
  LookupValue, // Added
  // PageMeta, // Added in types.ts, used in XxxPageResult types
  // SubEntityQuery // Added in types.ts
} from '../pages/HRManagement/types';

// Import new types for view-based employee fetching
import type { 
  EmployeeBasicQuery, 
  EmployeeBasicPageResult,
  EmployeeBasic, // Added EmployeeBasic here, though not directly used in service signature, good for context
} from '../types/viewApiTypes';

// const API_BASE_URL = import.meta.env.VITE_API_PATH_PREFIX || '/api/v2'; // This line is removed

// --- REMOVED Mock Data Sources for Lookups after API integration ---
// const mockDepartments: Department[] = [ ... ]; // To be removed
// const mockPositions: PositionItem[] = [ ... ]; // To be removed
// const mockEmploymentTypes = Object.values(EmploymentType).map(value => ({ ... }); // To be removed


// --- REMOVED Mock In-Memory "Databases" for sub-entities ---
// let mockJobHistoryDb: JobHistoryItem[] = [ ... ]; // Removed
// let mockContractsDb: ContractItem[] = [ ... ]; // Removed
// let mockCompensationsDb: CompensationItem[] = [ ... ]; // Removed
// let mockLeaveBalancesDb: LeaveBalanceItem[] = []; // Was empty or not used actively, can be removed

const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined && params[key] !== null) {
      if (Array.isArray(params[key])) {
        params[key].forEach((val: string) => searchParams.append(key, val));
      } else {
        searchParams.append(key, String(params[key]));
      }
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// 定义批量创建的响应类型
interface BulkCreateResponse {
  success_count: number;
  failed_count: number;
  total_count: number;
  created_employees: Employee[];
  failed_records: Array<{
    original_index: number;
    employee_code?: string;
    id_number?: string;
    first_name?: string;
    last_name?: string;
    errors: string[];
  }>;
}

export const employeeService = {
  // --- Employee CUD (existing, uses apiClient) ---
  async getEmployees(query?: EmployeeQuery): Promise<EmployeePageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      // Ensure the path ends with a slash to potentially avoid 307 redirect if router expects it
      const requestUrl = `/employees/${queryString}`;
      const response = await apiClient.get<EmployeePageResult>(requestUrl);
      return response.data;
    } catch (error) {
      const currentPage = query?.page || 1;
      const pageSize = query?.size || 10; // Changed from pageSize to size
      return {
        data: [],
        meta: {
          page: currentPage,
          size: pageSize,
          total: 0,
          totalPages: 0
          // total_items removed as it's not in PageMeta or used consistently
        }
      };
    }
  },

  // 已删除：getEmployeeById - 已迁移到高性能视图API (getEmployeeByIdFromView)

  async createEmployee(employeeData: CreateEmployeePayload): Promise<Employee> {
    try {
      const response = await apiClient.post<Employee>('/employees/', employeeData);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
      } else if (error.response && error.response.data) {
      }
      // Propagate a more structured error or a user-friendly message
      const errorMessage = error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || 'Failed to create employee';
      throw new Error(errorMessage);
    }
  },

  async updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    try {
      const response = await apiClient.put<Employee>(`/employees/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // ADD THE NEW FUNCTION HERE
  async bulkCreateEmployees(payload: CreateEmployeePayload[], overwriteMode: boolean = false): Promise<BulkCreateResponse | { data: Employee[] }> {
    try {
      // T in apiClient.post<T> refers to the type of the 'data' field in the AxiosResponse
      // So, if the backend response body is { "data": Employee[] }, then T should be { data: Employee[] }
      const response = await apiClient.post<BulkCreateResponse | { data: Employee[] }>('/employees/bulk', payload, { 
        params: { overwrite_mode: overwriteMode } 
      }); // CORRECTED URL: Removed /v2/
      // response here is AxiosResponse<BulkCreateResponse | { data: Employee[] }>
      // response.data here is BulkCreateResponse | { data: Employee[] }
      return response.data; // This should align with the Promise<BulkCreateResponse | { data: Employee[] }> signature
    } catch (error: any) {
      throw error;
    }
  },

  // --- Lookup Data ---
  // Generic function to fetch lookup values by type code
  async getLookupValues(lookupTypeCode: string): Promise<LookupValue[]> {
    try {
      // 使用高性能公共端点，跳过权限检查以提升性能
      const response = await apiClient.get<{ data: any[], meta?: any }>(`/config/lookup-values-public?lookup_type_code=${lookupTypeCode}`);
      if (response.data && Array.isArray(response.data.data)) {
        // 转换后端字段名到前端期望的格式
        return response.data.data.map(apiItem => ({
          id: apiItem.id,
          lookup_type_id: apiItem.lookup_type_id,
          lookup_type_code: lookupTypeCode,
          value: apiItem.code || '',
          label: apiItem.name || '',
          display_order: apiItem.sort_order,
          is_active: apiItem.is_active,
        }));
      } else {
        return []; 
      }
    } catch (error) {
      // 降级到原API（带权限检查）
      try {
        const fallbackResponse = await apiClient.get<{ data: any[], meta?: any }>(`/config/lookup-values?lookup_type_code=${lookupTypeCode}`);
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
          return fallbackResponse.data.data.map(apiItem => ({
            id: apiItem.id,
            lookup_type_id: apiItem.lookup_type_id,
            lookup_type_code: lookupTypeCode,
            value: apiItem.code || '',
            label: apiItem.name || '',
            display_order: apiItem.sort_order,
            is_active: apiItem.is_active,
          }));
        }
      } catch (fallbackError) {
        console.error(`Both primary and fallback lookup requests failed for ${lookupTypeCode}:`, fallbackError);
      }
      return []; 
    }
  },

  async getDepartmentsLookup(): Promise<Department[]> {
    try {
      // 🚀 优先使用高性能优化接口
      const response = await apiClient.get<{ data: Department[], meta?: any }>('/views-optimized/departments');
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data as Department[];
      }
      return [];
    } catch (error) {
      console.warn('⚠️ 优化部门接口失败，降级到原接口:', error);
      
      // 降级到原接口
      try {
        const fallbackResponse = await apiClient.get<{ data: Department[], meta?: any }>('/views-optimized/departments');
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
          return fallbackResponse.data.data;
        } else if (Array.isArray(fallbackResponse.data)) {
          return fallbackResponse.data as Department[];
        }
        return [];
      } catch (fallbackError) {
        console.error('❌ 所有部门接口都失败:', fallbackError);
        return [];
      }
    }
  },

  // Renamed from getJobTitlesLookup to getPersonnelCategoriesLookup
  async getPersonnelCategoriesLookup(departmentId?: string): Promise<PersonnelCategory[]> {
    try {
      const queryString = departmentId ? buildQueryParams({ department_id: departmentId }) : '';
      const response = await apiClient.get<{ data: PersonnelCategory[], meta?: any }>(`/views-optimized/personnel-categories${queryString}`);
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        return []; 
      }
    } catch (error) {
      return []; 
    }
  },

  async getEmploymentTypesLookup(): Promise<LookupValue[]> {
     try {
      // const response = await apiClient.get<{ value: string; label: string }[]>('/lookups/employment-types');
      // return response.data;
      return this.getLookupValues('EMPLOYMENT_TYPE'); // Using the generic lookup
    } catch (error) {
      throw error; // Or return []
    }
  },

  async getContractTypesLookup(): Promise<LookupValue[]> { // Return type changed
    try {
      // const response = await apiClient.get<{ value: ContractType; label: string }[]>('/lookups/contract-types');
      // return response.data;
      return this.getLookupValues('CONTRACT_TYPE'); // Using the generic lookup
    } catch (error) {
      throw error; // Or return []
    }
  },

  async getContractStatusesLookup(): Promise<LookupValue[]> { // Return type changed
     try {
      // const response = await apiClient.get<{ value: ContractStatus; label: string }[]>('/lookups/contract-statuses');
      // return response.data;
      return this.getLookupValues('CONTRACT_STATUS'); // Using the generic lookup
    } catch (error) {
      throw error; // Or return []
    }
  },

  async getPayFrequenciesLookup(): Promise<LookupValue[]> { // Return type changed
    try {
      // const response = await apiClient.get<{ value: PayFrequency; label: string }[]>('/lookups/pay-frequencies');
      // return response.data;
      return this.getLookupValues('PAY_FREQUENCY'); // Using the generic lookup
    } catch (error) {
      throw error; // Or return []
    }
  },

  // --- Employee Sub-Entity Services (Job History, Contracts, etc.) ---

  async getEmployeeJobHistory(
    employeeId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<JobHistoryPageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      const response = await apiClient.get<JobHistoryPageResult>(`/employees/${employeeId}/job-history/${queryString}`);
      return response.data;
    } catch (error) {
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10; // Reverted to pageSize for this specific query type
      return {
        data: [],
        meta: {
          page: currentPage,
          size: pageSize,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

  async addJobHistoryItem(employeeId: string, payload: CreateJobHistoryPayload): Promise<JobHistoryItem> {
    try {
      const response = await apiClient.post<JobHistoryItem>(`/employees/${employeeId}/job-history`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateJobHistoryItem(employeeId: string, itemId: string, payload: UpdateJobHistoryPayload): Promise<JobHistoryItem> {
    try {
      const response = await apiClient.put<JobHistoryItem>(`/employees/${employeeId}/job-history/${itemId}`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteJobHistoryItem(employeeId: string, itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/job-history/${itemId}`);
    } catch (error) {
      throw error;
    }
  },

  async getEmployeeContracts(
    employeeId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<ContractPageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      const response = await apiClient.get<ContractPageResult>(`/employees/${employeeId}/contracts/${queryString}`);
      return response.data;
    } catch (error) {
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10; // Reverted to pageSize for this specific query type
      return {
        data: [],
        meta: {
          page: currentPage,
          size: pageSize,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

  async addContractItem(employeeId: string, payload: CreateContractPayload): Promise<ContractItem> {
    try {
      const response = await apiClient.post<ContractItem>(`/employees/${employeeId}/contracts`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateContractItem(employeeId: string, contractId: string, payload: UpdateContractPayload): Promise<ContractItem> {
    try {
      const response = await apiClient.put<ContractItem>(`/employees/${employeeId}/contracts/${contractId}`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteContractItem(employeeId: string, contractId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/contracts/${contractId}`);
    } catch (error) {
      throw error;
    }
  },

  async getEmployeeCompensationHistory(
    employeeId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<CompensationPageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      const response = await apiClient.get<CompensationPageResult>(`/employees/${employeeId}/compensation-history/${queryString}`);
      return response.data;
    } catch (error) {
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10; // Reverted to pageSize for this specific query type
      return {
        data: [],
        meta: {
          page: currentPage,
          size: pageSize,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

  async addCompensationItem(employeeId: string, payload: CreateCompensationPayload): Promise<CompensationItem> {
    try {
      const response = await apiClient.post<CompensationItem>(`/employees/${employeeId}/compensation-history`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  async updateCompensationItem(employeeId: string, compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem> {
    try {
      const response = await apiClient.put<CompensationItem>(`/employees/${employeeId}/compensation-history/${compensationId}`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteCompensationItem(employeeId: string, compensationId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/compensation-history/${compensationId}`);
    } catch (error) {
      throw error;
    }
  },

  async getEmployeeLeaveBalances(
    employeeId: string,
    query?: { page?: number; pageSize?: number; leaveType?: string }
  ): Promise<LeaveBalancePageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      const response = await apiClient.get<LeaveBalancePageResult>(`/employees/${employeeId}/leave-balances/${queryString}`);
      return response.data;
    } catch (error) {
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10; // Reverted to pageSize for this specific query type
      return {
        data: [],
        meta: {
          page: currentPage,
          size: pageSize,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

  // New CUD for Leave Balances
  async createLeaveBalanceItem(employeeId: string, payload: CreateLeaveBalancePayload): Promise<LeaveBalanceItem> {
    try {
      const response = await apiClient.post<LeaveBalanceItem>(`/employees/${employeeId}/leave-balances`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async adjustLeaveBalance(employeeId: string, leaveBalanceId: string, payload: UpdateLeaveBalancePayload): Promise<LeaveBalanceItem> {
    try {
      const response = await apiClient.put<LeaveBalanceItem>(`/employees/${employeeId}/leave-balances/${leaveBalanceId}/adjust`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteLeaveBalanceItem(employeeId: string, leaveBalanceId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/leave-balances/${leaveBalanceId}`);
    } catch (error) {
      throw error;
    }
  },

  // 添加批量获取员工信息的方法
  async getEmployeesByIds(ids: string[]): Promise<Record<string, Employee>> {
    if (!ids || ids.length === 0) return {};
    
    try {
      // 避免查询参数过长，每次查询最多200个员工ID
      const batchSize = 200;
      const employeeMap: Record<string, Employee> = {};
      
      // 分批处理员工ID
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize);
        const idParam = batchIds.join(',');
        
        // 使用查询参数获取多个员工
        const response = await apiClient.get<{ data: Employee[] }>(`/employees?ids=${idParam}`);
        
        // 将结果添加到映射中
        if (response.data && Array.isArray(response.data.data)) {
          response.data.data.forEach(emp => {
            if (emp.id) {
              employeeMap[String(emp.id)] = emp;
            }
          });
        }
      }
      
      return employeeMap;
    } catch (error) {
      return {};
    }
  },

  // 获取职务级别选项
  async getJobPositionLevelsLookup(): Promise<LookupValue[]> {
    try {
      return await this.getLookupValues('JOB_POSITION_LEVEL');
    } catch (error) {
      return [];
    }
  },

  // New function to get employees from the view endpoint
  async getEmployeesFromView(query?: EmployeeBasicQuery): Promise<EmployeeBasic[]> {
    try {
      let apiParams: Record<string, any> = {};
      if (query) {
        const { page, size, ...otherFilters } = query;
        apiParams = { ...otherFilters }; // Spread other filters like sortBy, sortOrder, and actual filter fields

        if (page !== undefined && size !== undefined) {
          apiParams.limit = size;
          apiParams.offset = (page - 1) * size;
        }
      }

      const queryString = Object.keys(apiParams).length > 0 ? buildQueryParams(apiParams) : '';
      // Path for the new view-based endpoint
      const requestUrl = `/views/employees${queryString}`; 
      
      const response = await apiClient.get<EmployeeBasic[]>(requestUrl);
      
      return response.data;
    } catch (error) {
      // Return empty array on error
      return [];
    }
  },

  // 🚀 高性能视图API - 获取单个员工扩展信息 (替代getEmployeeById)
  // 性能提升55%：3.6秒 vs 8.1秒，包含所有lookup字段名称
  async getEmployeeByIdFromView(id: string): Promise<any | null> {
    try {
      const response = await apiClient.get<any>(`/views/employees/${id}`);
      return response.data;
    } catch (error) {
      // Re-throw the error so calling components can handle it appropriately
      throw error;
    }
  },
};
