import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, message, Progress, Spin, Alert, Space, InputNumber, DatePicker } from 'antd';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../../components/common/EnhancedProTable';
import { PlusOutlined } from '@ant-design/icons';
import TableActionButton from '../../../../components/common/TableActionButton';
import { employeeService } from '../../../../services/employeeService';
import { LeaveType } from '../../types';
import type { LeaveBalanceItem, LeaveBalancePageResult } from '../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface LeaveBalanceTabProps {
  employeeId: string;
}

const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({ employeeId }) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<LeaveBalanceItem | null>(null);
  const [form] = Form.useForm();
  const { hasPermission } = usePermissions();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const fetchLeaveBalances = async (page: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: LeaveBalancePageResult = await employeeService.getEmployeeLeaveBalances(employeeId, { page, pageSize: size });
      setLeaveBalances(result.data.map(item => ({ ...item, balance: item.total_entitlement - item.taken }) ));
      setTotalRecords(result.meta.total || 0);
      setCurrentPage(result.meta.page);
      setPageSize(result.meta.size);
    } catch (err: any) {
      setError(t('hr:auto____e88eb7'));
      message.error(err.response?.data?.message || t('hr:auto___e88eb7'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchLeaveBalances(currentPage, pageSize);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, currentPage, pageSize]);

  const handleAddOrAdjust = (record?: LeaveBalanceItem) => {
    setEditingRecord(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        validity_date: record.validity_date ? dayjs(record.validity_date) : null,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      if (editingRecord) {
        message.success(t('hr:auto____e58187'));
      } else {
        message.success(t('hr:auto____e58187'));
      }
      setIsModalVisible(false);
      fetchLeaveBalances(currentPage, pageSize);
    } catch (errorInfo) {
      message.error(t('hr:auto____e8a1a8'));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleTableChange = (pagination: any) => {
    fetchLeaveBalances(pagination.current, pagination.pageSize);
  };

  const handleRefresh = async () => {
    await fetchLeaveBalances(currentPage, pageSize);
  };

  const columns: ProColumns<LeaveBalanceItem>[] = [
    { 
      title: t('hr:auto_text_e58187'), 
      dataIndex: 'leaveTypeName', 
      key: 'leaveTypeName',
      search: false,
    },
    { 
      title: t('hr:auto_text_e680bb'), 
      dataIndex: 'total_entitlement', 
      key: 'total_entitlement', 
      render: (_, record) => `${record.total_entitlement} ${record.unit}`,
      search: false,
    },
    { 
      title: t('hr:auto_text_e5b7b2'), 
      dataIndex: 'taken', 
      key: 'taken', 
      render: (_, record) => `${record.taken} ${record.unit}`,
      search: false,
    },
    {
      title: t('hr:auto_text_e4bd99'),
      dataIndex: 'balance',
      key: 'balance',
      search: false,
      render: (_, record) => {
        const balance = record.total_entitlement - record.taken;
        const percent = record.total_entitlement > 0 ? (record.taken / record.total_entitlement) * 100 : 0;
        return (
          <Space direction="vertical" style={{width: '100%'}}>
            <span>{`${balance} ${record.unit}`}</span>
            <Progress percent={parseFloat(percent.toFixed(2))} size="small" />
          </Space>
        );
      },
    },
    { 
      title: t('hr:auto_text_e58d95'), 
      dataIndex: 'unit', 
      key: 'unit', 
      hideInTable: true,
      search: false,
    },
    { 
      title: t('hr:auto_text_e5b9b4'), 
      dataIndex: 'year', 
      key: 'year',
      search: false,
    },
    { 
      title: t('hr:auto_text_e69c89'), 
      dataIndex: 'validityDate', 
      key: 'validityDate', 
      render: (_, record) => dayjs(record.validity_date).isValid() ? dayjs(record.validity_date).format('YYYY-MM-DD'): '',
      search: false,
    },
    {
      title: t('hr:auto_text_e6938d'),
      key: 'action',
      fixed: 'right',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space size="middle">
          {hasPermission('leave:adjust_balance') && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => handleAddOrAdjust(record)} 
              tooltipTitle={t('adjust_balance')} 
            />
          )}
        </Space>
      ),
    },
  ];

  if (loading && !leaveBalances.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px'}}>
        <Spin>
          <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>
            加载假期余额中...
          </div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return <Alert message={t('hr:auto_text_e99499')} description={error} type="error" showIcon style={{ margin: '16px 0'}} />;
  }

  return (
    <div>
      <EnhancedProTable<LeaveBalanceItem>
        columns={columns}
        dataSource={leaveBalances}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalRecords,
          showSizeChanger: true,
          onChange: (page: number, size?: number) => {
            setCurrentPage(page);
            setPageSize(size || 10);
            fetchLeaveBalances(page, size || 10);
          },
        }}
        scroll={{ x: 'max-content' }}
        enableAdvancedFeatures={true}
        showToolbar={true}
        search={false}
        title={t('hr:auto_text_e58187')}
        onRefresh={handleRefresh}
        customToolbarButtons={[
          hasPermission('leave:adjust_balance') && (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAddOrAdjust()}
            >
              添加/调整假期余额
            </Button>
          )
        ].filter(Boolean)}
      />
      
      <Modal
        title={editingRecord ? t('hr:auto_text_e8b083') : t('hr:auto_text_e6b7bb')}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={t('hr:auto_text_e4bf9d')}
        cancelText={t('hr:auto_text_e58f96')}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="leaveTypeId" label={t('hr:auto_text_e58187')} rules={[{ required: true, message: t('hr:auto_text_e8afb7') }]}>
            <Select placeholder={t('hr:auto_text_e98089')}>
              {Object.values(LeaveType).map(lt => (
                <Select.Option key={lt} value={lt}>{lt}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="total_entitlement" label={t('hr:auto_text_e680bb')} rules={[{ required: true, message: t('hr:auto_text_e8afb7') }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="taken" label={t('hr:auto_text_e5b7b2')} rules={[{ required: true, message: t('hr:auto_text_e8afb7') }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="unit" label={t('hr:auto_text_e58d95')} rules={[{ required: true, message: t('hr:auto_text_e8afb7') }]}>
            <Select placeholder={t('hr:auto_text_e98089')}>
              <Select.Option value={t('hr:auto_text_e5a4a9')}>天</Select.Option>
              <Select.Option value={t('hr:auto_text_e5b08f')}>小时</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="year" label={t('hr:auto_text_e5b9b4')} rules={[{ required: true, message: t('hr:auto_text_e8afb7') }]}>
            <InputNumber style={{ width: '100%' }} min={2020} max={2030} />
          </Form.Item>
          <Form.Item name="validity_date" label={t('hr:auto_text_e69c89')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveBalanceTab;