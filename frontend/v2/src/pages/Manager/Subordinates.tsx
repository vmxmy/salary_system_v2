import React from 'react';
import { useTranslation } from 'react-i18next';

const SubordinatesPage: React.FC = () => {
  const { t } = useTranslation(['manager', 'common']);
  return <div>{t('manager_page.subordinates.placeholder_title')}</div>;
};

export default SubordinatesPage;