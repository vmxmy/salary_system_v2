import React from 'react';
import classNames from 'classnames';
import Box from './Box';
import type { BoxProps } from './Box';
import { designTokens } from '../../styles/design-tokens';
import './GridLayout.less';

export interface GridLayoutProps extends Omit<BoxProps, 'display'> {
  // Grid 模板
  columns?: number | string;
  rows?: number | string;
  areas?: string[];
  
  // 间距
  gap?: keyof typeof designTokens.spacing;
  rowGap?: keyof typeof designTokens.spacing;
  columnGap?: keyof typeof designTokens.spacing;
  
  // 对齐
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
  alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
  
  // 自动布局
  autoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
  autoColumns?: string;
  autoRows?: string;
  
  // 响应式列数
  colsSm?: number;
  colsMd?: number;
  colsLg?: number;
  colsXl?: number;
  colsXxl?: number;
}

/**
 * GridLayout 组件 - CSS Grid 布局容器
 * 基于 Box 组件，提供 Grid 布局功能
 */
const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(({
  // Grid 属性
  columns,
  rows,
  areas,
  gap,
  rowGap,
  columnGap,
  justifyItems = 'stretch',
  alignItems = 'stretch',
  justifyContent = 'stretch',
  alignContent = 'stretch',
  autoFlow,
  autoColumns,
  autoRows,
  
  // 响应式
  colsSm,
  colsMd,
  colsLg,
  colsXl,
  colsXxl,
  
  // 其他属性
  className,
  style,
  children,
  ...rest
}, ref) => {
  // 处理列模板
  const getGridTemplateColumns = () => {
    if (typeof columns === 'number') {
      return `repeat(${columns}, 1fr)`;
    }
    return columns;
  };
  
  // 处理行模板
  const getGridTemplateRows = () => {
    if (typeof rows === 'number') {
      return `repeat(${rows}, auto)`;
    }
    return rows;
  };
  
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: getGridTemplateColumns(),
    gridTemplateRows: getGridTemplateRows(),
    gridTemplateAreas: areas ? areas.map(area => `"${area}"`).join(' ') : undefined,
    gap: gap ? designTokens.spacing[gap] : undefined,
    rowGap: rowGap ? designTokens.spacing[rowGap] : undefined,
    columnGap: columnGap ? designTokens.spacing[columnGap] : undefined,
    justifyItems,
    alignItems,
    justifyContent,
    alignContent,
    gridAutoFlow: autoFlow,
    gridAutoColumns: autoColumns,
    gridAutoRows: autoRows,
    ...style,
  };
  
  const classes = classNames(
    'grid-layout',
    {
      [`grid-layout--cols-sm-${colsSm}`]: colsSm,
      [`grid-layout--cols-md-${colsMd}`]: colsMd,
      [`grid-layout--cols-lg-${colsLg}`]: colsLg,
      [`grid-layout--cols-xl-${colsXl}`]: colsXl,
      [`grid-layout--cols-xxl-${colsXxl}`]: colsXxl,
    },
    className
  );
  
  return (
    <Box
      ref={ref}
      display="grid"
      className={classes}
      style={gridStyle}
      {...rest}
    >
      {children}
    </Box>
  );
});

GridLayout.displayName = 'GridLayout';

export default GridLayout;
export { GridLayout };
export type { GridLayoutProps };