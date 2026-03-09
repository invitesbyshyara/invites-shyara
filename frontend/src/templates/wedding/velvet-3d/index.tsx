import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

/* ─── Color palette ─── */
const c = {
  bg:      'hsl(340, 18%, 7%)',
  bgAlt:   'hsl(340, 16%, 10%)',
  bgCard:  'hsl(340, 20%, 13%)',
  heading: 'hsl(38, 70%, 72%)',
  body:    'hsl(340, 12%, 68%)',
  accent:  'hsl(340, 60%, 62%)',
  gold:    'hsl(38, 65%, 58%)',
  border:  'hsl(340, 25%, 20%)',
  borderGlow: 'hsl(38, 65%, 35%)',
  glow:    'hsl(340, 65%, 60%)',
  muted:   'hsl(340, 10%, 45%)',
};

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.13, duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

/* ─── Decorative: Gold Divider ─── */
const GoldDivider = () => (
  <div className="flex items-center justify-center gap-3 my-3">
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.gold})` }} />
    <div
      style={{
        width: 10, height: 10,
        background: c.gold,
        transform: 'rotate(45deg)',
        boxShadow: `0 0 12px ${c.gold}`,
      }}
    />
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
  </div>
);

/* ─── Decorative: Floating 3D Diamond ─── */
const Diamond3D = ({
  size = 36,
  duration = 14,
  delay = 0,
  opacity = 0.25,
  style = {},
}: {
  size?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
  style?: React.CSSProperties;
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={style}
    animate={{ rotateY: 360 }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ opacity, filter: `drop-shadow(0 0 8px ${c.gold})` }}
    >
      <polygon
        points="20,2 38,20 20,38 2,20"
        fill="none"
        stroke={c.gold}
        strokeWidth="1.5"
      />
      <polygon
        points="20,8 32,20 20,32 8,20"
        fill={c.gold}
        fillOpacity="0.08"
        stroke={c.gold}
        strokeWidth="0.5"
        strokeOpacity="0.5"
      />
    </svg>
  </motion.div>
);

/* ─── Interactive 3D tilt card ─── */
const Card3D = ({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 200, damping: 22 });
  const rotateY = useSpring(rawY, { stiffness: 200, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / rect.height;
    const y = (e.clientX - rect.left - rect.width / 2) / rect.width;
    rawX.set(-x * 7);
    rawY.set(y * 7);
  };
  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Shimmer keyframe (injected once) ─── */
const ShimmerStyle = () => (
  <style>{`
    @keyframes vt3d-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .vt3d-shimmer-text {
      background: linear-gradient(90deg, ${c.gold}, ${c.accent} 40%, ${c.gold} 60%, ${c.heading} 80%, ${c.gold});
      background-size: 250% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: vt3d-shimmer 5s linear infinite;
    }
    @keyframes vt3d-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 ${c.glow}44, 0 0 30px ${c.glow}22; }
      50% { box-shadow: 0 0 0 12px ${c.glow}00, 0 0 60px ${c.glow}33; }
    }
    .vt3d-pulse-ring {
      animation: vt3d-pulse-ring 3s ease-in-out infinite;
    }
    @keyframes vt3d-float-slow {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-18px) rotate(4deg); }
    }
    .vt3d-float { animation: vt3d-float-slow 7s ease-in-out infinite; }
    .vt3d-float-rev { animation: vt3d-float-slow 9s ease-in-out infinite reverse; }
    .vt3d-float-mid { animation: vt3d-float-slow 11s ease-in-out infinite 2s; }
  `}</style>
);

/* ══════════════════════════════════════════
   Main Template Component
══════════════════════════════════════════ */
const VelvetThreeD = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);

  const brideName  = data.brideName  || 'Bride';
  const groomName  = data.groomName  || 'Groom';
  const title      = `${brideName} & ${groomName}`;
  const photos: string[] = data.galleryPhotos || [];

  return (
    <>
      <ShimmerStyle />

      <InviteCover
        title={title}
        subtitle="Request the honour of your presence"
        date={data.weddingDate || ''}
        time={data.weddingTime || ''}
        slug={data.slug || 'preview'}
        isPreview={isPreview}
        theme="celestial-navy"
        onOpen={() => setIsOpened(true)}
      />

      {isOpened && (
        <div
          className="min-h-screen relative overflow-x-hidden"
          style={{ background: c.bg, fontFamily: "'Playfair Display', serif" }}
        >

          {/* ═══ HERO ═══ */}
          {config.supportedSections.includes('hero') && (
            <section
              className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 text-center overflow-hidden"
              style={{ background: `radial-gradient(ellipse at 50% 30%, hsl(340,25%,14%) 0%, ${c.bg} 65%)` }}
            >
              {/* Ambient glow orbs */}
              <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${c.glow}12 0%, transparent 70%)`, filter: 'blur(40px)' }} />
              <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${c.gold}10 0%, transparent 70%)`, filter: 'blur(40px)' }} />

              {/* Floating 3D Diamonds */}
              <Diamond3D size={28} duration={13} delay={0} opacity={0.3}
                style={{ top: '14%', left: '8%' }} />
              <Diamond3D size={20} duration={18} delay={2} opacity={0.2}
                style={{ top: '22%', right: '10%' }} />
              <Diamond3D size={40} duration={22} delay={1} opacity={0.15}
                style={{ bottom: '20%', left: '5%' }} />
              <Diamond3D size={16} duration={15} delay={3} opacity={0.25}
                style={{ bottom: '28%', right: '7%' }} />
              <Diamond3D size={24} duration={20} delay={0.5} opacity={0.18}
                style={{ top: '50%', left: '2%' }} />

              {/* 3D Name Stack */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ perspective: '1200px', perspectiveOrigin: '50% 40%' }}
                className="relative z-10 w-full max-w-3xl mx-auto"
              >
                {/* Label */}
                <motion.p
                  initial={{ opacity: 0, letterSpacing: '0.2em' }}
                  animate={{ opacity: 1, letterSpacing: '0.5em' }}
                  transition={{ duration: 1.2, delay: 0.2 }}
                  className="font-body text-[10px] uppercase mb-10"
                  style={{ color: c.gold }}
                >
                  Together with their families
                </motion.p>

                {/* Bride name — front plane */}
                <motion.div
                  initial={{ opacity: 0, z: -80, rotateX: 12 }}
                  animate={{ opacity: 1, z: 0, rotateX: 0 }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h1
                    className="vt3d-shimmer-text font-display leading-[0.9] font-bold"
                    style={{ fontSize: 'clamp(3rem, 12vw, 7rem)' }}
                  >
                    {brideName}
                  </h1>
                </motion.div>

                {/* Separator */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="my-6 flex items-center justify-center gap-6"
                >
                  <div className="h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${c.gold})` }} />
                  <motion.span
                    className="font-display text-4xl"
                    style={{ color: c.gold, textShadow: `0 0 30px ${c.gold}66` }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    &
                  </motion.span>
                  <div className="h-px w-20" style={{ background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
                </motion.div>

                {/* Groom name — back plane (depth) */}
                <motion.div
                  initial={{ opacity: 0, z: -120, rotateX: -12 }}
                  animate={{ opacity: 1, z: 0, rotateX: 0 }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h1
                    className="vt3d-shimmer-text font-display leading-[0.9] font-bold"
                    style={{ fontSize: 'clamp(3rem, 12vw, 7rem)' }}
                  >
                    {groomName}
                  </h1>
                </motion.div>

                {/* Date pill */}
                {data.weddingDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="mt-12 inline-flex items-center gap-5 px-8 py-4 rounded-full vt3d-pulse-ring"
                    style={{
                      border: `1px solid ${c.borderGlow}`,
                      background: `linear-gradient(135deg, ${c.bgCard}, hsl(340,22%,16%))`,
                    }}
                  >
                    <span className="font-display text-lg font-semibold" style={{ color: c.heading }}>
                      {data.weddingDate}
                    </span>
                    {data.weddingTime && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.gold }} />
                        <span className="font-body text-sm" style={{ color: c.body }}>
                          {data.weddingTime}
                        </span>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Scroll cue */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 2.5, delay: 2, repeat: Infinity }}
                  className="mt-16 flex flex-col items-center gap-2"
                >
                  <span className="font-body text-[10px] tracking-[0.4em] uppercase" style={{ color: c.muted }}>
                    Scroll
                  </span>
                  <div className="w-px h-8" style={{ background: `linear-gradient(${c.gold}, transparent)` }} />
                </motion.div>
              </motion.div>
            </section>
          )}

          {/* ═══ STORY ═══ */}
          {config.supportedSections.includes('story') && data.loveStory && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-28 px-6"
              style={{ background: c.bgAlt }}
            >
              <div className="max-w-2xl mx-auto text-center">
                <motion.div custom={0} variants={fadeUp}><GoldDivider /></motion.div>
                <motion.h2
                  custom={1} variants={fadeUp}
                  className="font-display text-3xl md:text-4xl font-bold mt-6 mb-8"
                  style={{ color: c.heading }}
                >
                  Our Story
                </motion.h2>
                <motion.div custom={2} variants={fadeUp}>
                  <Card3D
                    className="p-8 md:p-10 rounded-2xl text-left"
                    style={{
                      background: `linear-gradient(145deg, ${c.bgCard}, hsl(340,22%,16%))`,
                      border: `1px solid ${c.border}`,
                      boxShadow: `0 20px 60px hsl(340,30%,4%), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    }}
                  >
                    <p
                      className="font-body text-lg leading-[1.9] italic"
                      style={{ color: c.body }}
                    >
                      "{data.loveStory}"
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-8 h-0.5" style={{ background: c.gold }} />
                      <span className="font-display text-sm" style={{ color: c.gold }}>
                        {brideName} & {groomName}
                      </span>
                    </div>
                  </Card3D>
                </motion.div>
                <motion.div custom={3} variants={fadeUp} className="mt-6"><GoldDivider /></motion.div>
              </div>
            </motion.section>
          )}

          {/* ═══ SCHEDULE ═══ */}
          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-28 px-6"
              style={{ background: c.bg }}
            >
              <div className="max-w-2xl mx-auto">
                <motion.h2
                  custom={0} variants={fadeUp}
                  className="font-display text-3xl md:text-4xl font-bold text-center mb-4"
                  style={{ color: c.heading }}
                >
                  The Ceremony
                </motion.h2>
                <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-14">
                  <GoldDivider />
                </motion.div>

                <div className="relative">
                  {/* Vertical timeline line */}
                  <div
                    className="absolute left-6 top-0 bottom-0 w-px"
                    style={{ background: `linear-gradient(to bottom, transparent, ${c.borderGlow}, transparent)` }}
                  />

                  <div className="space-y-5 pl-16">
                    {(data.schedule as { time: string; title: string; description?: string }[]).map((item, i) => (
                      <motion.div key={i} custom={i + 2} variants={fadeUp}>
                        {/* Timeline dot */}
                        <div
                          className="absolute left-[18px] w-3.5 h-3.5 rounded-full"
                          style={{
                            background: c.gold,
                            boxShadow: `0 0 12px ${c.gold}88`,
                            top: `calc(${i * (100 / (data.schedule.length || 1))}% + 18px)`,
                            transform: 'translateY(-50%)',
                          }}
                        />
                        <div
                          className="p-5 rounded-xl"
                          style={{
                            background: `linear-gradient(145deg, ${c.bgCard}, hsl(340,22%,15%))`,
                            border: `1px solid ${c.border}`,
                            /* 3D extrusion effect */
                            boxShadow: `0 4px 0 hsl(340,25%,10%), 0 8px 0 hsl(340,25%,8%), 0 12px 30px hsl(340,30%,4%)`,
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 pt-0.5">
                              <span className="font-body font-bold text-sm" style={{ color: c.gold }}>
                                {item.time}
                              </span>
                            </div>
                            <div className="w-px self-stretch" style={{ background: c.border }} />
                            <div>
                              <h3 className="font-display font-semibold text-base" style={{ color: c.heading }}>
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="font-body text-sm mt-1" style={{ color: c.muted }}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ═══ VENUE ═══ */}
          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-28 px-6 text-center"
              style={{ background: c.bgAlt }}
            >
              <motion.h2
                custom={0} variants={fadeUp}
                className="font-display text-3xl md:text-4xl font-bold mb-4"
                style={{ color: c.heading }}
              >
                The Venue
              </motion.h2>
              <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-10">
                <GoldDivider />
              </motion.div>

              <motion.div custom={2} variants={fadeUp} className="max-w-xl mx-auto">
                <Card3D
                  className="p-8 rounded-2xl"
                  style={{
                    background: `linear-gradient(145deg, ${c.bgCard}, hsl(340,22%,15%))`,
                    border: `1px solid ${c.borderGlow}44`,
                    boxShadow: `0 30px 80px hsl(340,30%,4%), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  {/* Location pin icon */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{
                      background: `radial-gradient(circle, ${c.gold}22, transparent)`,
                      border: `1px solid ${c.borderGlow}`,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📍</span>
                  </div>

                  {data.venueName && (
                    <h3 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>
                      {data.venueName}
                    </h3>
                  )}
                  {data.venueAddress && (
                    <p className="font-body text-sm leading-relaxed" style={{ color: c.body }}>
                      {data.venueAddress}
                    </p>
                  )}

                  {/* Map placeholder */}
                  <div
                    className="mt-6 rounded-xl flex items-center justify-center font-body text-sm"
                    style={{
                      height: 140,
                      background: `linear-gradient(135deg, hsl(340,22%,10%), hsl(340,20%,14%))`,
                      border: `1px solid ${c.border}`,
                      color: c.muted,
                    }}
                  >
                    🗺️ View on Map
                  </div>
                </Card3D>
              </motion.div>
            </motion.section>
          )}

          {/* ═══ GALLERY ═══ */}
          {config.supportedSections.includes('gallery') && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-28 px-6"
              style={{ background: c.bg }}
            >
              <motion.h2
                custom={0} variants={fadeUp}
                className="font-display text-3xl md:text-4xl font-bold text-center mb-4"
                style={{ color: c.heading }}
              >
                Our Moments
              </motion.h2>
              <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-12">
                <GoldDivider />
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    custom={i + 2}
                    variants={scaleReveal}
                    whileHover={{ scale: 1.04, rotateZ: i % 2 === 0 ? 1.5 : -1.5 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                    className="aspect-square rounded-xl overflow-hidden"
                    style={{
                      border: `1px solid ${c.border}`,
                      boxShadow: `0 8px 32px hsl(340,30%,4%)`,
                    }}
                  >
                    {photos[i] ? (
                      <img
                        src={photos[i]}
                        alt={`Gallery photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-body text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${c.bgCard}, hsl(340,22%,16%))`,
                          color: c.muted,
                        }}
                      >
                        <span style={{ fontSize: 28, opacity: 0.4 }}>✦</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══ RSVP ═══ */}
          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-28 px-6 text-center"
              style={{ background: c.bgAlt }}
            >
              <motion.h2
                custom={0} variants={fadeUp}
                className="font-display text-3xl md:text-4xl font-bold mb-4"
                style={{ color: c.heading }}
              >
                RSVP
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="font-body mb-10" style={{ color: c.body }}>
                We'd be honoured to celebrate with you
              </motion.p>
              {data.rsvpDeadline && (
                <motion.p custom={2} variants={fadeUp} className="font-body text-xs mb-8" style={{ color: c.muted }}>
                  Kindly respond by {data.rsvpDeadline}
                </motion.p>
              )}
              <motion.div custom={3} variants={fadeUp} className="max-w-md mx-auto">
                <Card3D
                  className="p-8 rounded-2xl"
                  style={{
                    background: `linear-gradient(145deg, ${c.bgCard}, hsl(340,22%,15%))`,
                    border: `1px solid ${c.borderGlow}55`,
                    boxShadow: `0 30px 80px hsl(340,30%,4%), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  <InviteRsvpForm inviteId={inviteId} />
                </Card3D>
              </motion.div>
            </motion.section>
          )}

          {/* ═══ FOOTER ═══ */}
          <footer
            className="py-20 text-center relative overflow-hidden"
            style={{ borderTop: `1px solid ${c.border}`, background: c.bg }}
          >
            {/* Subtle glow behind footer */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
              style={{ background: `radial-gradient(ellipse, ${c.gold}08 0%, transparent 70%)`, filter: 'blur(20px)' }}
            />

            <div className="relative z-10">
              <GoldDivider />
              <p
                className="font-display text-xl mt-5 mb-1"
                style={{ color: c.heading }}
              >
                {brideName} & {groomName}
              </p>
              {data.weddingDate && (
                <p className="font-body text-xs mb-4" style={{ color: c.muted }}>
                  {data.weddingDate}
                </p>
              )}
              <p className="font-body text-[10px] tracking-[0.3em] uppercase" style={{ color: c.muted }}>
                Made with love on{' '}
                <span style={{ color: c.gold, fontWeight: 600 }}>Shyara</span>
              </p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

export default VelvetThreeD;
