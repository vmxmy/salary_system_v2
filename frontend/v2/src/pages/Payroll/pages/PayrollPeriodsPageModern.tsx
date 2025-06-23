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
  Row,
  Col,
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

import ModernPageTemplate from '../../../components/common/ModernPageTemplate';
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
        <div>
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
        </div>
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
      align: 'center',
      render: (_, record) => (
        <Tooltip title={t('payroll:associated_runs')}>
          <Space>
            <DatabaseOutlined style={{ color: 'var(--color-info)' }} />
            <Text strong style={{ color: 'var(--color-info)' }}>
              {(record as any).runs_count || 0}
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: t('common:action.title'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <TableActionButton
            actionType="view"
            onClick={() => handleViewDetails(record.id.toString())}
            tooltipTitle={t('common:view')}
          />
          {permissions.canUpdate && (
            <TableActionButton
              actionType="edit"
              onClick={() => handleEdit(record)}
              tooltipTitle={t('common:edit')}
            />
          )}
          {permissions.canDelete && (
            <TableActionButton
              actionType="delete"
              onClick={() => handleDelete(record.id.toString())}
              tooltipTitle={t('common:delete')}
              danger
            />
          )}
        </Space>
      ),
    },
  ], [t, lookupMaps, statusOptions, permissions]);

  // 数据加载
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [periodsResponse, statusOptionsData] = await Promise.all([
        getPayrollPeriods(),
        getPayrollPeriodStatusOptions(),
      ]);
      
      const periodsData = Array.isArray(periodsResponse) ? periodsResponse : (periodsResponse as any).data || [];
      
      // 为每个周期添加关联的运行次数
      const periodsWithRunCount = await Promise.all(
        periodsData.map(async (period: any) => {
          try {
            const runsResponse = await getPayrollRuns({ period_id: period.id });
            const runsData = Array.isArray(runsResponse) ? runsResponse : (runsResponse as any).data || [];
            return { ...period, runs_count: runsData.length };
          } catch {
            return { ...period, runs_count: 0 };
          }
        })
      );

      setPeriods(periodsWithRunCount);
      setStatusOptions(statusOptionsData);
    } catch (error: any) {
      message.error(t('common:errors.fetch_failed'));
      console.error('Failed to load payroll periods:', error);
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 事件处理函数
  const handleCreate = () => {
    setEditingPeriod(null);
    setModalVisible(true);
  };

  const handleEdit = (period: PayrollPeriod) => {
    setEditingPeriod(period);
    setModalVisible(true);
  };

  const handleViewDetails = (periodId: string) => {
    navigate(`/payroll/periods/${periodId}`);
  };

  const handleDelete = (periodId: string) => {
    modal.confirm({
      title: t('common:confirm_delete'),
      content: t('payroll:confirm_delete_period'),
      onOk: async () => {
        try {
          await deletePayrollPeriod(parseInt(periodId));
          message.success(t('common:delete_success'));
          loadData();
        } catch (error: any) {
          message.error(t('common:delete_failed'));
        }
      },
    });
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    loadData();
  };

  // 统计数据
  const statistics = useMemo(() => {
    const total = periods.length;
    const active = periods.filter(period => {
      const statusOption = statusOptions.find((opt: any) => opt.value === period.status_lookup_value_id);
      return (statusOption as any)?.type === 'success';
    }).length;
    const pending = periods.filter(period => {
      const statusOption = statusOptions.find((opt: any) => opt.value === period.status_lookup_value_id);
      return (statusOption as any)?.type === 'processing';
    }).length;
    const totalRuns = periods.reduce((sum, period) => sum + ((period as any).runs_count || 0), 0);

    return [
      {
        title: t('payroll:total_periods'),
        value: total,
        icon: <CalendarOutlined />,
        color: 'var(--color-primary)',
      },
      {
        title: t('payroll:active_periods'),
        value: active,
        icon: <CheckCircleOutlined />,
        color: 'var(--color-success)',
      },
      {
        title: t('payroll:pending_periods'),
        value: pending,
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

  return (
    <ModernPageTemplate
      title={t('payroll:payroll_periods')}
      headerExtra={
        permissions.canCreate ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="modern-button"
          >
            {t('payroll:create_period')}
          </Button>
        ) : undefined
      }
    >
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <ModernCard
              title={stat.title}
              icon={stat.icon}
            >
              <div className="statistic-content">
                <div className="statistic-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            </ModernCard>
          </Col>
        ))}
      </Row>

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
    </ModernPageTemplate>
  );
};

export default PayrollPeriodsPageModern;