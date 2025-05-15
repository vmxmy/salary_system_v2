/**
 * 样式辅助函数
 * 提供用于处理样式的实用工具函数
 */

import { CSSProperties } from 'react';

/**
 * 合并多个样式对象
 * @param styles 要合并的样式对象数组
 * @returns 合并后的样式对象
 */
export const mergeStyles = (...styles: (CSSProperties | undefined)[]): CSSProperties => {
  return Object.assign({}, ...styles.filter(Boolean));
};

/**
 * 创建条件样式对象
 * @param condition 条件
 * @param trueStyles 条件为真时的样式
 * @param falseStyles 条件为假时的样式（可选）
 * @returns 根据条件选择的样式对象
 */
export const conditionalStyle = (
  condition: boolean,
  trueStyles: CSSProperties,
  falseStyles: CSSProperties = {}
): CSSProperties => {
  return condition ? trueStyles : falseStyles;
};

/**
 * 创建响应式样式对象
 * @param defaultStyle 默认样式
 * @param breakpoints 断点样式映射
 * @returns 包含媒体查询的样式对象
 */
export const responsiveStyle = (
  defaultStyle: CSSProperties,
  breakpoints: { [key: string]: CSSProperties }
): CSSProperties => {
  // 注意：这个函数在运行时不会真正应用媒体查询
  // 它只是一个概念示例，实际应用中应该使用 CSS-in-JS 库或 CSS 类
  return defaultStyle;
};

/**
 * 创建间距样式
 * @param spacing 间距值或对象
 * @returns 包含 margin 或 padding 的样式对象
 */
export const createSpacing = (
  spacing: number | { top?: number; right?: number; bottom?: number; left?: number },
  type: 'margin' | 'padding' = 'margin'
): CSSProperties => {
  if (typeof spacing === 'number') {
    return {
      [type]: spacing,
    };
  }

  const { top, right, bottom, left } = spacing;
  return {
    [`${type}Top`]: top,
    [`${type}Right`]: right,
    [`${type}Bottom`]: bottom,
    [`${type}Left`]: left,
  };
};

/**
 * 创建 flex 布局样式
 * @param options flex 布局选项
 * @returns flex 布局样式对象
 */
export const createFlex = (options: {
  direction?: CSSProperties['flexDirection'];
  justify?: CSSProperties['justifyContent'];
  align?: CSSProperties['alignItems'];
  wrap?: CSSProperties['flexWrap'];
  gap?: number | string;
}): CSSProperties => {
  const { direction, justify, align, wrap, gap } = options;
  return {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
    gap,
  };
};

/**
 * 创建文本样式
 * @param options 文本样式选项
 * @returns 文本样式对象
 */
export const createText = (options: {
  size?: number | string;
  weight?: CSSProperties['fontWeight'];
  color?: string;
  align?: CSSProperties['textAlign'];
  transform?: CSSProperties['textTransform'];
  lineHeight?: number | string;
  letterSpacing?: number | string;
  truncate?: boolean | number;
}): CSSProperties => {
  const { size, weight, color, align, transform, lineHeight, letterSpacing, truncate } = options;
  
  const baseStyle: CSSProperties = {
    fontSize: size,
    fontWeight: weight,
    color,
    textAlign: align,
    textTransform: transform,
    lineHeight,
    letterSpacing,
  };

  if (truncate === true) {
    return {
      ...baseStyle,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
  }

  if (typeof truncate === 'number' && truncate > 0) {
    return {
      ...baseStyle,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: truncate,
      WebkitBoxOrient: 'vertical',
    };
  }

  return baseStyle;
};

/**
 * 创建边框样式
 * @param options 边框样式选项
 * @returns 边框样式对象
 */
export const createBorder = (options: {
  width?: number | string;
  style?: CSSProperties['borderStyle'];
  color?: string;
  radius?: number | string;
  side?: 'all' | 'top' | 'right' | 'bottom' | 'left';
}): CSSProperties => {
  const { width = 1, style = 'solid', color = '#d9d9d9', radius, side = 'all' } = options;
  
  const borderValue = `${width}px ${style} ${color}`;
  
  const baseStyle: CSSProperties = {
    ...(side === 'all' ? { border: borderValue } : {}),
    ...(side === 'top' ? { borderTop: borderValue } : {}),
    ...(side === 'right' ? { borderRight: borderValue } : {}),
    ...(side === 'bottom' ? { borderBottom: borderValue } : {}),
    ...(side === 'left' ? { borderLeft: borderValue } : {}),
    ...(radius !== undefined ? { borderRadius: radius } : {}),
  };

  return baseStyle;
};

/**
 * 创建阴影样式
 * @param level 阴影级别 (1-4)
 * @returns 阴影样式对象
 */
export const createShadow = (level: 1 | 2 | 3 | 4 = 1): CSSProperties => {
  const shadows = {
    1: '0 2px 8px rgba(0, 0, 0, 0.15)',
    2: '0 4px 12px rgba(0, 0, 0, 0.15)',
    3: '0 6px 16px rgba(0, 0, 0, 0.15)',
    4: '0 8px 24px rgba(0, 0, 0, 0.15)',
  };

  return {
    boxShadow: shadows[level],
  };
};
