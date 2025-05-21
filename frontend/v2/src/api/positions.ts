import axios from 'axios';
import apiClient from './apiClient';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from './types';

// 统一API路径，确保与后端一致
const API_PATH = '/positions';

// 获取职位列表
export interface GetPositionsApiParams {
  search?: string;
  size?: number;
  page?: number;
  is_active?: boolean;
}

export const getPositions = async (params: GetPositionsApiParams = {}) => {
  const { search = '', size = 100, page = 1, is_active = undefined } = params;
  const queryParams = new URLSearchParams();
  
  if (search) queryParams.append('search', search);
  if (size) queryParams.append('size', size.toString());
  if (page) queryParams.append('page', page.toString());
  if (is_active !== undefined) queryParams.append('is_active', is_active.toString());
  
  try {
    console.log(`Fetching positions with URL: ${API_PATH}?${queryParams.toString()}`);
    const response = await apiClient.get(`${API_PATH}?${queryParams.toString()}`);
    console.log('Positions fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching positions:', error);
    // 增加更详细的错误信息
    if (axios.isAxiosError(error) && error.response) {
      console.error(`API Error (${error.response.status}):`, {
        url: error.config?.url,
        data: error.response.data
      });
    }
    throw error;
  }
};

// 获取单个职位详情
export const getPositionById = async (id: number) => {
  try {
    console.log(`Fetching position with ID: ${id}`);
    const response = await apiClient.get(`${API_PATH}/${id}`);
    console.log(`Position with ID ${id} fetched successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching position with id ${id}:`, error);
    throw error;
  }
};

// 创建职位
export const createPosition = async (positionData: CreatePositionPayload): Promise<any> => {
  try {
    console.log('Creating position with data:', positionData);
    console.log(`Using API path: ${API_PATH}`);
    
    const response = await apiClient.post(API_PATH, positionData);
    console.log('Position created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating position:', error);
    
    // 详细错误日志
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 服务器返回了错误响应
        console.error(`Server Error (${error.response.status}):`, {
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Request setup error:', error.message);
      }
    }
    
    throw error;
  }
};

// 更新职位
export const updatePosition = async (id: number, positionData: UpdatePositionPayload) => {
  try {
    console.log(`Updating position ${id} with data:`, positionData);
    console.log(`Using API path: ${API_PATH}/${id}`);
    
    const response = await apiClient.put(`${API_PATH}/${id}`, positionData);
    console.log('Position updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating position with id ${id}:`, error);
    // 详细错误日志
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Server Error (${error.response.status}):`, {
        endpoint: `${API_PATH}/${id}`,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
};

// 删除职位
export const deletePosition = async (id: number) => {
  try {
    console.log(`Deleting position with id: ${id}`);
    console.log(`Using API path: ${API_PATH}/${id}`);
    
    const response = await apiClient.delete(`${API_PATH}/${id}`);
    console.log('Position deleted successfully');
    return response.data;
  } catch (error) {
    console.error(`Error deleting position with id ${id}:`, error);
    // 详细错误日志
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Server Error (${error.response.status}):`, {
        endpoint: `${API_PATH}/${id}`,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
};

// 获取所有职位（扁平列表，用于选择器）
export const getAllPositionsFlat = async (is_active: boolean = true) => {
  const queryParams = new URLSearchParams();
  queryParams.append('size', '1000');
  if (is_active !== undefined) queryParams.append('is_active', is_active.toString());
  
  try {
    const response = await apiClient.get(`${API_PATH}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all positions flat:', error);
    throw error;
  }
}; 