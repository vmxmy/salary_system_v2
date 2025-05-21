import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, getCurrentUser as apiGetCurrentUser, type LoginCredentials } from '../api/auth';
import type { User, LoginResponse, Role, Permission } from '../api/types';

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
  // console.log('[AuthStore] processUserRbac called with user:', JSON.stringify(user, null, 2)); // Log the input user object
  if (!user || !user.roles) {
    // console.log('[AuthStore] processUserRbac: User or user.roles is null/undefined.');
    return { roles: null, roleCodes: null, permissions: null };
  }
  const roles = user.roles.map((r: Role) => r.name);
  const roleCodes = user.roles.map((r: Role) => r.code); // Extract role codes
  const permissions = Array.from(
    new Set(user.roles.flatMap((r: Role) => r.permissions?.map((p: Permission) => p.code) || []))
  );
  // console.log('[AuthStore] processUserRbac processed:', { roles, roleCodes, permissions }); // Log the output
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
        // console.log('[AuthStore:loginAction] Called with credentials:', credentials);
        const newStateBeforeLogin = { isLoadingUser: true, loginError: null, fetchUserError: null };
        // console.log('[AuthStore:loginAction] Setting state (before API call):', newStateBeforeLogin);
        set(newStateBeforeLogin);
        try {
          const response: LoginResponse = await apiLogin(credentials);
          // console.log('[AuthStore:loginAction] API login response received:', response);
          const { access_token, user } = response;

          if (!access_token || !user) {
            const errorMsg = 'Access token or user object not found in login response';
            // console.error('[AuthStore:loginAction]', errorMsg);
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
            // console.log('[AuthStore:loginAction] Setting state (on success):', updatedState);
            return updatedState;
          });
          // console.log('[AuthStore:loginAction] User, roles, and permissions set in store.');
          // console.log('[AuthStore:loginAction] Store state AFTER successful set:', JSON.stringify(get(), null, 2));
        } catch (error: any) {
          // console.error('[AuthStore:loginAction] Login failed.', error);
          const errorMessage = error.response?.data?.detail || error.message || 'An unknown login error occurred';
          const errorState = {
            ...initialState,
            loginError: errorMessage,
            isLoadingUser: false,
          };
          // console.log('[AuthStore:loginAction] Setting state (on error):', errorState);
          set(errorState);
        }
      },

      fetchCurrentUserDetails: async (numericUserId) => {
        // console.log(`[AuthStore:fetchCurrentUserDetails] Called with numericId: ${numericUserId}`);
        if (numericUserId === undefined || numericUserId === null) {
          const errorMsg = 'Numeric User ID is missing, cannot fetch details.';
          // console.warn('[AuthStore:fetchCurrentUserDetails]', errorMsg);
          const errorState = { fetchUserError: errorMsg, currentUser: null, userRoles: null, userPermissions: null, isLoadingUser: false };
          // console.log('[AuthStore:fetchCurrentUserDetails] Setting state (ID missing):', errorState);
          set(errorState);
          return;
        }
        const loadingState = { isLoadingUser: true, fetchUserError: null };
        // console.log('[AuthStore:fetchCurrentUserDetails] Setting state (before API call):', loadingState);
        set(loadingState);
        try {
          const user = await apiGetCurrentUser(numericUserId);
          // console.log('[AuthStore:fetchCurrentUserDetails] User fetched successfully:', user);
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
            // console.log('[AuthStore:fetchCurrentUserDetails] Setting state (on success):', successState);
            return successState;
          });
          // console.log('[AuthStore:fetchCurrentUserDetails] Store state AFTER successful set:', JSON.stringify(get(), null, 2));
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch user details';
          // console.error('[AuthStore:fetchCurrentUserDetails] Failed to fetch user details, logging out.', error);
          get().logoutAction();
          const errorStateAfterLogout = { fetchUserError: errorMessage };
          // console.log('[AuthStore:fetchCurrentUserDetails] Setting state (on error, after logout):', errorStateAfterLogout);
          set(errorStateAfterLogout);
        }
      },

      logoutAction: () => {
        // console.log('[AuthStore:logoutAction] Called');
        // console.log('[AuthStore:logoutAction] Setting state to initialState:', initialState);
        set(initialState);
      },

      initializeAuth: () => {
        const token = get().authToken;
        const numericIdFromStorage = get().currentUserNumericId;
        // console.log(`[AuthStore:initializeAuth] Called. Token: ${!!token}, NumericID: ${numericIdFromStorage}`);
        
        const isLoading = get().isLoadingUser;

        if (token) {
          try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            const setSubState = { currentUserId: decodedToken.sub };
            // console.log('[AuthStore:initializeAuth] Setting currentUserId from token:', setSubState);
            set(setSubState);

            if (isLoading) {
              // console.log('[AuthStore:initializeAuth] User is already being loaded. Skipping fetchCurrentUserDetails.');
            } else if (numericIdFromStorage !== null && numericIdFromStorage !== undefined) {
              // console.log(`[AuthStore:initializeAuth] Found token and numericId (${numericIdFromStorage}). Calling fetchCurrentUserDetails.`);
              get().fetchCurrentUserDetails(numericIdFromStorage);
            } else {
              // console.warn(`[AuthStore:initializeAuth] authToken exists but currentUserNumericId (${numericIdFromStorage}) from storage is not valid or missing. Calling logoutAction.`);
              get().logoutAction();
            }
          } catch (error) {
            // console.error('[AuthStore:initializeAuth] Failed to decode token or other init error. Calling logoutAction:', error);
            get().logoutAction();
          }
        } else {
          // console.log('[AuthStore:initializeAuth] No token found, ensuring logout state.');
          if (get().currentUser || get().userRoles || get().userPermissions || get().authToken ) {
            // console.log('[AuthStore:initializeAuth] User data found with no token. Setting state to initialState.');
            set(initialState);
          }
        }
        // console.log('[AuthStore:initializeAuth] Store state AT END of initializeAuth:', JSON.stringify(get(), null, 2));
      },

      clearLoginError: () => {
        // console.log('[AuthStore:clearLoginError] Setting loginError to null');
        set({ loginError: null });
      },
      clearFetchUserError: () => {
        // console.log('[AuthStore:clearFetchUserError] Setting fetchUserError to null');
        set({ fetchUserError: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // console.log('[AuthStore] partialize called. Persisting state:', {
        //   authToken: state.authToken,
        //   currentUserNumericId: state.currentUserNumericId,
        //   // currentUser: state.currentUser, // Temporarily comment out currentUser for simpler logging if needed
        //   // userRoles: state.userRoles, // Not persisted, derived from currentUser
        //   // userRoleCodes: state.userRoleCodes, // Not persisted, derived from currentUser
        //   // userPermissions: state.userPermissions, // Not persisted, derived from currentUser
        // });
        return {
          authToken: state.authToken,
          currentUserNumericId: state.currentUserNumericId,
          currentUser: state.currentUser, // Still persisting currentUser
        };
      },
    }
  )
);

// 在应用启动时调用一次
// 注意: 直接在这里调用 useAuthStore.getState().initializeAuth(); 可能在某些构建或 SSR 场景下过早。
// 更好的做法是在应用的顶层组件 (如 App.tsx 或 main.tsx) 的 useEffect 中调用一次。
// console.log('Auth store initialized. Call initializeAuth from App.tsx or main.tsx');