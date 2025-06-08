import React, { useState } from 'react';
import {
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
  Typography,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { reportConfigApi, type DataSource, type DataSourceField } from '../../../api/reportConfigApi';
import type { 
  ReportFieldDefinition,
  ReportFieldDefinitionCreate,
  ReportFieldDefinitionUpdate
} from '../../../types/reportConfig';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ReportFieldManagementProps {
  reportTypeId: number;
  reportTypeName: string;
  fields: ReportFieldDefinition[];
  loading: boolean;
  onRefresh: () => void;
}

const ReportFieldManagement: React.FC<ReportFieldManagementProps> = ({
  reportTypeId,
  reportTypeName,
  fields,
  loading,
  onRefresh
}) => {
  const [fieldForm] = Form.useForm();
  const [isFieldModalVisible, setIsFieldModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<ReportFieldDefinition | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<number | undefined>();

  // 获取数据源列表
  const { data: dataSources, isLoading: dataSourcesLoading } = useQuery({
    queryKey: ['dataSources'],
    queryFn: () => reportConfigApi.getDataSources({ is_active: true })
  });

  // 获取选中数据源的字段列表
  const { data: dataSourceFields, isLoading: dataSourceFieldsLoading } = useQuery({
    queryKey: ['dataSourceFields', selectedDataSource],
    queryFn: () => selectedDataSource ? reportConfigApi.getDataSourceFields(selectedDataSource) : Promise.resolve([]),
    enabled: !!selectedDataSource
  });

  // 创建字段定义
  const createFieldMutation = useMutation({
    mutationFn: ({ typeId, data }: { typeId: number; data: ReportFieldDefinitionCreate }) =>
      reportConfigApi.createReportField(typeId, data),
    onSuccess: () => {
      message.success('字段创建成功');
      setIsFieldModalVisible(false);
      fieldForm.resetFields();
      setEditingField(null);
      onRefresh();
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 更新字段定义
  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: ReportFieldDefinitionUpdate }) =>
      reportConfigApi.updateReportField(fieldId, data),
    onSuccess: () => {
      message.success('字段更新成功');
      setIsFieldModalVisible(false);
      fieldForm.resetFields();
      setEditingField(null);
      onRefresh();
    },
    onError: (error: any) => {
      message.error(`更新失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 删除字段定义
  const deleteFieldMutation = useMutation({
    mutationFn: reportConfigApi.deleteReportField,
    onSuccess: () => {
      message.success('字段删除成功');
      onRefresh();
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 处理字段表单提交
  const handleFieldSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        format_config: values.format_config ? JSON.parse(values.format_config) : null,
        validation_rules: values.validation_rules ? JSON.parse(values.validation_rules) : null,
        style_config: values.style_config ? JSON.parse(values.style_config) : null,
      };

      if (editingField) {
        await updateFieldMutation.mutateAsync({ fieldId: editingField.id, data: formData });
      } else {
        await createFieldMutation.mutateAsync({ typeId: reportTypeId, data: formData });
      }
    } catch (error) {
      console.error('字段表单提交错误:', error);
    }
  };

  // 处理数据源选择变化
  const handleDataSourceChange = (dataSourceId: number) => {
    setSelectedDataSource(dataSourceId);
    // 清空源字段选择
    fieldForm.setFieldsValue({ source_column: undefined });
  };

  // 处理源字段选择变化
  const handleSourceColumnChange = (fieldName: string) => {
    const sourceField = dataSourceFields?.find(f => f.field_name === fieldName);
    if (sourceField) {
      // 自动填充字段信息
      fieldForm.setFieldsValue({
        display_name: sourceField.display_name_zh || sourceField.display_name_en || sourceField.field_name,
        field_type: sourceField.field_type,
        data_type: sourceField.data_type,
        description: sourceField.description,
        is_sortable: sourceField.is_sortable,
        is_filterable: sourceField.is_filterable,
      });
    }
  };

  // 快速选择薪资数据源
  const handleQuickSelectPayrollDataSource = () => {
    const payrollDataSource = dataSources?.find(ds => 
      ds.name === 'v_comprehensive_employee_payroll' || 
      ds.table_name === 'v_comprehensive_employee_payroll' ||
      ds.view_name === 'v_comprehensive_employee_payroll'
    );
    
    if (payrollDataSource) {
      setSelectedDataSource(payrollDataSource.id);
      fieldForm.setFieldsValue({ 
        data_source: payrollDataSource.name,
        source_column: undefined 
      });
      message.success(`已选择数据源: ${payrollDataSource.name}`);
    } else {
      message.warning('未找到薪资数据源 v_comprehensive_employee_payroll');
    }
  };

  // 字段管理相关函数
  const handleAddField = () => {
    setEditingField(null);
    fieldForm.resetFields();
    fieldForm.setFieldsValue({
      display_order: (fields?.length || 0) + 1,
      is_visible: true,
      is_required: false,
      is_sortable: true,
      is_filterable: true,
    });
    setSelectedDataSource(undefined);
    setIsFieldModalVisible(true);
  };

  const handleEditField = (field: ReportFieldDefinition) => {
    setEditingField(field);
    fieldForm.setFieldsValue({
      ...field,
      format_config: field.format_config ? JSON.stringify(field.format_config, null, 2) : '',
      validation_rules: field.validation_rules ? JSON.stringify(field.validation_rules, null, 2) : '',
      style_config: field.style_config ? JSON.stringify(field.style_config, null, 2) : '',
    });
    
    // 如果字段有数据源信息，设置选中的数据源
    if (field.data_source) {
      const dataSource = dataSources?.find(ds => ds.name === field.data_source || ds.code === field.data_source);
      if (dataSource) {
        setSelectedDataSource(dataSource.id);
      }
    }
    
    setIsFieldModalVisible(true);
  };

  const handleDeleteField = (fieldId: number) => {
    deleteFieldMutation.mutate(fieldId);
  };

  // 字段表格列定义
  const fieldColumns = [
    {
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
      width: 120,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 120,
    },
    {
      title: '字段类型',
      dataIndex: 'field_type',
      key: 'field_type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 100,
      render: (type: string) => <Tag color="green">{type}</Tag>,
    },
    {
      title: '数据源',
      dataIndex: 'data_source',
      key: 'data_source',
      width: 120,
      render: (source: string) => source ? <Tag color="purple">{source}</Tag> : '-',
    },
    {
      title: '源字段',
      dataIndex: 'source_column',
      key: 'source_column',
      width: 120,
      render: (column: string) => column ? <Text code>{column}</Text> : '-',
    },
    {
      title: '显示顺序',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
      sorter: (a: ReportFieldDefinition, b: ReportFieldDefinition) => a.display_order - b.display_order,
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: ReportFieldDefinition) => (
        <Space>
          {record.is_visible && <Tag color="blue">可见</Tag>}
          {record.is_required && <Tag color="red">必填</Tag>}
          {record.is_sortable && <Tag color="green">可排序</Tag>}
          {record.is_filterable && <Tag color="orange">可筛选</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ReportFieldDefinition) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditField(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个字段吗？"
            onConfirm={() => handleDeleteField(record.id)}
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
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              字段定义管理
            </Title>
            <Text type="secondary">
              管理报表 "{reportTypeName}" 的字段定义
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddField}
            >
              添加字段
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={fieldColumns}
        dataSource={fields}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 个字段`,
        }}
      />

      {/* 字段编辑模态框 */}
      <Modal
        title={editingField ? '编辑字段' : '新建字段'}
        open={isFieldModalVisible}
        onCancel={() => {
          setIsFieldModalVisible(false);
          fieldForm.resetFields();
          setEditingField(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={fieldForm}
          layout="vertical"
          onFinish={handleFieldSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="field_name"
                label="字段名"
                rules={[
                  { required: true, message: '请输入字段名' },
                  { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字段名只能包含字母、数字和下划线，且以字母或下划线开头' }
                ]}
              >
                <Input placeholder="例如: employee_name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="display_name"
                label="显示名称"
                rules={[{ required: true, message: '请输入显示名称' }]}
              >
                <Input placeholder="例如: 员工姓名" />
              </Form.Item>
            </Col>
          </Row>

          {/* 数据源配置 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="data_source" label="数据源">
                <Input.Group compact>
                  <Select 
                    placeholder="选择数据源"
                    loading={dataSourcesLoading}
                    onChange={handleDataSourceChange}
                    allowClear
                    showSearch
                    style={{ width: 'calc(100% - 80px)' }}
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {dataSources?.map((ds) => (
                      <Option key={ds.id} value={ds.name}>
                        {ds.name} ({ds.schema_name}.{ds.table_name || ds.view_name})
                        {ds.name === 'v_comprehensive_employee_payroll' && (
                          <Tag color="gold" style={{ marginLeft: 8 }}>推荐</Tag>
                        )}
                      </Option>
                    ))}
                  </Select>
                  <Tooltip title="快速选择薪资数据源">
                    <Button 
                      icon={<ThunderboltOutlined />}
                      onClick={handleQuickSelectPayrollDataSource}
                      style={{ width: 80 }}
                      type="dashed"
                    >
                      薪资
                    </Button>
                  </Tooltip>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source_column" label="源字段">
                <Select 
                  placeholder="选择源字段"
                  loading={dataSourceFieldsLoading}
                  disabled={!selectedDataSource}
                  onChange={handleSourceColumnChange}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {dataSourceFields?.map((field) => (
                    <Option key={field.id} value={field.field_name}>
                      <div>
                        <Text strong>{field.field_name}</Text>
                        {field.display_name_zh && (
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            ({field.display_name_zh})
                          </Text>
                        )}
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {field.field_type} • {field.data_type}
                        </Text>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="field_type"
                label="字段类型"
                rules={[{ required: true, message: '请选择字段类型' }]}
              >
                <Select placeholder="选择字段类型">
                  <Option value="TEXT">文本</Option>
                  <Option value="NUMBER">数字</Option>
                  <Option value="DATE">日期</Option>
                  <Option value="DATETIME">日期时间</Option>
                  <Option value="BOOLEAN">布尔值</Option>
                  <Option value="CURRENCY">货币</Option>
                  <Option value="PERCENTAGE">百分比</Option>
                  <Option value="EMAIL">邮箱</Option>
                  <Option value="PHONE">电话</Option>
                  <Option value="URL">链接</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="data_type"
                label="数据类型"
                rules={[{ required: true, message: '请选择数据类型' }]}
              >
                <Select placeholder="选择数据类型">
                  <Option value="STRING">字符串</Option>
                  <Option value="INTEGER">整数</Option>
                  <Option value="DECIMAL">小数</Option>
                  <Option value="DATE">日期</Option>
                  <Option value="DATETIME">日期时间</Option>
                  <Option value="BOOLEAN">布尔值</Option>
                  <Option value="JSON">JSON</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="display_order" label="显示顺序">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="width" label="列宽">
                <InputNumber min={50} max={500} addonAfter="px" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="字段描述">
            <TextArea rows={2} placeholder="请输入字段描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="is_visible" label="可见" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_required" label="必填" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_sortable" label="可排序" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="is_filterable" label="可筛选" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="format_config" label="格式配置 (JSON)">
            <TextArea
              rows={3}
              placeholder='{"decimal_places": 2, "thousand_separator": true}'
            />
          </Form.Item>

          <Form.Item name="validation_rules" label="验证规则 (JSON)">
            <TextArea
              rows={3}
              placeholder='{"min_length": 1, "max_length": 100}'
            />
          </Form.Item>

          <Form.Item name="style_config" label="样式配置 (JSON)">
            <TextArea
              rows={3}
              placeholder='{"text_align": "center", "font_weight": "bold"}'
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsFieldModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createFieldMutation.isPending || updateFieldMutation.isPending}
              >
                {editingField ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ReportFieldManagement; 