import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Table, Space, Tag, Alert, Tooltip, Modal, Form, Input, Empty, Typography } from 'antd';
import { 
  LinkOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { DataSource, DataSourceJoin, DataSourceRelationship } from './types';

const { Text } = Typography;

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SectionCard = styled(Card)`
  margin-bottom: 16px;
  
  .ant-card-head {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    min-height: 48px;
    
    .ant-card-head-title {
      font-size: 14px;
      font-weight: 500;
    }
  }
  
  .ant-card-body {
    padding: 16px;
  }
`;

const JoinVisualization = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
`;

const DataSourceBox = styled.div`
  flex: 1;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  
  .ds-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .field-name {
    font-size: 12px;
    color: #595959;
  }
`;

const JoinTypeBox = styled.div`
  padding: 4px 12px;
  background: #1890ff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

const EmptyStateWrapper = styled.div`
  text-align: center;
  padding: 40px 20px;
  
  .ant-empty-description {
    color: #8c8c8c;
    margin-top: 12px;
  }
`;

interface DataSourceJoinPanelProps {
  dataSources: DataSource[];
  selectedDataSources: string[];
  joins: DataSourceJoin[];
  onJoinsChange: (joins: DataSourceJoin[]) => void;
}

const DataSourceJoinPanel: React.FC<DataSourceJoinPanelProps> = ({
  dataSources,
  selectedDataSources,
  joins,
  onJoinsChange
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [availableRelationships, setAvailableRelationships] = useState<DataSourceRelationship[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingJoin, setEditingJoin] = useState<DataSourceJoin | null>(null);
  const [form] = Form.useForm();

  // 获取可用的关联关系
  useEffect(() => {
    const relationships: DataSourceRelationship[] = [];
    
    selectedDataSources.forEach(dsId => {
      const dataSource = dataSources.find(ds => ds.id === dsId);
      
      if (dataSource?.relationships) {
        const validRelationships = dataSource.relationships.filter(rel => 
          selectedDataSources.includes(rel.target_data_source_id)
        );
        relationships.push(...validRelationships);
      }
    });
    
    setAvailableRelationships(relationships);
  }, [dataSources, selectedDataSources]);

  // 获取数据源名称
  const getDataSourceName = (id: string) => {
    return dataSources.find(ds => ds.id === id)?.name || id;
  };

  // 获取字段名称
  const getFieldDisplayName = (dataSourceId: string, fieldName: string) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    const field = dataSource?.fields.find(f => f.field_name === fieldName);
    return field?.field_alias || fieldName;
  };

  // 添加关联
  const handleAddJoin = (relationship: DataSourceRelationship) => {
    const newJoin: DataSourceJoin = {
      id: `join_${Date.now()}`,
      left_data_source_id: relationship.source_data_source_id,
      left_field_name: relationship.source_field_name,
      right_data_source_id: relationship.target_data_source_id,
      right_field_name: relationship.target_field_name,
      join_type: relationship.join_type
    };
    
    onJoinsChange([...joins, newJoin]);
  };

  // 删除关联
  const handleDeleteJoin = (joinId: string) => {
    Modal.confirm({
      title: t('confirmDeleteJoin'),
      content: t('deleteJoinTip'),
      onOk: () => {
        onJoinsChange(joins.filter(join => join.id !== joinId));
      }
    });
  };

  // 编辑关联
  const handleEditJoin = (join: DataSourceJoin) => {
    setEditingJoin(join);
    form.setFieldsValue(join);
    setIsModalVisible(true);
  };

  // 保存编辑
  const handleSaveJoin = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingJoin?.id?.startsWith('manual_')) {
        // 新增关联
        const newJoin: DataSourceJoin = {
          ...values,
          id: `join_${Date.now()}`
        };
        onJoinsChange([...joins, newJoin]);
      } else {
        // 编辑现有关联
        const updatedJoins = joins.map(join => 
          join.id === editingJoin?.id ? { ...join, ...values } : join
        );
        onJoinsChange(updatedJoins);
      }
      
      setIsModalVisible(false);
      setEditingJoin(null);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 手动添加关联
  const handleManualAddJoin = () => {
    if (selectedDataSources.length < 2) return;
    
    const newJoin: DataSourceJoin = {
      id: `manual_join_${Date.now()}`,
      left_data_source_id: selectedDataSources[0],
      left_field_name: '',
      right_data_source_id: selectedDataSources[1],
      right_field_name: '',
      join_type: 'left'
    };
    
    setEditingJoin(newJoin);
    form.setFieldsValue(newJoin);
    setIsModalVisible(true);
  };

  // 获取数据源的字段选项
  const getDataSourceFields = (dataSourceId: string) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    return dataSource?.fields || [];
  };

  // 表格列配置
  const columns = [
    {
      title: t('sourceDataSource'),
      key: 'source',
      width: '25%',
      render: (record: DataSourceJoin) => (
        <div>
          <Text strong>{getDataSourceName(record.left_data_source_id)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.left_field_name}
          </Text>
        </div>
      )
    },
    {
      title: t('joinType'),
      dataIndex: 'join_type',
      key: 'join_type',
      width: '15%',
      align: 'center' as const,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          inner: { color: 'red', text: 'INNER' },
          left: { color: 'blue', text: 'LEFT' },
          right: { color: 'orange', text: 'RIGHT' },
          full: { color: 'purple', text: 'FULL' }
        };
        const config = typeMap[type] || { color: 'default', text: type.toUpperCase() };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: t('targetDataSource'),
      key: 'target',
      width: '25%',
      render: (record: DataSourceJoin) => (
        <div>
          <Text strong>{getDataSourceName(record.right_data_source_id)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.right_field_name}
          </Text>
        </div>
      )
    },
    {
      title: t('joinCondition'),
      key: 'condition',
      width: '20%',
      render: (record: DataSourceJoin) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {record.condition || `${record.left_field_name} = ${record.right_field_name}`}
        </Text>
      )
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: '15%',
      align: 'center' as const,
      render: (record: DataSourceJoin) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditJoin(record)}
          >
            {t('common:edit')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteJoin(record.id)}
          >
            {t('common:delete')}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <PanelContainer>
      <ContentWrapper>
        {selectedDataSources.length < 2 ? (
          <Alert
            message={t('selectMultipleDataSources')}
            description={t('selectMultipleDataSourcesHint')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : (
          <>
            {/* 当前关联配置 */}
            <Card
              title={
                <Space>
                  <LinkOutlined />
                  <span>{t('currentJoinConfig')}</span>
                  {joins.length > 0 && (
                    <Tag color="blue">{joins.length}</Tag>
                  )}
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleManualAddJoin}
                >
                  {t('addJoin')}
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              {joins.length > 0 ? (
                <Table
                  dataSource={joins}
                  columns={columns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('noJoinsConfigured')}
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleManualAddJoin}
                  >
                    {t('configureFirstJoin')}
                  </Button>
                </Empty>
              )}
            </Card>

            {/* 建议的关联关系 - 简化版 */}
            {availableRelationships.length > 0 && (
              <Card
                title={
                  <Space>
                    <InfoCircleOutlined />
                    <span>{t('suggestedJoins')}</span>
                  </Space>
                }
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {availableRelationships.map(rel => (
                    <Alert
                      key={rel.id}
                      message={
                        <Space>
                          <Text>{getDataSourceName(rel.source_data_source_id)}.{rel.source_field_name}</Text>
                          <SwapOutlined />
                          <Text>{getDataSourceName(rel.target_data_source_id)}.{rel.target_field_name}</Text>
                        </Space>
                      }
                      type="info"
                      action={
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => handleAddJoin(rel)}
                        >
                          {t('common:add')}
                        </Button>
                      }
                      closable={false}
                    />
                  ))}
                </Space>
              </Card>
            )}
          </>
        )}
      </ContentWrapper>

      {/* 编辑关联模态框 */}
      <Modal
        title={editingJoin?.id?.startsWith('manual_') ? t('addJoin') : t('editJoin')}
        open={isModalVisible}
        onOk={handleSaveJoin}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingJoin(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="left_data_source_id"
            label={t('sourceDataSource')}
            rules={[{ required: true, message: t('pleaseSelectDataSource') }]}
          >
            <Select 
              placeholder={t('selectDataSource')}
              showSearch
              optionFilterProp="children"
            >
              {selectedDataSources.map(dsId => (
                <Select.Option key={dsId} value={dsId}>
                  {getDataSourceName(dsId)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="left_field_name"
            label={t('sourceField')}
            rules={[{ required: true, message: t('pleaseSelectField') }]}
          >
            <Select 
              placeholder={t('selectSourceField')}
              disabled={!form.getFieldValue('left_data_source_id')}
              showSearch
              optionFilterProp="children"
            >
              {getDataSourceFields(form.getFieldValue('left_data_source_id')).map(field => (
                <Select.Option key={field.field_name} value={field.field_name}>
                  {field.field_alias} ({field.field_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="join_type"
            label={t('joinType')}
            rules={[{ required: true, message: t('selectJoinType') }]}
          >
            <Select>
              <Select.Option value="inner">{t('innerJoin')}</Select.Option>
              <Select.Option value="left">{t('leftJoin')}</Select.Option>
              <Select.Option value="right">{t('rightJoin')}</Select.Option>
              <Select.Option value="full">{t('fullJoin')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="right_data_source_id"
            label={t('targetDataSource')}
            rules={[{ required: true, message: t('pleaseSelectDataSource') }]}
          >
            <Select 
              placeholder={t('selectDataSource')}
              showSearch
              optionFilterProp="children"
            >
              {selectedDataSources.map(dsId => (
                <Select.Option key={dsId} value={dsId}>
                  {getDataSourceName(dsId)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="right_field_name"
            label={t('targetField')}
            rules={[{ required: true, message: t('pleaseSelectField') }]}
          >
            <Select 
              placeholder={t('selectTargetField')}
              disabled={!form.getFieldValue('right_data_source_id')}
              showSearch
              optionFilterProp="children"
            >
              {getDataSourceFields(form.getFieldValue('right_data_source_id')).map(field => (
                <Select.Option key={field.field_name} value={field.field_name}>
                  {field.field_alias} ({field.field_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="condition"
            label={t('additionalCondition')}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('additionalConditionPlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PanelContainer>
  );
};

export default DataSourceJoinPanel; 