import apiClient from './index';
import type { Role, ApiResponse, Permission } from './types'; // 假设 Role 和 Permission 类型已定义

// 获取角色列表
// 假设 API 返回 ApiResponse<Role[]> 结构
export const getRoles = async (params?: { page?: number; size?: number; [key: string]: any }): Promise<ApiResponse<Role[]>> => {
  const response = await apiClient.get<ApiResponse<Role[]>>('/roles', { params });
  return response.data;
};

// 获取单个角色信息
export const getRoleInfo = async (roleId: string | number): Promise<Role> => {
  const response = await apiClient.get<Role>(`/roles/${roleId}`);
  return response.data;
};

// 创建角色
export interface CreateRolePayload {
  name: string;
  code?: string;
  permissions?: (string | number)[]; // 权限 ID 列表或权限代码列表
}
export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  const response = await apiClient.post<Role>('/roles', payload);
  return response.data;
};

// 更新角色
export interface UpdateRolePayload {
  name?: string;
  code?: string;
  permissions?: (string | number)[];
}
export const updateRole = async (roleId: string | number, payload: UpdateRolePayload): Promise<Role> => {
  const response = await apiClient.put<Role>(`/roles/${roleId}`, payload);
  return response.data;
};

// 删除角色
export const deleteRole = async (roleId: string | number): Promise<void> => {
  await apiClient.delete(`/roles/${roleId}`);
};

// (可选) 获取所有可用权限列表
export const getPermissions = async (): Promise<ApiResponse<Permission[]>> => {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/permissions'); // 假设权限列表端点
    return response.data;
}; 