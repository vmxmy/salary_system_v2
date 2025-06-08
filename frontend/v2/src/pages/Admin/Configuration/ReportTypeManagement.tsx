import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  Divider,
  Typography,
  Badge,
  Tabs,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  CodeOutlined,
  UnorderedListOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportConfigApi } from '../../../api/reportConfigApi';
import type { 
  ReportTypeDefinition, 
  ReportTypeDefinitionCreate, 
  ReportTypeDefinitionUpdate
} from '../../../types/reportConfig';
import ReportFieldManagement from './ReportFieldManagement';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface ReportTypeManagementProps {}

const ReportTypeManagement: React.FC<ReportTypeManagementProps> = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReportTypeDefinition | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [activeTab, setActiveTab] = useState('basic');
  

  
  // 获取报表类型列表
  const { data: reportTypes, isLoading, refetch } = useQuery({
    queryKey: ['reportTypes', searchText, categoryFilter, statusFilter],
    queryFn: () => reportConfigApi.getReportTypes({
      search: searchText || undefined,
      category: categoryFilter,
      is_active: statusFilter,
      limit: 1000
    })
  });

  // 获取字段定义列表
  const { data: reportFields, isLoading: fieldsLoading, refetch: refetchFields } = useQuery({
    queryKey: ['reportFields', editingRecord?.id],
    queryFn: () => editingRecord ? reportConfigApi.getReportFields(editingRecord.id) : Promise.resolve([]),
    enabled: !!editingRecord?.id
  });

  // 创建报表类型
  const createMutation = useMutation({
    mutationFn: reportConfigApi.createReportType,
    onSuccess: () => {
      message.success('报表类型创建成功');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reportTypes'] });
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 更新报表类型
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReportTypeDefinitionUpdate }) =>
      reportConfigApi.updateReportType(id, data),
    onSuccess: () => {
      message.success('报表类型更新成功');
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['reportTypes'] });
    },
    onError: (error: any) => {
      message.error(`更新失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 删除报表类型
  const deleteMutation = useMutation({
    mutationFn: reportConfigApi.deleteReportType,
    onSuccess: () => {
      message.success('报表类型删除成功');
      queryClient.invalidateQueries({ queryKey: ['reportTypes'] });
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.response?.data?.detail || error.message}`);
    }
  });



  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        required_permissions: values.required_permissions?.split(',').map((p: string) => p.trim()).filter(Boolean) || [],
        allowed_roles: values.allowed_roles?.split(',').map((r: string) => r.trim()).filter(Boolean) || [],
        template_config: values.template_config ? JSON.parse(values.template_config) : null,
        default_config: values.default_config ? JSON.parse(values.default_config) : null,
        validation_rules: values.validation_rules ? JSON.parse(values.validation_rules) : null,
      };

      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('表单提交错误:', error);
    }
  };



  // 打开编辑模态框
  const handleEdit = (record: ReportTypeDefinition) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      required_permissions: record.required_permissions?.join(', '),
      allowed_roles: record.allowed_roles?.join(', '),
      template_config: record.template_config ? JSON.stringify(record.template_config, null, 2) : '',
      default_config: record.default_config ? JSON.stringify(record.default_config, null, 2) : '',
      validation_rules: record.validation_rules ? JSON.stringify(record.validation_rules, null, 2) : '',
    });
    setActiveTab('basic');
    setIsModalVisible(true);
  };

  // 打开新建模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setActiveTab('basic');
    setIsModalVisible(true);
  };

  // 删除确认
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };



  // 表格列定义
  const columns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => (
        <Text code copyable={{ text }}>
          {text}
        </Text>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => category ? <Tag color="blue">{category}</Tag> : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {text || '-'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? 'success' : 'default'}
          text={isActive ? '激活' : '禁用'}
        />
      ),
    },
    {
      title: '系统内置',
      dataIndex: 'is_system',
      key: 'is_system',
      width: 80,
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'orange' : 'default'}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 80,
      render: (count: number) => <Text>{count || 0}</Text>,
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ReportTypeDefinition) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {!record.is_system && (
            <Popconfirm
              title="确定要删除这个报表类型吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 获取分类选项
  const categories = Array.from(new Set(reportTypes?.map(item => item.category).filter(Boolean)));

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <SettingOutlined /> 报表类型管理
              </Title>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  新建报表类型
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 搜索和筛选 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="搜索名称、编码或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择分类"
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value={true}>激活</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={reportTypes}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: reportTypes?.length || 0,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新建/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑报表类型' : '新建报表类型'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingRecord(null);
          setActiveTab('basic');
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><FormOutlined />基本信息</span>} key="basic">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                is_active: true,
                is_system: false,
                sort_order: 0,
              }}
            >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="报表类型编码"
                rules={[
                  { required: true, message: '请输入报表类型编码' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '编码只能包含字母、数字和下划线' }
                ]}
              >
                <Input placeholder="例如: salary_summary" disabled={editingRecord?.is_system} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="报表名称"
                rules={[{ required: true, message: '请输入报表名称' }]}
              >
                <Input placeholder="例如: 薪资汇总表" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="报表分类">
                <Input placeholder="例如: payroll" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_order" label="排序顺序">
                <InputNumber placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="报表描述">
            <TextArea rows={3} placeholder="请输入报表描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="generator_class" label="生成器类名">
                <Input placeholder="例如: SalarySummaryGenerator" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="generator_module" label="生成器模块路径">
                <Input placeholder="例如: services.report_generators" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="required_permissions" label="所需权限">
            <Input placeholder="用逗号分隔，例如: report:view, salary:view" />
          </Form.Item>

          <Form.Item name="allowed_roles" label="允许的角色">
            <Input placeholder="用逗号分隔，例如: admin, hr_manager" />
          </Form.Item>

          <Form.Item name="template_config" label="模板配置 (JSON)">
            <TextArea
              rows={4}
              placeholder='{"format": "xlsx", "template": "default"}'
            />
          </Form.Item>

          <Form.Item name="default_config" label="默认配置 (JSON)">
            <TextArea
              rows={4}
              placeholder='{"include_summary": true, "group_by": "department"}'
            />
          </Form.Item>

          <Form.Item name="validation_rules" label="验证规则 (JSON)">
            <TextArea
              rows={4}
              placeholder='{"required_fields": ["employee_id", "salary"]}'
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active" label="是否激活" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_system" label="系统内置" valuePropName="checked">
                <Switch disabled={editingRecord?.is_system} />
              </Form.Item>
            </Col>
          </Row>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setIsModalVisible(false)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingRecord ? '更新' : '创建'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane 
            tab={<span><UnorderedListOutlined />字段定义</span>} 
            key="fields"
            disabled={!editingRecord}
          >
            <ReportFieldManagement
              reportTypeId={editingRecord?.id || 0}
              reportTypeName={editingRecord?.name || ''}
              fields={reportFields || []}
              loading={fieldsLoading}
              onRefresh={refetchFields}
            />
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default ReportTypeManagement; 