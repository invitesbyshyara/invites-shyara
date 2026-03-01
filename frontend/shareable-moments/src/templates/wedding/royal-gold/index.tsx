import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

const g = {
  bg: 'hsl(38,30%,6%)',
  bgAlt: 'hsl(38,25%,8%)',
  bgCard: 'hsl(38,20%,10%)',
  heading: 'hsl(38,60%,70%)',
  body: 'hsl(38,20%,55%)',
  accent: 'hsl(38,65%,50%)',
  accentLight: 'hsl(38,55%,65%)',
  border: 'hsl(38,30%,18%)',
  muted: 'hsl(38,15%,35%)',
  shimmer: 'linear-gradient(90deg, transparent 0%, hsl(38,65%,50%,0.08) 50%, transparent 100%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  }),
};

const Ornament = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="120" height="20" viewBox="0 0 120 20" fill="none">
    <path d="M0 10 Q30 0 60 10 Q90 20 120 10" stroke={g.accent} strokeWidth="0.5" fill="none" opacity="0.5" />
    <circle cx="60" cy="10" r="3" fill={g.accent} opacity="0.4" />
    <circle cx="30" cy="5" r="1.5" fill={g.accent} opacity="0.3" />
    <circle cx="90" cy="15" r="1.5" fill={g.accent} opacity="0.3" />
  </svg>
);

const FloatingParticle = ({ delay, x, size }: { delay: number; x: string; size: number }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: x, width: size, height: size, background: g.accent, opacity: 0.15 }}
    initial={{ y: '100vh' }}
    animate={{ y: '-10vh' }}
    transition={{ duration: 15 + Math.random() * 10, delay, repeat: Infinity, ease: 'linear' }}
  />
);

const ParallaxSection = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  return (
    <motion.section ref={ref} style={{ y, ...style }} className={className}>
      {children}
    </motion.section>
  );
};

const CountdownUnit = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="font-display text-3xl md:text-5xl font-bold" style={{ color: g.heading }}>{value}</span>
    <span className="text-[10px] uppercase tracking-[0.3em] mt-2 font-body" style={{ color: g.muted }}>{label}</span>
  </div>
);

