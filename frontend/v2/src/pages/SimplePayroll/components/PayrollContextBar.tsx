import React from 'react';
import { Space, Button, Tag, Progress, Typography, Divider, Tooltip, DatePicker } from 'antd';
import { 
  CalendarOutlined, 
  FileTextOutlined, 
  SettingOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './PayrollContextBar.less';
import type { PayrollRun, PayrollPeriod } from '../types/simplePayroll';
import dayjs from 'dayjs';

const { Text } = Typography;

interface PayrollContextBarProps {
  currentPeriod: PayrollPeriod | null;
  currentVersion: PayrollRun | null;
  onPeriodChange?: () => void;
  onVersionChange?: () => void;
  onSettings?: () => void;
  onDateChange?: (year: number, month: number) => void;
}

export const PayrollContextBar: React.FC<PayrollContextBarProps> = ({
  currentPeriod,
  currentVersion,
  onPeriodChange,
  onVersionChange,
  onSettings,
  onDateChange
}) => {
  // 根据真实工作流程步骤获取进度百分比
  const getProgress = () => {
    if (!currentVersion) return 0;
    
    // 基于真实的工作流程步骤计算进度
    const stepProgress = getCurrentStepFromStatus(currentVersion.status_name);
    const totalSteps = 5; // 总共5个步骤：数据准备、审核检查、审核批准、支付准备、完成归档
    
    // 将步骤转换为百分比，每个步骤完成后增加20%
    return Math.round(((stepProgress + 1) / totalSteps) * 100);
  };

  // 根据状态名称获取当前步骤（与工作流程保持一致）
  const getCurrentStepFromStatus = (statusName?: string): number => {
    switch (statusName) {
      case 'DRAFT':
      case '草稿':
        return 0; // 数据准备（20%）
      case 'PRUN_CALCULATED':
      case '已计算':
        return 1; // 审核检查（40%）
      case 'IN_REVIEW':
      case '审核中':
        return 2; // 审核批准（60%）
      case 'APPROVED_FOR_PAYMENT':
      case '批准支付':
        return 3; // 支付准备（80%）
      case 'PAID':
      case '已支付':
        return 4; // 完成归档（100%）
      default:
        return 0;
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (!currentVersion) return 'default';
    const statusColorMap: Record<string, string> = {
      'DRAFT': 'processing',
      '草稿': 'processing',
      'PRUN_CALCULATED': 'warning',
      '已计算': 'warning',
      'IN_REVIEW': 'processing',
      '审核中': 'processing',
      'APPROVED_FOR_PAYMENT': 'success',
      '批准支付': 'success',
      'PAID': 'success',
      '已支付': 'success'
    };
    return statusColorMap[currentVersion.status_name] || 'default';
  };

  // 格式化周期显示
  const formatPeriod = (period: PayrollPeriod | null) => {
    if (!period) return '未选择周期';
    if (period.start_date) {
      return dayjs(period.start_date).format('YYYY年MM月');
    }
    return period.name;
  };

  // 格式化版本显示
  const formatVersion = (version: PayrollRun | null) => {
    if (!version) return '无版本';
    return `版本 ${version.version_number || '1.0'}`;
  };

  // 获取当前步骤名称
  const getCurrentStepName = (statusName?: string): string => {
    switch (statusName) {
      case 'DRAFT':
      case '草稿':
        return '数据准备';
      case 'PRUN_CALCULATED':
      case '已计算':
        return '审核检查';
      case 'IN_REVIEW':
      case '审核中':
        return '审核批准';
      case 'APPROVED_FOR_PAYMENT':
      case '批准支付':
        return '支付准备';
      case 'PAID':
      case '已支付':
        return '完成归档';
      default:
        return '数据准备';
    }
  };

  return (
    <div className="payroll-context-bar">
      <div className="context-content">
        <div className="context-left">
          <Space size="large">
              {/* 薪资周期 */}
              <Space className="context-section">
                <CalendarOutlined className="context-icon period-icon" />
                <div className="context-info">
                  <Text strong className="context-label">薪资周期</Text>
                </div>
                <div className="period-actions">
                  {/* 日期选择器 */}
                  <DatePicker
                    picker="month"
                    format="YYYY年MM月"
                    placeholder="选择月份"
                    size="small"
                    value={currentPeriod?.start_date ? dayjs(currentPeriod.start_date) : null}
                    onChange={(date) => {
                      if (date && onDateChange) {
                        onDateChange(date.year(), date.month() + 1);
                      }
                    }}
                    className="period-date-picker"
                    allowClear={false}
                  />
                </div>
              </Space>

              <Divider type="vertical" className="context-divider" />

              {/* 工资运行版本 */}
              <Space className="context-section">
                <FileTextOutlined className="context-icon version-icon" />
                <div className="context-info">
                  <Text strong className="context-label">工资运行</Text>
                  <div className="version-status">
                    <Text className="context-value">
                      {formatVersion(currentVersion)}
                    </Text>
                    {currentVersion && (
                      <Tag 
                        color={getStatusColor()} 
                        className="status-tag"
                      >
                        {currentVersion.status_name}
                      </Tag>
                    )}
                  </div>
                </div>
                {onVersionChange && currentVersion && (
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<SwapOutlined />}
                    onClick={onVersionChange}
                    className="context-action"
                  >
                    切换
                  </Button>
                )}
              </Space>

              <Divider type="vertical" className="context-divider" />

              {/* 进度条 */}
              {currentVersion && (
                <div className="progress-section">
                  <Space align="center">
                    <ClockCircleOutlined className="context-icon progress-icon" />
                    <div className="progress-info">
                      <Text className="progress-label">{getCurrentStepName(currentVersion.status_name)}</Text>
                      <Progress 
                        percent={getProgress()} 
                        size="small"
                        showInfo={false}
                        strokeColor={{
                          '0%': '#108ee9',
                          '50%': '#52c41a',
                          '100%': '#87d068',
                        }}
                        className="progress-bar"
                      />
                    </div>
                    <div className="progress-detail">
                      <Text className="progress-text">{getProgress()}%</Text>
                      <Text className="progress-step">第{getCurrentStepFromStatus(currentVersion.status_name) + 1}/5步</Text>
                    </div>
                  </Space>
                </div>
              )}
            </Space>
          </div>

          <div className="context-right">
            <Space>
              {/* 信息提示 */}
              {currentPeriod && currentVersion && (
                <Tooltip title={`创建时间: ${dayjs(currentVersion.initiated_at).format('YYYY-MM-DD HH:mm')}`}>
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<InfoCircleOutlined />}
                    className="context-info-btn"
                  />
                </Tooltip>
              )}

              {/* 设置按钮 */}
              {onSettings && (
                <Button 
                  size="small" 
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={onSettings}
                  className="context-settings"
                >
                  设置
                </Button>
              )}
            </Space>
        </div>
      </div>
    </div>
  );
};

export default PayrollContextBar;