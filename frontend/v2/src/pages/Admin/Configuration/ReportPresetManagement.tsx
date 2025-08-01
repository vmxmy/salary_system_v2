import React, { useState } from 'react';
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
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportConfigApi } from '../../../api/reportConfigApi';
import type { ReportConfigPreset, ReportConfigPresetCreate, ReportConfigPresetUpdate } from '../../../types/reportConfig';
import styles from '../../../styles/reportConfig.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ReportPresetManagementProps {}

const ReportPresetManagement: React.FC<ReportPresetManagementProps> = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReportConfigPreset | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  
  // 获取报表配置预设列表
  const { data: presets, isLoading, refetch } = useQuery({
    queryKey: ['reportPresets', searchText, categoryFilter, statusFilter],
    queryFn: () => reportConfigApi.getReportPresets({
      search: searchText || undefined,
      category: categoryFilter,
      is_active: statusFilter,
      limit: 1000
    })
  });

  // 获取可用的报表类型
  const { data: reportTypesData } = useQuery({
    queryKey: ['batchReportTypes'],
    queryFn: () => reportConfigApi.getBatchReportTypes()
  });

  // 创建预设
  const createMutation = useMutation({
    mutationFn: reportConfigApi.createReportPreset,
    onSuccess: () => {
      message.success('报表配置预设创建成功');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reportPresets'] });
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 更新预设
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReportConfigPresetUpdate }) =>
      reportConfigApi.updateReportPreset(id, data),
    onSuccess: () => {
      message.success('报表配置预设更新成功');
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['reportPresets'] });
    },
    onError: (error: any) => {
      message.error(`更新失败: ${error.response?.data?.detail || error.message}`);
    }
  });

  // 删除预设
  const deleteMutation = useMutation({
    mutationFn: reportConfigApi.deleteReportPreset,
    onSuccess: () => {
      message.success('报表配置预设删除成功');
      queryClient.invalidateQueries({ queryKey: ['reportPresets'] });
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
        default_config: values.default_config ? JSON.parse(values.default_config) : null,
        filter_config: values.filter_config ? JSON.parse(values.filter_config) : null,
        export_config: values.export_config ? JSON.parse(values.export_config) : null,
      };

      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('表单提交错误:', error);
      message.error('JSON 格式错误，请检查配置内容');
    }
  };

  // 打开编辑模态框
  const handleEdit = (record: ReportConfigPreset) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      default_config: record.default_config ? JSON.stringify(record.default_config, null, 2) : '',
      filter_config: record.filter_config ? JSON.stringify(record.filter_config, null, 2) : '',
      export_config: record.export_config ? JSON.stringify(record.export_config, null, 2) : '',
    });
    setIsModalVisible(true);
  };

  // 打开新建模态框
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 删除确认
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // 表格列定义 - 紧凑型一行布局
  const columns = [
    {
      title: '预设信息',
      key: 'preset_info',
      width: 350,
      render: (_: any, record: ReportConfigPreset) => (
        <div className={styles.compactPresetInfo}>
          <div className={styles.compactPresetTitle}>
            <Text strong className={styles.compactPresetName}>{record.name}</Text>
            {record.category && (
              <Tag color="blue" className={styles.compactPresetCategory}>
                {record.category}
              </Tag>
            )}
            <Badge
              status={record.is_active ? 'success' : 'default'}
              text=""
              style={{ marginLeft: '4px' }}
            />
            <Tag color={record.is_public ? 'green' : 'default'}>
              {record.is_public ? '公开' : '私有'}
            </Tag>
          </div>
          <Text 
            type="secondary" 
            ellipsis={{ tooltip: record.description }} 
            className={styles.compactPresetDescription}
          >
            {record.description || '暂无描述'}
          </Text>
        </div>
      ),
    },
    {
      title: '报表类型',
      dataIndex: 'report_types',
      key: 'report_types',
      width: 250,
      render: (types: string[]) => {
        // 根据代码获取中文名称的函数
        const getReportTypeName = (code: string) => {
          const reportType = reportTypeOptions.find((type: any) => type.code === code);
          return reportType ? reportType.name : code;
        };

        // 获取所有报表类型的中文名称
        const typeNames = types?.map(getReportTypeName) || [];
        
        return (
          <div className={styles.compactReportTypes}>
            {typeNames.slice(0, 2).map((name, index) => (
              <Tag key={types?.[index] || index} className={styles.compactReportTypeTag}>
                {name}
              </Tag>
            ))}
            {typeNames.length > 2 && (
              <Tooltip title={typeNames.slice(2).join('、')}>
                <Tag className={styles.compactReportTypeTag}>
                  +{typeNames.length - 2}
                </Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: '使用统计',
      key: 'usage_stats',
      width: 120,
      render: (_: any, record: ReportConfigPreset) => (
        <div className={styles.compactUsageStats}>
          <Text className={styles.compactUsageCount}>
            <span className={styles.compactUsageCountNumber}>{record.usage_count || 0}</span> 次使用
          </Text>
          <Text type="secondary" className={styles.compactLastUsed}>
            {record.last_used_at ? new Date(record.last_used_at).toLocaleDateString('zh-CN', { 
              month: 'short', 
              day: 'numeric' 
            }) : '未使用'}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_: any, record: ReportConfigPreset) => (
        <div className={styles.compactStatus}>
          <Badge
            status={record.is_active ? 'success' : 'default'}
            text={record.is_active ? '激活' : '禁用'}
            className={styles.compactStatusBadge}
          />
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: ReportConfigPreset) => (
        <div className={styles.compactActions}>
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
          <Popconfirm
            title="确定要删除这个配置预设吗？"
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
        </div>
      ),
    },
  ];

  // 获取分类选项
  const categories = Array.from(new Set(presets?.map(item => item.category).filter(Boolean)));

  // 获取可用的报表类型选项
  const reportTypeOptions = reportTypesData?.report_types || [];

  return (
    <div className={styles.padding24}>
      <Card>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitleLeft}>
              <Title level={4} className={styles.cardTitleText}>
                <AppstoreOutlined /> 报表配置预设报表管理
              </Title>
            </div>
            <div className={styles.cardTitleRight}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                className={styles.primaryButton}
                >
                  新建配置预设
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                className={styles.secondaryButton}
                >
                  刷新
                </Button>
            </div>
          </div>
        </div>

        <Divider />

        {/* 搜索和筛选 */}
        <Row gutter={16} className={styles.marginBottom16}>
          <Col span={8}>
            <Input
              placeholder="搜索预设名称或描述"
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
              className={styles.widthFull}
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 表格 - 紧凑型布局 */}
        <Table
          columns={columns}
          dataSource={presets}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{
            total: presets?.length || 0,
            pageSize: 25,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '25', '50', '100'],
          }}
          scroll={{ x: 920 }}
          rowClassName={() => 'compact-row'}
        />
      </Card>

      {/* 新建/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑配置预设' : '新建配置预设'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            is_public: false,
            sort_order: 0,
            report_types: [],
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="预设名称"
                rules={[{ required: true, message: '请输入预设名称' }]}
              >
                <Input placeholder="例如: 完整月度报表" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="预设分类">
                <Input placeholder="例如: monthly" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="预设描述">
            <TextArea rows={3} placeholder="请输入预设描述" />
          </Form.Item>

          <Form.Item
            name="report_types"
            label="包含的报表类型"
            rules={[{ required: true, message: '请选择至少一个报表类型' }]}
          >
            <Checkbox.Group className={styles.widthFull}>
              <Row gutter={[16, 8]}>
                {reportTypeOptions.map((type: any) => (
                  <Col span={8} key={type.code}>
                    <Checkbox value={type.code}>
                      <Tooltip title={type.description}>
                        {type.name}
                      </Tooltip>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="default_config" label="默认配置 (JSON)">
            <TextArea
              rows={6}
              placeholder={`{
  "task_name": "月度报表导出",
  "description": "包含薪资、考勤等完整报表",
  "export_format": "xlsx",
  "include_archive": true
}`}
            />
          </Form.Item>

          <Form.Item name="filter_config" label="筛选配置 (JSON)">
            <TextArea
              rows={4}
              placeholder={`{
  "default_period": "current_month",
  "include_departments": "all",
  "include_employees": "active_only"
}`}
            />
          </Form.Item>

          <Form.Item name="export_config" label="导出配置 (JSON)">
            <TextArea
              rows={4}
              placeholder={`{
  "format": "xlsx",
  "compression": true,
  "auto_cleanup_hours": 24
}`}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sort_order" label="排序顺序">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" label="是否激活" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_public" label="是否公开" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className={styles.formItemRightAlign}>
            <Space>
              <Button 
                onClick={() => setIsModalVisible(false)}
                className={styles.secondaryButton}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                className={styles.primaryButton}
              >
                {editingRecord ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportPresetManagement; 