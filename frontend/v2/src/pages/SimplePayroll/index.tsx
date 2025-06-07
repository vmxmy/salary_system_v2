import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Space, Button, message, Spin, Tag, Tabs, DatePicker, Card, Tooltip, Select, Divider } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, AppstoreOutlined, PlusOutlined, CalendarOutlined, DeleteOutlined, DollarOutlined, TeamOutlined, MinusCircleOutlined, CheckCircleOutlined, CalculatorOutlined, AuditOutlined, RightOutlined, EllipsisOutlined } from '@ant-design/icons';
import { StatisticCard, ProCard } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import GeneratePayrollCard from './components/GeneratePayrollCard';
import AuditPayrollCard from './components/AuditPayrollCard';
import GenerateReportsCard from './components/GenerateReportsCard';
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { usePayrollPeriods } from './hooks/usePayrollPeriods';
import { usePayrollVersions } from './hooks/usePayrollVersions';
import { useAuditSummary } from './hooks/useAuditSummary';
import { simplePayrollApi } from './services/simplePayrollApi';
import type { PayrollPeriodResponse, PayrollRunResponse, PayrollGenerationRequest, AuditSummary } from './types/simplePayroll';
import './styles.less'; // Assuming this file exists and will contain our new styles

const { Header, Content } = Layout;

