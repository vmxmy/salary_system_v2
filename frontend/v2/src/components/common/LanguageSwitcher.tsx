import React from 'react';
import { Button, Tooltip } from 'antd';
// import { GlobalOutlined } from '@ant-design/icons'; // Icon no longer used
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLng = i18n.language.split('-')[0]; // Get base language (e.g., 'en' from 'en-US')

  const toggleLanguage = () => {
    const newLang = currentLng === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const buttonText = currentLng === 'zh' ? '中' : 'En';
  const tooltipTitle = currentLng === 'zh' 
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