import React from 'react';
import {
  Select,
  Tag,
  Typography,
  Space,
  Tooltip
} from 'antd';
import {
  CalendarOutlined,
  DatabaseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

import type { PayrollPeriod } from '../types/index';

interface PayrollPeriodSelectorProps {
  periods: PayrollPeriod[];
  selectedPeriodId: number | null;
  onChange: (periodId: number) => void;
  loading?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  showRecordCount?: boolean;
  showDateRange?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const PayrollPeriodSelector: React.FC<PayrollPeriodSelectorProps> = ({
  periods,
  selectedPeriodId,
  onChange,
  loading = false,
  placeholder = "请选择薪资周期",
  style,
  showRecordCount = true,
  showDateRange = true,
  size = 'middle'
}) => {
  // 格式化日期范围显示
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const end = new Date(endDate).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return `${start} ~ ${end}`;
  };

  // 获取状态标签颜色
  const getStatusColor = (status?: string) => {
    if (!status) return 'blue';
    switch (status.toLowerCase()) {
      case 'active':
      case '活跃':
        return 'green';
      case 'closed':
      case '已关闭':
        return 'red';
      case 'pending':
      case '待处理':
        return 'orange';
      default:
        return 'blue';
    }
  };

  // 获取状态显示文本
  const getStatusText = (status?: string) => {
    if (!status) return '正常';
    switch (status.toLowerCase()) {
      case 'active':
        return '活跃';
      case 'closed':
        return '已关闭';
      case 'pending':
        return '待处理';
      default:
        return status;
    }
  };

  return (
    <Select
      value={selectedPeriodId}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: '100%', ...style }}
      size={size}
      loading={loading}
      showSearch
      filterOption={(input, option) => {
        const label = option?.children?.toString().toLowerCase() || '';
        return label.includes(input.toLowerCase());
      }}
      optionLabelProp="label"
    >
      {periods.map(period => {
        const recordCount = period.employee_count || 0;
        const hasRecords = recordCount > 0;
        
        return (
          <Option 
            key={period.id} 
            value={period.id}
            label={period.name}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 0'
            }}>
              {/* 左侧：周期名称和日期 */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '2px' 
                }}>
                  <CalendarOutlined style={{ 
                    marginRight: '6px', 
                    color: '#1890ff',
                    fontSize: '14px'
                  }} />
                  <Text strong style={{ fontSize: '14px' }}>
                    {period.name}
                  </Text>
                </div>
                
                {showDateRange && (
                  <div style={{ 
                    marginLeft: '20px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    {formatDateRange(period.start_date, period.end_date)}
                  </div>
                )}
              </div>

              {/* 右侧：标签区域 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                marginLeft: '12px'
              }}>
                {/* 记录数标签 */}
                {showRecordCount && (
                  <Tooltip title={`该周期包含 ${recordCount} 条薪资记录`}>
                    <Tag 
                      color={hasRecords ? 'green' : 'default'}
                      style={{ 
                        margin: 0,
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <DatabaseOutlined style={{ fontSize: '10px' }} />
                      {recordCount}
                    </Tag>
                  </Tooltip>
                )}

                {/* 状态标签 - 暂时隐藏，因为PayrollPeriod类型中没有status字段 */}
                {/* 
                <Tag 
                  color={getStatusColor(period.status)}
                  style={{ 
                    margin: 0,
                    fontSize: '11px'
                  }}
                >
                  {getStatusText(period.status)}
                </Tag>
                */}

                {/* 描述信息图标 - 暂时隐藏，因为PayrollPeriod类型中没有description字段 */}
                {/* 
                {period.description && (
                  <Tooltip title={period.description}>
                    <InfoCircleOutlined style={{ 
                      color: '#8c8c8c',
                      fontSize: '12px'
                    }} />
                  </Tooltip>
                )}
                */}
              </div>
            </div>
          </Option>
        );
      })}
    </Select>
  );
};

export default PayrollPeriodSelector; 