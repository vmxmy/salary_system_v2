import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProTableProps, ActionType, ProColumns } from '@ant-design/pro-components';
import type { SortOrder, FilterValue, TablePaginationConfig } from 'antd/es/table/interface';
import type { Key } from 'react'; // ReactText is not a standard export from 'react'
import { useTranslation } from 'react-i18next';
import { Button, Space, Tooltip, message } from 'antd';
import { ReloadOutlined, SettingOutlined, FullscreenOutlined, FullscreenExitOutlined, ColumnHeightOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// 样式化的 ProTable 组件
const StyledProTable = styled(ProTable)`
  &&& {
    .ant-pro-table-list-toolbar {
      padding: 16px 24px;
      background: #fafafa;
      border-radius: 8px 8px 0 0;
    }
    
    .ant-pro-table-list-toolbar-title {
      font-weight: 600;
      font-size: 16px;
      color: #262626;
    }
    
    .ant-table-thead > tr > th {
      background-color: #fafafa;
      font-weight: 500;
      color: #262626;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .ant-table-tbody > tr > td {
      transition: background-color 0.3s;
      padding: 12px 16px;
    }
    
    .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }
    
    .ant-table-tbody > tr.ant-table-row-selected > td {
      background-color: #e6f7ff;
    }
    
    .ant-pro-table-search {
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .ant-pagination {
      margin: 16px 0 0 0;
      text-align: right;
      
      .ant-pagination-total-text {
        color: #8c8c8c;
        font-size: 14px;
      }
    }
  }
` as typeof ProTable;

interface EnhancedProTableProps<T extends Record<string, any>> {
  /** 表格列配置 */
  columns: ProColumns<T>[];
  /** 数据源 */
  dataSource?: T[];
  /** 加载状态 */
  loading?: boolean;
  /** 表格标题 */
  title?: string;
  /** 是否显示搜索表单 */
  search?: boolean;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 工具栏渲染函数 */
  toolBarRender?: () => React.ReactNode[];
  /** 表格操作引用 */
  actionRef?: React.MutableRefObject<ActionType | undefined | null>; // More flexible for ProTable's actionRef
  /** 自定义空状态 */
  emptyText?: string;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 表格大小 */
  size?: 'small' | 'middle' | 'large';
  /** 分页配置 */
  pagination?: any;
  /** 行选择配置 */
  rowSelection?: any;
  /** 行键 */
  rowKey?: string | ((record: T) => string);
  /** 滚动配置 */
  scroll?: { x?: number | string; y?: number | string };
  /** 表格变化回调 */
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>, // Correct type for antd table onChange filters
    sorter: any, // SorterResult<T> | SorterResult<T>[]
    extra: { currentDataSource: T[]; action: 'paginate' | 'sort' | 'filter' }
  ) => void;
  /** 请求数据的函数 - 更新为ProTable标准签名 */
  request?: (
    params: { pageSize?: number; current?: number; [key: string]: any; },
    sort: Record<string, SortOrder>,
    filter: Record<string, (string | number)[] | null> // Use (string | number)[] directly
  ) => Promise<{ data: T[]; success: boolean; total?: number; }>;
  /** 刷新数据的回调函数 */
  onRefresh?: () => void | Promise<void>;
  /** 是否启用高级功能 */
  enableAdvancedFeatures?: boolean;
  /** 自定义工具栏按钮 */
  customToolbarButtons?: React.ReactNode[];
  /** 其他 ProTable 属性 */
  [key: string]: any;
}

function EnhancedProTable<T extends Record<string, any>>({
  title,
  search = false,
  showToolbar = true,
  toolBarRender,
  actionRef,
  emptyText,
  bordered = true,
  size = 'middle',
  pagination,
  onRefresh,
  enableAdvancedFeatures = true,
  customToolbarButtons = [],
  ...restProps
}: EnhancedProTableProps<T>) {
  const { t } = useTranslation();
  const defaultActionRef = useRef<ActionType>(null);
  const tableActionRef = actionRef || defaultActionRef;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 默认分页配置
  const defaultPagination = pagination !== false ? {
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total: number, range: [number, number]) => 
      {t('components:auto__range_0_range_1___total__e7acac')},
    ...pagination,
  } : false;

  // 搜索配置
  const searchConfig = search ? {
    collapsed: false,
  } : false;

  // 处理刷新功能
  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        await onRefresh();
        message.success(t('common:table.refreshSuccess', {t('components:auto_text_e588b7')}));
      } else if (tableActionRef.current?.reload) {
        tableActionRef.current.reload();
        message.success(t('common:table.refreshSuccess', {t('components:auto_text_e588b7')}));
      }
    } catch (error) {
      message.error(t('common:table.refreshError', {t('components:auto_text_e588b7')}));
    }
  };

  // 处理全屏功能
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // 这里可以添加实际的全屏逻辑
  };

  // 增强的工具栏配置
  const enhancedToolBarRender = () => {
    const defaultButtons = [];
    
    // 添加自定义按钮
    if (customToolbarButtons.length > 0) {
      defaultButtons.push(...customToolbarButtons);
    }
    
    // 不添加自定义的高级功能按钮，避免与 ProTable 的 options 工具栏重复
    // 如果需要自定义按钮，请通过 customToolbarButtons 传入
    if (false) {
      defaultButtons.push(
        <Tooltip key="refresh" title={t('common:table.refresh', {t('components:auto_text_e588b7')})}>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          />
        </Tooltip>,
        <Tooltip key="fullscreen" title={isFullscreen ? t('common:table.exitFullscreen', {t('components:auto_text_e98080')}) : t('common:table.fullscreen', {t('components:auto_text_e585a8')})}>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={handleFullscreen}
          />
        </Tooltip>
      );
    }
    
    // 如果有自定义工具栏渲染函数，合并结果
    if (toolBarRender) {
      const customButtons = toolBarRender();
      return [...defaultButtons, ...customButtons];
    }
    
    return defaultButtons;
  };

  // 工具栏配置
  const toolbarConfig = showToolbar ? enhancedToolBarRender : false;

  return (
    <StyledProTable<T>
      {...restProps}
      actionRef={tableActionRef}
      headerTitle={title}
      search={searchConfig}
      toolBarRender={toolbarConfig}
      pagination={defaultPagination}
      bordered={bordered}
      size={size}
      locale={{
        emptyText: emptyText || t('common:table.noData', {t('components:auto_text_e69a82')}),
      }}
      options={enableAdvancedFeatures ? {
        reload: true,
        density: true,
        setting: {
          draggable: true,
          checkable: true,
        },
        fullScreen: true,
      } : false}
    />
  );
}

// 导出类型
export type { EnhancedProTableProps, ProColumns, ActionType };
export default EnhancedProTable; 