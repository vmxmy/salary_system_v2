import apiClient from '../api/apiClient';

// 表格列配置接口
export interface TableColumnConfig {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  sorter?: boolean;
  search?: boolean;
  valueType?: string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  required?: boolean;
  visible?: boolean;
}

// 表格配置响应接口
export interface TableConfigResponse {
  columns: TableColumnConfig[];
  all_columns: Record<string, TableColumnConfig>;
  visible_columns: string[];
  column_order: string[];
}

// 获取表格列配置
export const getTableColumnsConfig = async (tableId: string): Promise<TableConfigResponse> => {
  const response = await apiClient.get(`/table-config/columns/${tableId}`);
  return response.data.data;
};

// 保存表格列配置
export const saveTableColumnsConfig = async (
  tableId: string,
  configData: {
    visible_columns: string[];
    column_order: string[];
  },
  configName: string = 'default'
): Promise<{ id: number; message: string }> => {
  const response = await apiClient.post(`/table-config/columns/${tableId}`, configData, {
    params: { config_name: configName }
  });
  return response.data.data;
}; 