import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { PublicInviteData } from "@/types";
import { getTemplateBySlug, getTemplateRenderer } from "@/templates/registry";
import AddToCalendar from "@/components/AddToCalendar";
import DirectionsButton from "@/components/DirectionsButton";
import VideoEmbed from "@/components/VideoEmbed";
import RegistrySection from "@/components/RegistrySection";
import AccommodationSection from "@/components/AccommodationSection";
import { extractInviteNames } from "@/utils/share";
import { getLocalizedInviteData } from "@/utils/invite";
import { getLiveInviteCopy } from "@/utils/liveInviteCopy";

const languageLabels: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};

const SimpleState = ({
  title,
  description,
  ctaLabel,
  footerLabel = "Powered by",
}: {
  title: string;
  description: string;
  ctaLabel: string;
  footerLabel?: string;
}) => (
  <div className="min-h-screen flex flex-col bg-background">
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-lg font-bold text-foreground mb-8 tracking-wide">Shyara</p>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-px bg-border" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        <div className="w-12 h-px bg-border" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-foreground">{title}</h1>
      <p className="text-muted-foreground font-body text-sm sm:text-base max-w-md leading-relaxed mb-10">{description}</p>
      <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors">
        {ctaLabel}
      </a>
    </div>
    <div className="py-6 text-center">
      <a href="/" className="text-xs font-body text-muted-foreground/60 hover:text-muted-foreground transition-colors">
        {footerLabel} <span className="font-medium">Shyara</span>
      </a>
    </div>
  </div>
);

