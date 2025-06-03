import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, Switch, DatePicker, Space, Typography, App, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import OrganizationManagementTableTemplate from '../../../components/common/OrganizationManagementTableTemplate';
import type { ProColumns } from '@ant-design/pro-components';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';

import { getPositions, createPosition, updatePosition, deletePosition } from '../../../api/positions';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../../../api/types';
import TableActionButton from '../../../components/common/TableActionButton';
// import styles from './ActualPositionTab.module.less'; // Assuming styles are correctly imported and used if needed

const { Title } = Typography;

interface PositionPageItem extends Position {
  key: React.Key;
}

interface PositionFormValues extends Omit<CreatePositionPayload, 'effective_date' | 'end_date'> {
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active?: boolean;
}

interface TableParams {
  pagination?: TablePaginationConfig;
}

const ActualPositionTab: React.FC = () => {
  const { t } = useTranslation(['organization', 'common']);
  const { message: antdMessage } = App.useApp();

  const [positions, setPositions] = useState<PositionPageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPosition, setEditingPosition] = useState<PositionPageItem | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [form] = Form.useForm<PositionFormValues>();
  // tableParams is declared but not used for pagination or filtering in fetchData
  // consider removing if not actively managing table state via this param
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 10, total: 0 },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPositions({
        search: '',
        size: 100, // Hardcoded size, consider making this dynamic with tableParams
      });

      if (response && response.data) {
        const positionsWithKeys = response.data.map((pos: Position) => ({
          ...pos,
          key: pos.id,
        }));
        setPositions(positionsWithKeys);
        // If using actual pagination from API, update tableParams.pagination.total here
        // setTableParams(prev => ({
        //   ...prev,
        //   pagination: {
        //     ...prev.pagination,
        //     total: response.total_count, // Assuming API returns total_count
        //   },
        // }));
      }
    } catch (error) {
      antdMessage.error(t('common:message.operation_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [t, antdMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependency array is correct

  // 创建新职位
  const showCreateModal = () => {
    setEditingPosition(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      effective_date: dayjs(),
      end_date: null, // Ensure end_date is null for new creation
    });
    setIsModalOpen(true);
  };

  // 编辑职位
  const showEditModal = (record: PositionPageItem) => {
    setEditingPosition(record);
    form.setFieldsValue({
      ...record,
      effective_date: record.effective_date ? dayjs(record.effective_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : null, // Handle null explicitly
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingPosition(null);
    form.resetFields(); // Reset form fields when modal closes
  };

  const handleFormSubmit = async (values: PositionFormValues) => {
    setModalLoading(true);

    // Ensure effective_date is always sent
    const payload: CreatePositionPayload = {
      code: values.code || null,
      name: values.name,
      description: values.description || null,
      parent_position_id: values.parent_position_id || null, // Assuming parent_position_id can be part of form values
      effective_date: values.effective_date.format('YYYY-MM-DD'),
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null, // Send null if end_date is not set
      is_active: values.is_active === undefined ? true : values.is_active,
    };

    try {
      if (editingPosition) {
        await updatePosition(editingPosition.id, payload as UpdatePositionPayload);
        antdMessage.success(t('common:message.update_success_default'));
      } else {
        await createPosition(payload);
        antdMessage.success(t('common:message.create_success_default'));
      }
      setIsModalOpen(false);
      setEditingPosition(null);
      fetchData();
    } catch (error: any) {
      let errorMsg = '';

      if (error.response?.status === 404) {
        errorMsg = `${t('common:message.api_not_found')} (404)`;
      } else if (error.response?.status === 405) {
        errorMsg = `${t('common:message.method_not_allowed')} (405)`;
      } else if (error.response?.data?.detail) {
        // Prefer a 'details' field if available, then 'detail'
        errorMsg = error.response.data.detail.details || error.response.data.detail;
      } else {
        errorMsg = error.message || t('common:message.error_unknown');
      }

      antdMessage.error(`${t('common:message.operation_failed_prefix')}${errorMsg}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePosition = async (id: number) => {
    try {
      await deletePosition(id);
      antdMessage.success(t('common:message.delete_success_default'));
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('common:message.error_unknown');
      antdMessage.error(`${t('common:message.operation_failed_prefix')}${errorMsg}`);
    }
  };

  const columns: ProColumns<PositionPageItem>[] = [
    {
      title: t('common:label.id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      valueType: 'digit',
    },
    {
      title: t('common:label.code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      sorter: (a, b) => (a.code || '').localeCompare(b.code || ''),
      valueType: 'text',
    },
    {
      title: t('common:label.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      valueType: 'text',
      render: (_, record) => (
        <a onClick={() => showEditModal(record)}>{record.name}</a>
      ),
    },
    {
      title: t('common:label.description'),
      dataIndex: 'description',
      key: 'description',
      valueType: 'text',
      ellipsis: true,
    },
    {
      title: t('common:label.effective_date'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      sorter: (a, b) => {
        const aDate = a.effective_date ? new Date(a.effective_date).getTime() : 0;
        const bDate = b.effective_date ? new Date(b.effective_date).getTime() : 0;
        return aDate - bDate;
      },
      valueType: 'date',
      render: (_, record) => record.effective_date ? format(new Date(record.effective_date), 'yyyy-MM-dd') : t('common:table.cell_empty'),
    },
    {
      title: t('common:label.end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      sorter: (a, b) => {
        const aDate = a.end_date ? new Date(a.end_date).getTime() : 0;
        const bDate = b.end_date ? new Date(b.end_date).getTime() : 0;
        return aDate - bDate;
      },
      valueType: 'date',
      render: (_, record) => record.end_date ? format(new Date(record.end_date), 'yyyy-MM-dd') : t('common:table.cell_empty'),
    },
    {
      title: t('common:status.active'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      search: false,
      valueType: 'select',
      valueEnum: {
        true: { text: t('common:status.active_yes'), status: 'Success' },
        false: { text: t('common:status.active_no'), status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          disabled={true}
        />
      ),
    },
    {
      title: t('common:label.actions'),
      key: 'actions',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space size="small">
          <TableActionButton
            actionType="edit"
            tooltipTitle={t('common:button.edit')}
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title={t('common:modal.confirm_delete.title')}
            description={t('common:modal.confirm_delete.content_item', { itemName: record.name })}
            onConfirm={() => handleDeletePosition(record.id)}
            okText={t('common:button.confirm')}
            cancelText={t('common:button.cancel')}
          >
            <TableActionButton
              actionType="delete"
              danger
              tooltipTitle={t('common:button.delete')}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleRefresh = async () => {
    await fetchData();
  };

  // 表格变化处理函数，处理分页、筛选、排序等变化
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => {
    // This function is correctly structured, but its output 'tableParams' is not used to refetch data.
    // If you intend for sorting/filtering/pagination to trigger data fetches,
    // you would need to update fetchData to accept these params and pass them to your API call.
    setTableParams({
      pagination,
      filters,
      ...sorter.field && { sort: { field: sorter.field, order: sorter.order } },
    });
  };

  return (
    <>
      <OrganizationManagementTableTemplate<PositionPageItem>
        pageTitle={t('organization:position.title')}
        addButtonText={t('organization:position.button.add')}
        onAddClick={showCreateModal}
        columns={columns}
        dataSource={positions}
        loading={isLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          // You might want to pass the total from the API response here if using server-side pagination
          total: tableParams.pagination?.total,
          current: tableParams.pagination?.current,
          pageSize: tableParams.pagination?.pageSize,
          onChange: (page, pageSize) => setTableParams(prev => ({
            ...prev,
            pagination: { ...prev.pagination, current: page, pageSize }
          })),
          onShowSizeChange: (current, size) => setTableParams(prev => ({
            ...prev,
            pagination: { ...prev.pagination, current, pageSize: size }
          })),
        }}
        search={false} // Assuming search is handled by individual column filters or a separate search component
        onRefresh={handleRefresh}
        showPageTitle={true}
        // If you want to use the handleTableChange for full server-side processing:
        // onChange={handleTableChange}
      />

      <Modal
        title={editingPosition ? t('organization:actual_position_management.modal.edit_title') : t('organization:actual_position_management.modal.create_title')}
        open={isModalOpen}
        onCancel={handleCancelModal}
        confirmLoading={modalLoading}
        onOk={() => {
          form
            .validateFields()
            .then(values => {
              handleFormSubmit(values);
            })
            .catch(() => {
              antdMessage.error(t('common:message.form_validation_error'));
            });
        }}
        destroyOnHidden // Use destroyOnHidden for cleaner state reset
      >
        <Form form={form} layout="vertical" name="positionForm">
          <Form.Item
            name="code"
            label={t('organization:actual_position_management.form.field.code')}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('organization:actual_position_management.form.field.name')}
            rules={[{ required: true, message: t('organization:actual_position_management.form.validation.name_required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('organization:actual_position_management.form.field.description')}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="effective_date"
            label={t('organization:position.form.effective_date')}
            rules={[{ required: true, message: t('organization:position.form.validation.effective_date_required') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="end_date"
            label={t('organization:position.form.end_date')}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="is_active"
            valuePropName="checked"
            label={t('organization:actual_position_management.form.field.is_active')}
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ActualPositionTab;