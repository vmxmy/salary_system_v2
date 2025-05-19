import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Alert,
  Spin,
  Space,
  // Modal, // For future edit/view detail modal
  // Form,  // For future edit form
  message,
  Tooltip,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ActionButton from '../../../components/common/ActionButton';
import type { ColumnsType } from 'antd/es/table';

import type { PayrollEntry, ApiListMeta } from '../types/payrollTypes';
import { getPayrollEntries /*, updatePayrollEntryDetails */ } from '../services/payrollApi';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { getPayrollEntryStatusDisplay } from '../utils/payrollUtils'; // Import utility
import {
  P_PAYROLL_ENTRY_VIEW,
  P_PAYROLL_ENTRY_EDIT_DETAILS
} from '../constants/payrollPermissions'; // Import permissions
import PayrollEntryDetailModal from './PayrollEntryDetailModal'; // Uncommented and imported
// import PayrollEntryEditForm from './PayrollEntryEditForm'; // To be created later

interface PayrollEntriesTableProps {
  payrollRunId: number;
}

const PayrollEntriesTable: React.FC<PayrollEntriesTableProps> = ({ payrollRunId }) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for modals
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false); // Uncommented
  // const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null); // Using entryId
  // const [form] = Form.useForm();

  const fetchEntries = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollEntries({ 
        payroll_run_id: payrollRunId, 
        page, 
        size: pageSize,
        sort_by: 'employee_id', // Default sort
        sort_order: 'asc',
      });
      setEntries(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || t('payroll_entries_table.error_fetch'));
      setEntries([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [payrollRunId, t]);

  useEffect(() => {
    if (payrollRunId) {
      fetchEntries();
    }
  }, [payrollRunId, fetchEntries]);

  const handleViewEntryDetails = (entry: PayrollEntry) => {
    setCurrentEntryId(entry.id); // Set the ID of the entry to view
    setIsViewModalVisible(true); // Show the detail modal
    // message.info(t('payroll_entries_table.message_view_details_todo', { employeeIdentifier: entry.employee_name || entry.employee_id, entryId: entry.id }));
  };

  const handleEditEntry = (entry: PayrollEntry) => {
    // setCurrentEntry(entry);
    // form.setFieldsValue({ ...entry, /* map fields for form */ });
    // setIsEditModalVisible(true);
    message.info(t('payroll_entries_table.message_edit_entry_todo', { employeeIdentifier: entry.employee_name || entry.employee_id, entryId: entry.id }));
  };

  const columns: ColumnsType<PayrollEntry> = [
    { title: t('payroll_entries_table.column_entry_id'), dataIndex: 'id', key: 'id', sorter: (a,b) => a.id - b.id },
    { title: t('payroll_entries_table.column_employee_id'), dataIndex: 'employee_id', key: 'employee_id', sorter: (a,b) => a.employee_id - b.employee_id },
    { 
      title: t('payroll_entries_table.column_employee_name'),
      dataIndex: 'employee_name', 
      key: 'employee_name',
      sorter: true,
      render: (name, record) => name || <Tag>{t('payroll_entries_table.cell_name_supplement_needed')}</Tag>
    },
    { title: t('payroll_entries_table.column_total_earnings'), dataIndex: 'total_earnings', key: 'total_earnings', sorter: true, render: amount => `${t('payroll_entries_table.currency_symbol')}${amount.toFixed(2)}` },
    { title: t('payroll_entries_table.column_total_deductions'), dataIndex: 'total_deductions', key: 'total_deductions', sorter: true, render: amount => `${t('payroll_entries_table.currency_symbol')}${amount.toFixed(2)}` },
    { title: t('payroll_entries_table.column_net_pay'), dataIndex: 'net_pay', key: 'net_pay', sorter: true, render: amount => `${t('payroll_entries_table.currency_symbol')}${amount.toFixed(2)}` },
    {
      title: t('payroll_entries_table.column_status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      sorter: true,
      render: (statusId?: number) => {
        const statusInfo = getPayrollEntryStatusDisplay(statusId); // Use imported utility
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: t('payroll_entries_table.column_remarks'),
      dataIndex: 'remarks',
      key: 'remarks',
      sorter: true,
      ellipsis: true,
      render: text => text || t('payroll_entries_table.cell_remarks_empty'),
    },
    {
      title: t('payroll_entries_table.column_actions'),
      key: 'actions',
      align: 'center',
      render: (_, record: PayrollEntry) => (
        <Space size="small">
          <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_VIEW]}>
            <Tooltip title={t('payroll_entries_table.tooltip_view_details')}>
              <Button icon={<EyeOutlined />} onClick={() => handleViewEntryDetails(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_EDIT_DETAILS]}>
            <ActionButton actionType="edit" onClick={() => handleEditEntry(record)} tooltipTitle={t('payroll_entries_table.tooltip_edit_entry')} />
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  if (loading && !entries.length) { // Show full page spinner only on initial load
    return <Spin tip={t('payroll_entries_table.spin_loading_entries')} style={{ display: 'block', marginTop: '20px' }}><div style={{ padding: 50 }} /></Spin>;
  }

  if (error) {
    return <Alert message={`${t('payroll_entries_table.alert_error_prefix')}${error}`} type="error" showIcon style={{ margin: '10px 0' }} />;
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading} // Table internal loading spinner for subsequent loads/pagination
        pagination={{
          current: meta?.page,
          pageSize: meta?.size,
          total: meta?.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => t('payroll_entries_table.pagination_show_total', { range0: range[0], range1: range[1], total }),
          onChange: (page, pageSize) => fetchEntries(page, pageSize),
        }}
        scroll={{ x: 'max-content' }}
        size="small"
      />
      {/* Render the detail modal */}
      <PayrollEntryDetailModal 
        entryId={currentEntryId}
        visible={isViewModalVisible} 
        onClose={() => {
          setIsViewModalVisible(false);
          setCurrentEntryId(null); // Reset entryId when modal is closed
        }} 
      />
      {/* <PayrollEntryEditForm form={form} visible={isEditModalVisible} onCancel={() => setIsEditModalVisible(false)} onFinish={handleEditFormSubmit} initialValues={currentEntry} /> */}
    </>
  );
};

export default PayrollEntriesTable; 