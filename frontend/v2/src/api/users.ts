import apiClient from './index';
import type { User, ApiResponse, Role, CreateUserPayload, UpdateUserPayload } from './types'; // Added CreateUserPayload, UpdateUserPayload

// 获取用户管理
// 假设 API 返回 ApiResponse<User[]> 结构
export const getUsers = async (params?: { page?: number; size?: number; [key: string]: any }): Promise<ApiResponse<User[]>> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/users', { params });
  return response.data;
};

// 获取单个用户信息
export const getUserInfo = async (userId: number): Promise<User> => { // Changed userId type to number
  // Backend GET /users/{user_id} returns Dict[str, User] -> { data: User }
  const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
  return response.data.data; // Adjusted to access nested data object
};

// 创建用户
export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  // Backend POST /users returns Dict[str, User] -> { data: User }
  const response = await apiClient.post<ApiResponse<User>>('/users', payload);
  return response.data.data; // Adjusted to access nested data object
};

// 更新用户
export const updateUser = async (userId: number, payload: UpdateUserPayload): Promise<User> => { // Changed userId type to number
  // Backend PUT /users/{user_id} returns Dict[str, User] -> { data: User }
  const response = await apiClient.put<ApiResponse<User>>(`/users/${userId}`, payload);
  return response.data.data; // Adjusted to access nested data object
};

// 删除用户
export const deleteUser = async (userId: number): Promise<void> => { // Changed userId type to number
  await apiClient.delete(`/users/${userId}`);
};

// 为用户分配角色列表
export const assignRolesToUser = async (userId: number, roleIds: number[]): Promise<User> => {
  // Backend POST /users/{user_id}/roles returns Dict[str, User] -> { data: User }
  const response = await apiClient.post<ApiResponse<User>>(`/users/${userId}/roles`, { role_ids: roleIds });
  return response.data.data; // Adjusted to access nested data object
};

// 获取用户拥有的角色列表
export const getUserRoles = async (userId: number): Promise<Role[]> => {
  // Backend GET /users/{user_id}/roles directly returns Role[]
  const response = await apiClient.get<Role[]>(`/users/${userId}/roles`);
  return response.data;
}; 