import React from 'react';
import { Button, Space } from 'antd';
import { usePermissions } from '../../hooks/usePermissions';

const AdminActions: React.FC = () => {
  const { hasPermission, hasRole } = usePermissions();

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
      <h3>Admin Actions Panel (Example)</h3>
      <Space direction="vertical">
        {isAdmin && (
          <Button type="primary" danger>
            Super Admin Only Action
          </Button>
        )}
        {canCreateUser && (
          <Button type="primary">
            Create New User (Requires 'user:create')
          </Button>
        )}
        {/* Example: A button that requires ALL of multiple permissions */}
        {/* {hasAllPermissions(['user:list', 'user:view_details']) && (
          <Button>View User Details (Requires 'user:list' AND 'user:view_details')</Button>
        )} */}
        {canEditConfig && (
          <Button>
            Edit System Configuration (Requires 'config:edit' OR 'sys_admin' role)
          </Button>
        )}
      </Space>
    </div>
  );
};

export default AdminActions; 