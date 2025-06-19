// 预设分组管理API服务

import apiClient from '../api/apiClient';
import type { PresetGroup } from '../types/payrollDataPresets';

const API_BASE = '/config/user-preferences/groups';

export interface PresetGroupCreateRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface PresetGroupUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface PresetGroupListResponse {
  groups: PresetGroup[];
  total: number;
}

export interface PresetGroupStatsResponse {
  groupId: number;
  presetCount: number;
  lastUsedAt?: string;
}

export const presetGroupsApi = {
  // 获取用户的分组列表
  async getGroups(): Promise<PresetGroupListResponse> {
    const response = await apiClient.get(`${API_BASE}`);
    return response.data;
  },

  // 获取分组统计信息（包含预设数量）
  async getGroupsStats(): Promise<PresetGroupStatsResponse[]> {
    const response = await apiClient.get(`${API_BASE}/stats`);
    return response.data;
  },

  // 创建新分组
  async createGroup(data: PresetGroupCreateRequest): Promise<PresetGroup> {
    const response = await apiClient.post(`${API_BASE}`, data);
    return response.data;
  },

  // 更新分组
  async updateGroup(id: number, data: PresetGroupUpdateRequest): Promise<PresetGroup> {
    const response = await apiClient.put(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // 删除分组
  async deleteGroup(id: number): Promise<void> {
    await apiClient.delete(`${API_BASE}/${id}`);
  },

  // 更新分组排序
  async updateGroupsOrder(groupIds: number[]): Promise<void> {
    await apiClient.put(`${API_BASE}/reorder`, { groupIds });
  },

  // 获取单个分组的详细信息
  async getGroup(id: number): Promise<PresetGroup> {
    const response = await apiClient.get(`${API_BASE}/${id}`);
    return response.data;
  }
};