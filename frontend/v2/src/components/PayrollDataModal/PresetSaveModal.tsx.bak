import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Card,
  Input,
  Form,
  Switch,
  Select,
  Typography,
  Radio,
  List,
  Avatar,
  Tag,
  Tooltip,
  Alert,
  Divider,
  Empty,
  message
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  FolderOutlined,
  EditOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type {
  PayrollDataModalPreset,
  ColumnFilterConfig,
  ColumnSettings,
  PresetGroup
} from '../../types/payrollDataPresets';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface PresetSaveModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveNew: (name: string, description?: string, isDefault?: boolean, isPublic?: boolean, category?: string) => void;
  onSaveToExisting: (presetId: number, name?: string, description?: string) => void;
  loading?: boolean;
  availableGroups?: PresetGroup[];
  presets?: PayrollDataModalPreset[];
  getGroupPresetCount?: (groupId: number) => number;
  currentConfig?: {
    filterConfig: ColumnFilterConfig;
    columnSettings: ColumnSettings;
    tableFilterState: any;
  };
}

type SaveMode = 'new' | 'existing';

export const PresetSaveModal: React.FC<PresetSaveModalProps> = ({
  visible,
  onClose,
  onSaveNew,
  onSaveToExisting,
  loading = false,
  availableGroups = [],
  presets = [],
  getGroupPresetCount = () => 0,
  currentConfig
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();
  
  // 状态管理
  const [saveMode, setSaveMode] = useState<SaveMode>('new');
  const [selectedPreset, setSelectedPreset] = useState<PayrollDataModalPreset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const nameInputRef = useRef<any>(null);

  // 筛选预设列表
  const filteredPresets = presets.filter(preset => {
    if (!searchQuery) return true;
    return preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           preset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           preset.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 按分组分类预设
  const groupedPresets = filteredPresets.reduce((groups, preset) => {
    const groupName = preset.category || '未分组';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(preset);
    return groups;
  }, {} as Record<string, PayrollDataModalPreset[]>);

  // 重置表单和状态
  const resetModal = () => {
    form.resetFields();
    setSaveMode('new');
    setSelectedPreset(null);
    setSearchQuery('');
  };

  // 关闭模态框
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // 聚焦名称输入框
  useEffect(() => {
    if (visible && saveMode === 'new') {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [visible, saveMode]);

  // 保存新预设
  const handleSaveNew = async () => {
    try {
      const values = await form.validateFields();
      await onSaveNew(
        values.name,
        values.description,
        values.isDefault,
        values.isPublic,
        values.category
      );
      message.success('新预设创建成功！');
      handleClose();
    } catch (error) {
      console.error('保存新预设失败:', error);
    }
  };

  // 保存到已有预设
  const handleSaveToExisting = async () => {
    if (!selectedPreset) {
      message.warning('请选择要覆盖的预设');
      return;
    }

    try {
      await onSaveToExisting(selectedPreset.id!);
      message.success(`预设"${selectedPreset.name}"已更新！`);
      handleClose();
    } catch (error) {
      console.error('更新预设失败:', error);
    }
  };

  // 选择预设
  const handleSelectPreset = (preset: PayrollDataModalPreset) => {
    setSelectedPreset(preset);
  };

  // 获取预设的状态标签
  const getPresetStatusTags = (preset: PayrollDataModalPreset) => {
    const tags = [];
    
    if (preset.isDefault) {
      tags.push(
        <Tag key="default" color="gold" icon={<StarFilled />}>
          默认
        </Tag>
      );
    }
    
    if (preset.isPublic) {
      tags.push(
        <Tag key="public" color="blue" icon={<TeamOutlined />}>
          公开
        </Tag>
      );
    } else {
      tags.push(
        <Tag key="private" color="default" icon={<UserOutlined />}>
          私有
        </Tag>
      );
    }
    
    return tags;
  };

  // 渲染配置预览
  const renderConfigPreview = () => {
    if (!currentConfig) return null;

    const { filterConfig, tableFilterState } = currentConfig;
    const configItems = [];

    // 筛选配置
    if (filterConfig.hideEmptyColumns) configItems.push('隐藏空列');
    if (filterConfig.hideZeroColumns) configItems.push('隐藏零值列');
    if (filterConfig.showOnlyNumericColumns) configItems.push('仅显示数值列');
    if (filterConfig.includePatterns?.length) configItems.push(`包含模式(${filterConfig.includePatterns.length})`);
    if (filterConfig.excludePatterns?.length) configItems.push(`排除模式(${filterConfig.excludePatterns.length})`);

    // 搜索状态
    if (tableFilterState?.searchQuery) configItems.push(`搜索: "${tableFilterState.searchQuery}"`);
    if (tableFilterState?.searchMode) configItems.push(`搜索模式: ${tableFilterState.searchMode}`);

    return (
      <Alert
        type="info"
        showIcon
        message="当前配置预览"
        description={
          configItems.length > 0 ? (
            <div>
              {configItems.map((item, index) => (
                <Tag key={index} style={{ marginBottom: 4 }}>
                  {item}
                </Tag>
              ))}
            </div>
          ) : (
            <Text type="secondary">默认配置</Text>
          )
        }
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <SaveOutlined />
          保存当前配置
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
      destroyOnClose
    >
      {/* 配置预览 */}
      {renderConfigPreview()}

      {/* 保存方式选择 */}
      <Card style={{ marginBottom: 16 }}>
        <Radio.Group
          value={saveMode}
          onChange={(e) => setSaveMode(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio value="new">
              <Space>
                <PlusOutlined style={{ color: '#52c41a' }} />
                <strong>创建新预设</strong>
                <Text type="secondary">- 创建一个全新的预设配置</Text>
              </Space>
            </Radio>
            <Radio value="existing">
              <Space>
                <EditOutlined style={{ color: '#1890ff' }} />
                <strong>保存到已有预设</strong>
                <Text type="secondary">- 覆盖现有预设的配置</Text>
              </Space>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>

      {/* 创建新预设表单 */}
      {saveMode === 'new' && (
        <Card title={<Space><PlusOutlined />创建新预设</Space>} style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="预设名称"
              rules={[
                { required: true, message: '请输入预设名称' },
                { max: 50, message: '名称不能超过50个字符' }
              ]}
            >
              <Input
                ref={nameInputRef}
                placeholder="为此预设配置起个名字..."
                prefix={<FolderOutlined />}
                showCount
                maxLength={50}
              />
            </Form.Item>
            
            <Form.Item name="description" label="描述（可选）">
              <TextArea
                rows={3}
                placeholder="描述此预设的用途和特点..."
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Form.Item name="category" label="分组">
              <Select
                placeholder="选择分组（可选）"
                allowClear
                options={[
                  { value: '', label: '无分组' },
                  ...availableGroups.map(group => ({
                    value: group.name,
                    label: (
                      <Space>
                        <span style={{ color: group.color }}>{group.name}</span>
                        <Tag color={group.color}>
                          {getGroupPresetCount(group.id!)} 个预设
                        </Tag>
                      </Space>
                    )
                  }))
                ]}
              />
            </Form.Item>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="isDefault" valuePropName="checked">
                <Space>
                  <Switch size="small" />
                  <StarOutlined style={{ color: '#faad14' }} />
                  <span>设为默认预设</span>
                  <Tooltip title="设为默认后，打开页面时会自动应用此预设">
                    <WarningOutlined style={{ color: '#faad14' }} />
                  </Tooltip>
                </Space>
              </Form.Item>

              <Form.Item name="isPublic" valuePropName="checked">
                <Space>
                  <Switch size="small" />
                  <TeamOutlined style={{ color: '#1890ff' }} />
                  <span>设为公开预设</span>
                  <Text type="secondary">（其他用户也可以使用）</Text>
                </Space>
              </Form.Item>
            </Space>
          </Form>
        </Card>
      )}

      {/* 选择已有预设 */}
      {saveMode === 'existing' && (
        <Card 
          title={<Space><EditOutlined />选择要覆盖的预设</Space>}
          style={{ marginBottom: 16 }}
        >
          {/* 搜索框 */}
          <Input.Search
            placeholder="搜索预设名称、描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />

          {/* 预设列表 */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {Object.keys(groupedPresets).length === 0 ? (
              <Empty description="没有找到预设" />
            ) : (
              Object.entries(groupedPresets).map(([groupName, groupPresets]) => (
                <div key={groupName}>
                  <Divider orientation="left" style={{ fontSize: '12px', color: '#999' }}>
                    {groupName} ({groupPresets.length})
                  </Divider>
                  <List
                    size="small"
                    dataSource={groupPresets}
                    renderItem={(preset) => (
                      <List.Item
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedPreset?.id === preset.id ? '#f0f5ff' : 'transparent',
                          border: selectedPreset?.id === preset.id ? '1px solid #1890ff' : '1px solid transparent',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          marginBottom: '4px'
                        }}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor: preset.isDefault ? '#faad14' : '#1890ff'
                              }}
                              icon={preset.isDefault ? <StarFilled /> : <FolderOutlined />}
                            />
                          }
                          title={
                            <Space>
                              {preset.name}
                              {getPresetStatusTags(preset)}
                            </Space>
                          }
                          description={
                            <div>
                              {preset.description && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {preset.description}
                                </Text>
                              )}
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  <ClockCircleOutlined /> {new Date(preset.updatedAt!).toLocaleString('zh-CN')}
                                </Text>
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ))
            )}
          </div>

          {selectedPreset && (
            <Alert
              type="warning"
              showIcon
              message="覆盖确认"
              description={`您正在覆盖预设"${selectedPreset.name}"，原配置将被替换为当前配置。`}
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      {/* 操作按钮 */}
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={handleClose}>
            取消
          </Button>
          {saveMode === 'new' ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={loading}
              onClick={handleSaveNew}
            >
              创建预设
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSaveToExisting}
              disabled={!selectedPreset}
            >
              保存到预设
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default PresetSaveModal;