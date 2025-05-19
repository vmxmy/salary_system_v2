import React, { useState, useEffect, Suspense } from 'react';
import { ConfigProvider, Spin, theme as antdTheme, type ThemeConfig } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import i18n from './i18n'; // Your i18n.ts configuration
import dayjs from 'dayjs';

interface I18nAppConfigProviderProps {
  children: React.ReactNode;
}

const antLocales: { [key: string]: any } = {
  en: enUS,
  zh: zhCN,
};

// 定义我们想要添加的自定义 token
interface MyCustomTokens {
  tableExpandIconFontSize?: number;
}

// 创建一个新的类型，它是 antd 的 AliasToken 和我们自定义 token 的联合
// ThemeConfig['token'] 是 antd 内部的 AliasToken 的 Partial 版本
// 我们需要确保我们的 token 类型至少包含 AliasToken 的所有可选属性，再加上我们的自定义属性
type ExtendedAliasToken = NonNullable<ThemeConfig['token']> & MyCustomTokens;
 
// 💻 定义自定义主题对象
const customTheme: ThemeConfig = {
  token: {
    // ----------- 核心颜色 -----------
    colorPrimary: '#0052cc', // 更鲜明且协调的主色调
    colorError: '#e85a71',   // 珊瑚粉/红色
    colorSuccess: '#52c41a', // 鲜明的成功色
    colorWarning: '#faad14', // 鲜明的警告色
    // colorAccent: '#ff7a45', // 可选的强调色

    // ----------- 文本颜色 -----------
    colorTextBase: '#333333', // 深灰色，提高可读性
    colorTextSecondary: '#595959', // 次要文本颜色
    colorTextTertiary: '#8c8c8c', // 更次要的文本，例如提示信息
    
    // ----------- 背景颜色 -----------
    colorBgLayout: '#f0f2f5', // 标准 Ant Design 布局背景色，提供清爽感
    colorBgContainer: '#ffffff', // 内容容器背景，保持白色以确保对比
    colorBgElevated: '#ffffff', // 浮层容器背景，如 Modal, Popover

    // ----------- 边框与分割线 -----------
    colorBorder: '#d9d9d9', // 标准边框颜色
    colorSplit: 'rgba(5, 5, 5, 0.06)', // 分割线颜色

    // ----------- 圆角 -----------
    borderRadius: 6, // 全局圆角
    borderRadiusLG: 8, // 较大圆角，用于 Card 等
    borderRadiusSM: 4, // 较小圆角

    // ----------- 阴影 -----------
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', // 较柔和的标准阴影
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', // 更强的阴影，用于需要更突出层级的元素

    // ----------- 字体 -----------
    fontFamily: '"SourceHanSerifCN-Medium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontSize: 14, // 基础字号
    fontSizeLG: 16, // 大字号
    fontSizeSM: 12, // 小字号
    // tableExpandIconFontSize: 10, // 表格展开/折叠图标字号 // Re-add this line
    lineHeight: 1.5715, // 基础行高
 
    // ----------- 间距 -----------
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginLG: 24,
    marginXL: 32,
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,

    // controlHeight: 32, // 默认控件高度
    tableExpandIconFontSize: 10, //  表格展开/折叠图标字号 (确保在这里或者合适的位置)
  } as Partial<ExtendedAliasToken>, // 使用类型断言
  components: {
    Layout: {
      siderBg: '#ffffff', // 侧边栏背景调整为白色，以配合内容区
      headerBg: '#ffffff', // 头部背景也调整为白色
      // triggerBg: // 可按需配置
      bodyBg: '#f0f2f5', // 明确指定 Layout 内容区域背景色
    },
    Menu: {
      // 亮色主题
      itemColor: 'rgba(0, 0, 0, 0.88)', // 菜单项文本颜色
      itemHoverColor: '#0052cc', // 菜单项鼠标悬浮时的文本颜色 (同 colorPrimary)
      itemSelectedColor: '#ffffff', // 选中状态的菜单项文本颜色
      itemSelectedBg: '#0052cc', // 选中状态的菜单项背景颜色 (同 colorPrimary)
      itemHoverBg: 'rgba(0, 82, 204, 0.06)', // 菜单项鼠标悬浮时的背景颜色 (colorPrimary 的浅色变体)
      // itemBg: '#ffffff', // 菜单项背景，通常由 Sider 或 Layout 提供

      // 暗色主题 (若启用)
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedColor: '#ffffff',
      darkItemSelectedBg: '#0052cc', // 暗色模式下选中项背景也使用主色
      // darkSubMenuItemBg: // 可按需配置
      // darkItemBg: // 可按需配置
    },
    Card: {
      headerBg: 'transparent', // 卡片头部背景透明
      paddingLG: 24, // 卡片内间距 (使用 token.paddingLG)
      borderRadiusLG: 8, // 卡片圆角 (使用 token.borderRadiusLG)
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', // 为卡片应用标准阴影 (同 token.boxShadow)
      colorBorderSecondary: 'rgba(5, 5, 5, 0.06)', // 卡片边框颜色 (同 token.colorSplit)
    },
    Button: {
      // borderRadius: 6, // 已由 token.borderRadius 全局设置
      // controlHeight: 32, // 已由 token.controlHeight 全局设置
      // primary 按钮样式已由 colorPrimary 定义，若需特定覆盖可在此处添加
      linkHoverBg: 'transparent', // Link 按钮 hover 时背景透明
      // 定制 link 类型按钮的颜色、hover 状态
      // Antd v5 中，link 按钮的颜色通常继承自 colorPrimary，hover 时也是。
      // 如果需要更细致的控制，可能需要通过 CSS 类或增加 token 变体。
      // 例如，可以定义一个 colorPrimaryHover 给 link 按钮使用
      // defaultGhostColor: token.colorPrimary (示例：让幽灵按钮边框和文字是主色)
    },
    Pagination: {
      itemSize: 32,
      // colorText: token.colorText, // 默认继承
      colorPrimary: '#0052cc', // Active item 背景和边框 (同 token.colorPrimary)
      colorPrimaryHover: '#003f9e', // Active item hover (colorPrimary 的深色变体)
      // itemBgActive: token.colorPrimary, // 已由 colorPrimary 覆盖
      borderRadius: 4, // 分页器按钮圆角 (使用 token.borderRadiusSM)
    },
    Breadcrumb: {
      // linkColor: token.colorTextSecondary, // 链接颜色
      // separatorColor: token.colorTextTertiary, // 分隔符颜色
      // fontSize: token.fontSize, // 字体大小
      // 以上 token 均可从全局 token 继承，如果需要特定样式则取消注释并赋值
      // 例如，增大字体:
      // fontSize: token.fontSizeLG,
    },
    Spin: {
      // colorPrimary: token.colorPrimary, // Spin 指示器颜色，默认会使用 colorPrimary
    },
    Table: {
      headerBg: '#fafafa', // 表头背景色
      headerColor: 'rgba(0, 0, 0, 0.88)', // 表头文字颜色
      rowHoverBg: 'rgba(0, 82, 204, 0.04)', // 表格行悬浮背景色 (colorPrimary 的浅变体)
      borderColor: 'rgba(5, 5, 5, 0.06)', // 表格边框和分割线颜色 (同 token.colorSplit)
      borderRadius: 8, // 表格外层圆角 (使用 token.borderRadiusLG)
      padding: 12, // 单元格默认内边距 (使用 token.paddingSM)
      paddingLG: 16, // 较大单元格内边距 (使用 token.padding)
      paddingSM: 8,  // 较小单元格内边距 (使用 token.paddingXS)
    },
    Tag: {
      // 默认 Tag 样式会基于 colorSuccess, colorWarning, colorError, colorInfo 等
      // 如果需要自定义特定颜色的 Tag，可以在组件中使用 color 属性，或在此处为特定类别的 Tag 定义样式
      // 例如：
      // successColor: token.colorSuccess, (已由 token 定义)
      // processingColor: token.colorPrimary, (已由 token 定义)
      // errorColor: token.colorError, (已由 token 定义)
      // warningColor: token.colorWarning, (已由 token 定义)
      // defaultBg: '#f5f5f5',
      // defaultColor: token.colorText,
      borderRadiusSM: 4, // Tag 圆角
    },
    Form: {
      itemMarginBottom: 20, // 表单项下边距
      // labelColor: token.colorTextHeading, // 标签颜色
      // verticalLabelPadding: // 垂直布局时标签的内边距
    },
    Input: {
      // borderRadius: 6, // 已由 token.borderRadius 全局设置
      // controlHeight: 32, // 已由 token.controlHeight 全局设置
    },
    Select: {
      // borderRadius: 6, // 已由 token.borderRadius 全局设置
      // controlHeight: 32, // 已由 token.controlHeight 全局设置
    },
    // ... 可根据需要添加其他组件的定制
  },
  /**
   * @description 主题算法：Ant Design 使用算法来生成一套完整的 Design Token，
   * 包括动态梯度颜色、暗色模式的颜色转换等。
   * - `antdTheme.defaultAlgorithm`: 默认算法，适用于亮色主题。
   * - `antdTheme.darkAlgorithm`: 暗色算法，适用于暗色主题。
   * - `antdTheme.compactAlgorithm`: 紧凑算法，使组件更紧凑。
   * 可以传入一个算法或一个算法数组，例如 `[antdTheme.defaultAlgorithm, antdTheme.compactAlgorithm]`
   */
  algorithm: antdTheme.defaultAlgorithm, // 当前使用默认亮色主题算法
};

