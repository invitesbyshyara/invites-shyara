import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Invite } from '@/types';

const PublishSuccess = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const { toast } = useToast();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const inviteBaseUrl = `${window.location.origin}/i`;

  useEffect(() => {
    if (!inviteId) return;
    api.getInvite(inviteId)
      .then(setInvite)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inviteId]);

  const shareUrl = invite?.slug
    ? `${inviteBaseUrl}/${invite.slug}`
    : `${inviteBaseUrl}/your-invite`;

  const previewPath = invite?.slug ? `/i/${invite.slug}` : '/i/demo-invite';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copied!', description: 'Share it with your guests.' });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`You're invited! Open your invitation here: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

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
        <p className="text-muted-foreground font-body mb-8">Share this link with your guests and watch the RSVPs roll in</p>

        <div className="p-4 rounded-xl bg-card border border-border mb-2">
          <p className="text-sm font-body text-gold font-medium break-all">{shareUrl}</p>
        </div>

        {invite?.slug && (
          <Link
            to={previewPath}
            className="text-xs text-muted-foreground hover:text-primary font-body underline mb-6 inline-block"
          >
            Preview your live invite →
          </Link>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <Button className="w-full h-11 font-body" onClick={handleCopy}>
            📋 Copy Link
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 font-body"
            onClick={handleWhatsApp}
          >
            💬 Share via WhatsApp
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 font-body"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'You\'re Invited!', url: shareUrl });
              }
            }}
          >
            📤 Share via Other Apps
          </Button>
          <Button asChild variant="ghost" className="w-full font-body mt-2">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublishSuccess;
