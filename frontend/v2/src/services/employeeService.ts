import apiClient from '../api';
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

// const API_BASE_URL = import.meta.env.VITE_API_PATH_PREFIX || '/api/v2'; // This line is removed

// --- REMOVED Mock Data Sources for Lookups after API integration ---
// const mockDepartments: Department[] = [ ... ]; // To be removed
// const mockPositions: PositionItem[] = [ ... ]; // To be removed
// const mockEmploymentTypes = Object.values(EmploymentType).map(value => ({ ... })); // To be removed


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

export const employeeService = {
  // --- Employee CUD (existing, uses apiClient) ---
  async getEmployees(query?: EmployeeQuery): Promise<EmployeePageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      // Ensure the path ends with a slash to potentially avoid 307 redirect if router expects it
      const requestUrl = `/employees/${queryString}`;
      console.log('[employeeService] Requesting URL:', requestUrl); // Log the full request URL
      const response = await apiClient.get<EmployeePageResult>(requestUrl);
      console.log('[employeeService] Received response meta:', response.data.meta); // Log received meta
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
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

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const response = await apiClient.get<Employee>(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee with id ${id}:`, error);
      return null;
    }
  },

  async createEmployee(employeeData: CreateEmployeePayload): Promise<Employee> {
    try {
      const response = await apiClient.post<Employee>('/employees/', employeeData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating employee - Raw error:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        console.error('Error creating employee - Response data detail:', JSON.stringify(error.response.data.detail, null, 2));
      } else if (error.response && error.response.data) {
        console.error('Error creating employee - Response data:', error.response.data);
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
      console.error(`Error updating employee with id ${id}:`, error);
      throw error;
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch (error) {
      console.error(`Error deleting employee with id ${id}:`, error);
      throw error;
    }
  },

  // ADD THE NEW FUNCTION HERE
  async bulkCreateEmployees(payload: CreateEmployeePayload[], overwriteMode: boolean = false): Promise<{ data: Employee[] }> { // Assuming Employee[] is the expected return type for created employees
    try {
      // T in apiClient.post<T> refers to the type of the 'data' field in the AxiosResponse
      // So, if the backend response body is { "data": Employee[] }, then T should be { data: Employee[] }
      const response = await apiClient.post<{ data: Employee[] }>('/employees/bulk', payload, { 
        params: { overwrite_mode: overwriteMode } 
      }); // CORRECTED URL: Removed /v2/
      // response here is AxiosResponse<{ data: Employee[] }>
      // response.data here is { data: Employee[] }
      return response.data; // This should align with the Promise<{ data: Employee[] }> signature
    } catch (error: any) {
      console.error('Error bulk creating employees:', error);
      console.error('Error bulk creating employees - Response data:', error.response?.data);
      throw error;
    }
  },

  // --- Lookup Data ---
  // Generic function to fetch lookup values by type code
  async getLookupValues(lookupTypeCode: string): Promise<LookupValue[]> {
    try {
      // Expect a paginated-like response structure
      const response = await apiClient.get<{ data: LookupValue[], meta?: any }>(`/lookup/values?type_code=${lookupTypeCode}`);
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.warn(`Lookup data array for type_code ${lookupTypeCode} not found or not an array in response:`, response.data);
        return []; 
      }
    } catch (error) {
      console.error(`Error fetching lookup values for type_code ${lookupTypeCode}:`, error);
      return []; 
    }
  },

  async getDepartmentsLookup(): Promise<Department[]> {
    try {
      const response = await apiClient.get<{ data: Department[], meta?: any }>('/departments');
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data as Department[];
      }
      console.warn('Departments lookup data array not found or not an array in response:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching departments lookup:', error);
      return [];
    }
  },

  // Renamed from getJobTitlesLookup to getPersonnelCategoriesLookup
  async getPersonnelCategoriesLookup(departmentId?: string): Promise<PersonnelCategory[]> {
    try {
      const queryString = departmentId ? buildQueryParams({ department_id: departmentId }) : '';
      const response = await apiClient.get<{ data: PersonnelCategory[], meta?: any }>(`/personnel-categories${queryString}`);
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.warn('Personnel Categories lookup data array not found or not an array in response:', response.data);
        return []; 
      }
    } catch (error) {
      console.error('Error fetching personnel categories lookup:', error);
      return []; 
    }
  },

  async getEmploymentTypesLookup(): Promise<LookupValue[]> {
     try {
      // const response = await apiClient.get<{ value: string; label: string }[]>('/lookups/employment-types');
      // return response.data;
      return this.getLookupValues('EMPLOYMENT_TYPE'); // Using the generic lookup
    } catch (error) {
      console.error('Error fetching employment types lookup:', error);
      throw error; // Or return []
    }
  },

  async getContractTypesLookup(): Promise<LookupValue[]> { // Return type changed
    try {
      // const response = await apiClient.get<{ value: ContractType; label: string }[]>('/lookups/contract-types');
      // return response.data;
      return this.getLookupValues('CONTRACT_TYPE'); // Using the generic lookup
    } catch (error) {
      console.error('Error fetching contract types lookup:', error);
      throw error; // Or return []
    }
  },

  async getContractStatusesLookup(): Promise<LookupValue[]> { // Return type changed
     try {
      // const response = await apiClient.get<{ value: ContractStatus; label: string }[]>('/lookups/contract-statuses');
      // return response.data;
      return this.getLookupValues('CONTRACT_STATUS'); // Using the generic lookup
    } catch (error) {
      console.error('Error fetching contract statuses lookup:', error);
      throw error; // Or return []
    }
  },

  async getPayFrequenciesLookup(): Promise<LookupValue[]> { // Return type changed
    try {
      // const response = await apiClient.get<{ value: PayFrequency; label: string }[]>('/lookups/pay-frequencies');
      // return response.data;
      return this.getLookupValues('PAY_FREQUENCY'); // Using the generic lookup
    } catch (error) {
      console.error('Error fetching pay frequencies lookup:', error);
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
      console.error(`Error fetching job history for employee ${employeeId}:`, error);
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
      console.error(`Error adding job history for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async updateJobHistoryItem(employeeId: string, itemId: string, payload: UpdateJobHistoryPayload): Promise<JobHistoryItem> {
    try {
      const response = await apiClient.put<JobHistoryItem>(`/employees/${employeeId}/job-history/${itemId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating job history item ${itemId} for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async deleteJobHistoryItem(employeeId: string, itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/job-history/${itemId}`);
    } catch (error) {
      console.error(`Error deleting job history item ${itemId} for employee ${employeeId}:`, error);
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
      console.error(`Error fetching contracts for employee ${employeeId}:`, error);
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
      console.error(`Error adding contract for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async updateContractItem(employeeId: string, contractId: string, payload: UpdateContractPayload): Promise<ContractItem> {
    try {
      const response = await apiClient.put<ContractItem>(`/employees/${employeeId}/contracts/${contractId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating contract ${contractId} for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async deleteContractItem(employeeId: string, contractId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/contracts/${contractId}`);
    } catch (error) {
      console.error(`Error deleting contract ${contractId} for employee ${employeeId}:`, error);
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
      console.error(`Error fetching compensation history for employee ${employeeId}:`, error);
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
      console.error(`Error adding compensation for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  async updateCompensationItem(employeeId: string, compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem> {
    try {
      const response = await apiClient.put<CompensationItem>(`/employees/${employeeId}/compensation-history/${compensationId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating compensation ${compensationId} for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async deleteCompensationItem(employeeId: string, compensationId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/compensation-history/${compensationId}`);
    } catch (error) {
      console.error(`Error deleting compensation ${compensationId} for employee ${employeeId}:`, error);
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
      console.error(`Error fetching leave balances for employee ${employeeId}:`, error);
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
      console.error(`Error creating leave balance for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async adjustLeaveBalance(employeeId: string, leaveBalanceId: string, payload: UpdateLeaveBalancePayload): Promise<LeaveBalanceItem> {
    try {
      const response = await apiClient.put<LeaveBalanceItem>(`/employees/${employeeId}/leave-balances/${leaveBalanceId}/adjust`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error adjusting leave balance ${leaveBalanceId} for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async deleteLeaveBalanceItem(employeeId: string, leaveBalanceId: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${employeeId}/leave-balances/${leaveBalanceId}`);
    } catch (error) {
      console.error(`Error deleting leave balance ${leaveBalanceId} for employee ${employeeId}:`, error);
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
      
      console.log(`Successfully fetched ${Object.keys(employeeMap).length} employees`);
      return employeeMap;
    } catch (error) {
      console.error('Error fetching employees by IDs:', error);
      return {};
    }
  },
};
