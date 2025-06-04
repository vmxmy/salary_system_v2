import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState } from '../store';

export const usePermissions = () => {
  const userPermissions = useSelector((state: RootState) => state.auth.userPermissions);
  const userRoles = useSelector((state: RootState) => state.auth.userRoles); // Keep for display names if needed
  const userRoleCodes = useSelector((state: RootState) => state.auth.userRoleCodes); // Get role codes

  const hasPermission = useCallback((permissionCode: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.includes(permissionCode);
  }, [userPermissions]);

  const hasAllPermissions = useCallback((permissionCodes: string[]): boolean => {
    if (!userPermissions) return false;
    if (permissionCodes.length === 0) return true; // No permissions required means access is granted
    return permissionCodes.every(code => userPermissions.includes(code));
  }, [userPermissions]);
  
  const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
    if (!userPermissions) return false;
    if (permissionCodes.length === 0) return true; // Or false, depending on desired behavior for empty array
    return permissionCodes.some(code => userPermissions.includes(code));
  }, [userPermissions]);

  // Role-based checks can also be part of this hook or a separate useRoles hook
  const hasRole = useCallback((roleCode: string): boolean => {
    if (!userRoleCodes) return false;
    return userRoleCodes.includes(roleCode);
  }, [userRoleCodes]);

  const hasAnyRole = useCallback((roleCodes: string[]): boolean => {
    if (!userRoleCodes) return false;
    if (roleCodes.length === 0) return true;
    return roleCodes.some(code => userRoleCodes.includes(code));
  }, [userRoleCodes]);

  const hasAllRoles = useCallback((roleCodes: string[]): boolean => {
    if (!userRoleCodes) return false;
    if (roleCodes.length === 0) return true;
    return roleCodes.every(code => userRoleCodes.includes(code));
  }, [userRoleCodes]);

  return {
    userPermissions,
    userRoles,
    userRoleCodes,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
}; 