import React from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // Removed Outlet, as children will handle it
import { useAuthStore } from '../store/authStore'; // Correctly imported
import { usePermissions } from '../hooks/usePermissions'; // Correctly imported
// import MainLayout from '../layouts/MainLayout'; // MainLayout will be handled by routes.tsx
import { Spin } from 'antd';

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
  const location = useLocation();
  
  // Subscribe to necessary state slices from authStore
  const isAuthenticated = useAuthStore((state) => !!state.authToken); // More direct way to check auth based on token presence
  const currentUser = useAuthStore((state) => state.currentUser);
  const isLoadingUser = useAuthStore((state) => state.isLoadingUser);
  // Check if userRoleCodes array has been initialized (is not null)
  const rbacDataInitialized = useAuthStore((state) => state.userRoleCodes !== null && state.userPermissions !== null);

  const { 
    userRoleCodes, // Get for logging, actual check uses hasAnyRole
    userPermissions, // Get for logging, actual check uses hasAllPermissions / hasAnyPermission
    hasAnyRole, 
    hasAllPermissions, 
    hasAnyPermission,
    // hasRole // Ensure hasRole is destructured if used directly for SUPER_ADMIN check later
  } = usePermissions(); // This hook internally subscribes to userRoleCodes and userPermissions
  
  // Log initial data for debugging - All these will be removed/commented out
  // console.log('[ProtectedRoute] Debug Info:');
  // console.log('[ProtectedRoute] Current Location:', location.pathname);
  // console.log('[ProtectedRoute] IsAuthenticated:', isAuthenticated);
  // console.log('[ProtectedRoute] CurrentUser from store:', JSON.stringify(currentUser, null, 2));
  // const rawRoleCodesFromStore = useAuthStore((state) => state.userRoleCodes);
  // const rawPermissionsFromStore = useAuthStore((state) => state.userPermissions);
  // console.log('[ProtectedRoute] Raw userRoleCodes from authStore state:', rawRoleCodesFromStore);
  // console.log('[ProtectedRoute] Raw userPermissions from authStore state:', rawPermissionsFromStore);
  // console.log('[ProtectedRoute] RoleCodes from usePermissions hook:', userRoleCodes);
  // console.log('[ProtectedRoute] Route allowedRoles:', allowedRoles);
  // console.log('[ProtectedRoute] Route requiredPermissions:', requiredPermissions);
  // console.log('[ProtectedRoute] Route permissionMatchMode:', permissionMatchMode);

  // --- New Loading Logic ---
  // Determine if we are in a state where critical data (user details, roles, permissions) is still loading.
  const isEffectivelyLoading = isLoadingUser || (isAuthenticated && currentUser && !rbacDataInitialized);
  // console.log(`[ProtectedRoute] Combined Loading Status: isEffectivelyLoading: ${isEffectivelyLoading} (isLoadingUser: ${isLoadingUser}, isAuthenticated: ${isAuthenticated}, currentUser: ${!!currentUser}, rbacDataInitialized: ${rbacDataInitialized})`);

  if (isEffectivelyLoading) {
    console.log('[ProtectedRoute] Effective loading is true. Rendering spinner.');
    return (
      <Spin spinning={true} size="large" tip="加载用户信息中...">
        {/* Render minimal content or adjust layout if Spin should cover children conceptually */}
        {/* For a full-page spinner scenario, children might be null or a div with min-height */}
        <div style={{ width: '100%', height: '100vh' }} /> 
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
    console.log(`ProtectedRoute: Authentication check failed post-loading. isAuthenticated: ${isAuthenticated}, currentUser: ${!!currentUser}. Redirecting to login.`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // At this point, isAuthenticated is true, and currentUser is available.
  // userRoleCodes and userPermissions used by usePermissions() hook should be up-to-date from the store.

  // Role Check
  if (allowedRoles && allowedRoles.length > 0) {
    // Ensure userRoleCodes is not null before calling .some()
    if (!userRoleCodes || !userRoleCodes.some(code => allowedRoles.includes(code))) {
      console.log(`ProtectedRoute: Role check failed. User roles codes from usePermissions hook: ${userRoleCodes?.join(', ') || '[No role codes from hook]'}. Required: ${allowedRoles.join(', ')}`);
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Permission Check
  if (requiredPermissions && requiredPermissions.length > 0) {
    const currentPermissionsFromHook = userPermissions; // Re-access for clarity, or rely on one from initial destructuring
    // It's crucial that usePermissions hook provides up-to-date userPermissions array here
    // Let's check if the permissions array from the hook is non-empty if permissions are required
    if (!currentPermissionsFromHook || currentPermissionsFromHook.length === 0) {
      console.log(`ProtectedRoute: Permission check failed. User has no permissions according to usePermissions hook, but required permissions are: ${requiredPermissions.join(', ')}`);
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    
    let userHasRequiredPermissions = false;
    if (permissionMatchMode === 'any') {
      userHasRequiredPermissions = currentPermissionsFromHook.some(permission => requiredPermissions.includes(permission));
    } else { // Default is 'all'
      userHasRequiredPermissions = requiredPermissions.every(permission => currentPermissionsFromHook.includes(permission));
    }

    if (!userHasRequiredPermissions) {
      console.log(`ProtectedRoute: Permission check failed. Mode: ${permissionMatchMode}. User permissions from hook: ${currentPermissionsFromHook?.join(', ') || '[No permissions from hook]'}. Required: ${requiredPermissions.join(', ')}`);
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // If all checks pass, render the children directly as loading is handled above.
  // console.log('[ProtectedRoute] All checks passed. Rendering children.');
  return <>{children}</>; // Render children directly
};

export default ProtectedRoute; 