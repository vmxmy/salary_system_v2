import React, { useState, useEffect, Suspense } from 'react';
import { ConfigProvider, Spin, theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import i18n from './i18n'; // Your i18n.ts configuration

interface I18nAppConfigProviderProps {
  children: React.ReactNode;
}

const antLocales: { [key: string]: any } = {
  en: enUS,
  zh: zhCN,
};

// 💻 定义自定义主题对象
const customTheme = {
  token: {
    // ----------- 核心颜色 -----------
    /**
     * @description 主色调：影响如按钮、链接、活动标签等多数交互元素。
     * @default '#1677ff' (Ant Design 默认蓝色)
     */
    colorPrimary: '#4ea1d3', // 用户指定更新：更柔和的蓝色

    /**
     * @description 错误状态颜色：用于错误提示、失败状态的组件等。
     * @default '#ff4d4f' (Ant Design 默认红色)
     */
    colorError: '#e85a71',   // 用户指定更新：珊瑚粉/红色

    // ----------- 文本颜色 -----------
    /**
     * @description 基础文本颜色：应用于绝大部分文本内容。
     * @default 'rgba(0, 0, 0, 0.88)' (Ant Design 默认深灰色)
     */
    colorTextBase: '#454552', // 用户指定更新：深灰色

    // ----------- 背景颜色 -----------
    /**
     * @description 布局背景色：通常用于页面body或最外层布局的背景。
     * @default '#f5f5f5' (Ant Design 默认浅灰色)
     */
    colorBgLayout: '#d8e9ef', // 用户指定更新：非常浅的蓝灰色

    /**
     * @description 容器背景色：用于卡片、模态框、表格、输入框、下拉选择等组件的背景。
     * @default '#ffffff' (Ant Design 默认白色)
     */
    colorBgContainer: '#ffffff', // 保持白色，以在新布局背景上形成对比

    // ----------- 圆角 -----------
    /**
     * @description 全局组件圆角：影响按钮、输入框、卡片等大部分组件的边框圆角。
     * @default 6 (Ant Design 默认)
     */
    borderRadius: 6, // 用户要求：控件都要圆角，设置为 6px

    // ----------- 其他 Ant Design 默认 token 将继续生效 -----------
    // 例如：
    // colorSuccess: Ant Design 会基于主色或使用默认绿色
    // colorWarning: Ant Design 会基于主色或使用默认橙色
    // colorInfo: Ant Design 会基于主色或使用默认蓝色 (可以考虑设置为 colorPrimary 若希望信息色与主色一致)
    // fontFamily: 将使用 Ant Design 默认字体栈
    // controlHeight: 组件高度等将使用默认值
  },
  components: {
    // 📝 通常情况下，token 中的 borderRadius 会全局应用于大部分组件。
    // 如果特定组件未按预期应用圆角，或者需要为特定组件设置不同的圆角值，
    // 可以在此处进行覆盖。
    // 例如，确保按钮也明确使用这个圆角值：
    // Button: {
    //   borderRadius: 6, // 与 token.borderRadius 一致
    //   // controlHeight: 32, // 若需调整按钮高度
    // },
    // Input: {
    //   borderRadius: 6,
    // },
    // Select: {
    //   borderRadius: 6,
    // },
    // Card: {
    //   borderRadiusLG: 6, // 卡片通常用 borderRadiusLG
    // }
    Layout: {
      /**
       * @description Sider (侧边栏) 的背景颜色。
       */
      siderBg: '#f8f9fa', // 保持非常浅的灰色，适用于亮色侧边栏
      // 你也可以在这里配置 headerBg, triggerBg (折叠触发器背景) 等
    },
    Menu: {
      // ----------- 亮色主题 (theme="light") ----------- 
      /**
       * @description 菜单项文本颜色 (亮色主题)。
       */
      itemColor: '#333333', // 修改为深灰色，匹配参考图未选中项
      /**
       * @description 菜单项鼠标悬浮时的文本颜色 (亮色主题)。
       */
      itemHoverColor: '#0D47A1', // 修改为深蓝色，匹配参考图选中项强调色
      /**
       * @description 选中状态的菜单项文本颜色 (亮色主题)。
       */
      itemSelectedColor: '#FFFFFF', // 修改为白色，匹配参考图选中项
      /**
       * @description 选中状态的菜单项背景颜色 (亮色主题)。
       */
      itemSelectedBg: '#0D47A1', // 修改为深蓝色，匹配参考图选中项
      /**
       * @description 菜单项鼠标悬浮时的背景颜色 (亮色主题)。
       */
      itemHoverBg: '#E3F2FD', // 修改为非常浅的蓝色，提供悬浮反馈
      /**
       * @description 菜单项的背景色 (亮色主题)。
       * 默认情况下，亮色菜单的 itemBg 是透明的，背景由 Sider 提供。
       * 如果需要特定颜色，例如 #ffffff，可以取消注释。
       */
      // itemBg: '#ffffff', 

      // 如果将来需要支持暗色菜单，可以在这里添加 dark* 相关的 token
      // darkItemBg: '...',
      // darkSubMenuItemBg: '...',
      // darkItemSelectedColor: '...',
      // darkItemSelectedBg: '...',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedColor: '#ffffff',
      darkItemSelectedBg: '#4ea1d3',
    },
    Card: {
      /**
       * @description 卡片头部背景颜色
       */
      headerBg: 'transparent',
      /**
       * @description 卡片内间距
       */
      paddingLG: 20,
      /**
       * @description 卡片圆角
       */
      borderRadiusLG: 12,
      colorBorderSecondary: 'rgba(0, 0, 0, 0.06)',
      colorBgContainer: '#FFFFFF',
    },
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
  const [antdLocale, setAntdLocale] = useState(antLocales[i18n.language.split('-')[0]] || enUS);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const baseLng = lng.split('-')[0]; // e.g., 'en-US' -> 'en'
      console.log('[I18nAppConfigProvider] Language changed to:', lng, ', baseLng:', baseLng);
      setAntdLocale(antLocales[baseLng] || enUS);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    // Set initial locale based on current i18n language
    handleLanguageChanged(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  console.log('[I18nAppConfigProvider] Rendering with antdLocale:', antdLocale);

  return (
    <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />}>
      <ConfigProvider locale={antdLocale} theme={customTheme}>
        {children}
      </ConfigProvider>
    </Suspense>
  );
};

export default I18nAppConfigProvider; 