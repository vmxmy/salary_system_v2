import apiClient from './apiClient';

// 分页参数接口
interface PaginationParams {
  page?: number;
  size?: number;
}

// 分页响应接口
interface PaginationResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
  path?: string;
  level?: number;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentParams extends PaginationParams {
  search?: string;
  parent_id?: number;
  is_active?: boolean;
}

export const departmentApi = {
  /**
   * 获取部门列表
   */
  getDepartments: async (params: DepartmentParams) => {
    const response = await apiClient.get<PaginationResponse<Department>>('/v2/hr/departments', { params });
    return { data: response.data };
  },

  /**
   * 获取部门详情
   */
  getDepartment: async (id: number) => {
    const response = await apiClient.get<{ data: Department }>(`/v2/hr/departments/${id}`);
    return response;
  },

  /**
   * 创建部门
   */
  createDepartment: async (data: Partial<Department>) => {
    const response = await apiClient.post<{ data: Department }>('/v2/hr/departments', data);
    return response;
  },

  /**
   * 更新部门
   */
  updateDepartment: async (id: number, data: Partial<Department>) => {
    const response = await apiClient.put<{ data: Department }>(`/v2/hr/departments/${id}`, data);
    return response;
  },

  /**
   * 删除部门
   */
  deleteDepartment: async (id: number) => {
    const response = await apiClient.delete(`/v2/hr/departments/${id}`);
    return response;
  },
};