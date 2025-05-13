import React from 'react';
import { Space, Button, Tooltip, Tag, Typography, Dropdown } from 'antd';
import {
  SettingOutlined,
  FilterOutlined,
  SaveOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DownOutlined,
  AppstoreOutlined,
  DragOutlined,
  ColumnHeightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export interface TableToolbarProps {
  onColumnSettingsClick: () => void;
  onAdvancedFilterClick: () => void;
  onSaveLayoutClick: () => void;
  onExportClick: (format?: 'excel' | 'csv') => void;
  onRefreshClick: () => void;
  onToggleDraggable?: () => void; // 切换行拖拽排序功能
  isDraggable?: boolean; // 是否启用行拖拽排序
  onToggleColumnDraggable?: () => void; // 切换列拖拽排序功能
  isColumnDraggable?: boolean; // 是否启用列拖拽排序
  loading?: boolean;
  currentLayoutName?: string; // 当前布局名称
}

/**
 * 表格工具栏组件，包含列设置、高级筛选、保存布局、导出等功能按钮
 */
const TableToolbar: React.FC<TableToolbarProps> = ({
  onColumnSettingsClick,
  onAdvancedFilterClick,
  onSaveLayoutClick,
  onExportClick,
  onRefreshClick,
  onToggleDraggable,
  isDraggable = false,
  onToggleColumnDraggable,
  isColumnDraggable = false,
  loading = false,
  currentLayoutName,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Space size="middle">
        {/* 表格布局 - 设置为主要按钮样式 */}
        <Tooltip title={t('tableToolbar.saveLayout')}>
          <Button
            icon={<SaveOutlined />}
            onClick={onSaveLayoutClick}
            disabled={loading}
            type="primary"
            data-tour="table-layout-button"
          >
            {t('tableToolbar.saveLayout')}
          </Button>
        </Tooltip>

        {/* 视图组件 [列设置 | 列排序 | 高级筛选] */}
        <Space.Compact>
          <Tooltip title={t('tableToolbar.columnSettings')}>
            <Button
              icon={<SettingOutlined />}
              onClick={onColumnSettingsClick}
              disabled={loading}
              data-tour="column-settings-button"
            >
              {t('tableToolbar.columns')}
            </Button>
          </Tooltip>

          {/* 列拖拽排序 - 移到列设置旁边 */}
          {onToggleColumnDraggable && (
            <Tooltip title={t('tableToolbar.toggleColumnDraggable')}>
              <Button
                icon={<ColumnHeightOutlined />}
                onClick={onToggleColumnDraggable}
                disabled={loading}
                type={isColumnDraggable ? 'primary' : 'default'}
              >
                {t('tableToolbar.columnDragSort')}
              </Button>
            </Tooltip>
          )}

          <Tooltip title={t('tableToolbar.advancedFilter')}>
            <Button
              icon={<FilterOutlined />}
              onClick={onAdvancedFilterClick}
              disabled={loading}
              data-tour="advanced-filter-button"
            >
              {t('tableToolbar.filter')}
            </Button>
          </Tooltip>
        </Space.Compact>

        {/* 导出 ▼ */}
        <Dropdown menu={{
          items: [
            {
              key: 'excel',
              label: 'Excel (.xlsx)',
              onClick: () => {
                console.log('Exporting as Excel');
                onExportClick('excel');
              },
            },
            {
              key: 'csv',
              label: 'CSV (.csv)',
              onClick: () => {
                console.log('Exporting as CSV');
                onExportClick('csv');
              },
            },
          ]
        }} trigger={['click']} disabled={loading}>
          <Button data-tour="export-button">
            <Space>
              <DownloadOutlined />
              {t('tableToolbar.export')}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>

        {/* 刷新 */}
        <Tooltip title={t('tableToolbar.refresh')}>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefreshClick}
            loading={loading}
            data-tour="refresh-button"
          >
            {t('tableToolbar.refresh')}
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
};

export default TableToolbar;
