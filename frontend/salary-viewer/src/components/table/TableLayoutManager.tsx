import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, List, Typography, Popconfirm, Empty, Space, Upload, Divider, Tag, App } from 'antd';
import { DeleteOutlined, SaveOutlined, LoadingOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ColumnConfig } from './ColumnSettingsDrawer';
import { FilterCondition, FilterGroup } from './AdvancedFilterDrawer';
import type { UploadProps, RcFile } from 'antd/es/upload';

const { Text, Title } = Typography;

// 定义表格布局接口
export interface TableLayout {
  id: string;
  name: string;
  columns: ColumnConfig[];
  filters?: FilterGroup[] | FilterCondition[]; // 兼容新旧两种筛选条件格式
  createdAt: string;
}

interface TableLayoutManagerProps {
  open: boolean;
  onClose: () => void;
  onSaveLayout: (name: string) => void;
  onLoadLayout: (layout: TableLayout) => void;
  onUpdateLayout?: (layout: TableLayout) => void; // 新增：更新布局的回调
  tableId: string; // 用于区分不同表格的布局
  currentColumns: ColumnConfig[];
  currentFilters?: FilterGroup[] | FilterCondition[]; // 兼容新旧两种筛选条件格式
  currentLayoutId?: string; // 新增：当前加载的布局ID
}

/**
 * 表格布局管理器组件，用于保存和加载表格布局
 */
