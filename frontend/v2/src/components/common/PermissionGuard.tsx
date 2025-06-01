import React from 'react';
import { useAuthStore } from '../../store/authStore';
// import type { AuthStoreState } from '../../store/authStore'; // No longer needed with decomposed selectors
// import { shallow } from 'zustand/shallow'; // Removed
import type { ReactNode } from 'react';
import { Alert } from 'antd';
import { useTranslation } from 'react-i18next';

interface PermissionGuardProps {
  requiredPermissions?: string[]; 
  children: ReactNode;
  fallback?: ReactNode; // Optional fallback component if permission is denied
  showError?: boolean; // Whether to show an error message if permission is denied
}

const PermissionGuard: React.FC<PermissionGuardProps> = (props) => {
  const { requiredPermissions, children, fallback = null, showError = false } = props;
  const { t } = useTranslation();

  // Decomposed selectors
  const userPermissions = useAuthStore(state => state.userPermissions || []);
  const authLoading = useAuthStore(state => state.isLoadingUser);

  const effectiveLoading = authLoading; // Directly use authLoading from store

  if (effectiveLoading) {
    if (requiredPermissions && requiredPermissions.length > 0) {
      return null;
    } else {
      return <>{children}</>;
    }
  }

  const hasPermission = 
    !requiredPermissions || 
    requiredPermissions.length === 0 || 
    requiredPermissions.every(rp => userPermissions.includes(rp));

  if (hasPermission) {
    return <>{children}</>;
  }

  // If not hasPermission
  if (showError) {
    return <Alert type="error" message={t('common.permission_denied_action')} banner />;
  }
  
  return <>{fallback}</>;
};

export default PermissionGuard; 