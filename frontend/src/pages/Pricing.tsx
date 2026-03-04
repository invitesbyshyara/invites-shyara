import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";

const faqs = [
  {
    q: "Can I try before I pay?",
    a: "Yes. You can browse and fully preview any template before purchasing.",
  },
  {
    q: "Can I edit my invite after publishing?",
    a: "Yes, edits can be made anytime and are reflected on the same invite URL.",
  },
  {
    q: "How do guests RSVP?",
    a: "Guests submit responses directly on your invite page and you can track everything in your dashboard.",
  },
  {
    q: "Do guests need to download an app?",
    a: "No. Invites are shareable web links.",
  },
];

const Pricing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { currency, symbol } = useCurrency();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-16 px-4">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-center mb-2">Simple, Transparent Pricing</h1>
        <p className="text-center text-muted-foreground font-body mb-14">No hidden fees. No subscriptions. Pay per template.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="p-8 rounded-xl border border-border bg-card card-romantic">
            <h2 className="font-serif text-xl font-bold mb-1">Free</h2>
            <p className="text-3xl font-serif font-bold text-foreground mb-1">{symbol}0</p>
            <p className="text-xs text-muted-foreground font-body mb-6">Forever free</p>
            <ul className="space-y-3 font-body text-sm text-muted-foreground mb-8">
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Access to free templates</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Personalized invite link</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Basic RSVP tracking</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Mobile-optimized</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Unlimited sharing</li>
            </ul>
            <Button asChild variant="outline" className="w-full font-body">
              <Link to="/templates">Get Started Free</Link>
            </Button>
          </div>

          <div className="p-8 rounded-xl border-2 border-gold bg-card relative shadow-romantic card-romantic">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-gold-foreground text-xs font-body font-medium rounded-full">
              Most Popular
            </span>
            <h2 className="font-serif text-xl font-bold mb-1">Premium</h2>
            <p className="text-3xl font-serif font-bold text-foreground mb-1">
              {currency === "USD" ? "$2.99 - $7.99" : "€2.49 - €6.99"}
            </p>
            <p className="text-xs text-muted-foreground font-body mb-6">One-time payment per template</p>
            <ul className="space-y-3 font-body text-sm text-muted-foreground mb-8">
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Everything in Free</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Premium designer templates</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Opening animations</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Photo gallery section</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Story section</li>
            </ul>
            <Button asChild className="w-full font-body">
              <Link to="/templates">Browse Premium Templates</Link>
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-20">
          <h2 className="font-serif text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-border">
              <button
                className="w-full text-left py-5 flex items-center justify-between group"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <h3 className="font-serif font-semibold pr-4">{faq.q}</h3>
                <span
                  className="text-muted-foreground text-lg shrink-0 transition-transform"
                  style={{ transform: openFaq === index ? "rotate(45deg)" : "rotate(0)" }}
                >
                  +
                </span>
              </button>
              {openFaq === index && (
                <p className="text-sm text-muted-foreground font-body leading-relaxed pb-5 animate-fade-in">{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <h3 className="font-serif text-2xl font-bold mb-3">Ready to get started?</h3>
          <p className="text-muted-foreground font-body mb-6">Create your first invitation in minutes.</p>
          <Button asChild size="lg" className="font-body">
            <Link to="/templates">Browse Templates</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
