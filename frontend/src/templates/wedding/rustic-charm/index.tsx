import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props { config: TemplateConfig; data: Record<string, any>; isPreview?: boolean; inviteId?: string; }

const c = {
  bg: 'hsl(30,25%,90%)', bgAlt: 'hsl(25,22%,86%)', bgCard: 'hsl(30,20%,94%)',
  heading: 'hsl(25,55%,22%)', body: 'hsl(25,20%,38%)', accent: 'hsl(25,55%,40%)',
  olive: 'hsl(80,30%,40%)', border: 'hsl(25,15%,78%)', muted: 'hsl(25,10%,50%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: 'easeOut' as const } }),
};

const RusticDivider = () => (
  <div className="flex items-center justify-center gap-3 my-3">
    <div className="h-px w-16" style={{ background: c.accent }} />
    <span style={{ color: c.olive }}>🌾</span>
    <div className="h-px w-16" style={{ background: c.accent }} />
  </div>
);

const RusticCharm = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.brideName || 'Bride'} & ${data.groomName || 'Groom'}`;

  return (
    <>
      <InviteCover title={title} subtitle="A Countryside Celebration" date={data.weddingDate || ''} time={data.weddingTime || ''} slug={data.slug || 'preview'} isPreview={isPreview} theme="rustic-warm" onOpen={() => setIsOpened(true)} />
      {isOpened && (
        <div className="min-h-screen relative" style={{ background: c.bg }}>
          {/* Kraft paper texture overlay */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-32 md:py-44 px-6 text-center z-10 relative">
              <motion.p custom={0} variants={fadeUp} className="text-xs uppercase tracking-[0.4em] font-body mb-8" style={{ color: c.olive }}>🌿 A Rustic Celebration 🌿</motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold mb-2 leading-[0.9]" style={{ color: c.heading }}>{data.brideName || 'Bride'}</motion.h1>
              <motion.p custom={2} variants={fadeUp} className="font-display text-3xl italic my-4" style={{ color: c.accent }}>&</motion.p>
              <motion.h1 custom={3} variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold mb-8 leading-[0.9]" style={{ color: c.heading }}>{data.groomName || 'Groom'}</motion.h1>
              <motion.p custom={4} variants={fadeUp} className="text-sm font-body" style={{ color: c.body }}>are tying the knot</motion.p>
              {data.weddingDate && (
                <motion.div custom={5} variants={fadeUp} className="mt-8 inline-flex items-center gap-4 px-8 py-4 rounded-lg border-2 border-dashed" style={{ borderColor: c.border, background: c.bgCard }}>
                  <span className="font-display text-lg font-bold" style={{ color: c.accent }}>{data.weddingDate}</span>
                  {data.weddingTime && (<><span className="mx-2" style={{ color: c.olive }}>·</span><span className="font-body text-sm" style={{ color: c.body }}>{data.weddingTime}</span></>)}
                </motion.div>
              )}
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.loveStory && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6" style={{ background: c.bgAlt }}>
              <div className="max-w-2xl mx-auto text-center">
                <RusticDivider />
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mt-6 mb-8" style={{ color: c.heading }}>Our Story</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="text-lg leading-[1.9] font-body" style={{ color: c.body }}>{data.loveStory}</motion.p>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6 z-10 relative">
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-12" style={{ color: c.heading }}>The Plan</motion.h2>
                <div className="space-y-5">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp} className="flex gap-5 items-start p-5 rounded-lg border-2 border-dashed" style={{ background: c.bgCard, borderColor: c.border }}>
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
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-10" style={{ color: c.heading }}>The Venue</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl font-medium mb-2" style={{ color: c.accent }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: c.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="py-24 px-6">
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4" style={{ color: c.heading }}>RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-8" style={{ color: c.body }}>We'd love to have you there</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-6 rounded-lg border-2 border-dashed" style={{ background: c.bgCard, borderColor: c.border }}><InviteRsvpForm inviteId={inviteId} /></motion.div>
              </div>
            </motion.section>
          )}

          <footer className="py-16 text-center" style={{ borderTop: `2px dashed ${c.border}` }}>
            <RusticDivider />
            <p className="font-display text-xl mt-4" style={{ color: c.accent }}>{data.brideName} & {data.groomName}</p>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase mt-2" style={{ color: c.muted }}>Made with love on <span style={{ color: c.accent }}>Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default RusticCharm;
