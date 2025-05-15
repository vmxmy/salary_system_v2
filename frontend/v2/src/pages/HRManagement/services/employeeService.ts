import axios from 'axios';
import type { Employee, EmployeeFilterParams, PaginatedResponse, JobHistoryItem, ContractItem, CompensationItem, LeaveBalanceItem } from '../types';
import { EmploymentStatus, Gender, EmploymentType, ContractStatus, PayFrequency } from '../types';

// Mock Data Store
let mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: '张三',
    departmentId: 'D001',
    departmentName: '研发部',
    positionId: 'P001',
    positionName: '高级软件工程师',
    status: EmploymentStatus.ACTIVE,
    employmentType: EmploymentType.FULL_TIME,
    hireDate: '2022-08-15',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    idCardNumber: '11010119900307001X',
    dateOfBirth: '1990-03-07',
    gender: Gender.MALE,
    nationality: '中国',
    educationLevel: '本科',
    notes: '表现优秀，技术能力强。',
    residentialAddress: '北京市朝阳区XX街道XX小区X号楼X单元XXX',
    bankName: '中国工商银行',
    bankAccountNumber: '6222020000012345678',
    officialWorkStartDate: '2022-08-15',
    personnelIdentity: '正式员工',
    avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
    workLocation: '北京总部',
    directManagerId: 'EMP000',
    directManagerName: '李四 (CEO)',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: '李四',
    departmentId: 'D002',
    departmentName: '市场部',
    positionId: 'P004',
    positionName: '市场经理',
    status: EmploymentStatus.ACTIVE,
    employmentType: EmploymentType.FULL_TIME,
    hireDate: '2023-01-20',
    email: 'lisi@example.com',
    phone: '13900139000',
    // ... add more details for李四 if needed for detail view testing
    idCardNumber: '11010219850515002Y',
    dateOfBirth: '1985-05-15',
    gender: Gender.FEMALE,
    nationality: '中国',
    educationLevel: '硕士',
    officialWorkStartDate: '2023-01-20',
    personnelIdentity: '正式员工',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    name: '王五',
    departmentId: 'D001',
    departmentName: '研发部',
    positionId: 'P002',
    positionName: '软件工程师',
    status: EmploymentStatus.ON_LEAVE,
    employmentType: EmploymentType.FULL_TIME,
    hireDate: '2023-05-10',
    email: 'wangwu@example.com',
    phone: '13700137000',
    idCardNumber: '11010319920820003Z',
    dateOfBirth: '1992-08-20',
    gender: Gender.MALE,
    nationality: '中国',
    educationLevel: '本科',
    officialWorkStartDate: '2023-05-10',
    personnelIdentity: '正式员工',
  },
];

const mockJobHistory: JobHistoryItem[] = [
    { id: 'jh1', employeeId: '1', effectiveDate: '2022-08-15', departmentId: 'D001', departmentName: '研发部', positionId: 'P002', positionName: '软件工程师', employmentType: EmploymentType.FULL_TIME, remarks: 'Initial position' },
    { id: 'jh2', employeeId: '1', effectiveDate: '2023-02-01', departmentId: 'D001', departmentName: '研发部', positionId: 'P001', positionName: '高级软件工程师', employmentType: EmploymentType.FULL_TIME, remarks: 'Promotion' },
    { id: 'jh3', employeeId: '2', effectiveDate: '2023-01-20', departmentId: 'D002', departmentName: '市场部', positionId: 'P004', positionName: '市场经理', employmentType: EmploymentType.FULL_TIME, remarks: 'Hired as Market Manager' },
];

const mockContracts: ContractItem[] = [
    { id: 'c1', employeeId: '1', contractNumber: 'CON-2022-001', contractType: '劳动合同', startDate: '2022-08-15', endDate: '2025-08-14', status: ContractStatus.ACTIVE },
    { id: 'c2', employeeId: '2', contractNumber: 'CON-2023-005', contractType: '劳动合同', startDate: '2023-01-20', endDate: '2026-01-19', status: ContractStatus.ACTIVE },
];

const mockCompensationHistory: CompensationItem[] = [
    { id: 'comp1', employeeId: '1', effectiveDate: '2022-08-15', basicSalary: 15000, allowances: 2000, totalSalary: 17000, payFrequency: PayFrequency.MONTHLY, currency: 'CNY', remarks: 'Initial salary' },
    { id: 'comp2', employeeId: '1', effectiveDate: '2023-03-01', basicSalary: 18000, allowances: 2500, totalSalary: 20500, payFrequency: PayFrequency.MONTHLY, currency: 'CNY', remarks: 'Salary increase after probation' },
    { id: 'comp3', employeeId: '2', effectiveDate: '2023-01-20', basicSalary: 20000, allowances: 3000, totalSalary: 23000, payFrequency: PayFrequency.MONTHLY, currency: 'CNY', remarks: 'Market Manager salary' },
];

