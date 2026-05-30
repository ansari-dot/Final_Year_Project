import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authApi } from '../lib/api/auth';
import { tokenStore, userStore } from '../lib/api/client';
import type { ApiUser } from '../lib/api/types';

interface AuthContextValue {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<ApiUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<ApiUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = userStore.get<ApiUser>();
  const [user, setUser] = useState<ApiUser | null>(cached);
  const [isLoading, setIsLoading] = useState<boolean>(!!tokenStore.access);

  const refresh = useCallback(async (): Promise<ApiUser | null> => {
    if (!tokenStore.access) {
      setUser(null);
      return null;
    }
    try {
      const fresh = await authApi.me();
      if (fresh.role !== 'admin') {
        tokenStore.clear();
        setUser(null);
        return null;
      }
      userStore.set(fresh);
      setUser(fresh);
      return fresh;
    } catch {
      tokenStore.clear();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (tokenStore.access) {
      refresh().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string): Promise<ApiUser> => {
    const u = await authApi.login(email, password);
    if (u.role !== 'admin') {
      tokenStore.clear();
      throw new Error('This account does not have admin access.');
    }
    setUser(u);
    return u;
  };

  const signOut = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!tokenStore.access,
        isLoading,
        signIn,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
