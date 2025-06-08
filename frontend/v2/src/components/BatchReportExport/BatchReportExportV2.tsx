import React, { useState } from 'react';
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
  Typography,
  Alert,
  Spin,
  Tag,
  Tooltip
} from 'antd';
import { ExportOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { batchReportsApi } from '../../api/batchReports';
import { reportConfigApi } from '../../api/reportConfigApi';
import type { BatchReportGenerationRequest } from '../../api/batchReports';
import { 
  getBatchReportPayrollPeriods, 
  getBatchReportDepartments, 
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

interface BatchReportExportV2Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BatchReportExportV2: React.FC<BatchReportExportV2Props> = ({
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取报表类型（使用新的配置系统）
  const { data: reportTypesData, isLoading: reportTypesLoading } = useQuery({
    queryKey: ['batchReportTypes'],
    queryFn: () => reportConfigApi.getBatchReportTypes(),
  });

  // 获取配置预设
  const { data: presetsData, isLoading: presetsLoading } = useQuery({
    queryKey: ['batchReportPresets'],
    queryFn: () => reportConfigApi.getBatchReportPresets(),
  });

  // 获取薪资周期
  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['batchReportPayrollPeriods'],
    queryFn: getBatchReportPayrollPeriods,
  });

  // 获取部门列表
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['batchReportDepartments'],
    queryFn: getBatchReportDepartments,
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
      onSuccess?.();
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

      // 更新报表类型使用统计
      for (const reportType of values.report_types) {
        const typeDefinition = reportTypesData?.report_types?.find(t => t.code === reportType);
        if (typeDefinition) {
          reportConfigApi.updateReportTypeUsage(typeDefinition.id).catch(console.error);
        }
      }

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
    
    // 应用预设配置
    const presetConfig = {
      task_name: preset.name,
      description: preset.description,
      report_types: preset.report_types,
      ...preset.default_config,
    };

    form.setFieldsValue(presetConfig);
    setSelectedReportTypes(preset.report_types);
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
                    {periodsData?.map((period: BatchPayrollPeriod) => (
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
          <Card 
            title={
              <Space>
                <SettingOutlined />
                快速配置
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <Alert
              message="选择预设配置可以快速设置常用的报表组合"
              type="info"
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              {presetsData?.presets?.map((preset: any) => (
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
                  {reportTypesData?.report_types?.map((type) => (
                    <Col span={8} key={type.code}>
                      <Card size="small" style={{ height: '100%' }}>
                        <Checkbox value={type.code}>
                          <div>
                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                              {type.name}
                              {type.category && (
                                <Tag color="geekblue" style={{ marginLeft: 8 }}>
                                  {type.category}
                                </Tag>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                              {type.description}
                            </div>
                            {type.required_permissions && type.required_permissions.length > 0 && (
                              <Tooltip title={`需要权限: ${type.required_permissions.join(', ')}`}>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  🔒 需要权限
                                </Text>
                              </Tooltip>
                            )}
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
                    {departmentsData?.map((dept: BatchDepartment) => (
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
                      (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
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
    </div>
  );
};

export default BatchReportExportV2; 