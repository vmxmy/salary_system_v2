/**
 * 响应式断点系统
 * 
 * 设计原则：
 * 1. 移动优先（Mobile First）设计理念
 * 2. 基于常见设备尺寸定义断点
 * 3. 与 Ant Design 断点保持兼容
 * 4. 提供工具函数简化媒体查询使用
 */

// 断点定义（单位：px）
export const BREAKPOINTS = {
  xs: 0,      // 手机竖屏 (0-575px)
  sm: 576,    // 手机横屏 (576-767px)
  md: 768,    // 平板竖屏 (768-991px)
  lg: 992,    // 平板横屏/小笔记本 (992-1199px)
  xl: 1200,   // 桌面显示器 (1200-1599px)
  xxl: 1600,  // 大屏显示器 (1600px+)
} as const;

// 断点类型
export type Breakpoint = keyof typeof BREAKPOINTS;

// 设备类型映射
export const DEVICE_TYPES = {
  mobile: ['xs', 'sm'] as const,
  tablet: ['md', 'lg'] as const,
  desktop: ['xl', 'xxl'] as const,
} as const;

// 媒体查询字符串
export const MEDIA_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS.xxl - 1}px)`,
  xxl: `(min-width: ${BREAKPOINTS.xxl}px)`,
  
  // 辅助查询
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.xl}px)`,
  
  // 方向查询
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // 高分辨率屏幕
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
} as const;

// 工具函数：生成最小宽度媒体查询
export const minWidth = (breakpoint: Breakpoint): string => {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
};

// 工具函数：生成最大宽度媒体查询
export const maxWidth = (breakpoint: Breakpoint): string => {
  const nextBreakpoints = Object.keys(BREAKPOINTS) as Breakpoint[];
  const currentIndex = nextBreakpoints.indexOf(breakpoint);
  
  if (currentIndex === nextBreakpoints.length - 1) {
    // 最大断点，返回无限大
    return `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
  }
  
  const nextBreakpoint = nextBreakpoints[currentIndex + 1];
  return `(max-width: ${BREAKPOINTS[nextBreakpoint] - 1}px)`;
};

// 工具函数：生成范围媒体查询
export const between = (min: Breakpoint, max: Breakpoint): string => {
  return `(min-width: ${BREAKPOINTS[min]}px) and (max-width: ${BREAKPOINTS[max] - 1}px)`;
};

// 工具函数：检查当前窗口是否匹配断点
export const matchesBreakpoint = (breakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  
  const query = window.matchMedia(minWidth(breakpoint));
  return query.matches;
};

// 工具函数：获取当前断点
export const getCurrentBreakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'xs';
  
  const breakpoints = Object.keys(BREAKPOINTS).reverse() as Breakpoint[];
  
  for (const breakpoint of breakpoints) {
    if (matchesBreakpoint(breakpoint)) {
      return breakpoint;
    }
  }
  
  return 'xs';
};

// 工具函数：判断是否为移动设备
export const isMobile = (): boolean => {
  const currentBreakpoint = getCurrentBreakpoint();
  return DEVICE_TYPES.mobile.includes(currentBreakpoint as any);
};

// 工具函数：判断是否为平板设备
export const isTablet = (): boolean => {
  const currentBreakpoint = getCurrentBreakpoint();
  return DEVICE_TYPES.tablet.includes(currentBreakpoint as any);
};

// 工具函数：判断是否为桌面设备
export const isDesktop = (): boolean => {
  const currentBreakpoint = getCurrentBreakpoint();
  return DEVICE_TYPES.desktop.includes(currentBreakpoint as any);
};

// 导出 LESS 变量（用于样式文件）
export const breakpointsLessVariables = `
// Breakpoint Variables (Auto-generated - DO NOT EDIT)
@screen-xs-min: ${BREAKPOINTS.xs}px;
@screen-sm-min: ${BREAKPOINTS.sm}px;
@screen-md-min: ${BREAKPOINTS.md}px;
@screen-lg-min: ${BREAKPOINTS.lg}px;
@screen-xl-min: ${BREAKPOINTS.xl}px;
@screen-xxl-min: ${BREAKPOINTS.xxl}px;

// Maximum breakpoints (one less than next breakpoint)
@screen-xs-max: ${BREAKPOINTS.sm - 1}px;
@screen-sm-max: ${BREAKPOINTS.md - 1}px;
@screen-md-max: ${BREAKPOINTS.lg - 1}px;
@screen-lg-max: ${BREAKPOINTS.xl - 1}px;
@screen-xl-max: ${BREAKPOINTS.xxl - 1}px;
`;

// React Hook: 响应式断点监听
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(getCurrentBreakpoint());
  
  React.useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    breakpoint,
    isMobile: DEVICE_TYPES.mobile.includes(breakpoint as any),
    isTablet: DEVICE_TYPES.tablet.includes(breakpoint as any),
    isDesktop: DEVICE_TYPES.desktop.includes(breakpoint as any),
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    isXxl: breakpoint === 'xxl',
  };
};

// 导入 React（用于 Hook）
import React from 'react';