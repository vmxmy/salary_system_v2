// 数据源定义
export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: 'table' | 'view' | 'query';
  fields: FieldItem[];
  fieldGroups?: FieldGroup[]; // 字段分组（可选）
  queryConfig?: CustomQueryConfig; // 自定义查询配置
  // 新增：数据源关联信息
  relationships?: DataSourceRelationship[];
}

// 字段分组定义
export interface FieldGroup {
  id: string;
  name: string;
  icon?: string; // 图标标识
  order?: number; // 显示顺序
  fields: string[]; // 字段名数组
}

// 字段项定义
export interface FieldItem {
  field_name: string;
  field_alias?: string;
  field_type: 'string' | 'number' | 'date' | 'boolean' | 'json';
  description?: string;
  is_calculated?: boolean;
  calculation_formula?: string;
  group?: string; // 所属分组ID
  icon?: string; // 自定义图标
  // 新增：关联字段信息
  is_foreign_key?: boolean;
  foreign_key_info?: ForeignKeyInfo;
  // 新增：字段来源信息（用于多数据源场景）
  source_data_source_id?: string;
  qualified_name?: string; // 完全限定名，如 "employees.name"
}

// 外键信息
export interface ForeignKeyInfo {
  referenced_table_schema: string;
  referenced_table_name: string;
  referenced_column_name: string;
  referenced_data_source_id?: string; // 引用的数据源ID
}

// 数据源关联关系
export interface DataSourceRelationship {
  id: string;
  source_data_source_id: string;
  source_field_name: string;
  target_data_source_id: string;
  target_field_name: string;
  relationship_type: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
  join_type: 'inner' | 'left' | 'right' | 'full';
  description?: string;
}

// 报表字段定义（扩展以支持多数据源）
export interface ReportField {
  id: string;
  field_name: string;
  field_alias: string;
  data_source: string;
  field_type: string;
  display_order: number;
  is_visible: boolean;
  is_sortable: boolean;
  is_filterable: boolean;
  width?: number;
  formatting_config?: {
    format_type?: 'number' | 'currency' | 'percentage' | 'date' | 'text';
    decimal_places?: number;
    prefix?: string;
    suffix?: string;
    date_format?: string;
    thousand_separator?: boolean;
  };
  calculation_formula?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  // 新增：多数据源支持
  qualified_field_name?: string; // 完全限定字段名
  source_data_source_id?: string; // 来源数据源ID
  // 新增：关联显示支持
  is_related_display?: boolean; // 是否为关联显示
  display_field?: string; // 实际显示的字段（可能是关联字段）
  related_join_config?: {
    target_data_source_id: string;
    target_field_name: string;
    join_field_name: string;
  };
}

// 报表配置（扩展以支持多数据源）
export interface ReportConfig {
  id?: number;
  title: string;
  description?: string;
  dataSource: string; // 主数据源
  fields: ReportField[];
  filters?: ReportFilter[];
  sorting?: ReportSorting[];
  grouping?: string[];
  pagination?: {
    pageSize: number;
    pageSizeOptions: number[];
  };
  // 新增：多数据源支持
  dataSources?: string[]; // 涉及的所有数据源ID
  joins?: DataSourceJoin[]; // 数据源连接配置
}

// 数据源连接配置
export interface DataSourceJoin {
  id: string;
  left_data_source_id: string;
  left_field_name: string;
  right_data_source_id: string;
  right_field_name: string;
  join_type: 'inner' | 'left' | 'right' | 'full';
  condition?: string; // 额外的连接条件
}

// 过滤器定义
export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between';
  value: any;
}

// 排序定义
export interface ReportSorting {
  field: string;
  order: 'asc' | 'desc';
}

// ProTable列配置扩展
export interface EnhancedColumn {
  dataIndex: string;
  title: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean;
  filters?: Array<{ text: string; value: any }>;
  valueType?: 'text' | 'money' | 'date' | 'dateTime' | 'digit' | 'percent';
  hideInSearch?: boolean;
  hideInTable?: boolean;
  render?: (text: any, record: any, index: number) => React.ReactNode;
}

// 查询参数定义 - 统一定义
export interface QueryParameter {
  name: string; // 参数名
  type: 'string' | 'number' | 'date' | 'boolean'; // 参数类型
  label?: string; // 显示标签（可选）
  required: boolean; // 是否必填
  defaultValue?: any; // 默认值
  options?: Array<{ label: string; value: any }>; // 选项列表（下拉框）
  description?: string; // 参数描述
}

