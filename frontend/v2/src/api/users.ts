import apiClient from './index';
import type { User, ApiResponse } from './types'; // 假设 User 类型已定义

// 获取用户列表
// 假设 API 返回 ApiResponse<User[]> 结构
export const getUsers = async (params?: { page?: number; size?: number; [key: string]: any }): Promise<ApiResponse<User[]>> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/users', { params });
  return response.data;
};

// 获取单个用户信息
export const getUserInfo = async (userId: string | number): Promise<User> => {
  // 假设 API 直接返回 User 对象，如果也返回 ApiResponse<User>，则需要调整
  const response = await apiClient.get<User>(`/users/${userId}`);
  return response.data;
};

// 创建用户
export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string; // 通常在创建时需要
  is_active?: boolean;
  roles?: (string | number)[]; // 角色 ID 列表或角色代码列表
  employee_id?: string | number;
  // ... 其他需要的字段
}
export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const response = await apiClient.post<User>('/users', payload);
  return response.data;
};

// 更新用户
export interface UpdateUserPayload {
  // 通常 id 在路径中，payload 中是可更新的字段
  username?: string;
  email?: string;
  is_active?: boolean;
  roles?: (string | number)[];
  employee_id?: string | number;
  // ...
}
export const updateUser = async (userId: string | number, payload: UpdateUserPayload): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}`, payload);
  return response.data;
};

// 删除用户
export const deleteUser = async (userId: string | number): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
  // 通常删除操作返回 204 No Content，所以没有响应体
}; 