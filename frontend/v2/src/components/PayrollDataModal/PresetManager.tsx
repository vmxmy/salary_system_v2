// 工资数据模态框预设报表管理组件

import React, { useState } from 'react';
import {
  Modal,
  Button,
  List,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Input,
  Form,
  Switch,
  message,
  Dropdown,
  Typography,
  Divider,
  Empty,
  Card,
  Select,
  Collapse
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  StarOutlined,
  StarFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FolderOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePayrollDataPresets } from '../../hooks/usePayrollDataPresets';
import type {
  PayrollDataModalPreset,
  ColumnFilterConfig,
  ColumnSettings,
  PresetGroup
} from '../../types/payrollDataPresets';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface PresetManagerProps {
  visible: boolean;
  onClose: () => void;
  currentFilterConfig: ColumnFilterConfig;
  currentColumnSettings: ColumnSettings;
  getCurrentConfig?: () => {
    filterConfig: ColumnFilterConfig;
    columnSettings: ColumnSettings;
    tableFilterState: any;
  };
  onApplyPreset: (preset: PayrollDataModalPreset) => void;
}

interface SavePresetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string, isDefault?: boolean, isPublic?: boolean, category?: string) => void;
  loading?: boolean;
  availableGroups?: PresetGroup[];
}

interface EditPresetModalProps {
  visible: boolean;
  preset: PayrollDataModalPreset | null;
  onClose: () => void;
  onSave: (id: number, name: string, description?: string, isDefault?: boolean, isPublic?: boolean, category?: string) => void;
  loading?: boolean;
  availableGroups?: PresetGroup[];
}

