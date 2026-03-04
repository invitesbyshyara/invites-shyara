import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { PublicInviteData } from '@/types';
import { getTemplateBySlug, getTemplateRenderer } from '@/templates/registry';

const TakenDownPage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <p className="font-display text-lg font-bold text-foreground mb-8 tracking-wide">Shyara</p>

      {/* Decorative divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-px bg-border" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <div className="w-12 h-px bg-border" />
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-foreground">
        This Invitation Is No Longer Available
      </h1>
      <p className="text-muted-foreground font-body text-sm sm:text-base max-w-md leading-relaxed mb-10">
        The host has removed this invitation. If you believe this is a mistake, please contact the event organiser directly.
      </p>
    </div>

    {/* Footer */}
    <div className="py-6 text-center">
      <a href="/" className="text-xs font-body text-muted-foreground/60 hover:text-muted-foreground transition-colors">
        Powered by <span className="font-medium">Shyara</span>
      </a>
    </div>
  </div>
);

const LiveInvite = () => {
  const { slug } = useParams<{ slug: string }>();
  const [inviteData, setInviteData] = useState<PublicInviteData | null>(null);
  const [error, setError] = useState(false);
  const [takenDown, setTakenDown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getPublicInvite(slug)
      .then(data => {
        if (data.status === 'taken-down') {
          setTakenDown(true);
        } else {
          setInviteData(data);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-body">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (takenDown) {
    return <TakenDownPage />;
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-display text-lg font-bold text-foreground mb-8 tracking-wide">Shyara</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-px bg-border" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <div className="w-12 h-px bg-border" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-foreground">
            Invitations Launching Soon
          </h1>
          <p className="text-muted-foreground font-body text-sm sm:text-base max-w-md leading-relaxed mb-10">
            We're putting the finishing touches on our platform. Beautiful digital invitations will be live very shortly — check back soon!
          </p>
          <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors">
            Explore Templates
          </a>
        </div>
        <div className="py-6 text-center">
          <a href="/" className="text-xs font-body text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            Powered by <span className="font-medium">Shyara</span>
          </a>
        </div>
      </div>
    );
  }

  const config = getTemplateBySlug(inviteData.templateSlug);
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-body">Template not found</p>
      </div>
    );
  }

  const enabledSections = (inviteData.data?.enabledSections ?? null) as string[] | null;
  const effectiveConfig = enabledSections
    ? { ...config, supportedSections: config.supportedSections.filter(s => enabledSections.includes(s)) }
    : config;

  const TemplateRenderer = getTemplateRenderer(config.category, config.slug);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TemplateRenderer
        config={effectiveConfig}
        data={{ ...inviteData.data, slug }}
        inviteId={inviteData.inviteId}
      />
    </Suspense>
  );
};

export default LiveInvite;
