import { useState, useEffect, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TemplateConfig } from '@/types';
import { allTemplates, getTemplateRenderer } from '@/templates/registry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor } from 'lucide-react';
import PhoneMockup from '@/components/PhoneMockup';

type PreviewMode = 'mobile' | 'desktop';

const TemplatePreview = () => {
  const { slug } = useParams<{ slug: string }>();
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
    <div className="min-h-screen bg-muted/30">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          {/* Left: template info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="font-display font-semibold text-sm truncate">{config.name}</h1>
            <Badge variant="secondary" className="capitalize text-xs shrink-0">
              {config.category.replace('-', ' ')}
            </Badge>
          </div>

          {/* Center: device toggle */}
          <div className="flex items-center bg-muted rounded-full p-1 gap-0.5">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                previewMode === 'mobile'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
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
              Desktop
            </button>
          </div>

          {/* Right: CTA */}
          <Link to={`/checkout/${slug}`}>
            <Button size="sm" className="font-body text-xs">Use This Template</Button>
          </Link>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex justify-center py-8 px-4">
        {previewMode === 'mobile' ? (
          <PhoneMockup scale={1.15}>
            <div className="w-full h-full overflow-y-auto">
              <Suspense fallback={
                <div className="min-h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <TemplateRenderer key={previewMode} config={config} data={config.dummyData} isPreview />
              </Suspense>
            </div>
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
                ${window.location.host}/i/example
              </div>
            </div>
            {/* Template content */}
            <div className="border border-border border-t-0 rounded-b-xl overflow-hidden bg-background">
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