const RoyalGold = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.brideName || 'Bride'} & ${data.groomName || 'Groom'}`;

  return (
    <>
      <InviteCover
        title={title}
        subtitle="Together with their families"
        date={data.weddingDate || ''}
        time={data.weddingTime || ''}
        slug={data.slug || 'preview'}
        isPreview={isPreview}
        theme="gold"
        onOpen={() => setIsOpened(true)}
      />

      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: g.bg }}>
          {/* Ambient floating particles */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <FloatingParticle key={i} delay={i * 2} x={`${10 + i * 12}%`} size={3 + Math.random() * 4} />
            ))}
          </div>

          {/* Shimmer overlay */}
          <div className="fixed inset-0 pointer-events-none z-10 opacity-30" style={{ background: g.shimmer, backgroundSize: '200% 100%', animation: 'shimmer 8s linear infinite' }} />

          {/* ─── HERO ─── */}
          {config.supportedSections.includes('hero') && (
            <motion.section
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative py-32 md:py-44 px-6 text-center z-20"
            >
              {/* Top ornamental line */}
              <motion.div custom={0} variants={fadeUp} className="flex flex-col items-center mb-10">
                <div className="w-px h-24" style={{ background: `linear-gradient(180deg, transparent, ${g.accent})` }} />
                <div className="w-2 h-2 rounded-full mt-1" style={{ background: g.accent, boxShadow: `0 0 12px ${g.accent}` }} />
              </motion.div>

              <motion.p custom={1} variants={fadeUp} className="text-[10px] uppercase tracking-[0.6em] font-body mb-10" style={{ color: g.body }}>
                Together with their families
              </motion.p>

              <motion.h1 custom={2} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-2 leading-[0.9]" style={{ color: g.heading }}>
                {data.brideName || 'Bride'}
              </motion.h1>

              <motion.div custom={3} variants={scaleReveal} className="my-6 flex items-center justify-center gap-6">
                <div className="h-px w-16 md:w-24" style={{ background: `linear-gradient(90deg, transparent, ${g.accent})` }} />
                <span className="font-display text-4xl italic" style={{ color: g.accent, textShadow: `0 0 20px ${g.accent}` }}>&</span>
                <div className="h-px w-16 md:w-24" style={{ background: `linear-gradient(90deg, ${g.accent}, transparent)` }} />
              </motion.div>

              <motion.h1 custom={4} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-10 leading-[0.9]" style={{ color: g.heading }}>
                {data.groomName || 'Groom'}
              </motion.h1>

              <motion.p custom={5} variants={fadeUp} className="text-sm font-body tracking-wide" style={{ color: g.body }}>
                request the pleasure of your company at their wedding celebration
              </motion.p>

              {/* Date pill */}
              {data.weddingDate && (
                <motion.div custom={6} variants={scaleReveal} className="mt-10 inline-flex items-center gap-5 px-10 py-5 rounded-full border" style={{ borderColor: g.border, background: `linear-gradient(135deg, ${g.bgCard}, ${g.bgAlt})`, boxShadow: `0 0 40px hsl(38,65%,50%,0.08)` }}>
                  <span className="font-display text-lg font-semibold tracking-wide" style={{ color: g.accentLight }}>{data.weddingDate}</span>
                  {data.weddingTime && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.accent, boxShadow: `0 0 6px ${g.accent}` }} />
                      <span className="font-body text-sm" style={{ color: g.body }}>{data.weddingTime}</span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Bottom ornament */}
              <motion.div custom={7} variants={fadeUp} className="flex flex-col items-center mt-12">
                <div className="w-2 h-2 rounded-full" style={{ background: g.accent, boxShadow: `0 0 12px ${g.accent}` }} />
                <div className="w-px h-24 mt-1" style={{ background: `linear-gradient(180deg, ${g.accent}, transparent)` }} />
              </motion.div>
            </motion.section>
          )}

          {/* ─── COUNTDOWN ─── */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-16 px-6 z-20 relative">
            <motion.div custom={0} variants={scaleReveal} className="max-w-xl mx-auto flex items-center justify-center gap-8 md:gap-12 py-8 px-6 rounded-2xl border" style={{ background: g.bgCard, borderColor: g.border }}>
              <CountdownUnit value="06" label="Months" />
              <span className="font-display text-2xl" style={{ color: g.accent }}>:</span>
              <CountdownUnit value="15" label="Days" />
              <span className="font-display text-2xl" style={{ color: g.accent }}>:</span>
              <CountdownUnit value="08" label="Hours" />
            </motion.div>
          </motion.section>

          {/* ─── STORY ─── */}
          {config.supportedSections.includes('story') && data.loveStory && (
            <ParallaxSection className="py-28 px-6 z-20 relative">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="max-w-2xl mx-auto text-center">
                <motion.div custom={0} variants={fadeUp}><Ornament className="mx-auto mb-10" /></motion.div>
                <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-10" style={{ color: g.heading }}>Our Love Story</motion.h2>
                <motion.p custom={2} variants={fadeUp} className="text-lg leading-[1.9] font-body" style={{ color: g.body }}>
                  {data.loveStory}
                </motion.p>
                <motion.div custom={3} variants={fadeUp}><Ornament className="mx-auto mt-10" /></motion.div>
              </motion.div>
            </ParallaxSection>
          )}

          {/* ─── SCHEDULE ─── */}
          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-20 relative" style={{ background: g.bgAlt }}>
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: g.heading }}>
                  Wedding Schedule
                </motion.h2>
                <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-16">
                  <Ornament />
                </motion.div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[50%] md:left-8 top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, transparent, ${g.accent}, transparent)` }} />

                  <div className="space-y-12">
                    {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                      <motion.div key={i} custom={i + 2} variants={fadeUp} className="relative flex flex-col md:flex-row gap-4 md:gap-10 items-start">
                        {/* Timeline dot */}
                        <div className="hidden md:block absolute left-8 top-3 -translate-x-1/2">
                          <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: g.accent, background: g.bg, boxShadow: `0 0 12px ${g.accent}` }} />
                        </div>
                        <div className="md:w-16 shrink-0" />
                        <div className="md:ml-8 flex-1 p-6 rounded-xl border" style={{ background: g.bgCard, borderColor: g.border }}>
                          <span className="text-xs uppercase tracking-[0.3em] font-body" style={{ color: g.accent }}>{item.time}</span>
                          <h3 className="font-display font-semibold text-xl mt-2 mb-1" style={{ color: g.heading }}>{item.title}</h3>
                          {item.description && <p className="text-sm font-body" style={{ color: g.body }}>{item.description}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ─── VENUE ─── */}
          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <ParallaxSection className="py-28 px-6 text-center z-20 relative">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: g.heading }}>The Venue</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-12"><Ornament /></motion.div>
                {data.venueName && (
                  <motion.p custom={2} variants={fadeUp} className="font-display text-2xl md:text-3xl font-medium mb-3" style={{ color: g.accentLight }}>{data.venueName}</motion.p>
                )}
                {data.venueAddress && (
                  <motion.p custom={3} variants={fadeUp} className="font-body text-lg mb-10" style={{ color: g.body }}>{data.venueAddress}</motion.p>
                )}
                <motion.div custom={4} variants={scaleReveal} className="max-w-3xl mx-auto h-72 rounded-2xl flex items-center justify-center font-body border overflow-hidden relative" style={{ background: g.bgCard, borderColor: g.border }}>
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, hsl(38,65%,50%,0.05) 0%, transparent 70%)` }} />
                  <span style={{ color: g.muted }}>🗺️ Map will appear here</span>
                </motion.div>
              </motion.div>
            </ParallaxSection>
          )}

          {/* ─── GALLERY ─── */}
          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-20 relative" style={{ background: g.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: g.heading }}>Our Gallery</motion.h2>
              <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-16"><Ornament /></motion.div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i} custom={i + 1} variants={scaleReveal}
                    whileHover={{ scale: 1.04, rotate: i % 2 === 0 ? 1 : -1 }}
                    className="aspect-square rounded-xl flex items-center justify-center text-sm font-body border cursor-pointer overflow-hidden relative group"
                    style={{ background: g.bgCard, borderColor: g.border, color: g.muted }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle, hsl(38,65%,50%,0.1), transparent)` }} />
                    📸 Photo {i}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── RSVP ─── */}
          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-20 relative">
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: g.heading }}>RSVP</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-6"><Ornament /></motion.div>
                <motion.p custom={2} variants={fadeUp} className="font-body mb-10" style={{ color: g.body }}>
                  Kindly let us know if you'll grace us with your presence
                </motion.p>
                <motion.div custom={3} variants={fadeUp} className="p-8 rounded-2xl border" style={{ background: g.bgCard, borderColor: g.border }}>
                  <InviteRsvpForm inviteId={inviteId} />
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* ─── FOOTER ─── */}
          <footer className="py-20 text-center z-20 relative" style={{ borderTop: `1px solid ${g.border}` }}>
            <Ornament className="mx-auto mb-6" />
            <p className="font-display text-xl mb-2" style={{ color: g.accentLight }}>{data.brideName} & {data.groomName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase" style={{ color: g.muted }}>
              Made with love on <span style={{ color: g.accent }}>Shyara</span>
            </p>
          </footer>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
};

export default RoyalGold;
