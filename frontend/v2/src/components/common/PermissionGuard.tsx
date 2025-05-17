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

  console.log(`[PermissionGuard Render - ${new Date().toISOString()}] Required:`, requiredPermissions, 'UserPerms:', userPermissions, 'AuthLoading:', authLoading, 'Props:', JSON.stringify(Object.keys(props))); // Log prop keys instead of full props to avoid large objects in logs

  const effectiveLoading = authLoading; // Directly use authLoading from store

  if (effectiveLoading) {
    // console.log('[PermissionGuard] Auth is loading. Rendering null (or children if no requiredPermissions).'); // Original log
    if (requiredPermissions && requiredPermissions.length > 0) {
      console.log(`[PermissionGuard Decision - ${new Date().toISOString()}] Auth loading AND permissions required. Returning NULL.`);
      return null;
    } else {
      console.log(`[PermissionGuard Decision - ${new Date().toISOString()}] Auth loading BUT no permissions required. Rendering CHILDREN.`);
      return <>{children}</>;
    }
  }

  const hasPermission = 
    !requiredPermissions || 
    requiredPermissions.length === 0 || 
    requiredPermissions.every(rp => userPermissions.includes(rp));

  console.log(`[PermissionGuard Check - ${new Date().toISOString()}] Permission check. HasPermission:`, hasPermission, 'EffectiveLoading:', effectiveLoading);

  if (hasPermission) {
    console.log(`[PermissionGuard Decision - ${new Date().toISOString()}] Permission GRANTED. Rendering CHILDREN.`);
    return <>{children}</>;
  }

  // If not hasPermission
  if (showError) {
    console.log(`[PermissionGuard Decision - ${new Date().toISOString()}] Permission DENIED. showError is true. Rendering ERROR alert.`);
    return <Alert type="error" message={t('common.permission_denied_action')} banner />;
  }
  
  console.log(`[PermissionGuard Decision - ${new Date().toISOString()}] Permission DENIED. showError is false. Rendering FALLBACK (or null if fallback is not provided). Fallback present: ${!!fallback}`);
  return <>{fallback}</>;
};

export default PermissionGuard; 