import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin, Alert, Typography, Space, Button } from 'antd';
import { ReloadOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMessage } from '../../../hooks/useMessage';
import {
  usePayrollPeriodsView,
  usePayrollRunsView,
  usePayrollEntriesView,
  payrollViewsApi,
  type PayrollSummaryAnalysisView
} from '../hooks';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 薪资仪表板视图页面
 * 使用新的视图API展示薪资数据的统计和分析
 */
const PayrollDashboardView: React.FC = () => {
  const { t } = useTranslation();
  const appMessage = useMessage();
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<PayrollSummaryAnalysisView[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // 使用视图Hooks
  const {
    periods,
    loading: periodsLoading,
    error: periodsError,
    getTotalStats: getPeriodStats,
    refreshPeriods
  } = usePayrollPeriodsView(t, appMessage, { is_active: true });

  const {
    runs,
    loading: runsLoading,
    error: runsError,
    getTotalStats: getRunStats,
    refreshRuns
  } = usePayrollRunsView(t, appMessage, { 
    period_id: selectedPeriodId || undefined,
    autoFetch: false 
  });

  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    getTotalStats: getEntryStats,
    getEarningsBreakdown,
    getDeductionsBreakdown,
    refreshEntries
  } = usePayrollEntriesView(t, appMessage, { 
    period_id: selectedPeriodId || undefined,
    autoFetch: false 
  });

  // 获取汇总分析数据
  const fetchSummaryAnalysis = async (periodId?: number) => {
    setSummaryLoading(true);
    try {
      const data = await payrollViewsApi.getPayrollSummaryAnalysis({
        period_id: periodId,
        limit: 50
      });
      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching summary analysis:', error);
      appMessage.error('获取汇总分析数据失败');
    } finally {
      setSummaryLoading(false);
    }
  };

  // 处理周期选择变化
  const handlePeriodChange = (periodId: number) => {
    setSelectedPeriodId(periodId);
    refreshRuns();
    refreshEntries();
    fetchSummaryAnalysis(periodId);
  };

  // 刷新所有数据
  const handleRefreshAll = () => {
    refreshPeriods();
    if (selectedPeriodId) {
      refreshRuns();
      refreshEntries();
      fetchSummaryAnalysis(selectedPeriodId);
    }
  };

  // 获取统计数据
  const periodStats = getPeriodStats();
  const runStats = getRunStats();
  const entryStats = getEntryStats();
  const earningsBreakdown = getEarningsBreakdown();
  const deductionsBreakdown = getDeductionsBreakdown();

  // 收入明细表格列
  const earningsColumns = [
    {
      title: '收入项目',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
  ];

  // 扣除明细表格列
  const deductionsColumns = [
    {
      title: '扣除项目',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
  ];

  // 转换数据为表格格式
  const earningsTableData = Object.entries(earningsBreakdown).map(([name, amount], index) => ({
    key: index,
    name,
    amount,
  }));

  const deductionsTableData = Object.entries(deductionsBreakdown).map(([name, amount], index) => ({
    key: index,
    name,
    amount,
  }));

  // 部门汇总表格列
  const summaryColumns = [
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (value: string) => value || '未分配部门',
    },
    {
      title: '员工数',
      dataIndex: 'employee_count',
      key: 'employee_count',
    },
    {
      title: '总应发',
      dataIndex: 'total_gross_pay',
      key: 'total_gross_pay',
      render: (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '总实发',
      dataIndex: 'total_net_pay',
      key: 'total_net_pay',
      render: (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '总扣除',
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      render: (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: '平均应发',
      dataIndex: 'avg_gross_pay',
      key: 'avg_gross_pay',
      render: (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题和控制区域 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>
            <BarChartOutlined /> 薪资数据仪表板
          </Title>
          <Text type="secondary">基于视图API的高性能薪资数据展示</Text>
        </Col>
        <Col>
          <Space>
            <Select
              placeholder="选择薪资周期"
              style={{ width: 200 }}
              value={selectedPeriodId}
              onChange={handlePeriodChange}
              loading={periodsLoading}
            >
              {periods.map(period => (
                <Option key={period.id} value={period.id}>
                  {period.name} ({period.status_name})
                </Option>
              ))}
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefreshAll}
              loading={periodsLoading || runsLoading || entriesLoading}
            >
              刷新数据
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 错误提示 */}
      {(periodsError || runsError || entriesError) && (
        <Alert
          message="数据加载错误"
          description={periodsError || runsError || entriesError}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 总体统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃薪资周期"
              value={periodStats.activePeriods}
              suffix={`/ ${periodStats.totalPeriods}`}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="薪资运行总数"
              value={runStats.totalRuns}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="薪资条目总数"
              value={entryStats.totalEntries}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均应发合计"
              value={entryStats.averageGrossPay}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      {/* 当前周期详细统计 */}
      {selectedPeriodId && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总应发合计"
                value={entryStats.totalGrossPay}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总实发合计"
                value={entryStats.totalNetPay}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总扣除金额"
                value={entryStats.totalDeductions}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="个人所得税"
                value={entryStats.totalIncomeTax}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 收入和扣除明细表格 */}
      {selectedPeriodId && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title="收入明细分解" loading={entriesLoading}>
              <Table
                columns={earningsColumns}
                dataSource={earningsTableData}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="扣除明细分解" loading={entriesLoading}>
              <Table
                columns={deductionsColumns}
                dataSource={deductionsTableData}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 部门汇总分析 */}
      {selectedPeriodId && (
        <Card title="部门薪资汇总分析" loading={summaryLoading}>
          <Table
            columns={summaryColumns}
            dataSource={summaryData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个部门`,
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      )}
    </div>
  );
};

export default PayrollDashboardView; 