import apiClient from './api';

// 表格布局配置接口
export interface TableLayoutConfig {
  id?: number;
  table_id: string;
  name: string;
  config_data: {
    columns: any[];
    filters?: any[];
  };
  is_default?: boolean;
  is_shared?: boolean;
}

// 筛选方案配置接口
export interface FilterPresetConfig {
  id?: number;
  table_id: string;
  name: string;
  config_data: {
    groups?: any[];
    filters?: any[];
    [key: string]: any; // 允许任意其他属性
  };
  is_default?: boolean;
  is_shared?: boolean;
}

// 服务器响应接口
export interface TableConfigResponse extends TableLayoutConfig {
  id: number;
  user_id: number;
  config_type: string;
  created_at: string;
  updated_at: string;
}

/**
 * 获取表格布局配置列表
 * @param tableId 表格ID
 * @returns 布局配置列表
 */
export const fetchTableLayouts = async (tableId: string): Promise<TableConfigResponse[]> => {
  try {
    console.log(`Fetching table layouts for table_id: ${tableId}`);
    const response = await apiClient.get<TableConfigResponse[]>('/api/table-configs/layouts', {
      params: { table_id: tableId }
    });
    console.log(`Fetched ${response.data?.length || 0} layouts`);
    
    // 检查是否有默认布局
    const defaultLayout = response.data?.find(layout => layout.is_default);
    if (defaultLayout) {
      console.log('Found default layout:', defaultLayout.name, 'ID:', defaultLayout.id);
      console.log('Default layout has columns:', defaultLayout.config_data?.columns?.length || 0);
    } else {
      console.log('No default layout found');
    }
    
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to fetch table layouts:', error);
    console.error('Error details:', error.response?.data || error.message);
    return [];
  }
};

/**
 * 创建表格布局配置
 * @param layout 布局配置
 * @returns 创建的布局配置
 */
export const createTableLayout = async (layout: TableLayoutConfig): Promise<TableConfigResponse | null> => {
  try {
    console.log('API call - Creating table layout with data:', JSON.stringify(layout, null, 2));

    // 验证数据
    if (!layout.config_data || !layout.config_data.columns || layout.config_data.columns.length === 0) {
      console.error('Invalid layout data: columns array is empty or missing');
      return null;
    }

    const response = await apiClient.post<TableConfigResponse>('/api/table-configs/layouts', layout);
    console.log('API response - Created table layout:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create table layout:', error);
    return null;
  }
};

/**
 * 更新表格布局配置
 * @param id 配置ID
 * @param layout 布局配置
 * @returns 更新后的布局配置
 */
export const updateTableLayout = async (id: number, layout: Partial<TableLayoutConfig>): Promise<TableConfigResponse | null> => {
  try {
    console.log(`API call - Updating table layout ${id} with data:`, JSON.stringify(layout, null, 2));
    console.log(`Columns count in update request: ${layout.config_data?.columns?.length || 0}`);

    // 验证数据
    if (layout.config_data) {
      if (!layout.config_data.columns || layout.config_data.columns.length === 0) {
        console.error('Invalid layout data: columns array is empty or missing');
        return null;
      }
      
      // 检查columns数组中的项是否有效
      const invalidColumns = layout.config_data.columns.filter(col => !col.key || !col.dataIndex);
      if (invalidColumns.length > 0) {
        console.error('Invalid columns found:', invalidColumns);
        console.log('First few valid columns:', layout.config_data.columns.slice(0, 3));
      }
    }

    console.log(`Making API PUT request to: /api/table-configs/layouts/${id}`);
    const response = await apiClient.put<TableConfigResponse>(`/api/table-configs/layouts/${id}`, layout);
    console.log('API response status:', response.status);
    console.log('API response - Updated table layout:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update table layout ${id}:`, error);
    console.error('Error details:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    return null;
  }
};

/**
 * 删除表格布局配置
 * @param id 配置ID
 * @returns 是否删除成功
 */
export const deleteTableLayout = async (id: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/api/table-configs/layouts/${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete table layout ${id}:`, error);
    return false;
  }
};

/**
 * 获取筛选方案配置列表
 * @param tableId 表格ID
 * @returns 筛选方案配置列表
 */
export const fetchFilterPresets = async (tableId: string): Promise<TableConfigResponse[]> => {
  try {
    const response = await apiClient.get<TableConfigResponse[]>('/api/table-configs/filters', {
      params: { table_id: tableId }
    });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch filter presets:', error);
    return [];
  }
};

/**
 * 创建筛选方案配置
 * @param preset 筛选方案配置
 * @returns 创建的筛选方案配置
 */
export const createFilterPreset = async (preset: FilterPresetConfig): Promise<TableConfigResponse | null> => {
  try {
    const response = await apiClient.post<TableConfigResponse>('/api/table-configs/filters', preset);
    return response.data;
  } catch (error) {
    console.error('Failed to create filter preset:', error);
    return null;
  }
};

/**
 * 更新筛选方案配置
 * @param id 配置ID
 * @param preset 筛选方案配置
 * @returns 更新后的筛选方案配置
 */
export const updateFilterPreset = async (id: number, preset: Partial<FilterPresetConfig>): Promise<TableConfigResponse | null> => {
  try {
    const response = await apiClient.put<TableConfigResponse>(`/api/table-configs/filters/${id}`, preset);
    return response.data;
  } catch (error) {
    console.error(`Failed to update filter preset ${id}:`, error);
    return null;
  }
};

/**
 * 删除筛选方案配置
 * @param id 配置ID
 * @returns 是否删除成功
 */
export const deleteFilterPreset = async (id: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/api/table-configs/filters/${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete filter preset ${id}:`, error);
    return false;
  }
};