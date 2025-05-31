import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, Switch, DatePicker, Space, Typography, App, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EnhancedProTable from '../../../components/common/EnhancedProTable';
import OrganizationManagementTableTemplate from '../../../components/common/OrganizationManagementTableTemplate';
import type { ProColumns } from '@ant-design/pro-components';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';

import { getPositions, createPosition, updatePosition, deletePosition } from '../../../api/positions';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '../../../api/types';
import TableActionButton from '../../../components/common/TableActionButton';
import styles from './ActualPositionTab.module.less';

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
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 10, total: 0 },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPositions({
        search: '',
        size: 100,
      });

      if (response && response.data) {
        const positionsWithKeys = response.data.map((pos: Position) => ({
          ...pos,
          key: pos.id,
        }));
        setPositions(positionsWithKeys);
      }
    } catch (error) {
      antdMessage.error(t('common:message.operation_failed'));
      console.error('Failed to fetch positions:', error);
    }
    setIsLoading(false);
  }, [t, antdMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 创建新职位
  const showCreateModal = () => {
    setEditingPosition(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      effective_date: dayjs()
    });
    setIsModalOpen(true);
  };

  // 编辑职位
  const showEditModal = (record: PositionPageItem) => {
    setEditingPosition(record);
    form.setFieldsValue({
      ...record,
      effective_date: record.effective_date ? dayjs(record.effective_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingPosition(null);
  };

  const handleFormSubmit = async (values: PositionFormValues) => {
    setModalLoading(true);
    const payload: CreatePositionPayload = {
      code: values.code || null,
      name: values.name,
      description: values.description || null,
      parent_position_id: values.parent_position_id || null,
      effective_date: values.effective_date.format('YYYY-MM-DD'),
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      is_active: values.is_active === undefined ? true : values.is_active,
    };

    try {
      if (editingPosition) {
        console.log({t('admin:auto__id_editingposition_id___e6ada3')}, payload);
        await updatePosition(editingPosition.id, payload as UpdatePositionPayload);
        antdMessage.success(t('common:message.update_success_default'));
      } else {
        console.log({t('admin:auto____e6ada3')}, payload);
        await createPosition(payload);
        antdMessage.success(t('common:message.create_success_default'));
      }
      setIsModalOpen(false);
      setEditingPosition(null);
      fetchData();
    } catch (error: any) {
      // 为不同类型的错误提供更具体的错误消息
      let errorMsg = '';
      
      if (error.response?.status === 404) {
        errorMsg = `${t('common:message.api_not_found')} (404)`;
        console.error({t('admin:auto_api_api__415049')}, error.config?.url);
      } else if (error.response?.status === 405) {
        errorMsg = `${t('common:message.method_not_allowed')} (405)`;
        console.error({t('admin:auto_http_api__485454')}, error.config?.method, error.config?.url);
      } else {
        // 使用服务器返回的错误信息或默认消息
        errorMsg = error.response?.data?.detail?.details || 
                  error.response?.data?.detail || 
                  error.message || 
                  t('common:message.error_unknown');
      }
      
      // 显示错误信息
      antdMessage.error(`${t('common:message.operation_failed_prefix')}${errorMsg}`);
      
      // 记录详细错误日志
      console.error('Position operation failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: payload
      });
    }
    setModalLoading(false);
  };

  const handleDeletePosition = async (id: number) => {
    try {
      await deletePosition(id);
      antdMessage.success(t('common:message.delete_success_default'));
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || t('common:message.error_unknown');
      antdMessage.error(`${t('common:message.operation_failed_prefix')}${errorMsg}`);
      console.error('Failed to delete position:', error.response?.data || error);
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
      sorter: (a, b) => new Date(a.effective_date || '').getTime() - new Date(b.effective_date || '').getTime(),
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
    setTableParams({
      pagination,
      filters,
      ...sorter.field && { sort: { field: sorter.field, order: sorter.order } },
    });
  };

  return (
    <>
      <OrganizationManagementTableTemplate<PositionPageItem>
        pageTitle={t('position.title', {t('admin:auto_text_e5ae9e')})}
        addButtonText={t('position.button.add', {t('admin:auto_text_e696b0')})}
        onAddClick={showCreateModal}
        columns={columns}
        dataSource={positions}
        loading={isLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        search={false}
        onRefresh={handleRefresh}
        showPageTitle={true}
      />

      <Modal
        title={editingPosition ? t('actual_position_management.modal.edit_title', 'Edit Position') : t('actual_position_management.modal.create_title', 'New Position')}
        open={isModalOpen}
        onCancel={handleCancelModal}
        confirmLoading={modalLoading}
        onOk={() => {
          form
            .validateFields()
            .then(values => {
              handleFormSubmit(values);
            })
            .catch(info => {
              console.log('Validate Failed:', info);
              antdMessage.error(t('common:message.form_validation_error'));
            });
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="positionForm">
          <Form.Item
            name="code"
            label={t('actual_position_management.form.field.code', 'Position Code')}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('actual_position_management.form.field.name', 'Position Name')}
            rules={[{ required: true, message: t('actual_position_management.form.validation.name_required', 'Position name is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item 
            name="description" 
            label={t('actual_position_management.form.field.description', 'Description')}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="effective_date"
            label={t('position.form.effective_date', {t('admin:auto_text_e7949f')})}
            rules={[{ required: true, message: t('position.form.validation.effective_date_required', {t('admin:auto_text_e8afb7')}) }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="end_date"
            label={t('position.form.end_date', {t('admin:auto_text_e5a4b1')})}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="is_active"
            valuePropName="checked"
            label={t('actual_position_management.form.field.is_active', 'Is Active')}
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