const TableLayoutManager: React.FC<TableLayoutManagerProps> = ({
  open,
  onClose,
  onSaveLayout,
  onLoadLayout,
  onUpdateLayout,
  tableId,
  currentColumns,
  currentFilters = [],
  currentLayoutId,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp(); // 使用 App.useApp() 钩子获取 message 实例
  const [layouts, setLayouts] = useState<TableLayout[]>([]);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingLayoutId, setUpdatingLayoutId] = useState<string | null>(null);

  const storageKey = `tableLayout_${tableId}`;

  // 从localStorage加载保存的布局
  useEffect(() => {
    const savedLayouts = localStorage.getItem(storageKey);
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (e) {
        console.error('Failed to parse saved table layouts:', e);
      }
    }
  }, [storageKey]);

  // 保存布局
  const handleSaveLayout = () => {
    if (!newLayoutName.trim()) return;

    setLoading(true);

    const newLayout: TableLayout = {
      id: `layout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newLayoutName,
      columns: currentColumns,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    const updatedLayouts = [...layouts, newLayout];
    setLayouts(updatedLayouts);
    localStorage.setItem(storageKey, JSON.stringify(updatedLayouts));

    setNewLayoutName('');
    setLoading(false);

    onSaveLayout(newLayoutName);
  };

  // 加载布局
  const handleLoadLayout = (layout: TableLayout) => {
    onLoadLayout(layout);
    onClose();
  };

  // 更新布局
  const handleUpdateLayout = (layoutId: string) => {
    setUpdatingLayoutId(layoutId);
  };

  // 确认更新布局
  const confirmUpdateLayout = (layoutId: string) => {
    const layoutToUpdate = layouts.find(layout => layout.id === layoutId);
    if (!layoutToUpdate) return;

    // 创建更新后的布局对象
    const updatedLayout: TableLayout = {
      ...layoutToUpdate,
      columns: currentColumns,
      filters: currentFilters,
      createdAt: new Date().toISOString(), // 更新时间戳
    };

    // 更新布局列表
    const updatedLayouts = layouts.map(layout =>
      layout.id === layoutId ? updatedLayout : layout
    );

    setLayouts(updatedLayouts);
    localStorage.setItem(storageKey, JSON.stringify(updatedLayouts));
    setUpdatingLayoutId(null);

    // 调用回调函数
    if (onUpdateLayout) {
      onUpdateLayout(updatedLayout);
    }

    message.success(t('tableLayout.updateSuccess', { name: updatedLayout.name }));
  };

  // 取消更新
  const cancelUpdateLayout = () => {
    setUpdatingLayoutId(null);
  };

  // 删除布局
  const handleDeleteLayout = (layoutId: string) => {
    const updatedLayouts = layouts.filter(layout => layout.id !== layoutId);
    setLayouts(updatedLayouts);
    localStorage.setItem(storageKey, JSON.stringify(updatedLayouts));
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 导出单个布局
  const handleExportLayout = (layout: TableLayout) => {
    const dataStr = JSON.stringify(layout, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileName = `${layout.name.replace(/\s+/g, '_')}_layout.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  // 导出所有布局
  const handleExportAllLayouts = () => {
    const dataStr = JSON.stringify(layouts, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileName = `${tableId}_all_layouts.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  // 导入布局
  const handleImportLayouts = (file: RcFile) => {
    const fileReader = new FileReader();
    fileReader.readAsText(file);
    fileReader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const importedData = JSON.parse(result);

          // 检查导入的数据是单个布局还是布局数组
          if (Array.isArray(importedData)) {
            // 导入多个布局
            const validLayouts = importedData.filter(layout =>
              layout.id && layout.name && layout.columns && Array.isArray(layout.columns)
            );

            if (validLayouts.length === 0) {
              message.error(t('tableLayout.importInvalidFormat'));
              return false;
            }

            const updatedLayouts = [...layouts, ...validLayouts];
            setLayouts(updatedLayouts);
            localStorage.setItem(storageKey, JSON.stringify(updatedLayouts));
            message.success(t('tableLayout.importSuccess', { count: validLayouts.length }));
          } else if (importedData.id && importedData.name && importedData.columns && Array.isArray(importedData.columns)) {
            // 导入单个布局
            const updatedLayouts = [...layouts, importedData];
            setLayouts(updatedLayouts);
            localStorage.setItem(storageKey, JSON.stringify(updatedLayouts));
            message.success(t('tableLayout.importSingleSuccess', { name: importedData.name }));
          } else {
            message.error(t('tableLayout.importInvalidFormat'));
            return false;
          }
        }
      } catch (error) {
        console.error('Failed to parse imported layouts:', error);
        message.error(t('tableLayout.importFailed'));
        return false;
      }
      return false; // 阻止默认上传行为
    };
    return false;
  };

  // 上传组件配置
  const importProps: UploadProps = {
    beforeUpload: handleImportLayouts,
    showUploadList: false,
    accept: '.json',
  };

  return (
    <Modal
      title={t('tableLayout.title')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>{t('tableLayout.saveNewLayout')}</Title>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={newLayoutName}
            onChange={e => setNewLayoutName(e.target.value)}
            placeholder={t('tableLayout.layoutNamePlaceholder')}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
            onClick={handleSaveLayout}
            disabled={!newLayoutName.trim() || loading}
          >
            {t('common.save')}
          </Button>
        </Space.Compact>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>{t('tableLayout.savedLayouts')}</Title>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportAllLayouts}
              disabled={layouts.length === 0}
            >
              {t('tableLayout.exportAll')}
            </Button>
            <Upload {...importProps}>
              <Button icon={<UploadOutlined />}>{t('tableLayout.import')}</Button>
            </Upload>
          </Space>
        </div>

        {layouts.length === 0 ? (
          <Empty description={t('tableLayout.noSavedLayouts')} />
        ) : (
          <List
            dataSource={layouts}
            renderItem={layout => (
              <List.Item
                actions={[
                  <Button
                    key="export"
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExportLayout(layout)}
                    title={t('tableLayout.exportLayout')}
                  />,
                  updatingLayoutId === layout.id ? (
                    <Space key="update-confirm">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => confirmUpdateLayout(layout.id)}
                      >
                        {t('common.yes')}
                      </Button>
                      <Button
                        size="small"
                        onClick={cancelUpdateLayout}
                      >
                        {t('common.no')}
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      key="update"
                      type="link"
                      onClick={() => handleUpdateLayout(layout.id)}
                    >
                      {t('tableLayout.update')}
                    </Button>
                  ),
                  <Button
                    key="load"
                    type="link"
                    onClick={() => handleLoadLayout(layout)}
                  >
                    {t('tableLayout.load')}
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title={t('tableLayout.deleteConfirm')}
                    onConfirm={() => handleDeleteLayout(layout.id)}
                    okText={t('common.yes')}
                    cancelText={t('common.no')}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {layout.name}
                      {currentLayoutId === layout.id && (
                        <Tag color="blue">{t('tableLayout.currentlyLoaded')}</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {t('tableLayout.savedAt')}: {formatDate(layout.createdAt)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};

export default TableLayoutManager;
