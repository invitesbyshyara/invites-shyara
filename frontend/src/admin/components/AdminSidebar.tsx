import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  LayoutDashboard, Users, FileText, Palette, CreditCard, FolderTree,
  Tag, Megaphone, Settings, LogOut,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem { label: string; to: string; icon: React.ElementType; permission?: string }
interface NavSection { title: string; items: NavItem[] }

const sections: NavSection[] = [
  { title: '', items: [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  ]},
  { title: 'Management', items: [
    { label: 'Customers', to: '/admin/customers', icon: Users },
    { label: 'Invites', to: '/admin/invites', icon: FileText },
    { label: 'Templates', to: '/admin/templates', icon: Palette, permission: 'manage_templates' },
  ]},
  { title: 'Finance', items: [
    { label: 'Transactions', to: '/admin/transactions', icon: CreditCard },
  ]},
  { title: 'Configuration', items: [
    { label: 'Categories', to: '/admin/categories', icon: FolderTree, permission: 'manage_categories' },
    { label: 'Promo Codes', to: '/admin/promo-codes', icon: Tag, permission: 'manage_promo_codes' },
    { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'manage_settings' },
  ]},
];

const AdminSidebar: React.FC = () => {
  const { user, logout, hasPermission } = useAdminAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="admin-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        {collapsed ? (
          <span className="text-base font-bold text-sidebar-foreground text-center">S</span>
        ) : (
          <>
            <h1 className="text-base font-bold font-body text-sidebar-foreground">Shyara Admin</h1>
            <p className="text-xs" style={{ color: 'hsl(220 10% 55%)' }}>Internal Portal</p>
          </>
        )}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {sections.map((section, si) => {
          const visibleItems = section.items.filter(item =>
            !item.permission || hasPermission(item.permission as any)
          );
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={si}>
              {section.title && (
                <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(220 10% 45%)' }}>
                  {section.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map(item => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.to)}
                        tooltip={item.label}
                      >
                        <NavLink to={item.to} end={item.to === '/admin'}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'hsl(220 15% 20%)', color: 'hsl(0 0% 80%)' }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-sidebar-foreground">{user?.name}</p>
              <StatusBadge status={user?.role || 'admin'} className="mt-0.5" />
            </div>
          </div>
        )}
        <SidebarMenuButton onClick={logout} tooltip="Sign out" className="text-xs" style={{ color: 'hsl(220 10% 55%)' }}>
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AdminSidebar;
