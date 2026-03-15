import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CreditCard } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import DataTable, { Column, DataTableFilter } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminApi } from '../services/api';
import { AdminTransaction, CURRENCY_SYMBOLS } from '../types';
import AdminLayout from '../components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getPackageDisplayName } from '@/lib/packageCatalog';

const viewLabels: Record<string, string> = {
  all: 'All transaction activity.',
  renewals: 'Renewal payments that restore expired invites.',
  addons: 'Package B event-management add-on purchases.',
  failed: 'Failed payments that need operator review.',
  refunded: 'Transactions refunded by the support team.',
};

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState<AdminTransaction | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const currentView = searchParams.get('view') ?? 'all';

  useEffect(() => {
    Promise.all([adminApi.getTransactions(), adminApi.getSettings()])
      .then(([transactionResponse, settings]) => {
        setTransactions(transactionResponse.transactions);
        setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? '$');
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (cents: number, currency?: string) => {
    const symbol = CURRENCY_SYMBOLS[(currency?.toUpperCase() as keyof typeof CURRENCY_SYMBOLS) ?? 'USD'] ?? currencySymbol;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const sumByCurrency = (items: AdminTransaction[]) =>
    items.reduce<Record<string, number>>((totals, item) => {
      const currency = (item.currency || 'USD').toUpperCase();
      totals[currency] = (totals[currency] ?? 0) + item.amount;
      return totals;
    }, {});

  const subtractCurrencyTotals = (left: Record<string, number>, right: Record<string, number>) => {
    const currencies = new Set([...Object.keys(left), ...Object.keys(right)]);
    return Array.from(currencies).reduce<Record<string, number>>((totals, currency) => {
      totals[currency] = (left[currency] ?? 0) - (right[currency] ?? 0);
      return totals;
    }, {});
  };

  const formatCurrencyBreakdown = (totals: Record<string, number>) => {
    const entries = Object.entries(totals).filter(([, amount]) => amount !== 0);
    if (entries.length === 0) {
      return fmt(0, 'USD');
    }
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([currency, amount]) => fmt(amount, currency))
      .join(' + ');
  };

  const visibleTransactions = useMemo(() => {
    if (currentView === 'renewals') return transactions.filter((transaction) => transaction.kind === 'renewal');
    if (currentView === 'addons') return transactions.filter((transaction) => transaction.kind === 'event_management_addon');
    if (currentView === 'failed') return transactions.filter((transaction) => transaction.status === 'failed');
    if (currentView === 'refunded') return transactions.filter((transaction) => transaction.status === 'refunded');
    return transactions;
  }, [currentView, transactions]);

  const successTransactions = visibleTransactions.filter((transaction) => transaction.status === 'success');
  const revenueTotals = sumByCurrency(successTransactions);
  const refundTotals = visibleTransactions
    .filter((transaction) => transaction.status === 'refunded')
    .reduce<Record<string, number>>((totals, transaction) => {
      const currency = (transaction.currency || 'USD').toUpperCase();
      totals[currency] = (totals[currency] ?? 0) + (transaction.refundAmount || 0);
      return totals;
    }, {});
  const netTotals = subtractCurrencyTotals(revenueTotals, refundTotals);

  const handleRefund = async () => {
    if (!refundTarget) return;

    const amount = refundType === 'full' ? refundTarget.amount : refundAmount;
    const reason = refundType === 'full'
      ? 'Full refund issued by admin'
      : `Partial refund requested: ${amount} cents`;

    try {
      await adminApi.refundTransaction(refundTarget.id, reason);
      setTransactions((previous) =>
        previous.map((transaction) =>
          transaction.id === refundTarget.id
            ? { ...transaction, status: 'refunded', refundAmount: amount }
            : transaction
        )
      );
      setRefundTarget(null);
      toast({ title: `Refund of ${fmt(amount, refundTarget.currency)} issued` });
    } catch {
      toast({ title: 'Refund failed', variant: 'destructive' });
    }
  };

  const columns: Column<AdminTransaction>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.id}</span>,
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (row) => (
        <button
          className="text-primary hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/admin/customers/${row.customerId}`);
          }}
        >
          {row.customerName}
        </button>
      ),
    },
    {
      key: 'templateName',
      label: 'Template',
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <div className="text-foreground">{row.templateName}</div>
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{getPackageDisplayName(row.packageCode)}</div>
        </div>
      ),
    },
    {
      key: 'kind',
      label: 'Kind',
      sortable: true,
      render: (row) => <span className="text-xs uppercase text-muted-foreground">{row.kind.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'inviteSlug',
      label: 'Invite',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-mono text-xs text-muted-foreground">{row.inviteSlug ? `/${row.inviteSlug}` : '—'}</div>
          {row.inviteValidUntil && (
            <div className="text-xs text-muted-foreground">
              Valid until {format(new Date(row.inviteValidUntil), 'dd MMM yyyy')}
            </div>
          )}
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', sortable: true, render: (row) => fmt(row.amount, row.currency) },
    { key: 'date', label: 'Date', sortable: true, render: (row) => format(new Date(row.date), 'dd MMM yyyy') },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: '',
      hideable: false,
      render: (row) =>
        row.status === 'success' && hasPermission('refund') ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={(event) => {
              event.stopPropagation();
              setRefundTarget(row);
              setRefundType('full');
              setRefundAmount(row.amount);
            }}
          >
            Refund
          </Button>
        ) : null,
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      key: 'kind',
      label: 'Kind',
      options: [
        { label: 'Initial purchase', value: 'initial_purchase' },
        { label: 'Event add-on', value: 'event_management_addon' },
        { label: 'Renewal', value: 'renewal' },
      ],
    },
    {
      key: 'packageCode',
      label: 'Package',
      options: [
        { label: 'Package A', value: 'package_a' },
        { label: 'Package B', value: 'package_b' },
      ],
    },
  ];

  const views = [
    { key: 'all', label: 'All' },
    { key: 'renewals', label: 'Renewals' },
    { key: 'addons', label: 'Add-ons' },
    { key: 'failed', label: 'Failed' },
    { key: 'refunded', label: 'Refunded' },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: 'Transactions' }]}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
        <p className="text-sm text-muted-foreground mt-1">{viewLabels[currentView] ?? viewLabels.all}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="border border-border rounded-2xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Visible revenue</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrencyBreakdown(revenueTotals)}</p>
        </div>
        <div className="border border-border rounded-2xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Visible refunds</p>
          <p className="text-xl font-bold text-orange-500">{formatCurrencyBreakdown(refundTotals)}</p>
        </div>
        <div className="border border-border rounded-2xl p-4 bg-card">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className="text-xl font-bold text-foreground">{formatCurrencyBreakdown(netTotals)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {views.map((view) => (
          <Button
            key={view.key}
            variant={currentView === view.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchParams(view.key === 'all' ? {} : { view: view.key })}
          >
            {view.label}
          </Button>
        ))}
        <Button variant="secondary" size="sm" onClick={() => navigate('/admin/transactions/failed')}>
          Open failed-payments queue
        </Button>
      </div>

      <DataTable
        tableId="transactions"
        columns={columns}
        data={visibleTransactions}
        loading={loading}
        searchPlaceholder="Search by customer or transaction ID..."
        filters={filters}
        getRowId={(row) => row.id}
        bulkActions={[{ label: 'Export CSV', onClick: () => toast({ title: 'CSV exported' }) }]}
        emptyMessage="No transactions found"
        emptyIcon={<CreditCard className="h-6 w-6 text-muted-foreground" />}
      />

      <ConfirmModal
        open={Boolean(refundTarget)}
        onOpenChange={() => setRefundTarget(null)}
        title="Issue Refund"
        description={`Refunding ${refundTarget?.customerName} for ${refundTarget?.templateName}`}
        confirmLabel={`Refund ${refundTarget ? fmt(refundType === 'full' ? refundTarget.amount : refundAmount, refundTarget.currency) : ''}`}
        destructive
        onConfirm={handleRefund}
      >
        <div className="space-y-4 py-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Refund Amount</Label>
            <RadioGroup
              value={refundType}
              onValueChange={(value) => setRefundType(value as 'full' | 'partial')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full" />
                <Label>Full ({refundTarget ? fmt(refundTarget.amount, refundTarget.currency) : ''})</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="partial" />
                <Label>Partial</Label>
              </div>
            </RadioGroup>
            {refundType === 'partial' && (
              <Input
                type="number"
                value={refundAmount}
                onChange={(event) => setRefundAmount(Number(event.target.value))}
                max={refundTarget?.amount}
                className="mt-2 w-32"
              />
            )}
          </div>
        </div>
      </ConfirmModal>
    </AdminLayout>
  );
};

export default Transactions;
