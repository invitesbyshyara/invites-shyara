import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  BarChart3,
  BellRing,
  ChevronRight,
  Eye,
  Gift,
  Globe2,
  Heart,
  Hotel,
  Link2,
  Palette,
  PartyPopper,
  Plane,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import PhoneMockup from "@/components/PhoneMockup";
import PurchaseCtaButton from "@/components/PurchaseCtaButton";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import { allTemplates, getTemplatesByCategory } from "@/templates/registry";
import { TemplateConfig } from "@/types";
import { getPackageDisplayName } from "@/lib/packageCatalog";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const categories = [
  { name: "Wedding", emoji: "Wedding", value: "wedding" as const },
].map((item) => ({ ...item, count: getTemplatesByCategory(item.value).length }));

const faqs = [
  ["Can I preview a design before I buy?", "Yes. You can browse every template, use the studio preview, and open a live sample before purchasing."],
  ["What exactly is included after purchase?", "Package A includes the full feature set. Package B starts with the live invite only, then lets you unlock event management later."],
  ["Can I collect stay or travel details from guests?", "Yes. You can ask guests about accommodation and transport needs, then manage hotel, room, shuttle, and support notes from your dashboard."],
  ["Can my partner or planner help manage the invite?", "Yes. You can invite collaborators and control whether they can edit content, manage RSVPs, send reminders, view reports, or handle guest support."],
  ["Can I send reminders only to selected guests?", "Yes. Broadcasts can be sent by response status, guest segment, language, or to guests who still have not RSVP'd."],
  ["Do guests need an app or login?", "No. Guests open one web link in their browser, switch language if needed, and RSVP directly on the page."],
] as const;

