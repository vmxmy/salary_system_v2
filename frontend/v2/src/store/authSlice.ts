import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, getCurrentUser as apiGetCurrentUser, type LoginCredentials } from '../api/auth';
import type { User, LoginResponse, Role, Permission } from '../api/types';
import { formatErrorMessage } from '../api/apiClient';

interface DecodedToken {
  sub: string; // Subject (username)
  role?: string;
  exp?: number;
}

export interface AuthState {
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

const initialState: AuthState = {
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

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response: LoginResponse = await apiLogin(credentials);
      const { access_token, user } = response;

      if (!access_token || !user) {
        throw new Error('Access token or user object not found in login response');
      }

      const decodedToken = jwtDecode<DecodedToken>(access_token);
      const usernameFromToken = decodedToken.sub;
      const { roles, roleCodes, permissions } = processUserRbac(user);

      return {
        authToken: access_token,
        currentUser: user,
        currentUserId: usernameFromToken,
        currentUserNumericId: user.id,
        userRoles: roles,
        userRoleCodes: roleCodes,
        userPermissions: permissions,
      };
    } catch (error: any) {
      return rejectWithValue(formatErrorMessage(error));
    }
  }
);

export const fetchCurrentUserDetails = createAsyncThunk(
  'auth/fetchCurrentUserDetails',
  async (numericUserId: number, { rejectWithValue, dispatch }) => {
    if (numericUserId === undefined || numericUserId === null) {
      return rejectWithValue('Numeric User ID is missing, cannot fetch details.');
    }
    try {
      const user = await apiGetCurrentUser(numericUserId);
      const { roles, roleCodes, permissions } = processUserRbac(user);
      return {
        currentUser: user,
        currentUserNumericId: user.id,
        currentUserId: user.username,
        userRoles: roles,
        userRoleCodes: roleCodes,
        userPermissions: permissions,
      };
    } catch (error: any) {
      // If fetching user details fails, log out
      dispatch(logout());
      return rejectWithValue(formatErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Clear all auth state
      Object.assign(state, initialState);
      // Optionally clear local storage here if persist middleware is not used
      // localStorage.removeItem('auth-storage');
    },
    setAuthToken: (state, action: PayloadAction<string | null>) => {
      state.authToken = action.payload;
    },
    clearLoginError: (state) => {
      state.loginError = null;
    },
    clearFetchUserError: (state) => {
      state.fetchUserError = null;
    },
    // Reducer to handle rehydration from storage (if using a custom persistence solution)
    rehydrateAuth: (state, action: PayloadAction<AuthState>) => {
        // This is a basic rehydration. More complex logic might be needed
        // depending on how persistence was handled in Zustand.
        // Ensure not to overwrite loading/error states if they are transient.
        const { isLoadingUser, loginError, fetchUserError, ...rehydratedState } = action.payload;
        Object.assign(state, rehydratedState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoadingUser = true;
        state.loginError = null;
        state.fetchUserError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isLoadingUser = false;
        state.loginError = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoadingUser = false;
        state.loginError = action.payload as string || 'Login failed';
        // Clear sensitive info on login failure
        Object.assign(state, initialState);
      })
      .addCase(fetchCurrentUserDetails.pending, (state) => {
        state.isLoadingUser = true;
        state.fetchUserError = null;
      })
      .addCase(fetchCurrentUserDetails.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isLoadingUser = false;
        state.fetchUserError = null;
      })
      .addCase(fetchCurrentUserDetails.rejected, (state, action) => {
        state.isLoadingUser = false;
        state.fetchUserError = action.payload as string || 'Failed to fetch user details';
        // Logout action is dispatched within the thunk on failure,
        // so the state will be reset by the logout reducer.
      });
  },
});

export const { logout, setAuthToken, clearLoginError, clearFetchUserError, rehydrateAuth } = authSlice.actions;

export default authSlice.reducer;