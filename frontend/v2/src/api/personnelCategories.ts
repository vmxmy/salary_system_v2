import apiClient from './apiClient';
// import type { TableParams } from '../types/antd'; // No longer using full TableParams directly for query
import type { PersonnelCategory, CreatePersonnelCategoryPayload, UpdatePersonnelCategoryPayload, PersonnelCategoryListResponse } from './types';

/**
 * Interface for the query parameters accepted by the GET /personnel-categories API endpoint.
 */
export interface GetPersonnelCategoriesApiParams {
  page?: number;
  size?: number;
  parent_id?: number | null;
  search?: string;
  is_active?: boolean;
  // Add other specific filter/sort params the API supports, e.g.:
  // sort_by?: string; (maps to your sortField)
  // sort_order?: 'asc' | 'desc'; (maps to your sortOrder)
}

/**
 * Get a list of personnel categories with pagination, search, and filtering.
 * Corresponds to the GET /personnel-categories endpoint.
 * @param params Query parameters for fetching personnel categories
 */
export const getPersonnelCategories = async (params: GetPersonnelCategoriesApiParams): Promise<PersonnelCategoryListResponse> => {
  // Construct query string from params, handling potential undefined values
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', String(params.page));
  if (params.size !== undefined) queryParams.append('size', String(params.size));
  if (params.parent_id !== undefined && params.parent_id !== null) queryParams.append('parent_id', String(params.parent_id));
  if (params.search) queryParams.append('search', params.search);
  if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
  // Add other params as needed

  const queryString = queryParams.toString();
  const response = await apiClient.get<PersonnelCategoryListResponse>(`/personnel-categories${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

/**
 * Get a single personnel category by its ID.
 * @param id The ID of the personnel category
 */
export const getPersonnelCategoryById = async (id: number): Promise<{data: PersonnelCategory}> => {
  const response = await apiClient.get<{data: PersonnelCategory}>(`/personnel-categories/${id}`);
  return response.data;
};

/**
 * Create a new personnel category.
 * @param payload Data for creating the personnel category
 */
export const createPersonnelCategory = async (payload: CreatePersonnelCategoryPayload): Promise<{data: PersonnelCategory}> => {
  const response = await apiClient.post<{data: PersonnelCategory}>('/personnel-categories', payload);
  return response.data;
};

/**
 * Update an existing personnel category.
 * @param id The ID of the personnel category to update
 * @param payload Data for updating the personnel category
 */
export const updatePersonnelCategory = async (id: number, payload: UpdatePersonnelCategoryPayload): Promise<{data: PersonnelCategory}> => {
  const response = await apiClient.put<{data: PersonnelCategory}>(`/personnel-categories/${id}`, payload);
  return response.data;
};

/**
 * Delete a personnel category by its ID.
 * @param id The ID of the personnel category to delete
 */
export const deletePersonnelCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/personnel-categories/${id}`);
};

/**
 * Fetches all personnel categories in a flat list, typically for dropdowns/selectors.
 * This might involve multiple paginated calls if the number of personnel categories is large.
 * A more efficient backend endpoint (/personnel-categories/all-flat) would be preferable for large datasets.
 */
export const getAllPersonnelCategoriesFlat = async (): Promise<PersonnelCategory[]> => {
  const allPersonnelCategories: PersonnelCategory[] = [];
  let currentPage = 1;
  const pageSize = 100; // Max size per backend limit
  let totalPages = 1;

  do {
    try {
      // Adding a non-empty search or a specific flag if the backend supports fetching all vs. only top-level
      const response = await getPersonnelCategories({
        page: currentPage,
        size: pageSize,
        is_active: true,
        // search: ' ', // A non-empty search might bypass parent_id=null filtering if backend behaves that way
                        // Or, ideally, backend provides a way to fetch all regardless of hierarchy for lookups.
                        // For now, assuming getPersonnelCategories without parent_id fetches all roots, and we need to traverse.
                        // This flat fetch might be better served by a dedicated backend endpoint if not careful.
      });
      allPersonnelCategories.push(...response.data);
      totalPages = response.meta.totalPages;
      currentPage++;
    } catch (error) {
      // Depending on requirements, you might want to re-throw or return partial data
      break; // Stop fetching on error
    }
  } while (currentPage <= totalPages);

  return allPersonnelCategories;
};

/**
 * Get personnel categories tree structure.
 * Fetches all personnel categories in a hierarchical tree structure.
 * @param is_active Optional filter for active/inactive categories
 */
export const getPersonnelCategoriesTree = async (is_active?: boolean): Promise<{data: PersonnelCategory[]}> => {
  const queryParams = new URLSearchParams();
  if (is_active !== undefined) {
    queryParams.append('is_active', String(is_active));
  }
  
  const queryString = queryParams.toString();
  const response = await apiClient.get<{data: PersonnelCategory[]}>(`/personnel-categories/tree${queryString ? `?${queryString}` : ''}`);
  return response.data;
};