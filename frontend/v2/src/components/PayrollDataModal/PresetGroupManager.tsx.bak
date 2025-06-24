import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  List,
  Space,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  ColorPicker,
  Tooltip
} from 'antd';
import {
  FolderOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePresetGroups } from '../../hooks/usePresetGroups';
import type { PresetGroup } from '../../types/payrollDataPresets';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface PresetGroupManagerProps {
  visible: boolean;
  onClose: () => void;
}

interface GroupFormModalProps {
  visible: boolean;
  group: PresetGroup | null;
  onClose: () => void;
  onSave: (group: Omit<PresetGroup, 'id'>) => void;
  loading?: boolean;
}

// 预定义的图标选项
const ICON_OPTIONS = [
  { value: 'FolderOutlined', label: '文件夹', icon: <FolderOutlined /> },
  { value: 'AppstoreOutlined', label: '应用', icon: <AppstoreOutlined /> },
  { value: 'FileTextOutlined', label: '文档', icon: <FileTextOutlined /> },
  { value: 'BarChartOutlined', label: '图表', icon: <BarChartOutlined /> },
  { value: 'SettingOutlined', label: '设置', icon: <SettingOutlined /> },
  { value: 'UserOutlined', label: '用户', icon: <UserOutlined /> },
  { value: 'TeamOutlined', label: '团队', icon: <TeamOutlined /> },
  { value: 'BankOutlined', label: '银行', icon: <BankOutlined /> },
  { value: 'CalendarOutlined', label: '日历', icon: <CalendarOutlined /> },
  { value: 'CheckCircleOutlined', label: '完成', icon: <CheckCircleOutlined /> },
  { value: 'ExclamationCircleOutlined', label: '重要', icon: <ExclamationCircleOutlined /> }
];

