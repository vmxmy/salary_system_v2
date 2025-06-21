import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import type { ProSettings } from '@ant-design/pro-components';
import { designTokens } from '../styles/design-tokens';

// 🎨 设计令牌配置
export const designTokensAntd = {
  // 主要颜色
  colorPrimary: designTokens.colors.primary[500],
  colorSuccess: designTokens.colors.semantic.success[500],
  colorWarning: designTokens.colors.semantic.warning[500],
  colorError: designTokens.colors.semantic.error[500],
  colorInfo: designTokens.colors.semantic.info[500],
  
  // 灰阶颜色
  colorBgContainer: designTokens.colors.background.primary,
  colorBgLayout: designTokens.colors.background.secondary,
  colorBgElevated: designTokens.colors.background.primary,
  colorFillSecondary: designTokens.colors.background.tertiary,
  
  // 边框和阴影
  borderRadius: 6,
  boxShadow: designTokens.shadows.base,
  boxShadowSecondary: designTokens.shadows.lg,
  
  // 间距
  padding: 24,
  paddingSM: 16,
  paddingXS: 8,
  paddingLG: 32,
  
  // 字体
  fontSize: 14,
  fontSizeLG: 16,
  fontSizeXL: 20,
  fontSizeHeading1: 38,
  fontSizeHeading2: 30,
  fontSizeHeading3: 24,
  fontSizeHeading4: 20,
  fontSizeHeading5: 16,
  
  // 高度
  controlHeight: 32,
  controlHeightSM: 24,
  controlHeightLG: 40,
  
  // 响应式断点 - 直接定义，不引用 designTokens
  screenXS: 480,
  screenSM: 576,
  screenMD: 768,
  screenLG: 992,
  screenXL: 1200,
  screenXXL: 1600,
};

// 🌈 Ant Design 主题配置
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: designTokensAntd.colorPrimary,
    colorSuccess: designTokensAntd.colorSuccess,
    colorWarning: designTokensAntd.colorWarning, 
    colorError: designTokensAntd.colorError,
    colorInfo: designTokensAntd.colorInfo,
    borderRadius: designTokensAntd.borderRadius,
    fontSize: designTokensAntd.fontSize
  },
  algorithm: [theme.defaultAlgorithm],
  components: {
    Card: {
      colorBgContainer: designTokens.colors.background.primary,
      boxShadow: designTokens.shadows.sm,
      borderRadiusLG: 8
    },
    Button: {
      borderRadius: 6,
      controlHeight: designTokensAntd.controlHeight,
      controlHeightSM: designTokensAntd.controlHeightSM,
      controlHeightLG: designTokensAntd.controlHeightLG
    },
    Table: {
      borderRadius: 6,
      colorBgContainer: designTokens.colors.background.primary
    }
    // 移除不支持的 Statistic 配置
  },
};

// 🔧 ProLayout 基础配置
export const defaultProLayoutSettings: Partial<ProSettings> = {
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '人事管理系统',
  navTheme: 'light',
  splitMenus: false,
  menu: {
    locale: false,
  },
};

// 🎛️ ProLayout 扩展配置
export const proLayoutExtendedSettings = {
  // 布局尺寸
  siderWidth: 208,
  headerHeight: 48,
  
  // 响应式断点
  breakpoint: 'lg',
  
  // Logo和图标
  logo: '/logo.svg',
  iconfontUrl: '',
  
  // 样式配置
  contentStyle: {
    margin: '24px',
  },
  
  // 页面配置
  pageTitleRender: false,
};

// 📱 响应式配置
export const responsiveConfig = {
  // 断点定义 - 直接使用数字而不是引用 designTokens
  breakpoints: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  },
  
  // 仪表盘卡片列配置
  dashboardCardCols: {
    xs: { span: 24 },
    sm: { span: 12 },
    md: { span: 12 },
    lg: { span: 6 },
    xl: { span: 6 },
    xxl: { span: 6 },
  },
  
  // 图表区域列配置
  dashboardChartCols: {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 12 },
    xl: { span: 12 },
    xxl: { span: 12 },
  },
  
  // 表格区域列配置
  dashboardTableCols: {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 24 },
    lg: { span: 24 },
    xl: { span: 24 },
    xxl: { span: 24 },
  },
  
  // ProLayout 响应式设置
  proLayoutResponsive: {
    xs: {
      siderWidth: 208,
      collapsed: true,
    },
    sm: {
      siderWidth: 208,
      collapsed: true,
    },
    md: {
      siderWidth: 256,
      collapsed: true,
    },
    lg: {
      siderWidth: 256,
      collapsed: true,
    },
  },
};

// 🌓 暗色主题配置
export const darkTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm],
};

// 🎨 主题类型定义
export type ThemeMode = 'light' | 'dark';

// 🔧 获取主题配置的工具函数
export const getThemeConfig = (mode: ThemeMode): ThemeConfig => {
  return mode === 'dark' ? darkTheme : antdTheme;
};

// 📐 CSS 变量定义
export const cssVariables = {
  '--layout-header-height': '64px',
  '--layout-sider-width': '256px',
  '--layout-sider-collapsed-width': '80px',
  '--layout-content-padding': '24px',
  '--layout-content-padding-mobile': '16px',
  '--card-border-radius': '6px',
  '--card-shadow': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  '--dashboard-card-margin': '8px',
  '--dashboard-card-margin-mobile': '4px',
}; 