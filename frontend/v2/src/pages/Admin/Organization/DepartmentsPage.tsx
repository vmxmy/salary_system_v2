import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  DatePicker,
  Select,
  TreeSelect, // For parent department selection
  Space,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClusterOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';

// 导入样式文件
import './DepartmentsPage.css';

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDepartmentsFlat, // To populate parent department selector
} from '../../../api/departments';
import type { GetDepartmentsApiParams } from '../../../api/departments';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '../../../api/types';
import type { TableParams } from '../../../types/antd';

const { Title } = Typography;

// Interface for table items, potentially with children for tree display
interface DepartmentPageItem extends Department {
  key: React.Key;
  children?: DepartmentPageItem[];
  depth?: number; // 添加深度属性，用于单元格合并逻辑
}

// Form values might differ slightly, e.g., dates are Dayjs objects
interface DepartmentFormValues extends Omit<CreateDepartmentPayload, 'effective_date' | 'end_date' | 'is_active'> {
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active?: boolean;
}

// Helper function to convert flat list to tree structure for AntD Table/TreeSelect
const buildTreeData = (departments: Department[], parentId: number | null = null, depth: number = 0): DepartmentPageItem[] => {
  return departments
    .filter(dept => dept.parent_department_id === parentId)
    .map(dept => ({
      ...dept,
      key: dept.id,
      title: dept.name, // For TreeSelect
      value: dept.id,   // For TreeSelect
      depth: depth,     // 添加深度属性，用于单元格合并逻辑
      children: buildTreeData(departments, dept.id, depth + 1),
    }));
};