const I18nAppConfigProvider: React.FC<I18nAppConfigProviderProps> = ({ children }) => {
  const getAntLocale = (langCode: string | undefined) => {
    if (langCode && typeof langCode === 'string') {
      const baseLng = langCode.split('-')[0];
      return antLocales[baseLng] || enUS; // Default to enUS if no match
    }
    return enUS; // Default to enUS if langCode is undefined
  };

  // Initialize with a reliable default, will be updated by useEffect
  // We use i18n.options.lng which should reflect thelng option passed to init
  const [antdLocale, setAntdLocale] = useState(() => getAntLocale(i18n.options.lng as string | undefined || i18n.language));

  useEffect(() => {
    const updateLocale = (lng: string | undefined) => {
      console.log('[I18nAppConfigProvider] Updating AntD locale based on i18n language:', lng);
      setAntdLocale(getAntLocale(lng));
    };

    // Listener for language change to update antd locale and dayjs locale
    const handleLanguageChanged = (lng: string | undefined) => {
      updateLocale(lng);
      // Update dayjs locale as well (moved from i18n.ts for better sync with React lifecycle)
      const baseLng = lng ? lng.split('-')[0] : 'zh'; // Default to zh for dayjs if lng is undefined briefly
      if (baseLng === 'zh') {
        dayjs.locale('zh-cn');
      } else if (baseLng === 'en') {
        dayjs.locale('en');
      } else {
        dayjs.locale('zh-cn'); // Default to Chinese for dayjs
      }
      console.log('[I18nAppConfigProvider] Dayjs locale set to:', dayjs.locale());
    };

    // If i18next is already initialized, set the locale immediately.
    // Otherwise, wait for the initialized event.
    if (i18n.isInitialized) {
      console.log('[I18nAppConfigProvider] i18next already initialized. Setting locale with language:', i18n.language);
      handleLanguageChanged(i18n.language);
    } else {
      console.log('[I18nAppConfigProvider] i18next not initialized yet. Waiting for initialized event.');
      i18n.on('initialized', (options) => {
        console.log('[I18nAppConfigProvider] i18next initialized event. Setting locale with language:', i18n.language, 'options:', options);
        handleLanguageChanged(i18n.language);
      });
    }

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('initialized', handleLanguageChanged); // Ensure we also remove this specific handler
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  console.log('[I18nAppConfigProvider] Rendering with antdLocale:', antdLocale);

  return (
    <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />}>
      {/* 你之前提到要启用 customTheme，这里取消注释 */}
      <ConfigProvider locale={antdLocale} theme={customTheme}>
        {children}
      </ConfigProvider>
    </Suspense>
  );
};

export default I18nAppConfigProvider; 