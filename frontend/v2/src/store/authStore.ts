import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, getCurrentUser as apiGetCurrentUser, type LoginCredentials } from '../api/auth';
import type { User, LoginResponse, Role, Permission } from '../api/types';
import { formatErrorMessage } from '../api/apiClient';

interface DecodedToken {
  sub: string; // Subject (username)
  role?: string;
  exp?: number;
}

export interface AuthStoreState {
  authToken: string | null;
  currentUserId: string | null; // Username from JWT sub (username from currentUser.username is preferred)
  currentUserNumericId: number | null; // Numeric ID (can be derived from currentUser.id)
  currentUser: User | null; // Updated User type which includes roles and permissions
  userRoles: string[] | null; // Extracted role names for quick access
  userRoleCodes: string[] | null; // Extracted role codes for quick access
  userPermissions: string[] | null; // Extracted and flattened permission codes for quick access
  isLoadingUser: boolean;
  loginError: string | null;
  fetchUserError: string | null;
}

export interface AuthStoreActions {
  loginAction: (credentials: LoginCredentials) => Promise<void>;
  logoutAction: () => void;
  fetchCurrentUserDetails: (numericUserId: number) => Promise<void>; // Expects numeric ID
  initializeAuth: () => void;
  clearLoginError: () => void;
  clearFetchUserError: () => void;
  setAuthToken: (token: string | null) => void; // New action to set the token
}

const initialState: AuthStoreState = {
  authToken: null,
  currentUserId: null,
  currentUserNumericId: null,
  currentUser: null,
  userRoles: null,
  userRoleCodes: null,
  userPermissions: null,
  isLoadingUser: false,
  loginError: null,
  fetchUserError: null,
};

// Helper function to extract roles and permissions
const processUserRbac = (user: User | null): { roles: string[] | null, roleCodes: string[] | null, permissions: string[] | null } => {
  if (!user || !user.roles) {
    return { roles: null, roleCodes: null, permissions: null };
  }
  const roles = user.roles.map((r: Role) => r.name);
  const roleCodes = user.roles.map((r: Role) => r.code); // Extract role codes
  const permissions = Array.from(
    new Set(user.roles.flatMap((r: Role) => r.permissions?.map((p: Permission) => p.code) || []))
  );
  return { roles, roleCodes, permissions }; // Return role codes
};

// Helper function to compare two string arrays (order matters for simplicity here)
const areArraysEqual = (arr1: string[] | null | undefined, arr2: string[] | null | undefined): boolean => {
  if (arr1 === arr2) return true; // Same reference or both null/undefined
  if (!arr1 || !arr2) return false; // One is null/undefined, the other isn't
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

export const useAuthStore = create<AuthStoreState & AuthStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      loginAction: async (credentials) => {
        const newStateBeforeLogin = { isLoadingUser: true, loginError: null, fetchUserError: null };
        set(newStateBeforeLogin);
        try {
          const response: LoginResponse = await apiLogin(credentials);
          const { access_token, user } = response;

          if (!access_token || !user) {
            const errorMsg = 'Access token or user object not found in login response';
            throw new Error(errorMsg);
          }

          const decodedToken = jwtDecode<DecodedToken>(access_token);
          const usernameFromToken = decodedToken.sub;
          const { roles, roleCodes, permissions } = processUserRbac(user);

          set(state => {
            const updatedState = {
              ...state,
              authToken: access_token,
              currentUser: user,
              currentUserId: usernameFromToken,
              currentUserNumericId: user.id,
              userRoles: areArraysEqual(state.userRoles, roles) ? state.userRoles : roles,
              userRoleCodes: areArraysEqual(state.userRoleCodes, roleCodes) ? state.userRoleCodes : roleCodes,
              userPermissions: areArraysEqual(state.userPermissions, permissions) ? state.userPermissions : permissions,
              loginError: null,
              isLoadingUser: false,
            };
            return updatedState;
          });
        } catch (error: any) {
          const errorMessage = formatErrorMessage(error);
          
          const errorState = {
            ...initialState,
            loginError: errorMessage,
            isLoadingUser: false,
          };
          set(errorState);
        }
      },

      fetchCurrentUserDetails: async (numericUserId) => {
        if (numericUserId === undefined || numericUserId === null) {
          const errorMsg = 'Numeric User ID is missing, cannot fetch details.';
          const errorState = { fetchUserError: errorMsg, currentUser: null, userRoles: null, userPermissions: null, isLoadingUser: false };
          set(errorState);
          return;
        }
        const loadingState = { isLoadingUser: true, fetchUserError: null };
        set(loadingState);
        try {
          const user = await apiGetCurrentUser(numericUserId);
          const { roles, roleCodes, permissions } = processUserRbac(user);
          set(state => {
            const successState = {
              ...state,
              currentUser: user,
              currentUserNumericId: user.id,
              currentUserId: user.username,
              userRoles: areArraysEqual(state.userRoles, roles) ? state.userRoles : roles,
              userRoleCodes: areArraysEqual(state.userRoleCodes, roleCodes) ? state.userRoleCodes : roleCodes,
              userPermissions: areArraysEqual(state.userPermissions, permissions) ? state.userPermissions : permissions,
              isLoadingUser: false,
              fetchUserError: null
            };
            return successState;
          });
        } catch (error: any) {
          const errorMessage = formatErrorMessage(error);
          
          get().logoutAction();
          const errorStateAfterLogout = { fetchUserError: errorMessage };
          set(errorStateAfterLogout);
        }
      },

      logoutAction: () => {
        set(initialState);
      },

      initializeAuth: () => {
        const token = get().authToken;
        const numericIdFromStorage = get().currentUserNumericId;
        
        const isLoading = get().isLoadingUser;

        if (token) {
          try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            const currentTime = Date.now() / 1000; // current time in seconds

            // Check if token is expired
            if (decodedToken.exp && decodedToken.exp < currentTime) {
              console.warn('AuthStore: Token expired, logging out.');
              get().logoutAction();
              return; // Exit if token is expired
            }

            const setSubState = { currentUserId: decodedToken.sub };
            set(setSubState);

            if (isLoading) {
            } else if (numericIdFromStorage !== null && numericIdFromStorage !== undefined) {
              get().fetchCurrentUserDetails(numericIdFromStorage);
            } else {
              get().logoutAction();
            }
          } catch (error) {
            console.error('AuthStore: Error decoding token or initializing auth. Logging out.', error);
            get().logoutAction();
          }
        } else {
          if (get().currentUser || get().userRoles || get().userPermissions || get().authToken ) {
            set(initialState);
          }
        }
      },

      clearLoginError: () => {
        set({ loginError: null });
      },
      clearFetchUserError: () => {
        set({ fetchUserError: null });
      },

      setAuthToken: (token) => {
        set({ authToken: token });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        return {
          authToken: state.authToken,
          currentUserNumericId: state.currentUserNumericId,
          currentUser: state.currentUser,
        };
      },
    }
  )
);