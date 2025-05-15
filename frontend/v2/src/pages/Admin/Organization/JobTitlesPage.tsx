import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, DatePicker, Space, Typography, message, Popconfirm, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { format } from 'date-fns';
import dayjs from 'dayjs'; // For DatePicker default values

import { getJobTitles, createJobTitle, updateJobTitle, deleteJobTitle, getAllJobTitlesFlat } from '../../../api/jobTitles';
import type { GetJobTitlesApiParams } from '../../../api/jobTitles'; // Import new API params type
import type { JobTitle, CreateJobTitlePayload, UpdateJobTitlePayload } from '../../../api/types';
import type { TableParams } from '../../../types/antd'; // Reusing TableParams

const { Title } = Typography;
const { TreeNode } = TreeSelect;

interface JobTitlePageItem extends JobTitle {
  key: React.Key;
  children?: JobTitlePageItem[];
}

// Helper function to convert flat list to tree structure for AntD Table/TreeSelect
const buildTreeData = (jobTitles: JobTitle[], parentId: number | null = null): JobTitlePageItem[] => {
  // 统一用 number/null 进行父子关系判断，避免字符串比较导致的类型问题
  const filtered = jobTitles.filter(jt => {
    const jtParentIdNum = jt.parent_job_title_id === undefined || jt.parent_job_title_id === null
      ? null
      : Number(jt.parent_job_title_id);
    const isMatch = jtParentIdNum === parentId;
    console.log(`Comparing jt.parent_job_title_id=${jtParentIdNum} with parentId=${parentId}, isMatch=${isMatch}`);
    return isMatch;
  });

  console.log(`Building tree data for parentId: ${parentId}, matching items:`, filtered.length);
  console.log('jobTitles:', jobTitles);
  console.log('parentId:', parentId);
  console.log('filtered jobTitles:', filtered);

  return filtered.map(jt => {
    const children = buildTreeData(jobTitles, jt.id);
    console.log(`Item ${jt.id} (${jt.name}) has ${children.length} children`);

    return {
      ...jt,
      key: jt.id,
      title: jt.name, // For TreeSelect
      value: jt.id,   // For TreeSelect
      children: children, // 始终设置为数组，即使是空数组
    };
  });
};

interface JobTitleFormValues extends Omit<CreateJobTitlePayload, 'effective_date' | 'end_date' | 'is_active'> {
  effective_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs | null;
  is_active?: boolean; // Kept optional here, will be defaulted in form/payload
}

