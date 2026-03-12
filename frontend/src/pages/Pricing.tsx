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
  {
    q: "Is this a subscription?",
    a: "No. You pay once per template — no recurring charges, no hidden fees.",
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
        <p className="text-center text-muted-foreground font-body mb-14">No hidden fees. No subscriptions. Pay once per template.</p>

        <div className="max-w-lg mx-auto">
          <div className="p-8 rounded-xl border-2 border-gold bg-card relative shadow-romantic card-romantic">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold text-gold-foreground text-xs font-body font-medium rounded-full">
              One-Time Payment
            </span>
            <h2 className="font-serif text-xl font-bold mb-1">Pay Per Template</h2>
            <p className="text-3xl font-serif font-bold text-foreground mb-1">
              {currency === "USD" ? "$99" : "€119"}
            </p>
            <p className="text-xs text-muted-foreground font-body mb-6">Per template · Pay once, use forever</p>
            <ul className="space-y-3 font-body text-sm text-muted-foreground mb-8">
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Premium designer template</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Personalised invite link</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Opening animations</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Photo gallery &amp; story section</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Full RSVP tracking dashboard</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Mobile-optimised &amp; shareable link</li>
              <li className="flex items-center gap-2"><span className="text-gold">✓</span> Unlimited sharing &amp; edits</li>
            </ul>
            <Button asChild className="w-full font-body">
              <Link to="/templates">Browse Templates</Link>
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
