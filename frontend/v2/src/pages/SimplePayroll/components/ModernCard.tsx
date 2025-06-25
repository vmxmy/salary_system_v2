import React from 'react';
import { Card, type CardProps } from 'antd';
import classNames from 'classnames';
import styles from '../styles/SimplePayrollStyles.module.less';

interface ModernCardProps extends CardProps {
  icon?: React.ReactNode;
  iconColor?: 'blue' | 'purple' | 'green' | 'orange';
  headerMode?: 'default' | 'compact' | 'transparent';
  subtitle?: React.ReactNode;
  badge?: {
    text: string;
    type?: 'default' | 'success' | 'warning' | 'error';
  };
  headerActions?: React.ReactNode;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  icon,
  iconColor = 'blue',
  headerMode = 'default',
  subtitle,
  badge,
  headerActions,
  className,
  children,
  ...restProps
}) => {
  // 构建自定义标题
  const customTitle = title && (
    <div className={styles.headerTitle}>
      {icon && (
        <span className={classNames(styles.headerIcon, styles[iconColor])}>
          {icon}
        </span>
      )}
      <span className={styles.headerText}>
        {title}
        {subtitle && <span className={styles.headerSubtext}>{subtitle}</span>}
      </span>
    </div>
  );

  // 构建额外内容
  const customExtra = (
    <div className={styles.headerExtra}>
      {badge && (
        <span className={classNames(styles.headerBadge, badge.type && styles[badge.type])}>
          {badge.text}
        </span>
      )}
      {headerActions && (
        <div className={styles.headerActions}>
          {headerActions}
        </div>
      )}
      {restProps.extra}
    </div>
  );

  return (
    <Card
      {...restProps}
      className={classNames(
        styles.baseCard,
        styles.modernCard,
        className
      )}
      title={customTitle}
      extra={customExtra}
      styles={{
        ...restProps.styles,
        header: {
          ...restProps.styles?.header,
          padding: 0,
          border: 'none',
          background: 'transparent'
        }
      }}
    >
      <div className={classNames(
        styles.baseHeader,
        headerMode !== 'default' && styles[headerMode]
      )}>
        {customTitle}
        {customExtra}
      </div>
      <div className={styles.modernCardBody}>
        {children}
      </div>
    </Card>
  );
};

export default ModernCard;