import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, DatePicker, Space, Typography, message, Popconfirm, TreeSelect } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import PageHeaderLayout from '../../../components/common/PageHeaderLayout';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs'; // For DatePicker default values

import {
  getPersonnelCategories,
  createPersonnelCategory,
  updatePersonnelCategory,
  deletePersonnelCategory,
  getAllPersonnelCategoriesFlat,
  // Potentially getPersonnelCategoryById if it was used, assuming not for now
} from "../../../api/personnelCategories"; // Corrected path and function names
import styles from './TreeTable.module.less';
import type { GetPersonnelCategoriesApiParams } from '../../../api/personnelCategories'; // Import new API params type
import type { PersonnelCategory, CreatePersonnelCategoryPayload, UpdatePersonnelCategoryPayload } from '../../../api/types';
import type { TableParams } from '../../../types/antd'; // Reusing TableParams

const { Title } = Typography;
const { TreeNode } = TreeSelect;

interface PersonnelCategoryPageItem extends PersonnelCategory {
  key: React.Key;
  children?: PersonnelCategoryPageItem[];
}

// Helper function to convert flat list to tree structure for AntD Table/TreeSelect
const buildTreeData = (personnelCategories: PersonnelCategory[], parentId: number | null = null): PersonnelCategoryPageItem[] => {
  // 统一用 number/null 进行父子关系判断，避免字符串比较导致的类型问题
  const filtered = personnelCategories.filter(pc => {
    const pcParentIdNum = pc.parent_category_id === undefined || pc.parent_category_id === null
      ? null
      : Number(pc.parent_category_id);
    const isMatch = pcParentIdNum === parentId;
    console.log(`Comparing pc.parent_category_id=${pcParentIdNum} with parentId=${parentId}, isMatch=${isMatch}`);
    return isMatch;
  });

  console.log(`Building tree data for parentId: ${parentId}, matching items:`, filtered.length);
  console.log('personnelCategories:', personnelCategories);
  console.log('parentId:', parentId);
  console.log('filtered personnelCategories:', filtered);

  return filtered.map(pc => {
    const children = buildTreeData(personnelCategories, pc.id);
    console.log(`Item ${pc.id} (${pc.name}) has ${children.length} children`);

    return {
      ...pc,
      key: pc.id,
      title: pc.name, // For TreeSelect
      value: pc.id,   // For TreeSelect
      children: children, // 始终设置为数组，即使是空数组
    };
  });
};

interface PersonnelCategoryFormValues extends Omit<CreatePersonnelCategoryPayload, 'effective_date' | 'end_date' | 'is_active'> {
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active?: boolean; // Kept optional here, will be defaulted in form/payload
}

