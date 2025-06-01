/**
 * 主题工具函数
 * 提供用于处理主题相关操作的工具函数
 */

import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

// 获取当前主题的 token
const { useToken } = theme;

/**
 * 获取主题颜色
 * @param color 颜色名称
 * @param variant 颜色变体 (可选)
 * @returns 颜色值
 */
export const getThemeColor = (
  color: 'primary' | 'success' | 'warning' | 'error' | 'info',
  variant?: 'light' | 'dark' | 'bg'
): string => {
  // 这里只是一个示例实现，实际使用时应该从 Ant Design 的主题系统中获取颜色
  const colors: Record<string, Record<string, string>> = {
    primary: {
      default: '#1677ff',
      light: '#4096ff',
      dark: '#0958d9',
      bg: '#e6f4ff',
    },
    success: {
      default: '#52c41a',
      light: '#73d13d',
      dark: '#389e0d',
      bg: '#f6ffed',
    },
    warning: {
      default: '#faad14',
      light: '#ffc53d',
      dark: '#d48806',
      bg: '#fffbe6',
    },
    error: {
      default: '#ff4d4f',
      light: '#ff7875',
      dark: '#d9363e',
      bg: '#fff2f0',
    },
    info: {
      default: '#1677ff',
      light: '#4096ff',
      dark: '#0958d9',
      bg: '#e6f4ff',
    },
  };

  return variant ? colors[color][variant] : colors[color].default;
};

/**
 * 创建自定义主题配置
 * @param options 主题选项
 * @returns Ant Design 主题配置
 */
export const createThemeConfig = (options: {
  primaryColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  fontSize?: number;
  borderRadius?: number;
  isDark?: boolean;
}): ThemeConfig => {
  const {
    primaryColor,
    successColor,
    warningColor,
    errorColor,
    fontSize,
    borderRadius,
    isDark = false,
  } = options;

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: primaryColor,
      colorSuccess: successColor,
      colorWarning: warningColor,
      colorError: errorColor,
      fontSize,
      borderRadius,
    },
    components: {
      Button: {
        borderRadius: 9999, // Make buttons round by default
      },
    },
  };
};

/**
 * 获取响应式断点
 * @returns 断点配置
 */
export const getBreakpoints = () => {
  return {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  };
};

/**
 * 创建响应式媒体查询
 * @param breakpoint 断点名称
 * @param type 查询类型 ('mint('common:auto____20e688')max')
 * @returns 媒体查询字符串
 */
export const createMediaQuery = (
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl',
  type: 'min' | 'max' = 'min'
): string => {
  const breakpoints = getBreakpoints();
  const value = breakpoints[breakpoint];
  
  return type === 'min'
    ? `@media (min-width: ${value}px)`
    : `@media (max-width: ${value - 1}px)`;
};

/**
 * 获取间距值
 * @param size 间距大小
 * @returns 间距值 (像素)
 */
export const getSpacing = (
  size: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'xxxxl' | number
): number => {
  const spacingUnit = 8;
  
  const spacingMap: Record<string, number> = {
    xxs: spacingUnit / 4, // 2px
    xs: spacingUnit / 2, // 4px
    sm: spacingUnit, // 8px
    md: spacingUnit * 2, // 16px
    lg: spacingUnit * 3, // 24px
    xl: spacingUnit * 4, // 32px
    xxl: spacingUnit * 6, // 48px
    xxxl: spacingUnit * 8, // 64px
    xxxxl: spacingUnit * 12, // 96px
  };

  return typeof size === 'number' ? size : spacingMap[size];
};

/**
 * 使用主题 Hook
 * 导出 useToken 以便在组件中使用
 */
export { useToken };

/**
 * 获取字体大小
 * @param size 字体大小名称
 * @returns 字体大小值 (像素)
 */
export const getFontSize = (
  size: 'xxs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl' | 'xxxl'
): number => {
  const fontSizeMap: Record<string, number> = {
    xxs: 8,
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
  };

  return fontSizeMap[size];
};
