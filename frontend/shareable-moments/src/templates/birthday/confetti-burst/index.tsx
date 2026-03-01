import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

const confettiColors = [
  'hsl(45,95%,60%)', 'hsl(350,85%,55%)', 'hsl(200,90%,55%)',
  'hsl(140,70%,50%)', 'hsl(280,80%,60%)', 'hsl(30,90%,55%)',
  'hsl(170,70%,50%)', 'hsl(320,75%,60%)',
];

const p = {
  bg: 'hsl(45,100%,99%)',
  bgAlt: 'hsl(45,80%,96%)',
  bgCard: 'hsl(0,0%,100%)',
  heading: 'hsl(350,80%,40%)',
  body: 'hsl(350,20%,35%)',
  accent: 'hsl(45,95%,50%)',
  fun: 'hsl(350,85%,55%)',
  blue: 'hsl(200,90%,55%)',
  green: 'hsl(140,70%,50%)',
  purple: 'hsl(280,80%,60%)',
  border: 'hsl(45,60%,88%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.6, type: 'spring' as const, bounce: 0.5 },
  }),
};

const popIn = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, rotate: 0,
    transition: { delay: i * 0.08, duration: 0.7, type: 'spring' as const, bounce: 0.4 },
  }),
};

// Animated confetti piece
const ConfettiPiece = ({ piece, i }: { piece: { x: number; color: string; size: number; delay: number }; i: number }) => {
  const shapes = ['rounded-sm', 'rounded-full', ''];
  return (
    <motion.div
      className={`absolute pointer-events-none ${shapes[i % 3]}`}
      initial={{ x: `${piece.x}vw`, y: '-5vh', rotate: 0, opacity: 1, scale: 1 }}
      animate={{
        y: '110vh',
        rotate: [0, 180, 360, 540, 720],
        x: [`${piece.x}vw`, `${piece.x + (Math.random() > 0.5 ? 8 : -8)}vw`, `${piece.x}vw`],
        opacity: [1, 1, 1, 0.5, 0],
      }}
      transition={{ duration: 4 + Math.random() * 3, delay: piece.delay, ease: 'easeIn' as const }}
      style={{
        width: piece.size,
        height: piece.size * (i % 3 === 1 ? 1 : 0.5),
        background: piece.color,
        borderRadius: i % 3 === 2 ? '2px' : undefined,
      }}
    />
  );
};

const Balloon = ({ color, x, delay }: { color: string; x: string; delay: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: x, bottom: '-10%' }}
    initial={{ y: 0, opacity: 0 }}
    animate={{ y: '-120vh', opacity: [0, 0.6, 0.6, 0] }}
    transition={{ duration: 12, delay, repeat: Infinity, ease: 'easeOut' }}
  >
    <div className="w-8 h-10 rounded-full" style={{ background: color, opacity: 0.3 }} />
    <div className="w-px h-12 mx-auto" style={{ background: color, opacity: 0.2 }} />
  </motion.div>
);