const includedFeatures = [
  {
    icon: Sparkles,
    title: "Premium live invite",
    points: [
      "Animated, mobile-first invite experience",
      "Story, schedule, gallery, venue, and RSVP sections",
      "One polished link you can keep updating after publishing",
    ],
  },
  {
    icon: BarChart3,
    title: "Practical RSVP setup",
    points: [
      "Custom RSVP questions with sensible limits",
      "Guest count controls, adult/child split, meal choice, dietary notes",
      "Host-ready responses instead of messy free-text follow-up",
    ],
  },
  {
    icon: Hotel,
    title: "Travel and stay management",
    points: [
      "Track hotel assignment, room count, and stay dates",
      "Manage shuttle, airport pickup, parking, and support notes",
      "Useful when guests are traveling from different cities or countries",
    ],
  },
  {
    icon: BellRing,
    title: "Targeted guest updates",
    points: [
      "Send venue, timing, dress code, parking, weather, or photo updates",
      "Target only the guests who need the message",
      "Track who received, opened, or bounced",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Multi-host workspace",
    points: [
      "Invite your partner, planner, assistant, or family members",
      "Give each person only the permissions they need",
      "Keep content editing and guest operations in one shared place",
    ],
  },
  {
    icon: Globe2,
    title: "Multilingual guest experience",
    points: [
      "Choose site languages for your invite",
      "Let guests open a preselected language from their unique link",
      "Localize RSVP questions and reminder messages",
    ],
  },
];

const hostTools = [
  {
    icon: Palette,
    title: "Before you share",
    desc: "Choose the design confidently, then set up the guest flow properly before anyone sees the link.",
    bullets: [
      "Studio preview and live sample before payment",
      "Personalize names, venue, media, schedule, and sections",
      "Set RSVP rules, questions, and guest limits before publishing",
    ],
  },
  {
    icon: Users,
    title: "While guests respond",
    desc: "Keep responses organized without juggling spreadsheets, chat threads, and last-minute manual reminders.",
    bullets: [
      "Track guest records, households, plus-ones, and notes",
      "Send segmented reminders to pending or selected audiences",
      "Work with collaborators without giving everyone full access",
    ],
  },
  {
    icon: Plane,
    title: "Final-week operations",
    desc: "Turn RSVPs into numbers your vendors and coordinators can actually use.",
    bullets: [
      "Automatic meal counts, headcount split, and room summaries",
      "Transport demand and missing-information alerts",
      "CSV exports for caterer sheet, room block, shuttle manifest, and more",
    ],
  },
];

const valuePillars = [
  {
    icon: Heart,
    title: "Not just a pretty template",
    desc: "The guest-facing design is polished, but the real value is the host system behind it.",
  },
  {
    icon: Link2,
    title: "One link, many jobs",
    desc: "Use the same invite link for sharing, RSVPs, updates, language selection, and guest communication.",
  },
  {
    icon: Users,
    title: "Built for real events",
    desc: "Useful when multiple people are helping, guests are traveling, or vendor counts need to be finalized fast.",
  },
];

const quickAssurances = [
  { title: "Two packages", desc: "Package A is full-featured. Package B starts invite-only." },
  { title: "Guests need no app", desc: "Everything opens in a normal browser." },
  { title: "3 month validity", desc: "Renew only if you want to keep the invite active after that." },
  { title: "Upgrade later", desc: "Package B can unlock event management whenever you need it." },
];

const TemplateCard = ({
  template,
  currency,
  formatPrice,
}: {
  template: TemplateConfig;
  currency: "USD" | "EUR";
  formatPrice: (cents: number) => string;
}) => {
  const price = currency === "USD" ? template.priceUsd : template.priceEur;

  return (
    <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg">
      <div className="relative aspect-[3/4] overflow-hidden">
        <TemplateThumbnail config={template} />
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <span className="rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-medium capitalize backdrop-blur-sm">
            {template.category.replace("-", " ")}
          </span>
          <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-medium text-gold-foreground">
            {formatPrice(price)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif font-semibold">{template.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground font-body">
          {getPackageDisplayName(template.packageCode)} · {template.packageCode === "package_a"
            ? "Includes the full event-management feature set."
            : "Starts with the invite only and can unlock event tools later."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(template.packageCode === "package_a" ? ["RSVP", "Broadcasts", "Ops Pack"] : ["Premium Design", "Invite", "Add-On Ready"]).map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1 text-xs"><Link to={`/templates/${template.slug}/preview`}>Preview</Link></Button>
          <Button asChild size="sm" variant="outline" className="flex-1 text-xs"><Link to={`/samples/${template.slug}`}>Live Sample</Link></Button>
          <PurchaseCtaButton slug={template.slug} openLabel="Buy" size="sm" className="flex-1 text-xs" />
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { currency, formatPrice } = useCurrency();
  const [featured, setFeatured] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [selectedDot, setSelectedDot] = useState(0);

  const showcaseTemplate = featured[0] ?? allTemplates[0]!;

  useEffect(() => {
    let mounted = true;
    api.getTemplates({ sort: "popular" })
      .then((items) => {
        if (mounted) setFeatured(items.slice(0, 8));
      })
      .catch(() => {
        if (mounted) setFeatured(allTemplates.slice(0, 8));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedDot(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { threshold: 0 });
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section ref={heroRef} className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="pointer-events-none absolute left-10 top-14 h-72 w-72 rounded-full bg-rose-light opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-14 right-10 h-64 w-64 rounded-full bg-peach opacity-15 blur-3xl" />

        <div className="container relative z-10 flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl flex-1 text-center lg:text-left">
            <motion.p variants={fadeUp} className="mb-6 text-xs uppercase tracking-[0.35em] text-gold font-body">
              Premium Invite + Guest Management
            </motion.p>
            <motion.h1 variants={fadeUp} className="mb-6 font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Premium digital invites with real host tools built in
            </motion.h1>
            <motion.p variants={fadeUp} className="mb-8 text-lg text-muted-foreground font-body">
              Shyara is not only a beautiful invite link. It gives you RSVP control, targeted reminders, travel and stay tracking, collaborator access, multilingual guest support, and export-ready event operations.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="px-8 text-base">
                <Link to="/templates">Browse Templates</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 text-base">
                <Link to="/samples/rustic-charm">Open Live Sample</Link>
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Choose A or B", "Preview before purchase", "3 month validity", "No app for guests"].map((item) => (
                <span key={item} className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <div className="w-full max-w-sm">
            <PhoneMockup className="drop-shadow-2xl">
              <TemplateThumbnail config={showcaseTemplate} />
            </PhoneMockup>
          </div>
        </div>

        <div className="container relative z-10 mt-14">
          <div className="grid gap-4 rounded-2xl border border-border bg-card/65 px-6 py-6 backdrop-blur-sm md:grid-cols-2 xl:grid-cols-4">
            {quickAssurances.map((item) => (
              <div key={item.title} className="rounded-xl bg-background/60 p-4">
                <p className="font-display text-lg font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-muted/40 px-6 py-20">
        <div className="container max-w-6xl">
          <h2 className="mb-4 text-center font-serif text-3xl font-bold md:text-4xl">How It Works</h2>
          <div className="mx-auto mb-14 h-0.5 w-20 rounded-full bg-gradient-to-r from-rose to-gold" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5">
            {[
              { icon: Eye, title: "Compare designs", desc: "Browse templates, studio previews, and full live samples before you pay." },
              { icon: Gift, title: "Choose your package", desc: "Package A includes all features. Package B starts invite-only and can upgrade later." },
              { icon: Palette, title: "Personalize properly", desc: "Add names, venue, photos, sections, and RSVP settings in the dashboard." },
              { icon: Smartphone, title: "Publish one link", desc: "Share the live invite anywhere and keep using the same link after edits." },
              { icon: PartyPopper, title: "Run guest ops", desc: "Track responses, send updates, manage travel or stay, and export vendor sheets." },
            ].map((item, index) => (
              <div key={item.title} className="text-center">
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-card text-primary">
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-serif text-base font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="included" className="px-6 py-20">
        <div className="container max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">What Your Purchase Actually Includes</h2>
            <p className="text-muted-foreground font-body">
              The price is not only for a visual template. Each paid invite comes with the guest-facing design and the practical host workflows that usually end up spread across forms, spreadsheets, and chat threads.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {includedFeatures.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-serif text-xl font-semibold">{item.title}</h3>
                <div className="space-y-2">
                  {item.points.map((point) => (
                    <p key={point} className="text-sm leading-relaxed text-muted-foreground font-body">
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="host-tools" className="bg-muted/40 px-6 py-20">
        <div className="container max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
            <div>
              <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">Built for real host coordination</h2>
              <p className="mb-6 text-muted-foreground font-body">
                This is where the value shows up. Instead of using one tool for the invite, another for forms, and another for reminders, you manage the guest journey from one dashboard.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Users, label: "Custom RSVP and guest records" },
                  { icon: BellRing, label: "Segmented reminders and change alerts" },
                  { icon: Globe2, label: "Multilingual guest links and forms" },
                  { icon: BarChart3, label: "Automation summaries and export packs" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              {hostTools.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-semibold">{item.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground font-body">{item.desc}</p>
                  <div className="space-y-2">
                    {item.bullets.map((bullet) => (
                      <p key={bullet} className="text-sm leading-relaxed text-muted-foreground font-body">
                        {bullet}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="featured-templates" className="px-6 py-20">
        <div className="container">
          <h2 className="mb-4 text-center font-serif text-3xl font-bold md:text-4xl">Available Template</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-muted-foreground font-body">
            Rustic Charm is the available design. It includes the full host-side feature set for RSVP handling, reminders, guest coordination, and event operations.
          </p>

          {loading ? (
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-[3/4] rounded-xl" />)}
            </div>
          ) : (
            <>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mx-auto hidden max-w-6xl grid-cols-4 gap-5 md:grid">
                {featured.map((template) => <TemplateCard key={template.slug} template={template} currency={currency} formatPrice={formatPrice} />)}
              </motion.div>
              <div className="md:hidden">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-4">
                    {featured.map((template) => (
                      <div key={template.slug} className="min-w-0 flex-[0_0_82%]">
                        <TemplateCard template={template} currency={currency} formatPrice={formatPrice} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-center gap-1.5">
                  {featured.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => emblaApi?.scrollTo(index)}
                      className={`h-2 rounded-full transition-all ${index === selectedDot ? "w-5 bg-primary" : "w-2 bg-border"}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-muted/40 px-6 py-20">
        <div className="container max-w-5xl grid items-center gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <h2 className="mb-5 font-serif text-3xl font-bold md:text-4xl">See what guests actually open</h2>
            <p className="mb-6 text-muted-foreground font-body">
              Open a full sample invite and experience the cover, sections, RSVP flow, and pacing the same way your guests will.
            </p>
            <div className="mb-6 space-y-3 text-sm text-muted-foreground font-body">
              <p>Opening cover, invite sections, and RSVP on one live page</p>
              <p>Mobile-first layout designed for shared links</p>
              <p>A clear before-you-buy check so customers know what they are paying for</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/samples/rustic-charm">Open Sample Invite <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/templates">Compare Templates</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <PhoneMockup><TemplateThumbnail config={showcaseTemplate} /></PhoneMockup>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="container max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">Why hosts feel the price is worth it</h2>
            <p className="text-muted-foreground font-body">
              You are not only buying a design. You are paying to avoid fragmented workflows right when guest communication becomes time-sensitive.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {valuePillars.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-serif text-xl font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.value}
                to={`/templates?category=${category.value}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/30"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{category.emoji}</div>
                <div className="mt-2 font-serif text-lg font-semibold">{category.name}</div>
                <div className="mt-1 text-sm text-muted-foreground font-body">
                  {category.count} template{category.count !== 1 ? "s" : ""} with the same host-side feature set.
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-3">
            <div>
              <p className="text-3xl font-display font-bold">$4</p>
              <p className="text-sm text-muted-foreground font-body">One-time USD price per template</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">{"\u20AC"}5</p>
              <p className="text-sm text-muted-foreground font-body">One-time EUR price per template</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold">No recurring fees</p>
              <p className="text-sm text-muted-foreground font-body">3 month access window with renewal available later</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-muted/40 px-6 py-20">
        <div className="container max-w-3xl">
          <h2 className="mb-4 text-center font-serif text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>
          <div className="mx-auto mb-12 h-0.5 w-20 rounded-full bg-gradient-to-r from-rose to-gold" />
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {faqs.map(([question, answer], index) => (
              <div key={question} className={index < faqs.length - 1 ? "border-b border-border" : ""}>
                <button
                  onClick={() => setOpenFaq((current) => current === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="font-serif font-semibold">{question}</span>
                  <span className="text-xl leading-none text-muted-foreground">{openFaq === index ? "-" : "+"}</span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted-foreground font-body">{answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">Choose the design you love. Keep the host tools you need.</h2>
          <p className="mb-8 text-muted-foreground font-body">
            Preview your design first, pay once when you are confident, then run the invite, guest responses, reminders, and final-week operations from one place.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg"><Link to="/templates">Browse Templates</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/pricing">View Pricing</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-6 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground font-body md:flex-row">
          <div className="flex items-center gap-4">
            <Link to="/templates" className="transition-colors hover:text-foreground">Templates</Link>
            <Link to="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link to="/#faq" className="transition-colors hover:text-foreground">FAQ</Link>
            <Link to="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:text-foreground"
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>

      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 p-3 backdrop-blur-sm md:hidden">
          <div className="flex gap-2">
            <Button asChild className="flex-1"><Link to="/templates">Browse Templates</Link></Button>
            <Button asChild variant="outline" className="flex-1"><Link to="/pricing">View Pricing</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
