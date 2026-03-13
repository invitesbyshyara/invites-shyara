import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  Globe2,
  Hotel,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";

const faqs = [
  { q: "Can I preview everything before I pay?", a: "Yes. You can browse templates, use the studio preview, and open a live sample before purchasing." },
  { q: "Is this only for the visual invite design?", a: "No. The price covers the design plus the guest-management system behind it: RSVP setup, reminders, collaboration, multilingual links, and ops exports." },
  { q: "Can I edit my invite after publishing?", a: "Yes. You can keep editing the same invite and guests keep using the same link." },
  { q: "Can I send reminders only to some guests?", a: "Yes. You can target updates by response status, audience segment, language, or guests who still have not RSVP'd." },
  { q: "Can I manage travel and accommodation details?", a: "Yes. You can collect and manage stay requirements, rooming, transport needs, parking, and support notes." },
  { q: "Is this a subscription?", a: "No. It is a one-time payment per template with no recurring charges." },
];

const includedList = [
  "Full template preview before purchase",
  "Premium animated invite design",
  "Personalized live invite link",
  "Custom RSVP questions and practical limits",
  "Meal choice, dietary, adult/child, and guest count tracking",
  "Travel and stay management for guests",
  "Segmented reminder and change broadcasts",
  "Multi-host workspace with permissions",
  "Multilingual guest experience",
  "Operations summaries and CSV export pack",
  "Unlimited sharing and edits after purchase",
];

const groupedFeatures = [
  {
    icon: Sparkles,
    title: "Guest-facing invite",
    points: [
      "Beautiful live invite page with sections, animations, and RSVP",
      "Guests open one browser link with no app required",
      "Preview before purchase so the design is never a blind buy",
    ],
  },
  {
    icon: Users,
    title: "Host coordination",
    points: [
      "Custom RSVP setup, guest records, and household tracking",
      "Collaborator access for partner, planner, or family",
      "Useful when more than one person is helping manage the event",
    ],
  },
  {
    icon: BellRing,
    title: "Updates and reminders",
    points: [
      "Send venue, timing, dress code, parking, weather, or photo updates",
      "Target only the guests who need the message",
      "Track sent, opened, and bounced delivery status",
    ],
  },
  {
    icon: Hotel,
    title: "Travel and stay",
    points: [
      "Track hotel, room type, stay dates, and special support notes",
      "Manage shuttle and transport demand from the same dashboard",
      "Reduce last-minute coordination across calls and chat messages",
    ],
  },
  {
    icon: Globe2,
    title: "Multilingual support",
    points: [
      "Choose available guest languages",
      "Preselect language by unique link when needed",
      "Localize RSVP questions and reminder communication",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Final-week operations",
    points: [
      "Automatic meal counts, room summaries, and transport summaries",
      "Missing-information alerts before vendor deadlines",
      "CSV exports for caterer, venue, shuttle, room block, and check-in teams",
    ],
  },
];

const Pricing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { currency } = useCurrency();
  const displayPrice = currency === "USD" ? "$4.00" : "\u20AC5.00";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 font-serif text-3xl font-bold md:text-4xl">Simple pricing for a feature-complete invite system</h1>
          <p className="text-muted-foreground font-body">
            No hidden fees. No subscription. Preview first, then pay once per template for the invite design and the practical host workflows behind it.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-8 xl:grid-cols-[440px_minmax(0,1fr)]">
          <div className="rounded-2xl border-2 border-gold bg-card p-8 shadow-romantic">
            <span className="inline-flex rounded-full bg-gold px-4 py-1 text-xs font-medium text-gold-foreground">
              One-Time Payment
            </span>
            <h2 className="mt-5 font-serif text-2xl font-bold">Pay Per Template</h2>
            <p className="mt-2 text-4xl font-serif font-bold text-foreground">{displayPrice}</p>
            <p className="mt-2 text-sm text-muted-foreground font-body">
              Pay once for Rustic Charm, personalize after purchase, publish a live link, and continue editing later.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {["No subscription", "No per-guest fee", "Unlimited edits", "Unlimited sharing"].map((item) => (
                <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {item}
                </span>
              ))}
            </div>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground font-body">
              {includedList.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-gold">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="mt-8 w-full font-body">
              <Link to="/templates">Browse Templates</Link>
            </Button>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-serif text-2xl font-bold">What this price is really paying for</h3>
              <p className="mt-3 text-muted-foreground font-body">
                Hosts are not just buying a nice webpage. They are paying for the invite, the response system, the guest coordination layer, and the final-week operations tools that normally get handled manually.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {groupedFeatures.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h4 className="mb-3 font-serif text-xl font-semibold">{feature.title}</h4>
                  <div className="space-y-2">
                    {feature.points.map((point) => (
                      <p key={point} className="text-sm leading-relaxed text-muted-foreground font-body">{point}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <h3 className="font-serif text-xl font-bold">Best fit if you care about more than design</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-card p-4">
                  <p className="font-medium text-foreground">You want polished guest experience</p>
                  <p className="mt-1 text-sm text-muted-foreground font-body">A premium link guests can actually enjoy opening.</p>
                </div>
                <div className="rounded-xl bg-card p-4">
                  <p className="font-medium text-foreground">You need cleaner guest coordination</p>
                  <p className="mt-1 text-sm text-muted-foreground font-body">RSVPs, reminders, language handling, and support notes in one place.</p>
                </div>
                <div className="rounded-xl bg-card p-4">
                  <p className="font-medium text-foreground">You do not want final-week chaos</p>
                  <p className="mt-1 text-sm text-muted-foreground font-body">Meal counts, transport demand, rooming, and exports without rebuilding data manually.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-10 text-center font-serif text-2xl font-bold">Frequently Asked Questions</h2>
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
          <h3 className="mb-3 font-serif text-2xl font-bold">Preview the design first. Pay only when the full system feels worth it.</h3>
          <p className="mb-6 text-muted-foreground font-body">You can compare templates and open live samples before you spend anything.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-body"><Link to="/templates">Browse Templates</Link></Button>
            <Button asChild size="lg" variant="outline" className="font-body"><Link to="/samples/rustic-charm">Open Live Sample</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
