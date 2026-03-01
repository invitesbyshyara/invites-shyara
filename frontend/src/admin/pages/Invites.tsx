import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { format } from 'date-fns';
import { ExternalLink, Ban, RefreshCw } from 'lucide-react';

const Invites: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasPermission } = useAdminAuth();
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [takedownTarget, setTakedownTarget] = useState<AdminInvite | null>(null);
  const [republishTarget, setRepublishTarget] = useState<AdminInvite | null>(null);

  useEffect(() => { adminApi.getInvites().then(i => { setInvites(i); setLoading(false); }); }, []);

  const confirmTakedown = async () => {
    if (!takedownTarget) return;
    try {
      await adminApi.takedownInvite(takedownTarget.id, user?.email || '');
      setInvites(prev => prev.map(i => i.id === takedownTarget.id ? { ...i, status: 'taken-down' as const } : i));
      toast({ title: 'Invite taken down' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    setTakedownTarget(null);
  };

  const confirmRepublish = async () => {
    if (!republishTarget) return;
    try {
      await adminApi.republishInvite(republishTarget.id, user?.email || '');
      setInvites(prev => prev.map(i => i.id === republishTarget.id ? { ...i, status: 'published' as const } : i));
      toast({ title: 'Invite re-published' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    setRepublishTarget(null);
  };

  const canTakedown = hasPermission('takedown_invite');

  const columns: Column<AdminInvite>[] = [
    { key: 'eventName', label: 'Event', sortable: true, render: r => <span className="font-medium text-foreground">{r.eventName}</span> },
    { key: 'customerName', label: 'Customer', sortable: true, render: r => <button onClick={e => { e.stopPropagation(); navigate(`/admin/customers/${r.customerId}`); }} className="text-primary hover:underline text-sm">{r.customerName}</button> },
    { key: 'templateName', label: 'Template', sortable: true },
    { key: 'templateCategory', label: 'Category', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: r => <StatusBadge status={r.status} /> },
    { key: 'slug', label: 'Slug', render: r => <span className="font-mono text-xs text-muted-foreground">/{r.slug}</span> },
    { key: 'rsvpCount', label: 'RSVPs', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true, render: r => format(new Date(r.createdAt), 'dd MMM yyyy') },
    { key: 'actions', label: '', hideable: false, render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {r.slug && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/i/${r.slug}`, '_blank')}><ExternalLink className="h-3.5 w-3.5" /></Button>}
        {r.status === 'published' && (
          canTakedown ? (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setTakedownTarget(r)}><Ban className="h-3.5 w-3.5" /></Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled><Ban className="h-3.5 w-3.5" /></Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>You don't have permission to take down invites</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
        {r.status === 'taken-down' && (
          canTakedown ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRepublishTarget(r)}><RefreshCw className="h-3.5 w-3.5" /></Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled><RefreshCw className="h-3.5 w-3.5" /></Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>You don't have permission to re-publish invites</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
      </div>
    )},
  ];

  const filters: DataTableFilter[] = [
    { key: 'status', label: 'Status', options: [{ label: 'Published', value: 'published' }, { label: 'Draft', value: 'draft' }, { label: 'Expired', value: 'expired' }, { label: 'Taken Down', value: 'taken-down' }] },
    { key: 'templateCategory', label: 'Category', options: [{ label: 'Wedding', value: 'wedding' }, { label: 'Birthday', value: 'birthday' }, { label: 'Engagement', value: 'engagement' }, { label: 'Corporate', value: 'corporate' }, { label: 'Baby Shower', value: 'baby-shower' }, { label: 'Anniversary', value: 'anniversary' }] },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: 'Invites' }]}>
      <h2 className="text-lg font-semibold text-foreground mb-4">All Invites</h2>
      <DataTable tableId="invites" columns={columns} data={invites} loading={loading} searchPlaceholder="Search by event, customer, slug..." filters={filters} getRowId={r => r.id} onRowClick={r => navigate(`/admin/invites/${r.id}`)} bulkActions={[{ label: 'Export CSV', onClick: () => toast({ title: 'CSV exported' }) }]} emptyMessage="No invites found" />
      <ConfirmModal open={!!takedownTarget} onOpenChange={() => setTakedownTarget(null)} title="Take Down Invite" description={`Take down "${takedownTarget?.eventName}"? The invite will no longer be publicly accessible.`} confirmLabel="Take Down" destructive onConfirm={confirmTakedown} />
      <ConfirmModal open={!!republishTarget} onOpenChange={() => setRepublishTarget(null)} title="Re-publish Invite" description={`Re-publish "${republishTarget?.eventName}"? The invite will be publicly accessible again.`} confirmLabel="Re-publish" onConfirm={confirmRepublish} />
    </AdminLayout>
  );
};

export default Invites;