const mockLeaveBalances: LeaveBalanceItem[] = [
    { id: 'lb1', employeeId: '1', leaveTypeId: 'ANNUAL', leaveTypeName: '年假', totalEntitlement: 10, taken: 2, balance: 8, pendingApproval: 1 },
    { id: 'lb2', employeeId: '1', leaveTypeId: 'SICK', leaveTypeName: '带薪病假', totalEntitlement: 12, taken: 1, balance: 11 },
    { id: 'lb3', employeeId: '2', leaveTypeId: 'ANNUAL', leaveTypeName: '年假', totalEntitlement: 15, taken: 0, balance: 15 },
];


// Simulate API delay
const RqDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

const API_BASE_URL = '/api/v2'; // Assuming a proxy is set up for /api/v2 to point to the backend

// Helper to construct query parameters
const buildQueryParams = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '' && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        // For array params like hireDateRange, assuming backend expects comma-separated or repeated keys
        // This example uses repeated keys: hireDateRange=date1&hireDateRange=date2
        // Adjust if backend expects different format (e.g. hireDateRange=date1,date2)
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join('&');
  return query ? `?${query}` : '';
};

export const employeeService = {
  async getEmployees(params: EmployeeFilterParams, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Employee>> {
    console.log('Real Service: Fetching employees with params:', params, 'Page:', page, 'PageSize:', pageSize);
    const queryParams = buildQueryParams({ ...params, page, pageSize });
    try {
      const response = await axios.get<PaginatedResponse<Employee>>(`${API_BASE_URL}/employees${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Consider a more robust error handling strategy, e.g., custom error objects, logging service
      throw error; // Re-throw to be caught by the calling component
    }
  },

  async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    console.log('Real Service: Creating employee:', employeeData);
    try {
      const response = await axios.post<Employee>(`${API_BASE_URL}/employees`, employeeData);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    console.log('Real Service: Fetched employee by id:', id);
    try {
      const response = await axios.get<Employee>(`${API_BASE_URL}/employees/${id}`);
      return response.data;
    } catch (error) {
      // If 404, axios throws an error. Check error.response.status if specific handling is needed.
      console.error(`Error fetching employee with id ${id}:`, error);
      throw error; 
    }
  },

  async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    console.log('Real Service: Updating employee:', id, employeeData);
    try {
      const response = await axios.put<Employee>(`${API_BASE_URL}/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating employee with id ${id}:`, error);
      throw error;
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    console.log('Real Service: Deleting employee:', id);
    try {
      await axios.delete(`${API_BASE_URL}/employees/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting employee with id ${id}:`, error);
      return false; // Or throw error to let component handle it differently
    }
  },

  // Services for detail page tabs - assuming API endpoints
  async getEmployeeJobHistory(employeeId: string): Promise<JobHistoryItem[]> {
    console.log('Real Service: Fetching job history for employeeId:', employeeId);
    try {
      const response = await axios.get<JobHistoryItem[]>(`${API_BASE_URL}/employees/${employeeId}/job-history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job history for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async getEmployeeContracts(employeeId: string): Promise<ContractItem[]> {
    console.log('Real Service: Fetching contracts for employeeId:', employeeId);
    try {
      const response = await axios.get<ContractItem[]>(`${API_BASE_URL}/employees/${employeeId}/contracts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contracts for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async getEmployeeCompensationHistory(employeeId: string): Promise<CompensationItem[]> {
    console.log('Real Service: Fetching compensation history for employeeId:', employeeId);
    try {
      const response = await axios.get<CompensationItem[]>(`${API_BASE_URL}/employees/${employeeId}/compensation-history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching compensation history for employee ${employeeId}:`, error);
      throw error;
    }
  },

  async getEmployeeLeaveBalances(employeeId: string): Promise<LeaveBalanceItem[]> {
    console.log('Real Service: Fetching leave balances for employeeId:', employeeId);
    try {
      const response = await axios.get<LeaveBalanceItem[]>(`${API_BASE_URL}/employees/${employeeId}/leave-balances`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching leave balances for employee ${employeeId}:`, error);
      throw error;
    }
  },
  // TODO: Add API calls for creating/updating/deleting items in tabs if forms for these are implemented
  // e.g., addJobHistoryItem(employeeId: string, data: Omit<JobHistoryItem, 'id' | 'employeeId'>): Promise<JobHistoryItem>
  //       updateContractItem(contractId: string, data: Partial<ContractItem>): Promise<ContractItem>
}; 