const DepartmentsPage: React.FC = () => {
  const [departmentsTree, setDepartmentsTree] = useState<DepartmentPageItem[]>([]);
  const [allFlatDepartments, setAllFlatDepartments] = useState<Department[]>([]); // For parent selector
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Pagination might not be directly used if displaying full tree, but useful for fetching initial flat list if large
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 100, total: 0 }, // Fetch more for building tree initially
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentPageItem | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [form] = Form.useForm<DepartmentFormValues>();

  const fetchAllFlatDataForSelector = useCallback(async () => {
    // This fetches all (active) departments for the parent selector
    try {
      const flatData = await getAllDepartmentsFlat();
      setAllFlatDepartments(flatData);
    } catch (error) {
      message.error('获取所有部门列表失败 (用于选择器)');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // For tree display, we often fetch all (or a significant chunk) and build the tree client-side
      // If dataset is huge, server-side pagination for tree nodes would be needed (more complex)
      const response = await getDepartments({
        // page: 1, size: 1000, // Fetch a large number for client-side tree building, or implement paginated tree
        is_active: true, // Optionally filter by active
      });
      const treeData = buildTreeData(response.data);
      setDepartmentsTree(treeData);
      // Also update flat list if not already fetched or needs refresh
      if (allFlatDepartments.length === 0 || response.data.length > allFlatDepartments.length) {
        setAllFlatDepartments(response.data); // Simple update, could be refined
      }
      // Update total for pagination if it were used for the main table
      setTableParams(prev => ({
        ...prev,
        pagination: { ...prev.pagination, total: response.meta.total },
      }));
    } catch (error) {
      message.error('获取部门列表失败');
      console.error('Failed to fetch departments:', error);
    }
    setIsLoading(false);
  }, [allFlatDepartments.length]); // Re-fetch if flat list was empty

  useEffect(() => {
    fetchData();
    // fetchAllFlatDataForSelector(); // Could be called here or on modal open if preferred
  }, [fetchData]);

  // 表格变化处理函数，目前在树形结构中不使用，但保留以备将来需要
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    _sorter: any // 使用下划线前缀表示未使用的参数
  ) => {
    // 更新表格参数状态
    setTableParams({
      pagination,
      filters,
    });
  };

  const showCreateModal = (parentId: number | null = null) => {
    setEditingDepartment(null);
    form.resetFields();
    form.setFieldsValue({
        is_active: true,
        effective_date: dayjs(),
        parent_department_id: parentId
    });
    if (allFlatDepartments.length === 0) fetchAllFlatDataForSelector(); // Ensure parent options are loaded
    setIsModalOpen(true);
  };

  const showEditModal = (record: DepartmentPageItem) => {
    setEditingDepartment(record);
    form.setFieldsValue({
      ...record,
      effective_date: dayjs(record.effective_date),
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    if (allFlatDepartments.length === 0) fetchAllFlatDataForSelector();
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleFormSubmit = async (values: DepartmentFormValues) => {
    setModalLoading(true);
    const payload: CreateDepartmentPayload = {
      ...values,
      effective_date: values.effective_date.format('YYYY-MM-DD'),
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      is_active: values.is_active === undefined ? true : values.is_active,
      parent_department_id: values.parent_department_id === undefined ? null : values.parent_department_id,
    };
    if (payload.description === undefined) {
        payload.description = null;
    }

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, payload as UpdateDepartmentPayload);
        message.success('部门更新成功');
      } else {
        await createDepartment(payload);
        message.success('部门创建成功');
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      fetchData(); // Refresh tree
      fetchAllFlatDataForSelector(); // Refresh selector options
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || '未知错误';
      message.error(`操作失败: ${errorMsg}`);
      console.error('Department operation failed:', error.response?.data || error);
    }
    setModalLoading(false);
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      await deleteDepartment(id);
      message.success('部门删除成功');
      fetchData();
      fetchAllFlatDataForSelector();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || '部门可能正在使用中或包含子部门';
      message.error(`删除失败: ${errorMsg}`);
      console.error('Failed to delete department:', error.response?.data || error);
    }
  };

  // 根部门（深度为0）的单元格合并逻辑已通过onCell属性在columns中直接使用

  // 共享的单元格合并逻辑，用于被合并的单元格
  const sharedOnCell = (record: DepartmentPageItem) => {
    if (record.depth === 0) {
      return { colSpan: 0 };
    }
    return {};
  };

  // 部门名称列的单元格合并逻辑
  const nameColumnOnCell = (record: DepartmentPageItem) => {
    // 根部门（深度为0）的名称列会合并代码列
    if (record.depth === 0) {
      return {
        colSpan: 2,
        style: { fontWeight: 'bold' }
      };
    }
    return {};
  };

  const columns: ColumnsType<DepartmentPageItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      rowScope: 'row' // 将ID列设置为行头
    },
    {
      title: '部门代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      onCell: sharedOnCell // 根部门时被合并
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      onCell: nameColumnOnCell // 根部门时合并代码列
    },
    {
      title: '上级部门ID',
      dataIndex: 'parent_department_id',
      key: 'parent_department_id',
      width: 120,
      render: (id) => id || '-'
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (text: string) => text ? format(new Date(text), 'yyyy-MM-dd') : '-'
    },
    {
      title: '激活',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Switch checked={isActive} disabled />,
      width: 80
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Popconfirm
            title="确定删除此部门吗？"
            description="删除部门也会删除其所有子部门，并可能影响关联员工。"
            onConfirm={() => handleDeleteDepartment(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
          <Button size="small" icon={<PlusOutlined />} onClick={() => showCreateModal(record.id)} title="添加子部门" />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}><ClusterOutlined /> 部门管理</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => showCreateModal(null)} style={{ marginBottom: 16 }}>
        新建根部门
      </Button>
      <Table
        columns={columns}
        dataSource={departmentsTree} // Use tree data
        loading={isLoading}
        pagination={false} // Pagination typically not used with client-side tree display
        onChange={handleTableChange} // 添加onChange处理函数，虽然在树形结构中不常用，但可以处理筛选等操作
        rowKey="id"
        expandable={{ defaultExpandAllRows: true }}
        bordered
        style={{ marginBottom: 16 }}
        className="department-tree-table"
        onRow={(record) => {
          return {
            // 使用自定义属性存储深度信息
            'data-row-depth': record.depth?.toString(),
            // 为根部门添加特殊样式
            style: record.depth === 0 ? { fontWeight: 'bold' } : {}
          };
        }}
      />
      <Modal
        title={editingDepartment ? '编辑部门' : '新建部门'}
        open={isModalOpen}
        onCancel={handleCancelModal}
        onOk={() => form.submit()}
        confirmLoading={modalLoading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="departmentForm" onFinish={handleFormSubmit}>
          <Form.Item name="code" label="部门代码" rules={[{ required: true, message: '请输入部门代码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parent_department_id" label="上级部门">
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder="选择上级部门 (留空则为根部门)"
              allowClear
              treeDefaultExpandAll
              treeData={buildTreeData(allFlatDepartments)} // Use the flat list converted to tree for selector
              filterTreeNode={(inputValue, treeNode) =>
                treeNode?.title?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="effective_date" label="生效日期" rules={[{ required: true, message: '请选择生效日期' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="end_date" label="失效日期">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="is_active" label="是否激活" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;