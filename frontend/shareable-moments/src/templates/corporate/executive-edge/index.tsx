import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(220,18%,10%)', bgAlt: 'hsl(220,15%,13%)', bgCard: 'hsl(220,15%,16%)',
  heading: 'hsl(0,0%,95%)', body: 'hsl(220,8%,60%)', accent: 'hsl(210,70%,55%)',
  border: 'hsl(220,10%,22%)', muted: 'hsl(220,8%,40%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const } }),
};

const ExecutiveEdge = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = data.eventName || 'Corporate Event';

  return (
    <>
      <InviteCover title={title} subtitle={data.companyName || 'You\'re Invited'} date={data.eventDate || ''} time={data.eventTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="corporate-dark" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {/* Geometric accent lines */}
          <div className="fixed top-0 right-0 w-1 h-full pointer-events-none z-0" style={{ background: `linear-gradient(180deg, transparent, ${c.accent}, transparent)`, opacity: 0.15 }} />

          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-28 md:py-40 px-6 z-10 relative">
              <div className="max-w-3xl mx-auto">
                {data.companyName && <motion.p custom={0} variants={fadeUp} className="text-xs uppercase tracking-[0.5em] font-body mb-6" style={{ color: c.accent }}>{data.companyName} presents</motion.p>}
                <motion.h1 custom={1} variants={fadeUp} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]" style={{ color: c.heading }}>{data.eventName || 'Event'}</motion.h1>
                {data.description && <motion.p custom={2} variants={fadeUp} className="text-lg font-body max-w-2xl" style={{ color: c.body }}>{data.description}</motion.p>}
                <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
                  {data.eventDate && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border" style={{ borderColor: c.border, background: c.bgCard }}>
                      <span className="text-sm font-body font-medium" style={{ color: c.accent }}>📅 {data.eventDate}</span>
                    </div>
                  )}
                  {data.eventTime && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border" style={{ borderColor: c.border, background: c.bgCard }}>
                      <span className="text-sm font-body font-medium" style={{ color: c.accent }}>⏰ {data.eventTime}</span>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.description && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-3xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-6" style={{ color: c.heading }}>About the Event</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-0.5 mb-6" style={{ background: c.accent }} />
                <motion.p custom={2} variants={fadeUp} className="text-lg leading-relaxed font-body" style={{ color: c.body }}>{data.description}</motion.p>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6 z-10 relative">
              <div className="max-w-3xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Agenda</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-0.5 mb-10" style={{ background: c.accent }} />
                <div className="space-y-3">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 2} variants={fadeUp} className="flex gap-6 items-center p-5 rounded-lg border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-body font-semibold text-sm" style={{ color: c.accent }}>{item.time}</span></div>
                      <div className="w-px h-8" style={{ background: c.border }} />
                      <div><h3 className="font-body font-semibold" style={{ color: c.heading }}>{item.title}</h3>{item.description && <p className="text-sm font-body mt-0.5" style={{ color: c.body }}>{item.description}</p>}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-3xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Location</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-0.5 mb-6" style={{ background: c.accent }} />
                {data.venueName && <motion.p custom={2} variants={fadeUp} className="font-body text-xl font-medium mb-1" style={{ color: c.heading }}>{data.venueName}</motion.p>}
                {data.venueAddress && <motion.p custom={3} variants={fadeUp} className="font-body" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
              </div>
            </motion.section>
          )}

          {data.galleryPhotos?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6 z-10 relative">
              <div className="max-w-3xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Gallery</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-0.5 mb-10" style={{ background: c.accent }} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data.galleryPhotos.map((photo: string, i: number) => (
                    <motion.div
                      key={i}
                      custom={i + 2}
                      variants={fadeUp}
                      whileHover={{ scale: 1.04 }}
                      className="rounded-lg border overflow-hidden aspect-square transition-transform"
                      style={{ background: c.bgCard, borderColor: c.border }}
                    >
                      <img src={photo} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-20 px-6">
              <div className="max-w-md mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-0.5 mb-6" style={{ background: c.accent }} />
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-lg border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-14 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <p className="font-body text-sm font-medium" style={{ color: c.accent }}>{data.companyName || data.eventName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Powered by <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default ExecutiveEdge;
