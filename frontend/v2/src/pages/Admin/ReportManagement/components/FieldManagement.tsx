import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tooltip,
  Card,
  Row,
  Col
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ReportDataSource, DataSourceField } from '../types';
import { dataSourceAPI } from '../../../../api/reports';

const { Option } = Select;
const { TextArea } = Input;

interface FieldManagementProps {
  visible: boolean;
  dataSource: ReportDataSource | null;
  onClose: () => void;
}

const FieldManagement: React.FC<FieldManagementProps> = ({
  visible,
  dataSource,
  onClose
}) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const [fields, setFields] = useState<DataSourceField[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<DataSourceField | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && dataSource?.id) {
      loadFields();
    }
  }, [visible, dataSource]);

  const loadFields = async () => {
    if (!dataSource?.id) return;
    
    setLoading(true);
    try {
      const response = await dataSourceAPI.getDataSourceFields(dataSource.id);
      setFields(response.data);
    } catch (error) {
      console.error('Failed to load fields:', error);
      message.error(t('loadFieldsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFields = async () => {
    if (!dataSource?.id) return;
    
    try {
      setLoading(true);
      await dataSourceAPI.syncFields(dataSource.id);
      message.success(t('syncFieldsSuccess'));
      loadFields();
    } catch (error) {
      console.error('Failed to sync fields:', error);
      message.error(t('syncFieldsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field: DataSourceField) => {
    setCurrentField(field);
    form.setFieldsValue({
      ...field,
      format_config: field.format_config || {}
    });
    setEditModalVisible(true);
  };

  const handleSaveField = async () => {
    try {
      const values = await form.validateFields();
      if (!currentField?.id) return;

      await dataSourceAPI.updateField(currentField.id, values);
      message.success(t('updateFieldSuccess'));
      setEditModalVisible(false);
      loadFields();
    } catch (error) {
      console.error('Failed to update field:', error);
      message.error(t('updateFieldFailed'));
    }
  };

  const handleToggleVisibility = async (field: DataSourceField) => {
    try {
      if (!field.id) return;
      
      const newVisibility = !field.is_visible;
      await dataSourceAPI.updateField(field.id, { is_visible: newVisibility });
      
      setFields(prev => prev.map(f => 
        f.id === field.id ? { ...f, is_visible: newVisibility } : f
      ));
      
      message.success(newVisibility ? t('fieldShown') : t('fieldHidden'));
    } catch (error) {
      console.error('Failed to toggle field visibility:', error);
      message.error(t('updateFieldFailed'));
    }
  };

  const columns = [
    {
      title: t('fieldName'),
      dataIndex: 'field_name',
      key: 'field_name',
      width: 150,
      render: (text: string, record: DataSourceField) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.is_primary_key && <Tag color="red">PK</Tag>}
          {record.is_indexed && <Tag color="blue">IDX</Tag>}
        </Space>
      ),
    },
    {
      title: t('displayName'),
      dataIndex: 'display_name_zh',
      key: 'display_name_zh',
      width: 150,
      render: (text: string, record: DataSourceField) => 
        text || record.field_alias || record.field_name,
    },
    {
      title: t('fieldType'),
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: t('dataType'),
      dataIndex: 'data_type',
      key: 'data_type',
      width: 100,
      render: (type: string) => type ? <Tag color="orange">{type}</Tag> : '-',
    },
    {
      title: t('properties'),
      key: 'properties',
      width: 200,
      render: (record: DataSourceField) => (
        <Space size={[0, 4]} wrap>
          {record.is_nullable && <Tag>{t('nullable')}</Tag>}
          {record.is_searchable && <Tag color="green">{t('searchable')}</Tag>}
          {record.is_sortable && <Tag color="purple">{t('sortable')}</Tag>}
          {record.is_filterable && <Tag color="cyan">{t('filterable')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('visible'),
      dataIndex: 'is_visible',
      key: 'is_visible',
      width: 80,
      align: 'center' as const,
      render: (visible: boolean, record: DataSourceField) => (
        <Tooltip title={visible ? t('hideField') : t('showField')}>
          <Button
            type="text"
            size="small"
            icon={visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => handleToggleVisibility(record)}
            style={{ color: visible ? '#52c41a' : '#ff4d4f' }}
          />
        </Tooltip>
      ),
    },
    {
      title: t('sortOrder'),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      align: 'center' as const,
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 100,
      render: (record: DataSourceField) => (
        <Space size="small">
          <Tooltip title={t('editField')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditField(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Space>
            <SettingOutlined />
            {t('fieldManagement')} - {dataSource?.name}
          </Space>
        }
        width={1000}
        open={visible}
        onClose={onClose}
        extra={
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={handleSyncFields}
              loading={loading}
            >
              {t('syncFields')}
            </Button>
          </Space>
        }
      >
        <Card>
          <Table
            columns={columns}
            dataSource={fields}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => t('totalFields', { total }),
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Drawer>

      <Modal
        title={t('editField')}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveField}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="field_alias"
                label={t('fieldAlias')}
              >
                <Input placeholder={t('fieldAliasPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="display_name_zh"
                label={t('displayNameZh')}
              >
                <Input placeholder={t('displayNameZhPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={t('description')}
          >
            <TextArea rows={2} placeholder={t('fieldDescriptionPlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="field_group"
                label={t('fieldGroup')}
              >
                <Select placeholder={t('selectFieldGroup')}>
                  <Option value="basic">{t('basicInfo')}</Option>
                  <Option value="organization">{t('organizationInfo')}</Option>
                  <Option value="salary">{t('salaryInfo')}</Option>
                  <Option value="date">{t('dateInfo')}</Option>
                  <Option value="status">{t('statusInfo')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="field_category"
                label={t('fieldCategory')}
              >
                <Input placeholder={t('fieldCategoryPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sort_order"
                label={t('sortOrder')}
              >
                <InputNumber min={0} placeholder={t('sortOrderPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="is_visible"
                label={t('isVisible')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="is_searchable"
                label={t('isSearchable')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="is_sortable"
                label={t('isSortable')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="is_filterable"
                label={t('isFilterable')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['format_config', 'format_type']}
            label={t('formatType')}
          >
            <Select placeholder={t('selectFormatType')}>
              <Option value="text">{t('text')}</Option>
              <Option value="number">{t('number')}</Option>
              <Option value="currency">{t('currency')}</Option>
              <Option value="percentage">{t('percentage')}</Option>
              <Option value="date">{t('date')}</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['format_config', 'decimal_places']}
                label={t('decimalPlaces')}
              >
                <InputNumber min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['format_config', 'thousand_separator']}
                label={t('thousandSeparator')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['format_config', 'prefix']}
                label={t('prefix')}
              >
                <Input placeholder={t('prefixPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['format_config', 'suffix']}
                label={t('suffix')}
              >
                <Input placeholder={t('suffixPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default FieldManagement; 