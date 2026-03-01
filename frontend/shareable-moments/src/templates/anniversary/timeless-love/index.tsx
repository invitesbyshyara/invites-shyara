import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(20,35%,93%)', bgAlt: 'hsl(15,30%,89%)', bgCard: 'hsl(20,25%,96%)',
  heading: 'hsl(20,50%,22%)', body: 'hsl(20,15%,38%)', accent: 'hsl(20,60%,42%)',
  warm: 'hsl(345,50%,50%)', border: 'hsl(20,15%,80%)', muted: 'hsl(20,10%,50%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

const WarmDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <span style={{ color: c.warm }}>❤️</span>
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const TimelessLove = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = data.coupleNames || 'Anniversary';

  return (
    <>
      <InviteCover title={title} subtitle={data.years ? `Celebrating ${data.years} Years of Love` : 'Anniversary Celebration'} date={data.anniversaryDate || ''} time={data.anniversaryTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="anniversary-warm" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-32 md:py-44 px-6 text-center">
              <motion.p custom={0} variants={fadeUp} className="text-xs uppercase tracking-[0.5em] font-body mb-8" style={{ color: c.accent }}>Celebrating a Lifetime of Love</motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight" style={{ color: c.heading }}>{data.coupleNames || 'The Couple'}</motion.h1>
              {data.years && (
                <motion.div custom={2} variants={fadeUp} className="my-8">
                  <span className="inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-display font-bold" style={{ color: c.bgCard, background: `linear-gradient(135deg, ${c.accent}, ${c.warm})` }}>{data.years}</span>
                  <p className="font-body text-sm mt-3 uppercase tracking-wider" style={{ color: c.accent }}>Years Together</p>
                </motion.div>
              )}
              {data.anniversaryDate && (
                <motion.div custom={3} variants={fadeUp} className="mt-6 inline-flex items-center gap-4 px-8 py-4 rounded-full border" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.accent }}>{data.anniversaryDate}</span>
                  {data.anniversaryTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.warm }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.anniversaryTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.ourJourney && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <WarmDivider />
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mt-6 mb-8" style={{ color: c.heading }}>Our Journey</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="text-lg leading-[1.9] font-body" style={{ color: c.body }}>{data.ourJourney}</motion.p>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Evening Programme</motion.h2>
                <div className="space-y-5">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-5 items-start p-5 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-display font-bold" style={{ color: c.accent }}>{item.time}</span></div>
                      <div><h3 className="font-display font-semibold text-lg" style={{ color: c.heading }}>{item.title}</h3>{item.description && <p className="text-sm font-body mt-1" style={{ color: c.body }}>{item.description}</p>}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 text-center" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-10" style={{ color: c.heading }}>Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-medium mb-2" style={{ color: c.accent }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Through the Years</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1,2,3,4,5,6].map(i => (
                  <motion.div key={i} custom={i} variants={fadeUp} className="aspect-square rounded-xl flex items-center justify-center text-sm font-body border" style={{ background: c.bgCard, borderColor: c.border, color: c.muted }}>❤️ Memory {i}</motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>Celebrate this milestone with us</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-16 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <WarmDivider />
            <p className="font-display text-xl mt-4" style={{ color: c.accent }}>{data.coupleNames}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default TimelessLove;
