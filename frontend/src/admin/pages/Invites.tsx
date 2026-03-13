import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ban, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable, { Column, DataTableFilter } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { adminApi } from '../services/api';
import { AdminInvite } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const viewLabels: Record<string, string> = {
  all: 'Every invite on the platform.',
  published: 'Published invites currently visible to guests.',
  draft: 'Draft invites that still need work before launch.',
  'taken-down': 'Invites removed from public access.',
};

const Invites: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasPermission } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [takedownTarget, setTakedownTarget] = useState<AdminInvite | null>(null);
  const [republishTarget, setRepublishTarget] = useState<AdminInvite | null>(null);

  const currentView = searchParams.get('view') ?? 'all';

  useEffect(() => {
    adminApi.getInvites()
      .then((response) => setInvites(response.invites))
      .finally(() => setLoading(false));
  }, []);

  const visibleInvites = useMemo(() => {
    if (currentView === 'published') return invites.filter((invite) => invite.status === 'published');
    if (currentView === 'draft') return invites.filter((invite) => invite.status === 'draft');
    if (currentView === 'taken-down') return invites.filter((invite) => invite.status === 'taken-down');
    return invites;
  }, [currentView, invites]);

  const confirmTakedown = async () => {
    if (!takedownTarget) return;
    try {
      await adminApi.takedownInvite(takedownTarget.id, user?.email || '');
      setInvites((previous) =>
        previous.map((invite) => invite.id === takedownTarget.id ? { ...invite, status: 'taken-down' as const } : invite)
      );
      toast({ title: 'Invite taken down' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
    setTakedownTarget(null);
  };

  const confirmRepublish = async () => {
    if (!republishTarget) return;
    try {
      await adminApi.republishInvite(republishTarget.id);
      setInvites((previous) =>
        previous.map((invite) => invite.id === republishTarget.id ? { ...invite, status: 'published' as const } : invite)
      );
      toast({ title: 'Invite re-published' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
    setRepublishTarget(null);
  };

  const canTakedown = hasPermission('takedown_invite');

  const columns: Column<AdminInvite>[] = [
    { key: 'eventName', label: 'Event', sortable: true, render: (row) => <span className="font-medium text-foreground">{row.eventName}</span> },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (row) => (
        <button
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/admin/customers/${row.customerId}`);
          }}
          className="text-primary hover:underline text-sm"
        >
          {row.customerName}
        </button>
      ),
    },
    { key: 'templateName', label: 'Template', sortable: true },
    { key: 'templateCategory', label: 'Category', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'slug', label: 'Slug', render: (row) => <span className="font-mono text-xs text-muted-foreground">/{row.slug}</span> },
    { key: 'rsvpCount', label: 'RSVPs', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true, render: (row) => format(new Date(row.createdAt), 'dd MMM yyyy') },
    {
      key: 'actions',
      label: '',
      hideable: false,
      render: (row) => (
        <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
          {row.slug && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/i/${row.slug}`, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          {row.status === 'published' && (
            canTakedown ? (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setTakedownTarget(row)}>
                <Ban className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>You do not have permission to take down invites.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
          {row.status === 'taken-down' && (
            canTakedown ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRepublishTarget(row)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>You do not have permission to re-publish invites.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </div>
      ),
    },
  ];

  const filters: DataTableFilter[] = [
    { key: 'status', label: 'Status', options: [{ label: 'Published', value: 'published' }, { label: 'Draft', value: 'draft' }, { label: 'Expired', value: 'expired' }, { label: 'Taken Down', value: 'taken-down' }] },
    { key: 'templateCategory', label: 'Category', options: [{ label: 'Wedding', value: 'wedding' }, { label: 'Birthday', value: 'birthday' }, { label: 'Engagement', value: 'engagement' }, { label: 'Corporate', value: 'corporate' }, { label: 'Baby Shower', value: 'baby-shower' }, { label: 'Anniversary', value: 'anniversary' }] },
  ];

  const views = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Drafts' },
    { key: 'taken-down', label: 'Taken Down' },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: 'Invites' }]}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Invites</h2>
        <p className="text-sm text-muted-foreground mt-1">{viewLabels[currentView] ?? viewLabels.all}</p>
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
        tableId="invites"
        columns={columns}
        data={visibleInvites}
        loading={loading}
        searchPlaceholder="Search by event, customer, slug..."
        filters={filters}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/invites/${row.id}`)}
        bulkActions={[{ label: 'Export CSV', onClick: () => toast({ title: 'CSV exported' }) }]}
        emptyMessage="No invites found"
        emptyIcon={<FileText className="h-6 w-6 text-muted-foreground" />}
      />

      <ConfirmModal
        open={!!takedownTarget}
        onOpenChange={() => setTakedownTarget(null)}
        title="Take Down Invite"
        description={`Take down "${takedownTarget?.eventName}"? The invite will no longer be publicly accessible.`}
        confirmLabel="Take Down"
        destructive
        onConfirm={confirmTakedown}
      />
      <ConfirmModal
        open={!!republishTarget}
        onOpenChange={() => setRepublishTarget(null)}
        title="Re-publish Invite"
        description={`Re-publish "${republishTarget?.eventName}"? The invite will be publicly accessible again.`}
        confirmLabel="Re-publish"
        onConfirm={confirmRepublish}
      />
    </AdminLayout>
  );
};

export default Invites;