// 预定义的颜色选项
const COLOR_PRESETS = [
  '#1890ff', '#52c41a', '#722ed1', '#fa8c16',
  '#f5222d', '#eb2f96', '#13c2c2', '#faad14',
  '#a0d911', '#2f54eb', '#fa541c', '#c41d7f'
];

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'AppstoreOutlined': return <AppstoreOutlined />;
    case 'FileTextOutlined': return <FileTextOutlined />;
    case 'BarChartOutlined': return <BarChartOutlined />;
    case 'SettingOutlined': return <SettingOutlined />;
    case 'UserOutlined': return <UserOutlined />;
    case 'TeamOutlined': return <TeamOutlined />;
    case 'BankOutlined': return <BankOutlined />;
    case 'CalendarOutlined': return <CalendarOutlined />;
    case 'CheckCircleOutlined': return <CheckCircleOutlined />;
    case 'ExclamationCircleOutlined': return <ExclamationCircleOutlined />;
    default: return <FolderOutlined />;
  }
};

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  visible,
  group,
  onClose,
  onSave,
  loading = false
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        color: group.color || '#1890ff',
        icon: group.icon || 'FolderOutlined'
      });
    } else if (visible && !group) {
      form.setFieldsValue({
        color: '#1890ff',
        icon: 'FolderOutlined'
      });
    }
  }, [visible, group, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理ColorPicker返回的颜色值
      const processedValues = {
        ...values,
        color: typeof values.color === 'string' 
          ? values.color 
          : values.color?.toHexString?.() || '#1890ff',
        sort_order: 0, // 添加默认排序
        is_active: true // 添加默认状态
      };
      
      console.log('🎯 [GroupFormModal] 保存分组数据:', processedValues);
      onSave(processedValues);
      form.resetFields();
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
      title={group ? t('payroll:presets.group_manager.edit_group') : t('payroll:presets.group_manager.create_group')}
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
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('payroll:presets.group_manager.group_name')}
          rules={[
            { required: true, message: t('payroll:presets.group_manager.name_required') },
            { max: 50, message: t('payroll:presets.group_manager.name_too_long') }
          ]}
        >
          <Input placeholder={t('payroll:presets.group_manager.name_placeholder')} />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('payroll:presets.group_manager.group_description')}
          rules={[{ max: 200, message: t('payroll:presets.group_manager.description_too_long') }]}
        >
          <TextArea
            rows={3}
            placeholder={t('payroll:presets.group_manager.description_placeholder')}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="color"
              label={t('payroll:presets.group_manager.group_color')}
            >
              <ColorPicker
                presets={[
                  {
                    label: t('payroll:presets.group_manager.preset_colors'),
                    colors: COLOR_PRESETS
                  }
                ]}
                showText
                format="hex"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="icon"
              label={t('payroll:presets.group_manager.group_icon')}
            >
              <Select
                placeholder={t('payroll:presets.group_manager.icon_placeholder')}
                optionRender={(option) => (
                  <Space>
                    {option.data.icon}
                    <span>{option.data.label}</span>
                  </Space>
                )}
              >
                {ICON_OPTIONS.map(option => (
                  <Select.Option 
                    key={option.value} 
                    value={option.value}
                    icon={option.icon}
                    label={option.label}
                  >
                    <Space>
                      {option.icon}
                      <span>{option.label}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label={t('payroll:presets.group_manager.preview')}>
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const name = getFieldValue('name') || t('payroll:presets.group_manager.preview_name');
                const color = typeof getFieldValue('color') === 'string' 
                  ? getFieldValue('color') 
                  : getFieldValue('color')?.toHexString?.() || '#1890ff';
                const icon = getFieldValue('icon') || 'FolderOutlined';
                
                return (
                  <div>
                    <Space>
                      <span style={{ color, fontSize: '18px' }}>
                        {getIconComponent(icon)}
                      </span>
                      <Text strong style={{ color }}>{name}</Text>
                      <Tag color={color}>
                        {t('payroll:presets.group_manager.preview_tag')}
                      </Tag>
                    </Space>
                  </div>
                );
              }}
            </Form.Item>
          </Card>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const PresetGroupManager: React.FC<PresetGroupManagerProps> = ({
  visible,
  onClose
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PresetGroup | null>(null);
  
  // 使用真实的分组数据和操作
  const {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupPresetCount
  } = usePresetGroups();

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setFormModalVisible(true);
  };

  const handleEditGroup = (group: PresetGroup) => {
    setEditingGroup(group);
    setFormModalVisible(true);
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await deleteGroup(groupId);
    } catch (error) {
      // 错误处理已在Hook中完成
      console.error('Failed to delete group:', error);
    }
  };

  const handleSaveGroup = async (groupData: Omit<PresetGroup, 'id'>) => {
    try {
      if (editingGroup) {
        // 编辑现有分组
        await updateGroup(editingGroup.id!, groupData);
      } else {
        // 创建新分组
        await createGroup(groupData);
      }
      
      setFormModalVisible(false);
      setEditingGroup(null);
    } catch (error) {
      // 错误处理已在Hook中完成
      console.error('Failed to save group:', error);
    }
  };

  const renderGroupStats = (group: PresetGroup) => {
    // 使用真实的预设数量数据
    const presetCount = getGroupPresetCount(group.id!);
    
    return (
      <Space size="small">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {presetCount} {t('payroll:presets.group_manager.presets_count')}
        </Text>
        {group.createdAt && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t('payroll:presets.group_manager.created_at')}: {new Date(group.createdAt).toLocaleDateString()}
          </Text>
        )}
      </Space>
    );
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <FolderOutlined />
            {t('payroll:presets.group_manager.title')}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            {t('common:button.close')}
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Title level={5} style={{ margin: 0 }}>
                  {t('payroll:presets.group_manager.manage_groups')}
                </Title>
                <Text type="secondary">
                  ({groups.length} {t('payroll:presets.group_manager.total_groups')})
                </Text>
              </Space>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreateGroup}
              >
                {t('payroll:presets.group_manager.create_group')}
              </Button>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {groups.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Space direction="vertical" size="large">
                <FolderOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    {t('payroll:presets.group_manager.no_groups')}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {t('payroll:presets.group_manager.create_first_group')}
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  size="large"
                  onClick={handleCreateGroup}
                >
                  {t('payroll:presets.group_manager.create_group')}
                </Button>
              </Space>
            </Card>
          ) : (
            <List
              dataSource={groups}
              loading={loading}
              renderItem={(group, index) => (
                <List.Item
                  key={group.id}
                  actions={[
                    <Tooltip title={t('payroll:presets.group_manager.drag_to_reorder')}>
                      <Button 
                        type="text" 
                        icon={<DragOutlined />} 
                        size="small"
                        style={{ cursor: 'grab' }}
                      />
                    </Tooltip>,
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => handleEditGroup(group)}
                    >
                      {t('common:button.edit')}
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title={t('payroll:presets.group_manager.delete_confirm_title')}
                      description={t('payroll:presets.group_manager.delete_confirm_content', { name: group.name })}
                      okText={t('common:button.delete')}
                      cancelText={t('common:button.cancel')}
                      okType="danger"
                      onConfirm={() => handleDeleteGroup(group.id!)}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        {t('common:button.delete')}
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ 
                        color: group.color || '#1890ff', 
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        backgroundColor: `${group.color || '#1890ff'}15`,
                        borderRadius: '8px'
                      }}>
                        {getIconComponent(group.icon)}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong style={{ color: group.color || '#1890ff' }}>
                          {group.name}
                        </Text>
                        <Tag color={group.color || '#1890ff'} style={{ fontSize: '11px' }}>
                          #{index + 1}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        {group.description && (
                          <div style={{ marginBottom: 8 }}>
                            <Text type="secondary">{group.description}</Text>
                          </div>
                        )}
                        {renderGroupStats(group)}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>

      <GroupFormModal
        visible={formModalVisible}
        group={editingGroup}
        onClose={() => {
          setFormModalVisible(false);
          setEditingGroup(null);
        }}
        onSave={handleSaveGroup}
        loading={loading}
      />
    </>
  );
};