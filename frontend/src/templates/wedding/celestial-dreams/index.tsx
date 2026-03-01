import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(230,35%,8%)', bgAlt: 'hsl(240,30%,10%)', bgCard: 'hsl(230,25%,14%)',
  heading: 'hsl(45,80%,75%)', body: 'hsl(230,15%,60%)', accent: 'hsl(45,80%,65%)',
  star: 'hsl(45,90%,80%)', border: 'hsl(230,20%,20%)', muted: 'hsl(230,10%,40%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

const Star = ({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) => (
  <motion.div className="absolute rounded-full pointer-events-none" style={{ left: x, top: y, width: size, height: size, background: c.star }}
    animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
    transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity }} />
);

const CelestialDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <span style={{ color: c.star, fontSize: 14 }}>✦</span>
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const CelestialDreams = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.brideName || 'Bride'} & ${data.groomName || 'Groom'}`;

  return (
    <>
      <InviteCover title={title} subtitle="Written in the Stars" date={data.weddingDate || ''} time={data.weddingTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="celestial-navy" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: c.bg }}>
          {/* Twinkling stars */}
          <div className="fixed inset-0 pointer-events-none z-0">
            {[...Array(30)].map((_, i) => (
              <Star key={i} x={`${Math.random() * 100}%`} y={`${Math.random() * 100}%`} size={1 + Math.random() * 2.5} delay={Math.random() * 5} />
            ))}
          </div>
          <div className="fixed inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(ellipse at 30% 20%, hsl(260,40%,15%,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(230,40%,12%,0.3) 0%, transparent 50%)` }} />

          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative py-36 md:py-48 px-6 text-center z-10">
              <motion.p custom={0} variants={fadeUp} className="text-[10px] uppercase tracking-[0.6em] font-body mb-10" style={{ color: c.body }}>✦ Written in the Stars ✦</motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-2 leading-[0.9]" style={{ color: c.heading, textShadow: `0 0 40px hsl(45,80%,65%,0.2)` }}>{data.brideName || 'Bride'}</motion.h1>
              <motion.div custom={2} variants={fadeUp} className="my-6 flex items-center justify-center gap-6">
                <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
                <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="text-3xl" style={{ color: c.star }}>✦</motion.span>
                <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
              </motion.div>
              <motion.h1 custom={3} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-10 leading-[0.9]" style={{ color: c.heading, textShadow: `0 0 40px hsl(45,80%,65%,0.2)` }}>{data.groomName || 'Groom'}</motion.h1>
              {data.weddingDate && (
                <motion.div custom={4} variants={fadeUp} className="mt-10 inline-flex items-center gap-4 px-10 py-5 rounded-full border" style={{ borderColor: c.border, background: c.bgCard, boxShadow: `0 0 30px hsl(45,80%,65%,0.08)` }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.accent }}>{data.weddingDate}</span>
                  {data.weddingTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.star }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.weddingTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.loveStory && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <CelestialDivider />
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mt-6 mb-10" style={{ color: c.heading }}>Our Story</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="text-lg leading-[1.9] font-body" style={{ color: c.body }}>{data.loveStory}</motion.p>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Celestial Timeline</motion.h2>
                <div className="space-y-6">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <span className="text-xs uppercase tracking-[0.3em] font-body" style={{ color: c.accent }}>✦ {item.time}</span>
                      <h3 className="font-display font-semibold text-xl mt-2" style={{ color: c.heading }}>{item.title}</h3>
                      {item.description && <p className="text-sm font-body mt-1" style={{ color: c.body }}>{item.description}</p>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 text-center z-10 relative" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-10" style={{ color: c.heading }}>The Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-medium mb-2" style={{ color: c.accent }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Our Galaxy</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1,2,3,4,5,6].map(i => (
                  <motion.div key={i} custom={i} variants={fadeUp} whileHover={{ scale: 1.04 }} className="aspect-square rounded-xl flex items-center justify-center text-sm font-body border" style={{ background: c.bgCard, borderColor: c.border, color: c.muted }}>✦ Photo {i}</motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-28 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>Let the stars know you'll be there</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-8 rounded-2xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-20 text-center z-10 relative" style={{ borderTop: `1px solid ${c.border}` }}>
            <CelestialDivider />
            <p className="font-display text-xl mt-4" style={{ color: c.accent }}>{data.brideName} & {data.groomName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default CelestialDreams;
