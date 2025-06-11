import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Tag, 
  Tooltip,
  Modal,
  Typography,
  Badge,
  Checkbox,
  Button,
  Space,
  App
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
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import PayrollPeriodSelector from '../../../components/common/PayrollPeriodSelector';
import dayjs from 'dayjs';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { employeeService } from '../../../services/employeeService';
import PayrollEntryFormModal from '../components/PayrollEntryFormModal';
import PayrollEntryDetailModal from '../components/PayrollEntryDetailModal';
import { stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
import TableActionButton from '../../../components/common/TableActionButton';



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

// 生成薪资记录表格列配置
const generatePayrollEntryTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PayrollEntry) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (entry: PayrollEntry) => void,
  onDelete: (entryId: string) => void,
  onViewDetails: (entryId: string) => void
): ProColumns<PayrollEntry>[] => {
  
  const columns: ProColumns<PayrollEntry>[] = [
    {
      title: t('payroll:entries_table.column.employee_id'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      sorter: numberSorter<PayrollEntry>('employee_id'),
      width: 120,
      ...getColumnSearch('employee_id'),
    },
    {
      title: t('payroll:entries_table.column.employee_name'),
      key: 'employee_name',
      sorter: (a, b) => {
        const nameA = a.employee_name || '';
        const nameB = b.employee_name || '';
        return nameA.localeCompare(nameB);
      },
      width: 150,
      render: (_, record) => {
        const fullName = record.employee_name || `${record.last_name || ''}${record.first_name || ''}`.trim();
        
        if (!fullName) {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>未设置姓名</span>;
        }
        
        return fullName;
      },
    },
    {
      title: t('payroll:entries_table.column.department'),
      key: 'department',
      width: 150,
      render: (_, record) => record.department_name || '',
      filters: lookupMaps?.departmentMap ? Array.from(lookupMaps.departmentMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[1],
      })) : [],
      onFilter: (value, record) => record.department_name === value,
    },
    {
      title: t('payroll:entries_table.column.personnel_category'),
      key: 'personnel_identity',
      width: 180,
      render: (_, record) => record.personnel_category_name || '',
      filters: lookupMaps?.personnelCategoryMap ? Array.from(lookupMaps.personnelCategoryMap.entries()).map((entry: any) => ({
        text: entry[1],
        value: entry[1],
      })) : [],
      onFilter: (value, record) => record.personnel_category_name === value,
    },
    {
      title: t('payroll:entries_table.column.gross_pay'),
      dataIndex: 'gross_pay',
      key: 'gross_pay',
      sorter: numberSorter<PayrollEntry>('gross_pay'),
      width: 120,
      render: (value: any) => {
        const numValue = Number(value);
        return `¥${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`;
      },
    },
    {
      title: t('payroll:entries_table.column.total_deductions'),
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      sorter: numberSorter<PayrollEntry>('total_deductions'),
      width: 120,
      render: (value: any) => {
        const numValue = Number(value);
        return `¥${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`;
      },
    },
    {
      title: t('payroll:entries_table.column.net_pay'),
      dataIndex: 'net_pay',
      key: 'net_pay',
      sorter: numberSorter<PayrollEntry>('net_pay'),
      width: 120,
      render: (value: any) => {
        const numValue = Number(value);
        return `¥${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`;
      },
    },
    {
      title: t('payroll:entries_table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 100,
      render: (statusId: number) => {
        const statusInfo = getPayrollEntryStatusInfo(statusId);
        return (
          <Badge 
            status={statusInfo.color === 'green' ? 'success' : statusInfo.color === 'red' ? 'error' : 'default'} 
            text={t(statusInfo.key)} 
          />
        );
      },
      filters: PAYROLL_ENTRY_STATUS_OPTIONS.map(option => ({
        text: t(option.display_name_key),
        value: option.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: t('payroll:entries_table.column.actions'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: PayrollEntry) => (
        <Space size="small">
          {permissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(String(record.id))}
              tooltipTitle={t('common:action.view')} 
            />
          )}
          {permissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('common:action.edit')} 
            />
          )}
          {permissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(String(record.id))}
              tooltipTitle={t('common:action.delete')} 
            />
          )}
        </Space>
      ),
    },
  ];
  
  
  return columns;
};

