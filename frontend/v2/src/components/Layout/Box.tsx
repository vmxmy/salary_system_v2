import React from 'react';
import classNames from 'classnames';
import { designTokens } from '../../styles/design-tokens';
import './Box.less';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  // 间距属性
  p?: keyof typeof designTokens.spacing;
  px?: keyof typeof designTokens.spacing;
  py?: keyof typeof designTokens.spacing;
  pt?: keyof typeof designTokens.spacing;
  pr?: keyof typeof designTokens.spacing;
  pb?: keyof typeof designTokens.spacing;
  pl?: keyof typeof designTokens.spacing;
  
  // 外边距属性
  m?: keyof typeof designTokens.spacing;
  mx?: keyof typeof designTokens.spacing;
  my?: keyof typeof designTokens.spacing;
  mt?: keyof typeof designTokens.spacing;
  mr?: keyof typeof designTokens.spacing;
  mb?: keyof typeof designTokens.spacing;
  ml?: keyof typeof designTokens.spacing;
  
  // 显示属性
  display?: 'block' | 'inline-block' | 'inline' | 'flex' | 'inline-flex' | 'grid' | 'none';
  
  // 定位属性
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  
  // 尺寸属性
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  
  // 背景和边框
  bg?: keyof typeof designTokens.background;
  border?: boolean;
  borderColor?: keyof typeof designTokens.border;
  borderRadius?: keyof typeof designTokens.borderRadius;
  
  // 阴影
  shadow?: keyof typeof designTokens.shadows;
  
  // 溢出处理
  overflow?: 'visible' | 'hidden' | 'auto' | 'scroll';
  overflowX?: 'visible' | 'hidden' | 'auto' | 'scroll';
  overflowY?: 'visible' | 'hidden' | 'auto' | 'scroll';
  
  // 子元素
  children?: React.ReactNode;
  
  // 自定义类名
  className?: string;
  
  // 作为其他元素
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Box 组件 - 基础布局原语
 * 提供灵活的间距、定位和样式控制
 */
const Box = React.forwardRef<HTMLDivElement, BoxProps>(({
  // 间距
  p, px, py, pt, pr, pb, pl,
  // 外边距
  m, mx, my, mt, mr, mb, ml,
  // 显示
  display,
  position,
  // 尺寸
  width, height, minWidth, maxWidth, minHeight, maxHeight,
  // 样式
  bg, border, borderColor, borderRadius, shadow,
  // 溢出
  overflow, overflowX, overflowY,
  // 其他
  className, style, children, as: Component = 'div',
  ...rest
}, ref) => {
  // 构建样式对象
  const computedStyle: React.CSSProperties = {
    // 间距
    padding: p ? designTokens.spacing[p] : undefined,
    paddingLeft: px ? designTokens.spacing[px] : pl ? designTokens.spacing[pl] : undefined,
    paddingRight: px ? designTokens.spacing[px] : pr ? designTokens.spacing[pr] : undefined,
    paddingTop: py ? designTokens.spacing[py] : pt ? designTokens.spacing[pt] : undefined,
    paddingBottom: py ? designTokens.spacing[py] : pb ? designTokens.spacing[pb] : undefined,
    
    // 外边距
    margin: m ? designTokens.spacing[m] : undefined,
    marginLeft: mx ? designTokens.spacing[mx] : ml ? designTokens.spacing[ml] : undefined,
    marginRight: mx ? designTokens.spacing[mx] : mr ? designTokens.spacing[mr] : undefined,
    marginTop: my ? designTokens.spacing[my] : mt ? designTokens.spacing[mt] : undefined,
    marginBottom: my ? designTokens.spacing[my] : mb ? designTokens.spacing[mb] : undefined,
    
    // 显示和定位
    display,
    position,
    
    // 尺寸
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    
    // 背景
    backgroundColor: bg ? designTokens.background[bg] : undefined,
    
    // 边框
    border: border ? `1px solid ${borderColor ? designTokens.border[borderColor] : designTokens.border.default}` : undefined,
    borderRadius: borderRadius ? designTokens.borderRadius[borderRadius] : undefined,
    
    // 阴影
    boxShadow: shadow ? designTokens.shadows[shadow] : undefined,
    
    // 溢出
    overflow,
    overflowX,
    overflowY,
    
    // 合并自定义样式
    ...style,
  };
  
  const classes = classNames('layout-box', className);
  
  return React.createElement(
    Component,
    {
      ref,
      className: classes,
      style: computedStyle,
      ...rest,
    },
    children
  );
});

Box.displayName = 'Box';

export default Box;
export { Box };
export type { BoxProps };