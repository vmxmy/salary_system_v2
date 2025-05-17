import React from 'react';
import { Button, Tooltip } from 'antd';
// import { GlobalOutlined } from '@ant-design/icons'; // Icon no longer used
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  // 获取当前语言，支持zh-CN格式
  const currentLng = i18n.language;

  const toggleLanguage = () => {
    // 检查当前语言是否为中文（zh或zh-CN开头）
    const isChinese = currentLng === 'zh' || currentLng === 'zh-CN' || currentLng.startsWith('zh-');
    const newLang = isChinese ? 'en' : 'zh-CN'; // 切换到zh-CN而不是zh
    i18n.changeLanguage(newLang);
  };

  // 检查当前语言是否为中文（zh或zh-CN开头）
  const isChinese = currentLng === 'zh' || currentLng === 'zh-CN' || currentLng.startsWith('zh-');
  const buttonText = isChinese ? '中' : 'En';
  const tooltipTitle = isChinese 
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