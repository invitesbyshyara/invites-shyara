import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(260,30%,6%)', bgAlt: 'hsl(270,25%,9%)', bgCard: 'hsl(260,20%,12%)',
  heading: 'hsl(170,100%,55%)', body: 'hsl(0,0%,65%)', accent: 'hsl(280,80%,60%)',
  neon: 'hsl(170,100%,50%)', pink: 'hsl(320,80%,60%)', border: 'hsl(260,15%,18%)', muted: 'hsl(260,10%,35%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

const NeonGlow = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = data.celebrantName ? `${data.celebrantName}'s ${data.age ? `${data.age}th` : ''} Birthday` : 'Birthday Bash!';

  return (
    <>
      <InviteCover title={title} subtitle="⚡ GET READY ⚡" date={data.eventDate || ''} time={data.eventTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="neon-dark" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: c.bg }}>
          {/* Neon glow lines */}
          <div className="fixed inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(ellipse at 20% 50%, hsl(170,100%,50%,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, hsl(280,80%,60%,0.06) 0%, transparent 50%)` }} />

          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-32 md:py-44 px-6 text-center z-10 relative">
              <motion.p custom={0} variants={fadeUp} className="text-sm uppercase tracking-[0.4em] font-body mb-6 font-bold" style={{ color: c.accent }}>⚡ IT'S PARTY TIME ⚡</motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-4 leading-[0.9]" style={{ color: c.heading, textShadow: `0 0 40px ${c.neon}, 0 0 80px hsl(170,100%,50%,0.3)` }}>{data.celebrantName || 'Birthday Star'}</motion.h1>
              {data.age && (
                <motion.div custom={2} variants={fadeUp} className="my-8">
                  <span className="inline-flex items-center justify-center w-32 h-32 rounded-full text-6xl font-display font-bold" style={{ color: c.bg, background: `linear-gradient(135deg, ${c.neon}, ${c.accent})`, boxShadow: `0 0 40px ${c.neon}, 0 0 80px hsl(170,100%,50%,0.3)` }}>{data.age}</span>
                </motion.div>
              )}
              {data.welcomeMessage && <motion.p custom={3} variants={fadeUp} className="text-lg font-body max-w-lg mx-auto" style={{ color: c.body }}>{data.welcomeMessage}</motion.p>}
              {data.eventDate && (
                <motion.div custom={4} variants={fadeUp} className="mt-10 inline-flex items-center gap-4 px-8 py-4 rounded-full border" style={{ borderColor: c.border, background: c.bgCard, boxShadow: `0 0 20px hsl(170,100%,50%,0.1)` }}>
                  <span className="font-display text-lg font-bold" style={{ color: c.neon }}>{data.eventDate}</span>
                  {data.eventTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent, boxShadow: `0 0 6px ${c.accent}` }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.eventTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading, textShadow: `0 0 20px hsl(170,100%,50%,0.3)` }}>⚡ LINEUP</motion.h2>
                <div className="space-y-4">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} whileHover={{ x: 6 }} className="flex gap-5 items-center p-5 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-display font-bold" style={{ color: c.neon, textShadow: `0 0 8px ${c.neon}` }}>{item.time}</span></div>
                      <div className="w-px h-8" style={{ background: `linear-gradient(180deg, ${c.neon}, ${c.accent})` }} />
                      <div><h3 className="font-display font-semibold text-lg" style={{ color: c.heading }}>{item.title}</h3>{item.description && <p className="text-sm font-body mt-0.5" style={{ color: c.body }}>{item.description}</p>}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 text-center z-10 relative">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-10" style={{ color: c.heading, textShadow: `0 0 20px hsl(170,100%,50%,0.3)` }}>📍 LOCATION</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-semibold mb-2" style={{ color: c.neon }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>📸 MOMENTS</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1,2,3,4,5,6].map(i => (
                  <motion.div key={i} custom={i} variants={fadeUp} whileHover={{ scale: 1.05 }} className="aspect-square rounded-xl flex items-center justify-center text-sm font-body border" style={{ background: c.bgCard, borderColor: c.border, color: c.muted, boxShadow: `inset 0 0 20px hsl(170,100%,50%,0.03)` }}>⚡ Photo {i}</motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative">
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>⚡ RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>Are you in?</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-16 text-center z-10 relative" style={{ borderTop: `1px solid ${c.border}` }}>
            <p className="font-display text-xl" style={{ color: c.neon, textShadow: `0 0 10px ${c.neon}` }}>{data.celebrantName}'s Party</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.neon }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default NeonGlow;
