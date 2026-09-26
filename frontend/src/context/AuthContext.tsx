import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { UserSummary, AuthTokens, UserRole, PermissionKey } from '../types';

interface AuthContextType {
  user: UserSummary | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: UserRole }) => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  hasPermission: (permission: PermissionKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'stocksense_access_token';
const REFRESH_KEY = 'stocksense_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup Axios interceptor to attach Bearer token automatically
  useEffect(() => {
    const interceptor = apiClient.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && config.headers) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, []);

  // Check existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRefresh = localStorage.getItem(REFRESH_KEY);

      if (storedToken && storedRefresh) {
        try {
          const res = await apiClient.get<{ success: boolean; data: UserSummary }>('/auth/me');
          setUser(res.data.data);
          setTokens({ accessToken: storedToken, refreshToken: storedRefresh });
        } catch {
          // Attempt refresh
          try {
            const refreshRes = await apiClient.post<{ success: boolean; data: { user: UserSummary; tokens: AuthTokens } }>('/auth/refresh', {
              refreshToken: storedRefresh,
            });
            setUser(refreshRes.data.data.user);
            setTokens(refreshRes.data.data.tokens);
            localStorage.setItem(TOKEN_KEY, refreshRes.data.data.tokens.accessToken);
            localStorage.setItem(REFRESH_KEY, refreshRes.data.data.tokens.refreshToken);
          } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            setUser(null);
            setTokens(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ success: boolean; data: { user: UserSummary; tokens: AuthTokens } }>('/auth/login', {
      email,
      password,
    });

    const { user: userData, tokens: tokenData } = res.data.data;
    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem(TOKEN_KEY, tokenData.accessToken);
    localStorage.setItem(REFRESH_KEY, tokenData.refreshToken);
  };

  const quickLogin = async (role: UserRole) => {
    const roleEmails: Record<UserRole, string> = {
      ADMIN: 'admin@stocksense.io',
      INVENTORY_MANAGER: 'manager@stocksense.io',
      WAREHOUSE_STAFF: 'staff@stocksense.io',
      VIEWER_AUDITOR: 'auditor@stocksense.io',
    };

    await login(roleEmails[role], 'Password123!');
  };

  const logout = async () => {
    try {
      const storedRefresh = localStorage.getItem(REFRESH_KEY);
      await apiClient.post('/auth/logout', { refreshToken: storedRefresh });
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      setUser(null);
      setTokens(null);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role?: UserRole }) => {
    const res = await apiClient.post<{ success: boolean; data: { user: UserSummary; tokens: AuthTokens } }>('/auth/register', data);
    const { user: userData, tokens: tokenData } = res.data.data;
    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem(TOKEN_KEY, tokenData.accessToken);
    localStorage.setItem(REFRESH_KEY, tokenData.refreshToken);
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string }) => {
    const res = await apiClient.put<{ success: boolean; data: UserSummary }>('/auth/me', data);
    setUser(res.data.data);
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    await apiClient.post('/auth/password/change', data);
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        loading,
        login,
        quickLogin,
        logout,
        register,
        updateProfile,
        changePassword,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