const PersonnelCategoriesPage: React.FC = () => {
  const { t } = useTranslation('personnelCategory');
  const [personnelCategories, setPersonnelCategories] = useState<PersonnelCategoryPageItem[]>([]);
  const [personnelCategoriesTree, setPersonnelCategoriesTree] = useState<PersonnelCategoryPageItem[]>([]);
  const [allFlatPersonnelCategories, setAllFlatPersonnelCategories] = useState<PersonnelCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 10, total: 0 },
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPersonnelCategory, setEditingPersonnelCategory] = useState<PersonnelCategoryPageItem | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [form] = Form.useForm<PersonnelCategoryFormValues>();

  const fetchData: () => Promise<void> = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPersonnelCategories({
        search: '', 
        size: 100, // Fetch up to 100 items, covering all data as per user confirmation
        // is_active: undefined, // Explicitly undefined or not passing it means no filter by active status by backend
      });

      console.log('API Response (raw for table):', response);
      console.log('API Response Data (for table):', response.data);
      if (response.data.length > 0) {
        console.log('API Response Data[0]:', response.data[0]);
        console.log('parent_category_id in Data[0]:', response.data[0].parent_category_id);
      }

      const fixedData = response.data.map(item => {
        const itemCopy = { ...item };
        if (typeof itemCopy.parent_category_id === 'string') {
          const parentIdStr = itemCopy.parent_category_id as string;
          if (parentIdStr.includes(',')) {
            const firstNumber = parentIdStr.split(',')[0].trim();
            itemCopy.parent_category_id = parseInt(firstNumber, 10);
          } else {
            itemCopy.parent_category_id = parseInt(parentIdStr, 10);
          }
        }
        return itemCopy;
      });

      console.log('Fixed Data (for table and selector):', fixedData);

      // Use the fetched and fixed data for both the tree selector and the table
      setAllFlatPersonnelCategories(fixedData);

      const treeData = buildTreeData(fixedData);
      console.log('Tree Data (for table):', treeData);

      setPersonnelCategoriesTree(treeData);
      // setPersonnelCategories(treeData); // This might be redundant if personnelCategoriesTree is the primary source for the Table

      // No need to setTableParams here if pagination is fully client-side or not used for tree.
    } catch (error) {
      message.error(t('message.fetch_list_failed'));
      console.error('Failed to fetch personnel categories:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 表格变化处理函数，用于处理筛选条件变化
  const handleTableChange = (
    _pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    _sorter: any
  ) => {
    // 由于使用树形结构，不再需要处理分页
    // 但仍然保留筛选功能
    setTableParams(prev => ({
      ...prev,
      filters,
    }));

    // 如果有筛选条件，可以在这里重新获取数据
    // 但由于我们使用的是客户端树形结构，这里暂不实现
  };

  // 创建新职位的模态框
  const showCreateModal = () => {
    setEditingPersonnelCategory(null);
    form.resetFields();
    form.setFieldsValue({
        is_active: true,
        effective_date: dayjs() // Default effective_date to today for new entries
     });
    setIsModalOpen(true);
  };

  // 创建子职位的模态框
  const showCreateChildModal = (parentId: number) => {
    setEditingPersonnelCategory(null);
    form.resetFields();
    form.setFieldsValue({
        is_active: true,
        effective_date: dayjs(), // Default effective_date to today for new entries
        parent_category_id: parentId // Corrected: parent_category_id
     });
    setIsModalOpen(true);
  };

  const showEditModal = (record: PersonnelCategoryPageItem) => {
    setEditingPersonnelCategory(record);
    form.setFieldsValue({
      ...record, // Spread first to get code, name, description, is_active
      effective_date: dayjs(record.effective_date),
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingPersonnelCategory(null);
  };

  const handleFormSubmit = async (values: PersonnelCategoryFormValues) => {
    setModalLoading(true);
    const payload: CreatePersonnelCategoryPayload = {
      code: values.code,
      name: values.name,
      description: values.description === undefined ? null : values.description,
      parent_category_id: values.parent_category_id || null,
      effective_date: values.effective_date.format('YYYY-MM-DD'),
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      is_active: values.is_active === undefined ? true : values.is_active,
    };

    try {
      if (editingPersonnelCategory) {
        await updatePersonnelCategory(editingPersonnelCategory.id, payload as UpdatePersonnelCategoryPayload); // Cast for update
        message.success(t('message.update_success'));
      } else {
        await createPersonnelCategory(payload);
        message.success(t('message.create_success'));
      }
      setIsModalOpen(false);
      setEditingPersonnelCategory(null);
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('message.error_unknown');
      message.error(`${t('message.operation_failed_prefix')}${errorMsg}`);
      console.error('Personnel category operation failed:', error.response?.data || error);
    }
    setModalLoading(false);
  };

  const handleDeletePersonnelCategory = async (id: number) => {
    try {
      await deletePersonnelCategory(id);
      message.success(t('message.delete_success'));
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('message.delete_failed_has_children');
      message.error(`${t('message.delete_failed_prefix')}${errorMsg}`);
      console.error('Failed to delete personnel category:', error.response?.data || error);
    }
  };

  const handleStatusChange = async (newIsActiveState: boolean, record: PersonnelCategoryPageItem) => {
    setModalLoading(true); // Use modalLoading or a new state for inline loading indication if preferred
    const payload: UpdatePersonnelCategoryPayload = {
      code: record.code,
      name: record.name,
      description: record.description === undefined ? null : record.description,
      parent_category_id: record.parent_category_id === undefined ? null : record.parent_category_id,
      effective_date: record.effective_date, // Already string YYYY-MM-DD
      end_date: record.end_date ? record.end_date : undefined, // Already string YYYY-MM-DD or null/undefined
      is_active: newIsActiveState,
    };

    try {
      await updatePersonnelCategory(record.id, payload);
      message.success(t('message.update_success')); // Assuming this translation key exists and is appropriate
      fetchData(); // Refresh data to show updated status
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('message.error_unknown');
      message.error(`${t('message.operation_failed_prefix')}${errorMsg}`);
      // Consider reverting switch optimistically, or refetch data to ensure UI consistency
    } finally {
      setModalLoading(false); // Reset loading state
    }
  };

  const columns: ColumnsType<PersonnelCategoryPageItem> = [
    { title: t('table.column.id'), dataIndex: 'id', key: 'id', width: 80 },
    { title: t('table.column.code'), dataIndex: 'code', key: 'code', width: 150 },
    { title: t('table.column.name'), dataIndex: 'name', key: 'name' }, // 树形结构将基于此列
    { title: t('table.column.parent_id'), dataIndex: 'parent_category_id', key: 'parent_category_id', width: 120, render: (id) => id || t('table.cell_empty') },
    { title: t('table.column.description'), dataIndex: 'description', key: 'description', render: (text) => text || t('table.cell_empty') },
    {
      title: t('table.column.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      render: (text: string) => text ? format(new Date(text), 'yyyy-MM-dd') : t('table.cell_empty'),
    },
    {
      title: t('table.column.end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (text?: string | null) => text ? format(new Date(text), 'yyyy-MM-dd') : t('table.cell_empty'),
    },
    {
      title: t('table.column.active'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean, record: PersonnelCategoryPageItem) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleStatusChange(checked, record)}
          loading={modalLoading && editingPersonnelCategory?.id === record.id} // Optional: show loading on the specific switch
        />
      ),
    },
    {
      title: t('table.column.actions'),
      key: 'action',
      width: 180,
      render: (_: any, record: PersonnelCategoryPageItem) => (
        <Space size="small">
          <ActionButton actionType="add" onClick={() => showCreateChildModal(record.id)} tooltipTitle={t('tooltip.add_child_personnel_category')} />
          <ActionButton actionType="edit" onClick={() => showEditModal(record)} tooltipTitle={t('tooltip.edit_personnel_category')} />
          <Popconfirm
            title={t('popconfirm.delete_title')}
            onConfirm={() => handleDeletePersonnelCategory(record.id)}
            okText={t('popconfirm.ok')}
            cancelText={t('popconfirm.cancel')}
            disabled={record.children && record.children.length > 0} // Disable if has children, for example
          >
            <ActionButton actionType="delete" tooltipTitle={t('tooltip.delete_personnel_category')} danger disabled={record.children && record.children.length > 0}/>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeaderLayout>
        <Title level={4} style={{ margin: 0 }}>{t('title')}</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            {t('button.create_top_level')}
          </Button>
        </Space>
      </PageHeaderLayout>

      <Table
        columns={columns}
        dataSource={personnelCategoriesTree} 
        loading={isLoading}
        pagination={false}
        rowKey="id"
        expandable={{ defaultExpandAllRows: true }}
        className={styles['tree-table']}
        bordered
      />
      <Modal
        title={editingPersonnelCategory ? t('modal.title.edit_personnel_category') : t('modal.title.new_personnel_category')}
        open={isModalOpen}
        onCancel={handleCancelModal}
        onOk={form.submit}
        confirmLoading={modalLoading}
        destroyOnHidden // Ensure form is reset when modal is closed and reopened for "create"
      >
        <Form form={form} layout="vertical" name="personnelCategoryForm" onFinish={handleFormSubmit}>
          <Form.Item name="code" label={t('form.label.code')} rules={[{ required: true, message: t('form.validation.code_required') }]}>
            <Input placeholder={t('form.placeholder.code')} />
          </Form.Item>
          <Form.Item name="name" label={t('form.label.name')} rules={[{ required: true, message: t('form.validation.name_required') }]}>
            <Input placeholder={t('form.placeholder.name')} />
          </Form.Item>
          <Form.Item name="description" label={t('form.label.description')}>
            <Input.TextArea rows={2} placeholder={t('form.placeholder.description')} />
          </Form.Item>
          <Form.Item name="parent_category_id" label={t('form.label.parent_personnel_category')}>
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder={t('form.placeholder.parent_personnel_category')}
              allowClear
              treeDefaultExpandAll
              treeData={buildTreeData(allFlatPersonnelCategories)}
              notFoundContent={<div style={{ padding: '8px 12px', color: '#999' }}>{t('treeselect.not_found')}</div>}
              filterTreeNode={(inputValue, treeNode) =>
                treeNode?.title?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
              virtual={false} // Disable virtual scroll if tree data is not very large or if there are issues with it
            />
          </Form.Item>
          <Form.Item
            name="effective_date"
            label={t('form.label.effective_date')}
            rules={[{ required: true, message: t('form.validation.effective_date_required') }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="end_date" label={t('form.label.end_date')}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="is_active"
            label={t('form.label.is_active')}
            valuePropName="checked"
            initialValue={true} // Default is_active in form to true
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PersonnelCategoriesPage;