import apiClient from './apiClient';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload, DepartmentListResponse } from './types';

/**
 * Interface for the query parameters accepted by the GET /departments API endpoint.
 */
export interface GetDepartmentsApiParams {
  page?: number;
  size?: number;
  parent_id?: number | null;
  is_active?: boolean;
  search?: string;
  // sort_by?: string;
  // sort_order?: 'asc' | 'desc';
}

/**
 * Get a paginated list of departments.
 * @param apiParams Parameters for pagination, filtering, sorting
 */
export const getDepartments = async (apiParams: GetDepartmentsApiParams): Promise<DepartmentListResponse> => {
  const response = await apiClient.get<DepartmentListResponse>('/departments', { params: apiParams });
  return response.data;
};

/**
 * Get a single department by its ID.
 * @param id The ID of the department
 */
export const getDepartmentById = async (id: number): Promise<{data: Department}> => {
  const response = await apiClient.get<{data: Department}>(`/departments/${id}`);
  return response.data;
};

/**
 * Create a new department.
 * @param payload Data for creating the department
 */
export const createDepartment = async (payload: CreateDepartmentPayload): Promise<{data: Department}> => {
  const response = await apiClient.post<{data: Department}>('/departments', payload);
  return response.data;
};

/**
 * Update an existing department.
 * @param id The ID of the department to update
 * @param payload Data for updating the department
 */
export const updateDepartment = async (id: number, payload: UpdateDepartmentPayload): Promise<{data: Department}> => {
  const response = await apiClient.put<{data: Department}>(`/departments/${id}`, payload);
  return response.data;
};

/**
 * Delete a department by its ID.
 * @param id The ID of the department to delete
 */
export const deleteDepartment = async (id: number): Promise<void> => {
  await apiClient.delete(`/departments/${id}`);
};

/**
 * Fetches all departments in a flat list, typically for dropdowns/selectors.
 * This might involve multiple paginated calls if the number of departments is large.
 * A more efficient backend endpoint (/departments/all-flat) would be preferable for large datasets.
 */
export const getAllDepartmentsFlat = async (): Promise<Department[]> => {
  const allDepartments: Department[] = [];
  let currentPage = 1;
  const pageSize = 100; // Max size per backend limit
  let totalPages = 1;

  do {
    try {
      const response = await getDepartments({ page: currentPage, size: pageSize, is_active: true }); // Fetch only active for selectors typically
      allDepartments.push(...response.data);
      totalPages = response.meta.totalPages;
      currentPage++;
    } catch (error) {
      console.error('Failed to fetch a page of departments for flat list:', error);
      // Depending on requirements, you might want to re-throw or return partial data
      break; // Stop fetching on error
    }
  } while (currentPage <= totalPages);

  return allDepartments;
}; 