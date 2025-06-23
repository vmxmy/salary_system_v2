import React, { useState, useMemo } from 'react';
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
  message,
  Typography,
  Divider,
  Empty,
  Card,
  Select,
  Collapse,
  Row,
  Col,
  Avatar
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  StarOutlined,
  StarFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FolderOutlined,
  PlusOutlined,
  UserOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

// Universal preset interfaces
export interface UniversalPreset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isDefault?: boolean;
  isFavorite?: boolean;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
  creator?: string;
  config: {
    filterConfig?: any;
    searchQuery?: string;
    searchMode?: string;
    tableState?: any;
    [key: string]: any;
  };
}

interface ConfigPresetManagerProps {
  visible: boolean;
  onClose: () => void;
  currentConfig: any;
  presets: UniversalPreset[];
  onApplyPreset: (preset: UniversalPreset) => void;
  onSavePreset: (name: string, description?: string, metadata?: any) => void;
  onDeletePreset: (presetId: string) => void;
  categories?: string[];
  title?: string;
  allowPublic?: boolean;
  showUsageStats?: boolean;
}

interface SavePresetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string, metadata?: any) => void;
  categories?: string[];
  allowPublic?: boolean;
}

interface EditPresetModalProps {
  visible: boolean;
  preset: UniversalPreset | null;
  onClose: () => void;
  onUpdate: (preset: UniversalPreset) => void;
  categories?: string[];
  allowPublic?: boolean;
}

