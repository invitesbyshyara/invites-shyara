import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Invite } from '@/types';
import ShareMenu from '@/components/ShareMenu';
import QRCodeCard from '@/components/QRCodeCard';
import { apiUrl as apiBaseUrl } from '@/services/api';
import { buildShareMessage } from '@/utils/share';

const PublishSuccess = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inviteId) return;
    api.getInvite(inviteId)
      .then(setInvite)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inviteId]);

  // Direct invite URL for copy/display — what guests actually visit
  const inviteUrl = invite?.slug
    ? `${window.location.origin}/i/${invite.slug}`
    : `${window.location.origin}/i/your-invite`;

  // Backend share URL — used for social sharing so crawlers get OG meta tags
  const shareUrl = invite?.slug
    ? `${apiBaseUrl}/share/${invite.slug}`
    : inviteUrl;

  const previewPath = invite?.slug ? `/i/${invite.slug}` : '/i/demo-invite';

  const eventType = invite?.templateCategory?.replace(/[_-]/g, ' ') ?? 'event';
  const shareMessage = buildShareMessage(invite?.data as Record<string, unknown> | undefined, eventType, inviteUrl);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Your invitation is live!</h1>
        <p className="text-muted-foreground font-body mb-8">
          Share this link with your guests. Every invite stays active for 3 months{invite?.canUpgradeEventManagement ? ", and this Package B invite can unlock event tools later." : "."}
        </p>

        {/* Invite URL display */}
        <div className="p-4 rounded-xl bg-card border border-border mb-2">
          <p className="text-sm font-body text-gold font-medium break-all">{inviteUrl}</p>
        </div>

        {invite?.slug && (
          <Link
            to={previewPath}
            className="text-xs text-muted-foreground hover:text-primary font-body underline mb-6 inline-block"
          >
            Preview your live invite →
          </Link>
        )}

        <div className="mt-6">
          <ShareMenu
            shareUrl={shareUrl}
            inviteUrl={inviteUrl}
            message={shareMessage}
            variant="stack"
          />
          <Button asChild variant="ghost" className="w-full font-body mt-2">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>

        {/* QR Code — save and print for physical sharing */}
        {invite?.slug && (
          <div className="mt-8">
            <QRCodeCard
              url={inviteUrl}
              label={inviteUrl.replace(window.location.origin, '')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishSuccess;
