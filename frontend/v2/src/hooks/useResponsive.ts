import { useState, useEffect } from 'react';

// 响应式断点定义
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

export interface ResponsiveInfo {
  // 当前屏幕宽度
  width: number;
  // 当前屏幕高度
  height: number;
  // 是否为移动设备
  isMobile: boolean;
  // 是否为平板设备
  isTablet: boolean;
  // 是否为桌面设备
  isDesktop: boolean;
  // 断点状态
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
  // 当前激活的断点
  activeBreakpoint: BreakpointKey;
}

/**
 * 响应式检测钩子
 * @returns ResponsiveInfo 响应式信息对象
 */
export const useResponsive = (): ResponsiveInfo => {
  const [responsiveInfo, setResponsiveInfo] = useState<ResponsiveInfo>(() => {
    if (typeof window === 'undefined') {
      // SSR 环境下的默认值
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        xs: false,
        sm: false,
        md: false,
        lg: false,
        xl: true,
        xxl: false,
        activeBreakpoint: 'xl' as BreakpointKey,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return getResponsiveInfo(width, height);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setResponsiveInfo(getResponsiveInfo(width, height));
    };

    // 添加事件监听器
    window.addEventListener('resize', handleResize);

    // 初始化
    handleResize();

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return responsiveInfo;
};

/**
 * 根据屏幕尺寸计算响应式信息
 * @param width 屏幕宽度
 * @param height 屏幕高度
 * @returns ResponsiveInfo
 */
function getResponsiveInfo(width: number, height: number): ResponsiveInfo {
  // 计算断点状态
  const xs = width >= breakpoints.xs;
  const sm = width >= breakpoints.sm;
  const md = width >= breakpoints.md;
  const lg = width >= breakpoints.lg;
  const xl = width >= breakpoints.xl;
  const xxl = width >= breakpoints.xxl;

  // 确定当前激活的断点
  let activeBreakpoint: BreakpointKey = 'xs';
  if (xxl) activeBreakpoint = 'xxl';
  else if (xl) activeBreakpoint = 'xl';
  else if (lg) activeBreakpoint = 'lg';
  else if (md) activeBreakpoint = 'md';
  else if (sm) activeBreakpoint = 'sm';

  // 设备类型判断
  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    activeBreakpoint,
  };
}

/**
 * 检测是否匹配指定断点
 * @param breakpoint 断点名称
 * @returns boolean
 */
export const useBreakpoint = (breakpoint: BreakpointKey): boolean => {
  const { [breakpoint]: isActive } = useResponsive();
  return isActive;
};

/**
 * 检测是否为移动设备
 * @returns boolean
 */
export const useIsMobile = (): boolean => {
  const { isMobile } = useResponsive();
  return isMobile;
};

/**
 * 检测是否为平板设备
 * @returns boolean
 */
export const useIsTablet = (): boolean => {
  const { isTablet } = useResponsive();
  return isTablet;
};

/**
 * 检测是否为桌面设备
 * @returns boolean
 */
export const useIsDesktop = (): boolean => {
  const { isDesktop } = useResponsive();
  return isDesktop;
};

/**
 * 根据断点返回不同的值
 * @param values 断点值映射
 * @param defaultValue 默认值
 * @returns T
 */
export const useResponsiveValue = <T>(
  values: Partial<Record<BreakpointKey, T>>,
  defaultValue: T
): T => {
  const { activeBreakpoint } = useResponsive();
  
  // 按优先级查找匹配的值
  const breakpointOrder: BreakpointKey[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(activeBreakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint]!;
    }
  }
  
  return defaultValue;
};

/**
 * 获取响应式列数
 * @param mobileColumns 移动端列数
 * @param tabletColumns 平板列数
 * @param desktopColumns 桌面列数
 * @returns number
 */
export const useResponsiveColumns = (
  mobileColumns: number = 1,
  tabletColumns: number = 2,
  desktopColumns: number = 3
): number => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile) return mobileColumns;
  if (isTablet) return tabletColumns;
  if (isDesktop) return desktopColumns;
  
  return mobileColumns;
};

export default useResponsive; 