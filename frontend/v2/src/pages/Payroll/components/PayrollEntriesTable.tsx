import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Typography
} from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import TableActionButton from '../../../components/common/TableActionButton';
import type { ColumnsType } from 'antd/es/table';
import { format } from 'date-fns';
import dayjs from 'dayjs';

import type { PayrollEntry, ApiListMeta } from '../types/payrollTypes';
import { getPayrollEntries /*, updatePayrollEntryDetails */ } from '../services/payrollApi';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { getPayrollEntryStatusInfo } from '../utils/payrollUtils'; // Updated import
import {
  P_PAYROLL_ENTRY_VIEW,
  P_PAYROLL_ENTRY_EDIT_DETAILS
} from '../constants/payrollPermissions'; // Import permissions
import PayrollEntryDetailModal from './PayrollEntryDetailModal'; // Uncommented and imported
// import PayrollEntryEditForm from './PayrollEntryEditForm'; // To be created later
import { employeeService } from '../../../services/employeeService'; // 引入员工服务
import EmployeeName from '../../../components/common/EmployeeName';
import employeeCacheService from '../../../services/employeeCacheService';
import { useTableSearch, useTableExport, useColumnControl, numberSorter, stringSorter, dateSorter } from '../../../components/common/TableUtils';

interface PayrollEntriesTableProps {
  payrollRunId: number;
}

const PayrollEntriesTable: React.FC<PayrollEntriesTableProps> = ({ payrollRunId }) => {
  const { t } = useTranslation(['payroll', 'common']);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 缓存员工姓名数据
  const [employeeCache, setEmployeeCache] = useState<Record<number, { firstName?: string; lastName?: string; displayName?: string }>>({});
  const [loadingEmployeeNames, setLoadingEmployeeNames] = useState<boolean>(false);

  // States for modals
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false); // Uncommented
  // const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null); // Using entryId
  // const [form] = Form.useForm();

  // 使用表格搜索功能
  const { getColumnSearch } = useTableSearch();

  // 声明扩展的PayrollEntry类型，包含我们需要的字段
  type ExtendedPayrollEntry = PayrollEntry & {
    employee_name?: string;
  };

  const fetchEntries = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollEntries({ 
        payroll_run_id: payrollRunId, 
        page, 
        size: pageSize,
        include_employee_details: true, // 使用后端员工信息数据
        sort_by: 'employee_id', // Default sort
        sort_order: 'asc',
      });
      
      if (response.data && response.data.length > 0) {
        console.log('📊 获取到工资条目数据，条目数量:', response.data.length);
        
        // 筛选出需要获取详情的员工ID
        const employeeIds = response.data
          .filter(entry => entry.employee_id && !entry.employee_name)
          .map(entry => String(entry.employee_id));
          
        // 如果有未获取到姓名的员工ID，尝试从缓存中获取
        if (employeeIds.length > 0) {
          console.log('🔍 发现有员工姓名需要补充，尝试从缓存获取');
          const cachedEmployees = employeeCacheService.getEmployees(employeeIds);
          
          // 如果缓存中没有的员工ID，尝试批量获取
          const uncachedIds = employeeIds.filter(id => !cachedEmployees[id]);
          if (uncachedIds.length > 0) {
            console.log('⌛ 从API批量获取员工信息:', uncachedIds.length, '个员工');
            try {
              setLoadingEmployeeNames(true);
              const { employeeService } = await import('../../../services/employeeService');
              const fetchedEmployees = await employeeService.getEmployeesByIds(uncachedIds);
              
              // 缓存新获取的员工信息
              if (Object.keys(fetchedEmployees).length > 0) {
                employeeCacheService.saveEmployees(fetchedEmployees);
                console.log('✅ 成功缓存员工信息:', Object.keys(fetchedEmployees).length, '个员工');
              }
            } catch (error) {
              console.error('❌ 获取员工信息失败:', error);
            } finally {
              setLoadingEmployeeNames(false);
            }
          }
        }
        
        console.log('Raw data from getPayrollEntries API:', JSON.stringify(response.data, null, 2));
        setEntries(response.data);
        setMeta(response.meta);
      } else {
        setEntries([]);
        setMeta(response.meta || { total: 0, page: 1, size: pageSize, totalPages: 0 });
      }
    } catch (err) {
      console.error('获取工资条目数据失败:', err);
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
    console.log('🔍 开始获取员工姓名信息, 员工ID:', uncachedIds);
    
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
          console.error(`❌ 获取员工 ${id} 信息失败:`, err);
        }
        return false;
      });
      
      await Promise.all(fetchPromises);
      
      // 更新缓存
      setEmployeeCache(newCache);
      console.log('✅ 员工姓名信息获取完成，更新缓存:', newCache);
      
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
      console.error('❌ 批量获取员工姓名失败:', err);
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
    // 修正翻译键路径
    message.info(t('payroll:payroll_entries_table.message.edit_entry_todo', { employeeIdentifier: entry.employee_name || entry.employee_id, entryId: entry.id }));
    console.log('Edit entry translation key:', 'payroll:payroll_entries_table.message.edit_entry_todo');
  };

  const columns: ColumnsType<ExtendedPayrollEntry> = [
    {
      title: t('payroll:payroll_entries_table.column.employeeId'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 90,
      sorter: numberSorter<ExtendedPayrollEntry>('employee_id'),
      sortDirections: ['descend', 'ascend'],
      ...getColumnSearch('employee_id'),
    },
    {
      title: t('payroll:payroll_entries_table.column.employeeName'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 130,
      sorter: stringSorter<ExtendedPayrollEntry>('employee_name'),
      sortDirections: ['descend', 'ascend'],
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
      title: t('payroll:payroll_entries_table.column.grossPay'),
      dataIndex: 'gross_pay',
      key: 'gross_pay',
      width: 110,
      align: 'right',
      sorter: (a, b) => (Number(a.gross_pay) || 0) - (Number(b.gross_pay) || 0),
      sortDirections: ['descend', 'ascend'],
      render: (grossPay) => (Number(grossPay) || 0).toFixed(2),
    },
    {
      title: t('payroll:payroll_entries_table.column.deductions'),
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      width: 110,
      align: 'right',
      sorter: (a, b) => (Number(a.total_deductions) || 0) - (Number(b.total_deductions) || 0),
      sortDirections: ['descend', 'ascend'],
      render: (deductions) => (Number(deductions) || 0).toFixed(2),
    },

    {
      title: t('payroll:payroll_entries_table.column.netPay'),
      dataIndex: 'net_pay',
      key: 'net_pay',
      width: 110,
      align: 'right',
      render: (netPay) => (
        <Typography.Text strong>{(Number(netPay) || 0).toFixed(2)}</Typography.Text>
      ),
      sorter: numberSorter<ExtendedPayrollEntry>('net_pay'),
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: t('payroll:payroll_entries_table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 100,
      align: 'center',
      filters: [
        { text: t('payroll:status.draft'), value: 1 },
        { text: t('payroll:status.finalized'), value: 2 },
        { text: t('payroll:status.paid'), value: 3 },
      ],
      onFilter: (value, record) => record.status_lookup_value_id === value,
      render: (statusId: number) => {
        const statusInfo = getPayrollEntryStatusInfo(statusId);
        return <Tag color={statusInfo.color}>{t(`payroll:${statusInfo.key}`, statusInfo.params)}</Tag>;
      },
    },
    {
      title: t('common:label.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
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

  // 添加表格导出功能
  const { ExportButton } = useTableExport(
    entries || [], 
    columns, 
    {
      filename: t('payroll:payroll_entries_table.export.filename', '工资条目'),
      sheetName: t('payroll:payroll_entries_table.export.sheetName', '工资条目'),
      buttonText: t('payroll:payroll_entries_table.export.buttonText', '导出工资条目'),
      successMessage: t('payroll:payroll_entries_table.export.successMessage', '导出成功')
    }
  );
  
  // 添加列控制功能
  const { visibleColumns, ColumnControl } = useColumnControl(
    columns,
    {
      storageKeyPrefix: 'payroll_entries_table',
      buttonText: t('payroll:payroll_entries_table.columnControl.buttonText', '列设置'),
      tooltipTitle: t('payroll:payroll_entries_table.columnControl.tooltipTitle', '自定义显示列'),
      dropdownTitle: t('payroll:payroll_entries_table.columnControl.dropdownTitle', '列显示'),
      resetText: t('payroll:payroll_entries_table.columnControl.resetText', '重置'),
      requiredColumns: ['employee_name', 'net_pay', 'actions'] // 员工姓名、净工资和操作列始终显示
    }
  );

  if (loading && !entries.length) { // Show full page spinner only on initial load
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
            <Space>
              <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_VIEW]}>
                <Tooltip title={t('payroll:payroll_entries_table.export.tooltipTitle', '导出到Excel')}>
                  <ExportButton />
                </Tooltip>
              </PermissionGuard>
              <ColumnControl />
            </Space>
          </div>
          
          {loadingEmployeeNames && (
            <Alert
              message={t('payroll:payroll_entries_table.loading_employee_names')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Table
            columns={visibleColumns}
            dataSource={entries as ExtendedPayrollEntry[]}
            rowKey="id"
            loading={loading}
            pagination={meta ? {
              current: meta.page,
              pageSize: meta.size,
              total: meta.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => t('common:pagination.total_records', { count: total }),
              onChange: (page, pageSize) => fetchEntries(page, pageSize),
            } : false}
            scroll={{ x: 'max-content' }}
            size="middle"
            summary={pageData => {
              // 计算各项合计
              let totalNetPay = 0;
              let totalGrossPay = 0;
              let totalDeductions = 0;
              
              (pageData as ExtendedPayrollEntry[]).forEach(entry => {
                // 确保所有值都是数字类型，避免 toFixed 错误
                totalNetPay += Number(entry.net_pay) || 0;
                totalGrossPay += Number(entry.gross_pay) || 0;
                totalDeductions += Number(entry.total_deductions) || 0;
              });
              
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2} align="right">
                      <Typography.Text strong>{t('payroll:payroll_entries_table.summary_total')}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Typography.Text strong>{Number(totalGrossPay).toFixed(2)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Typography.Text strong>{Number(totalDeductions).toFixed(2)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <Typography.Text type="danger" strong>{Number(totalNetPay).toFixed(2)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} colSpan={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </>
      )}
      
      <PayrollEntryDetailModal 
        entryId={currentEntryId}
        visible={isViewModalVisible}
        onClose={() => {
          setIsViewModalVisible(false);
          setCurrentEntryId(null);
        }}
      />
    </div>
  );
};

export default PayrollEntriesTable; 