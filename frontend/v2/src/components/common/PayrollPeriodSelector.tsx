import React, { useState, useEffect } from 'react';
import { Select, Card, Form, Tag, App } from 'antd';
import { LoadingOutlined, DatabaseOutlined, FileAddOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as payrollApi from '../../pages/Payroll/services/payrollApi';
import type { PayrollPeriod } from '../../pages/Payroll/types/payrollTypes';

const { Option } = Select;

// 环境配置和业务规则
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_PRODUCTION_RESTRICTIONS = IS_PRODUCTION;

// 薪资周期状态常量
const PAYROLL_PERIOD_STATUS = {
  ACTIVE: 'ACTIVE',
  PLANNED: 'PLANNED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED'
} as const;

interface PayrollPeriodSelectorProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  onPeriodsLoaded?: (periods: PayrollPeriod[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  
  // 布局模式
  mode?: 'card' | 'form';
  
  // 卡片模式配置
  cardTitle?: string;
  showSelectedStatus?: boolean;
  
  // 表单模式配置
  label?: string;
  help?: React.ReactNode;
  required?: boolean;
  
  // 数据过滤配置
  filterFunction?: (periods: PayrollPeriod[]) => PayrollPeriod[];
  
  // 数据统计配置
  showDataStats?: boolean;
  
  // 环境限制配置
  enableProductionRestrictions?: boolean;
  
  // 🆕 自动选择配置
  autoSelectLatestWithData?: boolean; // 是否自动选择最近一个有数据的周期
}

interface PeriodDataStats {
  count: number;
  loading: boolean;
}

const PayrollPeriodSelector: React.FC<PayrollPeriodSelectorProps> = ({
  value,
  onChange,
  onPeriodsLoaded,
  placeholder,
  disabled = false,
  loading: externalLoading = false,
  style,
  mode = 'card',
  cardTitle,
  showSelectedStatus = true,
  label,
  help,
  required = false,
  filterFunction,
  showDataStats = true,
  enableProductionRestrictions = ENABLE_PRODUCTION_RESTRICTIONS,
  autoSelectLatestWithData = false
}) => {
  const { t } = useTranslation(['payroll', 'common']);
  const { message } = App.useApp();
  
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(false);
  const [periodDataStats, setPeriodDataStats] = useState<Record<number, PeriodDataStats>>({});
  
  // 获取薪资周期数据统计
  const fetchPeriodDataStats = async (periodIds: number[], periods: PayrollPeriod[]) => {
    if (!showDataStats) return;
    
    // 🛡️ 防御性编程：检查参数有效性
    if (!Array.isArray(periodIds) || !Array.isArray(periods)) {
      console.error({t('components:auto__fetchperioddatastats__e29d8c')}, { periodIds, periods });
      return;
    }
    
    console.log({t('components:auto____f09f94')});
    
    // 初始化加载状态
    const initialStats: Record<number, PeriodDataStats> = {};
    periodIds.forEach(id => {
      initialStats[id] = { count: 0, loading: true };
    });
    setPeriodDataStats(initialStats);
    
    // 并发获取所有周期的数据统计
    const statsPromises = periodIds.map(async (periodId) => {
      try {
        console.log({t('components:auto___periodid___f09f93')});
        
        // 获取该周期下的所有payroll_run
        const runsResponse = await payrollApi.getPayrollRuns({
          period_id: periodId,
          size: 100
        });
        
        let totalCount = 0;
        
        // 🛡️ 防御性编程：检查响应数据有效性
        if (runsResponse && runsResponse.data && Array.isArray(runsResponse.data) && runsResponse.data.length > 0) {
          totalCount = runsResponse.data.reduce((sum, run) => {
            return sum + (run.total_employees || 0);
          }, 0);
          
          console.log({t('components:auto___periodid__totalcount__f09f93')});
        } else {
          console.log({t('components:auto___periodid___f09f93')}, runsResponse);
        }
        
        return { periodId, count: totalCount };
      } catch (error) {
        console.error({t('components:auto___periodid___e29d8c')}, error);
        return { periodId, count: 0 };
      }
    });
    
    try {
      const results = await Promise.all(statsPromises);
      
      // 更新统计数据
      const newStats: Record<number, PeriodDataStats> = {};
      results.forEach(({ periodId, count }) => {
        newStats[periodId] = { count, loading: false };
      });
      
      setPeriodDataStats(newStats);
      console.log({t('components:auto____e29c85')}, newStats);
      
      // 🎯 自动选择最近一个有数据的周期
      if (autoSelectLatestWithData && !value && onChange && Array.isArray(periods)) {
        // 🛡️ 防御性编程：确保periods是有效数组
        const periodsWithData = periods.filter(period => {
          if (!period || typeof period.id === 'undefined') {
            console.warn({t('components:auto____e29aa0')}, period);
            return false;
          }
          const stats = newStats[period.id];
          return stats && stats.count > 0;
        });
        
        console.log({t('components:auto____f09f94')}, periodsWithData.map(p => {t('components:auto__p_name_newstats_p_id_count_0___247b70')}));
        
        if (periodsWithData.length > 0) {
          // 选择最近的有数据的周期（已按日期倒序排列）
          const selectedPeriod = periodsWithData[0];
          console.log({t('components:auto___selectedperiod_name_newstats_selectedperiod_id_count_0___f09f8e')});
          onChange(selectedPeriod.id);
        } else {
          console.log({t('components:auto____f09f93')});
        }
      }
    } catch (error) {
      console.error({t('components:auto____e29d8c')}, error);
      // 设置所有为非加载状态
      const errorStats: Record<number, PeriodDataStats> = {};
      periodIds.forEach(id => {
        errorStats[id] = { count: 0, loading: false };
      });
      setPeriodDataStats(errorStats);
    }
  };

  // 过滤薪资周期的函数
  const filterPayrollPeriods = (periods: PayrollPeriod[]): PayrollPeriod[] => {
    let filteredPeriods = periods;
    
    // 应用自定义过滤函数
    if (filterFunction) {
      filteredPeriods = filterFunction(filteredPeriods);
    }
    
    // 应用环境限制
    if (enableProductionRestrictions) {
      filteredPeriods = filteredPeriods.filter(period => {
        const statusCode = period.status_lookup?.code;
        return statusCode === PAYROLL_PERIOD_STATUS.ACTIVE || statusCode === PAYROLL_PERIOD_STATUS.PLANNED;
      });
    }
    
    return filteredPeriods;
  };

  // 加载薪资周期数据
  useEffect(() => {
    const fetchPayrollPeriods = async () => {
      setLoadingPeriods(true);
      try {
        console.log({t('components:auto____f09f9a')});
        
        const response = await payrollApi.getPayrollPeriods({
          size: 100
        });
        
        console.log({t('components:auto____f09f93')}, response);
        
        // 🛡️ 防御性编程：检查响应数据
        if (!response || !response.data || !Array.isArray(response.data)) {
          console.error({t('components:auto____e29d8c')}, response);
          setPayrollPeriods([]);
          return;
        }
        
        // 按日期倒序排列，最新的月份在前面
        const sortedPeriods = response.data.sort((a, b) => {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
        
        console.log({t('components:auto____f09f93')}, sortedPeriods.map(p => `${p.name} (${p.start_date})`));
        
        // 根据配置过滤薪资周期
        const filteredPeriods = filterPayrollPeriods(sortedPeriods);
        
        if (enableProductionRestrictions) {
          console.log({t('components:auto____sortedperiods_length__filteredperiods_length__f09f94')});
        }
        
        setPayrollPeriods(filteredPeriods);
        console.log({t('components:auto___filteredperiods_length__e29c85')});
        
        // 调用回调函数通知父组件薪资周期已加载
        if (onPeriodsLoaded) {
          onPeriodsLoaded(filteredPeriods);
        }
        
        // 获取每个周期的数据统计
        if (filteredPeriods.length > 0) {
          const periodIds = filteredPeriods.map(p => p.id);
          // 🛡️ 防御性编程：确保数据有效性
          if (Array.isArray(periodIds) && Array.isArray(filteredPeriods)) {
            fetchPeriodDataStats(periodIds, filteredPeriods);
          } else {
            console.error({t('components:auto____e29d8c')}, { periodIds, filteredPeriods });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching payroll periods:', error);
        message.error(t('periods_page.error_fetch_periods'));
        setPayrollPeriods([]); // 🛡️ 设置为空数组而不是保持undefined
      } finally {
        setLoadingPeriods(false);
      }
    };

    fetchPayrollPeriods();
  }, [message, t, enableProductionRestrictions, showDataStats]);

  // 获取选中周期的信息
  const selectedPeriod = payrollPeriods.find(p => p.id === value);

  // 渲染选项
  const renderOption = (period: PayrollPeriod) => {
    // 获取状态信息
    const statusCode = period.status_lookup?.code;
    const statusName = period.status_lookup?.name;
    
    const statusColor = 
      statusCode === 'ACTIVE' || statusCode === 'PLANNED' ? 'green' :
      statusCode === 'CLOSED' ? 'blue' : 
      statusCode === 'ARCHIVED' ? 'gray' : 'gold';
    
    // 获取数据统计信息
    const dataStats = periodDataStats[period.id];
    const isLoadingStats = dataStats?.loading ?? true;
    const recordCount = dataStats?.count ?? 0;
    
    // 确定数据状态图标和颜色
    let dataIcon: React.ReactNode;
    let dataColor: string;
    let dataText: string;
    
    if (!showDataStats) {
      dataIcon = null;
      dataColor = '#8c8c8c';
      dataText = '';
    } else if (isLoadingStats) {
      dataIcon = <LoadingOutlined style={{ fontSize: '12px' }} />;
      dataColor = '#1890ff';
      dataText = {t('components:auto___e7bb9f')};
    } else if (recordCount > 0) {
      dataIcon = <DatabaseOutlined style={{ fontSize: '12px' }} />;
      dataColor = '#52c41a';
      dataText = {t('components:auto__recordcount__247b72')};
    } else {
      dataIcon = <FileAddOutlined style={{ fontSize: '12px' }} />;
      dataColor = '#8c8c8c';
      dataText = {t('components:auto_text_e697a0')};
    }
    
    return (
      <Option key={period.id} value={period.id}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <span style={{ 
              color: recordCount > 0 ? '#52c41a' : '#8c8c8c',
              fontWeight: recordCount > 0 ? '500' : 'normal'
            }}>
              {period.name}
            </span>
            <span style={{ 
              color: '#666', 
              fontSize: '12px', 
              marginLeft: 8 
            }}>
              ({period.start_date} ~ {period.end_date})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showDataStats && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                color: dataColor,
                fontSize: '12px'
              }}>
                {dataIcon}
                <span>{dataText}</span>
              </div>
            )}
            <Tag color={statusColor} style={{ margin: 0, fontSize: '11px' }}>
              {statusName || {t('components:auto_text_e69caa')}}
            </Tag>
          </div>
        </div>
      </Option>
    );
  };

  // 渲染帮助信息
  const renderHelpInfo = () => {
    if (help) return help;
    
    return (
      <div>
        <div>{t('batch_import.help.period_selection')}</div>
        <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
          {enableProductionRestrictions ? (
            <>
              🔒 生产环境：仅显示
              <Tag color="green" style={{ margin: '0 4px', fontSize: '11px' }}>活动</Tag>
              状态的薪资周期，确保数据安全。
            </>
          ) : (
            <>
              💡 开发环境：显示所有状态的薪资周期。
              <Tag color="green" style={{ margin: '0 4px', fontSize: '11px' }}>活动</Tag>
              <Tag color="blue" style={{ margin: '0 4px', fontSize: '11px' }}>已关闭</Tag>
              <Tag color="gray" style={{ margin: '0 4px', fontSize: '11px' }}>已归档</Tag>
              <br />
              <span style={{ color: '#ff7a00', fontSize: '11px' }}>
                ⚠️ 注意：生产环境将只允许向活动状态的薪资周期导入数据
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  // 渲染选择器
  const renderSelector = () => (
    <Select
      placeholder={placeholder || t('runs_page.form.placeholder.payroll_period')}
      onChange={onChange}
      value={value}
      loading={loadingPeriods || externalLoading}
      disabled={disabled}
      style={{ width: '100%', ...style }}
      showSearch
      optionFilterProp="children"
      filterOption={(input, option) => 
        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
      }
      popupMatchSelectWidth={false}
      styles={{
        popup: {
          root: {
            minWidth: '300px'
          }
        }
      }}
    >
      {payrollPeriods.map(renderOption)}
    </Select>
  );

  // 根据模式渲染不同的布局
  if (mode === 'form') {
    return (
      <Form.Item 
        label={label || t('batch_import.label.period_selection')} 
        help={renderHelpInfo()}
        required={required}
      >
        {renderSelector()}
      </Form.Item>
    );
  }

  // 卡片模式
  return (
    <Card 
      title={cardTitle || t('payroll_period_selector.title')}
      style={{ marginBottom: 16, ...style }}
    >
      {renderSelector()}
      
      {showSelectedStatus && selectedPeriod && (
        <div style={{ 
          marginTop: 12, 
          padding: '8px 12px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#52c41a'
        }}>
          ✓ 已选择：{selectedPeriod.name} ({selectedPeriod.start_date} ~ {selectedPeriod.end_date})
          {showDataStats && periodDataStats[selectedPeriod.id] && (
            <span style={{ marginLeft: 8, color: '#666' }}>
              - {periodDataStats[selectedPeriod.id].count}人
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default PayrollPeriodSelector; 