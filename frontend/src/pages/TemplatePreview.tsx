import { useState, useEffect, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TemplateConfig } from '@/types';
import { allTemplates, getTemplateRenderer } from '@/templates/registry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Smartphone, Monitor } from 'lucide-react';
import PhoneMockup from '@/components/PhoneMockup';

type PreviewMode = 'mobile' | 'desktop';

const TemplatePreview = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile');

  useEffect(() => {
    if (!slug) return;
    const found = allTemplates.find((t) => t.slug === slug) ?? null;
    setConfig(found);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-body">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Template Not Found</h1>
          <p className="text-muted-foreground font-body">This template doesn't exist.</p>
        </div>
      </div>
    );
  }

  const TemplateRenderer = getTemplateRenderer(config.category, config.slug);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4 gap-2">
          {/* Left: back + template info */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <h1 className="font-display font-semibold text-sm truncate">{config.name}</h1>
              <Badge variant="secondary" className="capitalize text-xs shrink-0">
                {config.category.replace('-', ' ')}
              </Badge>
            </div>
          </div>

          {/* Center: device toggle — always visible */}
          <div className="flex items-center bg-muted rounded-full p-1 gap-0.5 shrink-0">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                previewMode === 'mobile'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                previewMode === 'desktop'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>

          {/* Right: CTA */}
          <Link to={`/checkout/${slug}`}>
            <Button size="sm" className="font-body text-xs shrink-0">Use This Template</Button>
          </Link>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex justify-center py-8 px-4 overflow-x-hidden">
        {previewMode === 'mobile' ? (
          <PhoneMockup>
            <Suspense fallback={
              <div className="min-h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <TemplateRenderer key={previewMode} config={config} data={config.dummyData} isPreview />
            </Suspense>
          </PhoneMockup>
        ) : (
          <div className="w-full max-w-5xl">
            {/* Browser chrome */}
            <div className="bg-card border border-border border-b-0 rounded-t-xl px-4 py-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-accent/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
              </div>
              <div className="flex-1 bg-muted rounded-md px-3 py-1 text-xs font-body text-muted-foreground text-center">
                {window.location.host}/i/example
              </div>
            </div>
            {/* Template content — bounded height with scroll */}
            <div
              className="border border-border border-t-0 rounded-b-xl overflow-hidden bg-background"
              style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
            >
              <Suspense fallback={
                <div className="min-h-[600px] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <TemplateRenderer key={previewMode} config={config} data={config.dummyData} isPreview />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;
