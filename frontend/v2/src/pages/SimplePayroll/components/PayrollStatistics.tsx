import React from 'react';
import { Button, Row, Col, Space, Divider } from 'antd';
import { StatisticCard } from '@ant-design/pro-components';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { PayrollPeriodResponse, PayrollRunResponse } from '../types/simplePayroll';
import type { PayrollStats, DataIntegrityStats } from '../hooks/usePayrollPageLogic';

interface PayrollStatisticsProps {
  selectedVersionId?: number;
  currentPeriod?: PayrollPeriodResponse | null;
  currentVersion?: PayrollRunResponse | null;
  versions: PayrollRunResponse[];
  payrollStats: PayrollStats;
  dataIntegrityStats: DataIntegrityStats;
  auditSummary?: {
    total_anomalies: number;
    error_count: number;
    warning_count: number;
    auto_fixable_count: number;
  } | null;
  auditLoading: boolean;
  resetLoadingStates: () => void;
}

export const PayrollStatistics: React.FC<PayrollStatisticsProps> = ({
  selectedVersionId,
  currentPeriod,
  currentVersion,
  versions,
  payrollStats,
  dataIntegrityStats,
  auditSummary,
  auditLoading,
  resetLoadingStates
}) => {
  if (!selectedVersionId) {
    return null;
  }

  return (
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
        <Col xs={24} sm={12} xl={4} xxl={4}>
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
        <Col xs={24} sm={12} xl={4} xxl={4}>
          <StatisticCard
            statistic={{
              title: '数据完整性',
              value: (dataIntegrityStats?.socialInsuranceBaseCount || 0) + (dataIntegrityStats?.housingFundBaseCount || 0) + (dataIntegrityStats?.incomeTaxPositiveCount || 0),
              suffix: '条',
              valueStyle: { color: '#722ed1' }
            }}
            chart={
              <div style={{ padding: '8px 0' }}>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  社保基数: <span style={{ color: (dataIntegrityStats?.socialInsuranceBaseCount || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                    {dataIntegrityStats?.socialInsuranceBaseCount || 0} 条
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  公积金基数: <span style={{ color: (dataIntegrityStats?.housingFundBaseCount || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                    {dataIntegrityStats?.housingFundBaseCount || 0} 条
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  个税&gt;0: <span style={{ color: (dataIntegrityStats?.incomeTaxPositiveCount || 0) > 0 ? '#52c41a' : '#fa8c16' }}>
                    {dataIntegrityStats?.incomeTaxPositiveCount || 0} 条
                  </span>
                </div>
              </div>
            }
            loading={dataIntegrityStats?.loading || false}
          />
        </Col>
        <Col xs={24} sm={12} xl={4} xxl={4}>
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
        <Col xs={24} sm={12} xl={4} xxl={4}>
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
        <Col xs={24} sm={12} xl={4} xxl={4}>
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
  );
}; 