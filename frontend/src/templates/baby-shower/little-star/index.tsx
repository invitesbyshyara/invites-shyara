import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(210,40%,95%)', bgAlt: 'hsl(210,35%,92%)', bgCard: 'hsl(210,30%,98%)',
  heading: 'hsl(210,40%,25%)', body: 'hsl(210,15%,40%)', accent: 'hsl(45,80%,55%)',
  blue: 'hsl(210,50%,55%)', border: 'hsl(210,20%,85%)', muted: 'hsl(210,10%,55%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const } }),
};

const StarDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <motion.span animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ color: c.accent }}>⭐</motion.span>
    <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const LittleStar = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = data.parentNames || 'Baby Shower';

  return (
    <>
      <InviteCover title={title} subtitle="A Little Star is on the way!" date={data.eventDate || ''} time={data.eventTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="star-blue" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: c.bg }}>
          {/* Floating stars */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} className="absolute text-lg" style={{ left: `${8 + i * 8}%`, top: `${Math.random() * 100}%`, color: c.accent, opacity: 0.2 }}
                animate={{ y: [-10, 10, -10], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4 + Math.random() * 3, delay: i * 0.5, repeat: Infinity }}>⭐</motion.div>
            ))}
          </div>

          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-28 md:py-40 px-6 text-center z-10 relative">
              <motion.div custom={0} variants={fadeUp} className="text-6xl mb-4">⭐</motion.div>
              <motion.p custom={1} variants={fadeUp} className="text-xs uppercase tracking-[0.4em] font-body mb-6" style={{ color: c.blue }}>Twinkle Twinkle Little Star</motion.p>
              <motion.h1 custom={2} variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight" style={{ color: c.heading }}>{data.parentNames || 'Parents'}</motion.h1>
              <motion.p custom={3} variants={fadeUp} className="text-lg font-body mb-2" style={{ color: c.body }}>are expecting a little star!</motion.p>
              {data.babyName && <motion.p custom={4} variants={fadeUp} className="text-xl font-display font-semibold" style={{ color: c.accent }}>Welcome, {data.babyName}!</motion.p>}
              {data.welcomeMessage && <motion.p custom={5} variants={fadeUp} className="text-base font-body max-w-lg mx-auto mt-4" style={{ color: c.body }}>{data.welcomeMessage}</motion.p>}
              {data.eventDate && (
                <motion.div custom={6} variants={fadeUp} className="mt-8 inline-flex items-center gap-4 px-6 py-3 rounded-full border" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.blue }}>{data.eventDate}</span>
                  {data.eventTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.eventTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.welcomeMessage && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <StarDivider />
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mt-6 mb-6" style={{ color: c.heading }}>About the Celebration</motion.h2>
                {data.theme && <motion.p custom={1} variants={fadeUp} className="font-body text-sm uppercase tracking-wider mb-4" style={{ color: c.accent }}>Theme: {data.theme}</motion.p>}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold text-center mb-10" style={{ color: c.heading }}>⭐ Party Schedule</motion.h2>
                <div className="space-y-4">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-4 items-start p-4 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-display font-bold text-sm" style={{ color: c.blue }}>{item.time}</span></div>
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
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-xl font-medium mb-2" style={{ color: c.blue }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6">
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-4" style={{ color: c.heading }}>⭐ RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-6" style={{ color: c.body }}>Will you join us?</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-14 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <StarDivider />
            <p className="font-display text-lg mt-3" style={{ color: c.blue }}>{data.parentNames}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default LittleStar;
