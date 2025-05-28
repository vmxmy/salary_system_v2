import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Tooltip, Button, Space, Modal, message } from 'antd';
import { DatabaseOutlined, LoadingOutlined, FileAddOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import type { PayrollPeriod } from '../types/payrollTypes';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod,
  getPayrollRuns
} from '../services/payrollApi';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { getPayrollPeriodStatusOptions, type DynamicStatusOption } from '../utils/dynamicStatusUtils';
import { getPayrollPeriodNameTranslation } from '../utils/payrollFormatUtils';
import { useLookupMaps } from '../../../hooks/useLookupMaps';
import TableActionButton from '../../../components/common/TableActionButton';
import { stringSorter, numberSorter, dateSorter, useTableSearch } from '../../../components/common/TableUtils';
import StatusTag from '../../../components/common/StatusTag';
import PayrollPeriodFormModal from '../components/PayrollPeriodFormModal';

// 薪资周期权限钩子
const usePayrollPeriodPermissions = () => {
  return useMemo(() => ({
    canViewList: true,
    canViewDetail: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canExport: true,
  }), []);
};

// 生成薪资周期表格列配置的函数
const generatePayrollPeriodTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PayrollPeriod) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (period: PayrollPeriod) => void,
  onDelete: (periodId: string) => void,
  onViewDetails: (periodId: string) => void,
  statusOptions: DynamicStatusOption[],
  periodDataStats: Record<number, { count: number; loading: boolean }>
): ProColumns<PayrollPeriod>[] => {
  const columns: ProColumns<PayrollPeriod>[] = [
    {
      title: t('payroll_periods_page.table.column_id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      width: 80,
      valueType: 'digit',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_period_name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      width: 200,
      valueType: 'text',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>{record.name}</span>
      ),
      ...getColumnSearch('name'),
    },
    {
      title: t('payroll_periods_page.table.column_frequency'),
      dataIndex: 'frequency_lookup_value_id',
      key: 'frequency',
      render: (_, record) => {
        // 使用lookup映射显示频率
        return lookupMaps?.payFrequencyMap?.get(record.frequency_lookup_value_id as number) || '-';
      },
      filters: lookupMaps?.payFrequencyMap ?
        Array.from(lookupMaps.payFrequencyMap.entries()).map((entry: any) => ({
          text: entry[1],
          value: entry[0],
        })) : [],
      onFilter: (value, record) => record.frequency_lookup_value_id === value,
    },
    {
      title: t('payroll_periods_page.table.column_start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      sorter: (a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime(),
      width: 130,
      valueType: 'date',
      render: (_, record) => record.start_date ? format(new Date(record.start_date), 'yyyy-MM-dd') : '',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      sorter: (a, b) => new Date(a.end_date || '').getTime() - new Date(b.end_date || '').getTime(),
      width: 130,
      valueType: 'date',
      render: (_, record) => record.end_date ? format(new Date(record.end_date), 'yyyy-MM-dd') : '',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_pay_date'),
      dataIndex: 'pay_date',
      key: 'pay_date',
      sorter: (a, b) => new Date(a.pay_date || '').getTime() - new Date(b.pay_date || '').getTime(),
      width: 130,
      valueType: 'date',
      render: (_, record) => record.pay_date ? format(new Date(record.pay_date), 'yyyy-MM-dd') : '',
      search: false,
    },
    {
      title: t('payroll_periods_page.table.column_status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = statusOptions.find(opt => opt.id === record.status_lookup_value_id);
        if (!status) return '-';
        
        // 根据状态名称确定状态类型
        let statusType: 'active' | 'inactive' | 'pending' = 'active';
        if (status.name.includes('关闭') || status.name.includes('完成')) {
          statusType = 'inactive';
        } else if (status.name.includes('草稿') || status.name.includes('计划')) {
          statusType = 'pending';
        }
        
        return <StatusTag status={statusType} />;
      },
      filters: statusOptions.map(option => ({
        text: option.name,
        value: option.id,
      })),
      onFilter: (value, record) => record.status_lookup_value_id === value,
    },
    {
      title: '员工人数',
      dataIndex: 'data_stats',
      key: 'data_stats',
      width: 120,
      align: 'center',
      valueType: 'text',
      render: (_, record) => {
        const dataStats = periodDataStats[record.id];
        const isLoadingStats = dataStats?.loading ?? true;
        const recordCount = dataStats?.count ?? 0;
        
        if (isLoadingStats) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <LoadingOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#1890ff' }}>统计中</span>
            </div>
          );
        } else if (recordCount > 0) {
          return (
            <Tooltip title={`该薪资周期共有 ${recordCount} 个员工的薪资记录`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <DatabaseOutlined style={{ fontSize: '14px', color: '#52c41a' }} />
                <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: '500' }}>
                  {recordCount}人
                </span>
              </div>
            </Tooltip>
          );
        } else {
          return (
            <Tooltip title="该薪资周期暂无员工薪资记录">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <FileAddOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>无数据</span>
              </div>
            </Tooltip>
          );
        }
      },
      search: false,
    },
    {
      title: t('common:action.title'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: PayrollPeriod) => (
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

const PayrollPeriodsPageV2: React.FC = () => {
  const { t } = useTranslation(['payroll', 'pageTitle', 'common']);
  const permissions = usePayrollPeriodPermissions();
  const { lookupMaps, loadingLookups, errorLookups } = useLookupMaps();
  const navigate = useNavigate();
  
  // 状态管理
  const [dataSource, setDataSource] = useState<PayrollPeriod[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [statusOptions, setStatusOptions] = useState<DynamicStatusOption[]>([]);
  const [periodDataStats, setPeriodDataStats] = useState<Record<number, { count: number; loading: boolean }>>({});
  
  // 表单模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod | null>(null);

  // 加载状态选项
  useEffect(() => {
    const loadStatusOptions = async () => {
      try {
        const options = await getPayrollPeriodStatusOptions();
        setStatusOptions(options);
      } catch (error) {
        console.error('Failed to load status options:', error);
      }
    };
    loadStatusOptions();
  }, []);

  // 获取薪资周期数据统计
  const fetchPeriodDataStats = useCallback(async (periodIds: number[]) => {
    console.log('🔍 开始获取薪资周期数据统计...');
    
    // 初始化加载状态
    const initialStats: Record<number, { count: number; loading: boolean }> = {};
    periodIds.forEach(id => {
      initialStats[id] = { count: 0, loading: true };
    });
    setPeriodDataStats(initialStats);
    
    // 并发获取所有周期的数据统计
    const statsPromises = periodIds.map(async (periodId) => {
      try {
        console.log(`📊 获取周期 ${periodId} 的数据统计...`);
        
        const runsResponse = await getPayrollRuns({
          period_id: periodId,
          size: 100
        });
        
        let totalCount = 0;
        
        if (runsResponse.data && runsResponse.data.length > 0) {
          totalCount = runsResponse.data.reduce((sum, run) => {
            return sum + (run.total_employees || 0);
          }, 0);
        }
        
        console.log(`📊 周期 ${periodId} 有 ${totalCount} 个员工的薪资记录`);
        return { periodId, count: totalCount };
      } catch (error) {
        console.error(`❌ 获取周期 ${periodId} 数据统计失败:`, error);
        return { periodId, count: 0 };
      }
    });
    
    try {
      const results = await Promise.all(statsPromises);
      
      const newStats: Record<number, { count: number; loading: boolean }> = {};
      results.forEach(({ periodId, count }) => {
        newStats[periodId] = { count, loading: false };
      });
      
      setPeriodDataStats(newStats);
      console.log('✅ 薪资周期数据统计获取完成:', newStats);
    } catch (error) {
      console.error('❌ 获取薪资周期数据统计失败:', error);
      const errorStats: Record<number, { count: number; loading: boolean }> = {};
      periodIds.forEach(id => {
        errorStats[id] = { count: 0, loading: false };
      });
      setPeriodDataStats(errorStats);
    }
  }, []);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await getPayrollPeriods({
        page: 1,
        size: 100,
      });
      
      if (response.data && response.data.length > 0) {
        setDataSource(response.data);
        // 获取数据统计
        const periodIds = response.data.map(p => p.id);
        fetchPeriodDataStats(periodIds);
      } else {
        setDataSource([]);
      }
    } catch (error) {
      console.error('Failed to fetch payroll periods:', error);
      message.error(t('payroll_periods_page.message.get_periods_failed'));
      setDataSource([]);
    } finally {
      setLoadingData(false);
    }
  }, [t, fetchPeriodDataStats]);

  // 删除项目
  const deleteItem = useCallback(async (id: string) => {
    await deletePayrollPeriod(Number(id));
  }, []);

  // 处理新增
  const handleAddClick = useCallback(() => {
    setCurrentPeriod(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑
  const handleEditClick = useCallback((period: PayrollPeriod) => {
    setCurrentPeriod(period);
    setIsModalVisible(true);
  }, []);

  // 处理查看详情
  const handleViewDetailsClick = useCallback((id: string) => {
    navigate(`/finance/payroll/periods/${id}`);
  }, [navigate]);

  // 表单成功回调
  const handleFormSuccess = useCallback(() => {
    setIsModalVisible(false);
    setCurrentPeriod(null);
    fetchData();
  }, [fetchData]);

  return (
    <PermissionGuard requiredPermissions={[P_PAYROLL_PERIOD_MANAGE]} showError={true}>
      <StandardListPageTemplate<PayrollPeriod>
        translationNamespaces={['payroll', 'pageTitle', 'common']}
        pageTitleKey="pageTitle:payroll_periods"
        addButtonTextKey="payroll_periods_page.button.add_period"
        dataSource={dataSource}
        loadingData={loadingData}
        permissions={permissions}
        lookupMaps={lookupMaps}
        loadingLookups={loadingLookups}
        errorLookups={errorLookups}
        fetchData={fetchData}
        deleteItem={deleteItem}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onViewDetailsClick={handleViewDetailsClick}
        generateTableColumns={(t, getColumnSearch, lookupMaps, permissions, onEdit, onDelete, onViewDetails) =>
          generatePayrollPeriodTableColumns(
            t,
            getColumnSearch,
            lookupMaps,
            permissions,
            onEdit,
            onDelete,
            onViewDetails,
            statusOptions,
            periodDataStats
          )
        }
        deleteConfirmConfig={{
          titleKey: 'payroll_periods_page.delete_confirm.title',
          contentKey: 'payroll_periods_page.delete_confirm.content',
          okTextKey: 'payroll_periods_page.delete_confirm.ok_text',
          cancelTextKey: 'payroll_periods_page.delete_confirm.cancel_text',
          successMessageKey: 'payroll_periods_page.message.delete_success',
          errorMessageKey: 'payroll_periods_page.message.delete_failed',
        }}
        batchDeleteConfig={{
          enabled: true,
          buttonText: '批量删除',
          confirmTitle: '确认批量删除',
          confirmContent: '确定要删除选中的薪资周期吗？此操作不可撤销。',
          confirmOkText: '确定删除',
          confirmCancelText: '取消',
          successMessage: '批量删除成功',
          errorMessage: '批量删除失败',
          noSelectionMessage: '请选择要删除的薪资周期',
        }}
        exportConfig={{
          filenamePrefix: '薪资周期',
          sheetName: '薪资周期',
          buttonText: '导出Excel',
          successMessage: '薪资周期数据导出成功',
        }}
        lookupErrorMessageKey="payroll_periods_page.message.load_aux_data_failed"
        lookupLoadingMessageKey="payroll_periods_page.loading_lookups"
        lookupDataErrorMessageKey="payroll_periods_page.lookup_data_error"
        rowKey="id"
      />

      {isModalVisible && (
        <PayrollPeriodFormModal
          visible={isModalVisible}
          period={currentPeriod}
          onClose={() => {
            setIsModalVisible(false);
            setCurrentPeriod(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </PermissionGuard>
  );
};

export default PayrollPeriodsPageV2;