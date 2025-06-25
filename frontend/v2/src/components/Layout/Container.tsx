import React from 'react';
import classNames from 'classnames';
import Box from './Box';
import type { BoxProps } from './Box';
import './Container.less';

export interface ContainerProps extends BoxProps {
  // 容器大小
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  // 是否流体容器（100% 宽度）
  fluid?: boolean;
  // 是否居中
  centered?: boolean;
}

/**
 * Container 组件 - 内容容器
 * 提供响应式的最大宽度限制和居中对齐
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({
  size = 'xl',
  fluid = false,
  centered = true,
  className,
  ...rest
}, ref) => {
  const classes = classNames(
    'layout-container',
    {
      [`layout-container--${size}`]: !fluid && size,
      'layout-container--fluid': fluid,
      'layout-container--centered': centered,
    },
    className
  );
  
  return (
    <Box
      ref={ref}
      className={classes}
      {...rest}
    />
  );
});

Container.displayName = 'Container';

export default Container;
export { Container };
export type { ContainerProps };