import React from 'react';
import classNames from 'classnames';
import Box from './Box';
import type { BoxProps } from './Box';
import { designTokens } from '../../styles/design-tokens';
import './FlexLayout.less';

export interface FlexLayoutProps extends Omit<BoxProps, 'display'> {
  // Flex 容器属性
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
  
  // 间距
  gap?: keyof typeof designTokens.spacing;
  rowGap?: keyof typeof designTokens.spacing;
  columnGap?: keyof typeof designTokens.spacing;
  
  // 子元素属性（通过 data attributes 传递）
  flex?: string | number;
  
  // 是否内联
  inline?: boolean;
}

/**
 * FlexLayout 组件 - Flexbox 布局容器
 * 基于 Box 组件，提供 Flexbox 布局功能
 */
const FlexLayout = React.forwardRef<HTMLDivElement, FlexLayoutProps>(({
  // Flex 属性
  direction = 'row',
  wrap = 'nowrap',
  justify = 'flex-start',
  align = 'stretch',
  alignContent,
  gap,
  rowGap,
  columnGap,
  flex,
  inline = false,
  
  // 其他属性
  className,
  style,
  children,
  ...rest
}, ref) => {
  const flexStyle: React.CSSProperties = {
    flexDirection: direction,
    flexWrap: wrap,
    justifyContent: justify,
    alignItems: align,
    alignContent,
    gap: gap ? designTokens.spacing[gap] : undefined,
    rowGap: rowGap ? designTokens.spacing[rowGap] : undefined,
    columnGap: columnGap ? designTokens.spacing[columnGap] : undefined,
    flex,
    ...style,
  };
  
  const classes = classNames(
    'flex-layout',
    {
      'flex-layout--inline': inline,
    },
    className
  );
  
  return (
    <Box
      ref={ref}
      display={inline ? 'inline-flex' : 'flex'}
      className={classes}
      style={flexStyle}
      {...rest}
    >
      {children}
    </Box>
  );
});

FlexLayout.displayName = 'FlexLayout';

export default FlexLayout;
export { FlexLayout };
export type { FlexLayoutProps };