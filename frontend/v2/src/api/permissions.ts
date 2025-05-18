import api from './index';
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload, ApiResponse } from './types';

const API_BASE_URL = '/permissions'; // Assuming /v2 prefix is handled by the axios instance

/**
 * Fetches all permissions.
 */
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await api.get<ApiResponse<Permission[]>>(`${API_BASE_URL}/`, {
    params: { pageSize: 200 }
  });
  // Assuming the backend returns a list directly or within a 'data' property matching ApiResponse
  // Adjust based on actual backend structure. If it's not wrapped in ApiResponse, use: api.get<Permission[]>
  // If it's { data: Permission[], total: number }, then: response.data.data
  // For now, assuming it's like other services: `ApiResponse<Permission[]>` for consistency
  // The backend /v2/permissions likely returns List[PermissionRead] which is List[Permission]
  return response.data.data; // Assuming { data: Permission[] }
};

/**
 * Creates a new permission.
 */
export const createPermission = async (payload: CreatePermissionPayload): Promise<Permission> => {
  const response = await api.post<ApiResponse<Permission>>(`${API_BASE_URL}/`, payload);
  return response.data.data; // Assuming a single Permission object is in response.data.data
};

/**
 * Updates an existing permission.
 */
export const updatePermission = async (permissionId: number, payload: UpdatePermissionPayload): Promise<Permission> => {
  const response = await api.put<ApiResponse<Permission>>(`${API_BASE_URL}/${permissionId}`, payload);
  return response.data.data; // Assuming a single Permission object is in response.data.data
};

/**
 * Deletes a permission.
 */
export const deletePermission = async (permissionId: number): Promise<void> => {
  await api.delete(`${API_BASE_URL}/${permissionId}`);
  // No specific response data expected for a successful delete, typically a 204 No Content
}; 