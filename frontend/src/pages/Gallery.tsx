import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Search, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import PurchaseCtaButton from "@/components/PurchaseCtaButton";
import QuickPreview from "@/components/QuickPreview";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { api } from "@/services/api";
import { allTemplates, categories } from "@/templates/registry";
import { EventCategory, TemplateConfig } from "@/types";

const POPULAR_SLUG = "rustic-charm";
const platformTags = ["RSVP", "Broadcasts", "Ops Pack"];

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPreview, setQuickPreview] = useState<TemplateConfig | null>(null);
  const [search, setSearch] = useState("");
  const { currency, formatPrice } = useCurrency();

  const activeCategory = searchParams.get("category") as EventCategory | null;
  const activeSort = searchParams.get("sort") || "popular";

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getTemplates({
      category: activeCategory ?? undefined,
      sort: activeSort,
    }).then((results) => {
      if (mounted) setTemplates(results);
    }).catch(() => {
      if (mounted) setTemplates(allTemplates);
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [activeCategory, activeSort]);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) {
      return templates;
    }

    const query = search.toLowerCase();
    return templates.filter((template) =>
      template.name.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      template.category.toLowerCase().includes(query),
    );
  }, [search, templates]);

  const setCategory = (category: EventCategory | null) => {
    const params = new URLSearchParams(searchParams);
    if (category) params.set("category", category);
    else params.delete("category");
    setSearchParams(params);
  };

  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", sort);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 py-10">
        <h1 className="mb-2 text-center font-serif text-3xl font-bold md:text-4xl">Template Gallery</h1>
        <p className="mb-8 text-center text-muted-foreground font-body">
          Browse the available design, preview the full experience, and remember that Rustic Charm includes the same host-side system for RSVP handling, reminders, guest coordination, and event operations.
        </p>

        <div className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setCategory(category.value)}
                  className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${activeCategory === category.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates or tags" className="pl-9" />
              </div>
              <select value={activeSort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-body">
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price">Price: Low to High</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground font-body">
            <span>Studio preview available for every template</span>
            <span className="hidden sm:inline">•</span>
            <span>Live sample experience available</span>
            <span className="hidden sm:inline">•</span>
            <span>RSVP, reminders, and ops tools included after purchase</span>
            <span className="hidden sm:inline">•</span>
            <span>Personalization starts after purchase</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-border">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-20 text-center">
            <div className="mb-4 text-4xl">No results</div>
            <h3 className="mb-2 font-serif text-xl font-semibold">No templates found</h3>
            <p className="mb-6 text-muted-foreground font-body">Try a different filter or search term.</p>
            <Button onClick={() => { setCategory(null); setSearch(""); }}>View All Templates</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => {
              const price = currency === "USD" ? template.priceUsd : template.priceEur;

              return (
                <div key={template.slug} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <TemplateThumbnail config={template} />
                    <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-medium capitalize backdrop-blur-sm">
                          {template.category.replace("-", " ")}
                        </span>
                        {template.slug === POPULAR_SLUG && (
                          <span className="flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-medium text-gold-foreground">
                            <Sparkles className="h-3 w-3" /> Popular
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-medium text-gold-foreground">
                        {formatPrice(price)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-serif font-semibold">{template.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground font-body">
                      Paid invite includes live link, RSVP tools, reminders, and event operations support.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {platformTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setQuickPreview(template)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> Quick Look
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1 text-xs">
                        <Link to={`/templates/${template.slug}/preview`}>Preview</Link>
                      </Button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1 text-xs">
                        <Link to={`/samples/${template.slug}`}>Live Sample</Link>
                      </Button>
                      <PurchaseCtaButton slug={template.slug} openLabel="Buy & Customize" size="sm" className="flex-1 text-xs" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredTemplates.length > 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground font-body">
            Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
            {activeCategory ? ` in ${activeCategory.replace("-", " ")}` : ""}
          </p>
        )}
      </div>

      <QuickPreview template={quickPreview} open={Boolean(quickPreview)} onOpenChange={(open) => { if (!open) setQuickPreview(null); }} />
    </div>
  );
};

export default Gallery;
