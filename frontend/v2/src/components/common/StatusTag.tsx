import React from 'react';
import { Tag, Space } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  StopOutlined,
  SyncOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// 预定义的状态类型
export type StatusType = 
  | 'active'
  | 'inactive' 
  | 'pending'
  | 'processing'
  | 'success'
  | 'error'
  | 'warning'
  | 'draft'
  | 'closed'
  | 'archived'
  | 'planned'
  | 'cancelled'
  | 'expired'
  | 'terminated'
  | 'probation'
  | 'leave'
  | 'custom';

// 状态配置映射
const STATUS_CONFIG: Record<StatusType, {
  color: string;
  icon?: React.ReactNode;
  defaultText: string;
}> = {
  active: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    defaultText: '活跃',
  },
  inactive: {
    color: 'default',
    icon: <StopOutlined />,
    defaultText: '非活跃',
  },
  pending: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    defaultText: '待处理',
  },
  processing: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    defaultText: '处理中',
  },
  success: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    defaultText: '成功',
  },
  error: {
    color: 'red',
    icon: <ExclamationCircleOutlined />,
    defaultText: '错误',
  },
  warning: {
    color: 'orange',
    icon: <ExclamationCircleOutlined />,
    defaultText: '警告',
  },
  draft: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    defaultText: '草稿',
  },
  closed: {
    color: 'red',
    icon: <StopOutlined />,
    defaultText: '已关闭',
  },
  archived: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    defaultText: '已归档',
  },
  planned: {
    color: 'blue',
    icon: <ClockCircleOutlined />,
    defaultText: '计划中',
  },
  cancelled: {
    color: 'red',
    icon: <StopOutlined />,
    defaultText: '已取消',
  },
  expired: {
    color: 'red',
    icon: <ExclamationCircleOutlined />,
    defaultText: '已过期',
  },
  terminated: {
    color: 'red',
    icon: <StopOutlined />,
    defaultText: '已终止',
  },
  probation: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    defaultText: '试用期',
  },
  leave: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    defaultText: '休假',
  },
  custom: {
    color: 'default',
    icon: <QuestionCircleOutlined />,
    defaultText: '自定义',
  },
};

interface StatusTagProps {
  /** 状态类型 */
  status: StatusType;
  /** 自定义显示文本 */
  text?: string;
  /** 自定义颜色 */
  color?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 标签大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 翻译命名空间前缀 */
  translationPrefix?: string;
  /** 是否使用翻译 */
  useTranslation?: boolean;
}

const StatusTag: React.FC<StatusTagProps> = ({
  status,
  text,
  color,
  icon,
  showIcon = true,
  size = 'middle',
  closable = false,
  onClose,
  onClick,
  style,
  className,
  translationPrefix = 'status',
  useTranslation: useTranslationProp = true,
}) => {
  const { t } = useTranslation(['common']);
  
  // 获取状态配置
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.custom;
  
  // 确定显示文本
  const getDisplayText = () => {
    if (text) return text;
    
    if (useTranslationProp) {
      const translationKey = `${translationPrefix}.${status}`;
      const translatedText = t(translationKey, { defaultValue: '' });
      if (translatedText) return translatedText;
    }
    
    return config.defaultText;
  };
  
  // 确定颜色
  const finalColor = color || config.color;
  
  // 确定图标
  const finalIcon = icon !== undefined ? icon : (showIcon ? config.icon : undefined);
  
  // 构建标签内容
  const tagContent = (
    <Space size={4}>
      {finalIcon}
      <span>{getDisplayText()}</span>
    </Space>
  );
  
  return (
    <Tag
      color={finalColor}
      closable={closable}
      onClose={onClose}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        fontSize: size === 'small' ? '12px' : size === 'large' ? '14px' : '13px',
        ...style,
      }}
      className={className}
    >
      {tagContent}
    </Tag>
  );
};

export default StatusTag; 