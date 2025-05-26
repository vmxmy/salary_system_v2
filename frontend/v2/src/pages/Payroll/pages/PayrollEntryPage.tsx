import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  DatePicker, 
  Select, 
  Input, 
  Table, 
  Button, 
  Space, 
  Tag, 
  message, 
  Tooltip,
  Typography
} from 'antd';
import { PlusOutlined, ImportOutlined, FileExcelOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../../components/common/PageLayout';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { P_PAYROLL_ENTRY_VIEW, P_PAYROLL_ENTRY_EDIT_DETAILS, P_PAYROLL_ENTRY_BULK_IMPORT } from '../constants/payrollPermissions';
import { getPayrollPeriods, getPayrollEntries } from '../services/payrollApi';
import type { PayrollPeriod, PayrollEntry, ApiListMeta } from '../types/payrollTypes';
import { getPayrollEntryStatusInfo } from '../utils/payrollUtils';
import { employeeService } from '../../../services/employeeService';
import PayrollEntryFormModal from '../components/PayrollEntryFormModal';
import dayjs from 'dayjs';
import { 
  useTableSearch, 
  stringSorter, 
  numberSorter, 
  useTableExport,
} from '../../../components/common/TableUtils';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;
const { YearPicker, MonthPicker } = DatePicker;

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

  const { getColumnSearch } = useTableSearch();

  // 获取薪资周期
  const fetchPayrollPeriods = useCallback(async () => {
    try {
      console.log('[PayrollEntryPage:fetchPayrollPeriods] Started fetching payroll periods');
      const response = await getPayrollPeriods();
      console.log('[PayrollEntryPage:fetchPayrollPeriods] Success', response);
      setPeriods(response.data);
      // 如果有数据，默认选择最新的薪资周期
      if (response.data.length > 0) {
        setSelectedPeriodId(response.data[0].id);
      }
    } catch (error) {
      console.error('[PayrollEntryPage:fetchPayrollPeriods] Failed', error);
      message.error(t('payroll:entry_page.error_fetch_periods'));
    }
  }, [t]);

  // 获取工资明细列表
  const fetchPayrollEntries = useCallback(async (page = 1, size = 10, periodId?: number | null, currentSorter?: any) => {
    if (!periodId) {
      console.warn('[PayrollEntryPage:fetchPayrollEntries] No period ID specified');
      setEntries([]);
      setMeta(null);
      return;
    }
    
    setLoading(true);
    try {
      const params: any = {
        page,
        size,
        include_employee_details: true,
      };

      if (currentSorter && currentSorter.field) {
        let fieldKey = currentSorter.field;
        if (Array.isArray(fieldKey)) {
          fieldKey = fieldKey.join('.');
        }
        if (fieldKey === 'employee_name') {
          params.sort_by = 'employee_name';
        } else {
          params.sort_by = fieldKey;
        }
        params.sort_order = currentSorter.order === 'descend' ? 'desc' : 'asc';
      }
      
      if (periodId) {
        params.payroll_period_id = periodId;
      }
      
      console.log('[PayrollEntryPage:fetchPayrollEntries] Started with params:', params);
      const response = await getPayrollEntries(params);
      console.log('[PayrollEntryPage:fetchPayrollEntries] Success:', response);
      
      // 显示每个条目的状态ID，帮助调试
      if (response.data && response.data.length > 0) {
        console.log('[PayrollEntryPage:fetchPayrollEntries] Entry status list:');
        response.data.forEach(entry => {
          console.log(`Entry ID: ${entry.id}, Employee ID: ${entry.employee_id}, Status ID: ${entry.status_lookup_value_id}`);
        });
      }
      
      setEntries(response.data);
      setMeta(response.meta);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error('[PayrollEntryPage:fetchPayrollEntries] Failed:', error);
      message.error(t('payroll:entry_page.error_fetch_entries'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 周期变更时重新获取数据
  useEffect(() => {
    if (selectedPeriodId) {
      fetchPayrollEntries(1, pageSize, selectedPeriodId, sorter);
    } else {
      setEntries([]);
      setMeta(null);
    }
  }, [selectedPeriodId, fetchPayrollEntries, pageSize, sorter]);

  // 组件挂载时获取薪资周期
  useEffect(() => {
    fetchPayrollPeriods();
  }, [fetchPayrollPeriods]);

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

  // 表格列定义
  const columns: any[] = [
    {
      title: t('payroll:entry_page.table.column.employee_id'),
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
      sorter: true,
      ...getColumnSearch('employee_id'),
    },
    {
      title: t('payroll:entry_page.table.column.employee_name'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 180,
      render: (text: string, record: PayrollEntry) => record.employee_name || t('common:notAvailable'),
      sorter: true,
      ...getColumnSearch('employee_name'),
    },
    {
      title: t('payroll:entry_page.table.column.department'),
      key: 'department_name',
      width: 150,
      render: (text: any, record: any) => record.employee?.department_name || t('common:notAvailable'),
    },
    {
      title: t('payroll:entry_page.table.column.position'),
      key: 'position_name',
      width: 150,
      render: (text: any, record: any) => record.employee?.position_name || t('common:notAvailable'),
    },
    {
      title: t('payroll:entry_page.table.column.total_earnings'),
      dataIndex: 'total_earnings',
      key: 'total_earnings',
      width: 120,
      sorter: true,
      render: (text: any) => {
        const num = typeof text === 'number' ? text : Number(text);
        return !isNaN(num) ? num.toFixed(2) : '0.00';
      },
    },
    {
      title: t('payroll:entry_page.table.column.total_deductions'),
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      width: 120,
      render: (text: any) => {
        const num = typeof text === 'number' ? text : Number(text);
        return !isNaN(num) ? num.toFixed(2) : '0.00';
      },
    },
    {
      title: t('payroll:entry_page.table.column.net_pay'),
      dataIndex: 'net_pay',
      key: 'net_pay',
      width: 120,
      render: (text: any) => {
        const num = typeof text === 'number' ? text : Number(text);
        return !isNaN(num) ? num.toFixed(2) : '0.00';
      },
    },
    {
      title: t('payroll:entry_page.table.column.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      render: (statusId: number) => {
        const statusInfo = getPayrollEntryStatusInfo(statusId);
        const statusText = statusInfo.key.startsWith('status.') 
          ? t(`common:${statusInfo.key}`, statusInfo.params) 
          : t(statusInfo.key, statusInfo.params);
        return <Tag color={statusInfo.color}>{statusText}</Tag>;
      },
    },
    {
      title: t('payroll:entry_page.table.column.actions'),
      key: 'actions',
      width: 120,
      render: (_: any, record: PayrollEntry) => (
        <Space size="small">
          <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_EDIT_DETAILS]}>
            <Tooltip title={t('payroll:entry_page.tooltip.edit_entry')}>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditEntry(record)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const { ExportButton } = useTableExport(
    entries, 
    columns.filter(col => col.key !== 'actions'),
    { 
      filename: t('payroll:entry_page.export.filename', '工资条目导出'),
      sheetName: t('payroll:entry_page.export.sheet_name', '工资条目'),
    }
  );

  const pageTitle = t('payroll:entry_page.title');

  // 处理表格变化事件，用于排序和分页
  const handleTableChange = (pagination: any, filters: any, newSorter: any) => {
    const { current, pageSize: newPageSize } = pagination;
    
    setCurrentPage(current);
    setPageSize(newPageSize);
    setSorter(newSorter);

    fetchPayrollEntries(current, newPageSize, selectedPeriodId, newSorter);
  };

  return (
    <PageLayout
      title={pageTitle}
      actions={
        <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_EDIT_DETAILS]}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddEntry}
              disabled={!selectedPeriodId}
              shape="round"
            >
              {t('payroll:entry_page.button.add_entry')}
            </Button>
            <PermissionGuard requiredPermissions={[P_PAYROLL_ENTRY_BULK_IMPORT]}>
              <Button
                icon={<ImportOutlined />}
                onClick={handleBulkImport}
                shape="round"
              >
                {t('payroll:entry_page.button.batch_import')}
              </Button>
            </PermissionGuard>
            <ExportButton />
          </Space>
        </PermissionGuard>
      }
    >
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Title level={5}>{t('payroll:entry_page.filter.period')}</Title>
            <Select
              placeholder={t('payroll:entry_page.placeholder.select_period')}
              style={{ width: '100%' }}
              loading={loading}
              value={selectedPeriodId}
              onChange={(value) => {
                setSelectedPeriodId(value);
                setCurrentPage(1);
                fetchPayrollEntries(1, pageSize, value, sorter);
              }}
            >
              {periods.map((period) => (
                <Option key={period.id} value={period.id}>
                  {period.name}
                </Option>
              ))}
            </Select>
          </Col>

        </Row>

        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common:table.total_items', { total }),
          }}
          onChange={handleTableChange}
        />

        {isModalVisible && (
          <PayrollEntryFormModal
            visible={isModalVisible}
            payrollPeriodId={selectedPeriodId}
            entry={currentEntry}
            onClose={() => setIsModalVisible(false)}
            onSuccess={handleFormSuccess}
          />
        )}
      </Card>
    </PageLayout>
  );
};

export default PayrollEntryPage; 