import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(0,0%,98%)', bgAlt: 'hsl(345,12%,95%)', bgCard: 'hsl(0,0%,100%)',
  heading: 'hsl(345,50%,28%)', body: 'hsl(345,15%,40%)', accent: 'hsl(345,50%,45%)',
  accentLight: 'hsl(345,40%,65%)', border: 'hsl(345,10%,88%)', muted: 'hsl(345,10%,55%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

const ClassicDivider = () => (
  <div className="flex items-center justify-center gap-4 my-4">
    <div className="h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
    <div className="w-2 h-2 rotate-45" style={{ border: `1px solid ${c.accent}` }} />
    <div className="h-px w-20" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />
  </div>
);

const EternalVows = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.brideName || 'Bride'} & ${data.groomName || 'Groom'}`;

  return (
    <>
      <InviteCover title={title} subtitle="Request the honour of your presence" date={data.weddingDate || ''} time={data.weddingTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="ivory-classic" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-36 md:py-48 px-6 text-center">
              <motion.div custom={0} variants={fadeUp} className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center" style={{ borderColor: c.accentLight }}>
                  <span className="font-display text-3xl italic" style={{ color: c.accent }}>M&K</span>
                </div>
              </motion.div>
              <motion.p custom={1} variants={fadeUp} className="text-xs uppercase tracking-[0.5em] font-body mb-10" style={{ color: c.muted }}>Request the honour of your presence</motion.p>
              <motion.h1 custom={2} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-3 leading-[0.9]" style={{ color: c.heading }}>{data.brideName || 'Bride'}</motion.h1>
              <motion.div custom={3} variants={fadeUp} className="my-4"><ClassicDivider /></motion.div>
              <motion.h1 custom={4} variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-10 leading-[0.9]" style={{ color: c.heading }}>{data.groomName || 'Groom'}</motion.h1>
              {data.weddingDate && (
                <motion.div custom={5} variants={fadeUp} className="mt-8 inline-flex items-center gap-4 px-8 py-4 rounded-full border" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-semibold" style={{ color: c.accent }}>{data.weddingDate}</span>
                  {data.weddingTime && (<><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} /><span className="font-body text-sm" style={{ color: c.body }}>{data.weddingTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.loveStory && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-8" style={{ color: c.heading }}>Our Love Story</motion.h2>
                <ClassicDivider />
                <motion.p custom={1} variants={fadeUp} className="text-lg leading-[2] font-body mt-8" style={{ color: c.body }}>{data.loveStory}</motion.p>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Wedding Programme</motion.h2>
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-px" style={{ background: c.accentLight }} />
                  <div className="space-y-8">
                    {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                      <motion.div key={i} custom={i + 1} variants={fadeUp} className="relative pl-20">
                        <div className="absolute left-8 top-2 -translate-x-1/2 w-3 h-3 rounded-full border-2" style={{ borderColor: c.accent, background: c.bg }} />
                        <span className="text-xs uppercase tracking-[0.3em] font-body" style={{ color: c.accent }}>{item.time}</span>
                        <h3 className="font-display font-semibold text-xl mt-1" style={{ color: c.heading }}>{item.title}</h3>
                        {item.description && <p className="text-sm font-body mt-1" style={{ color: c.body }}>{item.description}</p>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 text-center" style={{ background: c.bgAlt }}>
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-10" style={{ color: c.heading }}>The Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-medium mb-2" style={{ color: c.accent }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>Moments</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1,2,3,4,5,6].map(i => (
                  <motion.div key={i} custom={i} variants={fadeUp} className="aspect-square rounded-lg flex items-center justify-center text-sm font-body border" style={{ background: c.bgAlt, borderColor: c.border, color: c.muted }}>Photo {i}</motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>Kindly respond at your earliest convenience</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-xl border" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-16 text-center" style={{ borderTop: `1px solid ${c.border}` }}>
            <ClassicDivider />
            <p className="font-display text-xl mt-4" style={{ color: c.accent }}>{data.brideName} & {data.groomName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default EternalVows;
