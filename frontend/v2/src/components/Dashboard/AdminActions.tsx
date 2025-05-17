import React from 'react';
import { Button, Space } from 'antd';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';

const AdminActions: React.FC = () => {
  const { hasPermission, hasRole } = usePermissions();
  const { t } = useTranslation();

  // Example: Button visible only to users with 'user:create' permission
  const canCreateUser = hasPermission('user:create');
  
  // Example: Button visible only to users with 'admin' role
  const isAdmin = hasRole('admin');

  // Example: Button visible only to users with 'config:edit' permission OR 'sys_admin' role
  const canEditConfig = hasPermission('config:edit') || hasRole('sys_admin');

  if (!isAdmin && !canCreateUser && !canEditConfig) {
    // If the user has none of these specific permissions/roles, 
    // maybe this component shouldn't render anything or show a different message.
    // For this example, if no specific admin actions are available, we render nothing.
    return null;
  }

  return (
    <div>
      <h3>{t('dashboard.admin_actions.panel_title_example')}</h3>
      <Space direction="vertical">
        {isAdmin && (
          <Button type="primary" danger>
            {t('dashboard.admin_actions.super_admin_action_example')}
          </Button>
        )}
        {canCreateUser && (
          <Button type="primary">
            {t('dashboard.admin_actions.create_user_example')}
          </Button>
        )}
        {/* Example: A button that requires ALL of multiple permissions */}
        {/* {hasAllPermissions(['user:list', 'user:view_details']) && (
          <Button>View User Details (Requires 'user:list' AND 'user:view_details')</Button>
        )} */}
        {canEditConfig && (
          <Button>
            {t('dashboard.admin_actions.edit_config_example')}
          </Button>
        )}
      </Space>
    </div>
  );
};

export default AdminActions; 