const SavePresetModal: React.FC<SavePresetModalProps> = ({
  visible,
  onClose,
  onSave,
  loading = false
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values.name, values.description, values.isDefault, values.isPublic);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={t('payroll:presets.save_modal.title')}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common:button.cancel')}
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          {t('common:button.save')}
        </Button>
      ]}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('payroll:presets.save_modal.name')}
          rules={[{ required: true, message: t('payroll:presets.save_modal.name_required') }]}
        >
          <Input placeholder={t('payroll:presets.save_modal.name_placeholder')} />
        </Form.Item>
        
        <Form.Item
          name="description"
          label={t('payroll:presets.save_modal.description')}
        >
          <Input.TextArea 
            rows={3}
            placeholder={t('payroll:presets.save_modal.description_placeholder')} 
          />
        </Form.Item>

        <Form.Item name="isDefault" valuePropName="checked">
          <Switch />
          <span style={{ marginLeft: 8 }}>
            {t('payroll:presets.save_modal.set_as_default')}
          </span>
        </Form.Item>

        <Form.Item name="isPublic" valuePropName="checked">
          <Switch />
          <span style={{ marginLeft: 8 }}>
            {t('payroll:presets.save_modal.make_public')}
          </span>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const EditPresetModal: React.FC<EditPresetModalProps> = ({
  visible,
  preset,
  onClose,
  onSave,
  loading = false
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  // 当预设数据变化时，更新表单
  React.useEffect(() => {
    if (preset && visible) {
      form.setFieldsValue({
        name: preset.name,
        description: preset.description,
        isDefault: preset.isDefault,
        isPublic: preset.isPublic
      });
    }
  }, [preset, visible, form]);

  const handleSave = async () => {
    if (!preset?.id) return;
    
    try {
      const values = await form.validateFields();
      onSave(preset.id, values.name, values.description, values.isDefault, values.isPublic);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('payroll:presets.edit_modal.title')}
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          {t('common:button.cancel')}
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          {t('common:button.save')}
        </Button>
      ]}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('payroll:presets.edit_modal.name')}
          rules={[{ required: true, message: t('payroll:presets.edit_modal.name_required') }]}
        >
          <Input placeholder={t('payroll:presets.edit_modal.name_placeholder')} />
        </Form.Item>
        
        <Form.Item
          name="description"
          label={t('payroll:presets.edit_modal.description')}
        >
          <Input.TextArea 
            rows={3}
            placeholder={t('payroll:presets.edit_modal.description_placeholder')} 
          />
        </Form.Item>

        <Form.Item name="isDefault" valuePropName="checked">
          <Switch />
          <span style={{ marginLeft: 8 }}>
            {t('payroll:presets.edit_modal.set_as_default')}
          </span>
        </Form.Item>

        <Form.Item name="isPublic" valuePropName="checked">
          <Switch />
          <span style={{ marginLeft: 8 }}>
            {t('payroll:presets.edit_modal.make_public')}
          </span>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const PresetManager: React.FC<PresetManagerProps> = ({
  visible,
  onClose,
  currentFilterConfig,
  currentColumnSettings,
  getCurrentConfig,
  onApplyPreset
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PayrollDataModalPreset | null>(null);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicatingPreset, setDuplicatingPreset] = useState<PayrollDataModalPreset | null>(null);
  const [viewingPreset, setViewingPreset] = useState<PayrollDataModalPreset | null>(null);

  const {
    presets,
    defaultPreset,
    loading,
    savePreset,
    applyPreset,
    deletePreset,
    setAsDefault,
    duplicatePreset,
    updatePreset
  } = usePayrollDataPresets();

  // 保存当前配置为新预设
  const handleSavePreset = async (
    name: string,
    description?: string,
    isDefault?: boolean,
    isPublic?: boolean
  ) => {
    try {
      // 🎯 关键修复：使用完整配置（包含表头筛选状态）
      const fullConfig = getCurrentConfig ? getCurrentConfig() : {
        filterConfig: currentFilterConfig,
        columnSettings: currentColumnSettings,
        tableFilterState: {}
      };
      
      console.log('💾 [PresetManager] 保存预设配置:', {
        name,
        fullConfig,
        hasTableFilterState: !!fullConfig.tableFilterState,
        tableFilterStateKeys: Object.keys(fullConfig.tableFilterState || {})
      });
      
      await savePreset(name, fullConfig.filterConfig, fullConfig.columnSettings, {
        description,
        isDefault,
        isPublic,
        tableFilterState: fullConfig.tableFilterState // 🎯 关键：传递表头筛选状态
      });
      setSaveModalVisible(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  // 应用预设
  const handleApplyPreset = async (preset: PayrollDataModalPreset) => {
    try {
      await applyPreset(preset);
      onApplyPreset(preset);
      message.success(t('payroll:presets.applied_successfully', { name: preset.name }));
    } catch (error) {
      // Error handled in hook
    }
  };

  // 复制预设
  const handleDuplicatePreset = async (newName: string) => {
    if (!duplicatingPreset) return;
    
    try {
      await duplicatePreset(duplicatingPreset.id!, newName);
      setDuplicateModalVisible(false);
      setDuplicatingPreset(null);
    } catch (error: any) {
      // 如果是名称冲突错误，自动生成新名称
      if (error?.response?.status === 400 && 
          error?.response?.data?.detail?.includes('已存在')) {
        const timestamp = new Date().getTime();
        const autoName = `${duplicatingPreset.name} - 副本${timestamp}`;
        
        try {
          await duplicatePreset(duplicatingPreset.id!, autoName);
          setDuplicateModalVisible(false);
          setDuplicatingPreset(null);
          message.success(t('payroll:presets.duplicate_auto_renamed', { name: autoName }));
        } catch (retryError) {
          // 重试失败，显示原始错误
        }
      }
    }
  };

  // 编辑预设
  const handleEditPreset = async (
    id: number,
    name: string,
    description?: string,
    isDefault?: boolean,
    isPublic?: boolean
  ) => {
    try {
      await updatePreset(id, {
        name,
        description,
        isDefault,
        isPublic
      });
      setEditingPreset(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  // 写入当前配置到预设
  const handleWriteCurrentConfig = async (preset: PayrollDataModalPreset) => {
    Modal.confirm({
      title: t('payroll:presets.write_current_confirm.title'),
      content: t('payroll:presets.write_current_confirm.content', { name: preset.name }),
      okText: t('payroll:presets.write_current_confirm.ok'),
      cancelText: t('common:button.cancel'),
      onOk: async () => {
        try {
          // 🎯 关键修复：使用完整配置（包含表头筛选状态）
          const fullConfig = getCurrentConfig ? getCurrentConfig() : {
            filterConfig: currentFilterConfig,
            columnSettings: currentColumnSettings,
            tableFilterState: {}
          };
          
          console.log('💾 [PresetManager] 写入当前配置到预设:', {
            presetName: preset.name,
            fullConfig,
            hasTableFilterState: !!fullConfig.tableFilterState,
            tableFilterStateKeys: Object.keys(fullConfig.tableFilterState || {})
          });
          
          await updatePreset(preset.id!, {
            name: preset.name,
            description: preset.description,
            isDefault: preset.isDefault,
            isPublic: preset.isPublic,
            filterConfig: fullConfig.filterConfig,
            columnSettings: fullConfig.columnSettings,
            tableFilterState: fullConfig.tableFilterState // 🎯 关键：传递表头筛选状态
          });
          message.success(t('payroll:presets.write_current_success', { name: preset.name }));
        } catch (error) {
          console.error('Failed to write current config to preset:', error);
          message.error(t('payroll:presets.write_current_error'));
        }
      }
    });
  };

  // 渲染预设项的操作菜单
  const renderPresetActions = (preset: PayrollDataModalPreset) => {
    const menuItems = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: t('common:button.view'),
        onClick: () => setViewingPreset(preset)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: t('common:button.edit'),
        onClick: () => setEditingPreset(preset)
      },
      {
        key: 'write_current',
        icon: <SaveOutlined />,
        label: t('payroll:presets.write_current_config'),
        onClick: () => handleWriteCurrentConfig(preset)
      },
      {
        key: 'duplicate',
        icon: <CopyOutlined />,
        label: t('payroll:presets.duplicate'),
        onClick: () => {
          setDuplicatingPreset(preset);
          setDuplicateModalVisible(true);
        }
      },
      {
        key: 'set_default',
        icon: defaultPreset?.id === preset.id ? <StarFilled /> : <StarOutlined />,
        label: defaultPreset?.id === preset.id 
          ? t('payroll:presets.default_preset')
          : t('payroll:presets.set_as_default'),
        disabled: defaultPreset?.id === preset.id,
        onClick: () => setAsDefault(preset.id!)
      },
      {
        type: 'divider' as const
      },
      {
        key: 'export',
        icon: <DownloadOutlined />,
        label: t('payroll:presets.export'),
        onClick: () => {
          // TODO: 实现导出功能
          message.info(t('payroll:presets.export_coming_soon'));
        }
      },
      {
        type: 'divider' as const
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: t('common:button.delete'),
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: t('payroll:presets.delete_confirm.title'),
            content: t('payroll:presets.delete_confirm.content', { name: preset.name }),
            okText: t('common:button.delete'),
            cancelText: t('common:button.cancel'),
            okType: 'danger',
            onOk: () => deletePreset(preset.id!)
          });
        }
      }
    ];

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="text" icon={<MoreOutlined />} size="small" />
      </Dropdown>
    );
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <SettingOutlined />
            {t('payroll:presets.manager_title')}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="save-current" type="primary" icon={<SaveOutlined />} onClick={() => setSaveModalVisible(true)}>
            {t('payroll:presets.save_current')}
          </Button>,
          <Button key="close" onClick={onClose}>
            {t('common:button.close')}
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {presets.length === 0 ? (
            <Empty
              description={t('payroll:presets.no_presets')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<SaveOutlined />} onClick={() => setSaveModalVisible(true)}>
                {t('payroll:presets.create_first')}
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={presets}
              loading={loading}
              renderItem={(preset) => (
                <List.Item
                  key={preset.id}
                  actions={[
                    <Button
                      key="apply"
                      type="primary"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      {t('payroll:presets.apply')}
                    </Button>,
                    renderPresetActions(preset)
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{preset.name}</span>
                        {defaultPreset?.id === preset.id && (
                          <Tag color="gold" icon={<StarFilled />}>
                            {t('payroll:presets.default')}
                          </Tag>
                        )}
                        {preset.isPublic && (
                          <Tag color="blue">
                            {t('payroll:presets.public')}
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        {preset.description && (
                          <Text type="secondary">{preset.description}</Text>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Space size="small">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined /> {t('payroll:presets.usage_count')}: {preset.usageCount || 0}
                            </Text>
                            {preset.lastUsedAt && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {t('payroll:presets.last_used')}: {new Date(preset.lastUsedAt).toLocaleDateString()}
                              </Text>
                            )}
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>

      {/* 保存预设模态框 */}
      <SavePresetModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleSavePreset}
      />

      {/* 编辑预设模态框 */}
      <EditPresetModal
        visible={!!editingPreset}
        preset={editingPreset}
        onClose={() => setEditingPreset(null)}
        onSave={handleEditPreset}
        loading={loading}
      />

      {/* 预设详情查看模态框 */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            {t('payroll:presets.view_modal.title')}
          </Space>
        }
        open={!!viewingPreset}
        onCancel={() => setViewingPreset(null)}
        footer={[
          <Button key="close" onClick={() => setViewingPreset(null)}>
            {t('common:button.close')}
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            setEditingPreset(viewingPreset);
            setViewingPreset(null);
          }}>
            {t('common:button.edit')}
          </Button>
        ]}
        width={700}
      >
        {viewingPreset && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>{t('payroll:presets.view_modal.basic_info')}</Text>
              </div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">{t('payroll:presets.view_modal.name')}:</Text>
                  <Text style={{ marginLeft: 8 }}>{viewingPreset.name}</Text>
                </div>
                {viewingPreset.description && (
                  <div>
                    <Text type="secondary">{t('payroll:presets.view_modal.description')}:</Text>
                    <Text style={{ marginLeft: 8 }}>{viewingPreset.description}</Text>
                  </div>
                )}
                <div>
                  <Text type="secondary">{t('payroll:presets.view_modal.properties')}:</Text>
                  <div style={{ marginLeft: 8, marginTop: 4 }}>
                    <Space>
                      {viewingPreset.isDefault && (
                        <Tag color="gold" icon={<StarFilled />}>
                          {t('payroll:presets.default')}
                        </Tag>
                      )}
                      {viewingPreset.isPublic && (
                        <Tag color="blue">
                          {t('payroll:presets.public')}
                        </Tag>
                      )}
                      <Tag>
                        {t('payroll:presets.usage_count')}: {viewingPreset.usageCount || 0}
                      </Tag>
                    </Space>
                  </div>
                </div>
              </Space>
            </Card>

            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>{t('payroll:presets.view_modal.filter_config')}</Text>
              </div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">{t('payroll:presets.view_modal.hide_jsonb_columns')}:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {viewingPreset.filterConfig.hideJsonbColumns ? t('common:yes') : t('common:no')}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">{t('payroll:presets.view_modal.hide_zero_columns')}:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {viewingPreset.filterConfig.hideZeroColumns ? t('common:yes') : t('common:no')}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">{t('payroll:presets.view_modal.hide_empty_columns')}:</Text>
                  <Text style={{ marginLeft: 8 }}>
                    {viewingPreset.filterConfig.hideEmptyColumns ? t('common:yes') : t('common:no')}
                  </Text>
                </div>
                {viewingPreset.filterConfig.excludePatterns?.length > 0 && (
                  <div>
                    <Text type="secondary">{t('payroll:presets.view_modal.exclude_patterns')}:</Text>
                    <div style={{ marginLeft: 8, marginTop: 4 }}>
                      {viewingPreset.filterConfig.excludePatterns.map((pattern, index) => (
                        <Tag key={index} style={{ marginBottom: 4 }}>{pattern}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </Space>
            </Card>

            <Card size="small">
              <div style={{ marginBottom: 8 }}>
                <Text strong>{t('payroll:presets.view_modal.column_settings')}</Text>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(viewingPreset.columnSettings).map(([key, settings]: [string, any]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>{key}</Text>
                      <Space>
                        {settings.show !== undefined && (
                          <Tag color={settings.show ? 'green' : 'red'}>
                            {settings.show ? t('payroll:presets.view_modal.visible') : t('payroll:presets.view_modal.hidden')}
                          </Tag>
                        )}
                        {settings.fixed && (
                          <Tag color="blue">{t('payroll:presets.view_modal.fixed')}: {settings.fixed}</Tag>
                        )}
                      </Space>
                    </div>
                  ))}
                </Space>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* 复制预设模态框 */}
      <Modal
        title={t('payroll:presets.duplicate_modal.title')}
        open={duplicateModalVisible}
        onCancel={() => {
          setDuplicateModalVisible(false);
          setDuplicatingPreset(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setDuplicateModalVisible(false);
            setDuplicatingPreset(null);
          }}>
            {t('common:button.cancel')}
          </Button>,
          <Button key="duplicate" type="primary" onClick={() => {
            const input = document.getElementById('duplicate-name-input') as HTMLInputElement;
            if (input?.value?.trim()) {
              handleDuplicatePreset(input.value.trim());
            } else {
              message.warning(t('payroll:presets.duplicate_modal.name_required'));
            }
          }}>
            {t('payroll:presets.duplicate')}
          </Button>
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            {t('payroll:presets.duplicate_modal.description', { name: duplicatingPreset?.name })}
          </Text>
        </div>
        <Form layout="vertical">
          <Form.Item
            label={t('payroll:presets.duplicate_modal.new_name_label')}
            required
          >
            <Input
              id="duplicate-name-input"
              placeholder={t('payroll:presets.duplicate_modal.new_name_placeholder')}
              defaultValue={duplicatingPreset ? `${duplicatingPreset.name} - 副本` : ''}
              onPressEnter={() => {
                const input = document.getElementById('duplicate-name-input') as HTMLInputElement;
                if (input?.value?.trim()) {
                  handleDuplicatePreset(input.value.trim());
                }
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}; 