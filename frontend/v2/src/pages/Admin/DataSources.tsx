import React, { useState, useEffect } from 'react';
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
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Typography,
  Divider,
  Switch,
  Descriptions,
  List,
  Alert,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  DatabaseOutlined,
  TableOutlined,
  SyncOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { dataSourceAPI } from '../../api/reports';
import type { DataSource } from '../../api/reports';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface DataSourceField {
  field_name: string;
  field_type: string;
  is_nullable: boolean;
  is_primary_key?: boolean;
  default_value?: string;
  comment?: string;
  length?: number;
  precision?: number;
  scale?: number;
}

const DataSources: React.FC = () => {
  const { t } = useTranslation('reportManagement');
  const [form] = Form.useForm();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [fieldsModalVisible, setFieldsModalVisible] = useState(false);
  const [selectedSourceFields, setSelectedSourceFields] = useState<DataSourceField[]>([]);
  const [selectedSourceName, setSelectedSourceName] = useState('');
  const [syncLoading, setSyncLoading] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const response = await dataSourceAPI.getDataSources();
      setDataSources(response.data);
    } catch (error: any) {
      message.error(`加载数据源失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      if (editingSource) {
        // 更新
        message.success('更新成功');
      } else {
        // 新建
        message.success('创建成功');
      }
      setModalVisible(false);
      setEditingSource(null);
      form.resetFields();
      loadDataSources();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleEdit = (source: DataSource) => {
    setEditingSource(source);
    form.setFieldsValue(source);
    setModalVisible(true);
  };

  const handleDelete = async (record: DataSource) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除数据源"${record.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dataSourceAPI.deleteDataSource(record.id);
          message.success('删除成功');
          await loadDataSources();
        } catch (error: any) {
          message.error(`删除失败: ${error.response?.data?.detail || error.message}`);
        }
      }
    });
  };

  const handleSync = async (record: DataSource) => {
    try {
      setLoading(true);
      await dataSourceAPI.syncFields(record.id);
      message.success('数据源同步成功');
      await loadDataSources(); // 重新加载数据
    } catch (error: any) {
      message.error(`同步失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFields = async (record: DataSource) => {
    try {
      setLoading(true);
      const response = await dataSourceAPI.getDataSourceFields(record.id);
      setSelectedSource(record);
      setSelectedSourceFields(response.data);
      setSelectedSourceName(record.name);
      setDrawerVisible(true);
    } catch (error: any) {
      message.error(`加载字段信息失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<DataSource> = [
    {
      title: '数据源名称',
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
      title: '表信息',
      key: 'table_info',
      width: 200,
      render: (_, record) => (
        <div>
          <Text code>{record.schema_name}.{record.table_name}</Text>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            字段数: {record.field_count}
          </div>
        </div>
      ),
    },
    {
      title: '连接类型',
      dataIndex: 'connection_type',
      key: 'connection_type',
      width: 120,
      render: (type) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: '同步状态',
      dataIndex: 'sync_status',
      key: 'sync_status',
      width: 100,
      render: (status) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: '成功' },
          failed: { color: 'error', text: '失败' },
          pending: { color: 'warning', text: '等待' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '最后同步',
      dataIndex: 'last_sync_at',
      key: 'last_sync_at',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (is_active) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看字段">
            <Button
              type="text"
              icon={<TableOutlined />}
              onClick={() => handleViewFields(record)}
            />
          </Tooltip>
          <Tooltip title="同步结构">
            <Button
              type="text"
              icon={<SyncOutlined spin={syncLoading === record.id} />}
              onClick={() => handleSync(record)}
              loading={syncLoading === record.id}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个数据源吗？"
            description="删除后所有使用此数据源的报表将受到影响"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
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
      title: '字段名',
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
      title: '类型',
      dataIndex: 'field_type',
      key: 'field_type',
      render: (type, record) => {
        let typeStr = type;
        if (record.length) typeStr += `(${record.length})`;
        if (record.precision && record.scale) {
          typeStr += `(${record.precision},${record.scale})`;
        }
        return <Text code>{typeStr}</Text>;
      },
    },
    {
      title: '可空',
      dataIndex: 'is_nullable',
      key: 'is_nullable',
      width: 80,
      render: (nullable) => nullable ? '是' : '否',
    },
    {
      title: '默认值',
      dataIndex: 'default_value',
      key: 'default_value',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: '注释',
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
              <Title level={4} style={{ margin: 0 }}>数据源管理</Title>
              <Text type="secondary">管理报表系统可用的数据源</Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadDataSources}
                >
                  刷新
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
                  新建数据源
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
              placeholder="搜索数据源名称、表名或描述"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
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
              `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新建/编辑对话框 */}
      <Modal
        title={editingSource ? '编辑数据源' : '新建数据源'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSource(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="数据源名称"
                name="name"
                rules={[{ required: true, message: '请输入数据源名称' }]}
              >
                <Input placeholder="请输入数据源名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="连接类型"
                name="connection_type"
                rules={[{ required: true, message: '请选择连接类型' }]}
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
                label="模式名"
                name="schema_name"
                rules={[{ required: true, message: '请输入模式名' }]}
              >
                <Input placeholder="例如: hr, payroll" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="表名"
                name="table_name"
                rules={[{ required: true, message: '请输入表名' }]}
              >
                <Input placeholder="例如: employees, departments" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="描述" name="description">
            <TextArea
              rows={3}
              placeholder="请输入数据源描述"
            />
          </Form.Item>

          <Form.Item 
            label="启用状态" 
            name="is_active" 
            valuePropName="checked" 
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 字段查看对话框 */}
      <Drawer
        title={`数据源字段 - ${selectedSourceName}`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={1000}
      >
        <Alert
          message="字段信息"
          description="以下是该数据源包含的所有字段信息，这些字段可以在报表设计时使用。"
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