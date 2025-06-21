import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin, Alert, Typography, Space, Button, Tag, Steps, Popover, message, Checkbox, Progress } from 'antd';
import { 
  ReloadOutlined, 
  BarChartOutlined, 
  PieChartOutlined, 
  LineChartOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  FileAddOutlined,
  CalculatorOutlined,
  AuditOutlined,
  BankOutlined,
  FileDoneOutlined,
  CheckSquareOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMessage } from '../../../hooks/useMessage';
import {
  usePayrollPeriodsView,
  usePayrollRunsView,
  usePayrollEntriesView,
  payrollViewsApi,
  type PayrollSummaryAnalysisView
} from '../hooks';
import styles from './PayrollDashboard.module.less';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

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
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    dataImported: false,
    dataVerified: false,
    calculationCompleted: false,
    approvalObtained: false,
    bankFileGenerated: false
  });

  // 从本地存储加载清单状态
  useEffect(() => {
    const savedChecklist = localStorage.getItem('payrollChecklist');
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch (e) {
        console.error('Failed to parse saved checklist:', e);
      }
    }
  }, []);

  // 保存清单状态到本地存储
  const saveChecklist = (newChecklist: typeof checklist) => {
    localStorage.setItem('payrollChecklist', JSON.stringify(newChecklist));
    setChecklist(newChecklist);
  };

  // 处理清单项变更
  const handleChecklistChange = (key: string, checked: boolean) => {
    const newChecklist = { ...checklist, [key]: checked };
    saveChecklist(newChecklist);
  };

  // 处理全选/取消全选
  const handleCheckAll = (checked: boolean) => {
    const newChecklist = Object.keys(checklist).reduce((acc, key) => {
      acc[key] = checked;
      return acc;
    }, {} as typeof checklist);
    saveChecklist(newChecklist);
  };

  // 检查是否全部完成
  const isAllChecked = Object.values(checklist).every(v => v);
  // 检查是否部分完成
  const isSomeChecked = Object.values(checklist).some(v => v) && !isAllChecked;

  // 薪资流程步骤定义
  const payrollSteps = [
    {
      title: '创建周期',
      description: '创建新的薪资周期',
      icon: <FileAddOutlined />,
      status: 'finish',
      content: '创建薪资周期是薪资处理的第一步，需要设置周期名称、开始和结束日期等基本信息。'
    },
    {
      title: '数据录入',
      description: '录入薪资基础数据',
      icon: <SyncOutlined />,
      status: 'finish',
      content: '在此阶段，需要录入或导入员工的考勤、加班、奖金等基础数据。'
    },
    {
      title: '薪资计算',
      description: '执行薪资计算',
      icon: <CalculatorOutlined />,
      status: 'process',
      content: '系统根据配置的薪资规则和导入的基础数据，自动计算每位员工的薪资。'
    },
    {
      title: '审核确认',
      description: '审核薪资数据',
      icon: <AuditOutlined />,
      status: 'wait',
      content: '财务人员和管理层需要审核计算结果，确保数据准确无误。'
    },
    {
      title: '发放薪资',
      description: '执行薪资发放',
      icon: <BankOutlined />,
      status: 'wait',
      content: '完成审核后，系统生成银行代发文件，执行实际的薪资发放操作。'
    }
  ];

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

  // 处理步骤点击事件
  const handleStepClick = (current: number) => {
    setCurrentStep(current);
    message.info(`您点击了"${payrollSteps[current].title}"步骤`);
    // 这里可以根据步骤执行相应的操作，如跳转到对应的功能页面
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 页面标题和控制区域 */}
      <Row justify="space-between" align="middle" className={styles.pageHeader}>
        <Col>
          <Title level={2} className={styles.pageTitle}>
            <BarChartOutlined className={styles.titleIcon} /> 薪资数据仪表板
          </Title>
          <Text type="secondary">基于视图API的高性能薪资数据展示</Text>
        </Col>
        <Col>
          <Space className={styles.controlsContainer} size="middle">
            <Select
              placeholder="选择薪资周期"
              className={styles.periodSelector}
              value={selectedPeriodId}
              onChange={handlePeriodChange}
              loading={periodsLoading}
            >
              {periods.map(period => (
                <Option key={period.id} value={period.id}>
                  {period.name} 
                  <Tag 
                    color={period.status_name === '已完成' ? 'success' : 'processing'} 
                    className={styles.statusTag}
                  >
                    {period.status_name}
                  </Tag>
                </Option>
              ))}
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefreshAll}
              loading={periodsLoading || runsLoading || entriesLoading}
              className={styles.refreshButton}
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
          className={styles.sectionMargin}
        />
      )}

      {/* 总体统计卡片 */}
      <Row gutter={[24, 24]} className={styles.cardGrid}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} hoverable>
            <Statistic
              title="活跃薪资周期"
              value={periodStats.activePeriods}
              suffix={`/ ${periodStats.totalPeriods}`}
              prefix={<PieChartOutlined className={styles.primaryStat} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} hoverable>
            <Statistic
              title="薪资运行总数"
              value={runStats.totalRuns}
              prefix={<LineChartOutlined className={styles.primaryStat} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} hoverable>
            <Statistic
              title="薪资条目总数"
              value={entryStats.totalEntries}
              prefix={<BarChartOutlined className={styles.primaryStat} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.statCard} hoverable>
            <Statistic
              title="平均应发合计"
              value={entryStats.averageGrossPay}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 当前周期详细统计 */}
      {selectedPeriodId && (
        <Row gutter={[24, 24]} className={styles.cardGrid}>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="总应发合计"
                value={entryStats.totalGrossPay}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="总实发合计"
                value={entryStats.totalNetPay}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="总扣除金额"
                value={entryStats.totalDeductions}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#ef4444' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className={styles.statCard} hoverable>
              <Statistic
                title="个人所得税"
                value={entryStats.totalIncomeTax}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 智能流程引导 - 交互式步骤条 */}
      <Card 
        title={
          <div className={styles.cardTitle}>
            <FileDoneOutlined className={styles.cardTitleIcon} />
            <span>智能薪资流程引导</span>
          </div>
        }
        className={`${styles.tableCard} ${styles.sectionMargin}`}
        bordered={false}
      >
        <Steps 
          current={currentStep} 
          onChange={handleStepClick}
          className={styles.workflowSteps}
          labelPlacement="vertical"
        >
          {payrollSteps.map((step, index) => (
            <Step 
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={step.status as any}
            />
          ))}
        </Steps>
        <div className={styles.stepContent}>
          <Popover 
            content={payrollSteps[currentStep].content} 
            title={`${payrollSteps[currentStep].title}步骤说明`}
            trigger="hover"
          >
            <div className={styles.stepDescription}>
              <p>{payrollSteps[currentStep].content}</p>
              <Button type="link">了解更多</Button>
            </div>
          </Popover>
        </div>
      </Card>

      {/* 快捷操作区域 */}
      <Card 
        title={
          <div className={styles.cardTitle}>
            <CalculatorOutlined className={styles.cardTitleIcon} />
            <span>快捷操作</span>
          </div>
        }
        className={`${styles.tableCard} ${styles.sectionMargin}`}
        bordered={false}
      >
        <div className={styles.quickActions}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Button 
                type="primary" 
                size="large" 
                icon={<FileAddOutlined />} 
                className={styles.actionButton}
                block
              >
                批量导入数据
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Button 
                size="large" 
                icon={<CalculatorOutlined />} 
                className={styles.actionButton}
                block
              >
                执行薪资计算
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Button 
                size="large" 
                icon={<AuditOutlined />} 
                className={styles.actionButton}
                block
              >
                审核薪资数据
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Button 
                size="large" 
                icon={<BankOutlined />} 
                className={styles.actionButton}
                block
              >
                生成银行代发文件
              </Button>
            </Col>
          </Row>
        </div>
      </Card>

      {/* 完成要求清单 */}
      <Card 
        title={
          <div className={styles.cardTitle}>
            <CheckSquareOutlined className={styles.cardTitleIcon} />
            <span>薪资处理完成要求</span>
          </div>
        }
        className={`${styles.tableCard} ${styles.sectionMargin}`}
        bordered={false}
        extra={
          <Checkbox 
            indeterminate={isSomeChecked} 
            checked={isAllChecked}
            onChange={(e) => handleCheckAll(e.target.checked)}
          >
            全选
          </Checkbox>
        }
      >
        <div className={styles.checklistContainer}>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Checkbox
                checked={checklist.dataImported}
                onChange={(e) => handleChecklistChange('dataImported', e.target.checked)}
                className={styles.checklistItem}
              >
                <span className={styles.checklistText}>
                  已导入所有员工的基础薪资数据
                </span>
              </Checkbox>
            </Col>
            <Col xs={24} md={12}>
              <Checkbox
                checked={checklist.dataVerified}
                onChange={(e) => handleChecklistChange('dataVerified', e.target.checked)}
                className={styles.checklistItem}
              >
                <span className={styles.checklistText}>
                  已核对所有导入数据的准确性
                </span>
              </Checkbox>
            </Col>
            <Col xs={24} md={12}>
              <Checkbox
                checked={checklist.calculationCompleted}
                onChange={(e) => handleChecklistChange('calculationCompleted', e.target.checked)}
                className={styles.checklistItem}
              >
                <span className={styles.checklistText}>
                  已完成薪资计算并检查计算结果
                </span>
              </Checkbox>
            </Col>
            <Col xs={24} md={12}>
              <Checkbox
                checked={checklist.approvalObtained}
                onChange={(e) => handleChecklistChange('approvalObtained', e.target.checked)}
                className={styles.checklistItem}
              >
                <span className={styles.checklistText}>
                  已获得管理层对薪资数据的审批
                </span>
              </Checkbox>
            </Col>
            <Col xs={24} md={12}>
              <Checkbox
                checked={checklist.bankFileGenerated}
                onChange={(e) => handleChecklistChange('bankFileGenerated', e.target.checked)}
                className={styles.checklistItem}
              >
                <span className={styles.checklistText}>
                  已生成银行代发文件并确认无误
                </span>
              </Checkbox>
            </Col>
          </Row>
          <div className={styles.checklistSummary}>
            <Progress 
              percent={Math.round(Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length * 100)} 
              status="active" 
              strokeColor={{
                '0%': '#3b82f6',
                '100%': '#10b981',
              }}
            />
            <div className={styles.checklistStatus}>
              {isAllChecked ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>所有要求已完成</Tag>
              ) : (
                <Tag color="processing" icon={<SyncOutlined spin />}>处理中</Tag>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 收入和扣除明细表格 */}
      {selectedPeriodId && (
        <Row gutter={[24, 24]} className={styles.cardGrid}>
          <Col xs={24} lg={12}>
            <Card 
              title="收入明细分解" 
              loading={entriesLoading}
              className={styles.tableCard}
              bordered={false}
            >
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
            <Card 
              title="扣除明细分解" 
              loading={entriesLoading}
              className={styles.tableCard}
              bordered={false}
            >
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
        <Card 
          title="部门薪资汇总分析" 
          loading={summaryLoading}
          className={styles.tableCard}
          bordered={false}
        >
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