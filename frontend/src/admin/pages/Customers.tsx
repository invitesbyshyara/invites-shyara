import React, { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DataTable, { Column, DataTableFilter } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { adminApi } from '../services/api';
import { AdminCustomer, CURRENCY_SYMBOLS } from '../types';
import AdminLayout from '../components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const viewLabels: Record<string, string> = {
  all: 'All customers',
  new: 'New in the last 30 days',
  vip: 'High-value customers',
  suspended: 'Suspended accounts',
};

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const currentView = searchParams.get('view') ?? 'all';

  useEffect(() => {
    Promise.all([adminApi.getCustomers(), adminApi.getSettings()])
      .then(([customerResponse, settings]) => {
        setCustomers(customerResponse.customers);
        setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? '$');
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleCustomers = useMemo(() => {
    const recentCutoff = subDays(new Date(), 30);

    if (currentView === 'new') {
      return customers.filter((customer) => new Date(customer.joinDate) >= recentCutoff);
    }

    if (currentView === 'vip') {
      return customers.filter((customer) => customer.totalSpent >= 20000);
    }

    if (currentView === 'suspended') {
      return customers.filter((customer) => customer.status === 'suspended');
    }

    return customers;
  }, [currentView, customers]);

  const fmt = (cents: number) => `${currencySymbol}${(cents / 100).toFixed(2)}`;

  const columns: Column<AdminCustomer>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    { key: 'email', label: 'Email', sortable: true, render: (row) => <span className="text-muted-foreground">{row.email}</span> },
    { key: 'joinDate', label: 'Joined', sortable: true, render: (row) => format(new Date(row.joinDate), 'dd MMM yyyy') },
    { key: 'totalInvites', label: 'Invites', sortable: true },
    { key: 'totalSpent', label: 'Spent', sortable: true, render: (row) => fmt(row.totalSpent) },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'lastActive', label: 'Last Active', sortable: true, render: (row) => format(new Date(row.lastActive), 'dd MMM') },
  ];

  const filters: DataTableFilter[] = [
    { key: 'status', label: 'Status', options: [{ label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }] },
    { key: 'plan', label: 'Access', options: [{ label: 'Browsing Only', value: 'free' }, { label: 'Purchased', value: 'premium' }] },
  ];

  const views = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New 30d' },
    { key: 'vip', label: 'High Value' },
    { key: 'suspended', label: 'Suspended' },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: 'Customers' }]}>
      <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">{viewLabels[currentView] ?? viewLabels.all}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/admin/customers/new')}>
          <Plus className="h-4 w-4 mr-1" /> Add Customer
        </Button>
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
      </div>

      <DataTable
        tableId="customers"
        columns={columns}
        data={visibleCustomers}
        loading={loading}
        searchPlaceholder="Search by name or email..."
        filters={filters}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
        bulkActions={[
          { label: 'Export CSV', onClick: () => toast({ title: 'CSV exported' }) },
          { label: 'Suspend', onClick: () => toast({ title: 'Bulk suspend not implemented in demo' }), destructive: true },
        ]}
        emptyMessage="No customers found"
        emptyIcon={<Users className="h-6 w-6 text-muted-foreground" />}
      />
    </AdminLayout>
  );
};

export default Customers;
