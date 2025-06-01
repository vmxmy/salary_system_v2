import React from 'react';
import { useTranslation } from 'react-i18next';

const LeaveApprovalsPage: React.FC = () => {
  const { t } = useTranslation(['manager', 'common']);
  return <div>t('manager_page.leave_approvals.placeholder_title')</div>;
};

export default LeaveApprovalsPage;