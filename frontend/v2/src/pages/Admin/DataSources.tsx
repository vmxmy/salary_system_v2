import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message, // Direct import of message for simplicity, could also use App.useApp().message
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Typography,
  Divider,
  Switch,
  Alert,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  TableOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { ReportViewAPI } from '../../api/reportView';
import type { DataSource, DataSourceField } from '../../types/reportView'; // 导入正确的类型

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const DataSources: React.FC = () => {
  const { t } = useTranslation('reportManagement');
  const [form] = Form.useForm();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSourceFields, setSelectedSourceFields] = useState<DataSourceField[]>([]); // 使用 DataSourceField
  const [selectedSourceName, setSelectedSourceName] = useState('');
  const [syncLoading, setSyncLoading] = useState<number | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ReportViewAPI.getDataSources({
        page: 1,
        page_size: 1000, // Assuming this is sufficiently large or replaced with actual pagination
        keyword: searchText,
        is_active: selectedStatus === 'active' ? true : (selectedStatus === 'inactive' ? false : undefined),
      });
      // Type assertion as the API response directly matches the imported DataSource type
      setDataSources(response as DataSource[]); 
    } catch (error: any) {
      message.error(t('data_source.load_error', { message: error.response?.data?.detail || error.message }));
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedStatus, t]);

  const handleSave = async (values: any) => {
    try {
      if (editingSource) {
        await ReportViewAPI.updateDataSource(editingSource.id, values);
        message.success(t('data_source.update_success'));
      } else {
        await ReportViewAPI.createDataSource(values);
        message.success(t('data_source.create_success'));
      }
      setModalVisible(false);
      setEditingSource(null);
      form.resetFields();
      loadDataSources();
    } catch (error: any) {
      message.error(t('data_source.save_error', { message: error.response?.data?.detail || error.message }));
    }
  };

  const handleEdit = (source: DataSource) => {
    setEditingSource(source);
    form.setFieldsValue(source);
    setModalVisible(true);
  };

  const handleDelete = async (record: DataSource) => {
    Modal.confirm({
      title: t('data_source.delete_confirm_title'),
      content: t('data_source.delete_confirm_content', { name: record.name }),
      okText: t('common:button.confirm'),
      cancelText: t('common:button.cancel'),
      onOk: async () => {
        try {
          await ReportViewAPI.deleteDataSource(record.id);
          message.success(t('data_source.delete_success'));
          await loadDataSources();
        } catch (error: any) {
          message.error(t('data_source.delete_error', { message: error.response?.data?.detail || error.message }));
        }
      },
    });
  };

  const handleSync = async (record: DataSource) => {
    try {
      setSyncLoading(record.id);
      await ReportViewAPI.syncFields(record.id);
      message.success(t('data_source.sync_success'));
      await loadDataSources(); // Reload data to show updated sync status
    } catch (error: any) {
      message.error(t('data_source.sync_error', { message: error.response?.data?.detail || error.message }));
    } finally {
      setSyncLoading(null);
    }
  };

  const handleViewFields = async (record: DataSource) => {
    try {
      setLoading(true);
      const response = await ReportViewAPI.getDataSourceFields(record.id);
      setSelectedSourceFields(response as DataSourceField[]); // Type assertion
      setSelectedSourceName(record.name);
      setDrawerVisible(true);
    } catch (error: any) {
      message.error(t('data_source.load_fields_error', { message: error.response?.data?.detail || error.message }));
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<DataSource> = [
    {
      title: t('data_source.column.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <Text strong>{text}</Text>
          </Space>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('data_source.column.table_name'),
      key: 'table_name_display',
      width: 200,
      render: (_, record) => (
        record.type === 'table' ? (
          <div>
            <Text code>{record.schema_name}.{record.table_name}</Text>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {t('data_source.field_count', { count: record.field_count })}
            </div>
          </div>
        ) : '-'
      ),
    },
    {
      title: t('data_source.column.view_name'),
      key: 'view_name_display',
      width: 200,
      render: (_, record) => (
        record.type === 'view' ? (
          <Text code>{record.schema_name}.{record.view_name}</Text>
        ) : '-'
      ),
    },
    {
      title: t('data_source.column.connection_type'),
      dataIndex: 'connection_type',
      key: 'connection_type',
      width: 120,
      render: (type) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: t('data_source.column.sync_status'),
      dataIndex: 'sync_status',
      key: 'sync_status',
      width: 100,
      render: (status) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: t('data_source.status.success') },
          failed: { color: 'error', text: t('data_source.status.failed') },
          pending: { color: 'warning', text: t('data_source.status.pending') },
        };
        const config = statusMap[status || 'default'] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('data_source.column.last_sync'),
      dataIndex: 'last_sync_at',
      key: 'last_sync_at',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: t('data_source.column.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? t('common:status.enabled') : t('common:status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('data_source.column.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('data_source.action.view_fields')}>
            <Button
              type="text"
              icon={<TableOutlined />}
              onClick={() => handleViewFields(record)}
            />
          </Tooltip>
          <Tooltip title={t('data_source.action.sync_structure')}>
            <Button
              type="text"
              icon={<SyncOutlined spin={syncLoading === record.id} />}
              onClick={() => handleSync(record)}
              loading={syncLoading === record.id}
            />
          </Tooltip>
          <Tooltip title={t('common:button.edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('data_source.delete_confirm_title')}
            description={t('data_source.delete_confirm_impact')}
            onConfirm={() => handleDelete(record)}
            okText={t('common:button.confirm')}
            cancelText={t('common:button.cancel')}
          >
            <Tooltip title={t('common:button.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fieldColumns: ColumnsType<DataSourceField> = [
    {
      title: t('data_source.field_column.name'),
      dataIndex: 'field_name',
      key: 'field_name',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          {record.is_primary_key && <Tag color="gold">PK</Tag>}
        </Space>
      ),
    },
    {
      title: t('data_source.field_column.type'),
      dataIndex: 'data_type',
      key: 'data_type',
      render: (type, record) => {
        let typeStr = type;
        if (record.length) typeStr += `(${record.length})`;
        if (record.precision !== undefined && record.scale !== undefined) {
          typeStr += `(${record.precision},${record.scale})`;
        }
        return <Text code>{typeStr}</Text>;
      },
    },
    {
      title: t('data_source.field_column.nullable'),
      dataIndex: 'is_nullable',
      key: 'is_nullable',
      width: 80,
      render: (nullable) => nullable ? t('common:yes') : t('common:no'),
    },
    {
      title: t('data_source.field_column.default_value'),
      dataIndex: 'default_value',
      key: 'default_value',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: t('data_source.field_column.comment'),
      dataIndex: 'comment',
      key: 'comment',
      render: (comment) => comment || '-',
    },
  ];

  const filteredSources = dataSources.filter(source => {
    const matchesSearch = !searchText ||
      source.name.toLowerCase().includes(searchText.toLowerCase()) ||
      source.table_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      source.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !selectedStatus ||
      (selectedStatus === 'active' && source.is_active) ||
      (selectedStatus === 'inactive' && !source.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>{t('data_source.title')}</Title>
              <Text type="secondary">{t('data_source.description_text')}</Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadDataSources}
                >
                  {t('common:button.refresh')}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingSource(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  {t('data_source.new_data_source')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 筛选区域 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Search
              placeholder={t('data_source.search_placeholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder={t('data_source.select_status_placeholder')}
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">{t('common:status.enabled')}</Option>
              <Option value="inactive">{t('common:status.disabled')}</Option>
            </Select>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={filteredSources}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredSources.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t('common:pagination.show_total', { start: range[0], end: range[1], total }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新建/编辑对话框 */}
      <Modal
        title={editingSource ? t('data_source.edit_title') : t('data_source.create_title')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSource(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        destroyOnHidden // Ensures form state is reset on close
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.name_label')}
                name="name"
                rules={[{ required: true, message: t('data_source.form.name_required') }]}
              >
                <Input placeholder={t('data_source.form.name_placeholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.connection_type_label')}
                name="connection_type"
                rules={[{ required: true, message: t('data_source.form.connection_type_required') }]}
                initialValue="postgresql"
              >
                <Select>
                  <Option value="postgresql">PostgreSQL</Option>
                  <Option value="mysql">MySQL</Option>
                  <Option value="oracle">Oracle</Option>
                  <Option value="sqlserver">SQL Server</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.schema_name_label')}
                name="schema_name"
                rules={[{ required: true, message: t('data_source.form.schema_name_required') }]}
              >
                <Input placeholder={t('data_source.form.schema_name_placeholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* Conditional rendering for table_name or view_name based on source_type (not in form currently) */}
              {/* For simplicity, if source_type is determined outside the form, this will work. */}
              {/* If source_type is part of the form, you'd use Form.Item.useWatch and conditional rules/rendering */}
              <Form.Item
                label={t('data_source.form.table_name_label')}
                name="table_name"
                rules={[{ required: true, message: t('data_source.form.table_name_required') }]}
              >
                <Input placeholder={t('data_source.form.table_name_placeholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('data_source.form.description_label')} name="description">
            <TextArea
              rows={3}
              placeholder={t('data_source.form.description_placeholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('data_source.form.active_status_label')}
            name="is_active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 字段查看抽屉 */}
      <Drawer
        title={t('data_source.fields_drawer_title', { name: selectedSourceName })}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={1000}
      >
        <Alert
          message={t('data_source.fields_info_alert_title')}
          description={t('data_source.fields_info_alert_description')}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Table
          columns={fieldColumns}
          dataSource={selectedSourceFields}
          rowKey="field_name"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
        />
      </Drawer>
    </div>
  );
};

export default DataSources;