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
  console.log('[AuthStore] processUserRbac called with user:', JSON.stringify(user, null, 2)); // Log the input user object
  if (!user || !user.roles) {
    console.log('[AuthStore] processUserRbac: User or user.roles is null/undefined.');
    return { roles: null, roleCodes: null, permissions: null };
  }
  const roles = user.roles.map((r: Role) => r.name);
  const roleCodes = user.roles.map((r: Role) => r.code); // Extract role codes
  const permissions = Array.from(
    new Set(user.roles.flatMap((r: Role) => r.permissions?.map((p: Permission) => p.code) || []))
  );
  console.log('[AuthStore] processUserRbac processed:', { roles, roleCodes, permissions }); // Log the output
  return { roles, roleCodes, permissions }; // Return role codes
};

export const useAuthStore = create<AuthStoreState & AuthStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      loginAction: async (credentials) => {
        console.log('[AuthStore] loginAction called with credentials:', credentials);
        set({ isLoadingUser: true, loginError: null, fetchUserError: null }); // Clear previous fetchUserError too
        try {
          const response: LoginResponse = await apiLogin(credentials);
          console.log('[AuthStore] loginAction: API login response received:', response);
          // Assuming LoginResponse now contains the full user object as response.user
          const { access_token, user } = response;

          if (!access_token || !user) {
            console.error('[AuthStore] loginAction: Access token or user object not found in login response');
            throw new Error('Access token or user object not found in login response');
          }

          const decodedToken = jwtDecode<DecodedToken>(access_token);
          const usernameFromToken = decodedToken.sub;
          const { roles, roleCodes, permissions } = processUserRbac(user); // Destructure roleCodes

          set({
            authToken: access_token,
            currentUser: user,
            currentUserId: usernameFromToken, // from token sub
            currentUserNumericId: user.id,   // from user object
            userRoles: roles,
            userRoleCodes: roleCodes, // Set roleCodes
            userPermissions: permissions,
            loginError: null,
            isLoadingUser: false, // Login and user processing complete
          });
          console.log('[AuthStore] loginAction: User, roles, and permissions set in store.', user, roles, permissions);
          // No longer need to call fetchCurrentUserDetails here as user object is complete
        } catch (error: any) {
          console.error('[AuthStore] loginAction: Login failed.', error);
          const errorMessage = error.response?.data?.detail || error.message || 'An unknown login error occurred';
          set({
            ...initialState, // Reset to initial state on login failure
            loginError: errorMessage,
            isLoadingUser: false,
          });
        }
      },

      fetchCurrentUserDetails: async (numericUserId) => {
        console.log(`[AuthStore] fetchCurrentUserDetails called with numericId: ${numericUserId}`);
        if (numericUserId === undefined || numericUserId === null) {
          console.warn('[AuthStore] fetchCurrentUserDetails: Numeric User ID is missing.');
          set({ fetchUserError: 'Numeric User ID is missing, cannot fetch details.', currentUser: null, userRoles: null, userPermissions: null, isLoadingUser: false });
          return;
        }
        set({ isLoadingUser: true, fetchUserError: null });
        try {
          const user = await apiGetCurrentUser(numericUserId); // This should return the User type with roles and permissions
          console.log('[AuthStore] fetchCurrentUserDetails: User fetched successfully:', user);
          const { roles, roleCodes, permissions } = processUserRbac(user); // Destructure roleCodes
          set({
            currentUser: user,
            currentUserNumericId: user.id, // Ensure this is also updated
            currentUserId: user.username, // Update currentUserId to match fetched user's username
            userRoles: roles,
            userRoleCodes: roleCodes, // Set roleCodes
            userPermissions: permissions,
            isLoadingUser: false,
            fetchUserError: null
          });
        } catch (error: any) {
          console.error('[AuthStore] fetchCurrentUserDetails: Failed to fetch user details.', error);
          const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch user details';
          // 彻底登出，避免 token 残留导致状态不一致
          get().logoutAction();
          set({ fetchUserError: errorMessage, isLoadingUser: false });
        }
      },

      logoutAction: () => {
        console.log('[AuthStore] logoutAction called');
        set(initialState); // Resets all fields including new RBAC ones
      },

      initializeAuth: () => {
        const token = get().authToken;
        const numericIdFromStorage = get().currentUserNumericId; // Persisted numeric ID
        console.log(`[AuthStore] initializeAuth called. Token: ${!!token}, NumericID: ${numericIdFromStorage}`);
        
        const isLoading = get().isLoadingUser;
        // const currentUser = get().currentUser; // currentUser from store is not directly used for this decision anymore

        if (token) {
          try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            set({ currentUserId: decodedToken.sub }); 

            if (isLoading) {
              console.log('[AuthStore] initializeAuth: User is already being loaded. Skipping fetchCurrentUserDetails.');
            } else if (numericIdFromStorage !== null && numericIdFromStorage !== undefined) {
              // If token and numericId exist from storage, always try to fetch/validate user details
              console.log(`[AuthStore] initializeAuth: Found token and numericId (${numericIdFromStorage}) from storage. Attempting to fetch/validate user details.`);
              get().fetchCurrentUserDetails(numericIdFromStorage);
            } else {
              // Token exists but numericId is missing/invalid from storage, or some other inconsistent state
              console.warn(`[AuthStore] initializeAuth: authToken exists but currentUserNumericId (${numericIdFromStorage}) from storage is not valid or missing. Logging out.`);
              get().logoutAction();
            }
          } catch (error) {
            console.error('[AuthStore] Failed to decode token during initialization or other init error:', error);
            get().logoutAction();
          }
        } else {
          console.log('[AuthStore] initializeAuth: No token found, ensuring logout state.');
          // If no token, ensure all user state is cleared (logoutAction already does this)
          // We can add an explicit check to ensure initialState is set if any user data might linger
          if (get().currentUser || get().userRoles || get().userPermissions || get().authToken ) { 
            set(initialState);
          }
        }
      },

      clearLoginError: () => set({ loginError: null }),
      clearFetchUserError: () => set({ fetchUserError: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        console.log('[AuthStore] partialize called. Persisting state:', {
          authToken: state.authToken,
          currentUserNumericId: state.currentUserNumericId,
          // currentUser: state.currentUser, // Temporarily comment out currentUser for simpler logging if needed
          // userRoles: state.userRoles, // Not persisted, derived from currentUser
          // userRoleCodes: state.userRoleCodes, // Not persisted, derived from currentUser
          // userPermissions: state.userPermissions, // Not persisted, derived from currentUser
        });
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