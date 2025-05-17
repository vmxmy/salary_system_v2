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

  console.log('[PermissionGuard] Rendering. Required:', requiredPermissions, 'UserPerms:', userPermissions, 'AuthLoading:', authLoading, 'Props:', props);

  const effectiveLoading = authLoading; // Directly use authLoading from store

  if (effectiveLoading) {
    console.log('[PermissionGuard] Auth is loading. Rendering null (or children if no requiredPermissions).');
    // If there are no specific permissions required, we might allow rendering children even during auth loading phase.
    // However, typically, if permissions are involved, waiting for auth to settle is safer.
    return requiredPermissions && requiredPermissions.length > 0 ? null : <>{children}</>; // Or a loading spinner
  }

  const hasPermission = 
    !requiredPermissions || 
    requiredPermissions.length === 0 || 
    requiredPermissions.every(rp => userPermissions.includes(rp));

  console.log('[PermissionGuard] Permission check. HasPermission:', hasPermission, 'EffectiveLoading:', effectiveLoading);

  if (hasPermission) {
    console.log('[PermissionGuard] Permission granted. Rendering children.');
    return <>{children}</>;
  }

  if (showError) {
    console.log('[PermissionGuard] Permission denied. Rendering error alert.');
    return <Alert type="error" message={t('common.permission_denied_action')} banner />;
  }
  
  console.log('[PermissionGuard] Permission denied. Rendering fallback (or null).');
  return <>{fallback}</>;
};

export default PermissionGuard; 