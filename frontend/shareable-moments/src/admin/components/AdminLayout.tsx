import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
  requiredPermission?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, breadcrumbs, requiredPermission }) => {
  const { user, hasPermission } = useAdminAuth();

  if (!user) return <Navigate to="/admin/login" replace />;

  const blocked = requiredPermission && !hasPermission(requiredPermission as any);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader breadcrumbs={breadcrumbs} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {blocked ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-6V7a4 4 0 00-8 0v4H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2z" /></svg>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Access Restricted</h2>
                <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
              </div>
            ) : children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
