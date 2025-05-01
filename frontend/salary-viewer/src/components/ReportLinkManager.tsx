import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, InputNumber, Space, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import reportLinksApi from '../services/reportLinksApi';

const { Option } = Select;

const ReportLinkManager: React.FC = () => {
  const { t } = useTranslation();
  const [reportLinks, setReportLinks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 加载报表链接
  const loadReportLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, total } = await reportLinksApi.getReportLinks({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize
      });
      setReportLinks(data);
      setTotal(total);
    } catch (error) {
      console.error('Error loading report links:', error);
      message.error(t('reportLinks.loadError'));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, t]);

  // 首次加载
  useEffect(() => {
    loadReportLinks();
  }, [loadReportLinks]);

  // 打开创建模态框
  const showCreateModal = () => {
    setModalTitle(t('reportLinks.create'));
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑模态框
  const showEditModal = (record: any) => {
    setModalTitle(t('reportLinks.edit'));
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 保存报表链接
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRecord) {
        // 更新
        await reportLinksApi.updateReportLink(editingRecord.id, values);
        message.success(t('reportLinks.updateSuccess'));
      } else {
        // 创建
        await reportLinksApi.createReportLink(values);
        message.success(t('reportLinks.createSuccess'));
      }
      
      setModalVisible(false);
      loadReportLinks();
    } catch (error) {
      console.error('Error saving report link:', error);
      message.error(t('reportLinks.saveError'));
    }
  };

  // 删除报表链接
  const handleDelete = async (id: number) => {
    try {
      await reportLinksApi.deleteReportLink(id);
      message.success(t('reportLinks.deleteSuccess'));
      loadReportLinks();
    } catch (error) {
      console.error('Error deleting report link:', error);
      message.error(t('reportLinks.deleteError'));
    }
  };

  // 处理表格分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  // 测试报表链接
  const testReportLink = (url: string) => {
    window.open(url, '_blank');
  };

  const columns = [
    {
      title: t('reportLinks.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('reportLinks.url'),
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
    },
    {
      title: t('reportLinks.category'),
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: t('reportLinks.displayOrder'),
      dataIndex: 'display_order',
      key: 'display_order',
      sorter: (a: any, b: any) => a.display_order - b.display_order,
    },
    {
      title: t('reportLinks.isActive'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (isActive ? t('common.yes') : t('common.no')),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)} 
            size="small"
          />
          <Button 
            onClick={() => testReportLink(record.url)} 
            size="small"
          >
            {t('reportLinks.test')}
          </Button>
          <Popconfirm
            title={t('reportLinks.confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="report-link-manager">
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showCreateModal}
        >
          {t('reportLinks.addNew')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={reportLinks}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showTotal: (total) => t('common.totalItems', { total }),
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label={t('reportLinks.name')}
            rules={[{ required: true, message: t('reportLinks.nameRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="url"
            label={t('reportLinks.url')}
            rules={[{ required: true, message: t('reportLinks.urlRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('reportLinks.description')}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="category"
            label={t('reportLinks.category')}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="require_role"
            label={t('reportLinks.requireRole')}
          >
            <Select allowClear>
              <Option value="Super Admin">Super Admin</Option>
              <Option value="Data Admin">Data Admin</Option>
              <Option value="Report Viewer">Report Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="display_order"
            label={t('reportLinks.displayOrder')}
            initialValue={0}
          >
            <InputNumber min={0} />
          </Form.Item>

          <Form.Item
            name="is_active"
            label={t('reportLinks.isActive')}
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportLinkManager; 