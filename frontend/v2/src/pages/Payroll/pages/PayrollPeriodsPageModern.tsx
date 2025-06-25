import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Tag, 
  Tooltip, 
  Button, 
  Space, 
  Modal, 
  message, 
  App, 
  Typography,
  Descriptions,
} from 'antd';
import { 
  DatabaseOutlined, 
  FileAddOutlined, 
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Layout components
import { PageLayout, FlexLayout, GridLayout, Box } from '../../../components/Layout';

import ModernCard from '../../../components/common/ModernCard';
import TableActionButton from '../../../components/common/TableActionButton';
import StatusTag from '../../../components/common/StatusTag';
import PayrollPeriodFormModal from '../components/PayrollPeriodFormModal';

import type { PayrollPeriod } from '../types/payrollTypes';
import { 
  getPayrollPeriods, 
  createPayrollPeriod, 
  updatePayrollPeriod, 
  deletePayrollPeriod,
  getPayrollRuns,
} from '../services/payrollApi';
import { P_PAYROLL_PERIOD_MANAGE } from '../constants/payrollPermissions';
import { getPayrollPeriodStatusOptions, type DynamicStatusOption } from '../utils/dynamicStatusUtils';
import { useLookupMaps } from '../../../hooks/useLookupMaps';

const { Title, Text } = Typography;

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

const PayrollPeriodsPageModern: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const lookupMaps = useLookupMaps();
  const permissions = usePayrollPeriodPermissions();

  // 状态管理
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [statusOptions, setStatusOptions] = useState<DynamicStatusOption[]>([]);

  // 表格列定义
  const columns: ProColumns<PayrollPeriod>[] = useMemo(() => [
    {
      title: t('payroll:id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      render: (_, record) => (
        <Text strong className="typography-caption">#{record.id}</Text>
      ),
    },
    {
      title: t('payroll:period_name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      ellipsis: true,
      render: (_, record) => (
        <Text strong>{record.name}</Text>
      ),
    },
    {
      title: t('payroll:frequency'),
      dataIndex: 'frequency_lookup_value_id',
      key: 'frequency',
      width: 120,
      render: (_, record) => {
        const frequency = (lookupMaps as any)?.payFrequencyMap?.get(record.frequency_lookup_value_id as number) || '-';
        return (
          <Tag color="blue" icon={<ClockCircleOutlined />}>
            {frequency}
          </Tag>
        );
      },
    },
    {
      title: t('payroll:period_range'),
      key: 'period_range',
      width: 200,
      render: (_, record) => (
        <Box>
          <Text className="typography-body">
            {dayjs(record.start_date).format('YYYY-MM-DD')}
          </Text>
          <Text type="secondary"> 至 </Text>
          <Text className="typography-body">
            {dayjs(record.end_date).format('YYYY-MM-DD')}
          </Text>
          <br />
          <Text type="secondary" className="typography-caption">
            {dayjs(record.end_date).diff(dayjs(record.start_date), 'day') + 1} 天
          </Text>
        </Box>
      ),
      sorter: (a, b) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix(),
    },
    {
      title: t('common:label.status'),
      dataIndex: 'status_lookup_value_id',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const statusOption = statusOptions.find((opt: any) => opt.value === record.status_lookup_value_id);
        return statusOption ? (
          <StatusTag status={(statusOption as any).type} text={(statusOption as any).label} />
        ) : (
          <Tag>-</Tag>
        );
      },
    },
    {
      title: t('payroll:runs_count'),
      key: 'runs_count',
      width: 100,
      render: (_, record) => (
        <Tooltip title={t('payroll:view_runs')}>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/payroll/periods/${record.id}`)}
          >
            {(record as any).runs_count || 0} 个
          </Button>
        </Tooltip>
      ),
    },
    {
      title: t('common:label.action'),
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <TableActionButton
            icon={<FileAddOutlined />}
            tooltip={t('payroll:create_run')}
            onClick={() => navigate(`/payroll/periods/${record.id}/runs/create`)}
            disabled={!permissions.canCreate}
          />
          <TableActionButton
            type="primary"
            onClick={() => handleEdit(record)}
            disabled={!permissions.canUpdate}
          >
            {t('common:action.edit')}
          </TableActionButton>
          <TableActionButton
            danger
            onClick={() => handleDelete(record)}
            disabled={!permissions.canDelete}
          >
            {t('common:action.delete')}
          </TableActionButton>
        </Space>
      ),
    },
  ], [t, statusOptions, permissions, navigate]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await getPayrollPeriods();
      
      // 为每个周期加载运行数据
      const periodsWithRuns = await Promise.all(
        items.map(async (period) => {
          try {
            const runs = await getPayrollRuns(period.id);
            return { ...period, runs_count: runs.items.length };
          } catch {
            return { ...period, runs_count: 0 };
          }
        })
      );
      
      setPeriods(periodsWithRuns);
    } catch (error) {
      message.error(t('common:message.load_failed'));
      console.error('Load payroll periods failed:', error);
    } finally {
      setLoading(false);
    }
  }, [t, message]);

  // 加载状态选项
  const loadStatusOptions = useCallback(async () => {
    try {
      const options = await getPayrollPeriodStatusOptions();
      setStatusOptions(options);
    } catch (error) {
      console.error('Failed to load status options:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadStatusOptions();
  }, [loadData, loadStatusOptions]);

  // 事件处理
  const handleCreate = useCallback(() => {
    setEditingPeriod(null);
    setModalVisible(true);
  }, []);

  const handleEdit = useCallback((period: PayrollPeriod) => {
    setEditingPeriod(period);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback((period: PayrollPeriod) => {
    modal.confirm({
      title: t('common:confirm.delete_title'),
      content: t('payroll:confirm_delete_period', { name: period.name }),
      okText: t('common:action.confirm'),
      cancelText: t('common:action.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deletePayrollPeriod(period.id);
          message.success(t('common:message.delete_success'));
          loadData();
        } catch (error: any) {
          if (error.response?.data?.detail) {
            message.error(error.response.data.detail);
          } else {
            message.error(t('common:message.delete_failed'));
          }
        }
      },
    });
  }, [t, message, modal, loadData]);

  const handleModalSuccess = useCallback(() => {
    setModalVisible(false);
    setEditingPeriod(null);
    loadData();
  }, [loadData]);

  // 计算统计信息
  const statistics = useMemo(() => {
    const activeCount = periods.filter(p => {
      const status = statusOptions.find((opt: any) => opt.value === p.status_lookup_value_id);
      return status && (status as any).type === 'success';
    }).length;

    const totalRuns = periods.reduce((sum, p) => sum + ((p as any).runs_count || 0), 0);

    return [
      {
        title: t('payroll:total_periods'),
        value: periods.length,
        icon: <CalendarOutlined />,
        color: 'var(--color-primary)',
      },
      {
        title: t('payroll:active_periods'),
        value: activeCount,
        icon: <CheckCircleOutlined />,
        color: 'var(--color-success)',
      },
      {
        title: t('payroll:processing_periods'),
        value: periods.length - activeCount,
        icon: <PlayCircleOutlined />,
        color: 'var(--color-warning)',
      },
      {
        title: t('payroll:total_runs_created'),
        value: totalRuns,
        icon: <DatabaseOutlined />,
        color: 'var(--color-info)',
      },
    ];
  }, [periods, statusOptions, t]);

  // 页面操作按钮
  const headerActions = permissions.canCreate ? (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleCreate}
      className="modern-button"
    >
      {t('payroll:create_period')}
    </Button>
  ) : undefined;

  return (
    <PageLayout
      title={t('payroll:payroll_periods')}
      actions={headerActions}
      showCard={false}
    >
      {/* 统计卡片 */}
      <Box mb="6">
        <GridLayout
          columns={4}
          gap="4"
          colsSm={2}
          colsMd={2}
          colsLg={4}
        >
          {statistics.map((stat, index) => (
            <ModernCard
              key={index}
              title={stat.title}
              icon={stat.icon}
            >
              <FlexLayout align="center" justify="center" p="4">
                <Box
                  className="statistic-value"
                  style={{ 
                    color: stat.color,
                    fontSize: '2rem',
                    fontWeight: 600
                  }}
                >
                  {stat.value}
                </Box>
              </FlexLayout>
            </ModernCard>
          ))}
        </GridLayout>
      </Box>

      {/* 主表格 */}
      <ModernCard>
        <ProTable<PayrollPeriod>
          columns={columns}
          dataSource={periods}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total} ${t('common:items')}`,
          }}
          scroll={{ x: 1200 }}
          search={false}
          options={{
            reload: loadData,
            density: true,
            fullScreen: true,
            setting: true,
          }}
          toolBarRender={() => [
            <Button
              key="refresh"
              onClick={loadData}
              icon={<DatabaseOutlined />}
            >
              {t('common:refresh')}
            </Button>,
          ]}
        />
      </ModernCard>

      {/* 创建/编辑模态框 */}
      <PayrollPeriodFormModal
        visible={modalVisible}
        period={editingPeriod}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </PageLayout>
  );
};

export default PayrollPeriodsPageModern;