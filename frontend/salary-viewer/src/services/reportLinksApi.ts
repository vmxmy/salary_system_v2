import apiClient from './api';

// 报表链接API服务
export const reportLinksApi = {
  // 获取报表链接列表
  getReportLinks: async (params?: { skip?: number; limit?: number; activeOnly?: boolean; category?: string }) => {
    const response = await apiClient.get('/api/report-links', { params });
    return response.data;
  },
  
  // 获取活跃的报表链接（用于菜单）
  getActiveReportLinks: async (category?: string) => {
    const response = await apiClient.get('/api/report-links/active', { params: { category } });
    return response.data;
  },
  
  // 获取单个报表链接
  getReportLink: async (id: number) => {
    const response = await apiClient.get(`/api/report-links/${id}`);
    return response.data;
  },
  
  // 创建报表链接
  createReportLink: async (reportLink: any) => {
    const response = await apiClient.post('/api/report-links', reportLink);
    return response.data;
  },
  
  // 更新报表链接
  updateReportLink: async (id: number, reportLink: any) => {
    const response = await apiClient.put(`/api/report-links/${id}`, reportLink);
    return response.data;
  },
  
  // 删除报表链接
  deleteReportLink: async (id: number) => {
    const response = await apiClient.delete(`/api/report-links/${id}`);
    return response.data;
  }
};

export default reportLinksApi; 