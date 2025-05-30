import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Button, Space, Tag, Tooltip, Modal, Form, Input, Switch, Divider } from 'antd';
import { 
  SettingOutlined, 
  EditOutlined, 
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  EyeOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { DataSource, ReportField, FieldItem, DataSourceJoin } from './types';

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MappingCard = styled(Card)`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .ant-card-head {
    background: #f0f2f5;
    border-bottom: 1px solid #d9d9d9;
    flex-shrink: 0;
  }
  
  .ant-card-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
  }
`;

const FieldTag = styled(Tag)`
  margin: 2px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

interface FieldMappingPanelProps {
  dataSources: DataSource[];
  selectedFields: ReportField[];
  joins: DataSourceJoin[];
  onFieldsChange: (fields: ReportField[]) => void;
  multiSelectMode?: boolean;
  selectedDataSources?: string[];
}

const FieldMappingPanel: React.FC<FieldMappingPanelProps> = ({
  dataSources,
  selectedFields,
  joins,
  onFieldsChange,
  multiSelectMode = false,
  selectedDataSources = []
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<ReportField | null>(null);
  const [form] = Form.useForm();

  // 检测是否为多数据源配置
  const isMultiDataSourceConfig = multiSelectMode && selectedDataSources.length > 1 && joins.length > 0;

  // 生成智能提示内容
  const getEmptyStateContent = () => {
    if (isMultiDataSourceConfig) {
      return {
        icon: <DatabaseOutlined style={{ fontSize: '24px', marginBottom: '12px', color: '#1890ff' }} />,
        title: '多数据源配置已就绪',
        description: (
          <div>
            <div style={{ marginBottom: '8px' }}>
              已配置 {selectedDataSources.length} 个数据源和 {joins.length} 个关联关系
            </div>
            <div style={{ fontSize: '12px' }}>
              请在左侧数据源面板中选择需要显示的字段，或者点击预览按钮查看自动生成的默认字段
            </div>
          </div>
        ),
        extra: (
          <Button 
            type="primary" 
            size="small"
            onClick={() => {
              // 自动添加每个数据源的默认字段
              const autoFields: ReportField[] = [];
              selectedDataSources.forEach((dsId, index) => {
                const ds = dataSources.find(d => d.id === dsId);
                if (ds) {
                  autoFields.push({
                    id: `auto_${dsId}_id`,
                    field_name: 'id',
                    field_alias: `${ds.name}_ID`,
                    data_source: dsId,
                    source_data_source_id: dsId,
                    field_type: 'number',
                    display_order: index * 2,
                    is_visible: true,
                    is_sortable: true,
                    is_filterable: true,
                    width: 100,
                    formatting_config: {},
                    qualified_field_name: `${dsId}.id`
                  });
                  
                  autoFields.push({
                    id: `auto_${dsId}_name`,
                    field_name: 'name',
                    field_alias: `${ds.name}_名称`,
                    data_source: dsId,
                    source_data_source_id: dsId,
                    field_type: 'string',
                    display_order: index * 2 + 1,
                    is_visible: true,
                    is_sortable: true,
                    is_filterable: true,
                    width: 150,
                    formatting_config: {},
                    qualified_field_name: `${dsId}.name`
                  });
                }
              });
              onFieldsChange(autoFields);
            }}
          >
            自动添加默认字段
          </Button>
        )
      };
    }
    
    return {
      icon: <SettingOutlined style={{ fontSize: '24px', marginBottom: '12px' }} />,
      title: '暂无字段需要配置',
      description: '请先在数据源面板中添加字段，然后在此处进行高级配置'
    };
  };

  const emptyState = getEmptyStateContent();

  // 获取数据源名称
  const getDataSourceName = (id: string) => {
    return dataSources.find(ds => ds.id === id)?.name || id;
  };

  // 获取字段的可用关联显示选项
  const getRelatedDisplayOptions = (field: ReportField) => {
    const options: Array<{ label: string; value: string; description?: string }> = [];
    
    // 添加原始字段值选项
    options.push({
      label: `${field.field_alias} (原始值)`,
      value: field.qualified_field_name || field.field_name,
      description: '显示字段的原始值'
    });

    // 查找相关的外键关联
    const sourceDataSource = dataSources.find(ds => ds.id === field.source_data_source_id);
    if (sourceDataSource) {
      const sourceField = sourceDataSource.fields.find(f => f.field_name === field.field_name);
      
      if (sourceField?.is_foreign_key && sourceField.foreign_key_info) {
        // 查找目标数据源
        const targetDataSource = dataSources.find(ds => 
          ds.fields.some(f => 
            f.field_name === sourceField.foreign_key_info!.referenced_column_name &&
            ds.name.toLowerCase().includes(sourceField.foreign_key_info!.referenced_table_name)
          )
        );
        
        if (targetDataSource) {
          // 添加目标数据源的可显示字段
          targetDataSource.fields
            .filter(f => f.field_type === 'string' && f.field_name !== 'id')
            .forEach(targetField => {
              options.push({
                label: `${targetField.field_alias || targetField.field_name} (关联显示)`,
                value: `${targetDataSource.id}.${targetField.field_name}`,
                description: `通过 ${sourceField.field_alias} 关联显示 ${targetDataSource.name} 的 ${targetField.field_alias || targetField.field_name}`
              });
            });
        }
      }
    }

    return options;
  };

  // 编辑字段映射
  const handleEditField = (field: ReportField) => {
    setEditingField(field);
    form.setFieldsValue({
      field_alias: field.field_alias,
      display_field: field.qualified_field_name || field.field_name,
      is_visible: field.is_visible,
      width: field.width,
      formatting_config: field.formatting_config
    });
    setIsModalVisible(true);
  };

  // 保存字段映射
  const handleSaveField = async () => {
    try {
      const values = await form.validateFields();
      const updatedFields = selectedFields.map(field => 
        field.id === editingField?.id ? { 
          ...field, 
          ...values,
          // 如果选择了关联显示，更新相关配置
          is_related_display: values.display_field !== (field.qualified_field_name || field.field_name)
        } : field
      );
      onFieldsChange(updatedFields);
      setIsModalVisible(false);
      setEditingField(null);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 删除字段
  const handleDeleteField = (fieldId: string) => {
    const updatedFields = selectedFields.filter(field => field.id !== fieldId);
    onFieldsChange(updatedFields);
  };

  // 一键重置所有字段
  const handleResetAllFields = () => {
    Modal.confirm({
      title: '确认重置',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要清空所有已添加的字段吗？</p>
          <p style={{ color: '#999', fontSize: '12px' }}>
            此操作不可撤销，当前已添加的 {selectedFields.length} 个字段将被全部移除。
          </p>
        </div>
      ),
      okText: '确定重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        onFieldsChange([]);
        Modal.success({
          title: '重置成功',
          content: '所有字段已清空，请重新添加需要的字段。',
        });
      }
    });
  };

  // 表格列配置
  const columns = [
    {
      title: t('fieldName'),
      key: 'field',
      render: (record: ReportField) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{record.field_alias}</span>
          <Tag color="blue">{getDataSourceName(record.source_data_source_id || record.data_source)}</Tag>
          {record.is_related_display && (
            <Tag color="orange" icon={<LinkOutlined />}>
              关联显示
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: t('fieldType'),
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: (type: string) => <Tag color="green">{type}</Tag>
    },
    {
      title: t('displayConfig'),
      key: 'display',
      render: (record: ReportField) => (
        <Space>
          {record.is_visible ? (
            <Tag color="green" icon={<EyeOutlined />}>可见</Tag>
          ) : (
            <Tag color="red">隐藏</Tag>
          )}
          {record.width && <Tag>宽度: {record.width}px</Tag>}
          {record.formatting_config?.format_type && (
            <Tag color="purple">{record.formatting_config.format_type}</Tag>
          )}
        </Space>
      )
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 120,
      render: (record: ReportField) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditField(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteField(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <PanelContainer>
      <MappingCard
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <SettingOutlined />
              {t('fieldMapping')}
              <Tooltip title={t('fieldMappingTooltip')}>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
              {selectedFields.length > 0 && (
                <Tag color="blue">{selectedFields.length} 个字段</Tag>
              )}
            </Space>
            
            {selectedFields.length > 0 && (
              <Tooltip title="清空所有已添加的字段">
                <Button 
                  type="text" 
                  size="small" 
                  danger
                  icon={<ClearOutlined />}
                  onClick={handleResetAllFields}
                >
                  重置
                </Button>
              </Tooltip>
            )}
          </div>
        }
        size="small"
      >
        {/* 操作提示 */}
        {selectedFields.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 20px',
            border: '1px dashed #d9d9d9',
            borderRadius: '6px',
            background: '#fafafa'
          }}>
            {emptyState.icon}
            <div style={{ marginBottom: '8px' }}>{emptyState.title}</div>
            <div style={{ fontSize: '12px' }}>{emptyState.description}</div>
            {emptyState.extra}
          </div>
        ) : (
          <>
            {/* 批量操作栏 */}
            <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#f6f8fa', borderRadius: '4px' }}>
              <Space>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  批量操作：
                </span>
                <Button 
                  size="small" 
                  type="link" 
                  style={{ padding: '0 4px', height: 'auto' }}
                  onClick={() => {
                    const updatedFields = selectedFields.map(field => ({
                      ...field,
                      is_visible: true
                    }));
                    onFieldsChange(updatedFields);
                  }}
                >
                  全部显示
                </Button>
                <Divider type="vertical" style={{ margin: '0 4px' }} />
                <Button 
                  size="small" 
                  type="link" 
                  style={{ padding: '0 4px', height: 'auto' }}
                  onClick={() => {
                    const updatedFields = selectedFields.map(field => ({
                      ...field,
                      is_sortable: true
                    }));
                    onFieldsChange(updatedFields);
                  }}
                >
                  全部可排序
                </Button>
                <Divider type="vertical" style={{ margin: '0 4px' }} />
                <Button 
                  size="small" 
                  type="link" 
                  style={{ padding: '0 4px', height: 'auto' }}
                  onClick={() => {
                    const updatedFields = selectedFields.map(field => ({
                      ...field,
                      is_filterable: true
                    }));
                    onFieldsChange(updatedFields);
                  }}
                >
                  全部可筛选
                </Button>
              </Space>
            </div>
            
            <Table
              dataSource={selectedFields}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{
                emptyText: t('noFieldsSelected')
              }}
            />
          </>
        )}
      </MappingCard>

      {/* 编辑字段模态框 */}
      <Modal
        title={t('editFieldMapping')}
        open={isModalVisible}
        onOk={handleSaveField}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingField(null);
          form.resetFields();
        }}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="field_alias"
            label={t('fieldAlias')}
            rules={[{ required: true, message: t('pleaseEnterFieldAlias') }]}
          >
            <Input placeholder={t('fieldAliasPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="display_field"
            label={t('displayField')}
            rules={[{ required: true, message: t('pleaseSelectDisplayField') }]}
          >
            <Select
              placeholder={t('selectDisplayField')}
              showSearch
              optionFilterProp="label"
              options={editingField ? getRelatedDisplayOptions(editingField) : []}
              optionRender={(option) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{option.label}</div>
                  {option.data.description && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {option.data.description}
                    </div>
                  )}
                </div>
              )}
            />
          </Form.Item>

          <Form.Item
            name="is_visible"
            label={t('isVisible')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="width"
            label={t('columnWidth')}
          >
            <Input
              type="number"
              placeholder={t('columnWidthPlaceholder')}
              addonAfter="px"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PanelContainer>
  );
};

export default FieldMappingPanel; 