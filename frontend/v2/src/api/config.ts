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
  const url = `/config/payroll-component-types`;
  const response = await apiClient.get(url);
  return response.data;
} 