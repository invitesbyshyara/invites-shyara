import { useEffect, useState, useMemo, Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, X, ChevronUp } from "lucide-react";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { allTemplates, getTemplateRenderer } from "@/templates/registry";
import { api } from "@/services/api";
import { TemplateConfig } from "@/types";

const CHECKOUT_PREVIEW_VIEWPORT_WIDTH = 390;
const CHECKOUT_PREVIEW_VIEWPORT_HEIGHT = 640;
const CHECKOUT_PREVIEW_SCALE = 0.72;
const CHECKOUT_PREVIEW_CONTAINER_HEIGHT = Math.round((CHECKOUT_PREVIEW_VIEWPORT_HEIGHT * CHECKOUT_PREVIEW_SCALE) + 24);

const loadRazorpayScript = (): Promise<void> =>
  new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    document.body.appendChild(s);
  });

const Checkout = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency, symbol, formatPrice } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInputs, setPreviewInputs] = useState<Record<string, string>>({});

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(`/login?next=/checkout/${slug}`);
    }
  }, [loading, isAuthenticated, navigate, slug]);

  const TemplateRenderer = useMemo(
    () => template ? getTemplateRenderer(template.category, template.slug) : null,
    [template],
  );

  const previewFields = useMemo(
    () => template?.fields.filter(f => f.section === 'basic' && ['text', 'date'].includes(f.type)).slice(0, 4) ?? [],
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
    if (!promoInput.trim() || !slug) return;
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
    } catch (err: any) {
      setPromoError(err.message ?? "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoExpanded(false);
  };

  const handlePay = async () => {
    if (!slug || !template) return;
    setPaying(true);
    setPayError(null);
    try {
      const order = await api.createCheckoutOrder(
        slug,
        currency.toLowerCase() as "usd" | "eur",
        appliedPromo?.code,
      );

      if (order.free) {
        if (order.inviteId) {
          navigate(`/dashboard/invites/${order.inviteId}/edit`);
        } else {
          navigate("/dashboard");
        }
        return;
      }

      await loadRazorpayScript();

      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Shyara Invites",
        description: template.name,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
              const result = await api.verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              navigate(`/dashboard/invites/${result.inviteId}/edit`);
            } catch {
              setPayError("Payment verification failed. Please contact support if the amount was deducted.");
              setPaying(false);
            }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        theme: { color: "#D4AF37" },
      });
      rzp.open();
    } catch (err: any) {
      setPayError(err.message ?? "Payment failed. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-center px-4">
        <div>
          <p className="font-display text-xl font-bold mb-2">Template not found</p>
          <Link to="/templates" className="text-primary text-sm hover:underline font-body">Browse templates →</Link>
        </div>
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
          Complete Your Purchase
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
              {formatPrice(basePrice)}
            </p>
          </div>
        </div>

        {/* Personalised preview */}
        {TemplateRenderer && (
          <div className="rounded-xl border border-border bg-card mb-8 overflow-hidden">
            <button
              onClick={() => setPreviewOpen(o => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="font-display font-semibold">Personalise Your Preview</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">See how your invite looks before you pay</p>
              </div>
              {previewOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            {previewOpen && (
              <div className="border-t border-border">
                {previewFields.length > 0 && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewFields.map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-body text-muted-foreground mb-1">{f.label}</label>
                        <input
                          type={f.type === 'date' ? 'date' : 'text'}
                          placeholder={f.placeholder ?? f.label}
                          value={previewInputs[f.key] ?? ''}
                          onChange={e => setPreviewInputs(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative overflow-hidden bg-muted/20" style={{ height: CHECKOUT_PREVIEW_CONTAINER_HEIGHT }}>
                  <div className="flex justify-center pt-3 pointer-events-none select-none">
                    <div
                      className="shrink-0"
                      style={{
                        width: CHECKOUT_PREVIEW_VIEWPORT_WIDTH,
                        height: CHECKOUT_PREVIEW_VIEWPORT_HEIGHT,
                        transform: `scale(${CHECKOUT_PREVIEW_SCALE})`,
                        transformOrigin: "top center",
                      }}
                    >
                      <Suspense fallback={
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      }>
                        <TemplateRenderer
                          config={template!}
                          data={{ ...template!.dummyData, ...previewInputs }}
                          isPreview
                        />
                      </Suspense>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="-rotate-12 text-white font-display text-2xl font-bold opacity-70 select-none drop-shadow-lg tracking-widest">
                      PREVIEW
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Promo code section */}
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
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 uppercase"
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-body px-4 h-10"
                        onClick={handleApplyPromo}
                        disabled={!promoInput.trim() || promoLoading}
                      >
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
                    <button onClick={handleRemovePromo} className="hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
                <p className="text-xs text-primary font-body mt-2">Promo applied — {appliedPromo.label}</p>
              </div>
            )}
          </div>

        {/* Order summary */}
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          <h3 className="font-display font-semibold mb-4">Order Summary</h3>
          <div className="flex justify-between font-body text-sm mb-2">
            <span className="text-muted-foreground">{template.name} template</span>
            <span className={`font-medium ${appliedPromo ? "line-through text-muted-foreground" : ""}`}>
              {formatPrice(basePrice)}
            </span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between font-body text-sm mb-2">
              <span className="text-primary">Promo code ({appliedPromo.code})</span>
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
        </div>

        {/* Pay button */}
        {payError && (
          <p className="text-sm text-destructive font-body text-center mb-4">{payError}</p>
        )}
        <Button
          className="w-full h-12 font-display text-base"
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? "Processing..." : `Pay ${formatPrice(finalPrice)}`}
        </Button>

        <p className="text-center text-xs text-muted-foreground font-body mt-4">
          Secure payment via Razorpay. Cards &amp; UPI accepted.
        </p>
      </div>
    </div>
  );
};

export default Checkout;