const PayrollEntryPage: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common', 'employee']);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntry | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [allPayrollEntries, setAllPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [personnelCategoriesTree, setPersonnelCategoriesTree] = useState<PersonnelCategory[]>([]);
  
  // 模拟权限配置
  const permissions = {
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  };

  // 动态构建查找映射数据 - 从实际的薪资条目数据中提取
  const lookupMaps = useMemo(() => {
    const departmentSet = new Set<string>();
    const personnelCategorySet = new Set<string>();
    
    // 从薪资条目数据中提取唯一的部门和人员类别
    allPayrollEntries.forEach(entry => {
      if (entry.department_name) {
        departmentSet.add(entry.department_name);
      }
      if (entry.personnel_category_name) {
        personnelCategorySet.add(entry.personnel_category_name);
      }
    });
    
    return {
      departmentMap: new Map(Array.from(departmentSet).map(dept => [dept, dept])),
      statusMap: new Map([['active', t('payroll:entries_table.status.active')]]), // 薪资状态映射
      personnelCategoryMap: new Map(Array.from(personnelCategorySet).map(cat => [cat, cat])),
    };
  }, [allPayrollEntries, t]);

  const { getColumnSearch } = useTableSearch();

  // 获取人员类别树形数据
  const fetchPersonnelCategoriesTree = useCallback(async () => {
    try {
      const response = await getPersonnelCategoriesTree(true); // Only get active categories
      setPersonnelCategoriesTree(response.data);
    } catch (error) {
      // Not showing error message to user as this is not critical for the main functionality
    }
  }, []);

  // 获取薪资记录数据
  const fetchPayrollEntries = useCallback(async (periodId: number) => {
    if (!periodId) return;
    
    setLoadingData(true);
    try {
      const requestParams = { 
        page: 1, 
        size: 100, 
        include_employee_details: true,
        period_id: periodId 
      };
      
      const response = await getPayrollEntries(requestParams);
      
      if (response && response.data) {
        
        // 详细检查前3条数据的结构
        response.data.slice(0, 3).forEach((entry, index) => {
            console.log(`Entry ${index + 1} structure:`, {
                id: entry.id,
                employee_id: entry.employee_id,
                employee_first_name: entry.employee_first_name,
                employee_last_name: entry.employee_last_name,
                employee_first_name_type: typeof entry.employee_first_name,
                employee_last_name_type: typeof entry.employee_last_name,
                has_employee_object: !!entry.employee,
                employee_object_keys: entry.employee ? Object.keys(entry.employee) : 'no employee object',
                all_keys: Object.keys(entry)
            });
        });
        
        setAllPayrollEntries(response.data);
      } else {
        setAllPayrollEntries([]);
      }
    } catch (error) {
      setAllPayrollEntries([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // 创建一个包装函数来适配StandardListPageTemplate的fetchData接口
  const fetchDataWrapper = useCallback(async () => {
    if (selectedPeriodId) {
      await fetchPayrollEntries(selectedPeriodId);
    }
  }, [selectedPeriodId, fetchPayrollEntries]);

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
    if (selectedPeriodId) {
      fetchPayrollEntries(selectedPeriodId); // 重新获取数据
    }
    message.success(t('payroll:entry_page.message.operation_success'));
  };

  // 处理删除单个记录
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    await deletePayrollEntry(Number(entryId));
    if (selectedPeriodId) {
      fetchPayrollEntries(selectedPeriodId); // 重新获取数据
    }
  }, [selectedPeriodId, fetchPayrollEntries]);

  // 处理查看详情
  const handleViewDetails = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
    setIsDetailModalVisible(true);
  }, []);

  // 处理薪资周期选择变化
  const handlePeriodChange = (value: number | null) => {
    setSelectedPeriodId(value);
  };

  // 薪资周期加载完成的回调（现在由组件内部自动选择有数据的周期）
  const handlePeriodsLoaded = useCallback((periods: any[]) => {
    // 不再手动选择第一个周期，由 PayrollPeriodSelector 自动选择最近一个有数据的周期
  }, []);

  // 当选择的周期改变时，重新获取数据
  useEffect(() => {
    if (selectedPeriodId) {
      fetchPayrollEntries(selectedPeriodId);
    } else {
      setAllPayrollEntries([]); // 如果没有选择周期，清空数据
    }
  }, [selectedPeriodId, fetchPayrollEntries]);

  // 初始化时获取人员类别数据
  useEffect(() => {
    fetchPersonnelCategoriesTree();
  }, [fetchPersonnelCategoriesTree]);

  // 调试：监控传递给表格的数据变化
  useEffect(() => {
    console.log('Table data debugging:', {
      allPayrollEntriesLength: allPayrollEntries.length,
      loadingData,
      selectedPeriodId,
      lookupMapsKeys: lookupMaps ? Object.keys(lookupMaps) : 'no lookupMaps',
      lookupMapsHasData: lookupMaps && Object.keys(lookupMaps).length > 0,
      departmentMapSize: lookupMaps?.departmentMap?.size || 0,
      statusMapSize: lookupMaps?.statusMap?.size || 0,
      firstEntryStructure: allPayrollEntries.length > 0 ? {
        id: allPayrollEntries[0].id,
        employee_id: allPayrollEntries[0].employee_id,
        employee_first_name: allPayrollEntries[0].employee_first_name,
        employee_last_name: allPayrollEntries[0].employee_last_name,
        employee_first_name_type: typeof allPayrollEntries[0].employee_first_name,
        employee_last_name_type: typeof allPayrollEntries[0].employee_last_name,
        all_keys: Object.keys(allPayrollEntries[0])
      } : 'no entries'
    });

    // 🚀 额外调试：检查即将传递给StandardListPageTemplate的数据
    if (allPayrollEntries.length > 0) {
      console.log('StandardListPageTemplate data debugging:', {
        dataSourceLength: allPayrollEntries.length,
        lookupMapsDetails: {
          departmentMapSize: lookupMaps?.departmentMap?.size,
          statusMapSize: lookupMaps?.statusMap?.size,
          hasData: lookupMaps && Object.keys(lookupMaps).length > 0
        },
        loadingData,
        permissions,
        firstEntryEmployeeData: {
          employee_first_name: allPayrollEntries[0].employee?.first_name,
          employee_last_name: allPayrollEntries[0].employee?.last_name
        }
      });
    }
  }, [allPayrollEntries, loadingData, selectedPeriodId]);

  return (
    <>
      <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_VIEW]}>
        {/* 薪资周期选择器 */}
        <PayrollPeriodSelector
          value={selectedPeriodId}
          onChange={handlePeriodChange}
          onPeriodsLoaded={handlePeriodsLoaded}
          mode="card"
          showSelectedStatus={true}
          showDataStats={true}
          autoSelectLatestWithData={true}
          style={{ maxWidth: 400, marginBottom: 16 }}
        />

        <StandardListPageTemplate<PayrollEntry>
          translationNamespaces={['payroll', 'common', 'employee']}
          pageTitleKey="payroll:entry_page.title"
          addButtonTextKey="payroll:entry_page.button.add_entry"
          dataSource={allPayrollEntries}
          loadingData={loadingData}
          permissions={permissions}
          lookupMaps={lookupMaps}
          loadingLookups={false}
          errorLookups={null}
          fetchData={fetchDataWrapper}
          deleteItem={handleDeleteEntry}
          onAddClick={handleAddEntry}
          onEditClick={handleEditEntry}
          onViewDetailsClick={handleViewDetails}
          generateTableColumns={generatePayrollEntryTableColumns}
          deleteConfirmConfig={{
            titleKey: 'payroll:entry_page.delete_confirm.title',
            contentKey: 'payroll:entry_page.delete_confirm.content',
            okTextKey: 'payroll:entry_page.delete_confirm.ok_text',
            cancelTextKey: 'payroll:entry_page.delete_confirm.cancel_text',
            successMessageKey: 'payroll:entry_page.message.delete_success',
            errorMessageKey: 'payroll:entry_page.message.delete_failed',
          }}
          exportConfig={{
            filenamePrefix: t('payroll:entry_page.title'),
            sheetName: t('payroll:entry_page.title'),
            buttonText: t('payroll:auto_excel_e5afbc'),
            successMessage: t('payroll:auto_text_e896aa'),
          }}
          lookupErrorMessageKey="payroll:entry_page.message.load_aux_data_failed"
          lookupLoadingMessageKey="payroll:entry_page.loading_lookups"
          lookupDataErrorMessageKey="payroll:entry_page.lookup_data_error"
          rowKey="id"
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

      {isDetailModalVisible && (
        <PayrollEntryDetailModal
          visible={isDetailModalVisible}
          entryId={selectedEntryId}
          onClose={() => {
            setIsDetailModalVisible(false);
            setSelectedEntryId(null);
          }}
        />
      )}
    </>
  );
};

export default PayrollEntryPage; 