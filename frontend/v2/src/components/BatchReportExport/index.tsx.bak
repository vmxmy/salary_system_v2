import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Space,
  Card,
  Row,
  Col,
  InputNumber,
  message,
  Divider,
  Typography,
  Alert,
  Spin,
  Tag,
  Tooltip,
  Modal,
  Table,
  Descriptions
} from 'antd';
import { ExportOutlined, InfoCircleOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { batchReportsApi } from '../../api/batchReports';
import { reportConfigApi } from '../../api/reportConfigApi';
import type { BatchReportGenerationRequest } from '../../api/batchReports';
import { 
  getBatchReportPayrollPeriods, 
  getBatchReportDepartments, 
  getBatchReportEmployees,
  getEmployeesByDepartments 
} from '../../api/batchReportsData';
import type { 
  PayrollPeriod as BatchPayrollPeriod, 
  Department as BatchDepartment, 
  Employee as BatchEmployee 
} from '../../api/batchReportsData';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface BatchReportExportProps {
  onSuccess?: (taskId?: number) => void;
  onCancel?: () => void;
}

// 使用从API导入的类型

const BatchReportExport: React.FC<BatchReportExportProps> = ({
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewReportType, setPreviewReportType] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 获取报表类型（使用新的配置系统）
  const { data: reportTypesData, isLoading: reportTypesLoading } = useQuery({
    queryKey: ['batchReportTypes'],
    queryFn: () => reportConfigApi.getBatchReportTypes(),
    staleTime: 5 * 60 * 1000, // 🚀 数据5分钟内不会过期
    gcTime: 10 * 60 * 1000, // 垃圾回收时间10分钟
  });

  // 获取配置预设
  const { data: presetsData, isLoading: presetsLoading } = useQuery({
    queryKey: ['batchReportPresets'],
    queryFn: () => reportConfigApi.getBatchReportPresets(),
    staleTime: 5 * 60 * 1000, // 🚀 数据5分钟内不会过期
    gcTime: 10 * 60 * 1000, // 垃圾回收时间10分钟
  });

  // 获取薪资周期
  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['batchReportPayrollPeriods'],
    queryFn: getBatchReportPayrollPeriods,
    staleTime: 2 * 60 * 1000, // 🚀 薪资周期2分钟内不会过期
    gcTime: 5 * 60 * 1000, // 垃圾回收时间5分钟
  });

  // 获取部门列表
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['batchReportDepartments'],
    queryFn: getBatchReportDepartments,
    staleTime: 3 * 60 * 1000, // 🚀 部门数据3分钟内不会过期
    gcTime: 10 * 60 * 1000, // 垃圾回收时间10分钟
  });

  // 获取员工列表（根据选中的部门）
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['batchReportEmployees', selectedDepartments],
    queryFn: () => getEmployeesByDepartments(selectedDepartments),
    enabled: selectedDepartments.length > 0,
  });

  // 创建批量报表任务
  const createTaskMutation = useMutation({
    mutationFn: batchReportsApi.createTask,
    onSuccess: (data) => {
      message.success('批量报表任务创建成功！');
      form.resetFields();
      onSuccess?.(data?.task_id);
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message}`);
    },
  });

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const request: BatchReportGenerationRequest = {
        task_name: values.task_name,
        description: values.description,
        period_id: values.period_id,
        department_ids: values.department_ids,
        employee_ids: values.employee_ids,
        report_types: values.report_types,
        export_format: values.export_format || 'xlsx',
        include_archive: values.include_archive !== false,
        auto_cleanup_hours: values.auto_cleanup_hours || 24,
      };

      await createTaskMutation.mutateAsync(request);
    } catch (error) {
      console.error('创建批量报表任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理报表类型选择
  const handleReportTypeChange = (value: string[]) => {
    setSelectedReportTypes(value);
  };

  // 处理部门选择
  const handleDepartmentChange = (value: number[]) => {
    setSelectedDepartments(value);
    // 清空员工选择
    form.setFieldsValue({ employee_ids: [] });
  };

  // 应用预设配置
  const applyPresetConfig = (preset: any) => {
    // 更新使用统计
    reportConfigApi.updatePresetUsage(preset.id).catch(console.error);
    
    form.setFieldsValue({
      task_name: preset.name,
      description: preset.description,
      report_types: preset.report_types,
    });
    setSelectedReportTypes(preset.report_types);
  };

  // 处理报表类型预览
  const handleReportTypePreview = async (reportType: any) => {
    setPreviewReportType(reportType);
    setPreviewVisible(true);
    
    // 如果报表类型有 id，可以获取更详细的信息
    if (reportType.id) {
      setPreviewLoading(true);
      try {
        // 获取报表类型详情
        const detailData = await reportConfigApi.getReportType(reportType.id);
        setPreviewReportType(detailData);
        
        // 获取报表字段信息
        const fieldsData = await reportConfigApi.getReportFields(reportType.id);
        setPreviewReportType((prev: any) => ({
          ...prev,
          fields: fieldsData
        }));
      } catch (error) {
        console.error('获取报表详情失败:', error);
        message.error('获取报表详情失败');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const isDataLoading = reportTypesLoading || periodsLoading || departmentsLoading || presetsLoading;

  return (
    <div style={{ padding: '20px' }}>
      <Spin spinning={isDataLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            export_format: 'xlsx',
            include_archive: true,
            auto_cleanup_hours: 24,
          }}
        >
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="task_name"
                  label="任务名称"
                  rules={[{ required: true, message: '请输入任务名称' }]}
                >
                  <Input placeholder="请输入任务名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="period_id"
                  label="薪资周期"
                  rules={[{ required: true, message: '请选择薪资周期' }]}
                >
                                     <Select placeholder="请选择薪资周期" loading={periodsLoading}>
                     {(periodsData as any)?.map((period: any) => (
                       <Option key={period.id} value={period.id}>
                         {period.name} ({period.start_date} ~ {period.end_date})
                       </Option>
                     ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="description"
              label="任务描述"
            >
              <TextArea 
                rows={3} 
                placeholder="请输入任务描述（可选）" 
                showCount 
                maxLength={500}
              />
            </Form.Item>
          </Card>

          {/* 预设配置 */}
          <Card title="快速配置" style={{ marginBottom: 16 }}>
            <Alert
              message="选择预设配置可以快速设置常用的报表组合"
              type="info"
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              {(presetsData as any)?.presets?.map((preset: any) => (
                <Col span={8} key={preset.id}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => applyPresetConfig(preset)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Title level={5} style={{ margin: 0 }}>{preset.name}</Title>
                      {preset.category && (
                        <Tag color="blue">{preset.category}</Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      {preset.description}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        包含 {preset.report_types?.length || 0} 种报表
                      </Text>
                      {preset.usage_count > 0 && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          • 已使用 {preset.usage_count} 次
                        </Text>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 报表类型选择 */}
          <Card title="报表类型" style={{ marginBottom: 16 }}>
            <Form.Item
              name="report_types"
              rules={[{ required: true, message: '请至少选择一种报表类型' }]}
            >
              <Checkbox.Group
                style={{ width: '100%' }}
                onChange={handleReportTypeChange}
              >
                <Row gutter={[16, 16]}>
                  {(reportTypesData as any)?.report_types?.map((type: any) => (
                    <Col span={8} key={type.code}>
                      <Card 
                        size="small" 
                        style={{ height: '100%' }}
                        extra={
                          <Tooltip title="预览报表详情">
                            <Button
                              type="link"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReportTypePreview(type);
                              }}
                            />
                          </Tooltip>
                        }
                      >
                        <Checkbox value={type.code}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{type.name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {type.description}
                            </div>
                          </div>
                        </Checkbox>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Card>

          {/* 筛选条件 */}
          <Card title="筛选条件" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="department_ids"
                  label="部门筛选"
                  tooltip="不选择则包含所有部门"
                >
                                     <Select
                     mode="multiple"
                     placeholder="请选择部门（可多选）"
                     loading={departmentsLoading}
                     allowClear
                     onChange={handleDepartmentChange}
                   >
                     {(departmentsData as any)?.map((dept: any) => (
                       <Option key={dept.id} value={dept.id}>
                         {dept.name} ({dept.code})
                       </Option>
                     ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="employee_ids"
                  label="员工筛选"
                  tooltip="不选择则包含所有员工"
                >
                                     <Select
                     mode="multiple"
                     placeholder="请选择员工（可多选）"
                     allowClear
                     showSearch
                     loading={employeesLoading}
                     disabled={selectedDepartments.length === 0}
                     filterOption={(input, option) =>
                       String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                     }
                   >
                     {employeesData?.map((employee: BatchEmployee) => (
                       <Option key={employee.id} value={employee.id}>
                         {employee.name} ({employee.employee_number})
                       </Option>
                     ))}
                   </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 导出设置 */}
          <Card title="导出设置" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="export_format"
                  label="导出格式"
                >
                  <Select>
                    <Option value="xlsx">Excel (.xlsx)</Option>
                    <Option value="csv">CSV (.csv)</Option>
                    <Option value="pdf">PDF (.pdf)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="auto_cleanup_hours"
                  label="自动清理时间"
                  tooltip="文件在指定小时后自动清理"
                >
                  <InputNumber
                    min={1}
                    max={168}
                    addonAfter="小时"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="include_archive"
                  valuePropName="checked"
                  label=" "
                >
                  <Checkbox>创建压缩包</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 操作按钮 */}
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<ExportOutlined />}
                loading={loading || createTaskMutation.isPending}
                disabled={selectedReportTypes.length === 0}
              >
                创建批量导出任务
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>

      {/* 报表类型预览模态框 */}
      <Modal
        title={`报表预览 - ${previewReportType?.name || ''}`}
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setPreviewReportType(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setPreviewVisible(false);
            setPreviewReportType(null);
          }}>
            关闭
          </Button>
        ]}
        width={900}
      >
        <Spin spinning={previewLoading}>
          {previewReportType && (
            <div>
              {/* 基本信息 */}
              <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="报表代码">{previewReportType.code}</Descriptions.Item>
                <Descriptions.Item label="报表名称">{previewReportType.name}</Descriptions.Item>
                <Descriptions.Item label="类别">{previewReportType.category || '-'}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={previewReportType.is_active ? 'green' : 'red'}>
                    {previewReportType.is_active ? '启用' : '禁用'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {previewReportType.description || '-'}
                </Descriptions.Item>
                {previewReportType.data_source_name && (
                  <Descriptions.Item label="数据源" span={2}>
                    {previewReportType.data_source_name}
                  </Descriptions.Item>
                )}
                {previewReportType.usage_count !== undefined && (
                  <Descriptions.Item label="使用次数">{previewReportType.usage_count}</Descriptions.Item>
                )}
                {previewReportType.last_used_at && (
                  <Descriptions.Item label="最后使用时间">
                    {new Date(previewReportType.last_used_at).toLocaleString()}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* 报表字段信息 */}
              {previewReportType.fields && previewReportType.fields.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: 8 }}>报表字段</h4>
                  <Table
                    dataSource={previewReportType.fields}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{ y: 300 }}
                    columns={[
                      {
                        title: '字段名',
                        dataIndex: 'field_name',
                        key: 'field_name',
                        width: 150,
                      },
                      {
                        title: '显示名称',
                        dataIndex: 'display_name',
                        key: 'display_name',
                        width: 150,
                      },
                      {
                        title: '字段类型',
                        dataIndex: 'field_type',
                        key: 'field_type',
                        width: 100,
                      },
                      {
                        title: '是否可见',
                        dataIndex: 'is_visible',
                        key: 'is_visible',
                        width: 80,
                        render: (value) => (
                          <Tag color={value ? 'green' : 'default'}>
                            {value ? '是' : '否'}
                          </Tag>
                        ),
                      },
                      {
                        title: '是否必填',
                        dataIndex: 'is_required',
                        key: 'is_required',
                        width: 80,
                        render: (value) => (
                          <Tag color={value ? 'orange' : 'default'}>
                            {value ? '是' : '否'}
                          </Tag>
                        ),
                      },
                      {
                        title: '排序',
                        dataIndex: 'display_order',
                        key: 'display_order',
                        width: 60,
                      },
                    ]}
                  />
                </div>
              )}

              {/* 配置信息 */}
              {(previewReportType.default_config || previewReportType.template_config) && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>配置信息</h4>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 12, 
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 200
                  }}>
                    {JSON.stringify(
                      previewReportType.default_config || previewReportType.template_config, 
                      null, 
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* 权限要求 */}
              {(previewReportType.required_permissions || previewReportType.allowed_roles) && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>权限要求</h4>
                  {previewReportType.required_permissions && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">所需权限：</Text>
                      {previewReportType.required_permissions.map((perm: string) => (
                        <Tag key={perm} style={{ marginLeft: 8 }}>{perm}</Tag>
                      ))}
                    </div>
                  )}
                  {previewReportType.allowed_roles && (
                    <div>
                      <Text type="secondary">允许角色：</Text>
                      {previewReportType.allowed_roles.map((role: string) => (
                        <Tag key={role} color="blue" style={{ marginLeft: 8 }}>{role}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default BatchReportExport; 