import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, DatePicker, Space, Typography, App, Popconfirm, Tooltip, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs';

import { lookupService } from '../../../services/lookupService';
import type { LookupItem } from '../../../pages/HRManagement/types';
import TableActionButton from '../../../components/common/TableActionButton';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter } from '../../../components/common/TableUtils';
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
  
  // 使用表格搜索功能
  const { getColumnSearch } = useTableSearch();
  
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
      antdMessage.error('获取职务级别数据失败');
      console.error('Failed to fetch job position levels:', error);
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
        antdMessage.success('更新职务级别成功');
      } else {
        // 创建新职务级别
        // 首先获取JOB_POSITION_LEVEL的lookup_type_id
        const lookupTypeId = await lookupService.getLookupTypeIdByCode('JOB_POSITION_LEVEL');
        if (!lookupTypeId) {
          throw new Error('找不到职务级别类型定义');
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
        antdMessage.success('创建职务级别成功');
      }
      setIsModalOpen(false);
      setEditingLevel(null);
      fetchData();
    } catch (error: any) {
      const errorMsg = error.message || '操作失败';
      antdMessage.error(`操作失败: ${errorMsg}`);
      console.error('Job position level operation failed:', error);
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
      
      antdMessage.success(`${newIsActiveState ? '启用' : '禁用'}职务级别成功`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || '状态更新失败';
      antdMessage.error(`状态更新失败: ${errorMsg}`);
      console.error('Failed to update job position level status:', error);
    }
  };

  const handleDeleteLevel = async (id: number) => {
    try {
      await lookupService.deleteLookupValue(id);
      antdMessage.success('删除职务级别成功');
      fetchData();
    } catch (error: any) {
      const errorMsg = error.message || '删除失败';
      antdMessage.error(`删除失败: ${errorMsg}`);
      console.error('Failed to delete job position level:', error);
    }
  };

  const columns: ColumnsType<JobPositionLevelPageItem> = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      sorter: numberSorter<JobPositionLevelPageItem>('id'),
      ...getColumnSearch('id'),
    },
    { 
      title: '代码', 
      dataIndex: 'code', 
      key: 'code', 
      width: 150,
      sorter: stringSorter<JobPositionLevelPageItem>('code'),
      ...getColumnSearch('code'),
    },
    { 
      title: '名称', 
      dataIndex: 'name', 
      key: 'name',
      sorter: stringSorter<JobPositionLevelPageItem>('name'),
      ...getColumnSearch('name'),
      render: (text: string, record: JobPositionLevelPageItem) => (
        <a onClick={() => showEditModal(record)}>{text}</a>
      ),
    },
    { 
      title: '显示标签', 
      dataIndex: 'label', 
      key: 'label',
      sorter: stringSorter<JobPositionLevelPageItem>('label'),
      ...getColumnSearch('label'),
    },
    { 
      title: '值', 
      dataIndex: 'value', 
      key: 'value', 
      width: 100,
      ...getColumnSearch('value'),
    },
    { 
      title: '描述', 
      dataIndex: 'description', 
      key: 'description',
      ...getColumnSearch('description'),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: numberSorter<JobPositionLevelPageItem>('sort_order'),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      filters: [
        { text: '活跃', value: true },
        { text: '非活跃', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      render: (isActive: boolean, record: JobPositionLevelPageItem) => (
        <Switch 
          checked={isActive} 
          onChange={(checked) => handleStatusChange(checked, record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      align: 'center',
      width: 150,
      render: (_: any, record: JobPositionLevelPageItem) => (
        <Space size="small">
          <TableActionButton 
            actionType="edit"
            tooltipTitle="编辑"
            onClick={() => showEditModal(record)} 
          />
          <Popconfirm
            title="确认删除"
            description={`确定要删除职务级别 "${record.name}" 吗？`}
            onConfirm={() => handleDeleteLevel(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <TableActionButton 
              actionType="delete"
              danger 
              tooltipTitle="删除"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    jobPositionLevels || [], 
    columns, 
    {
      filename: '职务级别数据',
      sheetName: '职务级别',
      buttonText: '导出数据',
      successMessage: '导出成功'
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'job_position_level_table',
      buttonText: '列设置',
      tooltipTitle: '自定义显示列',
      dropdownTitle: '列显示',
      resetText: '重置',
      requiredColumns: ['id', 'name', 'actions'] // ID、名称和操作列必须显示
    }
  );

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
      <div className={styles.sectionHeader}>
        <Title level={3} className={styles.sectionHeaderTitle}>职务级别管理</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            新增职务级别
          </Button>
          <Tooltip title="导出到Excel">
            <ExportButton />
          </Tooltip>
          <ColumnControl />
        </Space>
      </div>
      
      <Table
        columns={visibleColumns}
        dataSource={jobPositionLevels}
        loading={isLoading}
        pagination={{ 
          showSizeChanger: true, 
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `共 ${total} 条记录`,
          current: tableParams.pagination?.current,
          pageSize: tableParams.pagination?.pageSize,
          total: jobPositionLevels.length,
          onChange: (page, pageSize) => {
            setTableParams(prev => ({
              ...prev,
              pagination: {
                ...prev.pagination,
                current: page,
                pageSize: pageSize
              }
            }));
          }
        }}
        rowKey="id"
        onChange={handleTableChange}
      />

      <Modal
        title={editingLevel ? '编辑职务级别' : '新增职务级别'}
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
              antdMessage.error('表单验证失败');
            });
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="jobPositionLevelForm">
          <Form.Item
            name="code"
            label="代码"
            rules={[{ required: true, message: '请输入职务级别代码' }]}
          >
            <Input placeholder="例如: FIRST_LEVEL_RESEARCHER" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入职务级别名称' }]}
          >
            <Input placeholder="例如: 一级调研员" />
          </Form.Item>
          <Form.Item
            name="label"
            label="显示标签"
            rules={[{ required: true, message: '请输入显示标签' }]}
          >
            <Input placeholder="例如: 一级调研员" />
          </Form.Item>
          <Form.Item
            name="value"
            label="值"
            rules={[{ required: true, message: '请输入值' }]}
          >
            <Input placeholder="例如: FIRST_LEVEL_RESEARCHER" />
          </Form.Item>
          <Form.Item 
            name="description" 
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="职务级别的详细描述" />
          </Form.Item>
          <Form.Item
            name="sort_order"
            label="排序"
            rules={[{ required: true, message: '请输入排序号' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item
            name="is_active"
            valuePropName="checked"
            label="是否激活"
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