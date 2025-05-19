import React from 'react';
import { Button, Tooltip } from 'antd';
// import { GlobalOutlined } from '@ant-design/icons'; // Icon no longer used
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  // 获取当前语言，支持zh-CN格式
  const currentLng = i18n.language;

  // 安全地检查语言是否为中文
  const checkIsChinese = (lang: string | undefined): boolean => {
    if (lang && typeof lang === 'string') {
      return lang === 'zh' || lang === 'zh-CN' || lang.startsWith('zh-');
    }
    return false; // 如果 lang 未定义或是非字符串，则默认为非中文
  };

  const toggleLanguage = () => {
    const isCurrentlyChinese = checkIsChinese(currentLng);
    const newLang = isCurrentlyChinese ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  const isCurrentlyChineseForDisplay = checkIsChinese(currentLng);
  const buttonText = isCurrentlyChineseForDisplay ? '中' : 'En';
  const tooltipTitle = isCurrentlyChineseForDisplay 
    ? "Switch to English" 
    : "切换到中文";

  return (
    <Tooltip title={tooltipTitle} placement="bottom">
      <Button
        shape="circle"
        onClick={toggleLanguage}
        aria-label={tooltipTitle} // For accessibility
        // style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} // Ensure size if text makes it too wide
      >
        {buttonText}
      </Button>
    </Tooltip>
  );
};

export default LanguageSwitcher; 