const LiveInvite = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inviteData, setInviteData] = useState<PublicInviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [takenDown, setTakenDown] = useState(false);
  const [expired, setExpired] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactedRef = useRef(false);
  const trackedViewRef = useRef(false);
  const guestToken = searchParams.get("guest") || undefined;
  const requestedLanguage = searchParams.get("lang") || undefined;
  const requestedCopy = getLiveInviteCopy(requestedLanguage);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    setTakenDown(false);
    setExpired(false);

    api.getPublicInvite(slug, { guestToken, language: requestedLanguage })
      .then((data) => {
        if (!mounted) return;
        if (data.status === "taken-down") {
          setTakenDown(true);
          return;
        }
        if (data.status === "expired") {
          setExpired(true);
          setInviteData(data);
          return;
        }
        setInviteData(data);
        if (!trackedViewRef.current) {
          trackedViewRef.current = true;
          void api.trackView(slug);
        }
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [guestToken, requestedLanguage, slug]);

  useEffect(() => {
    if (!inviteData) return;

    const data = inviteData.data as Record<string, unknown>;
    const musicUrl = typeof data.musicUrl === "string" ? data.musicUrl : null;
    const enableMusic = data.enableMusic === true;
    if (!enableMusic || !musicUrl) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const playOnInteract = () => {
      if (!interactedRef.current && audioRef.current) {
        interactedRef.current = true;
        void audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("click", playOnInteract, { once: true });
    window.addEventListener("touchstart", playOnInteract, { once: true });

    return () => {
      audio.pause();
      audioRef.current = null;
      window.removeEventListener("click", playOnInteract);
      window.removeEventListener("touchstart", playOnInteract);
    };
  }, [inviteData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (takenDown) {
    return <SimpleState title={requestedCopy.invitationRemovedTitle} description={requestedCopy.invitationRemovedDescription} ctaLabel={requestedCopy.visitShyara} footerLabel={requestedCopy.poweredBy} />;
  }

  if (expired) {
    return (
      <SimpleState
        title="Invitation expired"
        description="This invitation has passed its 3 month validity window and needs renewal before guests can open it again."
        ctaLabel={requestedCopy.visitShyara}
        footerLabel={requestedCopy.poweredBy}
      />
    );
  }

  if (error || !inviteData) {
    return <SimpleState title={requestedCopy.invitationMissingTitle} description={requestedCopy.invitationMissingDescription} ctaLabel={requestedCopy.visitShyara} footerLabel={requestedCopy.poweredBy} />;
  }

  const config = getTemplateBySlug(inviteData.templateSlug);
  if (!config) {
    return <SimpleState title={requestedCopy.templateUnavailableTitle} description={requestedCopy.templateUnavailableDescription} ctaLabel={requestedCopy.visitShyara} footerLabel={requestedCopy.poweredBy} />;
  }

  const data = getLocalizedInviteData(inviteData.data as Record<string, unknown>, inviteData.selectedLanguage);
  const enabledSections = (data.enabledSections ?? null) as string[] | null;
  const effectiveConfig = enabledSections ? { ...config, supportedSections: config.supportedSections.filter((section) => enabledSections.includes(section)) } : config;
  const TemplateRenderer = getTemplateRenderer(config.category, config.slug);

  const eventDate = (data.eventDate ?? data.weddingDate ?? data.partyDate ?? data.anniversaryDate ?? "") as string;
  const eventTime = (data.eventTime ?? data.weddingTime ?? data.engagementTime ?? data.anniversaryTime ?? "") as string;
  const startDateISO = eventDate ? `${eventDate.slice(0, 10)}T${eventTime ? eventTime.slice(0, 5) : "09:00"}:00` : "";
  const names = extractInviteNames(data);
  const eventTitle = names ? `${names}'s ${config.category.replace(/_/g, " ")}` : config.name;
  const location = [data.venueName, data.venueAddress].filter((value): value is string => typeof value === "string" && value.trim().length > 0).join(", ");
  const venueAddress = (data.venueAddress ?? data.venueName) as string | undefined;
  const videoUrl = typeof data.videoUrl === "string" && data.videoUrl ? data.videoUrl : null;
  const registryLinks = Array.isArray(data.registryLinks) ? (data.registryLinks as Array<{ title: string; url: string }>).filter((item) => item.title && item.url) : [];
  const accommodations = Array.isArray(data.accommodations) ? (data.accommodations as Array<{ name: string; address: string; link?: string; groupCode?: string; description?: string }>).filter((item) => item.name && item.address) : [];
  const postEventMode = data.postEventMode === true;
  const selectedLanguage = inviteData.selectedLanguage || inviteData.languages?.[0] || "en";
  const showLanguageSwitcher = (inviteData.languages?.length ?? 0) > 1;
  const copy = getLiveInviteCopy(selectedLanguage);
  const thankYouMessage = typeof data.thankYouMessage === "string" && data.thankYouMessage ? data.thankYouMessage : copy.thankYouMessageFallback;
  const hasMusicEnabled = data.enableMusic === true && typeof data.musicUrl === "string" && data.musicUrl.trim().length > 0;

  const changeLanguage = (language: string) => {
    const next = new URLSearchParams(searchParams);
    if (guestToken) {
      next.set("guest", guestToken);
    } else {
      next.delete("guest");
    }
    next.set("lang", language);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      {showLanguageSwitcher && (
        <div className="fixed top-4 left-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 px-4">
          <div className="flex items-center justify-end gap-2 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-lg backdrop-blur-md">
            <label htmlFor="live-language" className="text-xs text-muted-foreground">{copy.language}</label>
            <select
              id="live-language"
              value={selectedLanguage}
              onChange={(event) => changeLanguage(event.target.value)}
              className="rounded-full border border-border bg-background px-3 py-2 text-sm"
            >
              {(inviteData.languages ?? []).map((language) => (
                <option key={language} value={language}>
                  {languageLabels[language] ?? language.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <TemplateRenderer
          config={effectiveConfig}
          data={{ ...data, slug }}
          inviteId={postEventMode || !inviteData.eventManagementEnabled ? undefined : inviteData.inviteId}
          language={selectedLanguage}
        />
      </Suspense>

      {videoUrl && (
        <section className="py-12 px-6 bg-background">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-center mb-6">{copy.watchOurStory}</h2>
            <VideoEmbed url={videoUrl} />
          </div>
        </section>
      )}

      <RegistrySection links={registryLinks} language={selectedLanguage} />
      <AccommodationSection entries={accommodations} language={selectedLanguage} />

      {postEventMode && (
        <section className="py-16 px-6 bg-primary/5 border-t border-border">
          <div className="max-w-lg mx-auto text-center">
            <div className="text-4xl mb-4">💛</div>
            <h2 className="font-display text-2xl font-bold mb-3">{copy.thankYou}</h2>
            <p className="font-body text-muted-foreground leading-relaxed">{thankYouMessage}</p>
          </div>
        </section>
      )}

      {((startDateISO && !postEventMode) || venueAddress) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 flex-wrap justify-center px-4">
          {startDateISO && !postEventMode && (
            <AddToCalendar title={eventTitle} startDate={startDateISO} location={location || undefined} description={`${copy.yourInvited}! ${window.location.href}`} language={selectedLanguage} />
          )}
          {venueAddress && <DirectionsButton address={venueAddress} language={selectedLanguage} />}
        </div>
      )}

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
          aria-label={musicMuted ? "Unmute music" : "Mute music"}
          title={musicMuted ? "Unmute music" : "Mute music"}
        >
          {musicMuted ? "🔇" : "🎵"}
        </button>
      )}
    </>
  );
};

export default LiveInvite;
