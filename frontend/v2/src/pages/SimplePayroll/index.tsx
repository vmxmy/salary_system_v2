import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Space, Button, message, Spin, Tag, Tabs, DatePicker, Card, Tooltip, Select, Divider, InputNumber, Alert, Typography } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, AppstoreOutlined, PlusOutlined, CalendarOutlined, DeleteOutlined, DollarOutlined, TeamOutlined, MinusCircleOutlined, CheckCircleOutlined, CalculatorOutlined, AuditOutlined, RightOutlined, EllipsisOutlined, ControlOutlined } from '@ant-design/icons';
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
const { Text } = Typography;

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
    
    // 设置5秒超时保护
    const timeoutId = setTimeout(() => {
      console.log('⏰ [fetchPayrollStats] 操作超时，强制重置loading状态');
      setPayrollStats(prev => ({ ...prev, loading: false }));
    }, 5000);
    
    try {
      console.log('🔍 [fetchPayrollStats] 获取版本统计数据:', versionId);
      const response = await simplePayrollApi.getPayrollVersion(versionId);
      
      clearTimeout(timeoutId); // 清除超时定时器
      
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
      clearTimeout(timeoutId); // 清除超时定时器
      setPayrollStats({
        recordCount: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        loading: false
      });
    }
  };

  // Fetch stats and audit data when version changes
  useEffect(() => {
    if (selectedVersionId) {
      fetchPayrollStats(selectedVersionId);
      fetchAuditSummary(selectedVersionId);
    } else {
      setPayrollStats({
        recordCount: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        loading: false
      });
      setAuditSummary(null);
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

  // 自动选择当前月份期间
  useEffect(() => {
    if (!periodsLoading && periods.length > 0 && !selectedPeriodId) {
      const now = dayjs();
      const currentYear = now.year();
      const currentMonth = now.month() + 1; // dayjs month is 0-indexed
      const targetName = `${currentYear}年${currentMonth.toString().padStart(2, '0')}月`;
      
      console.log('🎯 [SimplePayrollPage] 尝试自动选择当前月份期间:', {
        currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
        currentYear,
        currentMonth,
        targetName,
        availablePeriods: periods.map(p => ({ id: p.id, name: p.name }))
      });
      
      // 查找当前月份的期间 - 使用多种匹配方式
      let currentMonthPeriod = periods.find(p => p.name.includes(targetName));
      
      // 如果精确匹配失败，尝试更宽松的匹配
      if (!currentMonthPeriod) {
        const alternativeTargets = [
          `${currentYear}年${currentMonth}月`,  // 不补零的格式
          `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,  // 横线格式
          `${currentYear}-${currentMonth}`,  // 横线不补零格式
        ];
        
        for (const altTarget of alternativeTargets) {
          currentMonthPeriod = periods.find(p => p.name.includes(altTarget));
          if (currentMonthPeriod) {
            console.log('✅ [SimplePayrollPage] 使用备选格式找到期间:', altTarget, currentMonthPeriod);
            break;
          }
        }
      }
      
      if (currentMonthPeriod) {
        console.log('✅ [SimplePayrollPage] 找到当前月份期间，自动选择:', currentMonthPeriod);
        setSelectedPeriodId(currentMonthPeriod.id);
      } else {
        // 如果没有当前月份，选择最新的期间（通常是第一个）
        console.log('⚠️ [SimplePayrollPage] 未找到当前月份期间，选择最新期间:', periods[0]);
        console.log('📋 [SimplePayrollPage] 所有可用期间名称:', periods.map(p => p.name));
        setSelectedPeriodId(periods[0].id);
      }
    }
  }, [periods, periodsLoading]); // 移除selectedPeriodId依赖，避免循环触发

  // Audit summary state management
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Function to fetch audit summary
  const fetchAuditSummary = async (versionId: number) => {
    setAuditLoading(true);
    try {
      console.log('🔍 [fetchAuditSummary] 获取审核汇总数据:', versionId);
      const response = await simplePayrollApi.getAuditSummary(versionId);
      if (response.data) {
        setAuditSummary(response.data);
        console.log('✅ [fetchAuditSummary] 审核汇总获取成功:', response.data);
      } else {
        setAuditSummary(null);
        console.log('ℹ️ [fetchAuditSummary] 没有审核数据');
      }
    } catch (error) {
      console.error('❌ [fetchAuditSummary] 获取审核汇总失败:', error);
      setAuditSummary(null);
    } finally {
      setAuditLoading(false);
    }
  };

  const refetchAuditSummary = () => {
    if (selectedVersionId) {
      fetchAuditSummary(selectedVersionId);
    }
  };

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

  // 手动重置loading状态的函数
  const resetLoadingStates = () => {
    console.log('🔄 [SimplePayrollPage] 手动重置所有loading状态');
    setPayrollStats(prev => ({ ...prev, loading: false }));
    message.info('已重置加载状态');
  };

  // Navigation handler to bulk import page
  const handleNavigateToBulkImport = () => {
    navigate('/payroll/bulk-import');
  };

  // Handler for creating a new period (opens modal)
  const handleCreateNewPeriod = () => {
    setCreatePeriodModalVisible(true);
  };

  // Handler for date change in explicit date selector
  const handleDateChange = async (year: number, month: number) => {
    try {
      const targetName = `${year}年${month.toString().padStart(2, '0')}月`;
      const matchedPeriod = periods.find(p => p.name.includes(targetName));
      
      if (matchedPeriod) {
        setSelectedPeriodId(matchedPeriod.id);
      } else {
        // Try to fetch the period from API
        const response = await simplePayrollApi.getPayrollPeriods({ year, month, page: 1, size: 10 });
        if (response.data && response.data.length > 0) {
          setSelectedPeriodId(response.data[0].id);
          refetchPeriods();
        } else {
          message.warning(`未找到 ${targetName} 的工资期间`);
          setSelectedPeriodId(undefined);
        }
      }
    } catch (error) {
      message.error(t('simplePayroll:errors.fetchPeriodFailed'));
    }
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
            {/* Statistics Card - Full Width - Only show when version is selected */}
            {selectedVersionId && (
              <Col span={24}>
                <StatisticCard.Group
                  title={
                    <Space>
                      <DollarOutlined />
                      <span className="typography-title-tertiary">{currentPeriod?.name || ''} 工资统计概览</span>
                    </Space>
                  }
                  extra={
                    process.env.NODE_ENV === 'development' && payrollStats.loading ? (
                      <Button 
                        size="small" 
                        type="link" 
                        onClick={resetLoadingStates}
                        style={{ color: '#ff4d4f' }}
                      >
                        重置加载状态
                      </Button>
                    ) : null
                  }
                  loading={payrollStats.loading}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <StatisticCard
                        statistic={{
                          title: '基础信息',
                          value: payrollStats.recordCount,
                          suffix: '人',
                          valueStyle: { color: '#1890ff' }
                        }}
                        chart={
                          <div style={{ padding: '8px 0' }}>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              期间: {currentPeriod?.name || '-'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              状态: <span style={{ color: '#52c41a' }}>{currentPeriod?.status_name || '-'}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              版本: v{currentVersion?.version_number || '-'} ({versions.length}个)
                            </div>
                          </div>
                        }
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <StatisticCard
                        statistic={{
                          title: '财务信息',
                          value: payrollStats.totalNetPay,
                          precision: 2,
                          prefix: '¥',
                          valueStyle: { color: '#52c41a' }
                        }}
                        chart={
                          <div style={{ padding: '8px 0' }}>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              应发: <span style={{ color: '#52c41a' }}>¥{payrollStats.totalGrossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              扣发: <span style={{ color: '#ff4d4f' }}>¥{payrollStats.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              人均: ¥{payrollStats.recordCount > 0 ? (payrollStats.totalNetPay / payrollStats.recordCount).toFixed(0) : '0'}
                            </div>
                          </div>
                        }
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <StatisticCard
                        statistic={{
                          title: '版本状态',
                          value: currentVersion?.status_name || '-',
                          valueStyle: { 
                            color: 
                              currentVersion?.status_name === '草稿' ? '#fa8c16' :
                              currentVersion?.status_name === '已计算' ? '#1890ff' :
                              currentVersion?.status_name === '已审核' ? '#52c41a' :
                              currentVersion?.status_name === '已支付' ? '#722ed1' :
                              '#8c8c8c'
                          }
                        }}
                        chart={
                          <div style={{ padding: '8px 0' }}>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              创建: {currentVersion ? dayjs(currentVersion.initiated_at).format('MM-DD HH:mm') : '-'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              创建人: {currentVersion?.initiated_by_username || '-'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              频率: {currentPeriod?.frequency_name || '-'}
                            </div>
                          </div>
                        }
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <StatisticCard
                        statistic={{
                          title: '审核状态',
                          value: auditSummary ? (
                            auditSummary.total_anomalies > 0 ? '有异常' : '通过'
                          ) : (auditLoading ? '检查中' : '待审核'),
                          valueStyle: { 
                            color: auditSummary ? (
                              auditSummary.total_anomalies > 0 ? '#ff4d4f' : '#52c41a'
                            ) : (auditLoading ? '#1890ff' : '#fa8c16')
                          }
                        }}
                        chart={
                          <div style={{ padding: '8px 0' }}>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              错误: <span style={{ color: (auditSummary?.error_count || 0) > 0 ? '#ff4d4f' : '#52c41a' }}>
                                {auditSummary?.error_count || 0} 个
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              警告: <span style={{ color: (auditSummary?.warning_count || 0) > 0 ? '#fa8c16' : '#52c41a' }}>
                                {auditSummary?.warning_count || 0} 个
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              可修复: <span style={{ color: (auditSummary?.auto_fixable_count || 0) > 0 ? '#1890ff' : '#52c41a' }}>
                                {auditSummary?.auto_fixable_count || 0} 个
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </Col>
                  </Row>
                </StatisticCard.Group>
              </Col>
            )}

            {/* 左列：控制面板和快捷操作 */}
            <Col xs={24} sm={24} md={12} lg={8} xl={8}>
              {/* 核心控制 */}
              <ProCard
                title={
                  <Space>
                    <ControlOutlined />
                    {t('simplePayroll:controls.title')}
                  </Space>
                }
                bordered
                style={{ marginBottom: 16 }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* 工资期间选择 */}
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      {t('simplePayroll:controls.period')}
                    </Text>
                    <DatePicker
                      picker="month"
                      value={currentPeriod ? dayjs(currentPeriod.start_date) : dayjs()}
                      onChange={(date) => {
                        if (date) {
                          handleDateChange(date.year(), date.month() + 1);
                        }
                      }}
                      style={{ width: '100%' }}
                      size="large"
                      format="YYYY年MM月"
                      placeholder={t('simplePayroll:controls.selectPeriod')}
                      allowClear={false}
                      className="custom-date-picker"
                    />
                  </div>
                </Space>
              </ProCard>

              {/* 快捷操作 */}
              {selectedPeriodId && (
                <ProCard
                  title={
                    <Space>
                      <AppstoreOutlined />
                      {t('simplePayroll:quickActions.title')}
                    </Space>
                  }
                  bordered
                  style={{ marginBottom: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button 
                      onClick={handleNavigateToBulkImport} 
                      block 
                      size="large"
                      icon={<PlusOutlined />}
                    >
                      {t('simplePayroll:quickActions.bulkImport')}
                    </Button>
                    <Button 
                      block 
                      size="large"
                      icon={<ReloadOutlined />}
                    >
                      {t('simplePayroll:quickActions.copyLastMonth')}
                    </Button>
                  </Space>
                </ProCard>
              )}
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
