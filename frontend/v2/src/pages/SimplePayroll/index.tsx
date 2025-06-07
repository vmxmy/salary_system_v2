import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Space, Button, message, Spin, Tag, Tabs, DatePicker, Card, Tooltip } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, AppstoreOutlined, PlusOutlined, CalendarOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import GeneratePayrollCard from './components/GeneratePayrollCard';
// import AuditPayrollCard from './components/AuditPayrollCard'; // Keep commented as in user's code
// import GenerateReportsCard from './components/GenerateReportsCard'; // Keep commented as in user's code
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';
import { usePayrollPeriods } from './hooks/usePayrollPeriods';
import { usePayrollVersions } from './hooks/usePayrollVersions';
// import { useAuditSummary } from './hooks/useAuditSummary'; // Keep commented as in user's code
import { simplePayrollApi } from './services/simplePayrollApi';
import type { PayrollPeriodResponse, PayrollRunResponse, PayrollGenerationRequest } from './types/simplePayroll';
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
  const auditSummary = null;
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
        {/* Control Panel Card */}
        <Card className="control-panel-card" bordered={false}>
          <Row gutter={[24, 16]} align="middle">
            {/* Payroll Period Selection (DatePicker) */}
            <Col xs={24} sm={12} lg={8} xl={6}>
            <div className="control-group">
                <label className="control-label">工资期间:</label>
                <DatePicker
                  picker="month"
                  className="w-full" // Tailwind CSS for full width
                  placeholder={t('simplePayroll:selectPeriodPlaceholder')}
                  value={(() => {
                    if (!selectedPeriodId) {
                      return null;
                    }

                    const period = periods.find(p => p.id === selectedPeriodId);
                    if (!period) {
                      return null;
                    }

                    // Try to parse date from period name (e.g., "2025年01月")
                    const match = period.name.match(/(\d{4})年(\d{1,2})月/);
                    if (match) {
                      return dayjs(`${match[1]}-${match[2].padStart(2, '0')}-01`);
                    }

                    // Fallback to start_date if name parsing fails
                    if (period.start_date) {
                      return dayjs(period.start_date);
                    }
                    return null;
                  })()}
                  onChange={async (date) => {
                    if (!date) { // User cleared the selection
                      setSelectedPeriodId(undefined);
                      return;
                    }

                    const year = date.year();
                    const month = date.month() + 1; // dayjs months are 0-indexed
                    const targetName = `${year}年${month.toString().padStart(2, '0')}月`;

                    console.log('🗓️ [月份选择] 用户选择:', { year, month, targetName });

                    // First, try to find a matching period in the locally loaded periods
                    let matchedPeriod = periods.find(p => p.name.includes(targetName));

                    if (matchedPeriod) {
                      console.log('✅ [月份选择] 找到本地期间:', matchedPeriod);
                      setSelectedPeriodId(matchedPeriod.id);
                    } else {
                      // If not found locally, call API to search for the period of that year/month
                      try {
                        console.log('🔍 [月份选择] 本地未找到，调用API搜索...');
                        const response = await simplePayrollApi.getPayrollPeriods({
                          year,
                          month,
                          page: 1,
                          size: 10 // Assuming a small page size is sufficient for searching
                        });

                        if (response.data && response.data.length > 0) {
                          const foundPeriod = response.data[0];
                          console.log('✅ [月份选择] API找到期间:', foundPeriod);
                          setSelectedPeriodId(foundPeriod.id);
                          refetchPeriods(); // Trigger refresh to update local periods state with the found period
                          message.success(`找到 ${targetName} 的工资期间`);
                        } else {
                          // 自动创建工资期间
                          console.log('🚀 [月份选择] 未找到期间，开始自动创建...');
                          try {
                            // 计算期间的开始和结束日期
                            const startDate = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`);
                            const endDate = startDate.endOf('month');
                            const payDate = endDate; // 发薪日设为月末

                            const createPeriodResponse = await simplePayrollApi.createPayrollPeriod({
                              name: targetName,
                              start_date: startDate.format('YYYY-MM-DD'),
                              end_date: endDate.format('YYYY-MM-DD'),
                              pay_date: payDate.format('YYYY-MM-DD'),
                              frequency_lookup_value_id: 117 // 假设117是月度频率
                            });

                            if (createPeriodResponse.data) {
                              const newPeriod = createPeriodResponse.data;
                              console.log('✅ [月份选择] 成功创建期间:', newPeriod);
                              
                              // 自动创建工资运行
                              console.log('🚀 [月份选择] 开始为新期间创建工资运行...');
                              try {
                                const createRunResponse = await simplePayrollApi.createPayrollRun({
                                  payroll_period_id: newPeriod.id,
                                  description: `${targetName} 工资运行`
                                });

                                if (createRunResponse.data) {
                                  console.log('✅ [月份选择] 成功创建工资运行:', createRunResponse.data);
                                  message.success(`已自动创建 ${targetName} 的工资期间和运行`);
                                } else {
                                  message.success(`已创建 ${targetName} 的工资期间，但创建工资运行失败`);
                                }
                              } catch (runError: any) {
                                console.error('❌ [月份选择] 创建工资运行失败:', runError);
                                message.warning(`已创建 ${targetName} 的工资期间，但创建工资运行失败: ${runError.message}`);
                              }

                              setSelectedPeriodId(newPeriod.id);
                              refetchPeriods(); // 刷新期间列表
                            }
                          } catch (createError: any) {
                            console.error('❌ [月份选择] 创建期间失败:', createError);
                            message.error(`创建 ${targetName} 工资期间失败: ${createError.message}`);
                            setSelectedPeriodId(undefined);
                          }
                        }
                      } catch (error: any) {
                        console.error('❌ [月份选择] API搜索失败:', error);
                        message.error('查找工资期间失败');
                        setSelectedPeriodId(undefined);
                      }
                    }
                  }}
                  format="YYYY年MM月"
                  disabled={periodsLoading}
                  // Custom cell rendering for months to highlight recorded months
                  cellRender={(current, info) => {
                    if (info.type !== 'month') return info.originNode; // Only apply to month cells

                    const currentDate = dayjs(current);
                    const year = currentDate.year();
                    const month = currentDate.month() + 1;

                    // Filter periods that match the current month cell
                    const monthPeriods = periods.filter(period => {
                      const nameMatch = period.name.match(/(\d{4})年(\d{1,2})月/);
                      if (nameMatch) {
                        return parseInt(nameMatch[1]) === year && parseInt(nameMatch[2]) === month;
                      }
                      if (period.start_date) {
                        const periodDate = dayjs(period.start_date);
                        return periodDate.year() === year && periodDate.month() + 1 === month;
                      }
                      return false;
                    });

                    const hasRecord = monthPeriods.length > 0;
                    
                    // 检查是否有工资运行和工资条目
                    const hasRuns = monthPeriods.some(p => p.runs_count > 0);
                    const hasEntries = monthPeriods.some(p => p.entries_count > 0);
                    
                    // 检查审批状态 - 是否有已审核或已支付的期间
                    const hasApprovedOrPaid = monthPeriods.some(p => 
                      p.status_name === '已审核' || p.status_name === '已支付'
                    );

                    // 调试日志
                    if (monthPeriods.length > 0) {
                      console.log(`📅 [月份${month}] 状态分析:`, {
                        hasRecord,
                        hasRuns,
                        hasEntries,
                        hasApprovedOrPaid,
                        periods: monthPeriods.map(p => ({
                          name: p.name,
                          status: p.status_name,
                          runs_count: p.runs_count,
                          entries_count: p.entries_count
                        }))
                      });
                    }

                    // 确定月份状态和样式 - 按照5级递进
                    let monthStatus = 'no-period-no-run'; // 1. 没有周期也没有运行
                    let statusColor = 'transparent'; // 透明背景
                    let textColor = '#bfbfbf'; // 灰色文字
                    
                    if (hasRecord && hasRuns && hasEntries && hasApprovedOrPaid) {
                      // 5. 有周期有运行有工资记录完成审批：深绿色
                      monthStatus = 'approved-complete';
                      statusColor = '#52c41a'; // 深绿色
                      textColor = '#ffffff'; // 白色文字
                    } else if (hasRecord && hasRuns && hasEntries) {
                      // 4. 有周期有运行有工资记录，未完成审批：浅绿色
                      monthStatus = 'has-entries-pending';
                      statusColor = '#b7eb8f'; // 浅绿色
                      textColor = '#389e0d'; // 深绿色文字
                    } else if (hasRecord && hasRuns) {
                      // 3. 有周期有运行，没有工资记录：浅黄色
                      monthStatus = 'has-runs-no-entries';
                      statusColor = '#fff7e6'; // 浅黄色
                      textColor = '#d48806'; // 黄色文字
                    } else if (hasRecord) {
                      // 2. 有周期没有运行：文字黑色
                      monthStatus = 'has-period-no-run';
                      statusColor = 'transparent'; // 透明背景
                      textColor = '#000000'; // 黑色文字
                    }

                    // Tooltip content for detailed information
                    const tooltipContent = hasRecord ?
                      (
                        <div>
                          <strong>{year}年{month.toString().padStart(2, '0')}月</strong>
                          {monthPeriods.map((p, idx) => (
                            <div key={idx} style={{ margin: '4px 0' }}>
                              <div>期间: {p.name}</div>
                              <div>运行数: {p.runs_count} | 条目数: {p.entries_count}</div>
                              <Tag color={
                                p.status_name === '草稿' ? 'orange' :
                                p.status_name === '已计算' ? 'blue' :
                                p.status_name === '已审核' ? 'green' :
                                p.status_name === '已支付' ? 'purple' : 'default'
                              }>{p.status_name}</Tag>
                            </div>
                          ))}
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            状态: {
                              monthStatus === 'approved-complete' ? '✅ 已完成审批' :
                              monthStatus === 'has-entries-pending' ? '🔄 待审批' :
                              monthStatus === 'has-runs-no-entries' ? '📊 有运行无数据' :
                              monthStatus === 'has-period-no-run' ? '📅 仅有期间' :
                              '❌ 无数据'
                            }
                          </div>
                        </div>
                      ) :
                        (
                          <div>
                            <strong>{year}年{month.toString().padStart(2, '0')}月</strong>
                            <div style={{ marginTop: '4px', color: '#999' }}>
                              无工资记录，点击可自动创建
                            </div>
                          </div>
                        );

                    const monthNumber = currentDate.format('M');

                    return (
                      <Tooltip title={tooltipContent} placement="top">
                        <div 
                          className={`ant-picker-cell-inner enhanced-month-cell ${monthStatus}`}
                          style={{
                            backgroundColor: statusColor,
                            color: textColor,
                            borderRadius: '6px',
                            padding: '4px',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            border: hasRecord ? `1px solid ${textColor}` : '1px solid transparent'
                          }}
                        >
                          <span style={{ fontWeight: hasRecord ? 'bold' : 'normal' }}>
                            {monthNumber}
                          </span>
                          <span 
                            className="month-circle-icon"
                            style={{ 
                              color: textColor,
                              fontSize: '10px',
                              opacity: 0.8
                            }}
                          >
                            月
                          </span>
                          
                          {/* 状态指示器 */}
                          {hasRecord && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 
                                  monthStatus === 'approved-complete' ? '#ffffff' : // 深绿色背景时用白色指示器
                                  monthStatus === 'has-entries-pending' ? '#52c41a' : // 浅绿色背景时用深绿色指示器
                                  monthStatus === 'has-runs-no-entries' ? '#d48806' : // 浅黄色背景时用黄色指示器
                                  '#000000' // 透明背景时用黑色指示器
                              }}
                            />
                          )}
                        </div>
                      </Tooltip>
                  );
                  }}
                />
            </div>
            </Col>



            {/* Payroll Data Selection (Version Cards) - Only shown if a period is selected */}
            {selectedPeriodId && (
              <Col xs={24} lg={8} xl={12}>
              <div className="control-group">
                  <label className="control-label">工资数据:</label>
                  <div className="payroll-version-cards-container">
                    {versionsLoading ? (
                      // Loading state for versions
                      <div className="loading-versions">
                        <Spin size="small" />
                        <span>正在加载版本数据...</span>
                      </div>
                    ) : versions.length === 0 ? (
                      // No versions placeholder
                      <div className="no-versions-placeholder">
                        <p>暂无工资数据版本</p>
                        {selectedPeriodId && (
                            <Button 
                              onClick={handleCreateFirstVersion} 
                              size="small"
                              loading={isCreating}
                              icon={<PlusOutlined />}
                            >
                                创建第一个版本
                            </Button>
                        )}
                      </div>
                    ) : (
                      // Display payroll versions as cards
                      <div className="version-grid">
                        {versions.map((version, index) => {
                          const isSelected = selectedVersionId === version.id;
                          const isLatest = index === 0; // Assuming the first item is the latest

                          // Helper function to get version label
                          const getVersionLabel = () => {
                            if (isLatest) return "最新版本";
                            if (version.status_name === "已支付") return "已发放版本";
                            if (version.status_name === "已计算") return "待审核版本";
                            return `历史版本 ${version.version_number}`;
                          };

                          // Helper function to get status color (Ant Design Tag colors)
                          const getStatusColor = () => {
                            switch (version.status_name) {
                              case '草稿': return 'orange';
                              case '已计算': return 'blue';
                              case '已审核': return 'green';
                              case '已支付': return 'purple';
                              default: return 'default';
                            }
                          };

                          // Helper function to get status icon (emojis for visual flair)
                          const getStatusIcon = () => {
                            switch (version.status_name) {
                              case '草稿': return '📝';
                              case '已计算': return '🧮';
                              case '已审核': return '✅';
                              case '已支付': return '💰';
                              default: return '📄';
                            }
                          };

                          return (
                            <Card
                              key={version.id}
                              size="small"
                              hoverable // Add hover effect
                              onClick={() => setSelectedVersionId(version.id)}
                              className={`version-card ${isSelected ? 'selected' : ''}`} // Add selected class
                  style={{ 
                                borderColor: isSelected ? getStatusColor() : '#f0f0f0', // Highlight border when selected
                                backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.05)' : '#fff', // Light blue tint for selected background
                                position: 'relative' // 为删除按钮定位
                              }}
                              bodyStyle={{ padding: '12px' }} // Compact card body
                            >
                              {/* 删除按钮 - 只在选中时显示 */}
                              {isSelected && (
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    handleDeleteVersion(version.id);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    color: '#ff4d4f',
                                    zIndex: 1
                                  }}
                                  title="删除版本"
                                />
                              )}
                              
                              <div className="flex items-center gap-2"> {/* Flex for icon and text */}
                                <span className="text-xl">
                                  {getStatusIcon()}
                                </span>
                                <div className="flex-1">
                                  <div className="version-title">
                                    <span className={isSelected ? 'text-blue-600' : 'text-gray-800'}>
                                      {getVersionLabel()}
                                    </span>
                                    {isLatest && <span className="latest-indicator">●</span>} {/* Latest indicator */}
                                    {isSelected && <span className="selected-indicator">✓</span>} {/* Selected indicator */}
                                  </div>
                                  <div className="version-meta">
                                    <span>
                                      {dayjs(version.initiated_at).format('YYYY-MM-DD HH:mm')} {/* Format date/time */}
                                    </span>
                                    <Tag
                                      color={getStatusColor()}
                                      className="version-status-tag"
                                    >
                                      {version.status_name}
                </Tag>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
              </div>
            )}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card>

        {/* Main Content Area - Tabs for Workflow Guide and Feature Cards */}
        <Card className="main-content-card" bordered={false} bodyStyle={{ padding: 0 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'workflow',
                label: (
                  <Space>
                    <ClockCircleOutlined />
                    智能流程引导
                  </Space>
                ),
                children: (
                  <div className="p-6"> {/* Add padding inside tab content */}
                      <EnhancedWorkflowGuide
                      selectedVersion={currentVersion || null}
                      selectedPeriod={currentPeriod || null}
                        auditSummary={auditSummary}
                        onRefresh={handleRefresh}
                        onNavigateToBulkImport={handleNavigateToBulkImport}
                      />
                  </div>
                )
              },
              {
                key: 'cards',
                label: (
                  <Space>
                    <AppstoreOutlined />
                    功能卡片
                  </Space>
                ),
                children: (
                  <div className="p-6"> {/* Add padding inside tab content */}
                  <Row gutter={[24, 24]} justify="start" align="top">
                      {/* Generate Payroll Card */}
                    <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                      <GeneratePayrollCard
                        currentPeriod={currentPeriod}
                        onRefresh={handleRefresh}
                      />
                    </Col>

                      {/* Audit Payroll Card - currently commented out */}
                      {/* <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                      <AuditPayrollCard
                        selectedPeriod={currentPeriod}
                        selectedVersion={currentVersion}
                        onRefresh={handleRefresh}
                      />
                      </Col> */}

                      {/* Generate Reports Card - currently commented out */}
                      {/* <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                      <GenerateReportsCard
                        selectedPeriod={currentPeriod}
                        selectedVersion={currentVersion}
                      />
                      </Col> */}
                  </Row>
                  </div>
                )
              }
            ]}
          />
        </Card>

        {/* Status Hint Area - Displayed based on selected period/version state */}
          {!selectedPeriodId && (
          <Card className="status-hint-card text-center" bordered={false}>
            {periods.length === 0 ? (
              // Prompt to create a new period if none exist
              <div className="no-period-prompt">
                <CalendarOutlined className="no-period-icon" />
                <h3 className="text-gray-600">还没有薪资周期</h3>
                <p className="text-gray-500">
                  开始使用前，需要先创建一个薪资周期
                </p>
                <Space size="middle">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleQuickCreateCurrentMonth}
                    size="large"
                  >
                    创建本月薪资周期
                  </Button>
                  <Button
                    icon={<CalendarOutlined />}
                    onClick={handleCreateNewPeriod}
                    size="large"
                  >
                    自定义创建
                  </Button>
                </Space>
              </div>
            ) : (
              // Prompt to select a period if periods exist but none are selected
              <div className="info-prompt">
              <p>{t('simplePayroll:hints.selectPeriod')}</p>
              {activeTab === 'workflow' && (
                  <p className="text-blue-500 mt-2">
                  💡 选择工资期间后，智能流程引导将为您显示具体的操作步骤
                </p>
              )}
            </div>
            )}
          </Card>
          )}

          {selectedPeriodId && !selectedVersionId && (
          // Prompt to select a version if a period is selected but no version
          <Card className="status-hint-card text-center" bordered={false}>
            <div className="info-prompt">
              <p>{t('simplePayroll:hints.noVersions')}</p>
              {activeTab === 'workflow' && (
                <p className="text-blue-500 mt-2">
                  💡 选择工资运行版本后，系统将根据当前状态为您提供智能操作引导
                </p>
              )}
            </div>
          </Card>
          )}

        {/* Workflow specific status hint when both period and version are selected */}
          {activeTab === 'workflow' && selectedVersionId && currentVersion && (
          <Card className="workflow-status-card text-center" bordered={false}>
            <p className="text-blue-600 font-semibold text-base m-0">
                🎯 当前状态：<strong>{currentVersion.status_name}</strong> | 
                系统已为您准备好相应的操作步骤，请按照引导完成工资处理流程
              </p>
          </Card>
          )}
      </Content>
    </Layout>
  );
};

export default SimplePayrollPage; 
