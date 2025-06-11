import { useState, useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { usePayrollPeriods } from './usePayrollPeriods';
import { usePayrollVersions } from './usePayrollVersions';
import { useAuditSummary } from './useAuditSummary';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { PayrollGenerationRequest } from '../types/simplePayroll';

export interface PayrollStats {
  recordCount: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  loading: boolean;
}

export interface DataIntegrityStats {
  socialInsuranceBaseCount: number;
  housingFundBaseCount: number;
  incomeTaxPositiveCount: number;
  loading: boolean;
}

export const usePayrollPageLogic = () => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const navigate = useNavigate();
  
  // State management
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>();
  const [selectedVersionId, setSelectedVersionId] = useState<number | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('workflow');
  const [isCreating, setIsCreating] = useState(false);
  const [createPeriodModalVisible, setCreatePeriodModalVisible] = useState(false);
  const [payrollDataModalVisible, setPayrollDataModalVisible] = useState(false);
  const [payrollStats, setPayrollStats] = useState<PayrollStats>({
    recordCount: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    loading: false
  });

  const [dataIntegrityStats, setDataIntegrityStats] = useState<DataIntegrityStats>({
    socialInsuranceBaseCount: 0,
    housingFundBaseCount: 0,
    incomeTaxPositiveCount: 0,
    loading: false
  });

  // Data fetching hooks
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

  const {
    auditSummary,
    loading: auditLoading,
    refresh: refetchAuditSummary
  } = useAuditSummary(selectedVersionId);

  // Function to fetch data integrity statistics
  const fetchDataIntegrityStats = async (periodId: number) => {
    setDataIntegrityStats(prev => ({ ...prev, loading: true }));
    
    const timeoutId = setTimeout(() => {
      console.log('⏰ [fetchDataIntegrityStats] 操作超时，强制重置loading状态');
      setDataIntegrityStats(prev => ({ ...prev, loading: false }));
    }, 5000);
    
    try {
      console.log('🔍 [fetchDataIntegrityStats] 获取数据完整性统计:', periodId);
      const response = await simplePayrollApi.getDataIntegrityStats(periodId);
      
      clearTimeout(timeoutId);
      
      if (response.data) {
        const integrityData = response.data.data_integrity;
        setDataIntegrityStats({
          socialInsuranceBaseCount: integrityData.social_insurance_base_count || 0,
          housingFundBaseCount: integrityData.housing_fund_base_count || 0,
          incomeTaxPositiveCount: integrityData.income_tax_positive_count || 0,
          loading: false
        });
        console.log('✅ [fetchDataIntegrityStats] 数据完整性统计获取成功');
      } else {
        console.log('⚠️ [fetchDataIntegrityStats] 响应中没有数据');
        setDataIntegrityStats({
          socialInsuranceBaseCount: 0,
          housingFundBaseCount: 0,
          incomeTaxPositiveCount: 0,
          loading: false
        });
      }
    } catch (error) {
      console.error('❌ [fetchDataIntegrityStats] 获取数据完整性统计失败:', error);
      clearTimeout(timeoutId);
      setDataIntegrityStats({
        socialInsuranceBaseCount: 0,
        housingFundBaseCount: 0,
        incomeTaxPositiveCount: 0,
        loading: false
      });
    }
  };

  // Function to fetch payroll statistics
  const fetchPayrollStats = async (versionId: number) => {
    setPayrollStats(prev => ({ ...prev, loading: true }));
    
    const timeoutId = setTimeout(() => {
      console.log('⏰ [fetchPayrollStats] 操作超时，强制重置loading状态');
      setPayrollStats(prev => ({ ...prev, loading: false }));
    }, 5000);
    
    try {
      console.log('🔍 [fetchPayrollStats] 获取版本统计数据:', versionId);
      const response = await simplePayrollApi.getPayrollVersion(versionId);
      
      clearTimeout(timeoutId);
      
      if (response.data) {
        const versionData = response.data;
        setPayrollStats({
          recordCount: versionData.total_entries || 0,
          totalGrossPay: Number(Number(versionData.total_gross_pay || 0).toFixed(2)),
          totalDeductions: Number(Number(versionData.total_deductions || 0).toFixed(2)),
          totalNetPay: Number(Number(versionData.total_net_pay || 0).toFixed(2)),
          loading: false
        });
        console.log('✅ [fetchPayrollStats] 统计数据获取成功');
      } else {
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
      clearTimeout(timeoutId);
      setPayrollStats({
        recordCount: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        loading: false
      });
    }
  };

  // Event handlers
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchPeriods();
    if (selectedPeriodId) {
      refetchVersions();
      fetchDataIntegrityStats(selectedPeriodId);
    }
    if (selectedVersionId) {
      fetchPayrollStats(selectedVersionId);
    }
  };

  const handleVersionRefresh = () => {
    console.log('🔄 [handleVersionRefresh] 只刷新版本数据');
    if (selectedPeriodId) {
      refetchVersions();
    }
    if (selectedVersionId) {
      fetchPayrollStats(selectedVersionId);
    }
  };

  const handleAuditRefresh = () => {
    console.log('🔄 [handleAuditRefresh] 只刷新审核数据');
    refetchAuditSummary();
  };

  const resetLoadingStates = () => {
    console.log('🔄 [SimplePayrollPage] 手动重置所有loading状态');
    setPayrollStats(prev => ({ ...prev, loading: false }));
    setDataIntegrityStats(prev => ({ ...prev, loading: false }));
    message.info('已重置加载状态');
  };

  const handleNavigateToBulkImport = () => {
    navigate('/payroll/bulk-import');
  };

  const handleImportTaxData = () => {
    message.info(t('simplePayroll:quickActions.importTaxDataMessage'));
  };

  const handleCreateNewPeriod = () => {
    setCreatePeriodModalVisible(true);
  };

  const handleDateChange = async (year: number, month: number) => {
    try {
      const targetName = `${year}年${month.toString().padStart(2, '0')}月`;
      const matchedPeriod = periods.find(p => p.name.includes(targetName));
      
      if (matchedPeriod) {
        setSelectedPeriodId(matchedPeriod.id);
      } else {
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
    const currentPeriod = periods.find(p => p.id === selectedPeriodId);
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
      handleRefresh();
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
      
      if (selectedVersionId === versionId) {
        setSelectedVersionId(undefined);
      }
      
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || '删除版本失败');
    }
  };

  const handleQuickCreateCurrentMonth = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthStr = month.toString().padStart(2, '0');

      message.success(`正在创建 ${year}年${monthStr}月 薪资周期...`);
      handleRefresh();
    } catch (error) {
      message.error('创建薪资周期失败');
    }
  };

  // Get current selected objects
  const currentPeriod = periods.find(p => p.id === selectedPeriodId);
  const currentVersion = versions.find(v => v.id === selectedVersionId);

  // useEffect hooks
  // Fetch stats and audit data when version changes
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

  // Fetch data integrity stats when period changes
  useEffect(() => {
    if (selectedPeriodId) {
      fetchDataIntegrityStats(selectedPeriodId);
    } else {
      setDataIntegrityStats({
        socialInsuranceBaseCount: 0,
        housingFundBaseCount: 0,
        incomeTaxPositiveCount: 0,
        loading: false
      });
    }
  }, [selectedPeriodId]);

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
      const currentMonth = now.month() + 1;
      const targetName = `${currentYear}年${currentMonth.toString().padStart(2, '0')}月`;
      
      console.log('🎯 [SimplePayrollPage] 尝试自动选择当前月份期间:', {
        currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
        currentYear,
        currentMonth,
        targetName,
        availablePeriods: periods.map(p => ({ id: p.id, name: p.name }))
      });
      
      let currentMonthPeriod = periods.find(p => p.name.includes(targetName));
      
      if (!currentMonthPeriod) {
        const alternativeTargets = [
          `${currentYear}年${currentMonth}月`,
          `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
          `${currentYear}-${currentMonth}`,
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
        console.log('⚠️ [SimplePayrollPage] 未找到当前月份期间，选择最新期间:', periods[0]);
        setSelectedPeriodId(periods[0].id);
      }
    }
  }, [periods, periodsLoading]);

  // Smart version selection on initial load
  useEffect(() => {
    if (!versionsLoading && versions.length > 0 && !selectedVersionId) {
      console.log('🚀 [SimplePayrollPage] Forcing selection of first version:', versions[0].id);
      setSelectedVersionId(versions[0].id);
    }
  }, [versionsLoading, versions.length, selectedVersionId]);

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

  // Effect to reset version selection when the period changes
  useEffect(() => {
    console.log('🎯 [SimplePayrollPage] Period changed, resetting version selection:', selectedPeriodId);
    setSelectedVersionId(undefined);

    if (selectedPeriodId) {
      console.log('🔄 [SimplePayrollPage] Period switched, triggering version data refresh');
    }
  }, [selectedPeriodId]);

  // Effect to check if selected period has runs, if not, auto-create one
  useEffect(() => {
    const checkAndCreateRun = async () => {
      if (!selectedPeriodId || !currentPeriod || versionsLoading) {
        console.log('🔍 [自动创建运行] 跳过检查:', {
          selectedPeriodId: !!selectedPeriodId,
          currentPeriod: !!currentPeriod,
          versionsLoading
        });
        return;
      }

      const periodHasRuns = currentPeriod.runs_count > 0;
      
      console.log('🔍 [自动创建运行] 检查期间运行状态:', {
        periodName: currentPeriod.name,
        periodRunsCount: currentPeriod.runs_count,
        versionsLength: versions.length,
        periodHasRuns,
        shouldCreateRun: !periodHasRuns && versions.length === 0
      });

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
            refetchVersions();
            refetchPeriods();
          }
        } catch (runError: any) {
          console.error('❌ [自动创建运行] 创建工资运行失败:', runError);
          message.warning(`为 ${currentPeriod.name} 创建工资运行失败: ${runError.message}`);
        }
      }
    };

    const timer = setTimeout(checkAndCreateRun, 800);
    return () => clearTimeout(timer);
  }, [selectedPeriodId, currentPeriod, versions.length, versionsLoading]);

  // Smart version selection logic based on status
  useEffect(() => {
    console.log('🔄 [SimplePayrollPage] Smart version selection check:', {
      versionsLength: versions.length,
      versionsLoading,
      selectedVersionId,
      selectedPeriodId,
      versions: versions.map(v => ({ id: v.id, status: v.status_name, version: v.version_number }))
    });

    if (!versionsLoading && versions.length > 0 && !selectedVersionId && selectedPeriodId) {
      let targetVersion = versions.find(v => v.status_name === '已计算') || null;

      if (!targetVersion) {
        targetVersion = versions.find(v => v.status_name === '草稿' || v.status_name === 'DRAFT') || null;
      }

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

  return {
    // State
    selectedPeriodId,
    selectedVersionId,
    refreshTrigger,
    activeTab,
    isCreating,
    createPeriodModalVisible,
    payrollDataModalVisible,
    payrollStats,
    dataIntegrityStats,
    
    // Data
    periods,
    versions,
    auditSummary,
    currentPeriod,
    currentVersion,
    
    // Loading states
    periodsLoading,
    versionsLoading,
    auditLoading,
    
    // Actions
    setSelectedPeriodId,
    setSelectedVersionId,
    setActiveTab,
    setCreatePeriodModalVisible,
    setPayrollDataModalVisible,
    
    // Handlers
    handleRefresh,
    handleVersionRefresh,
    handleAuditRefresh,
    resetLoadingStates,
    handleNavigateToBulkImport,
    handleImportTaxData,
    handleCreateNewPeriod,
    handleDateChange,
    handleCreateFirstVersion,
    handleDeleteVersion,
    handleQuickCreateCurrentMonth,
    fetchPayrollStats,
    fetchDataIntegrityStats
  };
}; 