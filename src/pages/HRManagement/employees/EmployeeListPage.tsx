import React from 'react';
import { useTranslation } from 'react-i18next';

const EmployeeListPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('pageTitle:employee_files')}</h1>
      {/* Add your employee list page content here */}
    </div>
  );
};

export default EmployeeListPage; 