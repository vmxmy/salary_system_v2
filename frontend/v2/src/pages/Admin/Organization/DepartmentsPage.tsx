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
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { PlusOutlined, ClusterOutlined } from '@ant-design/icons';
import ActionButton from '../../../components/common/ActionButton';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

// 导入样式文件
import styles from './TreeTable.module.less';

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
  const { t } = useTranslation();
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
      message.error(t('department_management_page.message.fetch_all_flat_error'));
    }
  }, [t]);

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
      message.error(t('department_management_page.message.fetch_list_error'));
      console.error('Failed to fetch departments:', error);
    }
    setIsLoading(false);
  }, [allFlatDepartments.length, t]);

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
        message.success(t('department_management_page.message.update_success'));
      } else {
        await createDepartment(payload);
        message.success(t('department_management_page.message.create_success'));
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      fetchData(); // Refresh tree
      fetchAllFlatDataForSelector(); // Refresh selector options
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('department_management_page.message.error.unknown');
      message.error(`${t('department_management_page.message.operation_failed_prefix')}${errorMsg}`);
      console.error('Department operation failed:', error.response?.data || error);
    }
    setModalLoading(false);
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      await deleteDepartment(id);
      message.success(t('department_management_page.message.delete_success'));
      fetchData();
      fetchAllFlatDataForSelector();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('department_management_page.message.error.delete_in_use_or_has_children');
      message.error(`${t('department_management_page.message.delete_failed_prefix')}${errorMsg}`);
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
      title: t('department_management_page.table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      rowScope: 'row' // 将ID列设置为行头
    },
    {
      title: t('department_management_page.table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      onCell: sharedOnCell // 根部门时被合并
    },
    {
      title: t('department_management_page.table.column.name'),
      dataIndex: 'name',
      key: 'name',
      onCell: nameColumnOnCell // 根部门时合并代码列
    },
    {
      title: t('department_management_page.table.column.parent_department_id'),
      dataIndex: 'parent_department_id',
      key: 'parent_department_id',
      width: 120,
      render: (id) => id || t('department_management_page.table.column.value_na_or_dash')
    },
    {
      title: t('department_management_page.table.column.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (text: string) => text ? format(new Date(text), 'yyyy-MM-dd') : t('department_management_page.table.column.value_na_or_dash')
    },
    {
      title: t('department_management_page.table.column.is_active'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Switch checked={isActive} disabled />,
      width: 80
    },
    {
      title: t('department_management_page.table.column.actions'),
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <ActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle={t('department_management_page.tooltip.edit_department')} />
          <Popconfirm
            title={t('department_management_page.popconfirm.delete.title')}
            description={t('department_management_page.popconfirm.delete.description')}
            onConfirm={() => handleDeleteDepartment(record.id)}
            okText={t('department_management_page.popconfirm.delete.ok_text')}
            cancelText={t('department_management_page.popconfirm.delete.cancel_text')}
          >
            <ActionButton actionType="delete" tooltipTitle={t('department_management_page.tooltip.delete_department')} danger/>
          </Popconfirm>
          <Button size="small" icon={<PlusOutlined />} onClick={() => showCreateModal(record.id)} title={t('department_management_page.button.add_child_department_tooltip')} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderLayout>
        <Title level={4} style={{ marginBottom: 0 }}><ClusterOutlined /> {t('department_management_page.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showCreateModal(null)} shape="round">
          {t('department_management_page.button.create_root_department')}
        </Button>
      </PageHeaderLayout>
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
        className={styles['tree-table']}
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
        title={editingDepartment 
          ? t('department_management_page.modal.department_form.title.edit') 
          : t('department_management_page.modal.department_form.title.create')}
        open={isModalOpen}
        onCancel={handleCancelModal}
        onOk={() => form.submit()}
        confirmLoading={modalLoading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="departmentForm" onFinish={handleFormSubmit}>
          <Form.Item name="code" label={t('department_management_page.modal.department_form.label.code')} rules={[{ required: true, message: t('department_management_page.modal.department_form.validation.code_required') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label={t('department_management_page.modal.department_form.label.name')} rules={[{ required: true, message: t('department_management_page.modal.department_form.validation.name_required') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parent_department_id" label={t('department_management_page.modal.department_form.label.parent_department')}>
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder={t('department_management_page.modal.department_form.placeholder.parent_department')}
              allowClear
              treeDefaultExpandAll
              treeData={buildTreeData(allFlatDepartments)} // Use the flat list converted to tree for selector
              filterTreeNode={(inputValue, treeNode) =>
                treeNode?.title?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
              virtual={false}
            />
          </Form.Item>
          <Form.Item name="description" label={t('department_management_page.modal.department_form.label.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="effective_date" label={t('department_management_page.modal.department_form.label.effective_date')} rules={[{ required: true, message: t('department_management_page.modal.department_form.validation.effective_date_required') }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="end_date" label={t('department_management_page.modal.department_form.label.end_date')}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="is_active" label={t('department_management_page.modal.department_form.label.is_active')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;