import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import classnames from 'classnames';
import './ModernButton.module.less';

export interface ModernButtonProps extends ButtonProps {
  /** 按钮变体样式 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** 是否为块级按钮（占满容器宽度） */
  fullWidth?: boolean;
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
}

/**
 * 现代化按钮组件
 * 基于简单工资页面的设计风格，提供统一的按钮样式
 */
export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  size = 'middle',
  className,
  children,
  ...restProps
}) => {
  // 根据变体确定按钮类型
  const getButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'outline':
        return 'default';
      case 'ghost':
        return 'text';
      case 'danger':
        return 'primary';
      default:
        return 'default';
    }
  };

  // 根据变体确定是否使用danger属性
  const isDanger = variant === 'danger';

  // 组合className
  const buttonClassName = classnames(
    'modern-button',
    `modern-button-${variant}`,
    {
      'modern-button-block': fullWidth,
    },
    className
  );

  return (
    <Button
      type={getButtonType()}
      danger={isDanger}
      block={fullWidth}
      size={size}
      className={buttonClassName}
      {...restProps}
    >
      {children}
    </Button>
  );
};

export default ModernButton;