import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Table,
  Tabs,
  Typography,
  Row,
  Col,
  Statistic,
  Timeline,
  Alert,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Select,
  App,
  Switch
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { reportTemplateAPI, reportExecutionAPI } from '../../../api/reports';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ReportTemplate {
  id: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  template_config: {
    fields: ReportField[];
    settings?: any;
  };
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  run_count?: number;
  last_run_at?: string;
}

interface ReportField {
  id: number;
  field_name: string;
  field_alias?: string;
  data_source: string;
  field_type: string;
  display_order: number;
  is_visible: boolean;
  width?: number;
  is_sortable: boolean;
  is_filterable: boolean;
}

interface RunHistory {
  id: number;
  run_at: string;
  run_by: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  record_count?: number;
  error_message?: string;
}

const ReportTemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [runHistory, setRunHistory] = useState<RunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadTemplateDetail();
      loadRunHistory();
    }
  }, [id]);

  const loadTemplateDetail = async () => {
    try {
      setLoading(true);
      const response = await reportTemplateAPI.getTemplate(Number(id));
      
      // 转换API响应数据格式以匹配本地类型
      const templateData: ReportTemplate = {
        id: response.data.id,
        name: response.data.name,
        title: response.data.title || response.data.name,
        description: response.data.description || '',
        category: response.data.category || 'custom',
        template_config: {
          fields: response.data.fields || [],
          settings: response.data.template_config
        },
        is_active: response.data.is_active,
        is_public: response.data.is_public,
        sort_order: response.data.sort_order || 0,
        created_by: response.data.created_by || 0,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        creator_name: '未知', // API可能不返回此字段
        run_count: response.data.usage_count || 0,
        last_run_at: response.data.updated_at // 暂时使用更新时间
      };
      
      setTemplate(templateData);
    } catch (error: any) {
      console.error('Failed to load template:', error);
      message.error(`加载报表模板失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadRunHistory = async () => {
    try {
      // 获取该模板的执行历史
      const response = await reportExecutionAPI.getExecutions({
        limit: 10 // 最近10条记录
      });
      
      // 过滤出当前模板的执行记录
      const templateHistory = response.data.filter(
        (execution: any) => execution.template_id === Number(id)
      );
      
      // 转换为本地数据格式
      const historyData: RunHistory[] = templateHistory.map((execution: any) => ({
        id: execution.id,
        run_at: execution.executed_at,
        run_by: execution.executed_by?.toString() || '未知',
        status: execution.status === 'completed' ? 'success' : 
                execution.status === 'failed' ? 'failed' : 'running',
        duration: execution.execution_time || 0,
        record_count: execution.result_count || 0,
        error_message: execution.error_message
      }));
      
      setRunHistory(historyData);
    } catch (error: any) {
      console.error('Failed to load run history:', error);
      // 如果加载失败，设置为空数组而不显示错误
      setRunHistory([]);
    }
  };

  const handleRun = () => {
    navigate('/reports/viewer');
  };

  const handleEdit = () => {
    navigate(`/reports/templates/${id}/edit`);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报表模板吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await reportTemplateAPI.deleteTemplate(Number(id));
          message.success('删除成功');
          navigate('/admin/reports/templates');
        } catch (error: any) {
          console.error('Failed to delete template:', error);
          message.error(`删除失败: ${error.response?.data?.detail || error.message}`);
        }
      }
    });
  };

  const handleCopy = async () => {
    try {
      if (!template) return;
      
      const copyData = {
        ...template,
        name: `${template.name} - 副本`,
        title: `${template.title || template.name} - 副本`,
        is_active: false, // 副本默认不激活
        created_by: undefined, // 清除创建者信息
        created_at: undefined,
        updated_at: undefined
      };
      
      await reportTemplateAPI.createTemplate(copyData);
      message.success('复制成功');
      navigate('/admin/reports/templates');
    } catch (error: any) {
      console.error('Failed to copy template:', error);
      message.error(`复制失败: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const fieldColumns: ColumnsType<ReportField> = [
    {
      title: '字段名',
      dataIndex: 'field_name',
      key: 'field_name',
    },
    {
      title: '显示名称',
      dataIndex: 'field_alias',
      key: 'field_alias',
    },
    {
      title: '数据源',
      dataIndex: 'data_source',
      key: 'data_source',
    },
    {
      title: '类型',
      dataIndex: 'field_type',
      key: 'field_type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '宽度',
      dataIndex: 'width',
      key: 'width',
      width: 80,
    },
    {
      title: '可见',
      dataIndex: 'is_visible',
      key: 'is_visible',
      width: 80,
      render: (visible) => visible ? '是' : '否',
    },
    {
      title: '可排序',
      dataIndex: 'is_sortable',
      key: 'is_sortable',
      width: 80,
      render: (sortable) => sortable ? '是' : '否',
    },
    {
      title: '可筛选',
      dataIndex: 'is_filterable',
      key: 'is_filterable',
      width: 80,
      render: (filterable) => filterable ? '是' : '否',
    },
  ];

  const historyColumns: ColumnsType<RunHistory> = [
    {
      title: '运行时间',
      dataIndex: 'run_at',
      key: 'run_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '运行人',
      dataIndex: 'run_by',
      key: 'run_by',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: '成功' },
          failed: { color: 'error', text: '失败' },
          running: { color: 'processing', text: '运行中' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '耗时(秒)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '记录数',
      dataIndex: 'record_count',
      key: 'record_count',
      render: (count) => count || '-',
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      render: (msg) => msg ? <Text type="danger">{msg}</Text> : '-',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="报表模板不存在"
          description="请检查报表ID是否正确"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* 头部操作栏 */}
        <div style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/reports/templates')}
                >
                  返回列表
                </Button>
                <Title level={4} style={{ margin: 0 }}>
                  {template.name}
                </Title>
                {template.category && (
                  <Tag color={
                    template.category === 'salary' ? 'blue' :
                    template.category === 'hr' ? 'green' : 'orange'
                  }>
                    {template.category === 'salary' ? '薪资报表' :
                     template.category === 'hr' ? '人事报表' : '财务报表'}
                  </Tag>
                )}
                <Tag color={template.is_active ? 'success' : 'default'}>
                  {template.is_active ? '启用' : '禁用'}
                </Tag>
                <Tag color={template.is_public ? 'blue' : 'default'}>
                  {template.is_public ? '公开' : '私有'}
                </Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleRun}
                >
                  运行报表
                </Button>
                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  编辑
                </Button>
                <Button icon={<CopyOutlined />} onClick={handleCopy}>
                  复制
                </Button>
                <Button icon={<ShareAltOutlined />} onClick={handleShare}>
                  分享
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  删除
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="运行次数"
                value={template.run_count || 0}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="字段数量"
                value={template.template_config.fields.length}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="创建时间"
                value={new Date(template.created_at).toLocaleDateString()}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="最后运行"
                value={template.last_run_at ? 
                  new Date(template.last_run_at).toLocaleDateString() : '-'}
                prefix={<HistoryOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 详情标签页 */}
        <Tabs 
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: '基本信息',
              children: (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="报表名称" span={2}>
                    {template.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="显示标题" span={2}>
                    {template.title || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="描述" span={2}>
                    {template.description || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建人">
                    {template.creator_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {new Date(template.created_at).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间" span={2}>
                    {new Date(template.updated_at).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="排序顺序">
                    {template.sort_order}
                  </Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: 'fields',
              label: '字段配置',
              children: (
                <Table
                  columns={fieldColumns}
                  dataSource={template.template_config.fields}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )
            },
            {
              key: 'history',
              label: '运行历史',
              children: (
                <Table
                  columns={historyColumns}
                  dataSource={runHistory}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              )
            },
            {
              key: 'settings',
              label: '配置设置',
              children: (
                <>
                  <Alert
                    message="报表配置"
                    description="这里显示报表的高级配置信息，如数据源连接、查询优化等设置"
                    type="info"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                  <Descriptions bordered size="small">
                    <Descriptions.Item label="数据刷新频率">每日凌晨2点</Descriptions.Item>
                    <Descriptions.Item label="缓存策略">启用，24小时有效</Descriptions.Item>
                    <Descriptions.Item label="查询超时">30秒</Descriptions.Item>
                    <Descriptions.Item label="最大导出行数">50000</Descriptions.Item>
                  </Descriptions>
                </>
              )
            }
          ]}
        />
      </Card>

      {/* 分享对话框 */}
      <Modal
        title="分享报表"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        onOk={() => {
          form.validateFields().then(values => {
            // 处理分享逻辑
            message.success('分享成功');
            setShareModalVisible(false);
          });
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分享方式"
            name="shareType"
            rules={[{ required: true, message: '请选择分享方式' }]}
          >
            <Select placeholder="选择分享方式">
              <Select.Option value="link">生成分享链接</Select.Option>
              <Select.Option value="email">邮件分享</Select.Option>
              <Select.Option value="role">按角色分享</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="有效期" name="expiry">
            <Select placeholder="选择有效期" defaultValue="7days">
              <Select.Option value="1day">1天</Select.Option>
              <Select.Option value="7days">7天</Select.Option>
              <Select.Option value="30days">30天</Select.Option>
              <Select.Option value="permanent">永久</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="添加分享备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportTemplateDetail;