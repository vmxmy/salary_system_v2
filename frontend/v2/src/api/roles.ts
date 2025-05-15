import apiClient from './index';
import type { Role, ApiResponse, Permission, CreateRolePayload, UpdateRolePayload } from './types'; // 假设 Role 和 Permission 类型已定义

// 获取角色列表
// 假设 API 返回 ApiResponse<Role[]> 结构
export const getRoles = async (params?: { page?: number; size?: number; [key: string]: any }): Promise<ApiResponse<Role[]>> => {
  const response = await apiClient.get<ApiResponse<Role[]>>('/roles', { params });
  return response.data;
};

// 获取单个角色信息
export const getRoleInfo = async (roleId: number): Promise<Role> => {
  // 确保后端返回的是 Role 对象，而不是 Dict[str, Role]
  // 如果后端返回 { data: Role }, 则需要 response.data.data
  // 当前后端 GET /roles/{role_id} 返回的是 Dict[str, Role] 即 { data: Role }
  const response = await apiClient.get<ApiResponse<Role>>(`/roles/${roleId}`);
  return response.data.data; // Adjusted to access nested data object
};

// 创建角色
export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  // 后端 POST /roles 返回的是 Dict[str, Role] 即 { data: Role }
  const response = await apiClient.post<ApiResponse<Role>>('/roles', payload);
  return response.data.data; // Adjusted to access nested data object
};

// 更新角色
export const updateRole = async (roleId: number, payload: UpdateRolePayload): Promise<Role> => { // Changed roleId type to number
  // 后端 PUT /roles/{role_id} 返回的是 Dict[str, Role] 即 { data: Role }
  const response = await apiClient.put<ApiResponse<Role>>(`/roles/${roleId}`, payload);
  return response.data.data; // Adjusted to access nested data object
};

// 删除角色
export const deleteRole = async (roleId: number): Promise<void> => { // Changed roleId type to number
  await apiClient.delete(`/roles/${roleId}`);
};

// 获取角色拥有的权限列表
export const getRolePermissions = async (roleId: number): Promise<Permission[]> => {
  // 后端 GET /v2/roles/{role_id}/permissions 直接返回 Permission[]
  const response = await apiClient.get<Permission[]>(`/roles/${roleId}/permissions`);
  return response.data; 
};

// (可选) 获取所有可用权限列表
export const getPermissions = async (params?: { page?: number; size?: number; search?: string }): Promise<ApiResponse<Permission[]>> => {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/permissions', { params }); // 假设权限列表端点
    return response.data;
}; 