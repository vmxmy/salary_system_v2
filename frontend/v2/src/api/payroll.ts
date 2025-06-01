import apiClient from './apiClient';

/**
 * 获取薪资字段定义列表
 * @param params 查询参数
 * @returns 薪资字段定义列表响应
 */
export const getPayrollComponentDefinitions = async (params?: any) => {
  const url = `/config/payroll-component-definitions`;
  const response = await apiClient.get(url, { params });
  return response.data;
};

/**
 * 获取单个薪资字段定义
 * @param id 组件ID
 * @returns 薪资字段定义
 */
export const getPayrollComponentDefinition = async (id: number) => {
  const url = `/config/payroll-component-definitions/${id}`;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * 创建薪资字段定义
 * @param data 组件数据
 * @returns 创建的薪资字段定义
 */
export const createPayrollComponentDefinition = async (data: any) => {
  const url = `/config/payroll-component-definitions`;
  const response = await apiClient.post(url, data);
  return response.data;
};

/**
 * 更新薪资字段定义
 * @param id 组件ID
 * @param data 组件数据
 * @returns 更新的薪资字段定义
 */
export const updatePayrollComponentDefinition = async (id: number, data: any) => {
  const url = `/config/payroll-component-definitions/${id}`;
  const response = await apiClient.put(url, data);
  return response.data;
};

/**
 * 删除薪资字段定义
 * @param id 组件ID
 */
export const deletePayrollComponentDefinition = async (id: number) => {
  const url = `/config/payroll-component-definitions/${id}`;
  await apiClient.delete(url);
}; 