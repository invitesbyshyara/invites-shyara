import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AdminUser, AdminRole } from '../types';
import { adminApi } from '../services/api';

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (action: AdminPermission) => boolean;
  startImpersonation: (customerId: string, customerName: string) => void;
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
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = sessionStorage.getItem('shyara_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const u = await adminApi.login(email, password);
      setUser(u);
      sessionStorage.setItem('shyara_admin_user', JSON.stringify(u));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('shyara_admin_user');
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

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, startImpersonation }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
