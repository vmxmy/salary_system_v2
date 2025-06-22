import React from 'react';
import { Space, Button, Tag, Progress, Typography, Divider, Affix, Tooltip } from 'antd';
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
}

export const PayrollContextBar: React.FC<PayrollContextBarProps> = ({
  currentPeriod,
  currentVersion,
  onPeriodChange,
  onVersionChange,
  onSettings
}) => {
  // 获取进度百分比
  const getProgress = () => {
    if (!currentVersion) return 0;
    const statusMap: Record<string, number> = {
      'DRAFT': 20,
      '草稿': 20,
      'PRUN_CALCULATED': 40,
      '已计算': 40,
      'IN_REVIEW': 60,
      '审核中': 60,
      'APPROVED_FOR_PAYMENT': 80,
      '批准支付': 80,
      'PAID': 100,
      '已支付': 100
    };
    return statusMap[currentVersion.status_name] || 0;
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

  return (
    <Affix offsetTop={0}>
      <div className="payroll-context-bar">
        <div className="context-content">
          <div className="context-left">
            <Space size="large">
              {/* 薪资周期 */}
              <Space className="context-section">
                <CalendarOutlined className="context-icon period-icon" />
                <div className="context-info">
                  <Text strong className="context-label">薪资周期</Text>
                  <Text className="context-value">
                    {formatPeriod(currentPeriod)}
                  </Text>
                </div>
                {onPeriodChange && (
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<SwapOutlined />}
                    onClick={onPeriodChange}
                    className="context-action"
                  >
                    切换
                  </Button>
                )}
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
                      <Text className="progress-label">流程进度</Text>
                      <Progress 
                        percent={getProgress()} 
                        size="small"
                        showInfo={false}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                        className="progress-bar"
                      />
                    </div>
                    <Text className="progress-text">{getProgress()}%</Text>
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
    </Affix>
  );
};

export default PayrollContextBar;