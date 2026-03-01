import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TemplateConfig } from '@/types';
import TemplateThumbnail from '@/components/TemplateThumbnail';
import PhoneMockup from '@/components/PhoneMockup';
import Navbar from '@/components/Navbar';
import { allTemplates, getTemplatesByCategory } from '@/templates/registry';
import {
  Eye, Sparkles, Smartphone, BarChart3, Link2, Palette, Gift,
  ChevronRight, Users, Heart, PartyPopper, ArrowUp, Quote,
  Instagram, MessageCircle, Youtube, Mail,
} from 'lucide-react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';

/* ── helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── Animated counter ── */
const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ── Category data ── */
const categoryData = [
  { name: 'Wedding', emoji: '💒', value: 'wedding' as const, gradient: 'from-[hsl(38,65%,50%,0.08)] to-transparent' },
  { name: 'Engagement', emoji: '💍', value: 'engagement' as const, gradient: 'from-[hsl(330,50%,65%,0.08)] to-transparent' },
  { name: 'Birthday', emoji: '🎂', value: 'birthday' as const, gradient: 'from-[hsl(350,85%,55%,0.08)] to-transparent' },
  { name: 'Baby Shower', emoji: '👶', value: 'baby-shower' as const, gradient: 'from-[hsl(210,70%,55%,0.08)] to-transparent' },
  { name: 'Corporate', emoji: '🏢', value: 'corporate' as const, gradient: 'from-[hsl(220,60%,50%,0.08)] to-transparent' },
  { name: 'Anniversary', emoji: '💕', value: 'anniversary' as const, gradient: 'from-[hsl(20,60%,45%,0.08)] to-transparent' },
].map(c => ({ ...c, count: getTemplatesByCategory(c.value).length }));

const testimonials = [
  { name: 'Ananya & Rohan', initials: 'AR', city: 'Mumbai', quote: 'Our guests couldn\'t stop talking about how beautiful our invitation was. It set the tone for the entire wedding!', event: 'Wedding', stars: 5, color: 'bg-primary/15 text-primary' },
  { name: 'Kavita Mehta', initials: 'KM', city: 'Delhi', quote: 'So easy to use! I had our engagement invite ready in 10 minutes. The RSVP tracking was a lifesaver.', event: 'Engagement', stars: 5, color: 'bg-gold/15 text-gold' },
  { name: 'Deepak Joshi', initials: 'DJ', city: 'Bangalore', quote: 'Used Shyara for my daughter\'s birthday. The template was gorgeous and sharing via WhatsApp was seamless.', event: 'Birthday', stars: 5, color: 'bg-accent-foreground/15 text-accent-foreground' },
];

