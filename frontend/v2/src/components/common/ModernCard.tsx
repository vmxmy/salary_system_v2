import React from 'react';
import { Card } from 'antd';
import type { CardProps } from 'antd';
import './ModernCard.module.less';

export interface ModernCardProps extends Omit<CardProps, 'className'> {
  /** 自定义类名 */
  className?: string;
  /** 卡片变体 */
  variant?: 'default' | 'compact' | 'elevated' | 'bordered';
  /** 是否启用悬停效果 */
  hoverable?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 卡片图标 */
  icon?: React.ReactNode;
  /** 卡片副标题 */
  subtitle?: string;
  /** 底部操作区内容 */
  actions?: React.ReactNode;
  /** 是否使用现代化样式 */
  modern?: boolean;
}

/**
 * 现代化卡片组件
 * 基于 Ant Design Card，应用统一的现代化设计系统
 */
export const ModernCard: React.FC<ModernCardProps> = ({
  className = '',
  variant = 'default',
  hoverable = true,
  loading = false,
  icon,
  title,
  subtitle,
  actions,
  modern = true,
  children,
  ...restProps
}) => {
  const cardClassName = [
    modern ? 'modern-card' : '',
    `variant-${variant}`,
    hoverable ? 'hoverable' : '',
    loading ? 'loading' : '',
    className
  ].filter(Boolean).join(' ');

  // 自定义标题渲染
  const renderTitle = () => {
    if (!title && !icon) return undefined;
    
    return (
      <div className="card-title-wrapper">
        {icon && <span className="card-icon">{icon}</span>}
        {title && <span className="card-title-text">{title}</span>}
      </div>
    );
  };

  // 自定义额外内容
  const renderExtra = () => {
    if (subtitle) {
      return (
        <div className="card-subtitle">
          {subtitle}
        </div>
      );
    }
    return restProps.extra;
  };

  return (
    <Card
      {...restProps}
      className={cardClassName}
      title={renderTitle()}
      extra={renderExtra()}
      loading={loading}
    >
      {/* 主要内容 */}
      <div className="card-content-wrapper">
        {children}
      </div>
      
      {/* 底部操作区 */}
      {actions && (
        <div className="card-actions">
          {actions}
        </div>
      )}
    </Card>
  );
};

export default ModernCard;