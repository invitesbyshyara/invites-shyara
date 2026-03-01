import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, Sparkles, X } from "lucide-react";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { allTemplates } from "@/templates/registry";
import { TemplateConfig } from "@/types";

const Checkout = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency, symbol, formatPrice } = useCurrency();

  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    type: "percentage" | "flat";
    value: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    const found = allTemplates.find((t) => t.slug === slug) ?? null;
    setTemplate(found);
    setLoading(false);
  }, [slug]);

  const basePrice = template ? (currency === "USD" ? template.priceUsd : template.priceEur) : 0;
  const discount = !appliedPromo
    ? 0
    : appliedPromo.type === "percentage"
      ? Math.floor((basePrice * appliedPromo.value) / 100)
      : Math.min(appliedPromo.value, basePrice);
  const finalPrice = Math.max(0, basePrice - discount);

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoExpanded(false);
  };

  if (loading || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <Link to="/templates" className="text-sm text-muted-foreground hover:text-foreground font-body">
            {"<-"} Templates
          </Link>
        </div>
      </nav>

      <div className="container max-w-2xl py-12 px-4">
        <h1 className="font-display text-3xl font-bold text-center mb-10">
          {template.isPremium ? "Complete Your Purchase" : "Confirm Your Template"}
        </h1>

        {/* Template card */}
        <div className="flex items-center gap-6 p-6 rounded-xl border border-border bg-card mb-8">
          <div className="w-24 h-32 rounded-lg overflow-hidden shrink-0 border border-border">
            <TemplateThumbnail config={template} />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-lg">{template.name}</h2>
            <p className="text-sm text-muted-foreground font-body capitalize mb-2">
              {template.category.replace("-", " ")}
            </p>
            <p className="text-2xl font-display font-bold text-gold">
              {template.isPremium ? formatPrice(basePrice) : "Free"}
            </p>
          </div>
        </div>

        {/* Promo code section — visible for Stripe review */}
        {template.isPremium && (
          <div className="p-6 rounded-xl border border-border bg-card mb-8">
            <h3 className="font-display font-semibold mb-4">Promo Code</h3>
            {!appliedPromo ? (
              <>
                <button
                  onClick={() => setPromoExpanded(!promoExpanded)}
                  className="flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  Have a promo code?
                  <ChevronDown className={`w-4 h-4 transition-transform ${promoExpanded ? "rotate-180" : ""}`} />
                </button>
                {promoExpanded && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 uppercase"
                    />
                    <Button variant="outline" size="sm" className="font-body px-4 h-10" disabled>
                      Apply
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground font-body mt-2">Promo codes available at launch.</p>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-body font-medium">
                    {appliedPromo.code}
                    <button onClick={handleRemovePromo} className="hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
                <p className="text-xs text-primary font-body mt-2">Promo applied — {appliedPromo.label}</p>
              </div>
            )}
          </div>
        )}

        {/* Order summary */}
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          <h3 className="font-display font-semibold mb-4">Order Summary</h3>
          <div className="flex justify-between font-body text-sm mb-2">
            <span className="text-muted-foreground">{template.name} template</span>
            <span className={`font-medium ${appliedPromo ? "line-through text-muted-foreground" : ""}`}>
              {template.isPremium ? formatPrice(basePrice) : "Free"}
            </span>
          </div>
          {appliedPromo && template.isPremium && (
            <div className="flex justify-between font-body text-sm mb-2">
              <span className="text-primary">Promo code ({appliedPromo.code})</span>
              <span className="text-primary font-medium">-{formatPrice(discount)}</span>
            </div>
          )}
          {template.isPremium && (
            <>
              <div className="flex justify-between font-body text-sm mb-2">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{symbol}0.00</span>
              </div>
              <div className="border-t border-border my-3" />
              <div className="flex justify-between font-body text-sm font-semibold">
                <span>Total</span>
                <span className="text-gold">{formatPrice(finalPrice)}</span>
              </div>
            </>
          )}
        </div>

        {/* Launching Soon — replaces payment button */}
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">Payments Launching Soon</h3>
          <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs mx-auto">
            We're finalising our secure international payment setup. Check back shortly — your invitation will be ready to create!
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground font-body mt-4">
          Secure payment via Stripe. Cards accepted worldwide.
        </p>
      </div>
    </div>
  );
};

export default Checkout;
