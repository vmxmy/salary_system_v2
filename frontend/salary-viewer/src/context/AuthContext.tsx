import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode'; // Import jwt-decode
import apiClient from '../services/api'; // Corrected import path

// Define the structure of the user object
interface User {
    id: number; // Assuming user ID is available, adjust if not
    username: string;
    role: string;
    email?: string; // Add optional email field
    // Add other relevant user fields if needed (e.g., name)
}

// Define the structure of the decoded JWT payload
interface DecodedToken extends JwtPayload {
    sub: string; // Subject (usually username)
    role: string;
    email?: string; // Add optional email field from token
    // Add other fields from your token payload if present
}

// Define the shape of the context data
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean; // To handle initial loading state
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the provider component
interface AuthProviderProps {
    children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially

    // Function to handle setting auth state from token
    const setAuthState = useCallback((newToken: string | null) => {
        if (newToken) {
            try {
                const decoded = jwtDecode<DecodedToken>(newToken);
                const newUser: User = {
                    id: 0, // Placeholder ID, should come from API
                    username: decoded.sub,
                    role: decoded.role,
                    email: decoded.email,
                };
                setUser(newUser);
                setToken(newToken);
                localStorage.setItem('authToken', newToken);
            } catch (error) {
                console.error("Failed to decode token or set auth state:", error);
                setUser(null);
                setToken(null);
                localStorage.removeItem('authToken');
            }
        } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
        }
    }, []);

    // Effect to load token from localStorage on initial mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setAuthState(storedToken);
        }
        setIsLoading(false); 
    }, [setAuthState]);

    // Login function
    const login = useCallback(async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await apiClient.post<{ access_token: string }>('/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const newToken = response.data.access_token;
            setAuthState(newToken);
        } catch (error) {
            console.error('Login failed:', error);
            setAuthState(null); 
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [setAuthState]);

    // Logout function - ADD REDIRECT
    const logout = useCallback(() => {
        console.log("AuthContext: Logging out and redirecting...");
        setAuthState(null);
        // Redirect to login page
        window.location.href = '/login'; 
    }, [setAuthState]);

    // --- NEW Effect to listen for auth errors from interceptor --- START
    useEffect(() => {
        const handleAuthError = () => {
            console.log("AuthContext: Received auth-error-logout event.");
            logout(); // Call the logout function which handles state clearing and redirect
        };

        window.addEventListener('auth-error-logout', handleAuthError);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('auth-error-logout', handleAuthError);
        };
    }, [logout]); // Depend on logout function (which depends on setAuthState)
    // --- NEW Effect to listen for auth errors from interceptor --- END

    // Provide the context value to children
    const contextValue: AuthContextType = {
        isAuthenticated: !!token && !!user,
        user,
        token,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}; 