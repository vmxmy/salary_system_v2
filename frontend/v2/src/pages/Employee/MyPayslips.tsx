import React, { useEffect, useState, useCallback } from 'react';
import { Table, Spin, Alert, Typography, Button, Tag, Tooltip, Breadcrumb, Space, Input, DatePicker, Select } from 'antd';
import { EyeOutlined, HomeOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getPayrollEntries } from '../Payroll/services/payrollApi';
import PayrollEntryDetailModal from '../Payroll/components/PayrollEntryDetailModal';
import type { PayrollEntry, ApiListMeta } from '../Payroll/types/payrollTypes';
import type { ColumnsType } from 'antd/es/table';
import { getPayrollEntryStatusInfo } from '../Payroll/utils/payrollUtils';
import EmployeeName from '../../components/common/EmployeeName';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../components/common/TableUtils';
import PageLayout from '../../components/common/PageLayout';
import styles from './MyPayslips.module.less';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const MyPayslipsPage: React.FC = () => {
  const { t, ready } = useTranslation(['common', 'myPayslips']);
  const currentUser = useAuthStore(state => state.currentUser);
  const [payslips, setPayslips] = useState<PayrollEntry[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  
  // 使用表格搜索功能
  const { getColumnSearch } = useTableSearch();

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

  const columns: ColumnsType<PayrollEntry> = [
    {
      title: t('myPayslips:column.payrollPeriod'),
      dataIndex: 'payroll_run',
      key: 'payrollPeriodName',
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div className={styles.filterDropdown} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder={`搜索${t('myPayslips:column.payrollPeriod')}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            className={styles.filterInput}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              className={styles.filterButton}
            >
              搜索
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              className={styles.filterButton}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const periodName = record.payroll_run?.payroll_period?.name || '';
        return periodName.toLowerCase().includes((value as string).toLowerCase());
      },
      render: (payrollRun, record) => {
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
      render: (date) => date ? new Date(date).toLocaleDateString() : '',
    },
    {
      title: t('myPayslips:column.employeeName'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      ...getColumnSearch('employee_name'),
      render: (name, record) => (
        <EmployeeName
          employeeId={record.employee_id}
          employeeName={name}
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
      render: (amount) => {
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
      render: (date) => date ? new Date(date).toLocaleDateString() : t('myPayslips:status.pendingPayment'),
    },
    {
      title: t('myPayslips:column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      filters: [
        { text: t('myPayslips:status.draft'), value: 1 },
        { text: t('myPayslips:status.finalized'), value: 2 },
        { text: t('myPayslips:status.pendingPayment'), value: 3 },
        { text: t('myPayslips:status.paid'), value: 4 },
      ],
      onFilter: (value, record) => record.status_lookup_value_id === value,
      render: (statusId) => {
        const statusInfo = getPayrollEntryStatusInfo(statusId);
        return <Tag color={statusInfo.color}>{t(`payroll:${statusInfo.key}`, statusInfo.params)}</Tag>;
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
  
  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    payslips || [], 
    columns, 
    {
      filename: t('myPayslips:export.filename'),
      sheetName: t('myPayslips:export.sheetName'),
      buttonText: t('myPayslips:export.buttonText', '导出工资单'),
      successMessage: t('myPayslips:export.successMessage', '工资单导出成功')
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'my_payslips_table',
      buttonText: t('myPayslips:columnControl.buttonText', '列设置'),
      tooltipTitle: t('myPayslips:columnControl.tooltipTitle', '自定义显示列'),
      dropdownTitle: t('myPayslips:columnControl.dropdownTitle', '列显示'),
      resetText: t('myPayslips:columnControl.resetText', '重置'),
      requiredColumns: ['payrollPeriodName', 'netPay', 'actions'] // 工资条名称、金额和操作列必须显示
    }
  );



  if (!ready || (loading && !payslips.length)) {
    return <Spin tip={t('common:loading.generic_loading_text')} className={styles.loadingSpin}><div className={styles.loadingSpinContent} /></Spin>;
  }

  if (error && !payslips.length) {
    return <Alert message={t('common:error.genericTitle')} description={error} type="error" showIcon className={styles.errorAlert} />;
  }

  return (
    <PageLayout
      title={t('myPayslips:title')}
      actions={
        <Space>
          <Tooltip title={t('myPayslips:export.tooltipTitle', '导出工资单到Excel')}>
            <ExportButton />
          </Tooltip>
          <ColumnControl />
        </Space>
      }
    >
      {error && payslips.length > 0 && (
         <Alert message={t('common:error.genericTitle')} description={error} type="warning" showIcon closable className={styles.warningAlert} />
      )}
      <div className={styles.tableContainer}>
        <Table
        columns={visibleColumns}
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
        scroll={{ x: 'max-content'         }}
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