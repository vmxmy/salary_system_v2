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
  Col,
  Row,
} from 'antd';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import { PlusOutlined, ClusterOutlined } from '@ant-design/icons';
import TableActionButton from '../../../components/common/TableActionButton';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import EmployeeName from '../../../components/common/EmployeeName';
import { useTableSearch, numberSorter, stringSorter, dateSorter } from '../../../components/common/TableUtils';

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
  const { t } = useTranslation('department');
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

  // 使用通用表格搜索工具
  const { getColumnSearch } = useTableSearch();

  const fetchAllFlatDataForSelector = useCallback(async () => {
    // This fetches all (active) departments for the parent selector
    try {
      const flatData = await getAllDepartmentsFlat();
      setAllFlatDepartments(flatData);
    } catch (error) {
      message.error(t('message.fetch_all_flat_error'));
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
      message.error(t('message.fetch_list_error'));
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
        message.success(t('message.update_success'));
      } else {
        await createDepartment(payload);
        message.success(t('message.create_success'));
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      fetchData(); // Refresh tree
      fetchAllFlatDataForSelector(); // Refresh selector options
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('message.error.unknown');
      message.error(`${t('message.operation_failed_prefix')}${errorMsg}`);
      console.error('Department operation failed:', error.response?.data || error);
    }
    setModalLoading(false);
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      await deleteDepartment(id);
      message.success(t('message.delete_success'));
      fetchData();
      fetchAllFlatDataForSelector();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('message.error.delete_in_use_or_has_children');
      message.error(`${t('message.delete_failed_prefix')}${errorMsg}`);
      console.error('Failed to delete department:', error.response?.data || error);
    }
  };

  // 只保留名称列的样式设置，移除列合并逻辑
  const nameColumnOnCell = (record: DepartmentPageItem) => {
    if (record.depth === 0) {
      return {
        style: { fontWeight: 'bold' }
      };
    }
    return {};
  };

  const columns: ColumnsType<DepartmentPageItem> = [
    {
      title: t('table.column.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      rowScope: 'row', // 将ID列设置为行头
      sorter: numberSorter<DepartmentPageItem>('id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('id'),
    },
    {
      title: t('table.column.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      sorter: stringSorter<DepartmentPageItem>('code'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('code'),
    },
    {
      title: t('table.column.name'),
      dataIndex: 'name',
      key: 'name',
      onCell: nameColumnOnCell, // 只保留名称列的样式设置
      sorter: stringSorter<DepartmentPageItem>('name'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('name'),
    },
    {
      title: t('table.column.parent_department_id'),
      dataIndex: 'parent_department_id',
      key: 'parent_department_id',
      width: 120,
      render: (id?: number) => id || t('table.column.value_na_or_dash'),
      sorter: numberSorter<DepartmentPageItem>('parent_department_id'),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: t('table.column.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (text: string) => text ? format(new Date(text), 'yyyy-MM-dd') : t('table.column.value_na_or_dash'),
      sorter: dateSorter<DepartmentPageItem>('effective_date'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('effective_date'),
    },
    {
      title: t('table.column.is_active'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Switch checked={isActive} disabled />,
      width: 80,
      filters: [
        { text: t('table.filter.active'), value: true },
        { text: t('table.filter.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('table.column.actions'),
      key: 'action',
      width: 180,
      render: (_, record) => (
        <>
          {record.depth === 0 ? (
            <Space size="small">
              <TableActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle={t('tooltip.edit_department')} />
              <TableActionButton actionType="add" onClick={() => showCreateModal(record.id)} tooltipTitle={t('button.add_child_department_tooltip')} />
              <Popconfirm
                title={t('popconfirm.delete.title')}
                description={t('popconfirm.delete.description')}
                onConfirm={() => handleDeleteDepartment(record.id)}
                okText={t('popconfirm.delete.ok_text')}
                cancelText={t('popconfirm.delete.cancel_text')}
                disabled={record.children && record.children.length > 0} // Disable if has children
              >
                <TableActionButton 
                  actionType="delete" 
                  danger 
                  tooltipTitle={t('tooltip.delete_department')} 
                  disabled={record.children && record.children.length > 0}
                />
              </Popconfirm>
            </Space>
          ) : (
        <Space size="small">
              <TableActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle={t('tooltip.edit_department')} />
              <TableActionButton actionType="add" onClick={() => showCreateModal(record.id)} tooltipTitle={t('button.add_child_department_tooltip')} />
          <Popconfirm
                title={t('popconfirm.delete.title')}
                description={t('popconfirm.delete.description')}
            onConfirm={() => handleDeleteDepartment(record.id)}
                okText={t('popconfirm.delete.ok_text')}
                cancelText={t('popconfirm.delete.cancel_text')}
                disabled={record.children && record.children.length > 0} // Disable if has children
          >
                <TableActionButton 
                  actionType="delete" 
                  danger 
                  tooltipTitle={t('tooltip.delete_department')} 
                  disabled={record.children && record.children.length > 0}
                />
          </Popconfirm>
        </Space>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeaderLayout
        pageTitle={<Title level={4}>{t('title')}</Title>}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showCreateModal()} shape="round">
            {t('button.create_top_level_department')}
          </Button>
        }
      >
        <></>
      </PageHeaderLayout>

      <Table
        columns={columns}
        dataSource={departmentsTree}
        loading={isLoading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => t('pagination.total', { total }),
        }}
        rowKey="id"
        expandable={{ defaultExpandAllRows: true }}
        className={styles['tree-table']}
        bordered
        onChange={handleTableChange}
      />
      
      <Modal
        title={editingDepartment
          ? t('modal.department_form.title.edit')
          : t('modal.department_form.title.create')}
        open={isModalOpen}
        onCancel={handleCancelModal}
        onOk={() => form.submit()}
        confirmLoading={modalLoading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="departmentForm" onFinish={handleFormSubmit}>
          <Row>
            <Col span={12}>
              <Form.Item name="code" label={t('modal.department_form.label.code')} rules={[{ required: true, message: t('modal.department_form.validation.code_required') }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label={t('modal.department_form.label.name')} rules={[{ required: true, message: t('modal.department_form.validation.name_required') }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="parent_department_id" label={t('modal.department_form.label.parent_department')}>
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder={t('modal.department_form.placeholder.parent_department')}
              allowClear
              treeDefaultExpandAll
              treeData={buildTreeData(allFlatDepartments.filter(d => !editingDepartment || d.id !== editingDepartment.id))}
              filterTreeNode={(inputValue, treeNode) =>
                treeNode?.title?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
              virtual={false}
            />
          </Form.Item>
          <Form.Item name="manager_id" label={t('modal.department_form.label.manager')}>
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder={t('modal.department_form.placeholder.manager')}
              allowClear
              filterOption={(input, option: any) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) || false
              }
              options={[]}
              // 实际应用中，需要从后端获取员工列表作为选项
            />
          </Form.Item>
          <Form.Item name="description" label={t('modal.department_form.label.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row>
            <Col span={12}>
              <Form.Item name="effective_date" label={t('modal.department_form.label.effective_date')} rules={[{ required: true, message: t('modal.department_form.validation.effective_date_required') }]}>
                <DatePicker format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label={t('modal.department_form.label.end_date')}>
                <DatePicker format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_active" label={t('modal.department_form.label.is_active')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DepartmentsPage;