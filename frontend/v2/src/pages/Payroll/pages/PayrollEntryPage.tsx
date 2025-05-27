import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Tag, 
  message, 
  Tooltip,
  Modal,
  Typography,
  Badge,
  Checkbox,
  Button,
  Space
} from 'antd';
import { PlusOutlined, ImportOutlined, FileExcelOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { P_PAYROLL_ENTRY_VIEW, P_PAYROLL_ENTRY_EDIT_DETAILS, P_PAYROLL_ENTRY_BULK_IMPORT } from '../constants/payrollPermissions';
import { getPayrollPeriods, getPayrollEntries, deletePayrollEntry } from '../services/payrollApi';
import { getPersonnelCategoriesTree } from '../../../api/personnelCategories';
import type { PersonnelCategory } from '../../../api/types';
import type { PayrollPeriod, PayrollEntry, ApiListMeta } from '../types/payrollTypes';
import { getPayrollEntryStatusInfo, PAYROLL_ENTRY_STATUS_OPTIONS } from '../utils/payrollUtils';
import OrganizationManagementTableTemplate from '../../../components/common/OrganizationManagementTableTemplate';
import dayjs from 'dayjs';
import type { ProColumns } from '@ant-design/pro-components';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { employeeService } from '../../../services/employeeService';
import PayrollEntryFormModal from '../components/PayrollEntryFormModal';

// Helper function to convert snake_case or camelCase to Title Case
const toTitleCase = (str: string) => {
  if (!str) return '';
  // Handle specific known keys for better titles before generic conversion
  if (str === 'id') return 'ID';
  if (str === 'employee_id') return 'Employee ID';
  if (str === 'payroll_period_id') return 'Payroll Period ID';
  if (str === 'payroll_run_id') return 'Payroll Run ID';
  if (str === 'status_lookup_value_id') return 'Status ID';
  if (str === 'gross_pay') return 'Gross Pay';
  if (str === 'total_deductions') return 'Total Deductions';
  if (str === 'net_pay') return 'Net Pay';

  const result = str
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters in camelCase
    .replace(/^./, (s) => s.toUpperCase()) // Capitalize the first letter
    .replace(/ ([a-z])/g, (match) => match.toUpperCase()); // Capitalize letters after spaces
  return result.trim();
};

// Helper function to flatten personnel categories tree for filter options
const flattenPersonnelCategories = (categories: PersonnelCategory[], parentPrefix = ''): Array<{text: string, value: string}> => {
  let result: Array<{text: string, value: string}> = [];
  
  categories.forEach(category => {
    const displayName = parentPrefix ? `${parentPrefix} > ${category.name}` : category.name;
    result.push({ text: displayName, value: category.name });
    
    if (category.child_categories && category.child_categories.length > 0) {
      result = result.concat(flattenPersonnelCategories(category.child_categories, displayName));
    }
  });
  
  return result;
};

const PayrollEntryPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common', 'employee']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [meta, setMeta] = useState<ApiListMeta | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntry | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sorter, setSorter] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<ProColumns<PayrollEntry>[]>([]);
  const [personnelCategoriesTree, setPersonnelCategoriesTree] = useState<PersonnelCategory[]>([]);

  // 获取薪资周期
  const fetchPayrollPeriods = useCallback(async () => {
    try {
      const response = await getPayrollPeriods({ page: 1, size: 100 });
      setPeriods(response.data);
      console.log('[PayrollEntryPage.tsx] fetchPayrollPeriods - Periods state updated:', JSON.stringify(response.data, null, 2));
      if (response.data.length > 0 && !selectedPeriodId) { // Default select first period only if none is selected
        setSelectedPeriodId(response.data[0].id);
      }
    } catch (error) {
      message.error(t('payroll:entry_page.error_fetch_periods'));
    }
  }, [t, selectedPeriodId]); // Added selectedPeriodId to dependency array

  // 获取人员类别树形数据
  const fetchPersonnelCategoriesTree = useCallback(async () => {
    try {
      const response = await getPersonnelCategoriesTree(true); // Only get active categories
      setPersonnelCategoriesTree(response.data);
      console.log('[PayrollEntryPage.tsx] Personnel categories tree loaded:', response.data);
    } catch (error) {
      console.error('Failed to fetch personnel categories tree:', error);
      // Not showing error message to user as this is not critical for the main functionality
    }
  }, []);

  // 获取工资明细列表
  const fetchPayrollEntries = useCallback(async (page = 1, size = 10, periodIdToFetch?: number | null, currentSorter?: any) => {
    const targetPeriodId = periodIdToFetch ?? selectedPeriodId;
    if (!targetPeriodId) {
      setEntries([]);
      setMeta(null);
      setDynamicColumns(generateDynamicColumns([], periods, t, personnelCategoriesTree)); // Set default columns if no periodId
      return;
    }
    
    setLoading(true);
    try {
      const params: any = { page, size, include_employee_details: true, payroll_period_id: targetPeriodId };
      if (currentSorter && currentSorter.field) {
        let fieldKey = currentSorter.field;
        if (Array.isArray(fieldKey)) fieldKey = fieldKey.join('.');
        params.sort_by = fieldKey;
        params.sort_order = currentSorter.order === 'descend' ? 'desc' : 'asc';
      }
      
      const response = await getPayrollEntries(params);
      setEntries(response.data);
      setMeta(response.meta);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      message.error(t('payroll:entry_page.error_fetch_entries'));
    } finally {
      setLoading(false);
    }
  }, [t, selectedPeriodId, personnelCategoriesTree]); // selectedPeriodId and personnelCategoriesTree are dependencies here

  // 动态生成列定义
  const generateDynamicColumns = useCallback((data: PayrollEntry[], currentPeriods: PayrollPeriod[], translate: typeof t, categoriesTree: PersonnelCategory[]): ProColumns<PayrollEntry>[] => {
    if (!data || data.length === 0) {
      return [
        { title: translate('payroll:entries_table.column.employee_id'), dataIndex: 'employee_id', key: 'employee_id', sorter: true },
        { title: translate('payroll:entries_table.column.employee_name'), dataIndex: 'employee_name', key: 'employee_name', sorter: true },
        { title: translate('payroll:entries_table.column.status'), dataIndex: 'status_lookup_value_id', key: 'status_lookup_value_id', sorter: true },
      ];
    }

    const firstEntry = data[0];
    const keys = Object.keys(firstEntry) as Array<keyof PayrollEntry>;

    const generatedColumns: ProColumns<PayrollEntry>[] = keys
      .filter(key => key !== 'earnings_details' && key !== 'deductions_details' && key !== 'payroll_run' && key !== 'created_at' && key !== 'updated_at' && key !== 'status' && key !== 'remarks' && key !== 'employee') // exclude 'employee' object itself from direct column generation
      .map(key => {
        let columnTitle = toTitleCase(String(key)); 

        if (key === 'employee_id') {
          columnTitle = translate('payroll:entries_table.column.employee_id');
        } else if (key === 'payroll_period_id') {
          columnTitle = translate('payroll:entries_table.column.payroll_period');
        } else if (key === 'gross_pay') {
          columnTitle = translate('payroll:entries_table.column.gross_pay');
        } else if (key === 'total_deductions') {
          columnTitle = translate('payroll:entries_table.column.total_deductions');
        } else if (key === 'net_pay') {
          columnTitle = translate('payroll:entries_table.column.net_pay');
        } else if (key === 'status_lookup_value_id') {
          columnTitle = translate('payroll:entries_table.column.status');
        }
        // Note: employee_name is handled by a manually inserted column

        const column: ProColumns<PayrollEntry> = {
          title: columnTitle,
          dataIndex: String(key),
          key: String(key),
          sorter: true, // Default sorter for all dynamic columns
          filters: true, // Default filter for all dynamic columns
          filterSearch: true, // Allow searching in filter dropdowns
          ellipsis: true,
        };

        if (key === 'id') {
            column.width = 80;
        } else if (key === 'employee_id') {
          column.width = 120;
        } else if (key === 'payroll_period_id') {
          column.filters = currentPeriods.map(p => ({ text: p.name, value: p.id }));
          column.onFilter = (value, record) => record.payroll_period_id === value;
          column.render = (_, record) => {
            const period = currentPeriods.find(p => p.id === record.payroll_period_id);
            if (!period) {
              console.warn(
                `[PayrollEntryPage.tsx] generateDynamicColumns - Period name not found for ID: ${record.payroll_period_id}. ` +
                `Current entry ID: ${record.id}. ` +
                `currentPeriods being used:`, JSON.stringify(currentPeriods.map(p => ({id: p.id, name: p.name})), null, 2)
              );
            }
            return period ? period.name : record.payroll_period_id;
          };
          column.width = 150;
        } else if (key === 'gross_pay' || key === 'total_deductions' || key === 'net_pay') {
          column.valueType = 'money';
          column.align = 'right';
          column.width = 130;
          // sorter and filters: true should work well with valueType: 'money'
        } else if (key === 'status_lookup_value_id') {
          const statusOptions = PAYROLL_ENTRY_STATUS_OPTIONS.map(s => ({
            text: translate(s.display_name_key),
            value: s.id,
          }));
          column.filters = statusOptions;
          column.onFilter = (value, record) => record.status_lookup_value_id === value;
          column.render = (_, record) => {
            const statusInfo = getPayrollEntryStatusInfo(record.status_lookup_value_id);
            return <Tag color={statusInfo.color}>{translate(statusInfo.key, statusInfo.params)}</Tag>;
          };
          column.width = 120;
        }
        return column;
      });

    // Manually add/override specific columns after dynamic generation
    let columns = [...generatedColumns];

    // Unique values for Department and Personnel Category filters
    const uniqueDepartments = Array.from(new Set(data.map(item => item.employee?.departmentName).filter((name): name is string => !!name)))
      .map(name => ({ text: name, value: name }));
    const uniquePersonnelCategories = Array.from(new Set(data.map(item => item.employee?.personnelCategoryName).filter((name): name is string => !!name)))
      .map(name => ({ text: name, value: name }));


    // Employee Name Column (manual override or insertion)
    const employeeNameColumn: ProColumns<PayrollEntry> = {
      title: translate('payroll:entries_table.column.employee_name'),
      key: 'employee_name',
      sorter: (a, b) => {
        const nameA = `${a.employee?.last_name || ''}${a.employee?.first_name || ''}`.trim(); // LastNameFirstName
        const nameB = `${b.employee?.last_name || ''}${b.employee?.first_name || ''}`.trim(); // LastNameFirstName
        return nameA.localeCompare(nameB);
      },
      filters: true, 
      filterSearch: true,
      ellipsis: true,
      width: 150,
      render: (_, record) => {
        const firstName = record.employee?.first_name;
        const lastName = record.employee?.last_name;
        if (lastName && firstName) {
          return `${lastName}${firstName}`; // LastNameFirstName
        }
        if (lastName) {
          return lastName;
        }
        if (firstName) {
          return firstName;
        }
        return translate('common:notAvailable');
      },
    };

    // Department Column
    const departmentColumn: ProColumns<PayrollEntry> = {
      title: translate('payroll:entries_table.column.department'),
      key: 'department',
      dataIndex: ['employee', 'departmentName'],
      sorter: (a, b) => String(a.employee?.departmentName || '').localeCompare(String(b.employee?.departmentName || '')),
      filters: uniqueDepartments.length > 0 ? uniqueDepartments : undefined,
      onFilter: uniqueDepartments.length > 0 ? (value, record) => record.employee?.departmentName === value : undefined,
      filterSearch: true,
      ellipsis: true,
      width: 180,
      render: (_, record) => record.employee?.departmentName || translate('common:notAvailable'),
    };

    // Personnel Identity/Category Column
    const personnelIdentityColumn: ProColumns<PayrollEntry> = {
      title: translate('payroll:entries_table.column.personnel_identity'),
      key: 'personnel_identity',
      dataIndex: ['employee', 'personnelCategoryName'],
      sorter: (a, b) => String(a.employee?.personnelCategoryName || '').localeCompare(String(b.employee?.personnelCategoryName || '')),
      filters: categoriesTree.length > 0 ? flattenPersonnelCategories(categoriesTree) : uniquePersonnelCategories.length > 0 ? uniquePersonnelCategories : undefined,
      onFilter: (value, record) => record.employee?.personnelCategoryName === value,
      filterSearch: true,
      ellipsis: true,
      width: 180,
      render: (_, record) => record.employee?.personnelCategoryName || translate('common:notAvailable'),
    };

    // Find and replace or insert these columns
    // Helper to insert or replace a column
    const upsertColumn = (existingColumns: ProColumns<PayrollEntry>[], newColumn: ProColumns<PayrollEntry>, afterKey?: string) => {
      const index = existingColumns.findIndex(col => col.key === newColumn.key);
      if (index > -1) {
        existingColumns[index] = { ...existingColumns[index], ...newColumn }; // Merge, preferring newColumn properties
      } else {
        if (afterKey) {
          const afterIndex = existingColumns.findIndex(col => col.key === afterKey);
          if (afterIndex > -1) {
            existingColumns.splice(afterIndex + 1, 0, newColumn);
          } else {
            existingColumns.push(newColumn); // Fallback: add to end
          }
        } else {
          existingColumns.unshift(newColumn); // Default: add to beginning if no afterKey
        }
      }
    };
    
    // Upsert Employee ID to ensure it has filters if it was dynamically generated
    const employeeIdCol = columns.find(c => c.key === 'employee_id');
    if (employeeIdCol) {
        employeeIdCol.sorter = true; // Already set for dynamic, but good to be explicit
        employeeIdCol.filters = true; 
        employeeIdCol.filterSearch = true;
    }


    // Upsert key columns (Name, Department, Personnel Category)
    // Typically, we want Employee ID, then Name, then other employee details
    upsertColumn(columns, employeeNameColumn, 'employee_id'); // Insert after employee_id
    upsertColumn(columns, departmentColumn, 'employee_name'); // Insert after employee_name
    upsertColumn(columns, personnelIdentityColumn, 'department'); // Insert after department


    // Action Column (ensure it's last and has no sorting/filtering)
    columns.push({
      title: translate('payroll:entries_table.column.actions'),
      key: 'actions',
      width: 100,
      fixed: 'right',
      valueType: 'option',
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_EDIT_DETAILS]}>
            <Tooltip title={translate('payroll:entry_page.tooltip.edit_entry')}>
              <Button icon={<EditOutlined />} size="small" onClick={() => handleEditEntry(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    });

    return columns;
  }, []);

  // Fetch initial data and set up columns
  useEffect(() => {
    fetchPayrollPeriods();
    fetchPersonnelCategoriesTree(); // Fetch personnel categories tree on mount
  }, [fetchPayrollPeriods, fetchPersonnelCategoriesTree]); // Initial fetch for periods

  useEffect(() => {
    // Fetch entries when selectedPeriodId changes or on initial load if selectedPeriodId is already set
    if (selectedPeriodId) {
      fetchPayrollEntries(currentPage, pageSize, selectedPeriodId, sorter);
    }
  }, [selectedPeriodId, currentPage, pageSize, sorter, fetchPayrollEntries]);
  
  useEffect(() => {
    // Regenerate columns when entries or periods data changes
    // Ensure periods are available for the payroll_period_id column rendering/filtering
    if (entries.length > 0 && periods.length > 0) {
      setDynamicColumns(generateDynamicColumns(entries, periods, t, personnelCategoriesTree));
    } else if (periods.length > 0) { // If no entries but periods loaded, show default columns
       setDynamicColumns(generateDynamicColumns([], periods, t, personnelCategoriesTree));
    }
    // If periods are not loaded yet, columns dependent on them (like payroll_period_id filter) might be empty
    // This will naturally update once periods are fetched and this effect re-runs.
  }, [entries, periods, t, generateDynamicColumns, personnelCategoriesTree]);


  // 处理编辑工资明细
  const handleEditEntry = (entry: PayrollEntry) => {
    setCurrentEntry(entry);
    setIsModalVisible(true);
  };

  // 处理新增工资明细
  const handleAddEntry = () => {
    setCurrentEntry(null);
    setIsModalVisible(true);
  };

  // 处理表单提交成功后的操作
  const handleFormSuccess = () => {
    setIsModalVisible(false);
    fetchPayrollEntries(currentPage, pageSize, selectedPeriodId, sorter);
    message.success(t('payroll:entry_page.message.operation_success'));
  };

  // 处理批量导入
  const handleBulkImport = () => {
    navigate('/payroll/bulk-import');
  };

  // 处理批量删除
  const handleBatchDelete = async (selectedKeys: React.Key[]) => {
    const deletePromises = selectedKeys.map(id => deletePayrollEntry(Number(id)));
    await Promise.all(deletePromises);
    setSelectedRowKeys([]);
    fetchPayrollEntries(currentPage, pageSize, selectedPeriodId, sorter);
  };

  const pageTitle = t('payroll:entry_page.title'); // Changed to use i18n key again for consistency

  // 处理表格变化事件，用于排序和分页
  const handleTableChange = (paginationParams: any, filtersParams: any, newSorter: any) => {
    const { current, pageSize: newPageSize } = paginationParams;
    setCurrentPage(current);
    setPageSize(newPageSize);
    setSorter(newSorter); // Sorter state is updated, useEffect for fetchPayrollEntries will pick it up
  };

  // 构建额外的工具栏按钮
  const extraButtons = [
    <PermissionGuard key="bulk-import" requiredPermissions={[P_PAYROLL_ENTRY_BULK_IMPORT]}>
      <Button icon={<ImportOutlined />} onClick={handleBulkImport} shape="round">
        {t('payroll:entry_page.button.batch_import')}
      </Button>
    </PermissionGuard>
  ];

  // 构建批量删除配置
  const batchDeleteConfig = {
    enabled: true,
    buttonText: t('payroll:entry_page.batch_delete_button_text'),
    confirmTitle: t('payroll:entry_page.batch_delete_confirm_title'),
    confirmContent: t('payroll:entry_page.batch_delete_confirm_content'),
    confirmOkText: t('payroll:entry_page.batch_delete_confirm_ok_text'),
    confirmCancelText: t('payroll:entry_page.batch_delete_confirm_cancel_text'),
    onBatchDelete: handleBatchDelete,
    successMessage: t('payroll:entry_page.batch_delete_success_message'),
    errorMessage: t('payroll:entry_page.batch_delete_error_message'),
    noSelectionMessage: t('payroll:entry_page.batch_delete_no_selection_message'),
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
    getCheckboxProps: (record: PayrollEntry) => ({ disabled: false }),
  };

  return (
    <>
      <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_VIEW]}>
        <OrganizationManagementTableTemplate<PayrollEntry>
          pageTitle={pageTitle} 
          addButtonText={t('payroll:entry_page.button.add_entry')}
          onAddClick={handleAddEntry}
          showAddButton={!!selectedPeriodId} 
          extraButtons={extraButtons}
          batchDelete={batchDeleteConfig}
          rowSelection={rowSelection}
          columns={dynamicColumns} 
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => t('common:table.total_items', { total }),
          }}
          onChange={handleTableChange}
          search={false} 
          enableAdvancedFeatures={true}
          showToolbar={true}
        />
      </PermissionGuard>

      {isModalVisible && (
        <PayrollEntryFormModal
          visible={isModalVisible}
          payrollPeriodId={selectedPeriodId}
          entry={currentEntry}
          onClose={() => setIsModalVisible(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
};

export default PayrollEntryPage; 