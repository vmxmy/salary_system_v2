import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Card, Row, Col, Badge, Tooltip } from 'antd';
import { 
  CalendarOutlined, 
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { PayrollPeriodResponse, PayrollRunResponse } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';

const { Text } = Typography;

interface PayrollHeaderControlsProps {
  currentPeriod?: PayrollPeriodResponse | null;
  currentVersion?: PayrollRunResponse | null;
  versions: PayrollRunResponse[];
  selectedVersionId?: number;
  handleDateChange: (year: number, month: number) => void;
  onVersionChange?: (versionId: number) => void;
  payrollStats?: {
    recordCount: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    loading: boolean;
  };
}

export const PayrollHeaderControls: React.FC<PayrollHeaderControlsProps> = ({
  currentPeriod,
  versions,
  handleDateChange,
  onVersionChange
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [periodEntriesMap, setPeriodEntriesMap] = useState<Map<string, number>>(new Map());

  // 自动选择最新版本
  useEffect(() => {
    if (versions && versions.length > 0 && onVersionChange) {
      // 找到最新版本
      const latestVersion = versions.reduce((latest, current) => {
        return !latest || current.version_number > latest.version_number ? current : latest;
      }, null as PayrollRunResponse | null);
      
      if (latestVersion) {
        onVersionChange(latestVersion.id);
      }
    }
  }, [versions, onVersionChange]);

  // 获取所有工资期间数据来构建颜色标识映射
  useEffect(() => {
    const fetchPeriodEntries = async () => {
      try {
        const currentDate = dayjs();
        const startYear = currentDate.year() - 1;
        const endYear = currentDate.year() + 1;
        
        const allPeriods: PayrollPeriodResponse[] = [];
        
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

        const entriesMap = new Map<string, number>();
        allPeriods.forEach(period => {
          if (period.start_date) {
            const periodDate = dayjs(period.start_date);
            const key = `${periodDate.year()}-${periodDate.month() + 1}`;
            const existingCount = entriesMap.get(key) || 0;
            entriesMap.set(key, existingCount + (period.entries_count || 0));
          }
        });

        setPeriodEntriesMap(entriesMap);
      } catch (error) {
        console.error('获取工资期间数据失败:', error);
      }
    };

    fetchPeriodEntries();
  }, []);

  // 自定义单元格渲染器
  const cellRender = (current: string | number | Dayjs) => {
    const date = dayjs.isDayjs(current) ? current : dayjs(current);
    const year = date.year();
    const month = date.month() + 1;
    const key = `${year}-${month}`;
    const entriesCount = periodEntriesMap.get(key) || 0;
    const hasEntries = entriesCount > 0;

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
    <Card 
      className="payroll-header-controls"
      style={{ 
        marginBottom: 24,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Row gutter={[24, 16]} align="middle">
        {/* 期间选择器 */}
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <div className="control-section">
            <div className="control-label">
              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 16 }}>
                {t('simplePayroll:controls.period')}
              </Text>
              <Tooltip title="选择工资发放期间">
                <InfoCircleOutlined style={{ marginLeft: 6, color: '#999' }} />
              </Tooltip>
            </div>
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
            {currentPeriod && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                <Space size={16}>
                  <span>状态: <Badge 
                    status={currentPeriod.status_name === '活跃' ? 'success' : 'default'} 
                    text={currentPeriod.status_name} 
                  /></span>
                  <span>频率: {currentPeriod.frequency_name}</span>
                </Space>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <style>{`
        .control-section {
          width: 100%;
        }
        
        .control-label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .custom-date-picker .has-payroll-entries {
          background-color: #e6f7ff !important;
          border-radius: 4px;
        }
        
        .payroll-indicator {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 6px;
          height: 6px;
          background-color: #52c41a;
          border-radius: 50%;
        }
      `}</style>
    </Card>
  );
};