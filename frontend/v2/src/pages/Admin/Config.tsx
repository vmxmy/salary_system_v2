import React from 'react';
import { useTranslation } from 'react-i18next';

const ConfigPage: React.FC = () => {
  const { t } = useTranslation('common');
  return <div>{t('page.admin_config.title_placeholder')}</div>;
};

export default ConfigPage;