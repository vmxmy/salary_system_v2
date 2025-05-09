import React from 'react';
import { Space, Button, Tooltip, Tag, Typography } from 'antd';
import {
  SettingOutlined,
  FilterOutlined,
  SaveOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export interface TableToolbarProps {
  onColumnSettingsClick: () => void;
  onAdvancedFilterClick: () => void;
  onSaveLayoutClick: () => void;
  onExportClick: () => void;
  onRefreshClick: () => void;
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
  loading = false,
  currentLayoutName,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: 16 }}>
      <Space>
        <Tooltip title={t('tableToolbar.columnSettings')}>
          <Button
            icon={<SettingOutlined />}
            onClick={onColumnSettingsClick}
            disabled={loading}
          >
            {t('tableToolbar.columns')}
          </Button>
        </Tooltip>

        <Tooltip title={t('tableToolbar.advancedFilter')}>
          <Button
            icon={<FilterOutlined />}
            onClick={onAdvancedFilterClick}
            disabled={loading}
          >
            {t('tableToolbar.filter')}
          </Button>
        </Tooltip>

        <Tooltip title={t('tableToolbar.saveLayout')}>
          <Button
            icon={<SaveOutlined />}
            onClick={onSaveLayoutClick}
            disabled={loading}
          >
            {t('tableToolbar.saveLayout')}
          </Button>
        </Tooltip>

        <Tooltip title={t('tableToolbar.export')}>
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportClick}
            disabled={loading}
          >
            {t('tableToolbar.export')}
          </Button>
        </Tooltip>

        <Tooltip title={t('tableToolbar.refresh')}>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefreshClick}
            loading={loading}
          >
            {t('tableToolbar.refresh')}
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
};

export default TableToolbar;
