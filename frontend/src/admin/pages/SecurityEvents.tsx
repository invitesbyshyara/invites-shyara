import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, ChevronLeft, ChevronRight, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SecurityEventUser {
  id: string;
  name: string;
  email: string;
}

interface SecurityEventAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SecurityEvent {
  id: string;
  userId: string | null;
  adminId: string | null;
  eventType: string;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: SecurityEventUser | null;
  admin: SecurityEventAdmin | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  userId: string;
  eventType: string;
  outcome: string;
  ipAddress: string;
  from: string;
  to: string;
}

const EVENT_TYPES = [
  'register',
  'login',
  'login_failed',
  'logout',
  'password_reset_requested',
  'password_reset_complete',
  'email_verified',
  'admin_login',
  'admin_login_password_verified',
  'admin_mfa_setup_complete',
  'admin_mfa_login_complete',
  'admin_mfa_recovery_rotate',
  'admin_mfa_disable',
  'account_locked',
];

const OUTCOME_LABELS: Record<string, { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary'; className: string }> = {
  success: { label: 'Success', variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-transparent' },
  failed: { label: 'Failed', variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-transparent' },
  setup_required: { label: 'Setup Required', variant: 'secondary', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-transparent' },
  challenge_issued: { label: 'Challenge', variant: 'secondary', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-transparent' },
};

const OutcomeBadge: React.FC<{ outcome: string }> = ({ outcome }) => {
  const config = OUTCOME_LABELS[outcome];
  if (config) {
    return <Badge className={`text-xs font-medium ${config.className}`}>{config.label}</Badge>;
  }
  return <Badge variant="outline" className="text-xs">{outcome}</Badge>;
};

const SecurityEvents: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<Filters>({
    userId: '',
    eventType: '',
    outcome: '',
    ipAddress: '',
    from: '',
    to: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);

  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);

  const fetchEvents = useCallback(async (currentPage: number, currentFilters: Filters) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: 25 };
      if (currentFilters.userId) params.userId = currentFilters.userId;
      if (currentFilters.eventType) params.eventType = currentFilters.eventType;
      if (currentFilters.outcome) params.outcome = currentFilters.outcome;
      if (currentFilters.ipAddress) params.ipAddress = currentFilters.ipAddress;
      if (currentFilters.from) params.from = new Date(currentFilters.from).toISOString();
      if (currentFilters.to) {
        const toDate = new Date(currentFilters.to);
        toDate.setHours(23, 59, 59, 999);
        params.to = toDate.toISOString();
      }
      const result = await adminApi.getSecurityEvents(params as Parameters<typeof adminApi.getSecurityEvents>[0]);
      setEvents(result.events as unknown as SecurityEvent[]);
      setPagination(result.pagination as unknown as Pagination);
    } catch {
      toast({ title: 'Failed to load security events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchEvents(page, appliedFilters);
  }, [fetchEvents, page, appliedFilters]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    const empty: Filters = { userId: '', eventType: '', outcome: '', ipAddress: '', from: '', to: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyFilters();
  };

  // Detect suspicious IPs: 3+ failed events from same IP on current page
  const suspiciousIps = useMemo(() => {
    const ipCounts: Record<string, number> = {};
    for (const ev of events) {
      if (ev.outcome === 'failed' && ev.ipAddress) {
        ipCounts[ev.ipAddress] = (ipCounts[ev.ipAddress] ?? 0) + 1;
      }
    }
    return new Set(Object.entries(ipCounts).filter(([, count]) => count >= 3).map(([ip]) => ip));
  }, [events]);

  const eventLabel = (type: string) =>
    type.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AdminLayout breadcrumbs={[{ label: 'Security Events' }]}>
      <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            Security Events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Authentication activity, login attempts, and security actions across the platform.
          </p>
        </div>
        {pagination && (
          <p className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString()} event{pagination.total !== 1 ? 's' : ''} total
          </p>
        )}
      </div>

      {/* Filter panel */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <Label className="text-xs mb-1 block">Event Type</Label>
            <Select value={filters.eventType} onValueChange={(v) => setFilters((f) => ({ ...f, eventType: v === '__all' ? '' : v }))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All types</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{eventLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Outcome</Label>
            <Select value={filters.outcome} onValueChange={(v) => setFilters((f) => ({ ...f, outcome: v === '__all' ? '' : v }))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All outcomes</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="setup_required">Setup Required</SelectItem>
                <SelectItem value="challenge_issued">Challenge Issued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">IP Address</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. 192.168.1.1"
              value={filters.ipAddress}
              onChange={(e) => setFilters((f) => ({ ...f, ipAddress: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">User ID</Label>
            <Input
              className="h-8 text-xs"
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">From date</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">To date</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" onClick={applyFilters} className="h-7 text-xs px-3">Apply Filters</Button>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters} className="h-7 text-xs px-2 gap-1">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Suspicious IP warning */}
      {suspiciousIps.size > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-medium">Suspicious activity detected</span> — the following IP address{suspiciousIps.size > 1 ? 'es have' : ' has'} 3+ failed events on this page:{' '}
            {[...suspiciousIps].map((ip, i) => (
              <React.Fragment key={ip}>
                {i > 0 && ', '}
                <button
                  className="font-mono font-medium underline underline-offset-2"
                  onClick={() => {
                    setFilters((f) => ({ ...f, ipAddress: ip }));
                    setAppliedFilters((f) => ({ ...f, ipAddress: ip }));
                    setPage(1);
                  }}
                >
                  {ip}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No security events found matching your filters.
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const isSuspicious = event.outcome === 'failed' && event.ipAddress !== null && suspiciousIps.has(event.ipAddress);
                  return (
                    <tr
                      key={event.id}
                      className={isSuspicious ? 'bg-red-50/60 dark:bg-red-950/20' : 'hover:bg-muted/30 transition-colors'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {format(new Date(event.createdAt), 'dd MMM yyyy HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">{eventLabel(event.eventType)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <OutcomeBadge outcome={event.outcome} />
                      </td>
                      <td className="px-4 py-3">
                        {event.user ? (
                          <button
                            className="text-left hover:underline"
                            onClick={() => navigate(`/admin/customers/${event.user!.id}`)}
                          >
                            <p className="text-xs font-medium text-foreground">{event.user.name}</p>
                            <p className="text-xs text-muted-foreground">{event.user.email}</p>
                          </button>
                        ) : event.admin ? (
                          <div>
                            <p className="text-xs font-medium text-foreground">{event.admin.name}</p>
                            <p className="text-xs text-muted-foreground">{event.admin.email} · <span className="capitalize">{event.admin.role}</span></p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {event.ipAddress ? (
                          <button
                            className={`font-mono text-xs ${isSuspicious ? 'text-red-700 dark:text-red-400 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => {
                              setFilters((f) => ({ ...f, ipAddress: event.ipAddress! }));
                              setAppliedFilters((f) => ({ ...f, ipAddress: event.ipAddress! }));
                              setPage(1);
                            }}
                            title="Filter by this IP"
                          >
                            {event.ipAddress}
                            {isSuspicious && <AlertTriangle className="inline ml-1 h-3 w-3" />}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        {event.details ? (
                          <p className="text-xs text-muted-foreground truncate" title={JSON.stringify(event.details)}>
                            {JSON.stringify(event.details)}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SecurityEvents;
