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
  JobTitle, // Added
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
      const response = await apiClient.get<EmployeePageResult>(`/employees${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10;
      return { 
        data: [], 
        meta: { 
          current_page: currentPage, 
          per_page: pageSize, 
          total_items: 0, 
          total_pages: 0 
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

  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    try {
      const response = await apiClient.post<Employee>(`/employees`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Error creating employee:', error);
      console.error('Error creating employee - Response data:', error.response?.data);
      throw error;
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

  // --- Lookup Data ---
  // Generic function to fetch lookup values by type code
  async getLookupValues(lookupTypeCode: string): Promise<LookupValue[]> {
    try {
      // The actual API endpoint might be /v2/lookup/values or similar.
      // The query parameter for type might be 'type_code', 'code', 'type', etc.
      // Adjust based on the actual API documentation for lookup values.
      const response = await apiClient.get<LookupValue[]>(`/v2/lookup/values?type_code=${lookupTypeCode}`);
      // It's possible the API returns a paginated response or a different structure.
      // If so, an adapter might be needed here or the return type adjusted.
      // For now, assuming it directly returns LookupValue[] based on the type_code filter.
      return response.data;
    } catch (error) {
      console.error(`Error fetching lookup values for type_code ${lookupTypeCode}:`, error);
      throw error; // Or return []
    }
  },

  async getDepartmentsLookup(): Promise<Department[]> {
    try {
      // Assuming the API for departments list might be paginated.
      // For a simple lookup, we might want all departments, or the API might offer a non-paginated "lookup" version.
      // If it's paginated like EmployeePageResult, we'd need to fetch all pages or use a specific lookup endpoint.
      // For now, assuming /v2/departments returns Department[] directly or within a simpler structure for lookups.
      // If it's DepartmentPageResult, then:
      // const response = await apiClient.get<DepartmentPageResult>('/v2/departments?size=1000'); // Fetch a large size for lookup
      // return response.data.data; // Access the inner data array
      const response = await apiClient.get<Department[]>('/v2/departments'); // Simplified assumption for now
      return response.data;
    } catch (error) {
      console.error('Error fetching departments lookup:', error);
      throw error; // Or return []
    }
  },

  // Renamed from getPositionsLookup to getJobTitlesLookup to match type JobTitle
  async getJobTitlesLookup(departmentId?: string): Promise<JobTitle[]> {
    try {
      // API for job titles is /v2/job-titles/
      // If departmentId filtering is needed, ensure API supports it via query param.
      const queryString = departmentId ? buildQueryParams({ department_id: departmentId }) : ''; // Assuming API uses department_id
      // Similar to departments, if this is paginated (e.g., JobTitlePageResult), adjust accordingly.
      // const response = await apiClient.get<JobTitlePageResult>(`/v2/job-titles${queryString}`);
      // return response.data.data;
      const response = await apiClient.get<JobTitle[]>(`/v2/job-titles${queryString}`); // Simplified assumption
      return response.data;
    } catch (error) {
      console.error('Error fetching job titles lookup:', error);
      throw error; // Or return []
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
      const response = await apiClient.get<JobHistoryPageResult>(`/employees/${employeeId}/job-history${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job history for employee ${employeeId}:`, error);
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10;
      return { 
        data: [], 
        meta: { 
          current_page: currentPage, 
          per_page: pageSize, 
          total_items: 0, 
          total_pages: 0 
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
      const response = await apiClient.get<ContractPageResult>(`/employees/${employeeId}/contracts${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contracts for employee ${employeeId}:`, error);
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10;
      return { 
        data: [], 
        meta: { 
          current_page: currentPage, 
          per_page: pageSize, 
          total_items: 0, 
          total_pages: 0 
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
      const response = await apiClient.get<CompensationPageResult>(`/employees/${employeeId}/compensation-history${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching compensation history for employee ${employeeId}:`, error);
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10;
      return { 
        data: [], 
        meta: { 
          current_page: currentPage, 
          per_page: pageSize, 
          total_items: 0, 
          total_pages: 0 
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
      const response = await apiClient.get<LeaveBalancePageResult>(`/employees/${employeeId}/leave-balances${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching leave balances for employee ${employeeId}:`, error);
      const currentPage = query?.page || 1;
      const pageSize = query?.pageSize || 10;
      return { 
        data: [], 
        meta: { 
          current_page: currentPage, 
          per_page: pageSize, 
          total_items: 0, 
          total_pages: 0 
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
  }
  // Removed TODO for mock CUD for leave balances
};
