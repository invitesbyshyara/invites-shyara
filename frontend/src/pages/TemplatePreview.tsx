import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Monitor, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PhoneMockup from "@/components/PhoneMockup";
import { api } from "@/services/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TemplateConfig } from "@/types";
import { getTemplateRenderer } from "@/templates/registry";
import { formatSectionLabel } from "@/utils/invite";

type PreviewMode = "mobile" | "desktop";

const TemplatePreview = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currency, formatPrice } = useCurrency();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");

  useEffect(() => {
    let mounted = true;

    api.getTemplate(slug)
      .then((result) => {
        if (mounted) setTemplate(result);
      })
      .catch(() => {
        if (mounted) setTemplate(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
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
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Template not found</h1>
          <Button asChild variant="outline">
            <Link to="/templates">Browse templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const price = currency === "USD" ? template.priceUsd : template.priceEur;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Go back">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-sm truncate">{template.name}</h1>
              <p className="text-xs text-muted-foreground capitalize">{template.category.replace("-", " ")} • {formatPrice(price)}</p>
            </div>
          </div>

          <div className="flex items-center bg-muted rounded-full p-1 gap-0.5">
            <button onClick={() => setPreviewMode("mobile")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${previewMode === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
            <button onClick={() => setPreviewMode("desktop")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${previewMode === "desktop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>

          <Button asChild size="sm" className="text-xs shrink-0">
            <Link to={`/checkout/${slug}`}>Buy & Customize</Link>
          </Button>
        </div>
      </div>

      <div className="container py-8 px-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-border bg-background overflow-hidden">
          <div className="flex-1 flex justify-center py-8 px-4 overflow-x-hidden">
            {previewMode === "mobile" ? (
              <PhoneMockup>
                <Suspense fallback={<div className="min-h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <TemplateRenderer key={previewMode} config={template} data={template.dummyData} isPreview />
                </Suspense>
              </PhoneMockup>
            ) : (
              <div className="w-full max-w-5xl">
                <div className="bg-card border border-border border-b-0 rounded-t-xl px-4 py-2.5 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-accent/60" />
                    <div className="w-3 h-3 rounded-full bg-primary/60" />
                  </div>
                  <div className="flex-1 bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                    sample.invitesbyshyara.com/i/example
                  </div>
                </div>
                <div className="border border-border border-t-0 rounded-b-xl overflow-hidden bg-background" style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
                  <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <TemplateRenderer key={previewMode} config={template} data={template.dummyData} isPreview />
                  </Suspense>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 h-fit">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">What happens next</h2>
            <div className="space-y-3 text-sm text-muted-foreground font-body">
              <p>1. Preview the design and compare it with the live sample.</p>
              <p>2. Purchase the template when you are ready to personalize it.</p>
              <p>3. Fill in your names, venue, photos, schedule, RSVP setup, and guest settings in the dashboard.</p>
              <p>4. Publish your invite, share one polished link, and manage reminders and guest coordination from the same workspace.</p>
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
            <h2 className="font-display text-lg font-semibold mb-3">Included after purchase</h2>
            <div className="space-y-3 text-sm text-muted-foreground font-body">
              <p>Custom RSVP questions, guest limits, meal and dietary tracking.</p>
              <p>Targeted reminders for venue, timing, dress code, parking, weather, and more.</p>
              <p>Guest travel and stay management, collaborator permissions, multilingual guest experience, and ops exports.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold mb-3">Helpful links</h2>
            <div className="grid gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link to={`/samples/${template.slug}`}>Open Live Sample</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/pricing">View Pricing</Link>
              </Button>
              <Button asChild className="justify-start">
                <Link to={`/checkout/${template.slug}`}>Buy & Customize</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TemplatePreview;
