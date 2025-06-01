import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, Switch, DatePicker, Space, Typography, App, Popconfirm, Tooltip, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EnhancedProTable from '../../../components/common/EnhancedProTable';
import OrganizationManagementTableTemplate from '../../../components/common/OrganizationManagementTableTemplate';
import type { ProColumns } from '@ant-design/pro-components';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';

import { lookupService } from '../../../services/lookupService';
import type { LookupItem } from '../../../pages/HRManagement/types';
import TableActionButton from '../../../components/common/TableActionButton';
import styles from './ActualPositionTab.module.less';

const { Title } = Typography;

interface JobPositionLevelPageItem extends LookupItem {
  key: React.Key;
  id: number;
  code?: string;
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface JobPositionLevelFormValues {
  code: string;
  name: string;
  label: string;
  value: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface TableParams {
  pagination?: TablePaginationConfig;
}

const JobPositionLevelTab: React.FC = () => {
  const { t } = useTranslation(['organization', 'common']);
  const { message: antdMessage } = App.useApp();
  

  
  const [jobPositionLevels, setJobPositionLevels] = useState<JobPositionLevelPageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLevel, setEditingLevel] = useState<JobPositionLevelPageItem | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [form] = Form.useForm<JobPositionLevelFormValues>();
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 10, total: 0 },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await lookupService.getJobPositionLevelsLookup();
      
