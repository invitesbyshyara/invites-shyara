import { useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, CalendarClock, Gem, Layers3, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import PurchaseCtaButton from "@/components/PurchaseCtaButton";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getCheckoutPrice, PACKAGE_FEATURE_MATRIX } from "@/lib/packageCatalog";

const faqs = [
  {
    q: "What is the difference between Package A and Package B?",
    a: "Package A includes the invite plus the full event-management feature set from day one. Package B starts with the invite only, then you can unlock event management later.",
  },
  {
    q: "Which package has the more premium design direction?",
    a: "Package B is the more premium-looking design line. Package A keeps the full feature set, but with a less premium design direction.",
  },
  {
    q: "How long does an invite stay active?",
    a: "Every invite stays valid for 3 months. After that, you can renew it to restore access.",
  },
  {
    q: "Can I add event management later to Package B?",
    a: "Yes. Package B customers can unlock the full event-management toolset later with a separate add-on purchase.",
  },
];

const packageHighlights = [
  {
    icon: Layers3,
    title: "Invite foundations",
    copy: "Both packages include the live invite itself, personalization, and a shareable guest link.",
  },
  {
    icon: Users,
    title: "Event management",
    copy: "RSVP tools, guest operations, reminders, collaborators, localization, and exports are included in Package A or unlocked later for Package B.",
  },
  {
    icon: CalendarClock,
    title: "Validity and renewal",
    copy: "Every invite stays active for 3 months. Renewal restores another full validity window.",
  },
  {
    icon: BellRing,
    title: "Upgrade flexibility",
    copy: "Package B lets you start with the premium invite design first and add event-management later if you need it.",
  },
];

const Pricing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { currency, formatPrice } = useCurrency();

  const packageA = formatPrice(getCheckoutPrice("initial_purchase", "package_a", currency));
  const packageB = formatPrice(getCheckoutPrice("initial_purchase", "package_b", currency));
  const addon = formatPrice(getCheckoutPrice("event_management_addon", "package_b", currency));
  const renewal = formatPrice(getCheckoutPrice("renewal", "package_a", currency));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Pricing</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Two packages, one invite platform, clear upgrade path</h1>
          <p className="mt-4 text-muted-foreground font-body">
            Choose the package that matches how much event-management support you want right now, then renew after 3 months only if you want to keep the invite active.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Package A</p>
                <h2 className="font-serif text-2xl font-bold">Full Feature Access</h2>
              </div>
            </div>

            <p className="mt-6 text-4xl font-serif font-bold">{packageA}</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">
              Less premium designs, but every feature is included from the start.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground font-body">
              <li>Live invite included</li>
              <li>RSVP and guest management included</li>
              <li>Reminders, collaborators, localization, and exports included</li>
              <li>Invite validity: 3 months</li>
            </ul>

            <PurchaseCtaButton slug="rustic-charm" openLabel="Choose Package A" className="mt-8 w-full" />
          </div>

          <div className="rounded-3xl border-2 border-gold bg-card p-8 shadow-romantic">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                <Gem className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Package B</p>
                <h2 className="font-serif text-2xl font-bold">Premium Invite First</h2>
              </div>
            </div>

            <p className="mt-6 text-4xl font-serif font-bold">{packageB}</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">
              More premium-looking designs, with only the invite included at first.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground font-body">
              <li>Live invite included</li>
              <li>More premium design direction</li>
              <li>Event management can be added later for {addon}</li>
              <li>Invite validity: 3 months</li>
            </ul>

            <PurchaseCtaButton slug="rustic-signature" openLabel="Choose Package B" className="mt-8 w-full" />
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-serif text-xl font-semibold">Package B add-on</h3>
            <p className="mt-3 text-muted-foreground font-body">
              Need RSVP tools, reminders, guest coordination, collaborators, localization, and exports later? Unlock event management for {addon}.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-serif text-xl font-semibold">Renewal</h3>
            <p className="mt-3 text-muted-foreground font-body">
              Every invite lasts for 3 months. Renewal is {renewal} and restores another 3 month access window.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-6xl rounded-3xl border border-border bg-card p-8">
          <h3 className="font-serif text-2xl font-bold">Feature comparison</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">Feature</th>
                  <th className="pb-3 font-medium">Package A</th>
                  <th className="pb-3 font-medium">Package B</th>
                </tr>
              </thead>
              <tbody>
                {PACKAGE_FEATURE_MATRIX.map((feature) => (
                  <tr key={feature.key} className="border-b border-border/70 last:border-0">
                    <td className="py-4 font-medium text-foreground">{feature.label}</td>
                    <td className="py-4 text-muted-foreground">{feature.packageA}</td>
                    <td className="py-4 text-muted-foreground">{feature.packageB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {packageHighlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-body">{item.copy}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-8 text-center font-serif text-2xl font-bold">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={faq.q} className="border-b border-border">
              <button className="flex w-full items-center justify-between py-5 text-left group" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <h3 className="pr-4 font-serif font-semibold">{faq.q}</h3>
                <span className="shrink-0 text-lg text-muted-foreground transition-transform" style={{ transform: openFaq === index ? "rotate(45deg)" : "rotate(0)" }}>+</span>
              </button>
              {openFaq === index && <p className="animate-fade-in pb-5 text-sm leading-relaxed text-muted-foreground font-body">{faq.a}</p>}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="font-serif text-2xl font-bold">Preview first, then choose the package that fits your event</h3>
          <p className="mt-3 text-muted-foreground font-body">
            You can compare the designs, open live samples, and only pay when the package split feels right for your event.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-body"><Link to="/templates">Browse templates</Link></Button>
            <Button asChild size="lg" variant="outline" className="font-body"><Link to="/samples/rustic-signature">Open premium sample</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
