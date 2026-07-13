'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSAThemeStore } from '@/store/useSAThemeStore';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('sa_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ id: string; email: string; name?: string; role: string; organizationId?: string; organizationName?: string; organizationType?: string }>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch {
      localStorage.removeItem('sa_access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post<{
        accessToken: string;
        user: User;
      }>('/auth/login', { email, password });

      if (res.data?.accessToken) {
        localStorage.setItem('sa_access_token', res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      }

      return { success: false, error: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('sa_access_token');
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}