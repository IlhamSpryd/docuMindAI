import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, QuotaInfo } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  quota: QuotaInfo | null;
  isLoading: boolean;
  serverReady: boolean;
  login: (token: string, user: UserProfile) => void;
  loginDemo: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('documind_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('documind_auth_token')
  );
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverReady, setServerReady] = useState<boolean>(false);

  // Warm-up ping to backend (RSK-04 defense for cold start)
  useEffect(() => {
    api
      .getHealth()
      .then(() => setServerReady(true))
      .catch(() => setServerReady(false));
  }, []);

  const refreshUser = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Demo account mode (offline / UI preview support)
    if (token.startsWith('mock-test-token-')) {
      const demoUser: UserProfile = user || {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'reviewer@documind.ai',
      };
      const demoQuota: QuotaInfo = quota || {
        maxDocuments: 5,
        usedDocuments: 2,
        remainingDocuments: 3,
      };
      setUser(demoUser);
      setQuota(demoQuota);
      localStorage.setItem('documind_user', JSON.stringify(demoUser));
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setQuota(res.quota);
      localStorage.setItem('documind_user', JSON.stringify(res.user));
    } catch {
      // Token invalid or expired
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('documind_auth_token', newToken);
    localStorage.setItem('documind_user', JSON.stringify(newUser));
  };

  const loginDemo = () => {
    const demoToken = 'mock-test-token-demo-reviewer';
    const demoUser: UserProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'reviewer@documind.ai',
    };
    login(demoToken, demoUser);
    setQuota({
      maxDocuments: 5,
      usedDocuments: 2,
      remainingDocuments: 3,
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setQuota(null);
    localStorage.removeItem('documind_auth_token');
    localStorage.removeItem('documind_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        quota,
        isLoading,
        serverReady,
        login,
        loginDemo,
        logout,
        refreshUser,
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