const JobTitlesPage: React.FC = () => {
  const [jobTitles, setJobTitles] = useState<JobTitlePageItem[]>([]);
  const [jobTitlesTree, setJobTitlesTree] = useState<JobTitlePageItem[]>([]);
  const [allFlatJobTitles, setAllFlatJobTitles] = useState<JobTitle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 10, total: 0 },
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitlePageItem | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [form] = Form.useForm<JobTitleFormValues>();

  const fetchAllFlatJobTitles = useCallback(async () => {
    try {
      const allJobTitles = await getAllJobTitlesFlat();
      setAllFlatJobTitles(allJobTitles);
    } catch (error) {
      console.error('Failed to fetch all flat job titles:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 获取所有职位数据，用于构建树形结构
      // 添加非空的search参数，确保获取所有职位，而不仅仅是顶级职位
      const response = await getJobTitles({
        is_active: true,
        search: '', // 现在直接传空字符串即可获取所有职位，符合新接口逻辑
      });

      console.log('API Response (raw):', response);
      console.log('API Response Data:', response.data);
      if (response.data.length > 0) {
        console.log('API Response Data[0]:', response.data[0]);
        console.log('parent_job_title_id in Data[0]:', response.data[0].parent_job_title_id);
      }

      // 检查并修复数据格式
      const fixedData = response.data.map(item => {
        const itemCopy = { ...item };
        // 如果parent_job_title_id是字符串，尝试转换为数字
        if (typeof itemCopy.parent_job_title_id === 'string') {
          const parentIdStr = itemCopy.parent_job_title_id as string;
          // 如果包含逗号，取第一个数字
          if (parentIdStr.includes(',')) {
            const firstNumber = parentIdStr.split(',')[0].trim();
            console.log(`Converting parent_job_title_id from "${parentIdStr}" to ${firstNumber}`);
            itemCopy.parent_job_title_id = parseInt(firstNumber, 10);
          } else {
            console.log(`Converting parent_job_title_id from "${parentIdStr}" to ${parseInt(parentIdStr, 10)}`);
            itemCopy.parent_job_title_id = parseInt(parentIdStr, 10);
          }
        }
        return itemCopy;
      });

      console.log('Fixed Data:', fixedData);

      // 更新平面列表，用于表单选择器
      setAllFlatJobTitles(fixedData);

      // 构建树形结构数据
      const treeData = buildTreeData(fixedData);
      console.log('Tree Data:', treeData);

      setJobTitlesTree(treeData);
      setJobTitles(treeData);

      // 不再 setTableParams，彻底断开死循环
    } catch (error) {
      message.error('获取职位列表失败');
      console.error('Failed to fetch job titles:', error);
    }
    setIsLoading(false);
  }, []); // 移除依赖，避免循环

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
    setEditingJobTitle(null);
    form.resetFields();
    form.setFieldsValue({
        is_active: true,
        effective_date: dayjs() // Default effective_date to today for new entries
     });
    setIsModalOpen(true);
  };

  // 创建子职位的模态框
  const showCreateChildModal = (parentId: number) => {
    setEditingJobTitle(null);
    form.resetFields();
    form.setFieldsValue({
        is_active: true,
        effective_date: dayjs(), // Default effective_date to today for new entries
        parent_job_title_id: parentId // 设置父职位ID
     });
    setIsModalOpen(true);
  };

  const showEditModal = (record: JobTitlePageItem) => {
    setEditingJobTitle(record);
    form.setFieldsValue({
      ...record, // Spread first to get code, name, description, is_active
      effective_date: dayjs(record.effective_date),
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingJobTitle(null);
  };

  const handleFormSubmit = async (values: JobTitleFormValues) => {
    setModalLoading(true);
    const payload: CreateJobTitlePayload = {
      code: values.code,
      name: values.name,
      description: values.description === undefined ? null : values.description,
      parent_job_title_id: values.parent_job_title_id || null,
      effective_date: values.effective_date.format('YYYY-MM-DD'),
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      is_active: values.is_active === undefined ? true : values.is_active,
    };

    try {
      if (editingJobTitle) {
        await updateJobTitle(editingJobTitle.id, payload as UpdateJobTitlePayload); // Cast for update
        message.success('职位更新成功');
      } else {
        await createJobTitle(payload);
        message.success('职位创建成功');
      }
      setIsModalOpen(false);
      setEditingJobTitle(null);
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || '未知错误';
      message.error(`操作失败: ${errorMsg}`);
      console.error('Job title operation failed:', error.response?.data || error);
    }
    setModalLoading(false);
  };

  const handleDeleteJobTitle = async (id: number) => {
    try {
      await deleteJobTitle(id);
      message.success('职位删除成功');
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || '职位可能正在使用中';
      message.error(`删除失败: ${errorMsg}`);
      console.error('Failed to delete job title:', error.response?.data || error);
    }
  };

  // 创建测试数据的函数
  const createTestData = async () => {
    try {
      // 创建一个顶级职位
      const parentPayload: CreateJobTitlePayload = {
        code: 'TEST-PARENT',
        name: '测试父职位',
        description: '测试父职位描述',
        effective_date: dayjs().format('YYYY-MM-DD'),
        is_active: true,
      };
      const parentResponse = await createJobTitle(parentPayload);
      const parentId = parentResponse.data.id;

      // 创建一个子职位
      const childPayload: CreateJobTitlePayload = {
        code: 'TEST-CHILD',
        name: '测试子职位',
        description: '测试子职位描述',
        parent_job_title_id: parentId,
        effective_date: dayjs().format('YYYY-MM-DD'),
        is_active: true,
      };
      await createJobTitle(childPayload);

      message.success('测试数据创建成功');
      fetchData(); // 重新获取数据
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail?.details || error.response?.data?.detail || error.message || '未知错误';
      message.error(`测试数据创建失败: ${errorMsg}`);
      console.error('Failed to create test data:', error);
    }
  };

  const columns: ColumnsType<JobTitlePageItem> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '代码', dataIndex: 'code', key: 'code', width: 150 },
    { title: '名称', dataIndex: 'name', key: 'name' }, // 树形结构将基于此列
    { title: '上级职位ID', dataIndex: 'parent_job_title_id', key: 'parent_job_title_id', width: 120, render: (id) => id || '-' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (text) => text || '-' },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      render: (text: string) => text ? format(new Date(text), 'yyyy-MM-dd') : '-',
    },
    {
      title: '失效日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (text?: string | null) => text ? format(new Date(text), 'yyyy-MM-dd') : '-',
    },
    {
      title: '激活',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => <Switch checked={isActive} disabled />,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: JobTitlePageItem) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          <Button icon={<PlusOutlined />} onClick={() => showCreateChildModal(record.id)} title="添加子职位" />
          <Popconfirm
            title="确定删除此职位吗？"
            onConfirm={() => handleDeleteJobTitle(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>职位管理</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          新建顶级职位
        </Button>
        <Button onClick={createTestData}>
          创建测试数据
        </Button>
        <Button onClick={() => {
          console.log('Current jobTitles:', jobTitles);
          console.log('Current allFlatJobTitles:', allFlatJobTitles);
          message.info('数据已打印到控制台');
        }}>
          调试数据
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={jobTitles}
        loading={isLoading}
        pagination={false}
        onChange={handleTableChange}
        rowKey="key"
        expandable={{
          defaultExpandAllRows: true,
          childrenColumnName: 'children',
          expandRowByClick: true, // 点击行时展开/折叠
          indentSize: 20, // 缩进大小
        }}
        bordered
      />
      <Modal
        title={editingJobTitle ? '编辑职位' : '新建职位'}
        open={isModalOpen}
        onCancel={handleCancelModal}
        onOk={() => form.submit()}
        confirmLoading={modalLoading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="jobTitleForm" onFinish={handleFormSubmit}>
          <Form.Item name="code" label="职位代码" rules={[{ required: true, message: '请输入职位代码' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="parent_job_title_id" label="上级职位">
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 400, overflow: 'auto' } } }}
              placeholder="选择上级职位 (留空则为顶级职位)"
              allowClear
              treeDefaultExpandAll
              treeData={buildTreeData(allFlatJobTitles)}
              notFoundContent={<div style={{ padding: '8px 12px', color: '#999' }}>暂无职位数据</div>}
              filterTreeNode={(inputValue, treeNode) =>
                treeNode?.title?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
              virtual={false}
            />
          </Form.Item>
          <Form.Item
            name="effective_date"
            label="生效日期"
            rules={[{ required: true, message: '请选择生效日期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="end_date" label="失效日期">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="是否激活"
            valuePropName="checked"
            initialValue={true} // Default is_active in form to true
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JobTitlesPage;