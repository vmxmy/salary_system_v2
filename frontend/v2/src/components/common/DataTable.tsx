import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Button, 
  Space, 
  Dropdown, 
  Tooltip, 
  Card, 
  Typography,
  App,
  Divider,
  Tag
} from 'antd';
import { 
  DownloadOutlined, 
  SettingOutlined, 
  ReloadOutlined,
  FilterOutlined,
  ColumnHeightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import EnhancedProTable from './EnhancedProTable';
import { StatusTag } from './index';
import type { StatusType } from './StatusTag';

const { Title } = Typography;

// 表格尺寸类型
export type TableSize = 'small' | 'middle' | 'large';

// 表格密度类型
export type TableDensity = 'compact' | 'default' | 'comfortable';

// 导出格式类型
export type ExportFormat = 'excel' | 'csv' | 'pdf';

// 列配置扩展
export interface DataTableColumn<T = any> extends ProColumns<T> {
  /** 是否可导出 */
  exportable?: boolean;
  /** 导出时的列名 */
  exportTitle?: string;
  /** 数据格式化函数（用于导出） */
  exportFormatter?: (value: any, record: T) => string;
  /** 快速筛选选项 */
  quickFilters?: Array<{
    label: string;
    value: any;
    color?: string;
  }>;
  /** 状态标签配置 */
  statusConfig?: {
    type: StatusType;
    colorMap?: Record<string, string>;
  };
}

// 工具栏配置
export interface ToolbarConfig {
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示导出按钮 */
  showExport?: boolean;
  /** 是否显示列设置 */
  showColumnSetting?: boolean;
  /** 是否显示密度设置 */
  showDensity?: boolean;
  /** 是否显示全屏切换 */
  showFullscreen?: boolean;
  /** 自定义操作按钮 */
  extraActions?: React.ReactNode;
}

// 数据表格属性
export interface DataTableProps<T = any> {
  /** 表格列配置 */
  columns: DataTableColumn<T>[];
  /** 数据源 */
  dataSource?: T[];
  /** 数据请求函数 */
  request?: (params: any) => Promise<{
    data: T[];
    success: boolean;
    total: number;
  }>;
  /** 表格标题 */
  title?: string;
  /** 表格描述 */
  description?: string;
  /** 工具栏配置 */
  toolbar?: ToolbarConfig;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 表格尺寸 */
  size?: TableSize;
  /** 是否显示序号列 */
  showIndex?: boolean;
  /** 是否显示选择列 */
  showSelection?: boolean;
  /** 选中行变化回调 */
  onSelectionChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 导出回调 */
  onExport?: (format: ExportFormat, data: T[]) => void;
  /** 行点击回调 */
  onRowClick?: (record: T, index: number) => void;
  /** 行双击回调 */
  onRowDoubleClick?: (record: T, index: number) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 其他 ProTable 属性 */
  [key: string]: any;
}

const DataTable = <T extends Record<string, any>>({
  columns,
  dataSource,
  request,
  title,
  description,
  toolbar = {},
  bordered = true,
  size = 'middle',
  showIndex = false,
  showSelection = false,
  onSelectionChange,
  onRefresh,
  onExport,
  onRowClick,
  onRowDoubleClick,
  style,
  className,
  ...restProps
}: DataTableProps<T>) => {
  const { t } = useTranslation(['common']);
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  
  // 状态管理
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [tableDensity, setTableDensity] = useState<TableDensity>('default');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // 工具栏默认配置
  const {
    showRefresh = true,
    showExport = true,
    showColumnSetting = true,
    showDensity = true,
    showFullscreen = true,
    extraActions,
  } = toolbar;

  // 处理选择变化
  const handleSelectionChange = useCallback((keys: React.Key[], rows: T[]) => {
    setSelectedRowKeys(keys);
    setSelectedRows(rows);
    onSelectionChange?.(keys, rows);
  }, [onSelectionChange]);

  // 刷新表格
  const handleRefresh = useCallback(() => {
    actionRef.current?.reload();
    onRefresh?.();
    message.success(t('message.refresh_success'));
  }, [onRefresh, t, message]);

  // 导出数据
  const handleExport = useCallback((format: ExportFormat) => {
    const exportData = selectedRows.length > 0 ? selectedRows : (dataSource || []);
    onExport?.(format, exportData);
    message.success(t('message.export_success'));
  }, [selectedRows, dataSource, onExport, t, message]);

  // 切换列显示
  const toggleColumn = useCallback((columnKey: string) => {
    const newHiddenColumns = new Set(hiddenColumns);
    if (newHiddenColumns.has(columnKey)) {
      newHiddenColumns.delete(columnKey);
    } else {
      newHiddenColumns.add(columnKey);
    }
    setHiddenColumns(newHiddenColumns);
  }, [hiddenColumns]);

  // 处理表格密度变化
  const handleDensityChange = useCallback((density: TableDensity) => {
    setTableDensity(density);
  }, []);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // 处理行点击
  const handleRowClick = useCallback((record: T, index: number) => {
    onRowClick?.(record, index);
  }, [onRowClick]);

  // 处理行双击
  const handleRowDoubleClick = useCallback((record: T, index: number) => {
    onRowDoubleClick?.(record, index);
  }, [onRowDoubleClick]);

  // 增强列配置
  const enhancedColumns = useMemo(() => {
    let processedColumns = [...columns];

    // 添加序号列
    if (showIndex) {
      processedColumns.unshift({
        title: t('table.column.index'),
        dataIndex: 'index',
        key: 'index',
        width: 60,
        align: 'center',
        render: (_, __, index) => (index || 0) + 1,
        search: false,
        exportable: false,
      });
    }

    // 处理状态标签列
    processedColumns = processedColumns.map(column => {
      if (column.statusConfig) {
        return {
          ...column,
          render: (value: any, record: T) => (
            <StatusTag 
              status={column.statusConfig!.type}
              style={{ 
                color: column.statusConfig!.colorMap?.[value] 
              }}
            />
          ),
        };
      }
      return column;
    });

    // 过滤隐藏的列
    return processedColumns.filter(column => 
      !hiddenColumns.has(column.key as string || column.dataIndex as string)
    );
  }, [columns, showIndex, hiddenColumns, t]);

  // 导出菜单
  const exportMenuItems = [
    {
      key: 'excel',
      label: t('export.excel'),
      onClick: () => handleExport('excel'),
    },
    {
      key: 'csv',
      label: t('export.csv'),
      onClick: () => handleExport('csv'),
    },
    {
      key: 'pdf',
      label: t('export.pdf'),
      onClick: () => handleExport('pdf'),
    },
  ];

  // 密度菜单
  const densityMenuItems = [
    {
      key: 'compact',
      label: t('table.density.compact'),
      onClick: () => handleDensityChange('compact'),
    },
    {
      key: 'default',
      label: t('table.density.default'),
      onClick: () => handleDensityChange('default'),
    },
    {
      key: 'comfortable',
      label: t('table.density.comfortable'),
      onClick: () => handleDensityChange('comfortable'),
    },
  ];

  // 列设置菜单
  const columnMenuItems = columns.map(column => ({
    key: column.key as string || column.dataIndex as string,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{column.title as string}</span>
        <Tag 
          color={hiddenColumns.has(column.key as string || column.dataIndex as string) ? 'red' : 'green'}
        >
          {hiddenColumns.has(column.key as string || column.dataIndex as string) ? t('hidden') : t('visible')}
        </Tag>
      </div>
    ),
    onClick: () => toggleColumn(column.key as string || column.dataIndex as string),
  }));

  // 渲染工具栏
  const renderToolbar = () => (
    <Space>
      {showRefresh && (
        <Tooltip title={t('button.refresh')}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
          />
        </Tooltip>
      )}
      
      {showExport && (
        <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
          <Button icon={<DownloadOutlined />}>
            {t('button.export')}
          </Button>
        </Dropdown>
      )}
      
      {showColumnSetting && (
        <Dropdown menu={{ items: columnMenuItems }} placement="bottomRight">
          <Tooltip title={t('button.column_setting')}>
            <Button icon={<SettingOutlined />} />
          </Tooltip>
        </Dropdown>
      )}
      
      {showDensity && (
        <Dropdown menu={{ items: densityMenuItems }} placement="bottomRight">
          <Tooltip title={t('button.density')}>
            <Button icon={<ColumnHeightOutlined />} />
          </Tooltip>
        </Dropdown>
      )}
      
      {showFullscreen && (
        <Tooltip title={isFullscreen ? t('button.exit_fullscreen') : t('button.fullscreen')}>
          <Button 
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
        </Tooltip>
      )}
      
      {extraActions}
    </Space>
  );

  // 获取表格尺寸
  const getTableSize = (): 'small' | 'middle' | 'large' => {
    if (tableDensity === 'compact') return 'small';
    if (tableDensity === 'comfortable') return 'large';
    return 'middle';
  };

  // 表格属性
  const tableProps = {
    ...restProps,
    columns: enhancedColumns,
    dataSource,
    request,
    actionRef,
    bordered,
    size: getTableSize(),
    rowSelection: showSelection ? {
      selectedRowKeys,
      onChange: handleSelectionChange,
      preserveSelectedRowKeys: true,
    } : undefined,
    onRow: (record: T, index?: number) => ({
      onClick: () => handleRowClick(record, index || 0),
    }),
    toolbar: {
      title: title && (
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {description && (
            <Typography.Text type="secondary">
              {description}
            </Typography.Text>
          )}
        </div>
      ),
      actions: [renderToolbar()],
    },
  };

  // 渲染表格
  const tableElement = <EnhancedProTable<T> {...tableProps} />;

  // 全屏模式
  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: '#fff',
          padding: 24,
          ...style,
        }}
        className={className}
      >
        {tableElement}
      </div>
    );
  }

  // 普通模式
  return (
    <div style={style} className={className}>
      {tableElement}
    </div>
  );
};

export default DataTable; 