import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../services/api';
import { CURRENCY_SYMBOLS, DashboardStats, AdminCustomer, AdminTransaction, AdminTemplate } from '../types';
import { Users, FileText, DollarSign, UserPlus, Palette, MessageSquare, AlertTriangle, Plus, CreditCard, Megaphone } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [recentSignups, setRecentSignups] = useState<AdminCustomer[]>([]);
  const [recentTxns, setRecentTxns] = useState<AdminTransaction[]>([]);
  const [topTemplates, setTopTemplates] = useState<AdminTemplate[]>([]);
  const [alerts, setAlerts] = useState<{ failedPayments24h: number; takenDownInvites: number; suspendedAccounts: number } | null>(null);
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
    ]).then(([s, c, rs, rt, tt, al, settings]) => {
      setStats(s);
      setChartData(c.map(point => ({ date: point.date, revenue: point.amount })));
      setRecentSignups(rs);
      setRecentTxns(rt);
      setTopTemplates(tt);
      setAlerts({
        failedPayments24h: al.failedTransactionsCount,
        takenDownInvites: al.takenDownInvitesCount,
        suspendedAccounts: al.suspendedUsersCount,
      });
      setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? '$');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    adminApi.getRevenueChart(chartPeriod).then(data => {
      setChartData(data.map(point => ({ date: point.date, revenue: point.amount })));
    });
  }, [chartPeriod]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const formatAmount = (amountInCents: number, transactionCurrency?: string) => {
    const symbol = transactionCurrency === 'INR' ? '₹' : currencySymbol;
    return `${symbol}${(amountInCents / 100).toFixed(2)}`;
  };

  if (loading) return (
    <AdminLayout breadcrumbs={[{ label: 'Overview' }]}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </AdminLayout>
  );

  return (
    <AdminLayout breadcrumbs={[{ label: 'Overview' }]}>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatsCard label="Total Users" value={stats!.totalUsers} change={stats!.totalUsersChange} icon={<Users className="h-4 w-4" />} accentColor="hsl(217 91% 60%)" />
        <StatsCard label="Active Invites" value={stats!.activeInvites} change={stats!.activeInvitesChange} icon={<FileText className="h-4 w-4" />} accentColor="hsl(262 83% 58%)" />
        <StatsCard
          label="Today's Revenue"
          value={(stats!.todayRevenue / 100).toFixed(2)}
          change={stats!.todayRevenueChange}
          icon={<DollarSign className="h-4 w-4" />}
          prefix={currencySymbol}
          accentColor="hsl(142 71% 45%)"
        />
        <StatsCard label="New Signups" value={stats!.newSignupsToday} change={stats!.newSignupsTodayChange} icon={<UserPlus className="h-4 w-4" />} accentColor="hsl(38 92% 50%)" />
        <StatsCard label="Templates" value={stats!.totalTemplates} change={stats!.totalTemplatesChange} icon={<Palette className="h-4 w-4" />} accentColor="hsl(330 81% 60%)" />
        <StatsCard label="Total RSVPs" value={stats!.totalRsvps} change={stats!.totalRsvpsChange} icon={<MessageSquare className="h-4 w-4" />} accentColor="hsl(188 78% 45%)" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/customers/add')} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Add Customer
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/templates/add')} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Template
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/transactions')} className="gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Failed Payments
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/announcements')} className="gap-1.5">
          <Megaphone className="h-3.5 w-3.5" /> Send Announcement
        </Button>
      </div>

      {/* Revenue Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 border border-border rounded-lg bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Revenue</h3>
              <p className="text-2xl font-bold text-card-foreground">{formatAmount(totalRevenue)}</p>
            </div>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as const).map(p => (
                <Button key={p} variant={chartPeriod === p ? 'default' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setChartPeriod(p)}>{p}</Button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Alerts */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">⚠️ Alerts</h3>
          <div className="space-y-3">
            {alerts && alerts.failedPayments24h > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-foreground">{alerts.failedPayments24h} failed payment{alerts.failedPayments24h !== 1 ? 's' : ''} in 24h</span>
              </div>
            )}
            {alerts && alerts.takenDownInvites > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-foreground">{alerts.takenDownInvites} invite{alerts.takenDownInvites !== 1 ? 's' : ''} taken down</span>
              </div>
            )}
            {alerts && alerts.suspendedAccounts > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-foreground">{alerts.suspendedAccounts} suspended account{alerts.suspendedAccounts !== 1 ? 's' : ''}</span>
              </div>
            )}
            {alerts && alerts.failedPayments24h === 0 && alerts.takenDownInvites === 0 && alerts.suspendedAccounts === 0 && (
              <p className="text-sm text-muted-foreground">All clear — no alerts at this time.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Recent Signups</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Name</th><th className="text-left py-2 font-medium">Email</th><th className="text-left py-2 font-medium">Date</th>
              </tr></thead>
              <tbody>
                {recentSignups.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/customers/${c.id}`)}>
                    <td className="py-2 text-foreground">{c.name}</td>
                    <td className="py-2 text-muted-foreground">{c.email}</td>
                    <td className="py-2 text-muted-foreground">{format(new Date(c.joinDate), 'dd MMM')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Customer</th><th className="text-left py-2 font-medium">Template</th><th className="text-left py-2 font-medium">Amount</th><th className="text-left py-2 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {recentTxns.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-foreground">{t.customerName}</td>
                    <td className="py-2 text-muted-foreground">{t.templateName}</td>
                    <td className="py-2 text-foreground">{formatAmount(t.amount, t.currency)}</td>
                    <td className="py-2"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Templates */}
      <div className="border border-border rounded-lg bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Top Templates (by purchases)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {topTemplates.map((t, i) => (
            <div key={t.slug} className="flex items-center gap-3 p-3 rounded-md border border-border">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">#{i + 1}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.purchaseCount} purchases</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
