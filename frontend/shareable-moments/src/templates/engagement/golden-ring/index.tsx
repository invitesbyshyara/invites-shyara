import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(39,35%,95%)', bgAlt: 'hsl(39,30%,91%)', bgCard: 'hsl(39,25%,98%)',
  heading: 'hsl(39,50%,20%)', body: 'hsl(39,20%,38%)', accent: 'hsl(39,70%,45%)',
  gold: 'hsl(39,80%,55%)', border: 'hsl(39,20%,82%)', muted: 'hsl(39,10%,50%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

const GoldDivider = () => (
  <div className="flex items-center justify-center gap-3 my-2">
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${c.gold})` }} />
    <span style={{ color: c.gold }}>💍</span>
    <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${c.gold}, transparent)` }} />
  </div>
);

const GoldenRing = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.partnerOneName || 'Partner'} & ${data.partnerTwoName || 'Partner'}`;

  return (
    <>
      <InviteCover title={title} subtitle="She said YES!" date={data.engagementDate || ''} time={data.engagementTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="golden-warm" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-32 md:py-44 px-6 text-center">
              <motion.div custom={0} variants={fadeUp} className="text-6xl mb-6">💍</motion.div>
              <motion.p custom={1} variants={fadeUp} className="text-xs uppercase tracking-[0.5em] font-body mb-8" style={{ color: c.accent }}>We're Engaged!</motion.p>
              <motion.h1 custom={2} variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold mb-2 leading-[0.9]" style={{ color: c.heading }}>{data.partnerOneName || 'Partner'}</motion.h1>
              <motion.p custom={3} variants={fadeUp} className="font-display text-3xl italic my-4" style={{ color: c.gold }}>&</motion.p>
              <motion.h1 custom={4} variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold mb-8 leading-[0.9]" style={{ color: c.heading }}>{data.partnerTwoName || 'Partner'}</motion.h1>
              {data.engagementDate && (
                <motion.div custom={5} variants={fadeUp} className="mt-8 inline-flex items-center gap-4 px-8 py-4 rounded-full border" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.gold }}>{data.engagementDate}</span>
                  {data.engagementTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.gold }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.engagementTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.ourStory && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <GoldDivider />
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mt-6 mb-8" style={{ color: c.heading }}>Our Story</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="text-lg leading-[1.9] font-body" style={{ color: c.body }}>{data.ourStory}</motion.p>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Evening Schedule</motion.h2>
                <div className="space-y-5">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-6 items-start p-5 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}>
                      <div className="w-20 shrink-0"><span className="font-display font-bold" style={{ color: c.gold }}>{item.time}</span></div>
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
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-medium mb-2" style={{ color: c.gold }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>Join us for this golden moment</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-16 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <GoldDivider />
            <p className="font-display text-xl mt-4" style={{ color: c.gold }}>{data.partnerOneName} & {data.partnerTwoName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.gold }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default GoldenRing;
