import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { PublicInviteData } from '@/types';
import { getTemplateBySlug, getTemplateRenderer } from '@/templates/registry';
import AddToCalendar from '@/components/AddToCalendar';
import DirectionsButton from '@/components/DirectionsButton';
import VideoEmbed from '@/components/VideoEmbed';
import RegistrySection from '@/components/RegistrySection';
import AccommodationSection from '@/components/AccommodationSection';
import { extractInviteNames } from '@/utils/share';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactedRef = useRef(false);
  const [musicMuted, setMusicMuted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.getPublicInvite(slug)
      .then(data => {
        if (data.status === 'taken-down') {
          setTakenDown(true);
        } else {
          setInviteData(data);
          // Track view with device type + referrer for analytics
          api.trackView(slug);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Background music: create audio element when data is ready
  useEffect(() => {
    if (!inviteData) return;
    const d = inviteData.data as Record<string, unknown>;
    const musicUrl = typeof d.musicUrl === 'string' ? d.musicUrl : null;
    const enableMusic = d.enableMusic === true;
    if (!enableMusic || !musicUrl) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playOnInteract = () => {
      if (!interactedRef.current && audioRef.current) {
        interactedRef.current = true;
        audioRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('click', playOnInteract, { once: true });
    window.addEventListener('touchstart', playOnInteract, { once: true });

    return () => {
      audio.pause();
      audioRef.current = null;
      window.removeEventListener('click', playOnInteract);
      window.removeEventListener('touchstart', playOnInteract);
    };
  }, [inviteData]);

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

  // Extract event data for platform widgets
  const d = inviteData.data as Record<string, unknown>;
  const eventDateStr = (d.eventDate ?? d.weddingDate ?? d.partyDate ?? '') as string;
  const eventTimeStr = (d.eventTime ?? d.weddingTime ?? '') as string;
  const startDateISO = eventDateStr
    ? `${eventDateStr.slice(0, 10)}T${eventTimeStr ? eventTimeStr.slice(0, 5) : '09:00'}:00`
    : '';
  const names = extractInviteNames(d);
  const eventTitle = names
    ? `${names}'s ${config.category.replace(/_/g, ' ')}`
    : config.label ?? config.category.replace(/_/g, ' ');
  const location = [d.venueName, d.venueAddress]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(', ');
  const venueAddress = (d.venueAddress ?? d.venueName) as string | undefined;

  // Platform sections
  const videoUrl = typeof d.videoUrl === 'string' && d.videoUrl ? d.videoUrl : null;
  const registryLinks = (Array.isArray(d.registryLinks)
    ? (d.registryLinks as Array<{ title: string; url: string }>).filter(l => l.title && l.url)
    : []);
  const accommodations = (Array.isArray(d.accommodations)
    ? (d.accommodations as Array<{ name: string; address: string; link?: string; groupCode?: string; description?: string }>).filter(e => e.name && e.address)
    : []);
  const postEventMode = d.postEventMode === true;
  const thankYouMessage = (typeof d.thankYouMessage === 'string' && d.thankYouMessage)
    ? d.thankYouMessage
    : 'Thank you for celebrating with us!';
  const hasMusicEnabled =
    d.enableMusic === true &&
    typeof d.musicUrl === 'string' &&
    d.musicUrl.trim().length > 0;

  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <TemplateRenderer
          config={effectiveConfig}
          data={{ ...inviteData.data, slug }}
          inviteId={postEventMode ? undefined : inviteData.inviteId}
        />
      </Suspense>

      {/* Platform sections injected below the template */}
      {videoUrl && (
        <section className="py-12 px-6 bg-background">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-6">Watch Our Story</h2>
            <VideoEmbed url={videoUrl} />
          </div>
        </section>
      )}

      <RegistrySection links={registryLinks} />
      <AccommodationSection entries={accommodations} />

      {postEventMode && (
        <section className="py-16 px-6 bg-primary/5 border-t border-border">
          <div className="max-w-lg mx-auto text-center">
            <div className="text-4xl mb-4">💛</div>
            <h2 className="font-display text-2xl font-bold mb-3">Thank You</h2>
            <p className="font-body text-muted-foreground leading-relaxed">{thankYouMessage}</p>
          </div>
        </section>
      )}

      {/* Floating bottom bar: Add to Calendar + Directions */}
      {(startDateISO && !postEventMode) || venueAddress ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          {startDateISO && !postEventMode && (
            <AddToCalendar
              title={eventTitle}
              startDate={startDateISO}
              location={location || undefined}
              description={`You're invited! View your invitation at ${window.location.href}`}
            />
          )}
          {venueAddress && (
            <DirectionsButton address={venueAddress} />
          )}
        </div>
      ) : null}

      {/* Floating music mute/unmute button */}
      {hasMusicEnabled && (
        <button
          onClick={() => {
            if (!audioRef.current) return;
            if (musicMuted) {
              audioRef.current.volume = 0.5;
              setMusicMuted(false);
            } else {
              audioRef.current.volume = 0;
              setMusicMuted(true);
            }
          }}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-lg hover:bg-card transition-colors"
          aria-label={musicMuted ? 'Unmute music' : 'Mute music'}
          title={musicMuted ? 'Unmute music' : 'Mute music'}
        >
          {musicMuted ? '🔇' : '🎵'}
        </button>
      )}
    </>
  );
};

export default LiveInvite;
