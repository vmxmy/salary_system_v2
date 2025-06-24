import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { employeeManagementApi } from '../services/employeeManagementApi';
import type {
  EmployeeManagementItem,
  EmployeeManagementQuery,
  CreateEmployeeData,
  UpdateEmployeeData,
  TableFilters,
  TableSorter,
} from '../types';

// 分页配置
interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
}

// Hook返回类型
interface UseEmployeeManagementReturn {
  // 数据状态
  employees: EmployeeManagementItem[];
  loading: boolean;
  error: string | null;
  
  // 分页状态
  pagination: PaginationConfig;
  setPagination: React.Dispatch<React.SetStateAction<PaginationConfig>>;
  
  // 筛选和排序状态
  filters: TableFilters;
  setFilters: React.Dispatch<React.SetStateAction<TableFilters>>;
  sorter: TableSorter;
  setSorter: React.Dispatch<React.SetStateAction<TableSorter>>;
  
  // 操作方法
  fetchEmployees: () => Promise<void>;
  createEmployee: (data: CreateEmployeeData) => Promise<EmployeeManagementItem>;
  updateEmployee: (id: string | number, data: UpdateEmployeeData) => Promise<EmployeeManagementItem>;
  deleteEmployee: (id: string | number) => Promise<void>;
  batchDeleteEmployees: (ids: (string | number)[]) => Promise<void>;
  refreshEmployees: () => void;
  
  // 查询方法
  searchEmployees: (searchParams: Partial<TableFilters>) => void;
  resetFilters: () => void;
}

const initialPagination: PaginationConfig = {
  current: 1,
  pageSize: 20,
  total: 0,
};

const initialFilters: TableFilters = {};
const initialSorter: TableSorter = {};

export const useEmployeeManagement = (): UseEmployeeManagementReturn => {
  const { t } = useTranslation(['employeeManagement', 'common']);
  
  // 状态管理
  const [employees, setEmployees] = useState<EmployeeManagementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pagination, setPagination] = useState<PaginationConfig>(initialPagination);
  const [filters, setFilters] = useState<TableFilters>(initialFilters);
  const [sorter, setSorter] = useState<TableSorter>(initialSorter);

  // 获取员工列表
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query: EmployeeManagementQuery = {
        page: pagination.current,
        size: pagination.pageSize,
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined,
        ...filters,
      };

      const response = await employeeManagementApi.getEmployees(query);
      
      if (response && response.data) {
        setEmployees(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.meta?.total || 0,
        }));
      } else {
        setEmployees([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (err: any) {
      const errorMsg = err?.message || t('common:message.fetch_failed');
      setError(errorMsg);
      message.error(errorMsg);
      setEmployees([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sorter, filters, t]);

  // 创建员工
  const createEmployee = useCallback(async (data: CreateEmployeeData): Promise<EmployeeManagementItem> => {
    try {
      const newEmployee = await employeeManagementApi.createEmployee(data);
      message.success(t('employeeManagement:message.create_success'));
      await fetchEmployees(); // 刷新列表
      return newEmployee;
    } catch (err: any) {
      const errorMsg = err?.message || t('employeeManagement:message.create_failed');
      message.error(errorMsg);
      throw err;
    }
  }, [fetchEmployees, t]);

  // 更新员工
  const updateEmployee = useCallback(async (id: string | number, data: UpdateEmployeeData): Promise<EmployeeManagementItem> => {
    try {
      const updatedEmployee = await employeeManagementApi.updateEmployee(id, data);
      message.success(t('employeeManagement:message.update_success'));
      await fetchEmployees(); // 刷新列表
      return updatedEmployee;
    } catch (err: any) {
      const errorMsg = err?.message || t('employeeManagement:message.update_failed');
      message.error(errorMsg);
      throw err;
    }
  }, [fetchEmployees, t]);

  // 删除员工
  const deleteEmployee = useCallback(async (id: string | number): Promise<void> => {
    try {
      await employeeManagementApi.deleteEmployee(id);
      message.success(t('employeeManagement:message.delete_success'));
      await fetchEmployees(); // 刷新列表
    } catch (err: any) {
      const errorMsg = err?.message || t('employeeManagement:message.delete_failed');
      message.error(errorMsg);
      throw err;
    }
  }, [fetchEmployees, t]);

  // 批量删除员工
  const batchDeleteEmployees = useCallback(async (ids: (string | number)[]): Promise<void> => {
    try {
      await employeeManagementApi.batchDeleteEmployees(ids);
      message.success(t('employeeManagement:message.batch_delete_success', { count: ids.length }));
      await fetchEmployees(); // 刷新列表
    } catch (err: any) {
      const errorMsg = err?.message || t('employeeManagement:message.batch_delete_failed');
      message.error(errorMsg);
      throw err;
    }
  }, [fetchEmployees, t]);

  // 刷新数据
  const refreshEmployees = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 搜索员工
  const searchEmployees = useCallback((searchParams: Partial<TableFilters>) => {
    setFilters(prev => ({ ...prev, ...searchParams }));
    setPagination(prev => ({ ...prev, current: 1 })); // 搜索时重置到第一页
  }, []);

  // 重置筛选器
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSorter(initialSorter);
    setPagination(initialPagination);
  }, []);

  // 初始加载数据
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    // 数据状态
    employees,
    loading,
    error,
    
    // 分页状态
    pagination,
    setPagination,
    
    // 筛选和排序状态
    filters,
    setFilters,
    sorter,
    setSorter,
    
    // 操作方法
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    batchDeleteEmployees,
    refreshEmployees,
    
    // 查询方法
    searchEmployees,
    resetFilters,
  };
}; 