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

export interface Position {
  id: number;
  name: string;
  code?: string;
  department_id?: number;
  parent_job_title_id?: number;
  level?: number;
  description?: string;
  requirements?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PositionParams extends PaginationParams {
  search?: string;
  department_id?: number;
  is_active?: boolean;
}

export const positionApi = {
  /**
   * 获取职位列表
   */
  getPositions: async (params: PositionParams) => {
    const response = await apiClient.get<PaginationResponse<Position>>('/v2/hr/positions', { params });
    return { data: response.data };
  },

  /**
   * 获取职位详情
   */
  getPosition: async (id: number) => {
    const response = await apiClient.get<{ data: Position }>(`/v2/hr/positions/${id}`);
    return response;
  },

  /**
   * 创建职位
   */
  createPosition: async (data: Partial<Position>) => {
    const response = await apiClient.post<{ data: Position }>('/v2/hr/positions', data);
    return response;
  },

  /**
   * 更新职位
   */
  updatePosition: async (id: number, data: Partial<Position>) => {
    const response = await apiClient.put<{ data: Position }>(`/v2/hr/positions/${id}`, data);
    return response;
  },

  /**
   * 删除职位
   */
  deletePosition: async (id: number) => {
    const response = await apiClient.delete(`/v2/hr/positions/${id}`);
    return response;
  },
};