// 自定义查询配置
export interface CustomQueryConfig {
  sql: string; // SQL查询语句
  parameters?: QueryParameter[]; // 查询参数
  connectionId?: string; // 数据库连接ID
  timeout?: number; // 查询超时时间（秒）
  maxRows?: number; // 最大返回行数
  cacheTTL?: number; // 缓存时间（秒）
}

// CustomQueryEditor 相关类型定义
export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export interface CustomQuery {
  id?: number;
  name: string;
  description?: string;
  sql: string;
  parameters: QueryParameter[];
  dataSource: string;
}

export interface CustomQueryEditorProps {
  initialQuery?: CustomQuery;
  dataSources: Array<{ value: string; label: string }>;
  onSave?: (query: CustomQuery) => void;
  onCancel?: () => void;
}

export interface QueryEditorHeaderProps {
  sql: string;
  parameters: QueryParameter[];
  executing: boolean;
  onFormat: () => void;
  onExecute: () => void;
  onSave: () => void;
  onCancel?: () => void;
}

export interface SQLEditorProps {
  sql: string;
  onChange: (sql: string) => void;
  onMount: (editor: any, monaco: any) => void;
  cursorPosition: { line: number; column: number };
  sqlStats: { lines: number; characters: number; words: number };
  executing: boolean;
}

export interface QueryParametersPanelProps {
  parameters: QueryParameter[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof QueryParameter, value: any) => void;
}

export interface QueryResultsPanelProps {
  queryResult: QueryResult | null;
  queryError: string;
  executing: boolean;
}

export interface QueryHelpPanelProps {
  // 帮助面板暂时不需要props
}

// Corresponds to backend ReportDesignerConfigPydantic
export interface ReportDesignerConfig {
  reportTitle?: string;
  reportDescription?: string;
  selectedDataSourceIds: string[];
  mainDataSourceId?: string;
  joins: DataSourceJoin[]; // Existing DataSourceJoin should be compatible
  fields: ReportField[];   // Existing ReportField should be compatible
  multiSelectMode: boolean;
  version?: number;
}

// Corresponds to backend ReportTemplateListItem
export interface ReportTemplateListItem {
  id: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  is_public: boolean;
  updated_at: string; // Dates are typically strings in JSON
  created_by?: number;
}

// Corresponds to backend ReportTemplate (for GET by ID, POST, PUT responses)
// This extends ReportTemplateListItem and adds the full config
export interface ReportTemplate extends ReportTemplateListItem {
  // name, title, description, category, is_public, updated_at, created_by are inherited
  // id is inherited
  template_config: ReportDesignerConfig;
  data_source_id?: number; //主数据源ID，可从 template_config.mainDataSourceId 获取
  usage_count?: number;
  created_at?: string;
  // related_fields from backend (List[ReportTemplateField]) can be ignored if frontend only uses template_config.fields
}

// For creating a new report template (POST /templates)
// Corresponds to backend ReportTemplateCreate
export interface ReportTemplateCreatePayload {
  name: string;
  title?: string;
  description?: string;
  category?: string;
  data_source_id?: number; // Optional, can be derived from template_config on backend or frontend
  template_config: ReportDesignerConfig;
  is_public?: boolean;
  sort_order?: number;
  is_active?: boolean; // Defaulted to true on backend if not provided
}

// For updating an existing report template (PUT /templates/{id})
// Corresponds to backend ReportTemplateUpdate
export interface ReportTemplateUpdatePayload {
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  data_source_id?: number;
  template_config?: Partial<ReportDesignerConfig>; // Allow partial updates to the config
  is_public?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

// The existing ReportConfig might need to be reviewed.
// It was used for the main state of the designer.
// It might be replaceable by ReportDesignerConfig or parts of ReportTemplate.
// For now, keeping it and we'll see how it integrates with loading/saving ReportTemplate.
export interface ReportConfig {
  id?: number; // if loaded from a template, this would be template.id
  title: string; // Corresponds to ReportDesignerConfig.reportTitle
  description?: string; // Corresponds to ReportDesignerConfig.reportDescription
  dataSource: string; // Corresponds to ReportDesignerConfig.mainDataSourceId or selectedDataSourceIds[0]
  fields: ReportField[]; // Corresponds to ReportDesignerConfig.fields
  filters?: ReportFilter[];
  sorting?: ReportSorting[];
  grouping?: string[];
  pagination?: {
    pageSize: number;
    pageSizeOptions: number[];
  };
  dataSources?: string[]; // Corresponds to ReportDesignerConfig.selectedDataSourceIds
  joins?: DataSourceJoin[]; // Corresponds to ReportDesignerConfig.joins
  multiSelectMode?: boolean; // Corresponds to ReportDesignerConfig.multiSelectMode
} 