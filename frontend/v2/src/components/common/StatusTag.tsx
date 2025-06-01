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
  translationKey: string;
}> = {
  active: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    translationKey: 'status.active',
  },
  inactive: {
    color: 'default',
    icon: <StopOutlined />,
    translationKey: 'status.inactive',
  },
  pending: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    translationKey: 'status.pending',
  },
  processing: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    translationKey: 'status.processing',
  },
  success: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    translationKey: 'status.success',
  },
  error: {
    color: 'red',
    icon: <ExclamationCircleOutlined />,
    translationKey: 'status.error',
  },
  warning: {
    color: 'orange',
    icon: <ExclamationCircleOutlined />,
    translationKey: 'status.warning',
  },
  draft: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    translationKey: 'status.draft',
  },
  closed: {
    color: 'red',
    icon: <StopOutlined />,
    translationKey: 'status.closed',
  },
  archived: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    translationKey: 'status.archived',
  },
  planned: {
    color: 'blue',
    icon: <ClockCircleOutlined />,
    translationKey: 'status.planned',
  },
  cancelled: {
    color: 'red',
    icon: <StopOutlined />,
    translationKey: 'status.cancelled',
  },
  expired: {
    color: 'red',
    icon: <ExclamationCircleOutlined />,
    translationKey: 'status.expired',
  },
  terminated: {
    color: 'red',
    icon: <StopOutlined />,
    translationKey: 'status.terminated',
  },
  probation: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    translationKey: 'status.probation',
  },
  leave: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    translationKey: 'status.leave',
  },
  custom: {
    color: 'default',
    icon: <QuestionCircleOutlined />,
    translationKey: 'status.custom',
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
    
    // 优先使用 translationPrefix + status 作为 key，如果useTranslationProp为true
    if (useTranslationProp) {
      const specificKey = `${translationPrefix}.${status}`;
      const defaultKey = `common:status.${status}`; // Fallback to common status keys
      const translatedText = t(specificKey, t(defaultKey, config.translationKey)); // Use config.translationKey as final fallback default
      if (translatedText !== config.translationKey) return translatedText;
    }
    
    return t(config.translationKey); // Fallback to translating the configured key
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