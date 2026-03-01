import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { GlobalSearchResult } from '../types';
import { Search, Users, FileText, CreditCard, Bell, ChevronRight, LayoutDashboard, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const AdminHeader: React.FC<{ breadcrumbs?: { label: string; to?: string }[] }> = ({ breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    adminApi.getPlatformAlerts().then(a => {
      setAlertCount((a.failedPayments24h || 0) + (a.suspendedAccounts || 0));
    });
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const r = await adminApi.globalSearch(query);
      setResults(r);
      setOpen(true);
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const jump = (path: string) => { setOpen(false); setQuery(''); navigate(path); };

  const hasResults = results && (results.customers.length + results.invites.length + results.transactions.length) > 0;

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3 md:px-4 shrink-0 gap-2">
      {/* Left: Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="shrink-0" />
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i === 0 && (
                <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
              )}
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mx-0.5" />}
              {b.to ? (
                <button onClick={() => navigate(b.to!)} className="text-muted-foreground hover:text-foreground transition-colors truncate">{b.label}</button>
              ) : (
                <span className="bg-muted text-foreground font-medium text-xs px-2 py-0.5 rounded-full truncate">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search + Bell */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          onClick={() => navigate('/admin')}
          className="relative p-1.5 rounded-md hover:bg-muted transition-colors"
          title="Platform alerts"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>

        {/* Global Search */}
        <div className="relative w-48 md:w-72" ref={ref}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results && setOpen(true)}
            placeholder="Search... ⌘K"
            className="pl-9 h-9 text-sm"
          />
          {open && results && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {!hasResults && <p className="p-3 text-xs text-muted-foreground text-center">No results found</p>}
              {results.customers.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground bg-muted/50 flex items-center gap-1"><Users className="h-3 w-3" /> Customers</p>
                  {results.customers.map(c => (
                    <button key={c.id} className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex justify-between" onClick={() => jump(`/admin/customers/${c.id}`)}>
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.invites.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground bg-muted/50 flex items-center gap-1"><FileText className="h-3 w-3" /> Invites</p>
                  {results.invites.map(i => (
                    <button key={i.id} className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex justify-between" onClick={() => jump(`/admin/invites/${i.id}`)}>
                      <span className="font-medium text-foreground">{i.eventName}</span>
                      <span className="text-xs text-muted-foreground">/{i.slug}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.transactions.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground bg-muted/50 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Transactions</p>
                  {results.transactions.map(t => (
                    <button key={t.id} className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex justify-between" onClick={() => jump('/admin/transactions')}>
                      <span className="font-medium text-foreground">{t.customerName}</span>
                      <span className="text-xs text-muted-foreground">{t.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