const Home = () => {
  const { currency, formatPrice } = useCurrency();
  const [featured, setFeatured] = useState<TemplateConfig[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  

  const royalGold = allTemplates.find(t => t.slug === 'royal-gold')!;
  const floralGarden = allTemplates.find(t => t.slug === 'floral-garden');

  // Embla carousel for mobile featured templates
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const [selectedDot, setSelectedDot] = useState(0);

  useEffect(() => {
    setFeatured(allTemplates.slice(0, 8));
    setFeaturedLoading(false);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedDot(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  /* Sticky mobile CTA */
  useEffect(() => {
    if (!heroRef.current) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0 });
    obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);


  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════ NAV ═══════════════ */}
      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section ref={heroRef} className="relative py-20 md:py-32 px-6 overflow-hidden">
        {/* Animated mesh gradient background */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30 animate-mesh-gradient"
          style={{
            backgroundSize: '300% 300%',
            backgroundImage: 'linear-gradient(135deg, hsl(var(--gold) / 0.12), hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.1), hsl(var(--gold) / 0.06))',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.06),transparent_60%)]" />

        <div className="relative z-10 container flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex-1 text-center lg:text-left max-w-xl"
          >
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-xs uppercase tracking-[0.4em] text-gold mb-6 font-body">
              Premium Digital Invitations
            </motion.p>
            <motion.h1 variants={fadeUp} transition={{ duration: 0.5 }} className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Invitations as beautiful as your celebrations
            </motion.h1>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-muted-foreground font-body mb-8">
              Create stunning, personalized digital invitations for weddings, engagements, birthdays, and more. Share a beautiful link — guests RSVP in seconds.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/templates">Browse Templates</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/i/demo-invite">See a Live Example</Link>
              </Button>
            </motion.div>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-xs text-muted-foreground font-body mt-4">
              Starting Free · No credit card needed
            </motion.p>
          </motion.div>

          {/* Right: Dual phone mockups */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-shrink-0 relative lg:ml-12 xl:ml-20"
          >
            {/* Second phone (behind, desktop only) */}
            {floralGarden && (
              <div className="hidden lg:block absolute -left-16 top-8 opacity-60 -rotate-6 will-change-transform">
                <PhoneMockup scale={0.85}>
                  <TemplateThumbnail config={floralGarden} />
                </PhoneMockup>
              </div>
            )}
            {/* Main phone */}
            <div className="animate-phone-float will-change-transform">
              <PhoneMockup className="drop-shadow-2xl">
                <TemplateThumbnail config={royalGold} />
              </PhoneMockup>
            </div>
          </motion.div>
        </div>

        {/* Trust stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10 container mt-16"
        >
          <div className="flex flex-wrap justify-center lg:justify-start gap-0 py-6 px-8 rounded-2xl bg-card/60 dark:bg-card/80 backdrop-blur-sm border border-border">
            {[
              { icon: <PartyPopper className="w-5 h-5 text-gold" />, target: 5000, suffix: '+', label: 'Invites Created' },
              { icon: <Users className="w-5 h-5 text-primary" />, target: 50000, suffix: '+', label: 'Guests RSVPed' },
              { icon: <Sparkles className="w-5 h-5 text-gold" />, target: 0, suffix: '', label: 'Average Rating', isRating: true },
            ].map((stat, i, arr) => (
              <div key={stat.label} className={`text-center flex-1 ${i < arr.length - 1 ? 'border-r border-border' : ''} px-4`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {stat.icon}
                  <span className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {stat.isRating ? '4.9★' : <AnimatedCounter target={stat.target} suffix={stat.suffix} />}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ HOW IT WORKS — Connected Timeline ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-20 px-6 bg-muted/40 dark:bg-white/[0.02]"
      >
        <div className="container">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-4">How It Works</motion.h2>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="w-16 h-px bg-gold mx-auto mb-14" />

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-7 left-[10%] right-[10%] h-px bg-border z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
              {[
                { icon: <Eye className="w-5 h-5" />, title: 'Browse Templates', desc: 'Explore our curated collection of stunning designs' },
                { icon: <Users className="w-5 h-5" />, title: 'Register & Pay', desc: 'Create your account and unlock your chosen template' },
                { icon: <Palette className="w-5 h-5" />, title: 'Fill Your Details', desc: 'Add your event info, photos, and personal touches' },
                { icon: <Link2 className="w-5 h-5" />, title: 'Get Your Link', desc: 'Receive a unique, beautiful shareable URL' },
                { icon: <Smartphone className="w-5 h-5" />, title: 'Share with Guests', desc: 'Send via WhatsApp, email, or any platform' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }} className="text-center group relative z-10">
                  <div className="w-14 h-14 rounded-full bg-card border-2 border-primary/20 text-primary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 relative">
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold text-gold-foreground text-[10px] font-bold flex items-center justify-center font-body">
                      {i + 1}
                    </span>
                    {item.icon}
                  </div>
                  <h3 className="font-display font-semibold text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ FEATURED TEMPLATES ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={staggerContainer}
        className="py-20 px-6"
      >
        <div className="container">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Featured Templates</motion.h2>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="w-16 h-px bg-gold mx-auto mb-12" />

          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-3 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop grid */}
              <motion.div variants={staggerContainer} className="hidden md:grid grid-cols-4 gap-5 max-w-5xl mx-auto">
                {featured.map(t => (
                  <TemplateCard key={t.slug} t={t} currency={currency} formatPrice={formatPrice} />
                ))}
              </motion.div>

              {/* Mobile carousel */}
              <div className="md:hidden">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-4">
                    {featured.map(t => (
                      <div key={t.slug} className="flex-[0_0_70%] min-w-0">
                        <TemplateCard t={t} currency={currency} formatPrice={formatPrice} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {featured.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => emblaApi?.scrollTo(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === selectedDot ? 'bg-primary w-5' : 'bg-border'}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="font-body">
              <Link to="/templates">View All Templates →</Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════ SEE IT IN ACTION ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-20 px-6 bg-muted/40 dark:bg-white/[0.02] overflow-hidden"
      >
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-5xl mx-auto">
            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex-shrink-0">
              <PhoneMockup>
                <TemplateThumbnail config={royalGold} />
              </PhoneMockup>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex-1 text-center lg:text-left">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">See It In Action</h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-8">
                Your guests receive a stunning, animated invitation. Here's what they experience:
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: <Sparkles className="w-5 h-5 text-gold" />, text: 'Beautiful cover with "Tap to Open"' },
                  { icon: <Heart className="w-5 h-5 text-primary" />, text: 'Elegant reveal animation unique to each template' },
                  { icon: <Eye className="w-5 h-5 text-primary" />, text: 'Full event details, schedule & venue' },
                  { icon: <BarChart3 className="w-5 h-5 text-primary" />, text: 'RSVP form — guests respond in seconds' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">{step.icon}</div>
                    <span className="font-body text-sm text-foreground">{step.text}</span>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="font-body">
                <Link to="/i/demo-invite">Try the Live Demo <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ CATEGORIES — Rich Cards ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-20 px-6"
      >
        <div className="container">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-4">For Every Occasion</motion.h2>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="w-16 h-px bg-gold mx-auto mb-12" />
          <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {categoryData.map(cat => (
              <motion.div key={cat.name} variants={fadeUp} transition={{ duration: 0.4 }}>
                <Link
                  to={`/templates?category=${cat.value}`}
                  className={`group p-5 rounded-xl border border-border bg-gradient-to-br ${cat.gradient} bg-card hover:border-gold/30 hover:shadow-md hover:scale-[1.03] transition-all duration-300 text-center block`}
                >
                  <span className="text-3xl block mb-2">{cat.emoji}</span>
                  <h3 className="font-display font-semibold text-sm mb-1">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{cat.count} template{cat.count !== 1 ? 's' : ''}</p>
                  {/* Mini template thumbnails */}
                  <div className="flex justify-center gap-1 mt-3">
                    {getTemplatesByCategory(cat.value).slice(0, 3).map(t => (
                      <div key={t.slug} className="w-6 h-6 rounded-full border border-border overflow-hidden bg-muted">
                        <div className="w-full h-full scale-[3] origin-top">
                          <TemplateThumbnail config={t} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════ WHY SHYARA ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-20 px-6 bg-muted/40 dark:bg-white/[0.02]"
      >
        <div className="container">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Why Shyara</motion.h2>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="w-16 h-px bg-gold mx-auto mb-14" />
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: <Sparkles className="w-6 h-6" />, title: 'Stunning Designs', desc: 'Premium templates with beautiful opening animations that leave guests in awe' },
              { icon: <Smartphone className="w-6 h-6" />, title: 'Mobile-First', desc: 'Every invitation looks perfect on any device — especially mobile' },
              { icon: <BarChart3 className="w-6 h-6" />, title: 'RSVP Dashboard', desc: 'Track who\'s coming with a real-time guest response dashboard' },
              { icon: <Link2 className="w-6 h-6" />, title: 'Instant Sharing', desc: 'One beautiful link — share via WhatsApp, Instagram, email, or text' },
              { icon: <Palette className="w-6 h-6" />, title: 'Personalized', desc: 'Your names, dates, photos, and story — woven into every pixel' },
              { icon: <Gift className="w-6 h-6" />, title: 'Free & Premium', desc: 'Start with free templates or unlock premium designs for your special day' },
            ].map(item => (
              <motion.div key={item.title} variants={fadeUp} transition={{ duration: 0.4 }} className="text-center p-6 rounded-xl hover:bg-card transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════ TRUST COUNTERS ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="py-20 px-6"
      >
        <div className="container max-w-4xl">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { icon: <PartyPopper className="w-5 h-5 text-gold" />, target: 5000, suffix: '+', label: 'Invites Created' },
              { icon: <Heart className="w-5 h-5 text-primary" />, target: 2500, suffix: '+', label: 'Happy Couples' },
              { icon: <Users className="w-5 h-5 text-primary" />, target: 50000, suffix: '+', label: 'Guest RSVPs' },
            ].map((stat, i, arr) => (
              <div key={stat.label} className={i < arr.length - 1 ? 'border-r border-border' : ''}>
                <div className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground font-body mt-2 flex items-center justify-center gap-1.5">
                  {stat.icon} {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-20 px-6 bg-muted/40 dark:bg-white/[0.02]"
      >
        <div className="container">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="font-display text-3xl md:text-4xl font-bold text-center mb-4">Loved by Thousands</motion.h2>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="w-16 h-px bg-gold mx-auto mb-14" />
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {testimonials.map(t => (
              <motion.div key={t.name} variants={fadeUp} transition={{ duration: 0.4 }} className="p-6 bg-card rounded-xl border border-border relative">
                <Quote className="absolute top-4 right-4 w-8 h-8 text-muted-foreground/20" />
                <div className="text-gold text-sm mb-3">{'★'.repeat(t.stars)}</div>
                <p className="text-muted-foreground font-body text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-display font-bold text-xs`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{t.event} · {t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════ PRICING TEASER ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="py-16 px-6"
      >
        <div className="container max-w-2xl text-center">
          <div className="p-8 rounded-2xl border border-border bg-card">
            <Gift className="w-8 h-8 text-gold mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-3">Free templates forever.</h3>
            {/* Price anchoring */}
            <div className="flex items-center justify-center gap-3 mb-4 font-body text-sm">
              <span className="line-through text-muted-foreground">Traditional print {currency === 'USD' ? '$500+' : '�450+'}</span>
              <span className="text-foreground">→</span>
              <span className="text-gold font-semibold">Shyara from Free</span>
            </div>
            <p className="text-muted-foreground font-body mb-5">Premium designs from just <span className="text-gold font-semibold">{currency === 'USD' ? 'from $2.99' : 'from �2.49'}</span>.</p>
            {/* Mini template row */}
            <div className="flex justify-center gap-2 mb-6">
              {allTemplates.slice(0, 3).map(t => (
                <div key={t.slug} className="w-12 h-16 rounded-md border border-border overflow-hidden bg-muted">
                  <TemplateThumbnail config={t} />
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="font-body">
              <Link to="/pricing">View Pricing →</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="py-24 px-6 text-center bg-muted/40 dark:bg-white/[0.02]"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to create something beautiful?</h2>
          <p className="text-muted-foreground font-body mb-8">Join thousands of hosts who've made their celebrations unforgettable with Shyara.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 font-body">
              <Link to="/templates">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 font-body">
              <Link to="/i/demo-invite">See Live Demo</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-display text-lg font-bold mb-3">Shyara</div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
                Premium digital invitations for life's most beautiful moments.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="mailto:hello@shyara.com" className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10 transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Product</h4>
              <div className="space-y-2 text-sm font-body text-muted-foreground">
                <Link to="/templates" className="block hover:text-foreground transition-colors">Templates</Link>
                <Link to="/pricing" className="block hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/i/demo-invite" className="block hover:text-foreground transition-colors">Live Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Categories</h4>
              <div className="space-y-2 text-sm font-body text-muted-foreground">
                <Link to="/templates?category=wedding" className="block hover:text-foreground transition-colors">Wedding</Link>
                <Link to="/templates?category=engagement" className="block hover:text-foreground transition-colors">Engagement</Link>
                <Link to="/templates?category=birthday" className="block hover:text-foreground transition-colors">Birthday</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm mb-3">Account</h4>
              <div className="space-y-2 text-sm font-body text-muted-foreground">
                <Link to="/login" className="block hover:text-foreground transition-colors">Login</Link>
                <Link to="/register" className="block hover:text-foreground transition-colors">Register</Link>
                <Link to="/dashboard" className="block hover:text-foreground transition-colors">Dashboard</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground font-body">© 2026 Shyara. All rights reserved.</p>
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors">Privacy</Link>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors">Terms</Link>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground font-body">Made in India with ❤️</p>
              <button
                onClick={scrollToTop}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                aria-label="Back to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════ STICKY MOBILE CTA ═══════════════ */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-sm p-3 animate-fade-in">
          <Button asChild className="w-full font-body">
            <Link to="/templates">Browse Templates</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

/* ── Template Card Component ── */
const TemplateCard = ({
  t,
  currency,
  formatPrice,
}: {
  t: TemplateConfig;
  currency: 'USD' | 'EUR';
  formatPrice: (cents: number) => string;
}) => (
  <motion.div
    variants={fadeUp}
    transition={{ duration: 0.4 }}
    className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
  >
    <div className="aspect-[3/4] relative overflow-hidden">
      <TemplateThumbnail config={t} />
      <div className="absolute top-2 left-2 flex gap-1.5 z-10">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-body font-medium backdrop-blur-sm ${
          t.isPremium ? 'bg-gold/90 text-gold-foreground' : 'bg-card/90 border border-border'
        }`}>
          {t.isPremium ? formatPrice(currency === 'USD' ? t.priceUsd : t.priceEur) : 'Free'}
        </span>
      </div>
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 dark:group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 z-10">
        <Button asChild size="sm" variant="secondary" className="text-xs">
          <Link to={`/templates/${t.slug}/preview`}>Preview</Link>
        </Button>
        <Button asChild size="sm" className="text-xs">
          <Link to={`/checkout/${t.slug}`}>Use This</Link>
        </Button>
      </div>
    </div>
    <div className="p-3">
      <h3 className="font-display font-semibold text-sm">{t.name}</h3>
      <p className="text-xs text-muted-foreground font-body capitalize">{t.category.replace('-', ' ')}</p>
    </div>
  </motion.div>
);

export default Home;


