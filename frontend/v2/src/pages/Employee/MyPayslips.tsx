import React, { useEffect, useState, useCallback } from 'react';
import { Table, Spin, Alert, Typography, Button, Tag, Tooltip, Breadcrumb, Space, Input } from 'antd';
import { EyeOutlined, HomeOutlined, SearchOutlined } from '@ant-design/icons';
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
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder={`搜索${t('myPayslips:column.payrollPeriod')}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
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
      render: (name, record) => name || `${t('myPayslips:periodIdPrefix')}${record.payroll_run?.payroll_period_id || 'N/A'}`,
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
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
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
      render: (amount) => amount?.toFixed(2) || '0.00',
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

  const breadcrumbItems = [
    { key: 'home', href: '/', title: <HomeOutlined /> },
    { key: 'my-payslips', title: t('myPayslips:title') },
  ];

  if (!ready || (loading && !payslips.length)) {
    return <Spin tip={t('common:loading.generic_loading_text')} style={{ display: 'block', marginTop: '50px' }}><div style={{ padding: 50 }} /></Spin>;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>{t('myPayslips:title')}</Title>
        <Space>
          <Tooltip title={t('myPayslips:export.tooltipTitle', '导出工资单到Excel')}>
            <ExportButton />
          </Tooltip>
          <ColumnControl />
        </Space>
      </div>
      {error && payslips.length > 0 && (
         <Alert message={t('common:error.genericTitle')} description={error} type="warning" showIcon closable style={{ marginBottom: '20px' }} />
      )}
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