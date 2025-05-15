import apiClient from '../api';
import {
  EmploymentType, 
  ContractStatus, 
  ContractType, 
  PayFrequency, 
  LeaveType, 
} from '../pages/HRManagement/types'; // Enums used as values

import type { // Interfaces and type aliases used only as types
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
  PositionItem,
  CreateContractPayload,
  UpdateContractPayload,
  CreateCompensationPayload,
  UpdateCompensationPayload,
} from '../pages/HRManagement/types';

// Simple mock ID generator
const generateMockId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
};

// const API_BASE_URL = import.meta.env.VITE_API_PATH_PREFIX || '/api/v2'; // This line is removed

// --- Mock Data Sources ---
const mockDepartments: Department[] = [
  { id: 'dept_1', value: 'dept_1', name: 'Engineering', label: 'Engineering' },
  { id: 'dept_2', value: 'dept_2', name: 'Human Resources', label: 'Human Resources' },
  { id: 'dept_3', value: 'dept_3', name: 'Marketing', label: 'Marketing' },
  { id: 'dept_4', value: 'dept_4', name: 'Sales', label: 'Sales' },
];

const mockPositions: PositionItem[] = [
  { id: 'pos_1', name: 'Software Engineer', departmentId: 'dept_1' },
  { id: 'pos_2', name: 'Senior Software Engineer', departmentId: 'dept_1' },
  { id: 'pos_3', name: 'HR Manager', departmentId: 'dept_2' },
  { id: 'pos_4', name: 'HR Specialist', departmentId: 'dept_2' },
  { id: 'pos_5', name: 'Marketing Manager', departmentId: 'dept_3' },
  { id: 'pos_6', name: 'Sales Representative', departmentId: 'dept_4' },
];

const mockEmploymentTypes = Object.values(EmploymentType).map(value => ({
  value,
  label: value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
}));

// --- Mock In-Memory "Databases" ---
let mockJobHistoryDb: JobHistoryItem[] = [
  {
    id: 'jh_1',
    employeeId: 'emp_001',
    effectiveDate: '2022-01-15',
    departmentId: 'dept_1',
    departmentName: 'Engineering',
    positionId: 'pos_1',
    positionName: 'Software Engineer',
    employmentType: EmploymentType.FULL_TIME,
    salary: 60000,
    remarks: 'Initial hiring.',
  },
  {
    id: 'jh_2',
    employeeId: 'emp_001',
    effectiveDate: '2023-01-15',
    departmentId: 'dept_1',
    departmentName: 'Engineering',
    positionId: 'pos_2',
    positionName: 'Senior Software Engineer',
    employmentType: EmploymentType.FULL_TIME,
    salary: 80000,
    remarks: 'Promotion.',
  },
  {
    id: 'jh_3',
    employeeId: 'emp_002',
    effectiveDate: '2022-05-20',
    departmentId: 'dept_3',
    departmentName: 'Marketing',
    positionId: 'pos_5',
    positionName: 'Marketing Manager',
    employmentType: EmploymentType.FULL_TIME,
    salary: 75000,
    remarks: 'Joined as Marketing Manager.',
  },
];

let mockContractsDb: ContractItem[] = [
  {
    id: 'contract_1',
    employeeId: 'emp_001',
    contractNumber: 'CON-001-2023',
    contractType: ContractType.FIXED_TERM,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: ContractStatus.ACTIVE,
    remarks: 'First contract',
  },
  {
    id: 'contract_2',
    employeeId: 'emp_001',
    contractNumber: 'CON-001-2024',
    contractType: ContractType.FIXED_TERM,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: ContractStatus.PENDING, // Assuming it's future-dated
    remarks: 'Renewal',
  },
  {
    id: 'contract_3',
    employeeId: 'emp_002',
    contractNumber: 'CON-002-2022',
    contractType: ContractType.PERMANENT,
    startDate: '2022-05-20',
    endDate: '2025-05-19', // Permanent might still have a review date or nominal end
    status: ContractStatus.ACTIVE,
    remarks: 'Permanent contract after probation.',
  },
];

