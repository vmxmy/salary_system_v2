import React, { useEffect, useState, useCallback } from 'react';
import { Spin, Alert, Typography, Button, Tag, Tooltip, Space } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { getPayrollEntries } from '../Payroll/services/payrollApi';
import PayrollEntryDetailModal from '../Payroll/components/PayrollEntryDetailModal';
import type { PayrollEntry, ApiListMeta } from '../Payroll/types/payrollTypes';
import type { ProColumns } from '@ant-design/pro-components';
import { getPayrollEntryStatusInfo } from '../Payroll/utils/payrollUtils';
import EmployeeName from '../../components/common/EmployeeName';
import PageLayout from '../../components/common/PageLayout';
import EnhancedProTable from '../../components/common/EnhancedProTable';
import styles from './MyPayslips.module.less';

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

  // 刷新数据函数
  const handleRefresh = async () => {
    await fetchPayslips();
  };

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
        include_employee_details: true,
        include_payroll_period: true,
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

  const columns: ProColumns<PayrollEntry>[] = [
    {
      title: t('myPayslips:column.payrollPeriod'),
      dataIndex: 'payroll_run',
      key: 'payrollPeriodName',
      sorter: (a, b) => {
        const aName = a.payroll_run?.payroll_period?.name || '';
        const bName = b.payroll_run?.payroll_period?.name || '';
        return aName.localeCompare(bName);
      },
      valueType: 'text',
      render: (_, record) => {
        const periodName = record.payroll_run?.payroll_period?.name;
        const periodId = record.payroll_run?.payroll_period_id;
        
        if (periodName) {
          return periodName;
        }
        
        if (periodId) {
          return `${t('myPayslips:periodIdPrefix')}${periodId}`;
        }
        
        return '-';
      },
    },
    {
      title: t('myPayslips:column.runDate'),
      dataIndex: ['payroll_run', 'run_date'],
      key: 'runDate',
      sorter: (a, b) => {
        const aDate = a.payroll_run?.run_date ? new Date(a.payroll_run.run_date).getTime() : 0;
        const bDate = b.payroll_run?.run_date ? new Date(b.payroll_run.run_date).getTime() : 0;
        return aDate - bDate;
      },
      valueType: 'date',
      render: (_, record) => {
        const date = record.payroll_run?.run_date;
        return date ? new Date(date).toLocaleDateString() : '';
      },
    },
    {
      title: t('myPayslips:column.employeeName'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      valueType: 'text',
      render: (_, record) => (
        <EmployeeName
          employeeId={record.employee_id}
          employeeName={record.employee_name}
          showId={false}
          showLoading={true}
          className="payroll-entry-employee-name"
        />
      ),
    },
    {
      title: t('myPayslips:column.netPay'),
      dataIndex: 'net_pay',
      key: 'netPay',
      sorter: (a, b) => (a.net_pay || 0) - (b.net_pay || 0),
      valueType: 'money',
      render: (_, record) => {
        const amount = record.net_pay;
        const numValue = typeof amount === 'number' ? amount : Number(amount);
        return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
      }
    },
    {
      title: t('myPayslips:column.paymentDate'),
      dataIndex: ['payroll_run', 'paid_at'],
      key: 'paymentDate',
      sorter: (a, b) => {
        const aDate = a.payroll_run?.paid_at ? new Date(a.payroll_run.paid_at).getTime() : 0;
        const bDate = b.payroll_run?.paid_at ? new Date(b.payroll_run.paid_at).getTime() : 0;
        return aDate - bDate;
      },
      valueType: 'date',
      render: (_, record) => {
        const date = record.payroll_run?.paid_at;
        return date ? new Date(date).toLocaleDateString() : t('myPayslips:status.pendingPayment');
      },
    },
    {
      title: t('myPayslips:column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: t('myPayslips:status.draft'), status: 'Default' },
        2: { text: t('myPayslips:status.finalized'), status: 'Processing' },
        3: { text: t('myPayslips:status.pendingPayment'), status: 'Warning' },
        4: { text: t('myPayslips:status.paid'), status: 'Success' },
      },
      render: (_, record) => {
        const statusInfo = getPayrollEntryStatusInfo(record.status_lookup_value_id);
        return <Tag color={statusInfo.color}>{t(`payroll:${statusInfo.key}`, statusInfo.params)}</Tag>;
      },
    },
    {
      title: t('myPayslips:column.actions'),
      key: 'actions',
      valueType: 'option',
      render: (_, record) => (
        <Tooltip title={t('myPayslips:actions.viewDetails')}>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
        </Tooltip>
      ),
    },
  ];

  if (!ready || (loading && !payslips.length)) {
    return <Spin tip={t('common:loading.generic_loading_text')} className={styles.loadingSpin}><div className={styles.loadingSpinContent} /></Spin>;
  }

  if (error && !payslips.length) {
    return <Alert message={t('common:error.genericTitle')} description={error} type="error" showIcon className={styles.errorAlert} />;
  }

  return (
    <PageLayout
      title={t('myPayslips:title')}
    >
      {error && payslips.length > 0 && (
         <Alert message={t('common:error.genericTitle')} description={error} type="warning" showIcon closable className={styles.warningAlert} />
      )}
      <div className={styles.tableContainer}>
        <EnhancedProTable<PayrollEntry>
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
            showTotal: (total: number, range: [number, number]) =>
              `${t('common:pagination.totalRecords', { count: total })} (${t('common:pagination.showingRange', { start: range[0], end: range[1] })})`,
            onChange: fetchPayslips,
          } : false}
          scroll={{ x: 'max-content' }}
          enableAdvancedFeatures={true}
          showToolbar={true}
          search={false}
          title={t('myPayslips:title')}
          onRefresh={handleRefresh}
        />
      </div>
      <PayrollEntryDetailModal
        entryId={currentEntryId}
        visible={isDetailModalVisible}
        onClose={() => {
          setIsDetailModalVisible(false);
          setCurrentEntryId(null);
        }}
      />
    </PageLayout>
  );
};

export default MyPayslipsPage;