import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Form,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Alert
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TableProps } from 'antd';
import ActionButton from '../../../components/common/ActionButton';
import apiClient from '../../../api/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;

// 类型定义
interface CalculationLog {
  calculation_log_id: number;
  payroll_run_id?: number;
  employee_id: number;
  employee_name: string;
  component_code: string;
  calculation_method: string;
  result_amount: number;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
  run_date?: string;
  run_status?: number;
}

interface CalculationLogsResponse {
  data: CalculationLog[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

const CalculationLogsPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [logs, setLogs] = useState<CalculationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  
  // 筛选条件
  const [filters, setFilters] = useState({
    payroll_run_id: undefined as number | undefined,
    employee_id: undefined as number | undefined,
    component_code: '',
    status: undefined as string | undefined,
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.current.toString());
      params.append('size', pagination.pageSize.toString());
      
      if (filters.payroll_run_id) {
        params.append('payroll_run_id', filters.payroll_run_id.toString());
      }
      if (filters.employee_id) {
        params.append('employee_id', filters.employee_id.toString());
      }
      if (filters.component_code) {
        params.append('component_code', filters.component_code);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await apiClient.get<CalculationLogsResponse>(`/calculation-logs?${params}`);
      setLogs(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.meta.total,
      }));
    } catch (error: any) {
      console.error('Failed to load calculation logs:', error);
      message.error('获取计算日志失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // 删除计算日志
  const handleDeleteLogs = async (payrollRunId?: number, employeeId?: number) => {
    try {
      const params = new URLSearchParams();
      params.append('confirm', 'true');
      
      if (payrollRunId) {
        params.append('payroll_run_id', payrollRunId.toString());
      }
      if (employeeId) {
        params.append('employee_id', employeeId.toString());
      }

      await apiClient.delete(`/calculation-logs?${params}`);
      message.success('计算日志删除成功');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete calculation logs:', error);
      let errorMessage = '删除计算日志失败';
      if (error?.response?.data?.detail?.error?.details) {
        errorMessage = error.response.data.detail.error.details;
      }
      message.error(errorMessage);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Tag color="green">成功</Tag>;
      case 'ERROR':
        return <Tag color="red">错误</Tag>;
      case 'WARNING':
        return <Tag color="orange">警告</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // 表格列定义
  const columns: TableProps<CalculationLog>['columns'] = [
    {
      title: '日志ID',
      dataIndex: 'calculation_log_id',
      key: 'calculation_log_id',
      width: 80,
    },
    {
      title: '薪资运行ID',
      dataIndex: 'payroll_run_id',
      key: 'payroll_run_id',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: '员工',
      key: 'employee',
      width: 120,
      render: (_, record) => (
        <div>
          <div>{record.employee_name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.employee_id}</Text>
        </div>
      ),
    },
    {
      title: '组件代码',
      dataIndex: 'component_code',
      key: 'component_code',
      width: 120,
    },
    {
      title: '计算方法',
      dataIndex: 'calculation_method',
      key: 'calculation_method',
      width: 100,
    },
    {
      title: '结果金额',
      dataIndex: 'result_amount',
      key: 'result_amount',
      width: 100,
      render: (value) => `¥${Number(value).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: getStatusTag,
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      render: (value) => value ? (
        <Tooltip title={value}>
          <Text ellipsis style={{ maxWidth: 180 }}>{value}</Text>
        </Tooltip>
      ) : '-',
    },
    {
      title: '执行时间',
      dataIndex: 'execution_time_ms',
      key: 'execution_time_ms',
      width: 100,
      render: (value) => value ? `${value}ms` : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.payroll_run_id && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除薪资运行 ${record.payroll_run_id} 的所有计算日志吗？`}
              onConfirm={() => handleDeleteLogs(record.payroll_run_id)}
              okText="确认"
              cancelText="取消"
            >
              <ActionButton
                icon={<DeleteOutlined />}
                danger
                size="small"
                tooltipTitle="删除该薪资运行的所有日志"
              />
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除"
            description={`确定要删除员工 ${record.employee_name} 的所有计算日志吗？`}
            onConfirm={() => handleDeleteLogs(undefined, record.employee_id)}
            okText="确认"
            cancelText="取消"
          >
            <ActionButton
              icon={<DeleteOutlined />}
              danger
              size="small"
              tooltipTitle="删除该员工的所有日志"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理表格分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  // 处理筛选条件变化
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      payroll_run_id: undefined,
      employee_id: undefined,
      component_code: '',
      status: undefined,
    });
  };

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="calculation-logs-page">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            计算日志管理
          </Title>
          
          <Alert
            message="关于计算日志"
            description="计算日志记录了薪资计算引擎的详细执行过程和结果。当删除薪资运行时如果遇到外键约束错误，需要先删除相关的计算日志记录。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 筛选条件 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Input
                placeholder="薪资运行ID"
                value={filters.payroll_run_id}
                onChange={(e) => handleFilterChange('payroll_run_id', e.target.value ? parseInt(e.target.value) : undefined)}
                type="number"
              />
            </Col>
            <Col span={4}>
              <Input
                placeholder="员工ID"
                value={filters.employee_id}
                onChange={(e) => handleFilterChange('employee_id', e.target.value ? parseInt(e.target.value) : undefined)}
                type="number"
              />
            </Col>
            <Col span={4}>
              <Input
                placeholder="组件代码"
                value={filters.component_code}
                onChange={(e) => handleFilterChange('component_code', e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择状态"
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="SUCCESS">成功</Option>
                <Option value="ERROR">错误</Option>
                <Option value="WARNING">警告</Option>
              </Select>
            </Col>
            <Col span={8}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={loadData}
                  loading={loading}
                >
                  搜索
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                >
                  重置
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadData}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="calculation_log_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default CalculationLogsPage; 