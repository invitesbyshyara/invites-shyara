import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(120,20%,96%)', bgAlt: 'hsl(150,22%,93%)', bgCard: 'hsl(140,18%,97%)',
  heading: 'hsl(150,40%,22%)', body: 'hsl(150,15%,40%)', accent: 'hsl(150,45%,40%)',
  accentLight: 'hsl(340,50%,70%)', border: 'hsl(150,20%,85%)', muted: 'hsl(150,10%,55%)',
  blush: 'hsl(340,45%,85%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

const LeafDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <span style={{ color: c.accent, fontSize: 16 }}>🌿</span>
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const FloralGarden = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.brideName || 'Bride'} & ${data.groomName || 'Groom'}`;

  return (
    <>
      <InviteCover title={title} subtitle="Together with their families" date={data.weddingDate || ''} time={data.weddingTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="pastel-floral" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: c.bg, fontFamily: "'Georgia', serif" }}>
          {/* Floating petals */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div key={i} className="absolute" style={{ left: `${10 + i * 9}%`, width: 10 + Math.random() * 8, height: 10 + Math.random() * 8, background: i % 2 === 0 ? c.accentLight : c.blush, borderRadius: '50% 0 50% 0', opacity: 0.15, filter: 'blur(1px)' }}
                initial={{ y: '-5vh', rotate: 0 }} animate={{ y: '110vh', rotate: 360 }}
                transition={{ duration: 18 + Math.random() * 10, delay: i * 1.5, repeat: Infinity, ease: 'linear' }} />
            ))}
          </div>

          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative py-32 md:py-44 px-6 text-center z-10">
              <motion.p custom={0} variants={fadeUp} className="text-[10px] uppercase tracking-[0.6em] font-body mb-8" style={{ color: c.accent }}>🌸 Together with their families 🌸</motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-2 leading-[0.9]" style={{ color: c.heading }}>{data.brideName || 'Bride'}</motion.h1>
              <motion.div custom={2} variants={fadeUp} className="my-6 flex items-center justify-center gap-6">
                <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
                <span className="font-display text-3xl italic" style={{ color: c.accent }}>&</span>
                <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
              </motion.div>
              <motion.h1 custom={3} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[0.9]" style={{ color: c.heading }}>{data.groomName || 'Groom'}</motion.h1>
              <motion.p custom={4} variants={fadeUp} className="text-sm font-body" style={{ color: c.body }}>invite you to their garden wedding celebration</motion.p>
              {data.weddingDate && (
                <motion.div custom={5} variants={fadeUp} className="mt-10 inline-flex items-center gap-4 px-8 py-4 rounded-full border" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.accent }}>{data.weddingDate}</span>
                  {data.weddingTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.weddingTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.loveStory && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <motion.div custom={0} variants={fadeUp}><LeafDivider /></motion.div>
                <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl font-bold mt-6 mb-8" style={{ color: c.heading }}>Our Love Story</motion.h2>
                <motion.p custom={2} variants={fadeUp} className="text-lg leading-[1.9] font-body italic" style={{ color: c.body }}>{data.loveStory}</motion.p>
                <motion.div custom={3} variants={fadeUp} className="mt-8"><LeafDivider /></motion.div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 z-10 relative">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Garden Schedule</motion.h2>
                <div className="space-y-6">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-6 items-start p-5 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-display font-bold" style={{ color: c.accent }}>{item.time}</span></div>
                      <div><h3 className="font-display font-semibold text-lg" style={{ color: c.heading }}>{item.title}</h3>{item.description && <p className="text-sm font-body mt-1" style={{ color: c.body }}>{item.description}</p>}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 text-center z-10 relative" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-10" style={{ color: c.heading }}>The Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-medium mb-2" style={{ color: c.accent }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
              <motion.div custom={3} variants={fadeUp} className="mt-8 max-w-2xl mx-auto h-56 rounded-xl flex items-center justify-center font-body border" style={{ background: c.bgCard, borderColor: c.border, color: c.muted }}>🗺️ Map</motion.div>
            </motion.section>
          )}

          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 z-10 relative">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Gallery</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1,2,3,4,5,6].map(i => (
                  <motion.div key={i} custom={i} variants={fadeUp} whileHover={{ scale: 1.03 }} className="aspect-square rounded-xl flex items-center justify-center text-sm font-body border" style={{ background: c.bgCard, borderColor: c.border, color: c.muted }}>📸 Photo {i}</motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 z-10 relative" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>We'd love for you to join us in the garden</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-16 text-center z-10 relative" style={{ borderTop: `1px solid ${c.border}` }}>
            <LeafDivider />
            <p className="font-display text-xl mt-4 mb-2" style={{ color: c.accent }}>{data.brideName} & {data.groomName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default FloralGarden;
