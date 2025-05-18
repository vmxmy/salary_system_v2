import React, { useEffect, useState, useCallback } from 'react';
import { Table, Spin, Alert, Typography, Button, Tag, Tooltip, Breadcrumb } from 'antd';
import { EyeOutlined, HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getPayrollEntries } from '../Payroll/services/payrollApi';
import PayrollEntryDetailModal from '../Payroll/components/PayrollEntryDetailModal';
import type { PayrollEntry, ApiListMeta } from '../Payroll/types/payrollTypes';
import type { ColumnsType } from 'antd/es/table';
import { getPayrollEntryStatusDisplay } from '../Payroll/utils/payrollUtils';

const { Title } = Typography;

const MyPayslipsPage: React.FC = () => {
  const { t, ready } = useTranslation(['common', 'myPayslips']);
  const currentUser = useAuthStore(state => state.currentUser);
  const [payslips, setPayslips] = useState<PayrollEntry[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);

  const fetchPayslips = useCallback(async (page = 1, pageSize = 10) => {
    if (!currentUser?.employee_id) {
      setError(t('myPayslips:noEmployeeIdError'));
      setLoading(false);
      setPayslips([]);
      setMeta(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollEntries({
        employee_id: currentUser.employee_id,
        page,
        size: pageSize,
        sort_by: 'id',
        sort_order: 'desc',
      });
      setPayslips(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Error fetching payslips:', err);
      setError(t('myPayslips:fetchError'));
      setPayslips([]);
      setMeta(null);
    }
    setLoading(false);
  }, [currentUser, t]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleViewDetails = (entry: PayrollEntry) => {
    setCurrentEntryId(entry.id);
    setIsDetailModalVisible(true);
  };

  const columns: ColumnsType<PayrollEntry> = [
    {
      title: t('myPayslips:column.payrollPeriod'),
      dataIndex: ['payroll_run', 'payroll_period', 'name'],
      key: 'payrollPeriodName',
      render: (name, record) => name || `${t('myPayslips:periodIdPrefix')}${record.payroll_run?.payroll_period_id || 'N/A'}`,
    },
    {
      title: t('myPayslips:column.runDate'),
      dataIndex: ['payroll_run', 'run_date'],
      key: 'runDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: t('myPayslips:column.netPay'),
      dataIndex: 'net_pay',
      key: 'netPay',
      render: (amount) => amount?.toFixed(2) || '0.00',
    },
    {
      title: t('myPayslips:column.paymentDate'),
      dataIndex: ['payroll_run', 'paid_at'],
      key: 'paymentDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : t('myPayslips:status.pendingPayment'),
    },
    {
      title: t('myPayslips:column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      render: (statusId) => {
        const statusInfo = getPayrollEntryStatusDisplay(statusId);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: t('myPayslips:column.actions'),
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('myPayslips:actions.viewDetails')}>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
        </Tooltip>
      ),
    },
  ];

  const breadcrumbItems = [
    { key: 'home', href: '/', title: <HomeOutlined /> },
    { key: 'my-payslips', title: t('myPayslips:title') },
  ];

  if (!ready || (loading && !payslips.length)) {
    return <Spin tip={t('common:loading')} style={{ display: 'block', marginTop: '50px' }}><div style={{ padding: 50 }} /></Spin>;
  }

  if (error && !payslips.length) {
    return <Alert message={t('common:error.genericTitle')} description={error} type="error" showIcon style={{ margin: '20px' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        {breadcrumbItems.map(item => (
          <Breadcrumb.Item key={item.key}>
            {item.href ? <Link to={item.href}>{item.title}</Link> : item.title}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
      <Title level={2} style={{ marginBottom: '24px' }}>{t('myPayslips:title')}</Title>
      {error && payslips.length > 0 && (
         <Alert message={t('common:error.genericTitle')} description={error} type="warning" showIcon closable style={{ marginBottom: '20px' }} />
      )}
      <Table
        columns={columns}
        dataSource={payslips}
        rowKey="id"
        loading={loading}
        pagination={meta && meta.totalPages > 1 ? {
          current: meta.page,
          pageSize: meta.size,
          total: meta.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) =>
            `${t('common:pagination.totalRecords', { count: total })} (${t('common:pagination.showingRange', { start: range[0], end: range[1] })})`,
          onChange: fetchPayslips,
        }: false}
        scroll={{ x: 'max-content' }}
      />
      <PayrollEntryDetailModal
        entryId={currentEntryId}
        visible={isDetailModalVisible}
        onClose={() => {
          setIsDetailModalVisible(false);
          setCurrentEntryId(null);
        }}
      />
    </div>
  );
};

export default MyPayslipsPage;