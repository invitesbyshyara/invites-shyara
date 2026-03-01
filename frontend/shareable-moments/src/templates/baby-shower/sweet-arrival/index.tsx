import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(340,35%,96%)', bgAlt: 'hsl(160,25%,93%)', bgCard: 'hsl(340,25%,98%)',
  heading: 'hsl(340,40%,28%)', body: 'hsl(340,15%,42%)', accent: 'hsl(340,50%,60%)',
  mint: 'hsl(160,40%,55%)', border: 'hsl(340,15%,88%)', muted: 'hsl(340,10%,55%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const } }),
};

const SweetDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <span style={{ color: c.accent }}>🍼</span>
    <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const SweetArrival = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = data.parentNames || 'Baby Shower';

  return (
    <>
      <InviteCover title={title} subtitle="A Sweet Little One is Coming!" date={data.eventDate || ''} time={data.eventTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="sweet-pink" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-28 md:py-40 px-6 text-center">
              <motion.div custom={0} variants={fadeUp} className="text-6xl mb-4">👶</motion.div>
              <motion.p custom={1} variants={fadeUp} className="text-xs uppercase tracking-[0.4em] font-body mb-6" style={{ color: c.accent }}>Sugar, Spice & Everything Nice</motion.p>
              <motion.h1 custom={2} variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight" style={{ color: c.heading }}>{data.parentNames || 'Parents'}</motion.h1>
              <motion.p custom={3} variants={fadeUp} className="text-lg font-body" style={{ color: c.body }}>are expecting a little bundle of joy!</motion.p>
              {data.babyName && <motion.p custom={4} variants={fadeUp} className="text-xl font-display font-semibold mt-2" style={{ color: c.accent }}>{data.babyName}</motion.p>}
              {data.welcomeMessage && <motion.p custom={5} variants={fadeUp} className="text-base font-body max-w-lg mx-auto mt-4" style={{ color: c.body }}>{data.welcomeMessage}</motion.p>}
              {data.eventDate && (
                <motion.div custom={6} variants={fadeUp} className="mt-8 inline-flex items-center gap-4 px-6 py-3 rounded-full border" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.accent }}>{data.eventDate}</span>
                  {data.eventTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.mint }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.eventTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.welcomeMessage && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <SweetDivider />
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mt-6 mb-6" style={{ color: c.heading }}>The Celebration</motion.h2>
                {data.theme && <motion.p custom={1} variants={fadeUp} className="font-body text-sm uppercase tracking-wider" style={{ color: c.mint }}>Theme: {data.theme}</motion.p>}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold text-center mb-10" style={{ color: c.heading }}>🍼 Schedule</motion.h2>
                <div className="space-y-4">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-4 items-start p-4 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-display font-bold text-sm" style={{ color: c.accent }}>{item.time}</span></div>
                      <div><h3 className="font-display font-semibold" style={{ color: c.heading }}>{item.title}</h3>{item.description && <p className="text-sm font-body mt-0.5" style={{ color: c.body }}>{item.description}</p>}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6 text-center" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-8" style={{ color: c.heading }}>📍 Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-xl font-medium mb-2" style={{ color: c.accent }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold text-center mb-10" style={{ color: c.heading }}>Gallery</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
                {[1,2,3,4,5,6].map(i => (
                  <motion.div key={i} custom={i} variants={fadeUp} className="aspect-square rounded-xl flex items-center justify-center text-sm font-body border" style={{ background: c.bgCard, borderColor: c.border, color: c.muted }}>🍼 Photo {i}</motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-6" style={{ color: c.body }}>We'd love to see you there!</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-14 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <SweetDivider />
            <p className="font-display text-lg mt-3" style={{ color: c.accent }}>{data.parentNames}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default SweetArrival;
