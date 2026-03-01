import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(0,0%,99%)', bgAlt: 'hsl(220,10%,96%)', bgCard: 'hsl(0,0%,100%)',
  heading: 'hsl(220,25%,15%)', body: 'hsl(220,10%,40%)', accent: 'hsl(220,80%,50%)',
  border: 'hsl(220,10%,90%)', muted: 'hsl(220,8%,55%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const } }),
};

const ModernSummit = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = data.eventName || 'Summit';

  return (
    <>
      <InviteCover title={title} subtitle={data.companyName || 'You\'re Invited'} date={data.eventDate || ''} time={data.eventTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="corporate-light" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-24 md:py-36 px-6">
              <div className="max-w-3xl mx-auto">
                {data.companyName && <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ borderColor: c.border, background: c.bgAlt }}><span className="text-xs font-body font-medium" style={{ color: c.accent }}>{data.companyName}</span></motion.div>}
                <motion.h1 custom={1} variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 leading-[1.1]" style={{ color: c.heading }}>{data.eventName || 'Event'}</motion.h1>
                {data.description && <motion.p custom={2} variants={fadeUp} className="text-lg font-body max-w-2xl" style={{ color: c.body }}>{data.description}</motion.p>}
                <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                  {data.eventDate && <span className="px-4 py-2 rounded-lg text-sm font-body font-medium" style={{ background: c.bgAlt, color: c.heading }}>📅 {data.eventDate}</span>}
                  {data.eventTime && <span className="px-4 py-2 rounded-lg text-sm font-body font-medium" style={{ background: c.bgAlt, color: c.heading }}>⏰ {data.eventTime}</span>}
                  {data.venueName && <span className="px-4 py-2 rounded-lg text-sm font-body font-medium" style={{ background: c.bgAlt, color: c.heading }}>📍 {data.venueName}</span>}
                </motion.div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-3xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-8" style={{ color: c.heading }}>Agenda</motion.h2>
                <div className="space-y-3">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-5 items-start p-4 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-body font-semibold text-sm" style={{ color: c.accent }}>{item.time}</span></div>
                      <div><h3 className="font-body font-semibold" style={{ color: c.heading }}>{item.title}</h3>{item.description && <p className="text-sm font-body mt-0.5" style={{ color: c.body }}>{item.description}</p>}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6">
              <div className="max-w-3xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-6" style={{ color: c.heading }}>Location</motion.h2>
                {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-body text-xl font-medium mb-1" style={{ color: c.heading }}>{data.venueName}</motion.p>}
                {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-6" style={{ color: c.heading }}>Register</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-12 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <p className="font-body text-sm font-medium" style={{ color: c.accent }}>{data.companyName || data.eventName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Powered by <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default ModernSummit;