const SimplePayrollPage: React.FC = () => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const navigate = useNavigate();
  
  // State management
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>();
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For forcing data refresh
  const [activeTab, setActiveTab] = useState('workflow'); // Controls which tab is active
  const [isCreating, setIsCreating] = useState(false);
  const [createPeriodModalVisible, setCreatePeriodModalVisible] = useState(false); // State for a potential create period modal (not implemented in this code)
  const [payrollStats, setPayrollStats] = useState<{
    recordCount: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    loading: boolean;
  }>({
    recordCount: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    loading: false
  });

  // Data fetching hooks for payroll periods and versions
  const {
    periods,
    loading: periodsLoading,
    refetch: refetchPeriods
  } = usePayrollPeriods();

  const {
    versions,
    loading: versionsLoading,
    refetch: refetchVersions
  } = usePayrollVersions(selectedPeriodId);

  // Function to fetch payroll statistics
  const fetchPayrollStats = async (versionId: number) => {
    setPayrollStats(prev => ({ ...prev, loading: true }));
    try {
      console.log('🔍 [fetchPayrollStats] 获取版本统计数据:', versionId);
      const response = await simplePayrollApi.getPayrollVersion(versionId);
      
      if (response.data) {
        const versionData = response.data;
        setPayrollStats({
          recordCount: versionData.total_entries || 0,
          totalGrossPay: Number(Number(versionData.total_gross_pay || 0).toFixed(2)),
          totalDeductions: Number(Number(versionData.total_deductions || 0).toFixed(2)),
          totalNetPay: Number(Number(versionData.total_net_pay || 0).toFixed(2)),
          loading: false
        });
        console.log('✅ [fetchPayrollStats] 统计数据获取成功:', {
          recordCount: versionData.total_entries,
          totalGrossPay: versionData.total_gross_pay,
          totalDeductions: versionData.total_deductions,
          totalNetPay: versionData.total_net_pay
        });
      } else {
        // 如果没有数据，也要重置loading状态
        console.log('⚠️ [fetchPayrollStats] 响应中没有数据');
        setPayrollStats({
          recordCount: 0,
          totalGrossPay: 0,
          totalDeductions: 0,
          totalNetPay: 0,
          loading: false
        });
      }
    } catch (error) {
      console.error('❌ [fetchPayrollStats] 获取工资统计数据失败:', error);
      setPayrollStats({
        recordCount: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        loading: false
      });
    }
  };

  // Fetch stats when version changes
  useEffect(() => {
    if (selectedVersionId) {
      fetchPayrollStats(selectedVersionId);
    } else {
      setPayrollStats({
        recordCount: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        loading: false
      });
    }
  }, [selectedVersionId]);

  // Monitor periods data changes for debugging
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] periods data updated:', {
      count: periods.length,
      loading: periodsLoading,
      firstPeriod: periods[0],
      allPeriods: periods.map(p => ({ id: p.id, name: p.name }))
    });
  }, [periods, periodsLoading]);

  // Temporary disabled audit function placeholder
  const auditSummary: AuditSummary | null = null;
  const refetchAuditSummary = () => {};

  // Smart version selection on initial load or period change if no version is selected
  useEffect(() => {
    if (!versionsLoading && versions.length > 0 && !selectedVersionId) {
      console.log('🚀 [SimplePayrollPage] Forcing selection of first version:', versions[0].id);
      setSelectedVersionId(versions[0].id);
    }
  }, [versionsLoading, versions.length, selectedVersionId]);

  // Get current selected period and version objects
  const currentPeriod = periods.find(p => p.id === selectedPeriodId);
  const currentVersion = versions.find(v => v.id === selectedVersionId);

  // Monitor versions data changes for debugging
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] versions data updated:', {
      count: versions.length,
      loading: versionsLoading,
      selectedPeriodId,
      currentPeriodRunsCount: currentPeriod?.runs_count,
      firstVersion: versions[0],
      allVersions: versions.map(v => ({ id: v.id, status: v.status_name, version: v.version_number }))
    });
  }, [versions, versionsLoading, selectedPeriodId, currentPeriod]);

  // Function to refresh all relevant data
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchPeriods();
    if (selectedPeriodId) {
      refetchVersions();
    }
    if (selectedVersionId) {
      refetchAuditSummary();
      fetchPayrollStats(selectedVersionId); // Also refresh statistics
    }
  };

  // Navigation handler to bulk import page
  const handleNavigateToBulkImport = () => {
    navigate('/payroll/bulk-import');
  };

  // Handler for creating a new period (opens modal)
  const handleCreateNewPeriod = () => {
    setCreatePeriodModalVisible(true);
  };

  const handleCreateFirstVersion = async () => {
    if (!selectedPeriodId || !currentPeriod) {
      message.warning('请先选择一个有效的工资期间');
      return;
    }

    setIsCreating(true);
    try {
      const request: PayrollGenerationRequest = {
        period_id: selectedPeriodId,
        generation_type: 'manual',
        source_data: {
          initial_entries: []
        },
        description: `手动为 ${currentPeriod.name} 创建第一个版本`
      };
      
      await simplePayrollApi.generatePayroll(request);
      message.success('成功创建第一个版本');
      handleRefresh(); // This refreshes periods and versions
    } catch (error: any) {
      message.error(error.message || '创建第一个版本失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteVersion = async (versionId: number) => {
    try {
      await simplePayrollApi.deletePayrollRun(versionId);
      message.success('版本删除成功');
      
      // 如果删除的是当前选中的版本，清除选择
      if (selectedVersionId === versionId) {
        setSelectedVersionId(undefined);
      }
      
      handleRefresh(); // 刷新版本列表
    } catch (error: any) {
      message.error(error.message || '删除版本失败');
    }
  };

  // Handler for quick creating current month's payroll period
  const handleQuickCreateCurrentMonth = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // dayjs month is 0-indexed, so +1 for actual month
      const monthStr = month.toString().padStart(2, '0');

      // Placeholder for API call to create payroll period
      // In a real application, you'd call simplePayrollApi.createPayrollPeriod(...)
      message.success(`正在创建 ${year}年${monthStr}月 薪资周期...`);

      // Refresh period list after creation
      handleRefresh();
    } catch (error) {
      message.error('创建薪资周期失败');
    }
  };

  // Effect to reset version selection when the period changes
  useEffect(() => {
    console.log('🎯 [SimplePayrollPage] Period changed, resetting version selection:', selectedPeriodId);
    setSelectedVersionId(undefined);

    // If a period is selected, trigger version data refetch (handled by usePayrollVersions hook)
    if (selectedPeriodId) {
      console.log('🔄 [SimplePayrollPage] Period switched, triggering version data refresh');
    }
  }, [selectedPeriodId]);

  // Effect to check if selected period has runs, if not, auto-create one
  useEffect(() => {
    const checkAndCreateRun = async () => {
      // 只有在以下条件都满足时才考虑自动创建运行：
      // 1. 有选中的期间ID
      // 2. 有当前期间对象
      // 3. 版本数据加载完成（不在loading状态）
      // 4. 确实没有任何版本数据
      // 5. 当前期间的runs_count为0（从期间数据确认没有运行）
      if (!selectedPeriodId || !currentPeriod || versionsLoading) {
        console.log('🔍 [自动创建运行] 跳过检查:', {
          selectedPeriodId: !!selectedPeriodId,
          currentPeriod: !!currentPeriod,
          versionsLoading
        });
        return;
      }

      // 检查期间本身是否有运行记录
      const periodHasRuns = currentPeriod.runs_count > 0;
      
      console.log('🔍 [自动创建运行] 检查期间运行状态:', {
        periodName: currentPeriod.name,
        periodRunsCount: currentPeriod.runs_count,
        versionsLength: versions.length,
        periodHasRuns,
        shouldCreateRun: !periodHasRuns && versions.length === 0
      });

      // 只有当期间确实没有运行记录，且版本列表也为空时，才创建运行
      if (!periodHasRuns && versions.length === 0) {
        console.log('🚀 [自动创建运行] 期间确实无运行记录，开始自动创建...');
        try {
          const createRunResponse = await simplePayrollApi.createPayrollRun({
            payroll_period_id: selectedPeriodId,
            description: `${currentPeriod.name} 工资运行`
          });

          if (createRunResponse.data) {
            console.log('✅ [自动创建运行] 成功创建工资运行:', createRunResponse.data);
            message.success(`已为 ${currentPeriod.name} 自动创建工资运行`);
            refetchVersions(); // 刷新版本列表
            refetchPeriods(); // 同时刷新期间列表以更新runs_count
          }
        } catch (runError: any) {
          console.error('❌ [自动创建运行] 创建工资运行失败:', runError);
          message.warning(`为 ${currentPeriod.name} 创建工资运行失败: ${runError.message}`);
        }
      } else {
        console.log('ℹ️ [自动创建运行] 无需创建运行:', {
          reason: periodHasRuns ? '期间已有运行记录' : '版本列表不为空'
        });
      }
    };

    // 添加延时确保数据完全加载
    const timer = setTimeout(checkAndCreateRun, 800);
    
    return () => clearTimeout(timer);
  }, [selectedPeriodId, currentPeriod, versions.length, versionsLoading]);

  // Smart version selection logic based on status and latest available version
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] Smart version selection check:', {
      versionsLength: versions.length,
      versionsLoading,
      selectedVersionId,
      selectedPeriodId,
      versions: versions.map(v => ({ id: v.id, status: v.status_name, version: v.version_number }))
    });

    if (!versionsLoading && versions.length > 0 && !selectedVersionId && selectedPeriodId) {
      let targetVersion: PayrollRunResponse | null = null;

             // Priority 1: "已计算" (Calculated) status
       targetVersion = versions.find(v => v.status_name === '已计算') || null;

       // Priority 2: "草稿" (Draft) status if no calculated version
       if (!targetVersion) {
         targetVersion = versions.find(v => v.status_name === '草稿' || v.status_name === 'DRAFT') || null;
       }

      // Priority 3: Latest version (first one in the array) if no calculated or draft
      if (!targetVersion) {
        targetVersion = versions[0];
      }

      console.log('✅ [SimplePayrollPage] Smartly selected version:', {
        selectedId: targetVersion.id,
        status: targetVersion.status_name,
        version: targetVersion.version_number,
        reason: targetVersion.status_name === '已计算' ? '优先选择已计算版本' :
          targetVersion.status_name === '草稿' ? '选择可编辑的草稿版本' : '选择最新版本'
      });

      setSelectedVersionId(targetVersion.id);
    }
  }, [versions, versionsLoading, selectedVersionId, selectedPeriodId]);

  // Main render method
  return (
    <Layout className="simple-payroll-layout">
      {/* Page Header Area */}
      <Header className="payroll-header">
        <div className="header-content">
          <h1 className="header-title">{t('simplePayroll:title')}</h1>
          <p className="header-subtitle">{t('simplePayroll:subtitle')}</p>
        </div>
      </Header>

      {/* Main Content Area */}
      <Content className="payroll-content-area">
        {periodsLoading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {/* Left Column: Controls and Actions */}
            <Col xs={24} lg={8}>
              <Row gutter={[24, 24]}>
                {/* Period and Version Controls Card */}
                <Col span={24}>
                  <Card 
                    title={<span className="typography-title-tertiary">{t('simplePayroll:controls.title')}</span>} 
                    bordered={false} 
                    className="h-full"
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div className="control-group">
                        <label className="control-label">{t('simplePayroll:controls.periodLabel')}</label>
                        <DatePicker
                          picker="month"
                          className="w-full"
                          placeholder={t('simplePayroll:selectPeriodPlaceholder')}
                          value={currentPeriod ? dayjs(currentPeriod.start_date) : null}
                          onChange={async (date) => {
                            if (!date) {
                              setSelectedPeriodId(undefined);
                              return;
                            }
                            const year = date.year();
                            const month = date.month() + 1;
                            const targetName = `${year}年${month.toString().padStart(2, '0')}月`;
                            const matchedPeriod = periods.find(p => p.name.includes(targetName));
                            if (matchedPeriod) {
                              setSelectedPeriodId(matchedPeriod.id);
                            } else {
                              try {
                                const response = await simplePayrollApi.getPayrollPeriods({ year, month, page: 1, size: 10 });
                                if (response.data && response.data.length > 0) {
                                  setSelectedPeriodId(response.data[0].id);
                                  refetchPeriods();
                                } else {
                                  // Auto-create logic remains here
                                }
                              } catch (error) {
                                message.error(t('simplePayroll:errors.fetchPeriodFailed'));
                              }
                            }
                          }}
                          format="YYYY年MM月"
                          disabled={periodsLoading}
                          cellRender={(current, info) => {
                            if (info.type !== 'month') return info.originNode;
                            const currentDate = dayjs(current);
                            const year = currentDate.year();
                            const month = currentDate.month() + 1;
                            const monthPeriods = periods.filter(period => dayjs(period.start_date).year() === year && dayjs(period.start_date).month() + 1 === month);
                            const hasRecord = monthPeriods.length > 0;
                            const hasRuns = monthPeriods.some(p => p.runs_count > 0);
                            const hasEntries = monthPeriods.some(p => p.entries_count > 0);
                            const hasApprovedOrPaid = monthPeriods.some(p => p.status_name === '已审核' || p.status_name === '已支付');
                            let statusClass = 'month-cell-default';
                            if (hasApprovedOrPaid) statusClass = 'month-cell-approved';
                            else if (hasEntries) statusClass = 'month-cell-pending';
                            else if (hasRuns) statusClass = 'month-cell-has-runs';
                            else if (hasRecord) statusClass = 'month-cell-has-period';
                            return <div className={`ant-picker-cell-inner ${statusClass}`}>{info.originNode}</div>;
                          }}
                        />
                      </div>
                      <div className="control-group">
                        <label className="control-label">{t('simplePayroll:controls.versionLabel')}</label>
                        <Select
                          value={selectedVersionId}
                          onChange={setSelectedVersionId}
                          placeholder={t('simplePayroll:controls.versionPlaceholder')}
                          loading={versionsLoading}
                          disabled={!selectedPeriodId || versions.length === 0}
                          className="w-full"
                          optionLabelProp="label"
                          notFoundContent={
                            versionsLoading ? null : (
                              <div className="ant-select-empty-content">
                                {isCreating ? (
                                  <Spin size="small" />
                                ) : (
                                  <>
                                    <span>暂无数据版本</span>
                                    <Button type="link" size="small" onClick={handleCreateFirstVersion}>创建第一个</Button>
                                  </>
                                )}
                              </div>
                            )
                          }
                        >
                          {versions.map(version => (
                            <Select.Option 
                              key={version.id} 
                              value={version.id}
                              label={`v${version.version_number}`}
                            >
                              <div className="version-option">
                                <div className="version-option-label">
                                  <div style={{ fontWeight: 600 }}>{`v${version.version_number}`}</div>
                                  <div className="version-option-time">{dayjs(version.initiated_at).format('MM-DD HH:mm')}</div>
                                </div>
                                <Tag 
                                  color={
                                    version.status_name === '草稿' ? 'orange' :
                                    version.status_name === '已计算' ? 'blue' :
                                    version.status_name === '已审核' ? 'green' :
                                    version.status_name === '已支付' ? 'purple' : 'default'
                                  }
                                  style={{ fontSize: '11px', padding: '0 4px', lineHeight: '16px' }}
                                >
                                  {version.status_name}
                                </Tag>
                              </div>
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                    </Space>
                  </Card>
                </Col>
                
                {/* Quick Actions Card */}
                {selectedPeriodId && (
                  <Col span={24}>
                    <Card 
                      title={<span className="typography-title-tertiary">{t('simplePayroll:quickActions.title')}</span>} 
                      bordered={false}
                    >
                       <Space direction="vertical" style={{ width: '100%' }}>
                        <Button onClick={handleNavigateToBulkImport} block>
                          <span className="typography-body-primary">{t('simplePayroll:quickActions.bulkImport')}</span>
                        </Button>
                        <Button block>
                          <span className="typography-body-primary">{t('simplePayroll:quickActions.copyLastMonth')}</span>
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                )}
              </Row>
            </Col>

            {/* Right Column: Workflow and Information */}
            <Col xs={24} lg={16}>
              {!selectedPeriodId ? (
                <Card className="empty-state-card">
                  <div className="empty-state-content">
                    <CalendarOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                    <h2 className="typography-title-tertiary">{t('simplePayroll:emptyState.title')}</h2>
                    <p className="typography-body-secondary">{t('simplePayroll:emptyState.message')}</p>
                  </div>
                </Card>
              ) : (
                <Row gutter={[24, 24]}>
                  {/* Statistics Card - Only show when version is selected */}
                  {selectedVersionId && (
                    <Col span={24}>
                      <ProCard
                        title={
                          <Space>
                            <DollarOutlined />
                            <span className="typography-title-tertiary">{currentPeriod?.name || ''} 工资统计概览</span>
                          </Space>
                        }
                        extra={<EllipsisOutlined />}
                        className="unified-stats-card responsive-stats-card"
                        loading={payrollStats.loading}
                      >
                        {/* 第一行：基础信息和财务信息 */}
                        <ProCard split="vertical" className="stats-row">
                          <ProCard title={<span className="typography-label-primary">基础信息</span>} colSpan="50%">
                            <div className="stat-main-value">
                              <span className="stat-number">{payrollStats.recordCount}</span>
                              <span className="stat-unit">人</span>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div className="stat-details">
                              <div className="detail-item">
                                <span className="detail-label">期间:</span>
                                <span className="detail-value">{currentPeriod?.name || '-'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">状态:</span>
                                <span className="detail-value" style={{ color: '#52c41a' }}>
                                  {currentPeriod?.status_name || '-'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">版本:</span>
                                <span className="detail-value">
                                  v{currentVersion?.version_number || '-'} ({versions.length}个)
                                </span>
                              </div>
                            </div>
                          </ProCard>

                          <ProCard title={<span className="typography-label-primary">财务信息</span>} colSpan="50%">
                            <div className="stat-main-value">
                              <span className="stat-number">¥{payrollStats.totalNetPay.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div className="stat-details">
                              <div className="detail-item">
                                <span className="detail-label">应发:</span>
                                <span className="detail-value" style={{ color: '#52c41a' }}>
                                  ¥{payrollStats.totalGrossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">扣发:</span>
                                <span className="detail-value" style={{ color: '#ff4d4f' }}>
                                  ¥{payrollStats.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">人均:</span>
                                <span className="detail-value">
                                  ¥{payrollStats.recordCount > 0 ? (payrollStats.totalNetPay / payrollStats.recordCount).toFixed(0) : '0'}
                                </span>
                              </div>
                            </div>
                          </ProCard>
                        </ProCard>

                        {/* 第二行：版本状态和审核状态 */}
                        <ProCard split="vertical" className="stats-row">
                          <ProCard title={<span className="typography-label-primary">版本状态</span>} colSpan="50%">
                            <div className="stat-main-value">
                              <span 
                                className="stat-number"
                                style={{ 
                                  color: 
                                    currentVersion?.status_name === '草稿' ? '#fa8c16' :
                                    currentVersion?.status_name === '已计算' ? '#1890ff' :
                                    currentVersion?.status_name === '已审核' ? '#52c41a' :
                                    currentVersion?.status_name === '已支付' ? '#722ed1' :
                                    '#8c8c8c'
                                }}
                              >
                                {currentVersion?.status_name || '-'}
                              </span>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div className="stat-details">
                              <div className="detail-item">
                                <span className="detail-label">创建:</span>
                                <span className="detail-value">
                                  {currentVersion ? dayjs(currentVersion.initiated_at).format('MM-DD HH:mm') : '-'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">创建人:</span>
                                <span className="detail-value">
                                  {currentVersion?.initiated_by_username || '-'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">频率:</span>
                                <span className="detail-value">
                                  {currentPeriod?.frequency_name || '-'}
                                </span>
                              </div>
                            </div>
                          </ProCard>

                          <ProCard title={<span className="typography-label-primary">审核状态</span>} colSpan="50%">
                            <div className="stat-main-value">
                              <span className="stat-number" style={{ color: '#fa8c16' }}>
                                待审核
                              </span>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div className="stat-details">
                              <div className="detail-item">
                                <span className="detail-label">错误:</span>
                                <span className="detail-value" style={{ color: '#52c41a' }}>
                                  0 个
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">警告:</span>
                                <span className="detail-value" style={{ color: '#52c41a' }}>
                                  0 个
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">可修复:</span>
                                <span className="detail-value" style={{ color: '#52c41a' }}>
                                  0 个
                                </span>
                              </div>
                            </div>
                          </ProCard>
                        </ProCard>
                      </ProCard>
                    </Col>
                  )}
                  
                  {/* Workflow Guide Card */}
                  <Col span={24}>
                    <EnhancedWorkflowGuide 
                      selectedPeriod={currentPeriod || null}
                      selectedVersion={currentVersion || null}
                      auditSummary={auditSummary}
                      onRefresh={handleRefresh}
                      onDeleteVersion={handleDeleteVersion}
                    />
                  </Col>
                  

                </Row>
              )}
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
};

export default SimplePayrollPage; 
