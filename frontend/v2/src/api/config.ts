import apiClient from './apiClient';
import type { LookupValue, PaginatedResponse } from './types';

/**
 * 获取lookup值列表
 * @param typeCode lookup类型编码
 * @param options 选项
 * @returns lookup值列表响应
 */
export const getLookupValues = async (typeCode: string, options?: any): Promise<PaginatedResponse<LookupValue>> => {
  const url = `/config/lookup-values/${typeCode}`;
  const response = await apiClient.get(url, { params: options });
  return response.data;
}

/**
 * 获取薪资字段类型
 * @returns 薪资字段类型列表响应
 */
export const getPayrollComponentTypes = async (): Promise<PaginatedResponse<LookupValue>> => {
  const url = `/config/lookup-values-public`;
  const response = await apiClient.get(url, { 
    params: {
      lookup_type_code: 'PAYROLL_COMPONENT_TYPE'
    }
  });
  console.log('✅ getPayrollComponentTypes response:', response.data);
  return response.data;
}

// 导出 configApi 对象
export const configApi = {
  getLookupValues: async (params: { lookup_type_code: string; page?: number; size?: number }) => {
    const response = await apiClient.get(`/config/lookup-values-public`, { params });
    return response;
  }
}; 