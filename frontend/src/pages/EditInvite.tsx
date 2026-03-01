import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Invite, TemplateConfig } from '@/types';
import { getTemplateBySlug } from '@/templates/registry';
import InviteForm from '@/components/InviteForm';

const EditInvite = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!inviteId) return;
    api.getInvite(inviteId).then(inv => {
      setInvite(inv);
      setConfig(getTemplateBySlug(inv.templateSlug) || null);
    }).finally(() => setLoading(false));
  }, [inviteId, isAuthenticated, navigate]);

  if (loading || !invite || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
