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
  Alert
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

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface DataSource {
  id: number;
  name: string;
  table_name: string;
  schema_name: string;
  connection_type: string;
  description?: string;
  is_active: boolean;
  sync_status?: string;
  last_sync_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  field_count?: number;
}

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

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const mockData: DataSource[] = [
        {
          id: 1,
          name: '员工信息表',
          table_name: 'employees',
          schema_name: 'hr',
          connection_type: 'postgresql',
          description: '包含所有员工的基础信息',
          is_active: true,
          sync_status: 'success',
          last_sync_at: '2024-01-20T14:30:00Z',
          created_by: 1,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          creator_name: '管理员',
          field_count: 25
        },
        {
          id: 2,
          name: '薪资条目表',
          table_name: 'payroll_entries',
          schema_name: 'payroll',
          connection_type: 'postgresql',
          description: '薪资计算详细数据',
          is_active: true,
          sync_status: 'success',
          last_sync_at: '2024-01-20T14:35:00Z',
          created_by: 1,
          created_at: '2024-01-05T11:00:00Z',
          updated_at: '2024-01-20T14:35:00Z',
          creator_name: '管理员',
          field_count: 18
        },
        {
          id: 3,
          name: '部门信息表',
          table_name: 'departments',
          schema_name: 'hr',
          connection_type: 'postgresql',
          description: '组织架构部门数据',
          is_active: true,
          sync_status: 'failed',
          last_sync_at: '2024-01-19T09:00:00Z',
          created_by: 2,
          created_at: '2024-01-10T14:20:00Z',
          updated_at: '2024-01-19T09:00:00Z',
          creator_name: 'HR专员',
          field_count: 8
        }
      ];
      setDataSources(mockData);
    } catch (error) {
      message.error('加载数据源失败');
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

  const handleDelete = async (id: number) => {
    try {
      message.success('删除成功');
      loadDataSources();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSync = async (id: number) => {
    setSyncLoading(id);
    try {
      // 模拟同步操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('同步成功');
      loadDataSources();
    } catch (error) {
      message.error('同步失败');
    } finally {
      setSyncLoading(null);
    }
  };

  const handleViewFields = async (source: DataSource) => {
    setSelectedSourceName(source.name);
    // 模拟加载字段数据
    const mockFields: DataSourceField[] = [
      {
        field_name: 'id',
        field_type: 'BIGINT',
        is_nullable: false,
        is_primary_key: true,
        comment: '主键ID'
      },
      {
        field_name: 'employee_code',
        field_type: 'VARCHAR',
        is_nullable: false,
        length: 50,
        comment: '员工编号'
      },
      {
        field_name: 'name',
        field_type: 'VARCHAR',
        is_nullable: false,
        length: 100,
        comment: '姓名'
      },
      {
        field_name: 'department_id',
        field_type: 'BIGINT',
        is_nullable: true,
        comment: '部门ID'
      },
      {
        field_name: 'hire_date',
        field_type: 'DATE',
        is_nullable: true,
        comment: '入职日期'
      },
      {
        field_name: 'basic_salary',
        field_type: 'DECIMAL',
        is_nullable: true,
        precision: 10,
        scale: 2,
        comment: '基本工资'
      }
    ];
    setSelectedSourceFields(mockFields);
    setFieldsModalVisible(true);
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
              onClick={() => handleSync(record.id)}
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
            onConfirm={() => handleDelete(record.id)}
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
      source.table_name.toLowerCase().includes(searchText.toLowerCase()) ||
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
      <Modal
        title={`数据源字段 - ${selectedSourceName}`}
        open={fieldsModalVisible}
        onCancel={() => setFieldsModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setFieldsModalVisible(false)}>
            关闭
          </Button>
        ]}
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
      </Modal>
    </div>
  );
};

export default DataSources;