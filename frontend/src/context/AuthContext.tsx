import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { authApi, teamApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  exitImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isImpersonating = !!localStorage.getItem('impersonation_id');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { accessToken, user: userData, creditBalance } = response as any;

    const userWithCredits = {
      ...userData,
      credits: creditBalance || 0,
    };

    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userWithCredits));

    setToken(accessToken);
    setUser(userWithCredits);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonation_id');
    localStorage.removeItem('impersonation_original_token');
    localStorage.removeItem('impersonation_original_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const exitImpersonation = async () => {
    const impersonationId = localStorage.getItem('impersonation_id');
    const originalToken = localStorage.getItem('impersonation_original_token');
    const originalUser = localStorage.getItem('impersonation_original_user');

    if (impersonationId) {
      try {
        await teamApi.exitImpersonation(impersonationId);
      } catch {
        // continue even if the API call fails
      }
    }

    localStorage.removeItem('impersonation_id');
    localStorage.removeItem('impersonation_original_token');
    localStorage.removeItem('impersonation_original_user');

    if (originalToken && originalUser) {
      localStorage.setItem('token', originalToken);
      localStorage.setItem('user', originalUser);
      setToken(originalToken);
      setUser(JSON.parse(originalUser));
    } else {
      logout();
    }

    window.location.href = '/team';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isImpersonating,
        login,
        logout,
        updateUser,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
