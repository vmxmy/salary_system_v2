import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProTableProps, ActionType, ProColumns } from '@ant-design/pro-components';
import type { SortOrder, FilterValue, TablePaginationConfig } from 'antd/es/table/interface';
import { useTranslation } from 'react-i18next'; // `Key` is not typically imported from 'react' for Ant Design table keys
import { Button, Space, Tooltip, message } from 'antd';
import { ReloadOutlined, SettingOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'; // ColumnHeightOutlined not used, removed
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
` as typeof ProTable; // This casting is generally not recommended if you're using it as a React component.
                      // For styling, it's fine, but if you pass it directly as a component,
                      // ensure `ProTable` type is compatible with `styled`'s output type.

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
  pagination?: ProTableProps<T, any>['pagination']; // Use ProTableProps for pagination type
  /** 行选择配置 */
  rowSelection?: ProTableProps<T, any>['rowSelection']; // Use ProTableProps for rowSelection type
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
  /** 是否启用高级功能 (ProTable options) */
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
      t('components:auto__range_0_range_1___total__e7acac', { range0: range[0], range1: range[1], total }), // Corrected t() syntax and added interpolation variables
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
        message.success(t('common:table.refreshSuccess')); // Corrected t() syntax
      } else if (tableActionRef.current?.reload) {
        tableActionRef.current.reload();
        message.success(t('common:table.refreshSuccess')); // Corrected t() syntax
      }
    } catch (error) {
      message.error(t('common:table.refreshError')); // Corrected t() syntax
    }
  };

  // 处理全屏功能
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // 这里可以添加实际的全屏逻辑
    // For a real implementation, you might want to use the browser's Fullscreen API
    // e.g., document.documentElement.requestFullscreen();
    // and listen for 'fullscreenchange' events.
  };

  // 增强的工具栏配置
  const enhancedToolBarRender = () => {
    const defaultButtons = [...customToolbarButtons]; // Start with custom buttons

    // ProTable's `options` prop already handles reload, density, setting, and fullscreen.
    // So, we only add these explicitly if `enableAdvancedFeatures` is false and we want to control them manually.
    // Otherwise, ProTable will render its own icons based on `options`.

    // If you explicitly want to add these specific buttons AND manage them manually,
    // you would need to set `options` to `false` or selectively disable them in `options`.
    // The current logic `if (false)` effectively removes these manual buttons,
    // relying on `enableAdvancedFeatures` to control ProTable's built-in options.

    // If toolBarRender is provided, merge its result with default buttons.
    if (toolBarRender) {
      const customRenderedButtons = toolBarRender();
      return [...defaultButtons, ...customRenderedButtons];
    }

    return defaultButtons;
  };

  // ToolBar configuration
  // If `showToolbar` is false, `toolBarRender` will be `false`, hiding the toolbar entirely.
  // Otherwise, it will use the `enhancedToolBarRender` function.
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
        emptyText: emptyText || t('common:table.noData'),
      }}
      options={enableAdvancedFeatures ? {
        reload: true, // ProTable's built-in reload button
        density: true, // ProTable's built-in density setting
        setting: {
          draggable: true,
          checkable: true,
          // You might want to provide `columns` to `setting` if you're dynamically managing columns
        },
        fullScreen: true, // ProTable's built-in fullscreen button
        // Note: If you use ProTable's `fullScreen: true`,
        // your `handleFullscreen` state will not directly control its behavior.
        // You would typically let ProTable manage its own fullscreen state.
        // If you need custom fullscreen, set `fullScreen: false` here and add your custom button via `customToolbarButtons`.
      } : false}
    />
  );
}

// 导出类型
export type { EnhancedProTableProps, ProColumns, ActionType };
export default EnhancedProTable;