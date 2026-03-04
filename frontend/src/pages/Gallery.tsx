import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuickPreview from "@/components/QuickPreview";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { allTemplates, categories } from "@/templates/registry";
import { EventCategory, TemplateConfig } from "@/types";

const POPULAR_SLUG = "royal-gold";

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPreview, setQuickPreview] = useState<TemplateConfig | null>(null);
  const { currency, formatPrice } = useCurrency();

  const activeCategory = searchParams.get("category") as EventCategory | null;
  const activeSort = searchParams.get("sort") || "newest";

  useEffect(() => {
    setLoading(true);
    let results = [...allTemplates];
    if (activeCategory) results = results.filter((t) => t.category === activeCategory);
    if (activeSort === "price") {
      results.sort((a, b) => (currency === "USD" ? a.priceUsd - b.priceUsd : a.priceEur - b.priceEur));
    } else if (activeSort === "popular") {
      results.sort((a, b) => Number(b.isPremium) - Number(a.isPremium));
    }
    setTemplates(results);
    setLoading(false);
  }, [activeCategory, activeSort, currency]);

  const setCategory = (category: EventCategory | null) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", sort);
    setSearchParams(params);
  };

  const freeCount = templates.filter((template) => !template.isPremium).length;
  const getTemplatePrice = (template: TemplateConfig) =>
    formatPrice(currency === "USD" ? template.priceUsd : template.priceEur);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10 px-4">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-center mb-2">Template Gallery</h1>
        <p className="text-center text-muted-foreground font-body mb-6">Find the perfect design for your celebration</p>

        {!loading && freeCount > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl glass-rose text-sm font-body text-foreground mb-8 max-w-md mx-auto">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>{freeCount} free template{freeCount !== 1 ? "s" : ""} available - no payment required!</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-body transition-colors ${
                !activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-body transition-colors ${
                  activeCategory === category.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <select
            value={activeSort}
            onChange={(event) => setSort(event.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-body"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-border bg-card">
            <div className="text-4xl mb-4">No results</div>
            <h3 className="font-serif text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground font-body mb-6">Try a different category or clear your filters</p>
            <Button onClick={() => setCategory(null)} className="font-body">
              View All Templates
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div
                key={template.slug}
                className="group rounded-xl border border-border bg-card overflow-hidden card-romantic relative"
              >
                {template.slug === POPULAR_SLUG && (
                  <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-gold text-gold-foreground text-[10px] font-body font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div className="aspect-[3/4] relative overflow-hidden">
                  <TemplateThumbnail config={template} />
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-body font-medium bg-card/90 backdrop-blur-sm border border-border capitalize">
                      {template.category.replace("-", " ")}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-body font-medium backdrop-blur-sm ${
                        template.isPremium ? "bg-gold/90 text-gold-foreground" : "bg-card/90 border border-border text-foreground"
                      }`}
                    >
                      {template.isPremium ? getTemplatePrice(template) : "Free"}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 z-10">
                    <Button size="sm" variant="secondary" className="text-xs" asChild>
                      <a href={`/templates/${template.slug}/preview`} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                      </a>
                    </Button>
                    <Button asChild size="sm" className="text-xs">
                      <Link to={`/checkout/${template.slug}`}>Use This</Link>
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-serif font-semibold">{template.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gold font-body">★★★★★</span>
                      <span className="text-xs text-muted-foreground font-body">{template.tags.slice(0, 2).join(" · ")}</span>
                    </div>
                    <span className="text-xs font-body font-medium text-foreground">
                      {template.isPremium ? getTemplatePrice(template) : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && templates.length > 0 && (
          <p className="text-center text-sm text-muted-foreground font-body mt-8">
            Showing {templates.length} template{templates.length !== 1 ? "s" : ""}
            {activeCategory ? ` in ${activeCategory.replace("-", " ")}` : ""}
          </p>
        )}
      </div>

      <QuickPreview
        template={quickPreview}
        open={Boolean(quickPreview)}
        onOpenChange={(open) => {
          if (!open) {
            setQuickPreview(null);
          }
        }}
      />
    </div>
  );
};

export default Gallery;
