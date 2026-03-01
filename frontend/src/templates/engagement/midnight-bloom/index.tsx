import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

const c = {
  bg: 'hsl(280,20%,6%)',
  bgAlt: 'hsl(310,18%,9%)',
  bgCard: 'hsl(290,15%,12%)',
  heading: 'hsl(330,40%,85%)',
  body: 'hsl(330,15%,55%)',
  accent: 'hsl(330,50%,65%)',
  accentGlow: 'hsl(330,60%,55%)',
  border: 'hsl(280,15%,18%)',
  muted: 'hsl(280,10%,30%)',
  petal1: 'hsl(330,50%,65%)',
  petal2: 'hsl(280,40%,55%)',
  petal3: 'hsl(350,45%,60%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const bloomIn = {
  hidden: { opacity: 0, scale: 0.5, rotate: -15 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, rotate: 0,
    transition: { delay: i * 0.1, duration: 0.9, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  }),
};

// Floating petals
const Petal = ({ delay, startX, color }: { delay: number; startX: number; color: string }) => {
  const size = 8 + Math.random() * 14;
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        width: size,
        height: size * 0.7,
        background: color,
        borderRadius: '50% 0 50% 0',
        opacity: 0.12,
        filter: 'blur(1px)',
      }}
      initial={{ y: '-5vh', rotate: 0 }}
      animate={{ y: '110vh', rotate: 360 }}
      transition={{ duration: 18 + Math.random() * 12, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
};

const FloralDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-12 md:w-20" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <motion.span
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ color: c.accent, fontSize: 18 }}
    >✿</motion.span>
    <div className="h-px w-12 md:w-20" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const MidnightBloom = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.partnerOneName || 'Partner'} & ${data.partnerTwoName || 'Partner'}`;

  return (
    <>
      <InviteCover
        title={title}
        subtitle="You're Invited to Celebrate"
        date={data.engagementDate || ''}
        time={data.engagementTime || ''}
        slug={data.slug || 'preview'}
        isPreview={isPreview}
        theme="dark-floral"
        onOpen={() => setIsOpened(true)}
      />

      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: c.bg }}>
          {/* Floating petals */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <Petal key={i} delay={i * 1.5} startX={Math.random() * 100} color={[c.petal1, c.petal2, c.petal3][i % 3]} />
            ))}
          </div>

          {/* Radial glow */}
          <div className="fixed inset-0 pointer-events-none z-0" style={{
            background: `radial-gradient(ellipse at 50% 0%, hsl(330,50%,20%,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, hsl(280,40%,15%,0.1) 0%, transparent 50%)`
          }} />

          {/* ─── HERO ─── */}
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative py-36 md:py-48 px-6 text-center z-10">
              <motion.p custom={0} variants={fadeUp} className="text-[10px] uppercase tracking-[0.6em] font-body mb-10" style={{ color: c.accent }}>
                ✿ An Engagement Celebration ✿
              </motion.p>

              <motion.h1 custom={1} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-2 leading-[0.9]" style={{ color: c.heading, textShadow: `0 0 60px hsl(330,50%,65%,0.15)` }}>
                {data.partnerOneName || 'Partner'}
              </motion.h1>

              <motion.div custom={2} variants={bloomIn} className="my-6 flex items-center justify-center gap-6">
                <div className="h-px w-16 md:w-24" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-4xl"
                  style={{ color: c.accent, textShadow: `0 0 20px ${c.accentGlow}` }}
                >♥</motion.span>
                <div className="h-px w-16 md:w-24" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
              </motion.div>

              <motion.h1 custom={3} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-10 leading-[0.9]" style={{ color: c.heading, textShadow: `0 0 60px hsl(330,50%,65%,0.15)` }}>
                {data.partnerTwoName || 'Partner'}
              </motion.h1>

              <motion.p custom={4} variants={fadeUp} className="text-lg font-body" style={{ color: c.body }}>
                are getting engaged!
              </motion.p>

              {data.engagementDate && (
                <motion.div custom={5} variants={bloomIn} className="mt-10 inline-flex items-center gap-5 px-10 py-5 rounded-full border" style={{ borderColor: c.border, background: c.bgCard, boxShadow: `0 0 40px hsl(330,50%,65%,0.08)` }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.accent }}>{data.engagementDate}</span>
                  {data.engagementTime && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent, boxShadow: `0 0 8px ${c.accentGlow}` }} />
                      <span className="font-body text-sm" style={{ color: c.body }}>{data.engagementTime}</span>
                    </>
                  )}
                </motion.div>
              )}
            </motion.section>
          )}

          {/* ─── STORY ─── */}
          {config.supportedSections.includes('story') && data.ourStory && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <motion.div custom={0} variants={fadeUp}><FloralDivider /></motion.div>
                <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mt-8 mb-10" style={{ color: c.heading }}>Our Story</motion.h2>
                <motion.blockquote custom={2} variants={fadeUp} className="text-lg leading-[1.9] font-body italic relative px-6" style={{ color: c.body }}>
                  <span className="absolute -top-4 -left-2 text-5xl font-display" style={{ color: c.accent, opacity: 0.3 }}>"</span>
                  {data.ourStory}
                  <span className="absolute -bottom-8 -right-2 text-5xl font-display" style={{ color: c.accent, opacity: 0.3 }}>"</span>
                </motion.blockquote>
                <motion.div custom={3} variants={fadeUp} className="mt-14"><FloralDivider /></motion.div>
              </div>
            </motion.section>
          )}

          {/* ─── SCHEDULE ─── */}
          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: c.heading }}>Evening Schedule</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-16"><FloralDivider /></motion.div>
                <div className="space-y-6">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 2} variants={fadeUp}
                      whileHover={{ x: 8 }}
                      className="flex gap-6 items-center p-6 rounded-xl border transition-colors"
                      style={{ background: c.bgCard, borderColor: c.border }}
                    >
                      <div className="w-20 shrink-0 text-center">
                        <span className="font-display font-bold text-lg" style={{ color: c.accent }}>{item.time}</span>
                      </div>
                      <div className="w-px h-10 self-stretch" style={{ background: c.border }} />
                      <div>
                        <h3 className="font-display font-semibold text-lg" style={{ color: c.heading }}>{item.title}</h3>
                        {item.description && <p className="text-sm font-body mt-1" style={{ color: c.body }}>{item.description}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* ─── VENUE ─── */}
          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 text-center z-10 relative" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-12" style={{ color: c.heading }}>Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl md:text-3xl font-medium mb-3" style={{ color: c.heading }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {/* ─── GALLERY ─── */}
          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: c.heading }}>Moments</motion.h2>
              <motion.div custom={1} variants={fadeUp} className="flex justify-center mb-16"><FloralDivider /></motion.div>
              {/* Masonry-like layout */}
              <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i} custom={i + 1} variants={bloomIn}
                    whileHover={{ scale: 1.05 }}
                    className={`rounded-xl flex items-center justify-center text-sm font-body border cursor-pointer overflow-hidden relative group ${i === 1 || i === 4 ? 'row-span-2 aspect-[3/5]' : 'aspect-square'}`}
                    style={{ background: c.bgCard, borderColor: c.border, color: c.muted }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(circle, hsl(330,50%,65%,0.1), transparent)` }} />
                    ✿ Photo {i}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── RSVP ─── */}
          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-10" style={{ color: c.body }}>We'd love to celebrate this moment with you</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-8 rounded-2xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                  <InviteRsvpForm inviteId={inviteId} />
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* Footer */}
          <footer className="py-20 text-center z-10 relative" style={{ borderTop: `1px solid ${c.border}` }}>
            <FloralDivider />
            <p className="font-display text-xl mt-6 mb-2" style={{ color: c.accent }}>{data.partnerOneName} & {data.partnerTwoName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase" style={{ color: c.muted }}>
              Made with love on <span style={{ color: c.accent }}>Shyara</span>
            </p>
          </footer>
        </div>
      )}
    </>
  );
};

export default MidnightBloom;
