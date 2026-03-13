import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Eye, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import AddToCalendar from "@/components/AddToCalendar";
import DirectionsButton from "@/components/DirectionsButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { TemplateConfig } from "@/types";
import { getTemplateRenderer } from "@/templates/registry";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  formatSectionLabel,
  getEventDateFromData,
  getEventTimeFromData,
  getEventTitleFromData,
  getInviteVenueSummary,
} from "@/utils/invite";

const SampleInvite = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currency, formatPrice } = useCurrency();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api.getTemplate(slug)
      .then((result) => {
        if (isMounted) {
          setTemplate(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTemplate(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const TemplateRenderer = useMemo(
    () => (template ? getTemplateRenderer(template.category, template.slug) : null),
    [template],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template || !TemplateRenderer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl py-20 px-4 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Sample not available</h1>
          <p className="text-muted-foreground font-body mb-6">
            This sample invite could not be loaded. Browse other templates instead.
          </p>
          <Button asChild>
            <Link to="/templates">Browse Templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sampleData = { ...template.dummyData, slug: `${template.slug}-sample` };
  const eventTitle = getEventTitleFromData(sampleData, template.category);
  const eventDate = getEventDateFromData(sampleData);
  const eventTime = getEventTimeFromData(sampleData);
  const venueSummary = getInviteVenueSummary(sampleData);
  const currentPrice = currency === "USD" ? template.priceUsd : template.priceEur;
  const calendarStart = eventDate
    ? `${eventDate.slice(0, 10)}T${(eventTime || "18:00").slice(0, 5)}:00`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="container py-4 px-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Live Sample</Badge>
              <Badge variant="outline" className="capitalize">{template.category.replace("-", " ")}</Badge>
              <Badge variant="outline">{formatPrice(currentPrice)}</Badge>
            </div>
            <h1 className="font-display text-3xl font-bold mt-4">{template.name}</h1>
            <p className="text-muted-foreground font-body mt-2 max-w-2xl">
              This sample shows the full guest-facing experience with demo details. You can browse and preview every design before purchase. Personalization unlocks after payment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild>
              <Link to={`/templates/${template.slug}/preview`}>
                <Eye className="w-4 h-4 mr-2" />
                Studio Preview
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/checkout/${template.slug}`}>Customize This Invite</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 px-4 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 h-fit">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">What you are seeing</h2>
            <div className="space-y-3 text-sm font-body text-muted-foreground">
              <p>This is a realistic sample invite using demo names, date, venue, and content.</p>
              <p>After purchase, you replace every detail with your own event information and publish a private link for guests.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">Included Sections</h2>
            <div className="flex flex-wrap gap-2">
              {template.supportedSections.map((section) => (
                <Badge key={section} variant="secondary">{formatSectionLabel(section)}</Badge>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">Sample Event</h2>
            <div className="space-y-3 text-sm font-body text-muted-foreground">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{eventTitle}</p>
                  <p>{eventDate || "Date shown inside the sample invite"}</p>
                  {eventTime && <p>{eventTime}</p>}
                </div>
              </div>
              {venueSummary && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                  <p>{venueSummary}</p>
                </div>
              )}
            </div>

            {(calendarStart || venueSummary) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {calendarStart && (
                  <AddToCalendar
                    title={eventTitle}
                    startDate={calendarStart}
                    location={venueSummary || undefined}
                    description="Sample invite event for preview purposes."
                  />
                )}
                {venueSummary && <DirectionsButton address={venueSummary} />}
              </div>
            )}
          </div>
        </aside>

        <div className="rounded-[2rem] border border-border bg-muted/30 overflow-hidden shadow-sm">
          <Suspense
            fallback={
              <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <TemplateRenderer config={template} data={sampleData} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default SampleInvite;
