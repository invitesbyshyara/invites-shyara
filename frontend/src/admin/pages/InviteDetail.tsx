import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import InternalNotes from '../components/InternalNotes';
import ConfirmModal from '../components/ConfirmModal';
import { adminApi } from '../services/api';
import { AdminInvite } from '../types';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ExternalLink, Ban, RefreshCw, Pencil, Check, X, Users, MessageSquare } from 'lucide-react';

const InviteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasPermission } = useAdminAuth();
  const [invite, setInvite] = useState<AdminInvite | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [takedownOpen, setTakedownOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([adminApi.getInvite(id), adminApi.getInviteRsvps(id)])
      .then(([inv, r]) => { setInvite(inv); setRsvps(r); setLoading(false); })
      .catch(() => { toast({ title: 'Invite not found', variant: 'destructive' }); navigate('/admin/invites'); });
  }, [id]);

  const handleSlugSave = async () => {
    if (!invite || !newSlug.trim()) return;
    try {
      const { available } = await adminApi.checkSlugAvailability(newSlug, invite.id);
      if (!available) { toast({ title: 'Slug already taken', variant: 'destructive' }); return; }
      const updated = await adminApi.updateInviteSlug(invite.id, newSlug);
      setInvite(updated);
      setEditingSlug(false);
      toast({ title: 'Slug updated' });
    } catch { toast({ title: 'Failed to update slug', variant: 'destructive' }); }
  };

  const handleTakedown = async () => {
    if (!invite) return;
    try {
      const updated = await adminApi.takedownInvite(invite.id, user?.email || '');
      setInvite(updated);
      setTakedownOpen(false);
      toast({ title: 'Invite taken down' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleRepublish = async () => {
    if (!invite) return;
    try {
      const updated = await adminApi.republishInvite(invite.id, user?.email || '');
      setInvite(updated);
      toast({ title: 'Invite re-published' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  if (loading) return (
    <AdminLayout breadcrumbs={[{ label: 'Invites', to: '/admin/invites' }, { label: 'Loading...' }]}>
      <Skeleton className="h-40 rounded-lg mb-4" /><Skeleton className="h-64 rounded-lg" />
    </AdminLayout>
  );
  if (!invite) return null;

  const attending = rsvps.filter(r => r.response === 'yes');
  const maybe = rsvps.filter(r => r.response === 'maybe');
  const declined = rsvps.filter(r => r.response === 'no');

  return (
    <AdminLayout breadcrumbs={[{ label: 'Invites', to: '/admin/invites' }, { label: invite.eventName }]}>
      {/* Metadata */}
      <div className="border border-border rounded-lg bg-card p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-card-foreground">{invite.eventName}</h2>
              <StatusBadge status={invite.status} />
            </div>
            <p className="text-sm text-muted-foreground">Template: {invite.templateName} · Category: {invite.templateCategory}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Slug:</span>
              {editingSlug ? (
                <div className="flex items-center gap-1">
                  <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} className="h-7 w-48 text-sm" />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSlugSave}><Check className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingSlug(false)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm text-foreground">/{invite.slug}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNewSlug(invite.slug); setEditingSlug(true); }}><Pencil className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Customer: <button className="text-primary hover:underline" onClick={() => navigate(`/admin/customers/${invite.customerId}`)}>{invite.customerName}</button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Event: {invite.eventDate} · Created: {format(new Date(invite.createdAt), 'dd MMM yyyy')} · Views: {invite.viewCount}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        {invite.slug && <Button variant="outline" size="sm" onClick={() => window.open(`/i/${invite.slug}`, '_blank')}><ExternalLink className="h-4 w-4 mr-1" /> Preview</Button>}
        {invite.status === 'published' && hasPermission('takedown_invite') && <Button variant="destructive" size="sm" onClick={() => setTakedownOpen(true)}><Ban className="h-4 w-4 mr-1" /> Take Down</Button>}
        {invite.status === 'taken-down' && hasPermission('takedown_invite') && <Button size="sm" onClick={handleRepublish}><RefreshCw className="h-4 w-4 mr-1" /> Re-publish</Button>}
      </div>

      <Tabs defaultValue="rsvps">
        <TabsList>
          <TabsTrigger value="rsvps"><Users className="h-3.5 w-3.5 mr-1" /> RSVPs ({rsvps.length})</TabsTrigger>
          <TabsTrigger value="notes"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="rsvps" className="mt-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="border border-border rounded-md p-3 bg-card text-center">
              <p className="text-xl font-bold text-emerald-600">{attending.length}</p>
              <p className="text-xs text-muted-foreground">Attending</p>
            </div>
            <div className="border border-border rounded-md p-3 bg-card text-center">
              <p className="text-xl font-bold text-amber-600">{maybe.length}</p>
              <p className="text-xs text-muted-foreground">Maybe</p>
            </div>
            <div className="border border-border rounded-md p-3 bg-card text-center">
              <p className="text-xl font-bold text-red-500">{declined.length}</p>
              <p className="text-xs text-muted-foreground">Declined</p>
            </div>
          </div>
          {rsvps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No RSVPs yet</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Response</th><th className="text-left px-3 py-2">Guests</th><th className="text-left px-3 py-2">Message</th><th className="text-left px-3 py-2">Date</th>
                </tr></thead>
                <tbody>{rsvps.map((r: any) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-foreground font-medium">{r.name}</td>
                    <td className="px-3 py-2"><StatusBadge status={r.response === 'yes' ? 'active' : r.response === 'maybe' ? 'draft' : 'suspended'} /></td>
                    <td className="px-3 py-2">{r.guestCount}</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{r.message || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{format(new Date(r.submittedAt), 'dd MMM')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <InternalNotes entityId={invite.id} entityType="invite" />
        </TabsContent>
      </Tabs>

      <ConfirmModal open={takedownOpen} onOpenChange={setTakedownOpen} title="Take Down Invite" description={`This will take down "${invite.eventName}" and it will no longer be accessible at /${invite.slug}. The customer will be notified.`} confirmLabel="Take Down" destructive onConfirm={handleTakedown} />
    </AdminLayout>
  );
};

export default InviteDetail;