// Add mock DBs for other entities as needed, e.g.:
let mockCompensationsDb: CompensationItem[] = [
  {
    id: 'comp_1',
    employeeId: 'emp_001',
    effectiveDate: '2023-01-01',
    basicSalary: 70000,
    allowances: 5000,
    totalSalary: 75000,
    payFrequency: PayFrequency.MONTHLY,
    currency: 'CNY',
    changeReason: 'Annual Review',
  },
  {
    id: 'comp_2',
    employeeId: 'emp_001',
    effectiveDate: '2024-01-01',
    basicSalary: 75000,
    allowances: 6000,
    totalSalary: 81000,
    payFrequency: PayFrequency.MONTHLY,
    currency: 'CNY',
    changeReason: 'Annual Review + Performance Bonus',
  },
  {
    id: 'comp_3',
    employeeId: 'emp_002',
    effectiveDate: '2022-06-01',
    basicSalary: 80000,
    allowances: 0,
    totalSalary: 80000,
    payFrequency: PayFrequency.MONTHLY,
    currency: 'CNY',
    changeReason: 'Initial Salary',
  },
];
// let mockLeaveBalancesDb: LeaveBalanceItem[] = [];

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
      return { data: [], total: 0, page: 1, pageSize: query?.pageSize || 10, totalPages: 0 };
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

  // --- Mock Lookup Data ---
  async getDepartmentsLookup(): Promise<Department[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockDepartments]), 200);
    });
  },

  async getPositionsLookup(departmentId?: string): Promise<PositionItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (departmentId) {
          resolve([...mockPositions.filter(p => p.departmentId === departmentId)]);
        } else {
          resolve([...mockPositions]);
        }
      }, 200);
    });
  },

  async getEmploymentTypesLookup(): Promise<{ value: string; label: string }[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockEmploymentTypes]), 100);
    });
  },

  async getContractTypesLookup(): Promise<{ value: ContractType; label: string }[]> {
    return new Promise((resolve) => {
      const options = Object.values(ContractType).map(value => ({
        value,
        // Basic formatter, can be improved with a map for proper Chinese labels
        label: value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
      }));
      setTimeout(() => resolve(options), 100);
    });
  },

  async getContractStatusesLookup(): Promise<{ value: ContractStatus; label: string }[]> {
    return new Promise((resolve) => {
      const options = Object.values(ContractStatus).map(value => ({
        value,
        label: value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      }));
      setTimeout(() => resolve(options), 100);
    });
  },

  async getPayFrequenciesLookup(): Promise<{ value: PayFrequency; label: string }[]> {
    return new Promise((resolve) => {
      const options = Object.values(PayFrequency).map(value => ({
        value,
        label: value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
      }));
      setTimeout(() => resolve(options), 100);
    });
  },

  // --- Job History CUD (Mocked) ---
  async getEmployeeJobHistory(
    employeeId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<JobHistoryPageResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let items = mockJobHistoryDb.filter(jh => jh.employeeId === employeeId);
        // Simple sort (can be expanded)
        if (query?.sortBy && query?.sortOrder) {
            items = [...items].sort((a, b) => { // Create a new array for sorting
                const valA = (a as any)[query.sortBy!];
                const valB = (b as any)[query.sortBy!];
                if (valA < valB) return query.sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return query.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
        const page = query?.page || 1;
        const pageSize = query?.pageSize || 10;
        const paginatedData = items.slice((page - 1) * pageSize, page * pageSize);
        resolve({ data: paginatedData, total: items.length, page, pageSize, totalPages: Math.ceil(items.length / pageSize) });
      }, 300);
    });
  },

  async addJobHistoryItem(employeeId: string, payload: Omit<JobHistoryItem, 'id' | 'employeeId' | 'departmentName' | 'positionName'>): Promise<JobHistoryItem> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const department = mockDepartments.find(d => d.id === payload.departmentId);
        const position = mockPositions.find(p => p.id === payload.positionId);
        const newItem: JobHistoryItem = {
          id: generateMockId('jh'),
          employeeId,
          ...payload,
          departmentName: department?.name,
          positionName: position?.name,
        } as JobHistoryItem; // Added type assertion
        mockJobHistoryDb.push(newItem);
        // Forcing a sort by effectiveDate descending after add for typical display
        mockJobHistoryDb.sort((a, b) => new Date(b.effectiveDate as string).getTime() - new Date(a.effectiveDate as string).getTime());
        resolve(newItem);
      }, 300);
    });
  },

  async updateJobHistoryItem(itemId: string, payload: Partial<Omit<JobHistoryItem, 'id' | 'employeeId' | 'departmentName' | 'positionName'>>): Promise<JobHistoryItem> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const itemIndex = mockJobHistoryDb.findIndex(jh => jh.id === itemId);
        if (itemIndex > -1) {
          const currentItem = mockJobHistoryDb[itemIndex];
          const updatedPayload = { ...payload };

          let departmentName = currentItem.departmentName;
          let positionName = currentItem.positionName;

          if (updatedPayload.departmentId) {
            const department = mockDepartments.find(d => d.id === updatedPayload.departmentId);
            departmentName = department?.name;
          }
          if (updatedPayload.positionId) {
            const position = mockPositions.find(p => p.id === updatedPayload.positionId);
            positionName = position?.name;
          }
          
          const updatedItem: JobHistoryItem = {
            ...currentItem,
            ...updatedPayload,
            departmentName,
            positionName,
          } as JobHistoryItem; // Added type assertion
          mockJobHistoryDb[itemIndex] = updatedItem;
          mockJobHistoryDb.sort((a, b) => new Date(b.effectiveDate as string).getTime() - new Date(a.effectiveDate as string).getTime());
          resolve(updatedItem);
        } else {
          reject(new Error('Job history item not found'));
        }
      }, 300);
    });
  },

  async deleteJobHistoryItem(itemId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = mockJobHistoryDb.length;
        mockJobHistoryDb = mockJobHistoryDb.filter(jh => jh.id !== itemId);
        if (mockJobHistoryDb.length < initialLength) {
          resolve();
        } else {
          reject(new Error('Job history item not found for deletion'));
        }
      }, 300);
    });
  },

  // --- Contract CUD (Mocked) ---
  async getEmployeeContracts(
    employeeId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<ContractPageResult> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        let items = mockContractsDb.filter(c => c.employeeId === employeeId);
        // Simple sort (can be expanded, e.g. by startDate)
        if (query?.sortBy && query?.sortOrder) {
            items = [...items].sort((a, b) => {
                const valA = (a as any)[query.sortBy!];
                const valB = (b as any)[query.sortBy!];
                if (valA < valB) return query.sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return query.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        } else { // Default sort by start date descending
            items.sort((a,b) => new Date(b.startDate as string).getTime() - new Date(a.startDate as string).getTime());
        }
        const page = query?.page || 1;
        const pageSize = query?.pageSize || 10;
        const paginatedData = items.slice((page - 1) * pageSize, page * pageSize);
        resolve({ data: paginatedData, total: items.length, page, pageSize, totalPages: Math.ceil(items.length / pageSize) });
      }, 300);
    });
  },

  async addContractItem(employeeId: string, payload: CreateContractPayload): Promise<ContractItem> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        const newItem: ContractItem = {
          id: generateMockId('contract'),
          employeeId,
          ...payload,
        } as ContractItem; // Type assertion
        mockContractsDb.push(newItem);
        mockContractsDb.sort((a,b) => new Date(b.startDate as string).getTime() - new Date(a.startDate as string).getTime());
        resolve(newItem);
      }, 300);
    });
  },

  async updateContractItem(contractId: string, payload: UpdateContractPayload): Promise<ContractItem> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const itemIndex = mockContractsDb.findIndex(c => c.id === contractId);
        if (itemIndex > -1) {
          const updatedItem = {
            ...mockContractsDb[itemIndex],
            ...payload,
          } as ContractItem; // Type assertion
          mockContractsDb[itemIndex] = updatedItem;
          mockContractsDb.sort((a,b) => new Date(b.startDate as string).getTime() - new Date(a.startDate as string).getTime());
          resolve(updatedItem);
        } else {
          reject(new Error('Contract item not found'));
        }
      }, 300);
    });
  },

  async deleteContractItem(contractId: string): Promise<void> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = mockContractsDb.length;
        mockContractsDb = mockContractsDb.filter(c => c.id !== contractId);
        if (mockContractsDb.length < initialLength) {
          resolve();
        } else {
          reject(new Error('Contract item not found for deletion'));
        }
      }, 300);
    });
  },

  // --- Compensation History CUD (Still using apiClient placeholders) ---
  async getEmployeeCompensationHistory(
    employeeId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<CompensationPageResult> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        let items = mockCompensationsDb.filter(c => c.employeeId === employeeId);
        // Simple sort (can be expanded)
        if (query?.sortBy && query?.sortOrder) {
            items = [...items].sort((a, b) => {
                const valA = (a as any)[query.sortBy!];
                const valB = (b as any)[query.sortBy!];
                if (valA < valB) return query.sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return query.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        } else { // Default sort by effectiveDate descending
            items.sort((a,b) => new Date(b.effectiveDate as string).getTime() - new Date(a.effectiveDate as string).getTime());
        }

        const page = query?.page || 1;
        const pageSize = query?.pageSize || 10;
        const paginatedData = items.slice((page - 1) * pageSize, page * pageSize);
        resolve({ data: paginatedData, total: items.length, page, pageSize, totalPages: Math.ceil(items.length / pageSize) });
      }, 300);
    });
  },

  async addCompensationItem(employeeId: string, payload: CreateCompensationPayload): Promise<CompensationItem> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalSalary = (payload.basicSalary || 0) + (payload.allowances || 0);
        const newItem: CompensationItem = {
          id: generateMockId('comp'),
          employeeId,
          ...payload,
          totalSalary,
        } as CompensationItem;
        mockCompensationsDb.push(newItem);
        mockCompensationsDb.sort((a,b) => new Date(b.effectiveDate as string).getTime() - new Date(a.effectiveDate as string).getTime());
        resolve(newItem);
      }, 300);
    });
  },
  
  async updateCompensationItem(compensationId: string, payload: UpdateCompensationPayload): Promise<CompensationItem> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const itemIndex = mockCompensationsDb.findIndex(c => c.id === compensationId);
        if (itemIndex > -1) {
          const currentItem = mockCompensationsDb[itemIndex];
          const updatedItemData = { ...currentItem, ...payload };
          
          // Recalculate totalSalary if basicSalary or allowances change
          if (payload.basicSalary !== undefined || payload.allowances !== undefined) {
            updatedItemData.totalSalary = (updatedItemData.basicSalary || 0) + (updatedItemData.allowances || 0);
          }

          mockCompensationsDb[itemIndex] = updatedItemData as CompensationItem;
          mockCompensationsDb.sort((a,b) => new Date(b.effectiveDate as string).getTime() - new Date(a.effectiveDate as string).getTime());
          resolve(updatedItemData as CompensationItem);
        } else {
          reject(new Error('Compensation item not found'));
        }
      }, 300);
    });
  },

  async deleteCompensationItem(compensationId: string): Promise<void> {
    // MOCK IMPLEMENTATION
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = mockCompensationsDb.length;
        mockCompensationsDb = mockCompensationsDb.filter(c => c.id !== compensationId);
        if (mockCompensationsDb.length < initialLength) {
          resolve();
        } else {
          reject(new Error('Compensation item not found for deletion'));
        }
      }, 300);
    });
  },

  // --- Leave Balance CUD (Still using apiClient placeholders) ---
  async getEmployeeLeaveBalances(
    employeeId: string,
    query?: { page?: number; pageSize?: number; leaveType?: string }
  ): Promise<LeaveBalancePageResult> {
    try {
      const queryString = query ? buildQueryParams(query) : '';
      const response = await apiClient.get<LeaveBalancePageResult>(
        `/employees/${employeeId}/leave-balances${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching leave balances for employee ${employeeId}:`, error);
      return { data: [], total: 0, page: 1, pageSize: query?.pageSize || 10, totalPages: 0 };
    }
  },

  async adjustLeaveBalance(employeeId: string, leaveBalanceId: string, payload: { adjustment: number; reason: string }): Promise<LeaveBalanceItem> {
    try {
      const response = await apiClient.patch<LeaveBalanceItem>(`/employees/${employeeId}/leave-balances/${leaveBalanceId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error adjusting leave balance for employee ${employeeId}, balance ${leaveBalanceId}:`, error);
      throw error;
    }
  }
  // TODO: Add mock CUD for leave balances (e.g., add new type of leave, delete a balance record)
}; 