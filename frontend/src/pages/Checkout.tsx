import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Lock, X } from "lucide-react";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { TemplateConfig } from "@/types";
import { getTemplateRenderer } from "@/templates/registry";

const PREVIEW_WIDTH = 390;
const PREVIEW_HEIGHT = 640;
const PREVIEW_SCALE = 0.72;

const loadRazorpayScript = () =>
  new Promise<void>((resolve) => {
    if ((window as { Razorpay?: unknown }).Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { currency, symbol, formatPrice } = useCurrency();
  const { user, isAuthenticated, setPendingTemplateSlug } = useAuth();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewInputs, setPreviewInputs] = useState<Record<string, string>>({});
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: "percentage" | "flat"; value: number; label: string } | null>(null);

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

  const previewFields = useMemo(
    () => template?.fields.filter((field) => field.section === "basic" && ["text", "date"].includes(field.type)).slice(0, 4) ?? [],
    [template],
  );

  const basePrice = template ? (currency === "USD" ? template.priceUsd : template.priceEur) : 0;
  const discount = !appliedPromo
    ? 0
    : appliedPromo.type === "percentage"
      ? Math.floor((basePrice * appliedPromo.value) / 100)
      : Math.min(appliedPromo.value, basePrice);
  const finalPrice = Math.max(0, basePrice - discount);

  const handleApplyPromo = async () => {
    if (!slug || !promoInput.trim()) return;
    if (!isAuthenticated) {
      setPromoError("Sign in first to apply a promo code.");
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    try {
      const result = await api.validatePromo(slug, promoInput.trim());
      setAppliedPromo({
        code: promoInput.trim().toUpperCase(),
        type: result.discountType,
        value: result.discountValue,
        label: result.label,
      });
      setPromoInput("");
      setPromoExpanded(false);
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePay = async () => {
    if (!template || !isAuthenticated) return;

    setPaying(true);
    setPayError(null);

    try {
      const order = await api.createCheckoutOrder(
        template.slug,
        currency.toLowerCase() as "usd" | "eur",
        appliedPromo?.code,
      );

      if (order.free) {
        window.location.assign(order.inviteId ? `/dashboard/invites/${order.inviteId}/edit` : "/dashboard");
        return;
      }

      await loadRazorpayScript();

      const RazorpayCtor = (window as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      const razorpay = new RazorpayCtor({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Shyara Invites",
        description: template.name,
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        theme: { color: "#D4AF37" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const result = await api.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            window.location.assign(`/dashboard/invites/${result.inviteId}/edit`);
          } catch {
            setPayError("Payment verification failed. Please contact support if your amount was deducted.");
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });

      razorpay.open();
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!template || !TemplateRenderer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-center px-4">
        <div>
          <p className="font-display text-xl font-bold mb-2">Template not found</p>
          <Link to="/templates" className="text-primary text-sm hover:underline font-body">Browse templates</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
          <Link to="/templates" className="text-sm text-muted-foreground hover:text-foreground font-body">Back to Templates</Link>
        </div>
      </nav>

      <div className="container max-w-5xl py-12 px-4 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-3">Complete your purchase</h1>
            <p className="text-muted-foreground font-body">
              Preview the design, review the price, and unlock personalization when you are ready.
            </p>
          </div>

          <div className="flex items-center gap-6 p-6 rounded-2xl border border-border bg-card">
            <div className="w-24 h-32 rounded-lg overflow-hidden shrink-0 border border-border">
              <TemplateThumbnail config={template} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-lg">{template.name}</h2>
              <p className="text-sm text-muted-foreground font-body capitalize mb-2">{template.category.replace("-", " ")}</p>
              <p className="text-2xl font-display font-bold text-gold">{formatPrice(basePrice)}</p>
              <p className="text-sm text-muted-foreground font-body mt-2">Pay once. Personalize and publish after purchase.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button onClick={() => setPreviewOpen((open) => !open)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-display font-semibold">Personalize your preview</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">Try a few sample details before you buy.</p>
              </div>
              {previewOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {previewOpen && (
              <div className="border-t border-border">
                {previewFields.length > 0 && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-body text-muted-foreground mb-1">{field.label}</label>
                        <input
                          type={field.type === "date" ? "date" : "text"}
                          placeholder={field.placeholder ?? field.label}
                          value={previewInputs[field.key] ?? ""}
                          onChange={(event) => setPreviewInputs((current) => ({ ...current, [field.key]: event.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative overflow-hidden bg-muted/20" style={{ height: Math.round((PREVIEW_HEIGHT * PREVIEW_SCALE) + 24) }}>
                  <div className="flex justify-center pt-3 pointer-events-none select-none">
                    <div style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top center" }}>
                      <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                        <TemplateRenderer config={template} data={{ ...template.dummyData, ...previewInputs }} isPreview />
                      </Suspense>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="-rotate-12 text-white font-display text-2xl font-bold opacity-70 select-none drop-shadow-lg tracking-widest">PREVIEW</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold mb-4">Before you pay</h3>
            <div className="grid gap-3 text-sm text-muted-foreground font-body">
              <p>Use the studio preview or live sample to confirm the design fits your event.</p>
              <p>After payment, the invite builder unlocks your personalized dashboard flow.</p>
              <p>You can edit the invite later and guests will still use the same link.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <Button asChild variant="outline">
                <Link to={`/templates/${template.slug}/preview`}>Studio Preview</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/samples/${template.slug}`}>Live Sample</Link>
              </Button>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 h-fit">
          {!isAuthenticated && (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-display font-semibold mb-2">Sign in to continue</h3>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Preview is open to everyone. Purchase and personalization start after you sign in.
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                <Button asChild onClick={() => setPendingTemplateSlug(slug)}>
                  <Link to={`/login?next=/checkout/${slug}`}>Log In</Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setPendingTemplateSlug(slug)}>
                  <Link to={`/register?next=/checkout/${slug}`}>Create Account</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl border border-border bg-card">
            <h3 className="font-display font-semibold mb-4">Promo code</h3>
            {!appliedPromo ? (
              <>
                <button onClick={() => setPromoExpanded((open) => !open)} className="flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
                  Have a promo code?
                  <ChevronDown className={`w-4 h-4 transition-transform ${promoExpanded ? "rotate-180" : ""}`} />
                </button>
                {promoExpanded && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <Input value={promoInput} onChange={(event) => setPromoInput(event.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-1 uppercase" onKeyDown={(event) => event.key === "Enter" && handleApplyPromo()} />
                      <Button variant="outline" size="sm" className="font-body px-4 h-10" onClick={handleApplyPromo} disabled={!promoInput.trim() || promoLoading}>
                        {promoLoading ? "..." : "Apply"}
                      </Button>
                    </div>
                    {promoError && <p className="text-xs text-destructive font-body">{promoError}</p>}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-body font-medium">
                    {appliedPromo.code}
                    <button onClick={() => { setAppliedPromo(null); setPromoInput(""); setPromoExpanded(false); }} className="hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
                <p className="text-xs text-primary font-body mt-2">Promo applied - {appliedPromo.label}</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card">
            <h3 className="font-display font-semibold mb-4">Order summary</h3>
            <div className="flex justify-between font-body text-sm mb-2">
              <span className="text-muted-foreground">{template.name} template</span>
              <span className={appliedPromo ? "line-through text-muted-foreground" : "font-medium"}>{formatPrice(basePrice)}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between font-body text-sm mb-2">
                <span className="text-primary">Promo ({appliedPromo.code})</span>
                <span className="text-primary font-medium">-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-sm mb-2">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{symbol}0.00</span>
            </div>
            <div className="border-t border-border my-3" />
            <div className="flex justify-between font-body text-sm font-semibold">
              <span>Total</span>
              <span className="text-gold">{formatPrice(finalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground font-body mt-4">Secure payment via Razorpay. Cards and UPI accepted.</p>
          </div>

          {payError && <p className="text-sm text-destructive font-body text-center">{payError}</p>}

          <Button className="w-full h-12 font-display text-base" onClick={handlePay} disabled={!isAuthenticated || paying}>
            {paying ? "Processing..." : isAuthenticated ? `Pay ${formatPrice(finalPrice)}` : "Sign in to unlock purchase"}
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