const ConfettiBurst = ({ config, data, isPreview = false, inviteId }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ x: number; color: string; size: number; delay: number }>>([]);

  const title = data.celebrantName
    ? `${data.celebrantName}'s ${data.age ? `${data.age}th` : ''} Birthday`
    : 'Birthday Party!';

  useEffect(() => {
    if (isOpened) {
      const pieces = Array.from({ length: 60 }, (_, i) => ({
        x: Math.random() * 100,
        color: confettiColors[i % confettiColors.length],
        size: 6 + Math.random() * 10,
        delay: Math.random() * 2,
      }));
      setConfetti(pieces);
    }
  }, [isOpened]);

  return (
    <>
      <InviteCover
        title={title}
        subtitle="🎉 You're Invited! 🎉"
        date={data.eventDate || ''}
        time={data.eventTime || ''}
        slug={data.slug || 'preview'}
        isPreview={isPreview}
        theme="confetti"
        onOpen={() => setIsOpened(true)}
      />

      {isOpened && (
        <div className="min-h-screen relative overflow-hidden" style={{ background: p.bg }}>
          {/* Confetti burst */}
          <div className="fixed inset-0 pointer-events-none z-40">
            {confetti.map((piece, i) => <ConfettiPiece key={i} piece={piece} i={i} />)}
          </div>

          {/* Floating balloons */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <Balloon color={p.fun} x="10%" delay={0} />
            <Balloon color={p.blue} x="25%" delay={3} />
            <Balloon color={p.accent} x="50%" delay={6} />
            <Balloon color={p.purple} x="70%" delay={2} />
            <Balloon color={p.green} x="85%" delay={5} />
          </div>

          {/* ─── HERO ─── */}
          {config.supportedSections.includes('hero') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative py-32 md:py-44 px-6 text-center z-10"
              style={{ background: `linear-gradient(180deg, ${p.bgAlt} 0%, ${p.bg} 100%)` }}
            >
              <motion.div custom={0} variants={bounceIn} className="text-7xl md:text-8xl mb-6">🎂</motion.div>

              <motion.p custom={1} variants={fadeUp} className="text-sm uppercase tracking-[0.4em] font-body mb-6 font-semibold" style={{ color: p.fun }}>
                Let's Celebrate!
              </motion.p>

              <motion.h1 custom={2} variants={bounceIn} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold mb-4 leading-[0.9]" style={{ color: p.heading }}>
                {data.celebrantName || 'Birthday Star'}
              </motion.h1>

              {data.age && (
                <motion.div custom={3} variants={popIn} className="my-6">
                  <span className="inline-flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full text-6xl md:text-7xl font-display font-bold" style={{
                    color: p.bgCard,
                    background: `linear-gradient(135deg, ${p.fun}, ${p.purple})`,
                    boxShadow: `0 8px 30px hsl(350,85%,55%,0.3)`,
                  }}>
                    {data.age}
                  </span>
                </motion.div>
              )}

              {data.welcomeMessage && (
                <motion.p custom={4} variants={fadeUp} className="text-lg font-body max-w-lg mx-auto mt-4" style={{ color: p.body }}>
                  {data.welcomeMessage}
                </motion.p>
              )}

              {data.eventDate && (
                <motion.div custom={5} variants={bounceIn} className="mt-10 inline-flex items-center gap-4 px-10 py-5 rounded-full border-2 border-dashed" style={{ borderColor: p.border, background: p.bgCard, boxShadow: '0 4px 20px hsl(0,0%,0%,0.05)' }}>
                  <span className="text-2xl">📅</span>
                  <span className="font-display text-lg font-bold" style={{ color: p.heading }}>{data.eventDate}</span>
                  {data.eventTime && (
                    <>
                      <span className="text-lg">⏰</span>
                      <span className="font-body text-sm font-medium" style={{ color: p.body }}>{data.eventTime}</span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Decorative emoji ring */}
              <motion.div custom={6} variants={fadeUp} className="mt-8 flex justify-center gap-3 text-2xl opacity-60">
                {['🎈', '🎊', '🎁', '🎵', '🍰', '🎈', '🎊'].map((e, i) => (
                  <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}>{e}</motion.span>
                ))}
              </motion.div>
            </motion.section>
          )}

          {/* ─── SCHEDULE ─── */}
          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-28 px-6 z-10 relative" style={{ background: p.bgAlt }}>
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={bounceIn} className="font-display text-3xl md:text-4xl font-bold text-center mb-16" style={{ color: p.heading }}>
                  🎊 Party Schedule
                </motion.h2>
                <div className="space-y-5">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 1} variants={fadeUp}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex gap-5 items-center p-6 rounded-2xl border-2 shadow-sm"
                      style={{ background: p.bgCard, borderColor: p.border }}
                    >
                      <div className="w-20 shrink-0 text-center">
                        <span className="font-display font-bold text-lg" style={{ color: p.fun }}>{item.time}</span>
                      </div>
                      <div className="w-1 h-8 rounded-full" style={{ background: confettiColors[i % confettiColors.length] }} />
                      <div>
                        <h3 className="font-display font-semibold text-lg" style={{ color: p.heading }}>{item.title}</h3>
                        {item.description && <p className="text-sm font-body mt-0.5" style={{ color: p.body }}>{item.description}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* ─── VENUE ─── */}
          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-28 px-6 text-center z-10 relative">
              <motion.h2 custom={0} variants={bounceIn} className="font-display text-3xl md:text-4xl font-bold mb-12" style={{ color: p.heading }}>📍 Where's the Party?</motion.h2>
              {data.venueName && <motion.p custom={1} variants={fadeUp} className="font-display text-2xl md:text-3xl font-semibold mb-3" style={{ color: p.heading }}>{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={2} variants={fadeUp} className="font-body text-lg" style={{ color: p.body }}>{data.venueAddress}</motion.p>}
            </motion.section>
          )}

          {/* ─── GALLERY ─── */}
          {config.supportedSections.includes('gallery') && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-28 px-6 z-10 relative" style={{ background: p.bgAlt }}>
              <motion.h2 custom={0} variants={bounceIn} className="font-display text-3xl md:text-4xl font-bold text-center mb-16" style={{ color: p.heading }}>📸 Memories</motion.h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div key={i} custom={i} variants={popIn}
                    whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                    className="aspect-square rounded-2xl flex items-center justify-center text-sm font-body border-2 border-dashed cursor-pointer overflow-hidden relative group"
                    style={{ background: p.bgCard, borderColor: confettiColors[(i - 1) % confettiColors.length] + '60', color: p.body }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${confettiColors[i % confettiColors.length]}15, transparent)` }} />
                    📷 Photo {i}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── RSVP ─── */}
          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="py-28 px-6 z-10 relative">
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={bounceIn} className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: p.heading }}>🎈 RSVP</motion.h2>
                <motion.p custom={1} variants={fadeUp} className="font-body mb-10" style={{ color: p.body }}>Can you make it? Let us know!</motion.p>
                <motion.div custom={2} variants={fadeUp} className="p-8 rounded-2xl border-2" style={{ background: p.bgCard, borderColor: p.border }}>
                  <InviteRsvpForm inviteId={inviteId} />
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* Footer */}
          <footer className="py-20 text-center z-10 relative" style={{ borderTop: `2px dashed ${p.border}` }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-4">🎉</motion.div>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase" style={{ color: p.body }}>
              Made with love on <span style={{ color: p.fun, fontWeight: 600 }}>Shyara</span>
            </p>
          </footer>
        </div>
      )}
    </>
  );
};

export default ConfettiBurst;
