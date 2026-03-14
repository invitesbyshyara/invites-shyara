import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AdminUser } from '../types';
import { adminApi, hasAdminSessionCookie } from '../services/api';

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<
    | { requiresMfa: true; challengeId: string; admin: AdminUser }
    | { requiresMfaSetup: true; challengeId: string; admin: AdminUser }
    | { admin: AdminUser }
  >;
  logout: () => Promise<void>;
  hasPermission: (action: AdminPermission) => boolean;
  startImpersonation: (customerId: string, customerName: string) => void;
  refreshUser: () => Promise<AdminUser | null>;
  setUser: (user: AdminUser | null) => void;
}

type AdminPermission =
  | 'manage_templates'
  | 'manage_pricing'
  | 'manage_promo_codes'
  | 'manage_settings'
  | 'manage_categories'
  | 'suspend_customer'
  | 'delete_customer'
  | 'refund'
  | 'manual_unlock'
  | 'takedown_invite'
  | 'send_announcement';

const SUPPORT_BLOCKED: AdminPermission[] = [
  'manage_templates', 'manage_pricing', 'manage_promo_codes', 'manage_settings',
  'suspend_customer', 'delete_customer', 'refund', 'manual_unlock', 'takedown_invite',
];

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => hasAdminSessionCookie());

  useEffect(() => {
    if (!hasAdminSessionCookie()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const restore = async () => {
      setIsLoading(true);
      try {
        const current = await adminApi.me();
        if (isMounted) {
          setUser(current);
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
      const result = await adminApi.login(email, password);
      if ('admin' in result && !('requiresMfa' in result) && !('requiresMfaSetup' in result)) {
        setUser(result.admin);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    return adminApi.logout().finally(() => {
      setUser(null);
    });
  }, []);

  const hasPermission = useCallback((action: AdminPermission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return !SUPPORT_BLOCKED.includes(action);
  }, [user]);

  const startImpersonation = useCallback((customerId: string, customerName: string) => {
    const data = JSON.stringify({ customerId, customerName });
    // Open customer site in new tab — the banner component reads this
    const w = window.open('/', '_blank');
    if (w) {
      // We need to set sessionStorage in the NEW window context
      // Since same origin, we can do it after a short delay
      setTimeout(() => {
        try { w.sessionStorage.setItem('shyara_admin_impersonate', data); w.location.reload(); } catch {}
      }, 500);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!hasAdminSessionCookie()) {
      setUser(null);
      return null;
    }

    const current = await adminApi.me();
    setUser(current);
    return current;
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, startImpersonation, refreshUser, setUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
