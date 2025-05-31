import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import type { ProSettings } from '@ant-design/pro-components';

// 🎨 设计令牌配置
export const designTokens = {
  // 主要颜色
  colorPrimary: '#1890ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#f5222d',
  colorInfo: '#13c2c2',
  
  // 灰阶颜色
  colorBgContainer: '#ffffff',
  colorBgLayout: '#f5f5f5',
  colorBgElevated: '#ffffff',
  colorFillSecondary: '#f5f5f5',
  
  // 边框和阴影
  borderRadius: 6,
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  
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
  
  // 响应式断点
  screenXS: 480,
  screenSM: 576,
  screenMD: 768,
  screenLG: 992,
  screenXL: 1200,
  screenXXL: 1600,
};

// 🌈 Ant Design 主题配置
export const antdTheme: ThemeConfig = {
  token: {},
  algorithm: [],
  components: {},
};

// 🔧 ProLayout 基础配置
export const defaultProLayoutSettings: Partial<ProSettings> = {
  layout: 'side', // 侧边菜单布局
  contentWidth: 'Fluid', // 流式宽度
  fixedHeader: false, // 不固定顶部头部
  fixSiderbar: true, // 固定侧边栏
  colorWeak: false,
  title: {t('common:auto_text_e4baba')},
  navTheme: 'light{t('common:auto____2c202f')}light{t('common:auto____20e880')}realDark'
  splitMenus: false, // 是否拆分菜单
  menu: {
    locale: false, // 是否国际化菜单
  },
};

// 🎛️ ProLayout 扩展配置
export const proLayoutExtendedSettings = {
  // 布局尺寸
  siderWidth: 208, // 侧边栏宽度
  headerHeight: 48, // 头部高度
  
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
  // 断点定义
  breakpoints: {
    xs: designTokens.screenXS,
    sm: designTokens.screenSM,
    md: designTokens.screenMD,
    lg: designTokens.screenLG,
    xl: designTokens.screenXL,
    xxl: designTokens.screenXXL,
  },
  
  // 仪表盘卡片列配置
  dashboardCardCols: {
    xs: { span: 24 }, // 移动端：单列
    sm: { span: 12 }, // 小屏：两列
    md: { span: 12 }, // 中屏：两列
    lg: { span: 6 },  // 大屏：四列
    xl: { span: 6 },  // 超大屏：四列
    xxl: { span: 6 }, // 超超大屏：四列
  },
  
  // 图表区域列配置
  dashboardChartCols: {
    xs: { span: 24 }, // 移动端：全宽
    sm: { span: 24 }, // 小屏：全宽
    md: { span: 12 }, // 中屏：一半宽
    lg: { span: 12 }, // 大屏：一半宽
    xl: { span: 12 }, // 超大屏：一半宽
    xxl: { span: 12 }, // 超超大屏：一半宽
  },
  
  // 表格区域列配置
  dashboardTableCols: {
    xs: { span: 24 }, // 移动端：全宽
    sm: { span: 24 }, // 小屏：全宽
    md: { span: 24 }, // 中屏：全宽
    lg: { span: 24 }, // 大屏：全宽
    xl: { span: 24 }, // 超大屏：全宽
    xxl: { span: 24 }, // 超超大屏：全宽
  },
  
  // ProLayout 响应式设置
  proLayoutResponsive: {
    xs: {
      siderWidth: 208, // 移动端也显示侧边栏
      collapsed: false, // 移动端也默认展开
    },
    sm: {
      siderWidth: 208, // 小屏缩小侧边栏
      collapsed: false,
    },
    md: {
      siderWidth: 256, // 中屏正常侧边栏
      collapsed: false,
    },
    lg: {
      siderWidth: 256, // 大屏正常侧边栏
      collapsed: false,
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