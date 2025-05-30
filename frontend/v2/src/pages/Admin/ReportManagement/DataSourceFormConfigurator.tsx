import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Table,
  Tag,
  message,
  Divider,
  Card,
  Row,
  Col,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined,
  EditOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { DataSourceConfig, DataSourceField, DetectedField } from './types';

const { TextArea } = Input;

interface Props {
  config: DataSourceConfig;
  onChange: (config: DataSourceConfig) => void;
  detectedFields?: DetectedField[];
  onApplyDetectedFields?: () => void;
}

const { Option } = Select;

const DataSourceFormConfigurator: React.FC<Props> = ({
  config,
  onChange,
  detectedFields = [],
  onApplyDetectedFields
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [fields, setFields] = useState<DataSourceField[]>(config.fields || []);

  // 字段编辑模态框
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<DataSourceField> | null>(null);
  const [fieldForm] = Form.useForm();

  useEffect(() => {
    onChange({ ...config, fields });
  }, [fields, config, onChange]);

  // 🏷️ 编辑字段
  const handleEditField = (field: DataSourceField | Partial<DataSourceField>) => {
    setCurrentField(field);
    fieldForm.setFieldsValue(field);
    setFieldModalVisible(true);
  };

  // 保存字段编辑
  const handleSaveField = async () => {
    try {
      const values = await fieldForm.validateFields();
      if (currentField && 'id' in currentField && currentField.id !== undefined) {
        // 更新现有字段
        setFields(prev => prev.map(field =>
          field.id === currentField.id ? { ...field, ...values } : field
        ));
      } else {
        // 添加新字段
        const newField: Partial<DataSourceField> = {
          ...values,
          id: Date.now(), // 临时ID，实际保存时后端生成
          sort_order: fields.length
        };
        setFields(prev => [...prev, newField as DataSourceField]);
      }

      setFieldModalVisible(false);
      setCurrentField(null);
      fieldForm.resetFields();
      message.success('字段保存成功');
    } catch (error) {
      message.error('字段保存失败');
    }
  };

  // 删除字段
  const handleDeleteField = (fieldId: number) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    message.success('字段删除成功');
  };

  // 📋 表格列配置
  const fieldsColumns: ColumnsType<DataSourceField> = [
    {
      title: t('reportManagement:fieldName'),
      dataIndex: 'field_name',
      key: 'field_name',
      width: 150,
      fixed: 'left',
      render: (text: string, record: DataSourceField) => (
        <Space>
          <DatabaseOutlined style={{ color: record.is_primary_key ? '#faad14' : '#1890ff' }} />
          <span style={{ fontWeight: record.is_primary_key ? 'bold' : 'normal' }}>{text}</span>
        </Space>
      )
    },
    {
      title: t('reportManagement:displayName'),
      dataIndex: 'display_name_zh',
      key: 'display_name_zh',
      width: 150,
      render: (text: string) => text || '-'
    },
    {
      title: t('reportManagement:fieldType'),
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: (text: string) => text || '-'
    },
    {
      title: t('reportManagement:properties'),
      key: 'properties',
      width: 200,
      render: (_: any, record: DataSourceField) => (
        <Space wrap>
          {record.is_visible && <span>{t('reportManagement:visible')}</span>}
          {record.is_searchable && <span>{t('reportManagement:searchable')}</span>}
          {record.is_sortable && <span>{t('reportManagement:sortable')}</span>}
          {record.is_filterable && <span>{t('reportManagement:filterable')}</span>}
          {record.enable_aggregation && <span>{t('reportManagement:aggregatable')}</span>}
        </Space>
      )
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: DataSourceField) => (
        <Space size="small">
          <Tooltip title={t('common:edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditField(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('reportManagement:confirmDeleteField')}
            onConfirm={() => record.id !== undefined && handleDeleteField(record.id)}
            okText={t('common:confirm')}
            cancelText={t('common:cancel')}
          >
            <Tooltip title={t('common:delete')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 检测到的字段表格列
  const detectedFieldsColumns: ColumnsType<DetectedField> = [
    {
      title: t('reportManagement:fieldName'),
      dataIndex: 'field_name',
      key: 'field_name',
      render: (text: string, record: DetectedField) => (
        <Space>
          <DatabaseOutlined style={{ color: record.is_primary_key ? '#faad14' : '#1890ff' }} />
          <span style={{ fontWeight: record.is_primary_key ? 'bold' : 'normal' }}>{text}</span>
        </Space>
      )
    },
    {
      title: t('reportManagement:dataType'),
      dataIndex: 'data_type',
      key: 'data_type',
      render: (text: string) => text || '-'
    },
    {
      title: t('reportManagement:isNullable'),
      dataIndex: 'is_nullable',
      key: 'is_nullable',
      render: (value: boolean) => value ? t('common:yes') : t('common:no')
    },
    {
      title: t('reportManagement:comment'),
      dataIndex: 'comment',
      key: 'comment',
      render: (text: string) => text || '-'
    },
    {
      title: t('common:actions'),
      key: 'actions',
      render: (_: any, record: DetectedField) => (
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditField(record)}
        >
          {t('common:configure')}
        </Button>
      )
    }
  ];


  return (
    <div className="config-section">
      <h3>{t('reportManagement:fieldManagement')}</h3>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleEditField({})}>
          {t('reportManagement:addField')}
        </Button>
        {detectedFields.length > 0 && onApplyDetectedFields && (
          <Button onClick={onApplyDetectedFields}>
            {t('reportManagement:applyDetectedFields')} ({detectedFields.length})
          </Button>
        )}
      </Space>

      {detectedFields.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4>{t('reportManagement:detectedFields')}</h4>
          <Table
            dataSource={detectedFields}
            columns={detectedFieldsColumns}
            rowKey="field_name"
            pagination={false}
            size="small"
          />
        </div>
      )}

      <Table
        dataSource={fields}
        columns={fieldsColumns}
        rowKey="id"
        pagination={false}
        scroll={{ x: 800 }}
        size="small"
        locale={{ emptyText: t('reportManagement:noFieldsAdded') }}
      />

      <Modal
        title={currentField && 'id' in currentField && currentField.id !== undefined ? t('reportManagement:editField') : t('reportManagement:addField')}
        visible={fieldModalVisible}
        onOk={handleSaveField}
        onCancel={() => {
          setFieldModalVisible(false);
          setCurrentField(null);
          fieldForm.resetFields();
        }}
        okText={t('common:save')}
        cancelText={t('common:cancel')}
        destroyOnClose
      >
        <Form form={fieldForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="field_name"
                label={t('reportManagement:fieldName')}
                rules={[{ required: true, message: t('reportManagement:fieldNameRequired') }]}
              >
                <Input disabled={currentField !== null && 'id' in currentField && currentField.id !== undefined} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="display_name_zh"
                label={t('reportManagement:displayNameZh')}
                rules={[{ required: true, message: t('reportManagement:displayNameZhRequired') }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="display_name_en" label={t('reportManagement:displayNameEn')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="field_group" label={t('reportManagement:fieldGroup')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="field_type" label={t('reportManagement:fieldType')}>
                <Select placeholder={t('reportManagement:selectType')}>
                  <Option value="text">{t('reportManagement:text')}</Option>
                  <Option value="number">{t('reportManagement:number')}</Option>
                  <Option value="date">{t('reportManagement:date')}</Option>
                  <Option value="boolean">{t('reportManagement:boolean')}</Option>
                  <Option value="json">{t('reportManagement:json')}</Option>
                  <Option value="array">{t('reportManagement:array')}</Option>
                  <Option value="object">{t('reportManagement:object')}</Option>
                  <Option value="datetime">{t('reportManagement:datetime')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="data_type" label={t('reportManagement:dataType')}>
                <Input disabled /> {/* This is usually detected */}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_nullable" label={t('reportManagement:isNullable')} valuePropName="checked">
                <Switch disabled /> {/* This is usually detected */}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="is_visible" label={t('reportManagement:visible')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_searchable" label={t('reportManagement:searchable')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_sortable" label={t('reportManagement:sortable')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_filterable" label={t('reportManagement:filterable')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
           <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_primary_key" label={t('reportManagement:primaryKey')} valuePropName="checked">
                <Switch disabled={currentField !== null && 'id' in currentField && currentField.id !== undefined} /> {/* Usually detected */}
              </Form.Item>
            </Col>
             <Col span={12}>
              <Form.Item name="is_foreign_key" label={t('reportManagement:foreignKey')} valuePropName="checked">
                <Switch disabled={currentField !== null && 'id' in currentField && currentField.id !== undefined} /> {/* Usually detected */}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="enable_aggregation" label={t('reportManagement:enableAggregation')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
             <Col span={12}>
              <Form.Item name="sort_order" label={t('reportManagement:sortOrder')}>
                <InputNumber min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t('common:description')}>
            <TextArea rows={2} />
          </Form.Item>
          {/* TODO: Add validation rules configuration */}
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourceFormConfigurator;