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
import { reportConfigApi } from '../../api/reportConfigApi';
import type { DataSource, DataSourceField } from '../../api/reportConfigApi'; // 导入正确的类型
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const DataSources: React.FC = () => {
  const { t } = useTranslation('reportManagement');
  const navigate = useNavigate();
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
      const response = await reportConfigApi.getDataSources({
        is_active: selectedStatus === 'active' ? true : (selectedStatus === 'inactive' ? false : undefined),
        search: searchText,
        skip: 0,
        limit: 1000,
      });
      setDataSources(response); 
    } catch (error: any) {
      message.error(t('data_source.load_error', { message: error.response?.data?.detail || error.message }));
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedStatus, t]);

  const handleSave = async (values: any) => {
    try {
      if (editingSource) {
        await reportConfigApi.updateDataSource(editingSource.id, values);
        message.success(t('data_source.update_success'));
      } else {
        await reportConfigApi.createDataSource(values);
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

  const handleEdit = async (source: DataSource) => {
    try {
      setLoading(true);
      const fullSource = await reportConfigApi.getDataSource(source.id);
      setEditingSource(fullSource);
      form.setFieldsValue(fullSource);
      setModalVisible(true);
    } catch (error: any) {
      message.error(t('data_source.load_error', { message: error.response?.data?.detail || error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: DataSource) => {
    Modal.confirm({
      title: t('data_source.delete_confirm_title'),
      content: t('data_source.delete_confirm_content', { name: record.name }),
      okText: t('common:button.confirm'),
      cancelText: t('common:button.cancel'),
      onOk: async () => {
        try {
          await reportConfigApi.deleteDataSource(record.id);
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
      await reportConfigApi.syncDataSourceFields(record.id);
      message.success(t('data_source.sync_success'));
      await loadDataSources(); // Reload data to show updated sync status
    } catch (error: any) {
      message.error(t('data_source.sync_error', { message: error.response?.data?.detail || error.message }));
    } finally {
      setSyncLoading(null);
    }
  };

  const handleViewFields = (record: DataSource) => {
    navigate(`/admin/report-config/${record.id}`);
  };

  const columns: ColumnsType<DataSource> = [
    {
      title: t('data_source.column.name'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
      render: (text, record, index) => (
        <div>
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <Text strong>{text}</Text>
          </Space>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              <Text ellipsis={{ tooltip: record.description }}>{record.description}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '数据源',
      key: 'datasource_display',
      width: 200,
      ellipsis: true,
      render: (_, record, index) => {
        const sourceName = record.source_type === 'table' ? record.table_name : record.view_name;
        const fullName = sourceName ? `${record.schema_name}.${sourceName}` : '-';
        
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Tag 
                color={record.source_type === 'table' ? 'blue' : 'green'} 
                style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}
              >
                {record.source_type === 'table' ? '表' : '视图'}
              </Tag>
              <Text code style={{ fontSize: '12px' }}>{fullName}</Text>
            </div>
            {record.field_count && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {record.field_count} 个字段
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: t('data_source.column.connection_type'),
      dataIndex: 'connection_type',
      key: 'connection_type',
      width: 110,
      render: (type) => <Tag color="blue" style={{ fontSize: '11px' }}>{type?.toUpperCase()}</Tag>,
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
        const config = statusMap[status || 'default'] || { color: 'default', text: status || '未知' };
        return <Tag color={config.color} style={{ fontSize: '11px' }}>{config.text}</Tag>;
      },
    },
    {
      title: t('data_source.column.last_sync'),
      dataIndex: 'last_sync_at',
      key: 'last_sync_at',
      width: 140,
      ellipsis: true,
      render: (date) => date ? (
        <Text style={{ fontSize: '11px' }}>
          {new Date(date).toLocaleString('zh-CN', { 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      ) : '-',
    },
    {
      title: t('data_source.column.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'} style={{ fontSize: '11px' }}>
          {is_active ? t('common:status.enabled') : t('common:status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('data_source.column.actions'),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title={t('data_source.action.view_fields')}>
            <Button
              type="text"
              size="small"
              icon={<TableOutlined />}
              onClick={() => handleViewFields(record)}
            />
          </Tooltip>
          <Tooltip title={t('data_source.action.sync_structure')}>
            <Button
              type="text"
              size="small"
              icon={<SyncOutlined spin={syncLoading === record.id} />}
              onClick={() => handleSync(record)}
              loading={syncLoading === record.id}
            />
          </Tooltip>
          <Tooltip title={t('common:button.edit')}>
            <Button
              type="text"
              size="small"
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
                size="small"
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
      render: (name, record, index) => (
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
      render: (type, record, index) => {
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
    <div style={{ padding: '0' }}>
      <Card 
        style={{ borderRadius: '8px' }}
        bodyStyle={{ padding: '20px' }}
      >
        <div style={{ marginBottom: '20px' }}>
          <Row justify="space-between" align="middle" gutter={[16, 8]}>
            <Col xs={24} sm={16} md={18} lg={16}>
              <Title level={4} style={{ margin: 0, marginBottom: '4px' }}>
                {t('data_source.title')}
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {t('data_source.description_text')}
              </Text>
            </Col>
            <Col xs={24} sm={8} md={6} lg={8} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadDataSources}
                  size="middle"
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
                  size="middle"
                >
                  {t('data_source.new_data_source')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* 筛选区域 */}
        <Row gutter={[16, 12]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder={t('data_source.search_placeholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="middle"
            />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Select
              placeholder={t('data_source.select_status_placeholder')}
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
              size="middle"
            >
              <Option value="active">{t('common:status.enabled')}</Option>
              <Option value="inactive">{t('common:status.disabled')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={4} lg={4}>
            <Text type="secondary" style={{ fontSize: '13px', lineHeight: '32px' }}>
              共 {filteredSources.length} 项
            </Text>
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
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '15', '20', '50'],
            showTotal: (total, range) =>
              t('common:pagination.show_total', { start: range[0], end: range[1], total }),
            size: 'default',
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <div style={{ color: '#999', fontSize: '14px' }}>
                  {searchText || selectedStatus ? '没有找到匹配的数据源' : '暂无数据源，点击上方按钮新建'}
                </div>
              </div>
            )
          }}
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
        destroyOnClose // Use destroyOnClose to completely unmount form when modal is closed
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ source_type: 'table', connection_type: 'postgresql' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.name_label', '数据源名称')}
                name="name"
                rules={[{ required: true, message: t('data_source.form.name_required', '请输入数据源名称') }]}
              >
                <Input placeholder={t('data_source.form.name_placeholder', '例如: 员工主数据')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.code_label', '数据源编码')}
                name="code"
                rules={[{ required: true, message: t('data_source.form.code_required', '请输入数据源编码') }]}
              >
                <Input placeholder={t('data_source.form.code_placeholder', '例如: ds_employees')} disabled={!!editingSource} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.source_type_label', '数据源类型')}
                name="source_type"
                rules={[{ required: true, message: t('data_source.form.source_type_required', '请选择数据源类型') }]}
              >
                <Select placeholder={t('data_source.form.source_type_placeholder', '请选择类型')}>
                  <Option value="table">{t('data_source.source_type.table', '表格')}</Option>
                  <Option value="view">{t('data_source.source_type.view', '视图')}</Option>
                  <Option value="query" disabled>{t('data_source.source_type.query', '自定义查询 (暂不支持)')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('data_source.form.category_label', '分类')}
                name="category"
              >
                <Input placeholder={t('data_source.form.category_placeholder', '例如: HR, Finance')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                  label={t('data_source.form.connection_type_label', '连接类型')}
                  name="connection_type"
              >
                  <Select disabled>
                      <Option value="postgresql">PostgreSQL</Option>
                  </Select>
              </Form.Item>
            </Col>
             <Col span={12}>
              <Form.Item
                label={t('data_source.form.schema_name_label')}
                name="schema_name"
                initialValue="public"
                rules={[{ required: true, message: t('data_source.form.schema_name_required') }]}
              >
                <Input placeholder={t('data_source.form.schema_name_placeholder')} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.source_type !== curr.source_type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('source_type');
              return (
                <Row gutter={16}>
                  {type === 'table' && (
                    <Col span={12}>
                      <Form.Item
                        label={t('data_source.form.table_name_label')}
                        name="table_name"
                        rules={[{ required: true, message: t('data_source.form.table_name_required')}]}
                      >
                        <Input placeholder={t('data_source.form.table_name_placeholder')} />
                      </Form.Item>
                    </Col>
                  )}
                  {type === 'view' && (
                    <Col span={12}>
                      <Form.Item
                        label={t('data_source.form.view_name_label', '视图名称')}
                        name="view_name"
                        rules={[{ required: true, message: t('data_source.form.view_name_required', '请输入视图名称') }]}
                      >
                        <Input placeholder={t('data_source.form.view_name_placeholder', '例如: v_employee_details')} />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              );
            }}
          </Form.Item>

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
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSources;