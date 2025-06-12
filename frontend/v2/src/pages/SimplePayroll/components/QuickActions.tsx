import React, { useState } from 'react';
import { Button, Space, message, Modal } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { AppstoreOutlined, PlusOutlined, DollarOutlined, ReloadOutlined, EyeOutlined, BankOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { simplePayrollApi } from '../services/simplePayrollApi';

interface QuickActionsProps {
  selectedPeriodId?: number;
  selectedVersionId?: number;
  handleNavigateToBulkImport: () => void;
  handleImportTaxData: () => void;
  setPayrollDataModalVisible: (visible: boolean) => void;
  onRefresh?: () => void; // 新增：用于刷新数据
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  selectedPeriodId,
  selectedVersionId,
  handleNavigateToBulkImport,
  handleImportTaxData,
  setPayrollDataModalVisible,
  onRefresh
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // 🎯 复制上月工资记录数据（只复制薪资条目，不复制配置）
  const handleCopyPreviousPayrollEntries = async () => {
    if (!selectedPeriodId) {
      message.error('请先选择一个工资期间');
      return;
    }

    // 声明变量在更高的作用域，确保在catch块中可以访问
    let currentPeriod: any = null;
    let previousPeriod: any = null;

    try {
      setLoading(prev => ({ ...prev, copy_payroll_entries: true }));

      console.log('🚀 [复制工资记录] 开始获取期间列表');
      
      // 获取所有期间列表
      const periodsResponse = await simplePayrollApi.getPayrollPeriods({});
      const allPeriods = periodsResponse.data;
      
      // 找到当前期间
      currentPeriod = allPeriods.find(p => p.id === selectedPeriodId);
      if (!currentPeriod) {
        message.error('无法找到当前期间信息');
        return;
      }

      console.log('📋 [复制工资记录] 当前期间:', currentPeriod);

      // 🔍 检查当前期间是否已有工资记录
      console.log('🔍 [复制工资记录] 检查当前期间是否已有工资记录');
      const existingDataCheck = await simplePayrollApi.checkExistingData(selectedPeriodId);
      
      if (existingDataCheck.data.summary.payroll_entries_count > 0) {
        const summary = existingDataCheck.data.summary;
        message.warning({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 当前期间已有工资记录</div>
              <div>📋 期间：{currentPeriod.name}</div>
              <div>👥 工资记录：{summary.payroll_entries_count} 条</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>请先删除现有工资记录或选择其他期间</div>
            </div>
          ),
          duration: 8
        });
        return;
      }

      // 按时间降序排序，找到比当前期间时间更早的最近期间（真正的上个月）
      const parseYearMonth = (name: string) => {
        const match = name.match(/(\d{4})-(\d{1,2})/);
        if (match) {
          return { year: parseInt(match[1]), month: parseInt(match[2]) };
        }
        return null;
      };
      
      const sortedPeriods = allPeriods
        .filter(p => {
          const currentYearMonth = parseYearMonth(currentPeriod.name);
          const pYearMonth = parseYearMonth(p.name);
          
          if (!currentYearMonth || !pYearMonth) return false;
          
          // 比较年月：确保是更早的期间
          if (pYearMonth.year < currentYearMonth.year) return true;
          if (pYearMonth.year === currentYearMonth.year && pYearMonth.month < currentYearMonth.month) return true;
          return false;
        })
        .sort((a, b) => {
          const aYearMonth = parseYearMonth(a.name);
          const bYearMonth = parseYearMonth(b.name);
          
          if (!aYearMonth || !bYearMonth) return 0;
          
          if (aYearMonth.year !== bYearMonth.year) return bYearMonth.year - aYearMonth.year;
          return bYearMonth.month - aYearMonth.month;
        });
      
      if (sortedPeriods.length === 0) {
        message.warning('没有找到更早的期间，无法复制工资记录');
        return;
      }

      previousPeriod = sortedPeriods[0];

      console.log('🎯 [复制工资记录] 选择源期间:', {
        从: previousPeriod.name,
        到: currentPeriod.name,
        sourcePeriodId: previousPeriod.id,
        targetPeriodId: selectedPeriodId
      });

      // 🎯 调用复制薪资条目API（完整复制工资记录数据）
      const result = await simplePayrollApi.copyPreviousPayroll({
        target_period_id: selectedPeriodId,
        source_period_id: previousPeriod.id,
        description: `复制 ${previousPeriod.name} 工资记录到 ${currentPeriod.name}`,
        force_overwrite: false
      });

      console.log('✅ [复制工资记录] 复制完成:', result);

      if (result.data) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 工资记录复制成功</div>
              <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
              <div>✅ 运行ID: {result.data.id}</div>
              <div>📊 版本: {result.data.version_number}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>薪资条目记录已复制，可以运行计算引擎</div>
            </div>
          ),
          duration: 6
        });

        // 刷新数据
        onRefresh?.();
      } else {
        message.error('复制工资记录失败');
      }

    } catch (error: any) {
      console.error('❌ [复制工资记录] 复制失败:', error);
      console.log('🔍 [复制工资记录] 错误详情:', {
        status: error.response?.status,
        data: error.response?.data,
        errorCode: error.response?.data?.detail?.error?.code
      });
      
      // 检查是否是需要确认的情况（409或422状态码，包含CONFIRMATION_REQUIRED错误码）
      if ((error.response?.status === 409 || error.response?.status === 422) && 
          error.response?.data?.detail?.error?.code === 'CONFIRMATION_REQUIRED') {
        console.log('🔍 [复制工资记录] 检测到需要用户确认的情况');
        const existingData = error.response.data.detail.error.existing_data;
        
        // 显示确认对话框
        Modal.confirm({
          title: '目标期间已有数据',
          content: (
            <div>
              <p>期间 <strong>{existingData.target_period_name}</strong> 已有数据：</p>
              <ul>
                <li>工资运行: {existingData.summary.total_payroll_runs} 个</li>
                <li>工资条目: {existingData.summary.total_payroll_entries} 条</li>
                <li>薪资配置: {existingData.summary.total_salary_configs} 条</li>
              </ul>
              <p>是否要强制覆盖现有数据？</p>
            </div>
          ),
          okText: '强制覆盖',
          cancelText: '取消',
          onOk: async () => {
            // 用户确认后，重新调用API并设置force_overwrite为true
            try {
              setLoading(prev => ({ ...prev, copy_payroll_entries: true }));
              
              const result = await simplePayrollApi.copyPreviousPayroll({
                target_period_id: selectedPeriodId,
                source_period_id: previousPeriod.id,
                description: `复制 ${previousPeriod.name} 工资记录到 ${currentPeriod.name}`,
                force_overwrite: true  // 强制覆盖
              });

              if (result.data) {
                message.success({
                  content: (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 工资记录复制成功（已覆盖）</div>
                      <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
                      <div>✅ 运行ID: {result.data.id}</div>
                      <div>📊 条目数: {result.data.total_entries}</div>
                    </div>
                  ),
                  duration: 6
                });
                onRefresh?.();
              }
            } catch (retryError: any) {
              console.error('❌ [复制工资记录] 强制覆盖失败:', retryError);
              const retryErrorMessage = retryError?.response?.data?.detail?.message || retryError?.message || '强制覆盖失败';
              message.error(`强制覆盖失败: ${retryErrorMessage}`);
            } finally {
              setLoading(prev => ({ ...prev, copy_payroll_entries: false }));
            }
          }
        });
        return;
      }
      
      // 普通错误处理
      const errorDetails = error?.response?.data?.detail;
      let errorMessage = '复制工资记录失败';
      let detailMessage = '';
      
      if (errorDetails) {
        if (errorDetails.error) {
          errorMessage = errorDetails.error.message || errorMessage;
          detailMessage = errorDetails.error.details || '';
        } else if (errorDetails.message) {
          errorMessage = errorDetails.message;
          detailMessage = errorDetails.details || '';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error({
        content: (
          <div>
            <div style={{ fontWeight: 'bold' }}>❌ 复制工资记录失败</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{errorMessage}</div>
            {detailMessage && (
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{detailMessage}</div>
            )}
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
              状态码: {error?.response?.status || 'Unknown'}
            </div>
          </div>
        ),
        duration: 8
      });
    } finally {
      setLoading(prev => ({ ...prev, copy_payroll_entries: false }));
    }
  };

  // 一键复制上月缴费基数
  const handleCopyPreviousBaseAmounts = async () => {
    if (!selectedPeriodId) {
      message.error('请先选择一个工资期间');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, copy_base_amounts: true }));

      console.log('🚀 [一键复制缴费基数] 开始获取期间列表');
      
      // 获取所有期间列表
      const periodsResponse = await simplePayrollApi.getPayrollPeriods({});
      const allPeriods = periodsResponse.data;
      
      // 找到当前期间
      const currentPeriod = allPeriods.find(p => p.id === selectedPeriodId);
      if (!currentPeriod) {
        message.error('无法找到当前期间信息');
        return;
      }

      console.log('📋 [一键复制缴费基数] 当前期间:', currentPeriod);

      // 🔍 检查当前期间是否已有缴费基数配置
      console.log('🔍 [一键复制缴费基数] 检查当前期间是否已有缴费基数配置');
      const existingBaseCheck = await simplePayrollApi.checkExistingInsuranceBase(selectedPeriodId);
      
      if (existingBaseCheck.data.has_insurance_base_data) {
        const baseConfigs = existingBaseCheck.data.base_configs;
        const summary = existingBaseCheck.data.summary;
        message.warning({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 当前期间已有缴费基数配置</div>
              <div>📋 期间：{currentPeriod.name}</div>
              <div>👥 涉及员工：{baseConfigs.unique_employees} 人</div>
              {baseConfigs.employees_with_social_base > 0 && <div>🏥 有社保基数：{baseConfigs.employees_with_social_base} 人</div>}
              {baseConfigs.employees_with_housing_base > 0 && <div>🏠 有公积金基数：{baseConfigs.employees_with_housing_base} 人</div>}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {existingBaseCheck.data.recommendation.message}
              </div>
            </div>
          ),
          duration: 8
        });
        return;
      }

      // 按时间降序排序，找到比当前期间时间更早的最近期间（真正的上个月）
      const parseYearMonth = (name: string) => {
        const match = name.match(/(\d{4})-(\d{1,2})/);
        if (match) {
          return { year: parseInt(match[1]), month: parseInt(match[2]) };
        }
        return null;
      };
      
      const sortedPeriods = allPeriods
        .filter(p => {
          const currentYearMonth = parseYearMonth(currentPeriod.name);
          const pYearMonth = parseYearMonth(p.name);
          
          if (!currentYearMonth || !pYearMonth) return false;
          
          // 比较年月：确保是更早的期间
          if (pYearMonth.year < currentYearMonth.year) return true;
          if (pYearMonth.year === currentYearMonth.year && pYearMonth.month < currentYearMonth.month) return true;
          return false;
        })
        .sort((a, b) => {
          const aYearMonth = parseYearMonth(a.name);
          const bYearMonth = parseYearMonth(b.name);
          
          if (!aYearMonth || !bYearMonth) return 0;
          
          if (aYearMonth.year !== bYearMonth.year) return bYearMonth.year - aYearMonth.year;
          return bYearMonth.month - aYearMonth.month;
        });
      
      if (sortedPeriods.length === 0) {
        message.warning('没有找到更早的期间，无法复制缴费基数');
        return;
      }

      const previousPeriod = sortedPeriods[0];

      console.log('🎯 [一键复制缴费基数] 选择源期间:', {
        从: previousPeriod.name,
        到: currentPeriod.name,
        sourcePeriodId: previousPeriod.id,
        targetPeriodId: selectedPeriodId
      });

      // 🎯 调用专门的缴费基数复制API（只复制社保和公积金基数）
      const result = await simplePayrollApi.copyInsuranceBaseAmounts({
        source_period_id: previousPeriod.id,
        target_period_id: selectedPeriodId
      });

      console.log('✅ [一键复制缴费基数] 复制完成:', result);

      if (result.data.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🎉 缴费基数复制成功</div>
              <div>📋 从 {previousPeriod.name} 复制到 {currentPeriod.name}</div>
              <div>✅ 新建: {result.data.copied_count} 条</div>
              <div>🔄 更新: {result.data.updated_count} 条</div>
              <div>⏭ 跳过: {result.data.skipped_count} 条</div>
            </div>
          ),
          duration: 6
        });

        // 刷新数据
        onRefresh?.();
      } else {
        message.error('复制缴费基数失败');
      }

    } catch (error: any) {
      console.error('❌ [一键复制缴费基数] 复制失败:', error);
      const errorMessage = error?.response?.data?.detail?.message || error?.message || '复制缴费基数失败';
      message.error({
        content: (
          <div>
            <div style={{ fontWeight: 'bold' }}>❌ 复制缴费基数失败</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{errorMessage}</div>
          </div>
        ),
        duration: 6
      });
    } finally {
      setLoading(prev => ({ ...prev, copy_base_amounts: false }));
    }
  };

  if (!selectedPeriodId) {
    return null;
  }

  return (
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
          onClick={handleImportTaxData} 
          block 
          size="large"
          icon={<DollarOutlined />}
        >
          {t('simplePayroll:quickActions.importTaxData')}
        </Button>
        <Button 
          onClick={handleCopyPreviousPayrollEntries}
          block 
          size="large"
          icon={<ReloadOutlined />}
          loading={loading.copy_payroll_entries}
        >
          {t('simplePayroll:quickActions.copyLastMonth')}
        </Button>
        <Button 
          onClick={handleCopyPreviousBaseAmounts}
          block 
          size="large"
          icon={<BankOutlined />}
          loading={loading.copy_base_amounts}
        >
          一键复制上月缴费基数
        </Button>
        <Button 
          onClick={() => setPayrollDataModalVisible(true)}
          block 
          size="large"
          icon={<EyeOutlined />}
          disabled={!selectedVersionId}
        >
          浏览工资数据
        </Button>
      </Space>
    </ProCard>
  );
}; 