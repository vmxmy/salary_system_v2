import React, { useEffect, useState, useCallback } from 'react';
import {
  Tag,
  Alert,
  Spin,
  Space,
  message,
  Tooltip,
  Typography
} from 'antd';
import { useTranslation } from 'react-i18next';
import TableActionButton from '../../../components/common/TableActionButton';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../components/common/EnhancedProTable';

import type { PayrollEntry, ApiListMeta } from '../types/payrollTypes';
import { getPayrollEntries } from '../services/payrollApi';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { getPayrollEntryStatusInfo } from '../utils/payrollUtils';
import {
  P_PAYROLL_ENTRY_VIEW,
  P_PAYROLL_ENTRY_EDIT_DETAILS
} from '../constants/payrollPermissions';
import PayrollEntryDetailModal from './PayrollEntryDetailModal';
import { employeeService } from '../../../services/employeeService';
import EmployeeName from '../../../components/common/EmployeeName';
import employeeCacheService from '../../../services/employeeCacheService';

interface PayrollEntriesTableProps {
  payrollRunId: number;
}

type ExtendedPayrollEntry = PayrollEntry & {
  employee_name?: string;
};

const PayrollEntriesTable: React.FC<PayrollEntriesTableProps> = ({ payrollRunId }) => {
  const { t } = useTranslation(['payroll_runs', 'common']);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 缓存员工姓名数据
  const [employeeCache, setEmployeeCache] = useState<Record<number, { firstName?: string; lastName?: string; displayName?: string }>>({});
  const [loadingEmployeeNames, setLoadingEmployeeNames] = useState<boolean>(false);

  // States for modals
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);

  const fetchEntries = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollEntries({ 
        payroll_run_id: payrollRunId, 
        page, 
        size: pageSize,
        include_employee_details: true,
        sort_by: 'employee_id',
        sort_order: 'asc',
      });
      
      if (response.data && response.data.length > 0) {
        console.log({t('payroll:auto_____f09f93')}, response.data.length);
        
        // 筛选出需要获取详情的员工ID
        const employeeIds = response.data
          .filter(entry => entry.employee_id && !entry.employee_name)
          .map(entry => String(entry.employee_id));
          
        // 如果有未获取到姓名的员工ID，尝试从缓存中获取
        if (employeeIds.length > 0) {
          console.log({t('payroll:auto____f09f94')});
          const cachedEmployees = employeeCacheService.getEmployees(employeeIds);
          
          // 如果缓存中没有的员工ID，尝试批量获取
          const uncachedIds = employeeIds.filter(id => !cachedEmployees[id]);
          if (uncachedIds.length > 0) {
            console.log({t('payroll:auto__api__e28c9b')}, uncachedIds.length, {t('payroll:auto_text_e4b8aa')});
            try {
              setLoadingEmployeeNames(true);
              const { employeeService } = await import('../../../services/employeeService');
              const fetchedEmployees = await employeeService.getEmployeesByIds(uncachedIds);
              
              // 缓存新获取的员工信息
              if (Object.keys(fetchedEmployees).length > 0) {
                employeeCacheService.saveEmployees(fetchedEmployees);
                console.log({t('payroll:auto____e29c85')}, Object.keys(fetchedEmployees).length, {t('payroll:auto_text_e4b8aa')});
              }
            } catch (error) {
              console.error({t('payroll:auto____e29d8c')}, error);
            } finally {
              setLoadingEmployeeNames(false);
            }
          }
        }
        
        setEntries(response.data);
        setMeta(response.meta);
      } else {
        setEntries([]);
        setMeta(response.meta || { total: 0, page: 1, size: pageSize, totalPages: 0 });
      }
    } catch (err) {
      console.error({t('payroll:auto___e88eb7')}, err);
      setError(t('payroll:payroll_entries_table.error_fetch'));
    } finally {
      setLoading(false);
    }
  }, [payrollRunId, t]);

  // 批量获取员工姓名信息
  const fetchEmployeeNames = useCallback(async (employeeIds: number[]) => {
    if (!employeeIds.length) return;
    
    // 过滤出未缓存的员工ID
    const uncachedIds = employeeIds.filter(id => !employeeCache[id]);
    if (!uncachedIds.length) return;
    
    setLoadingEmployeeNames(true);
    console.log({t('payroll:auto___id__f09f94')}, uncachedIds);
    
    try {
      // 创建一个新的缓存对象，避免直接修改状态
      const newCache = { ...employeeCache };
      
      // 并行请求所有员工信息
      const fetchPromises = uncachedIds.map(async (id) => {
        try {
          const employee = await employeeService.getEmployeeById(String(id));
          if (employee) {
            newCache[id] = {
              firstName: employee.first_name,
              lastName: employee.last_name,
              // 中文姓名格式：姓在前，名在后
              displayName: `${employee.last_name || ''}${employee.first_name || ''}`
            };
            return true;
          }
        } catch (err) {
          console.error({t('payroll:auto___id___e29d8c')}, err);
        }
        return false;
      });
      
      await Promise.all(fetchPromises);
      
      // 更新缓存
      setEmployeeCache(newCache);
      console.log({t('payroll:auto_____e29c85')}, newCache);
      
      // 更新薪资条目数据，添加员工姓名
      setEntries(currentEntries => 
        currentEntries.map(entry => {
          if (newCache[entry.employee_id]?.displayName) {
            return {
              ...entry,
              employee_name: newCache[entry.employee_id].displayName
            };
          }
          return entry;
        })
      );
    } catch (err) {
      console.error({t('payroll:auto____e29d8c')}, err);
    } finally {
      setLoadingEmployeeNames(false);
    }
  }, [employeeCache]);

  // 更新entries后，获取缺失的员工姓名
  useEffect(() => {
    if (entries.length > 0) {
      // 收集所有未缓存的员工ID
      const employeeIdsToFetch = entries
        .filter(entry => !entry.employee_name)
        .map(entry => entry.employee_id);
      
      if (employeeIdsToFetch.length > 0) {
        fetchEmployeeNames(employeeIdsToFetch);
      }
    }
  }, [entries, fetchEmployeeNames]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleViewEntryDetails = (entry: PayrollEntry) => {
    setCurrentEntryId(entry.id);
    setIsViewModalVisible(true);
    console.log('View entry translation key:', 'payroll:payroll_entries_table.message.view_entry_details');
  };

  const handleEditEntry = (entry: PayrollEntry) => {
    message.info(t('payroll:payroll_entries_table.message.edit_entry_todo'));
    console.log('Edit entry translation key:', 'payroll:payroll_entries_table.message.edit_entry_todo');
  };

  const columns: ProColumns<ExtendedPayrollEntry>[] = [
    {
      title: t('payroll:payroll_entries_table.column.employeeId'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 90,
      valueType: 'digit',
      sorter: (a, b) => a.employee_id - b.employee_id,
      search: false,
    },
    {
      title: t('payroll:payroll_entries_table.column.employeeName'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 130,
      valueType: 'text',
      sorter: (a, b) => (a.employee_name || '').localeCompare(b.employee_name || ''),
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
      title: t('payroll:payroll_entries_table.column.grossPay'),
      dataIndex: 'gross_pay',
      key: 'gross_pay',
      width: 110,
      align: 'right',
      valueType: 'money',
      sorter: (a, b) => (Number(a.gross_pay) || 0) - (Number(b.gross_pay) || 0),
      render: (_, record) => (Number(record.gross_pay) || 0).toFixed(2),
      search: false,
    },
    {
      title: t('payroll:payroll_entries_table.column.deductions'),
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      width: 110,
      align: 'right',
      valueType: 'money',
      sorter: (a, b) => (Number(a.total_deductions) || 0) - (Number(b.total_deductions) || 0),
      render: (_, record) => (Number(record.total_deductions) || 0).toFixed(2),
      search: false,
    },
    {
      title: t('payroll:payroll_entries_table.column.netPay'),
      dataIndex: 'net_pay',
      key: 'net_pay',
      width: 110,
      align: 'right',
      valueType: 'money',
      render: (_, record) => (
        <Typography.Text strong>{(Number(record.net_pay) || 0).toFixed(2)}</Typography.Text>
      ),
      sorter: (a, b) => (Number(a.net_pay) || 0) - (Number(b.net_pay) || 0),
      search: false,
    },
    {
      title: t('payroll:payroll_entries_table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 100,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        1: { text: t('payroll:status.draft'), status: 'default' },
        2: { text: t('payroll:status.finalized'), status: 'processing' },
        3: { text: t('payroll:status.paid'), status: 'success' },
      },
      render: (_, record) => {
        const statusInfo = getPayrollEntryStatusInfo(record.status_lookup_value_id);
        return <Tag color={statusInfo.color}>{t(`payroll:${statusInfo.key}`, statusInfo.params)}</Tag>;
      },
      search: false,
    },
    {
      title: t('common:label.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      valueType: 'option',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_VIEW]}>
            <TableActionButton
              actionType="view"
              onClick={() => handleViewEntryDetails(record)}
              tooltipTitle={t('payroll:payroll_entries_table.tooltip_view_details')}
            />
          </PermissionGuard>
          <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_EDIT_DETAILS]}>
            <TableActionButton
              actionType="edit"
              onClick={() => handleEditEntry(record)}
              tooltipTitle={t('payroll:payroll_entries_table.tooltip_edit_entry')}
            />
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  if (loading && !entries.length) {
    return <Spin tip={t('payroll:payroll_entries_table.spin_loading_entries')} style={{ display: 'block', marginTop: '20px' }}><div style={{ padding: 50 }} /></Spin>;
  }

  if (error) {
    return <Alert message={`${t('payroll:payroll_entries_table.alert_error_prefix')}${error}`} type="error" showIcon style={{ margin: '10px 0' }} />;
  }

  return (
    <div>
      {loading && entries.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message={t('common:error.title')}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t('payroll:payroll_entries_table.title')}
              {meta && <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: 8 }}>
                ({t('payroll:payroll_entries_table.total_entries', { count: meta.total })})
              </span>}
            </Typography.Title>
          </div>
          
          {loadingEmployeeNames && (
            <Alert
              message={t('payroll:payroll_entries_table.loading_employee_names')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <EnhancedProTable<ExtendedPayrollEntry>
            columns={columns}
            dataSource={entries as ExtendedPayrollEntry[]}
            rowKey="id"
            loading={loading}
            pagination={meta ? {
              current: meta.page,
              pageSize: meta.size,
              total: meta.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total: number) => t('common:pagination.total_records', { count: total }),
              onChange: (page: number, pageSize: number) => fetchEntries(page, pageSize),
            } : false}
            scroll={{ x: 'max-content' }}
            size="middle"
            enableAdvancedFeatures={true}
            showToolbar={true}
            search={false}
          />
          
          {/* Modal for viewing entry details */}
          {isViewModalVisible && currentEntryId && (
            <PayrollEntryDetailModal
              entryId={String(currentEntryId)}
              visible={isViewModalVisible}
              onClose={() => {
                setIsViewModalVisible(false);
                setCurrentEntryId(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PayrollEntriesTable; 