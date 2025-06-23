import React from 'react';
import { Space } from 'antd';
import type { SpaceProps } from 'antd';
import classnames from 'classnames';

export interface ModernButtonGroupProps extends Omit<SpaceProps, 'direction'> {
  /** 按钮排列方向 */
  direction?: 'horizontal' | 'vertical';
  /** 是否占满容器宽度（仅在垂直排列时有效） */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 现代化按钮组组件
 * 用于管理多个按钮的布局，基于简单工资页面的按钮组风格
 */
export const ModernButtonGroup: React.FC<ModernButtonGroupProps> = ({
  direction = 'horizontal',
  fullWidth = false,
  className,
  children,
  size = 'middle',
  ...restProps
}) => {
  const groupClassName = classnames(
    'modern-button-group',
    direction,
    {
      'full-width': fullWidth && direction === 'vertical',
    },
    className
  );

  return (
    <Space
      direction={direction}
      size={size}
      className={groupClassName}
      style={fullWidth && direction === 'vertical' ? { width: '100%' } : undefined}
      {...restProps}
    >
      {children}
    </Space>
  );
};

export default ModernButtonGroup;