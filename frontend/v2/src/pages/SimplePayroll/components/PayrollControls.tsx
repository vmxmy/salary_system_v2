import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Tooltip } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { ControlOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { PayrollPeriodResponse } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';

const { Text } = Typography;

interface PayrollControlsProps {
  currentPeriod?: PayrollPeriodResponse | null;
  handleDateChange: (year: number, month: number) => void;
}

export const PayrollControls: React.FC<PayrollControlsProps> = ({
  currentPeriod,
  handleDateChange
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [periodEntriesMap, setPeriodEntriesMap] = useState<Map<string, number>>(new Map());

  // 🎯 获取所有工资期间数据来构建颜色标识映射
  useEffect(() => {
    const fetchPeriodEntries = async () => {
      try {
        // 获取近两年的工资期间数据
        const currentDate = dayjs();
        const startYear = currentDate.year() - 1;
        const endYear = currentDate.year() + 1;
        
        const allPeriods: PayrollPeriodResponse[] = [];
        
        // 批量获取多年数据
        for (let year = startYear; year <= endYear; year++) {
          try {
            const response = await simplePayrollApi.getPayrollPeriods({ 
              year, 
              page: 1, 
              size: 50 
            });
            if (response.data) {
              allPeriods.push(...response.data);
            }
          } catch (error) {
            console.warn(`Failed to fetch periods for year ${year}:`, error);
          }
        }

        // 构建月份 -> 工资记录数量的映射
        const entriesMap = new Map<string, number>();
        allPeriods.forEach(period => {
          if (period.start_date) {
            const periodDate = dayjs(period.start_date);
            const key = `${periodDate.year()}-${periodDate.month() + 1}`;
            // 累计同一月份的所有记录数量
            const existingCount = entriesMap.get(key) || 0;
            entriesMap.set(key, existingCount + (period.entries_count || 0));
          }
        });

        setPeriodEntriesMap(entriesMap);
        
        console.log('📊 [PayrollControls] 期间工资记录映射:', {
          totalPeriods: allPeriods.length,
          entriesMap: Object.fromEntries(entriesMap)
        });

      } catch (error) {
        console.error('❌ [PayrollControls] 获取工资期间数据失败:', error);
      }
    };

    fetchPeriodEntries();
  }, []);

  // 🎨 自定义单元格渲染器
  const cellRender = (current: string | number | Dayjs) => {
    // 确保转换为Dayjs对象
    const date = dayjs.isDayjs(current) ? current : dayjs(current);
    const year = date.year();
    const month = date.month() + 1;
    const key = `${year}-${month}`;
    const entriesCount = periodEntriesMap.get(key) || 0;
    const hasEntries = entriesCount > 0;

    // 构建tooltip内容
    const tooltipTitle = hasEntries 
      ? `${year}年${month}月有 ${entriesCount} 条工资记录` 
      : `${year}年${month}月暂无工资记录`;

    return (
      <div 
        className={`ant-picker-cell-inner ${hasEntries ? 'has-payroll-entries' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={tooltipTitle}
      >
        {date.format('MM')}月
        {hasEntries && (
          <div className="payroll-indicator" />
        )}
      </div>
    );
  };

  return (
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
            <span className="payroll-controls-hint">
              <span className="payroll-hint-dot" />
              有工资记录
            </span>
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
            cellRender={cellRender}
          />
        </div>
      </Space>
    </ProCard>
  );
}; 