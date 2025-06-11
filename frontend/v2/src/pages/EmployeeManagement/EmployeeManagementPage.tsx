import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  message,
  Row,
  Col,
  Select,
  Tooltip,
  Tag,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table/interface';

import { useEmployeeManagement } from './hooks/useEmployeeManagement';
import { employeeManagementApi } from './services/employeeManagementApi';
import type { EmployeeManagementItem, TableFilters, TableSorter } from './types';
import TableActionButton from '../../components/common/TableActionButton';

const { Search } = Input;
const { Option } = Select;

// 员工状态标签颜色映射
const getStatusColor = (status: string): string => {
  const statusColorMap: { [key: string]: string } = {
    '在职': 'green',
    '离职': 'red',
    '试用': 'blue',
    '停薪': 'orange',
    '退休': 'gray',
  };
  return statusColorMap[status] || 'default';
};

const EmployeeManagementPage: React.FC = () => {
  const { t } = useTranslation(['employeeManagement', 'common']);
  const navigate = useNavigate();

  // 使用自定义Hook
  const {
    employees,
    loading,
    pagination,
    setPagination,
    filters,
    setFilters,
    sorter,
    setSorter,
    deleteEmployee,
    batchDeleteEmployees,
    refreshEmployees,
    searchEmployees,
    resetFilters,
  } = useEmployeeManagement();

  // 本地状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // 下拉选项数据
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [statusOptions, setStatusOptions] = useState<Array<{ id: number; label: string }>>([]);

  // 加载下拉选项
  React.useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [deptData, statusData] = await Promise.all([
          employeeManagementApi.getDepartments(),
          employeeManagementApi.getLookupValues('EMPLOYEE_STATUS'),
        ]);
        setDepartments(deptData);
        setStatusOptions(statusData);
      } catch (error) {
        console.error('加载筛选选项失败:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // 搜索处理
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    searchEmployees({
      full_name_contains: value,
      employee_code_contains: value,
    });
  }, [searchEmployees]);

  // 部门筛选
  const handleDepartmentFilter = useCallback((value: number | undefined) => {
    setDepartmentFilter(value);
    searchEmployees({ department_id: value });
  }, [searchEmployees]);

  // 状态筛选
  const handleStatusFilter = useCallback((value: string | undefined) => {
    setStatusFilter(value);
    searchEmployees({ employee_status_equals: value });
  }, [searchEmployees]);

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setSearchText('');
    setDepartmentFilter(undefined);
    setStatusFilter(undefined);
    resetFilters();
  }, [resetFilters]);

  // 删除确认
  const handleDelete = useCallback((id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个员工吗？此操作不可撤销。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteEmployee(id),
    });
  }, [deleteEmployee]);

  // 批量删除确认
  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的员工');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个员工吗？此操作不可撤销。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await batchDeleteEmployees(selectedRowKeys as number[]);
        setSelectedRowKeys([]);
      },
    });
  }, [selectedRowKeys, batchDeleteEmployees]);

  // 表格列定义
  const columns: ColumnsType<EmployeeManagementItem> = [
    {
      title: '员工编号',
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 120,
      sorter: true,
      render: (text) => text || '-',
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 120,
      sorter: true,
      render: (text, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/employee-management/${record.id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      sorter: true,
      render: (text) => text || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone_number',
      key: 'phone_number',
      width: 130,
      sorter: true,
      render: (text) => text || '-',
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 150,
      sorter: true,
      render: (text) => text || '-',
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      key: 'position_name',
      width: 150,
      sorter: true,
      render: (text) => text || '-',
    },
    {
      title: '人员类别',
      dataIndex: 'personnel_category_name',
      key: 'personnel_category_name',
      width: 130,
      sorter: true,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'employee_status',
      key: 'employee_status',
      width: 100,
      sorter: true,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '入职日期',
      dataIndex: 'hire_date',
      key: 'hire_date',
      width: 120,
      sorter: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <TableActionButton
            actionType="view"
            onClick={() => navigate(`/employee-management/${record.id}`)}
            tooltipTitle="查看详情"
          />
          <TableActionButton
            actionType="edit"
            onClick={() => navigate(`/employee-management/${record.id}/edit`)}
            tooltipTitle="编辑"
          />
          <TableActionButton
            actionType="delete"
            danger
            onClick={() => handleDelete(record.id)}
            tooltipTitle="删除"
          />
        </Space>
      ),
    },
  ];

  // 表格变化处理
  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    filters: any,
    sorter: any
  ) => {
    // 更新分页
    setPagination({
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
      total: pagination.total,
    });

    // 更新排序
    if (sorter) {
      setSorter({
        field: sorter.field,
        order: sorter.order,
      });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Card
        title="员工管理"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/employee-management/create')}
            >
              新增员工
            </Button>
          </Space>
        }
      >
        {/* 筛选栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Search
              placeholder="搜索员工姓名或编号"
              allowClear
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择部门"
              allowClear
              value={departmentFilter}
              onChange={handleDepartmentFilter}
              style={{ width: '100%' }}
            >
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              allowClear
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              {statusOptions.map(status => (
                <Option key={status.id} value={status.label}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Button onClick={handleResetFilters}>重置筛选</Button>
              <Button icon={<ReloadOutlined />} onClick={refreshEmployees}>
                刷新
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
              <Button icon={<ExportOutlined />}>导出Excel</Button>
              <Button 
                icon={<ImportOutlined />}
                onClick={() => navigate('/employee-management/bulk-import')}
              >
                批量导入
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 员工表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={employees}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default EmployeeManagementPage; 