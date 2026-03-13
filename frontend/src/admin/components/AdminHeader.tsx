import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { GlobalSearchResult } from '../types';
import { Bell, ChevronRight, CreditCard, FileText, LayoutDashboard, Search, ShieldAlert, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarTrigger } from '@/components/ui/sidebar';

type AlertSummary = {
  failedPayments: number;
  takenDownInvites: number;
  suspendedAccounts: number;
};

type SearchEntry = {
  id: string;
  label: string;
  meta: string;
  description: string;
  path: string;
  icon: React.ReactNode;
};

const AdminHeader: React.FC<{ breadcrumbs?: { label: string; to?: string }[] }> = ({ breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertSummary>({ failedPayments: 0, takenDownInvites: 0, suspendedAccounts: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    adminApi.getPlatformAlerts().then((response) => {
      setAlerts({
        failedPayments: response.failedTransactionsCount ?? 0,
        takenDownInvites: response.takenDownInvitesCount ?? 0,
        suspendedAccounts: response.suspendedUsersCount ?? 0,
      });
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setResultsOpen(false);
      setActiveIndex(0);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const response = await adminApi.globalSearch(query.trim());
        setResults(response);
        setResultsOpen(true);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setResultsOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const alertCount = alerts.failedPayments + alerts.takenDownInvites + alerts.suspendedAccounts;

  const groupedResults = useMemo(() => {
    if (!results) return [] as { heading: string; items: SearchEntry[] }[];

    return [
      {
        heading: 'Customers',
        items: results.customers.map((customer) => ({
          id: customer.id,
          label: customer.name,
          meta: customer.email,
          description: 'Customer profile',
          path: `/admin/customers/${customer.id}`,
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
        })),
      },
      {
        heading: 'Invites',
        items: results.invites.map((invite) => ({
          id: invite.id,
          label: invite.eventName || invite.slug,
          meta: `/${invite.slug}`,
          description: invite.customerName,
          path: `/admin/invites/${invite.id}`,
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        })),
      },
      {
        heading: 'Transactions',
        items: results.transactions.map((transaction) => ({
          id: transaction.id,
          label: transaction.customerName,
          meta: transaction.status,
          description: transaction.id,
          path: '/admin/transactions',
          icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
        })),
      },
    ].filter((group) => group.items.length > 0);
  }, [results]);

  const flatResults = useMemo(() => groupedResults.flatMap((group) => group.items), [groupedResults]);

  useEffect(() => {
    setActiveIndex((previous) => Math.min(previous, Math.max(flatResults.length - 1, 0)));
  }, [flatResults.length]);

  const jump = (path: string) => {
    setResultsOpen(false);
    setQuery('');
    navigate(path);
  };

  const alertItems = [
    {
      key: 'failed',
      label: 'Failed payments',
      count: alerts.failedPayments,
      detail: 'Review payment issues and unlock requests.',
      path: '/admin/transactions?view=failed',
    },
    {
      key: 'taken-down',
      label: 'Taken-down invites',
      count: alerts.takenDownInvites,
      detail: 'Inspect invite takedowns and republish when appropriate.',
      path: '/admin/invites?view=taken-down',
    },
    {
      key: 'suspended',
      label: 'Suspended accounts',
      count: alerts.suspendedAccounts,
      detail: 'Audit customer accounts that were suspended.',
      path: '/admin/customers?view=suspended',
    },
  ];

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flatResults.length) {
      if (event.key === 'Escape') {
        setResultsOpen(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setResultsOpen(true);
      setActiveIndex((previous) => (previous + 1) % flatResults.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setResultsOpen(true);
      setActiveIndex((previous) => (previous - 1 + flatResults.length) % flatResults.length);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      jump(flatResults[activeIndex].path);
    }

    if (event.key === 'Escape') {
      setResultsOpen(false);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-3 md:px-4 shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="shrink-0" />
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={`${breadcrumb.label}-${index}`}>
              {index === 0 && <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />}
              {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mx-0.5" />}
              {breadcrumb.to ? (
                <button
                  onClick={() => navigate(breadcrumb.to!)}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {breadcrumb.label}
                </button>
              ) : (
                <span className="bg-muted text-foreground font-medium text-xs px-2 py-0.5 rounded-full truncate">
                  {breadcrumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-9 w-9" title="Platform alerts">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {alertCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Platform alerts</p>
                <p className="text-xs text-muted-foreground">Jump into the queues that need attention.</p>
              </div>
              <Badge variant={alertCount > 0 ? 'destructive' : 'secondary'}>
                {alertCount > 0 ? `${alertCount} open` : 'All clear'}
              </Badge>
            </div>

            <div className="space-y-2">
              {alertItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className={`h-4 w-4 mt-0.5 ${item.count > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                      </div>
                    </div>
                    <Badge variant={item.count > 0 ? 'destructive' : 'secondary'}>{item.count}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="relative w-56 md:w-80" ref={wrapperRef}>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => results && setResultsOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search admin data... Ctrl K"
            className="pl-9 h-9 text-sm"
          />

          {resultsOpen && (
            <div className="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {loadingSearch ? (
                <p className="p-3 text-sm text-muted-foreground">Searching...</p>
              ) : flatResults.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No matches found.</p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {groupedResults.map((group) => (
                    <div key={group.heading}>
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.heading}</p>
                        <Badge variant="secondary">{group.items.length}</Badge>
                      </div>
                      {group.items.map((item) => {
                        const absoluteIndex = flatResults.findIndex((entry) => entry.id === item.id);
                        return (
                          <button
                            key={`${group.heading}-${item.id}`}
                            onClick={() => jump(item.path)}
                            className={`w-full px-3 py-3 text-left flex items-start gap-3 transition-colors ${
                              absoluteIndex === activeIndex ? 'bg-muted' : 'hover:bg-muted/40'
                            }`}
                          >
                            <div className="mt-0.5">{item.icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                                <Badge variant="outline" className="text-[10px] uppercase">{item.meta}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-1">{item.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
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
