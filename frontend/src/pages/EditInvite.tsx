import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Invite, InviteWorkspace, TemplateConfig } from '@/types';
import { getTemplateBySlug } from '@/templates/registry';
import InviteForm from '@/components/InviteForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const EditInvite = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [workspace, setWorkspace] = useState<InviteWorkspace | null>(null);
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingAccess, setRequestingAccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!inviteId) return;
    api.getInviteWorkspace(inviteId)
      .then(async (workspaceResponse) => {
        setWorkspace(workspaceResponse);
        if (workspaceResponse.accessRole === 'owner' || workspaceResponse.permissions.includes('edit_content')) {
          const inv = await api.getInvite(inviteId);
          setInvite(inv);
          setConfig(getTemplateBySlug(inv.templateSlug) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [inviteId, isAuthenticated, navigate]);

  const requestAccess = async () => {
    if (!inviteId) return;
    setRequestingAccess(true);
    try {
      await api.requestInviteAccess(inviteId, ['edit_content']);
      const refreshedWorkspace = await api.getInviteWorkspace(inviteId);
      setWorkspace(refreshedWorkspace);
      toast({ title: 'Access request sent' });
    } catch {
      toast({ title: 'Could not request access', variant: 'destructive' });
    } finally {
      setRequestingAccess(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canEditInvite = workspace?.accessRole === 'owner' || workspace?.permissions.includes('edit_content');
  const pendingRequest = workspace?.myAccessRequests.find((request) =>
    request.status === 'pending' && request.requestedPermissions.includes('edit_content')
  );

  if (!canEditInvite) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
            </div>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground font-body">← Dashboard</Link>
          </div>
        </nav>

        <div className="container py-16">
          <div className="max-w-2xl rounded-2xl border border-border bg-card p-8 space-y-5">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold">Edit access required</h1>
              <p className="text-sm text-muted-foreground">
                This invite is in your workspace, but editing is limited to collaborators with content access.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">edit content</Badge>
              {workspace?.permissions.map((permission) => (
                <Badge key={permission} variant="secondary">{permission.replace(/_/g, ' ')}</Badge>
              ))}
            </div>

            {pendingRequest ? (
              <p className="text-sm text-muted-foreground">Request pending since {new Date(pendingRequest.requestedAt).toLocaleDateString()}.</p>
            ) : (
              <Button
                disabled={requestingAccess || !workspace?.requestablePermissions.includes('edit_content')}
                onClick={requestAccess}
              >
                {requestingAccess ? 'Requesting...' : 'Request access from Admin'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-body">Template not available. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
            <span className="hidden md:inline text-sm text-muted-foreground font-body">
              Editing: <span className="font-medium text-foreground">{config.name}</span>
            </span>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground font-body">← Dashboard</Link>
        </div>
      </nav>

      <InviteForm config={config} invite={invite} isEditing />
    </div>
  );
};

export default EditInvite;
