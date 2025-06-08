import apiClient from './apiClient';
import { getDepartments, getAllDepartmentsFlat } from './departments';
import { getPayrollPeriods } from '../pages/Payroll/services/payrollApi';

// 薪资周期接口
export interface PayrollPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  status_lookup?: {
    code: string;
    name: string;
  };
}

// 部门接口
export interface Department {
  id: number;
  name: string;
  code: string;
  is_active?: boolean;
}

// 员工接口
export interface Employee {
  id: number;
  name: string;
  employee_number: string;
  department_id?: number;
  department_name?: string;
  is_active?: boolean;
}

/**
 * 获取薪资周期列表
 */
export const getBatchReportPayrollPeriods = async (): Promise<PayrollPeriod[]> => {
  try {
    const response = await getPayrollPeriods({
      size: 100,
    });
    
    // 按开始日期倒序排列
    const sortedPeriods = response.data.sort((a, b) => {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
    
    return sortedPeriods;
  } catch (error) {
    console.error('获取薪资周期失败:', error);
    throw error;
  }
};

/**
 * 获取部门列表
 */
export const getBatchReportDepartments = async (): Promise<Department[]> => {
  try {
    const departments = await getAllDepartmentsFlat();
    return departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      code: dept.code || '',
      is_active: dept.is_active,
    }));
  } catch (error) {
    console.error('获取部门列表失败:', error);
    throw error;
  }
};

/**
 * 获取员工列表
 */
export const getBatchReportEmployees = async (params?: {
  department_ids?: number[];
  is_active?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<{ data: Employee[]; total: number }> => {
  try {
    const queryParams: any = {
      page: params?.page || 1,
      size: params?.size || 100,
    };

    if (params?.department_ids && params.department_ids.length > 0) {
      queryParams.department_ids = params.department_ids.join(',');
    }

    if (params?.is_active !== undefined) {
      queryParams.is_active = params.is_active;
    }

    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get('/employees/', { params: queryParams });
    
    return {
      data: response.data.data || [],
      total: response.data.meta?.total || 0,
    };
  } catch (error) {
    console.error('获取员工列表失败:', error);
    throw error;
  }
};

/**
 * 根据部门ID获取员工列表
 */
export const getEmployeesByDepartments = async (departmentIds: number[]): Promise<Employee[]> => {
  if (departmentIds.length === 0) {
    return [];
  }

  try {
    const response = await getBatchReportEmployees({
      department_ids: departmentIds,
      is_active: true,
      size: 1000, // 获取更多员工
    });

    return response.data;
  } catch (error) {
    console.error('根据部门获取员工失败:', error);
    throw error;
  }
}; 