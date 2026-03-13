import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, CreditCard, DollarSign, FileText, Megaphone, Palette, Plus, ShieldAlert, UserPlus, Users } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from '../components/AdminLayout';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../services/api';
import { AdminCustomer, AdminTemplate, AdminTransaction, CURRENCY_SYMBOLS, DashboardStats } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardAlerts = {
  failedPayments: number;
  takenDownInvites: number;
  suspendedAccounts: number;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [recentSignups, setRecentSignups] = useState<AdminCustomer[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<AdminTransaction[]>([]);
  const [topTemplates, setTopTemplates] = useState<AdminTemplate[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlerts>({ failedPayments: 0, takenDownInvites: 0, suspendedAccounts: 0 });
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getOverview(),
      adminApi.getRevenueChart(chartPeriod),
      adminApi.getRecentSignups(),
      adminApi.getRecentTransactions(),
      adminApi.getTopTemplates(),
      adminApi.getPlatformAlerts(),
      adminApi.getSettings(),
    ]).then(([overview, revenueChart, signups, transactions, templates, alertSummary, settings]) => {
      setStats(overview);
      setChartData(revenueChart.map((point) => ({ date: point.date, revenue: point.amount })));
      setRecentSignups(signups);
      setRecentTransactions(transactions);
      setTopTemplates(templates);
      setAlerts({
        failedPayments: alertSummary.failedTransactionsCount ?? 0,
        takenDownInvites: alertSummary.takenDownInvitesCount ?? 0,
        suspendedAccounts: alertSummary.suspendedUsersCount ?? 0,
      });
      setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? '$');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    adminApi.getRevenueChart(chartPeriod).then((data) => {
      setChartData(data.map((point) => ({ date: point.date, revenue: point.amount })));
    });
  }, [chartPeriod]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, entry) => sum + entry.revenue, 0),
    [chartData]
  );

  const formatAmount = (amountInCents: number) => `${currencySymbol}${(amountInCents / 100).toFixed(2)}`;

  const alertCards = [
    {
      key: 'failed',
      title: 'Failed payments',
      count: alerts.failedPayments,
      detail: 'Retry issues, confirm proof, or unlock a purchased template manually.',
      path: '/admin/transactions?view=failed',
      buttonLabel: 'Review failed payments',
    },
    {
      key: 'taken-down',
      title: 'Taken-down invites',
      count: alerts.takenDownInvites,
      detail: 'Inspect takedowns and republish valid invites quickly.',
      path: '/admin/invites?view=taken-down',
      buttonLabel: 'Open taken-down invites',
    },
    {
      key: 'suspended',
      title: 'Suspended accounts',
      count: alerts.suspendedAccounts,
      detail: 'Review affected customers and unblock the valid accounts.',
      path: '/admin/customers?view=suspended',
      buttonLabel: 'Open suspended customers',
    },
  ];

  const operationalViews = [
    { label: 'Failed Payments', path: '/admin/transactions?view=failed', icon: <CreditCard className="h-4 w-4" /> },
    { label: 'Taken-Down Invites', path: '/admin/invites?view=taken-down', icon: <ShieldAlert className="h-4 w-4" /> },
    { label: 'High-Value Customers', path: '/admin/customers?view=vip', icon: <Users className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <AdminLayout breadcrumbs={[{ label: 'Overview' }]}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout breadcrumbs={[{ label: 'Overview' }]}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatsCard label="Total Users" value={stats!.totalUsers} change={stats!.totalUsersChange} icon={<Users className="h-4 w-4" />} accentColor="hsl(217 91% 60%)" />
        <StatsCard label="Active Invites" value={stats!.activeInvites} change={stats!.activeInvitesChange} icon={<FileText className="h-4 w-4" />} accentColor="hsl(262 83% 58%)" />
        <StatsCard label="Revenue This Month" value={(stats!.todayRevenue / 100).toFixed(2)} change={stats!.todayRevenueChange} icon={<DollarSign className="h-4 w-4" />} prefix={currencySymbol} accentColor="hsl(142 71% 45%)" />
        <StatsCard label="New Signups This Month" value={stats!.newSignupsToday} change={stats!.newSignupsTodayChange} icon={<UserPlus className="h-4 w-4" />} accentColor="hsl(38 92% 50%)" />
        <StatsCard label="Templates" value={stats!.totalTemplates} change={stats!.totalTemplatesChange} icon={<Palette className="h-4 w-4" />} accentColor="hsl(330 81% 60%)" />
        <StatsCard label="Total RSVPs" value={stats!.totalRsvps} change={stats!.totalRsvpsChange} icon={<FileText className="h-4 w-4" />} accentColor="hsl(188 78% 45%)" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Quick actions</h3>
            <p className="text-xs text-muted-foreground mt-1">Use direct routes for the workflows your team touches every day.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/customers/new')} className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Add Customer
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/templates/new')} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Template
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/transactions?view=failed')} className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Failed Payments
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/announcements')} className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" /> Send Announcement
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {operationalViews.map((view) => (
            <Button key={view.label} size="sm" variant="secondary" className="gap-1.5" onClick={() => navigate(view.path)}>
              {view.icon}
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 border border-border rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Revenue trend</h3>
              <p className="text-2xl font-bold text-card-foreground">{formatAmount(totalRevenue)}</p>
            </div>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <Button key={period} variant={chartPeriod === period ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setChartPeriod(period)}>
                  {period}
                </Button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {alertCards.map((alert) => (
            <div key={alert.key} className="border border-border rounded-2xl bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-4 w-4 mt-1 ${alert.count > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">{alert.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
                  </div>
                </div>
                <Badge variant={alert.count > 0 ? 'destructive' : 'secondary'}>{alert.count}</Badge>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-2xl font-bold text-card-foreground">{alert.count}</p>
                <Button size="sm" variant="outline" onClick={() => navigate(alert.path)}>
                  {alert.buttonLabel}
                </Button>
              </div>
            </div>
          ))}
          {alertCards.every((alert) => alert.count === 0) && (
            <div className="border border-border rounded-2xl bg-card p-4">
              <p className="text-sm font-semibold text-card-foreground">All clear</p>
              <p className="text-xs text-muted-foreground mt-1">No platform alerts need attention right now.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="border border-border rounded-2xl bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Recent signups</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">Email</th>
                  <th className="text-left py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/customers/${customer.id}`)}>
                    <td className="py-2 text-foreground">{customer.name}</td>
                    <td className="py-2 text-muted-foreground">{customer.email}</td>
                    <td className="py-2 text-muted-foreground">{format(new Date(customer.joinDate), 'dd MMM')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-border rounded-2xl bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Recent transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Template</th>
                  <th className="text-left py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-foreground">{transaction.customerName}</td>
                    <td className="py-2 text-muted-foreground">{transaction.templateName}</td>
                    <td className="py-2 text-foreground">{formatAmount(transaction.amount)}</td>
                    <td className="py-2"><StatusBadge status={transaction.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Top templates by purchases</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {topTemplates.map((template, index) => (
            <div key={template.slug} className="flex items-center gap-3 p-3 rounded-md border border-border">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">#{index + 1}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.purchaseCount} purchases</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
