import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import InternalNotes from '../components/InternalNotes';
import ConfirmModal from '../components/ConfirmModal';
import { adminApi } from '../services/api';
import { AdminCustomer, AdminInvite, AdminTransaction, ActivityLogEntry, CURRENCY_SYMBOLS } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Ban, CheckCircle, KeyRound, Mail, Eye, FileText, CreditCard, Clock, MessageSquare, MoreHorizontal, Copy, DollarSign } from 'lucide-react';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasPermission, startImpersonation } = useAdminAuth();
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);
  const [suspendOpen, setSuspendOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminApi.getCustomer(id),
      adminApi.getActivityLog(id),
      adminApi.getSettings(),
    ]).then(([customerData, log, settings]) => {
      setCustomer(customerData.customer);
      setInvites(customerData.invites);
      setTransactions(customerData.transactions);
      setActivityLog(log);
      setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? '$');
      setLoading(false);
    }).catch(() => { toast({ title: 'Customer not found', variant: 'destructive' }); navigate('/admin/customers'); });
  }, [id]);

  const handleSuspendToggle = async () => {
    if (!customer || !id) return;
    try {
      if (customer.status === 'active') {
        await adminApi.suspendCustomer(id);
        setCustomer({ ...customer, status: 'suspended' });
        toast({ title: 'Account suspended' });
      } else {
        await adminApi.unsuspendCustomer(id);
        setCustomer({ ...customer, status: 'active' });
        toast({ title: 'Account reactivated' });
      }
      setSuspendOpen(false);
      adminApi.getActivityLog(id).then(setActivityLog);
    } catch { toast({ title: 'Action failed', variant: 'destructive' }); }
  };

  const copyEmail = () => {
    if (customer) {
      navigator.clipboard.writeText(customer.email);
      toast({ title: 'Email copied' });
    }
  };

  const fmt = (cents: number, currency?: string) => {
    const symbol = currency === 'INR' ? '₹' : currencySymbol;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  if (loading) return (
    <AdminLayout breadcrumbs={[{ label: 'Customers', to: '/admin/customers' }, { label: 'Loading...' }]}>
      <Skeleton className="h-32 rounded-lg mb-4" /><Skeleton className="h-64 rounded-lg" />
    </AdminLayout>
  );

  if (!customer) return null;

  return (
    <AdminLayout breadcrumbs={[{ label: 'Customers', to: '/admin/customers' }, { label: customer.name }]}>
      {/* Profile Header */}
      <div className="border border-border rounded-lg bg-card p-5 mb-4">
        {/* Top row: avatar + name + badges */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-semibold text-card-foreground">{customer.name}</h2>
              <StatusBadge status={customer.status} />
              <StatusBadge status={customer.plan} />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{customer.email}</span>
              <button onClick={copyEmail} className="p-0.5 rounded hover:bg-muted transition-colors" title="Copy email">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <span className="mx-1">·</span>
              <span>{customer.phone}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Joined {format(new Date(customer.joinDate), 'dd MMM yyyy')} · Last active {format(new Date(customer.lastActive), 'dd MMM yyyy, HH:mm')}</p>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <MoreHorizontal className="h-4 w-4 mr-1" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => toast({ title: 'Password reset link sent (mocked)' })}>
                <KeyRound className="h-4 w-4 mr-2" /> Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: 'Email sent (mocked)' })}>
                <Mail className="h-4 w-4 mr-2" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startImpersonation(customer.id, customer.name)}>
                <Eye className="h-4 w-4 mr-2" /> View As Customer
              </DropdownMenuItem>
              {hasPermission('suspend_customer') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSuspendOpen(true)}
                    className={customer.status === 'active' ? 'text-destructive focus:text-destructive' : ''}
                  >
                    {customer.status === 'active' ? <><Ban className="h-4 w-4 mr-2" /> Suspend Account</> : <><CheckCircle className="h-4 w-4 mr-2" /> Reactivate</>}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom row: metric pills */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{fmt(customer.totalSpent)}</span>
            <span className="text-muted-foreground text-xs">spent</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{customer.totalInvites}</span>
            <span className="text-muted-foreground text-xs">invite{customer.totalInvites !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invites">
        <TabsList>
          <TabsTrigger value="invites"><FileText className="h-3.5 w-3.5 mr-1" /> Invites ({invites.length})</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="h-3.5 w-3.5 mr-1" /> Payments ({transactions.length})</TabsTrigger>
          <TabsTrigger value="activity"><Clock className="h-3.5 w-3.5 mr-1" /> Activity Log</TabsTrigger>
          <TabsTrigger value="notes"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="invites" className="mt-4">
          {invites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No invites created</div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2">Event</th><th className="text-left px-3 py-2">Template</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Slug</th><th className="text-left px-3 py-2">RSVPs</th><th className="text-left px-3 py-2">Created</th>
                </tr></thead>
                <tbody>{invites.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/admin/invites/${inv.id}`)}>
                    <td className="px-3 py-2 text-foreground font-medium">{inv.eventName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{inv.templateName}</td>
                    <td className="px-3 py-2"><StatusBadge status={inv.status} /></td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs">/{inv.slug}</td>
                    <td className="px-3 py-2 text-foreground">{inv.rsvpCount}</td>
                    <td className="px-3 py-2 text-muted-foreground">{format(new Date(inv.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No transactions</div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2">Template</th><th className="text-left px-3 py-2">Amount</th><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Status</th><th className="px-3 py-2"></th>
                </tr></thead>
                <tbody>{transactions.map(txn => (
                  <tr key={txn.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-foreground">{txn.templateName}</td>
                    <td className="px-3 py-2 text-foreground">{fmt(txn.amount, txn.currency)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{format(new Date(txn.date), 'dd MMM yyyy')}</td>
                    <td className="px-3 py-2"><StatusBadge status={txn.status} /></td>
                    <td className="px-3 py-2">{txn.status === 'success' && hasPermission('refund') && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate('/admin/transactions')}>Refund</Button>
                    )}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {activityLog.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No activity recorded</div>
          ) : (
            <div className="space-y-2">
              {activityLog.map(entry => (
                <div key={entry.id} className={`flex items-start gap-3 p-3 rounded-md border ${entry.isAdminAction ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${entry.isAdminAction ? 'bg-destructive' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground">{entry.action}</p>
                      {entry.isAdminAction && <StatusBadge status="admin" />}
                    </div>
                    {entry.adminEmail && <p className="text-xs text-muted-foreground">by {entry.adminEmail}</p>}
                    {entry.details && <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <InternalNotes entityId={customer.id} entityType="customer" />
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={customer.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
        description={customer.status === 'active'
          ? `Are you sure you want to suspend ${customer.name}'s account? They will lose access to their dashboard and live invites may be affected.`
          : `Reactivate ${customer.name}'s account? They will regain full access.`}
        confirmLabel={customer.status === 'active' ? 'Suspend' : 'Reactivate'}
        destructive={customer.status === 'active'}
        onConfirm={handleSuspendToggle}
      />
    </AdminLayout>
  );
};

export default CustomerDetail;
