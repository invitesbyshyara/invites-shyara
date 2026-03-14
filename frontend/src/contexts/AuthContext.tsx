import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<
    | { requiresMfa: true; challengeId: string; user: Pick<User, 'id' | 'name' | 'email' | 'emailVerified' | 'mfaEnabled'> }
    | { user: User }
  >;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<
    | { requiresMfa: true; challengeId: string; user: Pick<User, 'id' | 'name' | 'email' | 'emailVerified' | 'mfaEnabled'> }
    | { user: User }
  >;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  pendingTemplateSlug: string | null;
  setPendingTemplateSlug: (slug: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => api.hasStoredSession());
  const [pendingTemplateSlug, setPendingTemplateSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!api.hasStoredSession()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const restore = async () => {
      setIsLoading(true);
      try {
        const profile = await api.getMe();
        if (isMounted) {
          setUser(profile);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restore();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.login(email, password);
      if (!('requiresMfa' in result && result.requiresMfa)) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await api.register(name, email, password);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    try {
      const result = await api.googleAuth(accessToken);
      if (!('requiresMfa' in result && result.requiresMfa)) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setPendingTemplateSlug(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!api.hasStoredSession()) {
      setUser(null);
      return null;
    }

    const profile = await api.getMe();
    setUser(profile);
    return profile;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        setUser,
        pendingTemplateSlug,
        setPendingTemplateSlug,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
