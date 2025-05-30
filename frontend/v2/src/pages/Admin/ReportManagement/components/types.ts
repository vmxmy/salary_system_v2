import type { TabsProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { 
  DataSource, 
  DataSourceField, 
  DataSourceCreateRequest, 
  DataSourceUpdateRequest,
  DetectedField,
  FieldDetectionRequest,
  ConnectionTestRequest 
} from '../../../../api/reports';

// 组件Props类型定义
export interface DataSourceEditProps {
  mode?: 'create' | 'edit';
}

export interface DataSourceFormConfiguratorProps {
  form: any;
  mode: 'create' | 'edit';
  dataSource?: DataSource | null;
}

export interface DataPreviewTableProps {
  dataSourceId?: number;
  fields: DataSourceField[];
}

export interface APIConnectionSettingsProps {
  form: any;
  connectionStatus: ConnectionStatus;
  onTestConnection: () => Promise<void>;
  onDetectFields: () => Promise<void>;
  testingConnection: boolean;
  detectingFields: boolean;
}

export interface TestConnectionButtonProps {
  loading: boolean;
  onClick: () => Promise<void>;
}

// 状态类型定义
export interface ConnectionStatus {
  tested: boolean;
  success: boolean;
  message: string;
  responseTime?: number;
}

export interface FieldModalState {
  visible: boolean;
  currentField: Partial<DataSourceField> | null;
}

// 导出API相关类型
export type {
  DataSource,
  DataSourceField,
  DataSourceCreateRequest,
  DataSourceUpdateRequest,
  DetectedField,
  FieldDetectionRequest,
  ConnectionTestRequest,
  TabsProps,
  ColumnsType
}; 