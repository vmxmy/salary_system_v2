import apiClient from './apiClient';
// import type { TableParams } from '../types/antd'; // No longer using full TableParams directly for query
import type { JobTitle, CreateJobTitlePayload, UpdateJobTitlePayload, JobTitleListResponse } from './types';

/**
 * Interface for the query parameters accepted by the GET /job-titles API endpoint.
 */
export interface GetJobTitlesApiParams {
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
 * Get a paginated list of job titles.
 * @param apiParams Parameters for pagination, filtering, sorting directly matching API query params
 */
export const getJobTitles = async (apiParams: GetJobTitlesApiParams): Promise<JobTitleListResponse> => {
  console.log('getJobTitles API params:', apiParams);
  // 确保URL正确
  console.log('API URL:', '/job-titles');
  const response = await apiClient.get<JobTitleListResponse>('/job-titles', { params: apiParams });
  console.log('getJobTitles API response:', response.data);
  return response.data;
};

/**
 * Get a single job title by its ID.
 * @param id The ID of the job title
 */
export const getJobTitleById = async (id: number): Promise<{data: JobTitle}> => {
  const response = await apiClient.get<{data: JobTitle}>(`/job-titles/${id}`);
  return response.data;
};

/**
 * Create a new job title.
 * @param payload Data for creating the job title
 */
export const createJobTitle = async (payload: CreateJobTitlePayload): Promise<{data: JobTitle}> => {
  const response = await apiClient.post<{data: JobTitle}>('/job-titles', payload);
  return response.data;
};

/**
 * Update an existing job title.
 * @param id The ID of the job title to update
 * @param payload Data for updating the job title
 */
export const updateJobTitle = async (id: number, payload: UpdateJobTitlePayload): Promise<{data: JobTitle}> => {
  const response = await apiClient.put<{data: JobTitle}>(`/job-titles/${id}`, payload);
  return response.data;
};

/**
 * Delete a job title by its ID.
 * @param id The ID of the job title to delete
 */
export const deleteJobTitle = async (id: number): Promise<void> => {
  await apiClient.delete(`/job-titles/${id}`);
};

/**
 * Fetches all job titles in a flat list, typically for dropdowns/selectors.
 * This might involve multiple paginated calls if the number of job titles is large.
 * A more efficient backend endpoint (/job-titles/all-flat) would be preferable for large datasets.
 */
export const getAllJobTitlesFlat = async (): Promise<JobTitle[]> => {
  const allJobTitles: JobTitle[] = [];
  let currentPage = 1;
  const pageSize = 100; // Max size per backend limit
  let totalPages = 1;

  do {
    try {
      // 添加非空的search参数，确保获取所有职位，而不仅仅是顶级职位
      const response = await getJobTitles({
        page: currentPage,
        size: pageSize,
        is_active: true,
        search: ' ', // 添加非空的search参数，确保后端不会过滤只返回顶级职位
      });
      console.log('getAllJobTitlesFlat response:', response);
      allJobTitles.push(...response.data);
      totalPages = response.meta.totalPages;
      currentPage++;
    } catch (error) {
      console.error('Failed to fetch a page of job titles for flat list:', error);
      // Depending on requirements, you might want to re-throw or return partial data
      break; // Stop fetching on error
    }
  } while (currentPage <= totalPages);

  console.log('getAllJobTitlesFlat result:', allJobTitles);
  return allJobTitles;
};