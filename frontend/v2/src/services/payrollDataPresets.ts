// 工资数据模态框预设配置API服务

import apiClient from '../api/apiClient';
import type {
  PayrollDataModalPreset,
  PresetSaveRequest,
  PresetListResponse,
  PresetCategory
} from '../types/payrollDataPresets';

const API_BASE = '/config/user-preferences';

export const payrollDataPresetsApi = {
  // 获取用户的预设列表
  async getPresets(): Promise<PresetListResponse> {
    const response = await apiClient.get(`${API_BASE}/payroll-data-modal`);
    return response.data;
  },

  // 获取预设分类
  async getPresetCategories(): Promise<PresetCategory[]> {
    const response = await apiClient.get(`${API_BASE}/payroll-data-modal/categories`);
    return response.data;
  },

  // 保存新预设
  async savePreset(data: PresetSaveRequest): Promise<PayrollDataModalPreset> {
    const response = await apiClient.post(`${API_BASE}/payroll-data-modal`, data);
    return response.data;
  },

  // 更新预设
  async updatePreset(id: number, data: Partial<PresetSaveRequest>): Promise<PayrollDataModalPreset> {
    const response = await apiClient.put(`${API_BASE}/payroll-data-modal/${id}`, data);
    return response.data;
  },

  // 删除预设
  async deletePreset(id: number): Promise<void> {
    await apiClient.delete(`${API_BASE}/payroll-data-modal/${id}`);
  },

  // 应用预设（记录使用统计）
  async applyPreset(id: number): Promise<PayrollDataModalPreset> {
    const response = await apiClient.post(`${API_BASE}/payroll-data-modal/${id}/apply`);
    return response.data;
  },

  // 复制预设
  async duplicatePreset(id: number, newName: string): Promise<PayrollDataModalPreset> {
    const response = await apiClient.post(`${API_BASE}/payroll-data-modal/${id}/duplicate`, { newName });
    return response.data;
  },

  // 设置默认预设
  async setDefaultPreset(id: number): Promise<void> {
    await apiClient.post(`${API_BASE}/payroll-data-modal/${id}/set-default`);
  },

  // 获取默认预设
  async getDefaultPreset(): Promise<PayrollDataModalPreset | null> {
    try {
      const response = await apiClient.get(`${API_BASE}/payroll-data-modal/default`);
      return response.data;
    } catch (error) {
      // 如果没有默认预设，返回null
      return null;
    }
  },

  // 导出预设
  async exportPreset(id: number): Promise<Blob> {
    const response = await apiClient.get(`${API_BASE}/payroll-data-modal/${id}/export`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // 导入预设
  async importPreset(file: File): Promise<PayrollDataModalPreset> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`${API_BASE}/payroll-data-modal/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}; 