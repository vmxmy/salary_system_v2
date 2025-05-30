import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Tabs,
  Table,
  Modal,
  message,
  Tag,
  Tooltip,
  Row,
  Col,
  Divider,
  Typography,
  InputNumber,
  Alert,
  Spin,
  Empty,
  Badge,
  Progress,
  Popconfirm
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { dataSourceAPI } from '../../../api/reports';
import {
  DataSourceFormConfigurator,
  DataPreviewTable,
  APIConnectionSettings,
  TestConnectionButton
} from './components';
import type {
  ConnectionStatus,
  FieldModalState,
  DataSource,
  DataSourceField,
  DataSourceCreateRequest,
  DataSourceUpdateRequest,
  DetectedField,
  FieldDetectionRequest,
  ConnectionTestRequest,
  TabsProps,
  ColumnsType
} from './components/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface DataSourceEditProps {
  mode?: 'create' | 'edit';
}

const DataSourceEdit: React.FC<DataSourceEditProps> = ({ mode: propMode }) => {
  const { t } = useTranslation(['reportManagement', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 确定编辑模式
  const mode = propMode || (id ? 'edit' : 'create');
  const isEdit = mode === 'edit';
  
  // 状态管理
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [detectingFields, setDetectingFields] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [fields, setFields] = useState<DataSourceField[]>([]);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    responseTime?: number;
  }>({ tested: false, success: false, message: '' });

  // 字段编辑模态框
  const [fieldModalVisible, setFieldModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<DataSourceField> | null>(null);
  const [fieldForm] = Form.useForm();

  // 加载数据源详情
  const loadDataSource = useCallback(async () => {
    if (!isEdit || !id) return;
    
    setLoading(true);
    try {
      const response = await dataSourceAPI.getDataSource(Number(id));
      setDataSource(response.data);
      setFields(response.data.fields || []);
      
      // 填充表单
      form.setFieldsValue({
        ...response.data,
        tags: response.data.tags?.join(', ') || ''
      });
    } catch (error) {
      message.error('加载数据源失败');
    } finally {
      setLoading(false);
    }
  }, [isEdit, id, form]);

  useEffect(() => {
    loadDataSource();
  }, [loadDataSource]);

  // 🧪 测试数据库连接
  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields([
        'connection_type', 'connection_config', 'schema_name'
      ]);
      
      setTestingConnection(true);
      const testData: ConnectionTestRequest = {
        connection_type: values.connection_type,
        connection_config: values.connection_config || {},
        schema_name: values.schema_name,
        table_name: values.table_name
      };
      
      const response = await dataSourceAPI.testConnection(testData);
      setConnectionStatus({
        tested: true,
        success: response.data.success,
        message: response.data.message,
        responseTime: response.data.response_time
      });
      
      if (response.data.success) {
        message.success('连接测试成功！');
      } else {
        message.error(`连接测试失败：${response.data.message}`);
      }
    } catch (error) {
      message.error('连接测试失败');
      setConnectionStatus({
        tested: true,
        success: false,
        message: '连接配置有误'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // 🔍 检测字段结构
  const handleDetectFields = async () => {
    try {
      const values = await form.validateFields([
        'schema_name', 'table_name', 'view_name', 'custom_query', 'source_type'
      ]);
      
      setDetectingFields(true);
      const detectData: FieldDetectionRequest = {
        schema_name: values.schema_name,
        table_name: values.source_type === 'table' ? values.table_name : undefined,
        view_name: values.source_type === 'view' ? values.view_name : undefined,
        custom_query: values.source_type === 'query' ? values.custom_query : undefined,
        connection_config: values.connection_config
      };
      
      const response = await dataSourceAPI.detectFields(detectData);
      setDetectedFields(response.data.fields);
      message.success(`成功检测到 ${response.data.total_count} 个字段`);
      
      // 自动切换到字段管理标签页
      setActiveTab('fields');
    } catch (error) {
      message.error('字段检测失败');
    } finally {
      setDetectingFields(false);
    }
  };

  // 💾 保存数据源
  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // 处理标签
      const tags = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
      
      const saveData = {
        ...values,
        tags,
        fields: fields.map(field => ({
          ...field,
          data_source_id: undefined // 创建时不需要这个字段
        }))
      };
      
      if (isEdit && id) {
        const updateData: DataSourceUpdateRequest = saveData;
        await dataSourceAPI.updateDataSource(Number(id), updateData);
        message.success('数据源更新成功！');
      } else {
        const createData: DataSourceCreateRequest = saveData;
        const response = await dataSourceAPI.createDataSource(createData);
        message.success('数据源创建成功！');
        navigate(`/admin/report-management/data-sources/${response.data.id}`);
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 🔄 同步字段
  const handleSyncFields = async () => {
    if (!isEdit || !id) return;
    
    try {
      await dataSourceAPI.syncFields(Number(id));
      message.success('字段同步成功！');
      await loadDataSource(); // 重新加载数据
    } catch (error) {
      message.error('字段同步失败');
    }
  };

  // 🏷️ 编辑字段
  const handleEditField = (field: DataSourceField | DetectedField) => {
    setCurrentField(field);
    fieldForm.setFieldsValue(field);
    setFieldModalVisible(true);
  };

  // ➕ 应用检测到的字段
  const handleApplyDetectedFields = () => {
    const newFields: Partial<DataSourceField>[] = detectedFields.map((detected, index) => ({
      field_name: detected.field_name,
      field_type: detected.field_type,
      data_type: detected.data_type,
      is_nullable: detected.is_nullable,
      is_primary_key: detected.is_primary_key,
      is_foreign_key: detected.is_foreign_key,
      is_indexed: detected.is_indexed,
      display_name_zh: detected.comment || detected.field_name,
      display_name_en: detected.field_name,
      description: detected.comment,
      is_visible: true,
      is_searchable: true,
      is_sortable: true,
      is_filterable: true,
      is_exportable: true,
      sort_order: index,
      enable_aggregation: ['number', 'integer', 'decimal', 'float', 'double'].includes(detected.field_type.toLowerCase())
    }));
    
    setFields(prev => [...prev, ...newFields] as DataSourceField[]);
    setDetectedFields([]);
    message.success(`已添加 ${newFields.length} 个字段`);
  };

  // 保存字段编辑
  const handleSaveField = async () => {
    try {
      const values = await fieldForm.validateFields();
      if (currentField && 'id' in currentField) {
        // 更新现有字段
        setFields(prev => prev.map(field => 
          field.id === currentField.id ? { ...field, ...values } : field
        ));
      } else {
        // 添加新字段
        const newField: Partial<DataSourceField> = {
          ...values,
          id: Date.now(), // 临时ID
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
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      width: 150,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <DatabaseOutlined style={{ color: record.is_primary_key ? '#faad14' : '#1890ff' }} />
          <span style={{ fontWeight: record.is_primary_key ? 'bold' : 'normal' }}>{text}</span>
          {record.is_primary_key && <Tag color="gold">主键</Tag>}
          {record.is_foreign_key && <Tag color="cyan">外键</Tag>}
        </Space>
      )
    },
    {
      title: '显示名称',
      dataIndex: 'display_name_zh',
      key: 'display_name_zh',
      width: 150,
      render: text => text || '-'
    },
    {
      title: '字段类型',
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: text => <Tag color="blue">{text}</Tag>
    },
    {
      title: '属性',
      key: 'properties',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          {record.is_visible && <Tag color="green">可见</Tag>}
          {record.is_searchable && <Tag color="blue">可搜索</Tag>}
          {record.is_sortable && <Tag color="purple">可排序</Tag>}
          {record.is_filterable && <Tag color="orange">可筛选</Tag>}
          {record.enable_aggregation && <Tag color="red">聚合</Tag>}
        </Space>
      )
    },
    {
      title: '分组',
      dataIndex: 'field_group',
      key: 'field_group',
      width: 100,
      render: text => text || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditField(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此字段？"
            onConfirm={() => handleDeleteField(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
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
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      render: (text, record) => (
        <Space>
          <DatabaseOutlined style={{ color: record.is_primary_key ? '#faad14' : '#1890ff' }} />
          <span style={{ fontWeight: record.is_primary_key ? 'bold' : 'normal' }}>{text}</span>
          {record.is_primary_key && <Tag color="gold">主键</Tag>}
          {record.is_foreign_key && <Tag color="cyan">外键</Tag>}
        </Space>
      )
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
      render: text => <Tag color="blue">{text}</Tag>
    },
    {
      title: '是否可空',
      dataIndex: 'is_nullable',
      key: 'is_nullable',
      render: value => value ? <Tag color="orange">可空</Tag> : <Tag color="green">非空</Tag>
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      render: text => text || '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditField(record)}
        >
          配置
        </Button>
      )
    }
  ];

  // 📑 标签页配置
  const tabItems: TabsProps['items'] = [
    {
      key: 'basic',
      label: (
        <Space>
          <SettingOutlined />
          基础信息
        </Space>
      ),
      children: (
        <Card>
          <DataSourceFormConfigurator 
            form={form} 
            mode={mode} 
            dataSource={dataSource} 
          />
        </Card>
      )
    },
    {
      key: 'connection',
      label: (
        <Space>
          <DatabaseOutlined />
          连接配置
          {connectionStatus.tested && (
            <Badge 
              status={connectionStatus.success ? 'success' : 'error'} 
            />
          )}
        </Space>
      ),
      children: (
        <Card>
          <APIConnectionSettings
            form={form}
            connectionStatus={connectionStatus}
            onTestConnection={handleTestConnection}
            onDetectFields={handleDetectFields}
            testingConnection={testingConnection}
            detectingFields={detectingFields}
          />
        </Card>
      )
    },
    {
      key: 'fields',
      label: (
        <Space>
          <FieldTimeOutlined />
          字段管理
          <Badge count={fields.length} size="small" />
        </Space>
      ),
      children: (
        <Card
          title="字段列表"
          extra={
            <Space>
              {detectedFields.length > 0 && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleApplyDetectedFields}
                >
                  应用检测到的字段 ({detectedFields.length})
                </Button>
              )}
              {isEdit && (
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleSyncFields}
                >
                  同步字段
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setFieldModalVisible(true)}
              >
                添加字段
              </Button>
            </Space>
          }
        >
          {detectedFields.length > 0 && (
            <>
              <Alert
                type="info"
                message={`检测到 ${detectedFields.length} 个字段，您可以配置后添加到数据源中`}
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={detectedFieldsColumns}
                dataSource={detectedFields}
                rowKey="field_name"
                size="small"
                pagination={false}
                style={{ marginBottom: 24 }}
              />
              <Divider />
            </>
          )}

          <Table
            columns={fieldsColumns}
            dataSource={fields}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个字段`
            }}
          />
        </Card>
      )
    },
    {
      key: 'permissions',
      label: (
        <Space>
          <SafetyOutlined />
          权限设置
        </Space>
      ),
      children: (
        <Card>
          <Form form={form} layout="vertical">
            <Form.Item name="access_level" label="访问级别">
              <Select placeholder="请选择访问级别">
                <Option value="public">公开</Option>
                <Option value="private">私有</Option>
                <Option value="restricted">受限</Option>
              </Select>
            </Form.Item>

            <Form.Item name="allowed_roles" label="允许访问的角色">
              <Select mode="multiple" placeholder="请选择角色">
                <Option value="admin">管理员</Option>
                <Option value="hr">HR专员</Option>
                <Option value="manager">经理</Option>
                <Option value="employee">员工</Option>
              </Select>
            </Form.Item>

            <Form.Item name="allowed_users" label="允许访问的用户">
              <Select mode="multiple" placeholder="请选择用户">
                {/* 这里可以从用户API加载 */}
              </Select>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'performance',
      label: (
        <Space>
          <ThunderboltOutlined />
          性能配置
        </Space>
      ),
      children: (
        <Card>
          <Form form={form} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="cache_enabled" label="启用缓存" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="cache_duration" label="缓存时长(秒)">
                  <InputNumber min={60} max={86400} placeholder="3600" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="max_rows" label="最大返回行数">
              <InputNumber min={100} max={100000} placeholder="10000" style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Card>
      )
    }
  ];

  // 如果是编辑模式，添加预览标签页
  if (isEdit) {
    tabItems.push({
      key: 'preview',
      label: (
        <Space>
          <EyeOutlined />
          数据预览
        </Space>
      ),
      children: (
        <DataPreviewTable 
          dataSourceId={id ? Number(id) : undefined} 
          fields={fields} 
        />
      )
    });
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/report-management/data-sources')}
          >
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {isEdit ? '编辑数据源' : '创建数据源'}
          </Title>
          {isEdit && dataSource && (
            <Tag color={dataSource.is_active ? 'green' : 'red'}>
              {dataSource.is_active ? '已启用' : '已禁用'}
            </Tag>
          )}
        </Space>
      </div>

      <Spin spinning={loading}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
        />
      </Spin>

      {/* 操作按钮 */}
      <div style={{ 
        position: 'fixed', 
        bottom: 24, 
        right: 24, 
        zIndex: 1000,
        background: '#fff',
        padding: '12px 16px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #d9d9d9'
      }}>
        <Space>
          <Button onClick={() => navigate('/admin/report-management/data-sources')}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            保存
          </Button>
        </Space>
      </div>

      {/* 字段编辑模态框 */}
      <Modal
        title={currentField && 'id' in currentField ? '编辑字段' : '添加字段'}
        open={fieldModalVisible}
        onOk={handleSaveField}
        onCancel={() => {
          setFieldModalVisible(false);
          setCurrentField(null);
          fieldForm.resetFields();
        }}
        width={800}
      >
        <Form form={fieldForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="field_name"
                label="字段名"
                rules={[{ required: true, message: '请输入字段名' }]}
              >
                <Input placeholder="field_name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="field_alias" label="字段别名">
                <Input placeholder="字段别名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="display_name_zh" label="中文显示名">
                <Input placeholder="中文显示名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="display_name_en" label="英文显示名">
                <Input placeholder="English Display Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="field_type" label="字段类型">
                <Select placeholder="选择类型">
                  <Option value="string">字符串</Option>
                  <Option value="number">数字</Option>
                  <Option value="date">日期</Option>
                  <Option value="boolean">布尔值</Option>
                  <Option value="text">文本</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="field_group" label="字段分组">
                <Input placeholder="字段分组" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sort_order" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="字段描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="is_visible" label="可见" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_searchable" label="可搜索" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_sortable" label="可排序" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_filterable" label="可筛选" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_exportable" label="可导出" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enable_aggregation" label="启用聚合" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourceEdit;