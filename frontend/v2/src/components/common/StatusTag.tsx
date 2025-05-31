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
    defaultText: {t('components:auto_text_e6b4bb')},
  },
  inactive: {
    color: 'default',
    icon: <StopOutlined />,
    defaultText: {t('components:auto_text_e99d9e')},
  },
  pending: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    defaultText: {t('components:auto_text_e5be85')},
  },
  processing: {
    color: 'blue',
    icon: <SyncOutlined spin />,
    defaultText: {t('components:auto_text_e5a484')},
  },
  success: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    defaultText: {t('components:auto_text_e68890')},
  },
  error: {
    color: 'red',
    icon: <ExclamationCircleOutlined />,
    defaultText: {t('components:auto_text_e99499')},
  },
  warning: {
    color: 'orange',
    icon: <ExclamationCircleOutlined />,
    defaultText: {t('components:auto_text_e8ada6')},
  },
  draft: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    defaultText: {t('components:auto_text_e88d89')},
  },
  closed: {
    color: 'red',
    icon: <StopOutlined />,
    defaultText: {t('components:auto_text_e5b7b2')},
  },
  archived: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    defaultText: {t('components:auto_text_e5b7b2')},
  },
  planned: {
    color: 'blue',
    icon: <ClockCircleOutlined />,
    defaultText: {t('components:auto_text_e8aea1')},
  },
  cancelled: {
    color: 'red',
    icon: <StopOutlined />,
    defaultText: {t('components:auto_text_e5b7b2')},
  },
  expired: {
    color: 'red',
    icon: <ExclamationCircleOutlined />,
    defaultText: {t('components:auto_text_e5b7b2')},
  },
  terminated: {
    color: 'red',
    icon: <StopOutlined />,
    defaultText: {t('components:auto_text_e5b7b2')},
  },
  probation: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    defaultText: {t('components:auto_text_e8af95')},
  },
  leave: {
    color: 'orange',
    icon: <ClockCircleOutlined />,
    defaultText: {t('components:auto_text_e4bc91')},
  },
  custom: {
    color: 'default',
    icon: <QuestionCircleOutlined />,
    defaultText: {t('components:auto_text_e887aa')},
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