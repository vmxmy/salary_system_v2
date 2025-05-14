import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, getCurrentUser as apiGetCurrentUser, type LoginCredentials } from '../api/auth';
import type { User, LoginResponse } from '../api/types';

interface DecodedToken {
  sub: string; // Subject (username)
  role?: string;
  exp?: number;
}

export interface AuthStoreState {
  authToken: string | null;
  currentUserId: string | null; // Username from JWT sub
  currentUserNumericId: number | null; // Numeric ID from /token response
  currentUser: User | null;
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
  isLoadingUser: false,
  loginError: null,
  fetchUserError: null,
};

export const useAuthStore = create<AuthStoreState & AuthStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      loginAction: async (credentials) => {
        console.log('[AuthStore] loginAction called with credentials:', credentials);
        set({ isLoadingUser: true, loginError: null });
        try {
          const response: LoginResponse = await apiLogin(credentials);
          console.log('[AuthStore] loginAction: API login response received:', response);
          const { access_token, user_id: numericUserId, username: respUsername, role: respRole } = response; 

          if (!access_token) {
            console.error('[AuthStore] loginAction: Access token not found in login response');
            throw new Error('Access token not found in login response');
          }
          if (numericUserId === undefined || numericUserId === null) {
            console.error('[AuthStore] loginAction: Numeric user_id not found in login response. Backend /token endpoint needs to be updated.');
            throw new Error('Numeric user_id not found in login response.');
          }

          const decodedToken = jwtDecode<DecodedToken>(access_token);
          const usernameFromToken = decodedToken.sub; 
          console.log(`[AuthStore] loginAction: Token decoded. Username from token (sub): ${usernameFromToken}, Role from token: ${decodedToken.role}`);
          console.log(`[AuthStore] loginAction: Username from /token response body (if any): ${respUsername}, Role from /token response body (if any): ${respRole}`);

          set({
            authToken: access_token,
            currentUserId: usernameFromToken, 
            currentUserNumericId: numericUserId, 
            loginError: null,
          });
          
          console.log('[AuthStore] loginAction: Auth token and IDs set in store. Calling fetchCurrentUserDetails...');
          await get().fetchCurrentUserDetails(numericUserId);
        } catch (error: any) {
          console.error('[AuthStore] loginAction: Login failed.', error);
          const errorMessage = error.response?.data?.detail || error.message || 'An unknown login error occurred';
          set({ 
            loginError: errorMessage, 
            authToken: null, 
            currentUserId: null, 
            currentUserNumericId: null,
            currentUser: null,
            isLoadingUser: false,
          });
        } finally {
           // isLoadingUser is now set to false inside the try (on success, after fetchCurrentUserDetails) or catch blocks.
           // If fetchCurrentUserDetails itself sets isLoadingUser, ensure its finally block also cleans up.
           // For loginAction itself, if all paths within try/catch set isLoadingUser appropriately, this finally might not be strictly needed for it.
           // However, fetchCurrentUserDetails has its own isLoadingUser management.
        }
      },

      fetchCurrentUserDetails: async (numericUserId) => {
        console.log(`[AuthStore] fetchCurrentUserDetails called with numericId: ${numericUserId}`);
        if (numericUserId === undefined || numericUserId === null) {
            console.warn('[AuthStore] fetchCurrentUserDetails: Numeric User ID is missing.');
            set({ fetchUserError: 'Numeric User ID is missing, cannot fetch details.', currentUser: null, isLoadingUser: false });
            return;
        }
        set({ isLoadingUser: true, fetchUserError: null });
        try {
          const user = await apiGetCurrentUser(numericUserId);
          console.log('[AuthStore] fetchCurrentUserDetails: User fetched successfully:', user);
          set({ currentUser: user, isLoadingUser: false, fetchUserError: null });
        } catch (error: any) {
          console.error('[AuthStore] fetchCurrentUserDetails: Failed to fetch user details.', error);
          const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch user details';
          set({ currentUser: null, fetchUserError: errorMessage, isLoadingUser: false });
        }
      },

      logoutAction: () => {
        console.log('[AuthStore] logoutAction called');
        set(initialState);
      },

      initializeAuth: () => {
        const token = get().authToken;
        const numericIdFromStorage = get().currentUserNumericId;
        console.log(`[AuthStore] initializeAuth called. Token value: '${token}', Token type: ${typeof token}, NumericID value: ${numericIdFromStorage}, NumericID type: ${typeof numericIdFromStorage}`);
        
        const isLoading = get().isLoadingUser;
        const currentUser = get().currentUser;

        if (token) { // This condition is unexpectedly true on first load after clearing localStorage
          try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            set({ currentUserId: decodedToken.sub });

            if (numericIdFromStorage !== null && numericIdFromStorage !== undefined) {
              console.log(`[AuthStore] initializeAuth: Found token and numericId (${numericIdFromStorage}). isLoading: ${isLoading}, currentUser exists: ${!!currentUser}`);
              if ((!currentUser || currentUser.id !== numericIdFromStorage) && !isLoading) {
                console.log('[AuthStore] initializeAuth: Conditions met, calling fetchCurrentUserDetails.');
                get().fetchCurrentUserDetails(numericIdFromStorage);
              } else if (isLoading) {
                console.log('[AuthStore] initializeAuth: User is already being loaded.');
              } else {
                console.log('[AuthStore] initializeAuth: User data already loaded and matches numericId.');
              }
            } else {
              console.warn(`[AuthStore] initializeAuth: authToken ('${token}') exists but currentUserNumericId is not available from storage. User details may not load until next login.`);
              if(currentUser) {
                set({ currentUser: null }); 
              }
              if(isLoading && !numericIdFromStorage) {
                  set({ isLoadingUser: false });
              }
            }
          } catch (error) {
            console.error('[AuthStore] Failed to decode token during initialization:', error);
            get().logoutAction();
          }
        } else {
          console.log('[AuthStore] initializeAuth: No token found (or token is null/undefined), calling logoutAction.');
          get().logoutAction(); 
        }
      },
      
      clearLoginError: () => set({ loginError: null }),
      clearFetchUserError: () => set({ fetchUserError: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        authToken: state.authToken,
        currentUserNumericId: state.currentUserNumericId, // 持久化数字ID
        // currentUserId (username from sub) 不需要持久化，因为它可以从 authToken 重新解码
        // currentUser 对象也不建议直接持久化，通常在应用加载时重新获取
      }),
    }
  )
);

// 在应用启动时调用一次
// 注意: 直接在这里调用 useAuthStore.getState().initializeAuth(); 可能在某些构建或 SSR 场景下过早。
// 更好的做法是在应用的顶层组件 (如 App.tsx 或 main.tsx) 的 useEffect 中调用一次。
// console.log('Auth store initialized. Call initializeAuth from App.tsx or main.tsx'); 