import React, { useState, useEffect, Suspense } from 'react';
import { ConfigProvider, Spin } from 'antd';
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
      <ConfigProvider locale={antdLocale}>
        {children}
      </ConfigProvider>
    </Suspense>
  );
};

export default I18nAppConfigProvider; 