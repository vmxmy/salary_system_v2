import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, List, Typography, Popconfirm, Empty, Space, Upload, Tag, App, Radio, Tabs, Checkbox } from 'antd';
import {
  DeleteOutlined,
  LoadingOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ColumnConfig } from './ColumnSettingsDrawer';
import { FilterCondition, FilterGroup } from './AdvancedFilterDrawer';
import type { UploadProps, RcFile } from 'antd/es/upload';
import {
  fetchTableLayouts,
  createTableLayout,
  updateTableLayout,
  deleteTableLayout
} from '../../services/tableConfigsApi';

const { Text, Title } = Typography;

// 定义表格布局接口
export interface TableLayout {
  id: string;
  name: string;
  columns: ColumnConfig[];
  filters?: FilterGroup[] | FilterCondition[]; // 兼容新旧两种筛选条件格式
  createdAt: string;
  isServerStored?: boolean; // 是否存储在服务器上
  serverId?: number; // 服务器端ID
  isShared?: boolean; // 是否共享
  isDefault?: boolean; // 是否默认
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
  const [serverLayouts, setServerLayouts] = useState<TableLayout[]>([]);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingLayoutId, setUpdatingLayoutId] = useState<string | null>(null);
  const [saveLocation, setSaveLocation] = useState<'local' | 'server'>('local');
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('local');
  const [loadingServer, setLoadingServer] = useState(false);

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

  // 从服务器加载布局
  useEffect(() => {
    const loadServerLayouts = async () => {
      if (!open) return; // 只在打开对话框时加载

      setLoadingServer(true);
      try {
        const layouts = await fetchTableLayouts(tableId);
        // 将服务器布局转换为前端格式
        const convertedLayouts = layouts.map(layout => {
          // 确保config_data存在且包含columns
          const configData = layout.config_data || {};
          const columns = Array.isArray(configData.columns) ? configData.columns : [];
          const filters = configData.filters || [];

          return {
            id: `server-${layout.id}`,
            name: layout.name,
            columns: columns,
            filters: filters,
            createdAt: layout.created_at,
            isServerStored: true,
            serverId: layout.id,
            isShared: layout.is_shared,
            isDefault: layout.is_default
          };
        });
        setServerLayouts(convertedLayouts);
      } catch (error) {
        console.error('Failed to load layouts from server:', error);
        message.error(t('tableLayout.serverLoadFailed'));
      } finally {
        setLoadingServer(false);
      }
    };

    loadServerLayouts();
  }, [tableId, open, t, message]);

  // 打开保存对话框
  const openSaveModal = () => {
    setSaveModalVisible(true);
    setNewLayoutName('');
    setIsShared(false);
    setIsDefault(false);
  };

  // 保存布局
  const handleSaveLayout = async (saveToServer = false) => {
    if (!newLayoutName.trim()) return;

    setLoading(true);

    if (saveToServer) {
      // 保存到服务器
      try {
        // 添加调试日志
        console.log('Saving layout to server with data:', {
          tableId,
          name: newLayoutName,
          columns: currentColumns,
          filters: currentFilters,
          isDefault,
          isShared
        });

        // 检查currentColumns是否为空
        if (!currentColumns || currentColumns.length === 0) {
          message.error(t('tableLayout.emptyColumnsError'));
          setLoading(false);
          return;
        }

        const serverLayout = await createTableLayout({
          table_id: tableId,
          name: newLayoutName,
          config_data: {
            columns: currentColumns,
            filters: currentFilters
          },
          is_default: isDefault,
          is_shared: isShared
        });

        if (serverLayout) {
          const newLayout: TableLayout = {
            id: `server-${serverLayout.id}`,
            name: serverLayout.name,
            columns: currentColumns,
            filters: currentFilters,
            createdAt: serverLayout.created_at,
            isServerStored: true,
            serverId: serverLayout.id,
            isShared: serverLayout.is_shared,
            isDefault: serverLayout.is_default
          };

          setServerLayouts([...serverLayouts, newLayout]);

          // 如果是默认布局，自动加载它
          if (isDefault) {
            // 先关闭保存对话框
            setSaveModalVisible(false);
            // 加载新布局
            onLoadLayout(newLayout);
            message.success(t('tableLayout.defaultLayoutSaved', { name: newLayout.name }));
          } else {
            message.success(t('tableLayout.serverSaveSuccess'));
          }
        }
      } catch (error) {
        console.error('Failed to save layout to server:', error);
        message.error(t('tableLayout.serverSaveFailed'));
      }
    } else {
      // 保存到本地
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
      message.success(t('tableLayout.localSaveSuccess'));
    }

    setNewLayoutName('');
    setLoading(false);
    setSaveModalVisible(false);
    onSaveLayout(newLayoutName);
  };

  // 加载布局
  const handleLoadLayout = (layout: TableLayout) => {
    console.log('TableLayoutManager - Loading layout:', layout);

    // 检查布局是否有有效的列配置
    if (!layout.columns || layout.columns.length === 0) {
      console.warn('Attempting to load layout with empty columns:', layout);
      
      // 如果布局没有列配置，但有serverId，尝试重新获取布局
      if (layout.isServerStored && layout.serverId) {
        console.log('Attempting to reload server layout with ID:', layout.serverId);
        
        // 创建一个基本的列配置
        const basicColumns = [
          {
            key: '_consolidated_data_id',
            title: 'ID',
            visible: true,
            fixed: 'left' as 'left',
            width: 80,
            dataIndex: '_consolidated_data_id'
          },
          {
            key: 'employee_name',
            title: '姓名',
            visible: true,
            fixed: 'left' as 'left',
            width: 120,
            dataIndex: 'employee_name'
          },
          {
            key: 'calc_net_pay',
            title: '实发合计',
            visible: true,
            fixed: 'right' as 'right',
            width: 120,
            dataIndex: 'calc_net_pay'
          }
        ];
        
        // 创建一个新的布局对象，包含基本列配置
        const updatedLayout = {
          ...layout,
          columns: basicColumns
        };
        
        // 加载更新后的布局
        onLoadLayout(updatedLayout);
        onClose();
        
        // 尝试更新服务器布局
        updateTableLayout(layout.serverId, {
          config_data: {
            columns: basicColumns,
            filters: layout.filters || []
          }
        }).then(result => {
          if (result) {
            console.log('Successfully updated server layout with basic columns');
          } else {
            console.error('Failed to update server layout with basic columns');
          }
        }).catch(error => {
          console.error('Error updating server layout:', error);
        });
        
        return;
      }
      
      message.warning(t('tableLayout.emptyColumnsWarning'));
      return;
    }

    onLoadLayout(layout);
    onClose();
  };

  // 更新布局
  const handleUpdateLayout = (layoutId: string) => {
    setUpdatingLayoutId(layoutId);
  };

  // 确认更新本地布局
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

  // 确认更新服务器端布局
  const confirmUpdateServerLayout = async (layoutId: string, serverId: number) => {
    const layoutToUpdate = serverLayouts.find(layout => layout.id === layoutId);
    if (!layoutToUpdate) return;

    setLoading(true);
    try {
      // 添加调试日志
      console.log('Updating server layout with data:', {
        serverId,
        name: layoutToUpdate.name,
        columns: currentColumns,
        filters: currentFilters,
        isShared: layoutToUpdate.isShared,
        isDefault: layoutToUpdate.isDefault
      });

      // 检查currentColumns是否为空
      if (!currentColumns || currentColumns.length === 0) {
        message.error(t('tableLayout.emptyColumnsError'));
        setLoading(false);
        return;
      }

      // 调用API更新服务器端布局
      const updatedServerLayout = await updateTableLayout(serverId, {
        name: layoutToUpdate.name,
        config_data: {
          columns: currentColumns,
          filters: currentFilters
        },
        is_shared: layoutToUpdate.isShared,
        is_default: layoutToUpdate.isDefault
      });

      if (updatedServerLayout) {
        // 创建更新后的布局对象
        const updatedLayout: TableLayout = {
          ...layoutToUpdate,
          columns: currentColumns,
          filters: currentFilters,
          createdAt: updatedServerLayout.updated_at || new Date().toISOString(),
          isServerStored: true,
          serverId: updatedServerLayout.id,
          isShared: updatedServerLayout.is_shared,
          isDefault: updatedServerLayout.is_default
        };

        // 更新布局列表
        const updatedLayouts = serverLayouts.map(layout =>
          layout.id === layoutId ? updatedLayout : layout
        );

        setServerLayouts(updatedLayouts);
        setUpdatingLayoutId(null);

        // 调用回调函数
        if (onUpdateLayout) {
          onUpdateLayout(updatedLayout);
        }

        // 如果是默认布局，自动加载它
        if (updatedLayout.isDefault) {
          // 关闭对话框
          onClose();
          // 加载更新后的布局
          onLoadLayout(updatedLayout);
          message.success(t('tableLayout.defaultLayoutUpdated', { name: updatedLayout.name }));
        } else {
          message.success(t('tableLayout.serverUpdateSuccess', { name: updatedLayout.name }));
        }
      } else {
        message.error(t('tableLayout.serverUpdateFailed'));
      }
    } catch (error) {
      console.error('Failed to update server layout:', error);
      message.error(t('tableLayout.serverUpdateFailed'));
    } finally {
      setLoading(false);
    }
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

  // 删除服务器布局
  const handleDeleteServerLayout = async (layoutId: number) => {
    try {
      const success = await deleteTableLayout(layoutId);
      if (success) {
        const updatedLayouts = serverLayouts.filter(layout => layout.serverId !== layoutId);
        setServerLayouts(updatedLayouts);
        message.success(t('tableLayout.deleteServerSuccess'));
      } else {
        message.error(t('tableLayout.deleteServerFailed'));
      }
    } catch (error) {
      console.error(`Failed to delete server layout ${layoutId}:`, error);
      message.error(t('tableLayout.deleteServerFailed'));
    }
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
    <>
      <Modal
        title={t('tableLayout.title')}
        open={open}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>{t('tableLayout.saveNewLayout')}</Title>
          <Button
            type="primary"
            style={{ marginBottom: 16 }}
            onClick={openSaveModal}
          >
            {t('tableLayout.createNewLayout')}
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'local',
              label: t('tableLayout.localLayouts'),
              children: (
                <>
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
                </>
              ),
            },
            {
              key: 'server',
              label: t('tableLayout.serverLayouts'),
              children: (
                <>
                  {loadingServer ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <LoadingOutlined style={{ fontSize: 24 }} />
                      <p>{t('tableLayout.loadingServerLayouts')}</p>
                    </div>
                  ) : serverLayouts.length === 0 ? (
                    <Empty description={t('tableLayout.noServerLayouts')} />
                  ) : (
                    <List
                      dataSource={serverLayouts}
                      renderItem={layout => (
                        <List.Item
                          actions={[
                            updatingLayoutId === layout.id ? (
                              <Space key="update-confirm">
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => confirmUpdateServerLayout(layout.id, layout.serverId!)}
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
                              onConfirm={() => handleDeleteServerLayout(layout.serverId!)}
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
                                {layout.isShared && (
                                  <Tag color="green">{t('tableLayout.shared')}</Tag>
                                )}
                                {layout.isDefault && (
                                  <Tag color="orange">{t('tableLayout.default')}</Tag>
                                )}
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
                </>
              ),
            },
          ]}
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
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
          <Button onClick={onClose}>{t('common.close')}</Button>
        </div>
      </Modal>

      {/* 保存位置选择对话框 */}
      <Modal
        title={t('tableLayout.saveTitle')}
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            value={newLayoutName}
            onChange={e => setNewLayoutName(e.target.value)}
            placeholder={t('tableLayout.layoutNamePlaceholder')}
            style={{ marginBottom: 16 }}
          />

          <Radio.Group
            value={saveLocation}
            onChange={e => setSaveLocation(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            <Radio value="local">{t('tableLayout.saveLocal')}</Radio>
            <Radio value="server">{t('tableLayout.saveServer')}</Radio>
          </Radio.Group>

          {saveLocation === 'server' && (
            <div style={{ marginLeft: 24, marginBottom: 16 }}>
              <div>
                <Checkbox
                  checked={isShared}
                  onChange={(e: { target: { checked: boolean } }) => setIsShared(e.target.checked)}
                  style={{ marginRight: 16 }}
                >
                  {t('tableLayout.shareWithOthers')}
                </Checkbox>
              </div>
              <div>
                <Checkbox
                  checked={isDefault}
                  onChange={(e: { target: { checked: boolean } }) => setIsDefault(e.target.checked)}
                >
                  {t('tableLayout.setAsDefault')}
                </Checkbox>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setSaveModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              onClick={() => handleSaveLayout(saveLocation === 'server')}
              disabled={!newLayoutName.trim() || loading}
              loading={loading}
            >
              {t('common.save')}
            </Button>
          </Space>
        </div>
      </Modal>
    </>
  );
};

export default TableLayoutManager;
