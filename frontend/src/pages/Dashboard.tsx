import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Invite } from '@/types';
import ShareMenu from '@/components/ShareMenu';
import QRCodeCard from '@/components/QRCodeCard';
import { apiUrl as apiBaseUrl } from '@/services/api';
import { buildShareMessage } from '@/utils/share';

const statusStyles: Record<string, string> = {
  published: 'bg-accent text-accent-foreground',
  draft: 'bg-secondary text-secondary-foreground',
  expired: 'bg-muted text-muted-foreground',
};

const Dashboard = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareInviteId, setShareInviteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    api.getInvites().then(setInvites).finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const totalRsvps = invites.reduce((sum, i) => sum + i.rsvpCount, 0);
  const activeInvites = invites.filter(i => i.status === 'published').length;

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteInvite(deleteId);
      setInvites(prev => prev.filter(i => i.id !== deleteId));
      toast({ title: 'Invite deleted', description: 'The invitation has been permanently removed.' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
    setDeleteId(null);
    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <div className="flex items-center gap-4 text-sm font-body">
            <Link to="/dashboard" className="font-medium text-foreground">Dashboard</Link>
            <Link to="/templates" className="text-muted-foreground hover:text-foreground hidden md:inline">Browse</Link>
            <Link to="/account" className="text-muted-foreground hover:text-foreground hidden md:inline">Account</Link>
            <button onClick={logout} className="text-muted-foreground hover:text-foreground">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container py-10 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome, {user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Manage your invitations</p>
          </div>
          <Button asChild><Link to="/templates">+ Create New Invite</Link></Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : (
            [
              { label: 'Total Invites', value: invites.length, icon: '📨' },
              { label: 'Total RSVPs', value: totalRsvps, icon: '💌' },
              { label: 'Active Invites', value: activeInvites, icon: '✨' },
            ].map(s => (
              <div key={s.label} className="p-6 rounded-xl border border-border bg-card text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{s.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Invites */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="h-36 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-border bg-card">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-display text-xl font-semibold mb-2">No invites yet</h3>
            <p className="text-muted-foreground font-body mb-6">Create your first beautiful invitation</p>
            <Button asChild size="lg" className="font-body"><Link to="/templates">Browse Templates</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invites.map(inv => (
              <div key={inv.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-36 bg-gradient-to-br from-primary/5 to-accent/30 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground font-body capitalize">{inv.templateSlug.replace(/-/g, ' ')}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold truncate flex-1 mr-2">
                      {inv.slug || 'Untitled Draft'}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-medium capitalize shrink-0 ${statusStyles[inv.status] || statusStyles.expired}`}>
                      {inv.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-body mb-1">
                    {inv.rsvpCount} RSVPs · {inv.templateCategory.replace('-', ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mb-4">
                    Updated {new Date(inv.updatedAt).toLocaleDateString()}
                  </p>

                  {inv.status === 'published' && inv.slug && (
                    <p className="text-xs text-gold font-body mb-3 truncate">
                      /i/{inv.slug}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button asChild size="sm" variant="outline" className="flex-1 text-xs font-body">
                      <Link to={inv.status === 'draft' ? `/create/${inv.id}` : `/dashboard/invites/${inv.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    {inv.status === 'published' && (
                      <>
                        <Button asChild size="sm" variant="outline" className="flex-1 text-xs font-body">
                          <Link to={`/i/${inv.slug}`} target="_blank">Preview</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="flex-1 text-xs font-body">
                          <Link to={`/dashboard/invites/${inv.id}/rsvps`}>RSVPs</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs font-body"
                          onClick={() => setShareInviteId(inv.id)}
                        >
                          Share
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive hover:text-destructive font-body"
                      onClick={() => setDeleteId(inv.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareInviteId && (() => {
        const inv = invites.find(i => i.id === shareInviteId);
        if (!inv?.slug) return null;
        const inviteUrl = `${window.location.origin}/i/${inv.slug}`;
        const shareUrl = `${apiBaseUrl}/share/${inv.slug}`;
        const eventType = inv.templateCategory?.replace(/[_-]/g, ' ') ?? 'event';
        const message = buildShareMessage(inv.data as Record<string, unknown>, eventType, inviteUrl);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
            <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Share Invitation</h3>
                <button
                  onClick={() => setShareInviteId(null)}
                  className="text-muted-foreground hover:text-foreground text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3 break-all">{inviteUrl}</p>
              <ShareMenu shareUrl={shareUrl} inviteUrl={inviteUrl} message={message} variant="stack" />
              <div className="mt-4 flex justify-center">
                <QRCodeCard url={inviteUrl} label={`/i/${inv.slug}`} size={180} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <div className="text-3xl text-center mb-3">⚠️</div>
            <h3 className="font-display text-lg font-semibold mb-2 text-center">Delete Invite</h3>
            <p className="text-sm text-muted-foreground font-body mb-6 text-center">
              This will permanently delete this invitation and all its RSVPs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-body" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1 font-body" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