      if (response && Array.isArray(response)) {
        const levelsWithKeys = response.map((level: any) => ({
          ...level,
          key: level.id || level.value,
          code: String(level.code || level.value || ''), // 确保code是字符串
        }));
        setJobPositionLevels(levelsWithKeys);
      }
    } catch (error) {
      antdMessage.error(t('admin:auto_text_e88eb7'));
    }
    setIsLoading(false);
  }, [antdMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 创建新职务级别
  const showCreateModal = () => {
    setEditingLevel(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: 0
    });
    setIsModalOpen(true);
  };

  // 编辑职务级别
  const showEditModal = (record: JobPositionLevelPageItem) => {
    setEditingLevel(record);
    form.setFieldsValue({
      code: String(record.code || record.value || ''),
      name: String(record.name || record.label || ''),
      label: String(record.label || record.name || ''),
      value: String(record.value || ''),
      description: String(record.description || ''),
      sort_order: Number(record.sort_order || 0),
      is_active: record.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingLevel(null);
  };

  const handleFormSubmit = async (values: JobPositionLevelFormValues) => {
    setModalLoading(true);
    
    try {
      if (editingLevel) {
        // 更新职务级别
        await lookupService.updateLookupValue(editingLevel.id, {
          code: values.code,
          name: values.name,
          label: values.label,
          value: values.value,
          description: values.description,
          sort_order: values.sort_order,
          is_active: values.is_active
        });
        antdMessage.success(t('admin:auto_text_e69bb4'));
      } else {
        // 创建新职务级别
        // 首先获取JOB_POSITION_LEVEL的lookup_type_id
        const lookupTypeId = await lookupService.getLookupTypeIdByCode('JOB_POSITION_LEVEL');
        if (!lookupTypeId) {
          throw new Error(t('admin:auto_text_e689be'));
        }
        
        await lookupService.createLookupValue({
          lookup_type_id: lookupTypeId,
          code: values.code,
          name: values.name,
          label: values.label,
          value: values.value,
          description: values.description,
          sort_order: values.sort_order,
          is_active: values.is_active
        });
        antdMessage.success(t('admin:auto_text_e5889b'));
      }
      setIsModalOpen(false);
      setEditingLevel(null);
      fetchData();
    } catch (error: any) {
      const errorMsg = error.message || t('admin:auto_text_e6938d');
      antdMessage.error(t('admin:auto__errormsg__e6938d'));
    }
    setModalLoading(false);
  };

  const handleStatusChange = async (newIsActiveState: boolean, record: JobPositionLevelPageItem) => {
    try {
      // 这里需要调用实际的API来更新状态
      // 由于职务级别是lookup_values，需要调用相应的lookup values更新API
      
      // 临时更新本地状态
      const updatedLevels = jobPositionLevels.map(level => 
        level.id === record.id 
          ? { ...level, is_active: newIsActiveState }
          : level
      );
      setJobPositionLevels(updatedLevels);
      
      antdMessage.success(`${newIsActiveState ?      t('admin:auto_text_e590af'): t('admin:auto_text_e7a681')}职务级别成功`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || t('admin:auto_text_e78ab6');
      antdMessage.error(t('admin:auto__errormsg__e78ab6'));
    }
  };

  const handleDeleteLevel = async (id: number) => {
    try {
      await lookupService.deleteLookupValue(id);
      antdMessage.success(t('admin:auto_text_e588a0'));
      fetchData();
    } catch (error: any) {
      const errorMsg = error.message || t('admin:auto_text_e588a0');
      antdMessage.error(t('admin:auto__errormsg__e588a0'));
    }
  };

  const columns: ProColumns<JobPositionLevelPageItem>[] = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      sorter: (a, b) => a.id - b.id,
      valueType: 'digit',
    },
    { 
      title: t('admin:auto_text_e4bba3'), 
      dataIndex: 'code', 
      key: 'code', 
      width: 150,
      sorter: (a, b) => (a.code || '').localeCompare(b.code || ''),
      valueType: 'text',
    },
    { 
      title: t('admin:auto_text_e5908d'), 
      dataIndex: 'name', 
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      valueType: 'text',
      render: (_, record) => (
        <a onClick={() => showEditModal(record)}>{record.name}</a>
      ),
    },
    { 
      title: t('admin:auto_text_e698be'), 
      dataIndex: 'label', 
      key: 'label',
      sorter: (a, b) => (a.label || '').localeCompare(b.label || ''),
      valueType: 'text',
    },
    { 
      title: t('admin:auto_text_e580bc'), 
      dataIndex: 'value', 
      key: 'value', 
      width: 100,
      valueType: 'text',
    },
    { 
      title: t('admin:auto_text_e68f8f'), 
      dataIndex: 'description', 
      key: 'description',
      valueType: 'text',
      ellipsis: true,
    },
    {
      title: t('admin:auto_text_e68e92'),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      valueType: 'digit',
    },
    {
      title: t('admin:auto_text_e78ab6'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      search: false,
      valueType: 'select',
      valueEnum: {
        true: { text: t('admin:auto_text_e6b4bb'), status: 'Success' },
        false: { text: t('admin:auto_text_e99d9e'), status: 'Error' },
      },
      render: (_, record) => (
        <Switch 
          checked={record.is_active} 
          onChange={(checked) => handleStatusChange(checked, record)}
        />
      ),
    },
    {
      title: t('admin:auto_text_e6938d'),
      key: 'actions',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space size="small">
          <TableActionButton 
            actionType="edit"
            tooltipTitle={t('admin:auto_text_e7bc96')}
            onClick={() => showEditModal(record)} 
          />
          <Popconfirm
            title={t('admin:auto_text_e7a1ae')}
            description={`确定要删除职务级别 "${record.name}" 吗？`}
            onConfirm={() => handleDeleteLevel(record.id)}
            okText={t('admin:auto_text_e7a1ae')}
            cancelText={t('admin:auto_text_e58f96')}
          >
            <TableActionButton 
              actionType="delete"
              danger 
              tooltipTitle={t('admin:auto_text_e588a0')}
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
      <OrganizationManagementTableTemplate<JobPositionLevelPageItem>
        pageTitle={t('admin:auto_text_e8818c')}
        addButtonText={t('admin:auto_text_e696b0')}
        onAddClick={showCreateModal}
        columns={columns}
        dataSource={jobPositionLevels}
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
        title={editingLevel ?      t('admin:auto_text_e7bc96'): t('admin:auto_text_e696b0')}
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
              antdMessage.error(t('admin:auto_text_e8a1a8'));
            });
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="jobPositionLevelForm">
          <Form.Item
            name="code"
            label={t('admin:auto_text_e4bba3')}
            rules={[{ required: true, message: t('admin:auto_text_e8afb7') }]}
          >
            <Input placeholder={t('admin:auto__first_level_researcher_e4be8b')} />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('admin:auto_text_e5908d')}
            rules={[{ required: true, message: t('admin:auto_text_e8afb7') }]}
          >
            <Input placeholder={t('admin:auto___e4be8b')} />
          </Form.Item>
          <Form.Item
            name="label"
            label={t('admin:auto_text_e698be')}
            rules={[{ required: true, message: t('admin:auto_text_e8afb7') }]}
          >
            <Input placeholder={t('admin:auto___e4be8b')} />
          </Form.Item>
          <Form.Item
            name="value"
            label={t('admin:auto_text_e580bc')}
            rules={[{ required: true, message: t('admin:auto_text_e8afb7') }]}
          >
            <Input placeholder={t('admin:auto__first_level_researcher_e4be8b')} />
          </Form.Item>
          <Form.Item 
            name="description" 
            label={t('admin:auto_text_e68f8f')}
          >
            <Input.TextArea rows={3} placeholder={t('admin:auto_text_e8818c')} />
          </Form.Item>
          <Form.Item
            name="sort_order"
            label={t('admin:auto_text_e68e92')}
            rules={[{ required: true, message: t('admin:auto_text_e8afb7') }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item
            name="is_active"
            valuePropName="checked"
            label={t('admin:auto_text_e698af')}
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default JobPositionLevelTab; 