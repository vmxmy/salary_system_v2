import React from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // Removed Outlet, as children will handle it
import { useSelector } from 'react-redux';
import { usePermissions } from '../hooks/usePermissions'; // Correctly imported
// import MainLayout from '../layouts/MainLayout'; // MainLayout will be handled by routes.tsx
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import type { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode; // Added children prop
  allowedRoles?: string[]; // Keep for direct role checks if needed, or rely on usePermissions.hasRole
  requiredPermissions?: string[];
  permissionMatchMode?: 'all' | 'any';
  // renderMainLayout?: boolean; // Removed renderMainLayout prop
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children, // Destructure children
  allowedRoles,
  requiredPermissions,
  permissionMatchMode = 'all', // Default to 'all' if not specified
  // renderMainLayout = true, // Removed from destructuring
}) => {
  const { t } = useTranslation(['common']);
  const location = useLocation();
  
  // Subscribe to necessary state slices from Redux store
  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const isLoadingUser = useSelector((state: RootState) => state.auth.isLoadingUser);
  const storeUserRoleCodes = useSelector((state: RootState) => state.auth.userRoleCodes);
  const storeUserPermissions = useSelector((state: RootState) => state.auth.userPermissions);
  
  const isAuthenticated = !!authToken;
  // Check if userRoleCodes array has been initialized (is not null)
  const rbacDataInitialized = storeUserRoleCodes !== null && storeUserPermissions !== null;

  const { 
    userRoleCodes, // Get for logging, actual check uses hasAnyRole
    userPermissions, // Get for logging, actual check uses hasAllPermissions / hasAnyPermission
    hasAnyRole, 
    hasAllPermissions, 
    hasAnyPermission,
    // hasRole // Ensure hasRole is destructured if used directly for SUPER_ADMIN check later
  } = usePermissions(); // This hook internally subscribes to userRoleCodes and userPermissions
  
  // --- New Loading Logic ---
  // Determine if we are in a state where critical data (user details, roles, permissions) is still loading.
  const isEffectivelyLoading = isLoadingUser || (isAuthenticated && currentUser && !rbacDataInitialized);

  if (isEffectivelyLoading) {
    return (
      <Spin spinning={true} size="large" tip={t('common:loading.user_info')}>
        {/* Render minimal content or adjust layout if Spin should cover children conceptually */}
        {/* For a full-page spinner scenario, children might be null or a div with min-height */}
        <div className="full-size-container" /> 
      </Spin>
    );
  }
  // --- End New Loading Logic ---

  // Loading condition: 
  // 1. isLoadingUser is true (actively fetching user details).
  // 2. OR, user is authenticated (token exists), but either currentUser is not yet set OR rbacData (role codes/permissions) hasn't been initialized.
  // This second part catches the state where initializeAuth has started a fetch, isLoadingUser might even become false briefly 
  // before user object and derived RBAC states are fully populated.
  // Authentication Check: If, after loading attempts, user is still not authenticated (no token)
  // OR if authenticated but currentUser object is missing (should not happen if loading logic is correct, but as a safeguard).
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // At this point, isAuthenticated is true, and currentUser is available.
  // userRoleCodes and userPermissions used by usePermissions() hook should be up-to-date from the store.

  // Role Check
  if (allowedRoles && allowedRoles.length > 0) {
    // Ensure userRoleCodes is not null before calling .some()
    if (!userRoleCodes || !userRoleCodes.some(code => allowedRoles.includes(code))) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Permission Check
  if (requiredPermissions && requiredPermissions.length > 0) {
    const currentPermissionsFromHook = userPermissions; // Re-access for clarity, or rely on one from initial destructuring
    // It's crucial that usePermissions hook provides up-to-date userPermissions array here
    // Let's check if the permissions array from the hook is non-empty if permissions are required
    if (!currentPermissionsFromHook || currentPermissionsFromHook.length === 0) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    
    let userHasRequiredPermissions = false;
    if (permissionMatchMode === 'any') {
      userHasRequiredPermissions = currentPermissionsFromHook.some(permission => requiredPermissions.includes(permission));
    } else { // Default is 'all'
      userHasRequiredPermissions = requiredPermissions.every(permission => currentPermissionsFromHook.includes(permission));
    }

    if (!userHasRequiredPermissions) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // If all checks pass, render the children directly as loading is handled above.
  return <>{children}</>; // Render children directly
};

export default ProtectedRoute; 