const SavePresetModal: React.FC<SavePresetModalProps> = ({
  visible,
  onClose,
  onSave,
  categories = [],
  allowPublic = false
}) => {
  const { t } = useTranslation(['common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const metadata = {
        category: values.category,
        isDefault: values.isDefault || false,
        isPublic: allowPublic ? (values.isPublic || false) : false,
        description: values.description
      };
      
      await onSave(values.name, values.description, metadata);
      form.resetFields();
      onClose();
      message.success(t('preset.save_success', { defaultValue: '预设保存成功' }));
    } catch (error) {
      console.error('Save preset failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('preset.save_title', { defaultValue: '保存预设配置' })}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel', { defaultValue: '取消' })}
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          {t('common.save', { defaultValue: '保存' })}
        </Button>
      ]}
      width={480}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t('preset.name', { defaultValue: '预设名称' })}
          name="name"
          rules={[
            { required: true, message: t('preset.name_required', { defaultValue: '请输入预设名称' }) },
            { max: 50, message: t('preset.name_too_long', { defaultValue: '名称不能超过50个字符' }) }
          ]}
        >
          <Input placeholder={t('preset.name_placeholder', { defaultValue: '请输入预设名称' })} />
        </Form.Item>

        <Form.Item
          label={t('preset.description', { defaultValue: '描述' })}
          name="description"
        >
          <Input.TextArea 
            rows={3} 
            placeholder={t('preset.description_placeholder', { defaultValue: '请输入预设描述(可选)' })}
            maxLength={200}
          />
        </Form.Item>

        {categories.length > 0 && (
          <Form.Item
            label={t('preset.category', { defaultValue: '分类' })}
            name="category"
          >
            <Select 
              placeholder={t('preset.category_placeholder', { defaultValue: '选择分类(可选)' })}
              allowClear
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="isDefault" valuePropName="checked">
              <div>
                <StarOutlined style={{ marginRight: 8, color: '#faad14' }} />
                {t('preset.set_as_default', { defaultValue: '设为默认' })}
              </div>
            </Form.Item>
          </Col>
          {allowPublic && (
            <Col span={12}>
              <Form.Item name="isPublic" valuePropName="checked">
                <div>
                  <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {t('preset.make_public', { defaultValue: '公开共享' })}
                </div>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

const EditPresetModal: React.FC<EditPresetModalProps> = ({
  visible,
  preset,
  onClose,
  onUpdate,
  categories = [],
  allowPublic = false
}) => {
  const { t } = useTranslation(['common']);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (preset && visible) {
      form.setFieldsValue({
        name: preset.name,
        description: preset.description,
        category: preset.category,
        isDefault: preset.isDefault,
        isPublic: preset.isPublic
      });
    }
  }, [preset, visible, form]);

  const handleUpdate = async () => {
    if (!preset) return;
    
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const updatedPreset: UniversalPreset = {
        ...preset,
        name: values.name,
        description: values.description,
        category: values.category,
        isDefault: values.isDefault || false,
        isPublic: allowPublic ? (values.isPublic || false) : preset.isPublic,
        updatedAt: dayjs().toISOString()
      };
      
      await onUpdate(updatedPreset);
      onClose();
      message.success(t('preset.update_success', { defaultValue: '预设更新成功' }));
    } catch (error) {
      console.error('Update preset failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('preset.edit_title', { defaultValue: '编辑预设配置' })}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel', { defaultValue: '取消' })}
        </Button>,
        <Button key="update" type="primary" loading={loading} onClick={handleUpdate}>
          {t('common.update', { defaultValue: '更新' })}
        </Button>
      ]}
      width={480}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t('preset.name', { defaultValue: '预设名称' })}
          name="name"
          rules={[
            { required: true, message: t('preset.name_required', { defaultValue: '请输入预设名称' }) },
            { max: 50, message: t('preset.name_too_long', { defaultValue: '名称不能超过50个字符' }) }
          ]}
        >
          <Input placeholder={t('preset.name_placeholder', { defaultValue: '请输入预设名称' })} />
        </Form.Item>

        <Form.Item
          label={t('preset.description', { defaultValue: '描述' })}
          name="description"
        >
          <Input.TextArea 
            rows={3} 
            placeholder={t('preset.description_placeholder', { defaultValue: '请输入预设描述(可选)' })}
            maxLength={200}
          />
        </Form.Item>

        {categories.length > 0 && (
          <Form.Item
            label={t('preset.category', { defaultValue: '分类' })}
            name="category"
          >
            <Select 
              placeholder={t('preset.category_placeholder', { defaultValue: '选择分类(可选)' })}
              allowClear
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="isDefault" valuePropName="checked">
              <div>
                <StarOutlined style={{ marginRight: 8, color: '#faad14' }} />
                {t('preset.set_as_default', { defaultValue: '设为默认' })}
              </div>
            </Form.Item>
          </Col>
          {allowPublic && (
            <Col span={12}>
              <Form.Item name="isPublic" valuePropName="checked">
                <div>
                  <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {t('preset.make_public', { defaultValue: '公开共享' })}
                </div>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export const ConfigPresetManager: React.FC<ConfigPresetManagerProps> = ({
  visible,
  onClose,
  currentConfig,
  presets = [],
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  categories = [],
  title = '配置预设管理',
  allowPublic = false,
  showUsageStats = true
}) => {
  const { t } = useTranslation(['common']);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<UniversalPreset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  // Group presets by category
  const groupedPresets = useMemo(() => {
    const filtered = presets.filter(preset => {
      const matchesSearch = !searchQuery || 
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || preset.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    const groups: Record<string, UniversalPreset[]> = {};
    
    filtered.forEach(preset => {
      const category = preset.category || t('preset.uncategorized', { defaultValue: '未分类' });
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(preset);
    });

    // Sort presets within each group
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => {
        // Favorites first
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        
        // Defaults next
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        
        // Then by usage count (descending)
        if (showUsageStats) {
          const usageDiff = (b.usageCount || 0) - (a.usageCount || 0);
          if (usageDiff !== 0) return usageDiff;
        }
        
        // Finally by name
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [presets, searchQuery, selectedCategory, t, showUsageStats]);

  const availableCategories = useMemo(() => {
    const presetCategories = Array.from(new Set(presets.map(p => p.category).filter(Boolean) as string[]));
    return [...categories, ...presetCategories];
  }, [categories, presets]);

  const handleApplyPreset = (preset: UniversalPreset) => {
    onApplyPreset(preset);
    message.success(`${t('preset.applied', { defaultValue: '已应用预设' })}: ${preset.name}`);
  };

  const handleDeletePreset = (preset: UniversalPreset) => {
    onDeletePreset(preset.id);
    message.success(`${t('preset.deleted', { defaultValue: '已删除预设' })}: ${preset.name}`);
  };

  const handleCopyPreset = (preset: UniversalPreset) => {
    const newName = `${preset.name} - ${t('preset.copy', { defaultValue: '副本' })}`;
    onSavePreset(newName, preset.description, {
      category: preset.category,
      config: preset.config
    });
    message.success(`${t('preset.copied', { defaultValue: '已复制预设' })}: ${newName}`);
  };

  const renderPresetItem = (preset: UniversalPreset) => {
    const actions = [
      <Tooltip key="apply" title={t('preset.apply', { defaultValue: '应用' })}>
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleApplyPreset(preset)}
        >
          {t('preset.apply', { defaultValue: '应用' })}
        </Button>
      </Tooltip>,
      <Tooltip key="copy" title={t('preset.copy', { defaultValue: '复制' })}>
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={() => handleCopyPreset(preset)}
        />
      </Tooltip>,
      <Tooltip key="edit" title={t('preset.edit', { defaultValue: '编辑' })}>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedPreset(preset);
            setEditModalVisible(true);
          }}
        />
      </Tooltip>,
      <Popconfirm
        key="delete"
        title={t('preset.delete_confirm', { defaultValue: '确定删除此预设吗？' })}
        onConfirm={() => handleDeletePreset(preset)}
        okText={t('common.ok', { defaultValue: '确定' })}
        cancelText={t('common.cancel', { defaultValue: '取消' })}
      >
        <Tooltip title={t('preset.delete', { defaultValue: '删除' })}>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
          />
        </Tooltip>
      </Popconfirm>
    ];

    return (
      <List.Item actions={actions}>
        <List.Item.Meta
          avatar={
            <Avatar size="small" style={{ backgroundColor: preset.isDefault ? '#faad14' : '#1890ff' }}>
              {preset.isDefault ? <StarFilled /> : <SettingOutlined />}
            </Avatar>
          }
          title={
            <Space>
              <span>{preset.name}</span>
              {preset.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
              {preset.isPublic && <GlobalOutlined style={{ color: '#1890ff' }} />}
              {preset.isDefault && (
                <Tag color="gold">
                  {t('preset.default', { defaultValue: '默认' })}
                </Tag>
              )}
            </Space>
          }
          description={
            <div>
              {preset.description && (
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {preset.description}
                  </Text>
                </div>
              )}
              <Space size="small">
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <ClockCircleOutlined style={{ marginRight: 2 }} />
                  {dayjs(preset.updatedAt).format('YYYY-MM-DD HH:mm')}
                </Text>
                {showUsageStats && preset.usageCount > 0 && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    使用 {preset.usageCount} 次
                  </Text>
                )}
                {preset.creator && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    <UserOutlined style={{ marginRight: 2 }} />
                    {preset.creator}
                  </Text>
                )}
              </Space>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <SettingOutlined />
            {title}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="save" type="primary" icon={<PlusOutlined />} onClick={() => setSaveModalVisible(true)}>
            {t('preset.save_current', { defaultValue: '保存当前配置' })}
          </Button>,
          <Button key="close" onClick={onClose}>
            {t('common.close', { defaultValue: '关闭' })}
          </Button>
        ]}
        width={800}
        style={{ top: 50 }}
      >
        {/* Search and Filter */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={16}>
            <Input.Search
              placeholder={t('preset.search_placeholder', { defaultValue: '搜索预设名称或描述...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={setSearchQuery}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select
              placeholder={t('preset.filter_category', { defaultValue: '按分类筛选' })}
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
              style={{ width: '100%' }}
            >
              {availableCategories.map(category => (
                <Option key={category} value={category}>
                  <FolderOutlined style={{ marginRight: 4 }} />
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Preset Statistics */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
          <Row gutter={16} style={{ textAlign: 'center' }}>
            <Col span={6}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {presets.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('preset.total_count', { defaultValue: '总预设数' })}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                {presets.filter(p => p.isFavorite).length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('preset.favorite_count', { defaultValue: '收藏数' })}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                {presets.filter(p => p.isDefault).length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('preset.default_count', { defaultValue: '默认预设' })}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                {Object.keys(groupedPresets).length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('preset.category_count', { defaultValue: '分类数' })}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Preset List */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {Object.keys(groupedPresets).length === 0 ? (
            <Empty description={t('preset.no_presets', { defaultValue: '暂无预设配置' })} />
          ) : (
            <Collapse defaultActiveKey={Object.keys(groupedPresets)} ghost>
              {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
                <Panel
                  key={category}
                  header={
                    <Space>
                      <FolderOutlined />
                      <span>{category}</span>
                      <Tag>{categoryPresets.length}</Tag>
                    </Space>
                  }
                >
                  <List
                    dataSource={categoryPresets}
                    renderItem={renderPresetItem}
                    size="small"
                  />
                </Panel>
              ))}
            </Collapse>
          )}
        </div>
      </Modal>

      {/* Save Preset Modal */}
      <SavePresetModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={onSavePreset}
        categories={availableCategories}
        allowPublic={allowPublic}
      />

      {/* Edit Preset Modal */}
      <EditPresetModal
        visible={editModalVisible}
        preset={selectedPreset}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedPreset(null);
        }}
        onUpdate={(updatedPreset) => {
          // Handle preset update logic here
          message.success(t('preset.update_success', { defaultValue: '预设更新成功' }));
        }}
        categories={availableCategories}
        allowPublic={allowPublic}
      />
    </>
  );
};

export default ConfigPresetManager;