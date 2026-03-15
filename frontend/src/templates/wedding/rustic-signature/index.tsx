import { CSSProperties, useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';
import { getLiveInviteCopy } from '@/utils/liveInviteCopy';

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
  language?: string;
}

const palette = {
  background: 'hsl(36, 38%, 95%)',
  wash: 'hsl(35, 34%, 90%)',
  card: 'hsla(0, 0%, 100%, 0.72)',
  cardStrong: 'hsl(36, 30%, 98%)',
  ink: 'hsl(18, 22%, 18%)',
  muted: 'hsl(18, 12%, 42%)',
  line: 'hsla(28, 28%, 34%, 0.18)',
  gold: 'hsl(32, 48%, 46%)',
  plum: 'hsl(10, 22%, 24%)',
  dark: 'hsl(14, 18%, 14%)',
};

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.72,
      ease: 'easeOut' as const,
    },
  }),
};

const sectionSurface: CSSProperties = {
  background: palette.card,
  border: `1px solid ${palette.line}`,
  boxShadow: '0 20px 70px rgba(58, 40, 28, 0.08)',
  backdropFilter: 'blur(16px)',
};

const SectionEyebrow = ({ children }: { children: string }) => (
  <p
    className="text-[11px] uppercase tracking-[0.34em] font-body"
    style={{ color: palette.gold }}
  >
    {children}
  </p>
);

const Monogram = ({ brideName, groomName }: { brideName?: string; groomName?: string }) => {
  const brideInitial = (brideName?.trim()?.[0] ?? 'A').toUpperCase();
  const groomInitial = (groomName?.trim()?.[0] ?? 'K').toUpperCase();

  return (
    <div
      className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border"
      style={{
        borderColor: palette.line,
        background:
          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), rgba(233,224,210,0.66) 72%, rgba(213,191,162,0.44))',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="font-display text-5xl" style={{ color: palette.plum }}>{brideInitial}</span>
        <span className="text-xl" style={{ color: palette.gold }}>&</span>
        <span className="font-display text-5xl" style={{ color: palette.plum }}>{groomInitial}</span>
      </div>
    </div>
  );
};

const SignatureDivider = () => (
  <div className="flex items-center justify-center gap-4">
    <div className="h-px w-14" style={{ background: palette.line }} />
    <div className="h-2 w-2 rounded-full" style={{ background: palette.gold }} />
    <div className="h-px w-14" style={{ background: palette.line }} />
  </div>
);

const RusticSignature = ({ config, data, isPreview = false, inviteId, language }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const title = `${data.brideName || 'Bride'} & ${data.groomName || 'Groom'}`;
  const copy = getLiveInviteCopy(language);

  return (
    <>
      <InviteCover
        title={title}
        subtitle="An editorial countryside celebration"
        date={data.weddingDate || ''}
        time={data.weddingTime || ''}
        slug={data.slug || 'preview'}
        isPreview={isPreview}
        language={language}
        theme="ivory-classic"
        onOpen={() => setIsOpened(true)}
      />

      {isOpened && (
        <div className="min-h-screen overflow-hidden relative" style={{ background: palette.background }}>
          <div
            className="pointer-events-none fixed inset-0 opacity-70"
            style={{
              background: `
                radial-gradient(circle at top left, rgba(216, 191, 158, 0.26), transparent 35%),
                radial-gradient(circle at bottom right, rgba(137, 92, 63, 0.16), transparent 32%),
                linear-gradient(180deg, ${palette.background}, ${palette.wash})
              `,
            }}
          />
          <div
            className="pointer-events-none fixed inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(93, 67, 50, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(93, 67, 50, 0.05) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />

          {config.supportedSections.includes('hero') && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative z-10 px-6 pt-20 pb-16 md:pt-28 md:pb-24"
            >
              <div className="mx-auto grid max-w-6xl gap-8 rounded-[32px] p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10" style={sectionSurface}>
                <div className="space-y-6">
                  <motion.div custom={0} variants={fadeUp} className="space-y-4">
                    <SectionEyebrow>Rustic Signature</SectionEyebrow>
                    <h1 className="font-display text-5xl leading-[0.92] md:text-7xl" style={{ color: palette.ink }}>
                      {data.brideName || 'Bride'}
                      <span className="mx-3 inline-block align-middle text-3xl md:text-4xl" style={{ color: palette.gold }}>
                        &
                      </span>
                      {data.groomName || 'Groom'}
                    </h1>
                    <p className="max-w-xl text-base leading-8 font-body md:text-lg" style={{ color: palette.muted }}>
                      {data.loveStory || copy.areTyingTheKnot}
                    </p>
                  </motion.div>

                  <motion.div custom={1} variants={fadeUp} className="flex flex-wrap gap-3">
                    {data.weddingDate && (
                      <div className="rounded-full px-5 py-2 text-sm font-body" style={{ background: palette.cardStrong, border: `1px solid ${palette.line}`, color: palette.ink }}>
                        {data.weddingDate}
                      </div>
                    )}
                    {data.weddingTime && (
                      <div className="rounded-full px-5 py-2 text-sm font-body" style={{ background: palette.cardStrong, border: `1px solid ${palette.line}`, color: palette.ink }}>
                        {data.weddingTime}
                      </div>
                    )}
                    {data.venueName && (
                      <div className="rounded-full px-5 py-2 text-sm font-body" style={{ background: palette.cardStrong, border: `1px solid ${palette.line}`, color: palette.ink }}>
                        {data.venueName}
                      </div>
                    )}
                  </motion.div>

                  <motion.div custom={2} variants={fadeUp} className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] p-5" style={{ background: 'rgba(255,255,255,0.55)', border: `1px solid ${palette.line}` }}>
                      <SectionEyebrow>{copy.thePlan}</SectionEyebrow>
                      <p className="mt-3 text-sm leading-7 font-body" style={{ color: palette.muted }}>
                        {copy.areTyingTheKnot} {data.venueAddress ? `Join us at ${data.venueAddress}.` : ''}
                      </p>
                    </div>
                    <div className="rounded-[24px] p-5" style={{ background: palette.dark, color: 'white' }}>
                      <SectionEyebrow>Signature Note</SectionEyebrow>
                      <p className="mt-3 text-sm leading-7 font-body text-white/75">
                        A slower, more polished rustic mood designed for couples who want an elevated invitation-first experience.
                      </p>
                    </div>
                  </motion.div>
                </div>

                <motion.div custom={3} variants={fadeUp} className="flex flex-col items-center justify-center gap-6 rounded-[28px] p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(236,226,212,0.8))', border: `1px solid ${palette.line}` }}>
                  <Monogram brideName={data.brideName} groomName={data.groomName} />
                  <div className="space-y-3">
                    <SectionEyebrow>{copy.yourInvited}</SectionEyebrow>
                    <p className="font-display text-3xl" style={{ color: palette.plum }}>{copy.countrysideCelebration}</p>
                    <p className="text-sm leading-7 font-body" style={{ color: palette.muted }}>
                      Open the full invite, follow the celebration, and respond when the event tools are enabled.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('story') && data.loveStory && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative z-10 px-6 py-8 md:py-12"
            >
              <div className="mx-auto max-w-5xl rounded-[32px] p-8 md:p-12" style={{ background: palette.dark, boxShadow: '0 24px 90px rgba(24, 18, 15, 0.18)' }}>
                <motion.div custom={0} variants={fadeUp} className="text-center">
                  <SectionEyebrow>{copy.ourStory}</SectionEyebrow>
                  <div className="mt-5"><SignatureDivider /></div>
                  <p className="mx-auto mt-6 max-w-3xl text-lg leading-9 font-body text-white/78 md:text-xl">
                    {data.loveStory}
                  </p>
                </motion.div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative z-10 px-6 py-10"
            >
              <div className="mx-auto max-w-5xl rounded-[32px] p-8 md:p-12" style={sectionSurface}>
                <motion.div custom={0} variants={fadeUp} className="text-center">
                  <SectionEyebrow>{copy.thePlan}</SectionEyebrow>
                  <h2 className="mt-4 font-display text-4xl md:text-5xl" style={{ color: palette.ink }}>
                    The celebration unfolds
                  </h2>
                </motion.div>

                <div className="mt-10 space-y-5">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, index: number) => (
                    <motion.div
                      key={`${item.time}-${item.title}-${index}`}
                      custom={index + 1}
                      variants={fadeUp}
                      className="grid gap-4 rounded-[26px] p-5 md:grid-cols-[130px_1fr]"
                      style={{ background: palette.cardStrong, border: `1px solid ${palette.line}` }}
                    >
                      <div className="text-sm font-body uppercase tracking-[0.24em]" style={{ color: palette.gold }}>
                        {item.time}
                      </div>
                      <div>
                        <h3 className="font-display text-2xl" style={{ color: palette.plum }}>{item.title}</h3>
                        {item.description && (
                          <p className="mt-2 text-sm leading-7 font-body" style={{ color: palette.muted }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative z-10 px-6 py-10"
            >
              <div className="mx-auto grid max-w-5xl gap-6 rounded-[32px] p-8 md:grid-cols-[0.9fr_1.1fr] md:p-12" style={sectionSurface}>
                <motion.div custom={0} variants={fadeUp} className="space-y-5">
                  <SectionEyebrow>{copy.theVenue}</SectionEyebrow>
                  <h2 className="font-display text-4xl md:text-5xl" style={{ color: palette.ink }}>
                    {data.venueName || 'The celebration venue'}
                  </h2>
                  <p className="text-sm leading-8 font-body" style={{ color: palette.muted }}>
                    {data.venueAddress || 'Venue details coming soon.'}
                  </p>
                  <div className="rounded-[24px] p-5" style={{ background: palette.cardStrong, border: `1px solid ${palette.line}` }}>
                    <p className="text-sm leading-7 font-body" style={{ color: palette.muted }}>
                      Arrive early for the welcome moment, stay late for dinner and dancing, and keep the invitation open for every live update.
                    </p>
                  </div>
                </motion.div>

                <motion.div custom={1} variants={fadeUp} className="rounded-[30px] p-6 md:p-8" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(224,208,187,0.74))', border: `1px solid ${palette.line}` }}>
                  <div className="flex h-full min-h-[220px] flex-col justify-between rounded-[24px] border border-dashed p-6" style={{ borderColor: palette.line }}>
                    <div>
                      <SectionEyebrow>Travel note</SectionEyebrow>
                      <p className="mt-3 text-sm leading-7 font-body" style={{ color: palette.muted }}>
                        Save the address, share the link, and let the invite act as the single source of truth for every guest.
                      </p>
                    </div>
                    <div className="pt-8">
                      <SignatureDivider />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>
          )}

          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative z-10 px-6 py-12"
            >
              <div className="mx-auto max-w-3xl rounded-[32px] p-8 text-center md:p-12" style={sectionSurface}>
                <motion.div custom={0} variants={fadeUp}>
                  <SectionEyebrow>{copy.rsvp}</SectionEyebrow>
                  <h2 className="mt-4 font-display text-4xl md:text-5xl" style={{ color: palette.ink }}>
                    Reply to the celebration
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 font-body" style={{ color: palette.muted }}>
                    {copy.wedLoveToHaveYouThere}
                  </p>
                </motion.div>
                <motion.div
                  custom={1}
                  variants={fadeUp}
                  className="mt-8 rounded-[28px] p-6 text-left md:p-8"
                  style={{ background: palette.cardStrong, border: `1px solid ${palette.line}` }}
                >
                  <InviteRsvpForm inviteId={inviteId} />
                </motion.div>
              </div>
            </motion.section>
          )}

          <footer className="relative z-10 px-6 pb-16 pt-6">
            <div className="mx-auto max-w-4xl rounded-[28px] border p-8 text-center" style={{ borderColor: palette.line, background: 'rgba(255,255,255,0.45)' }}>
              <SignatureDivider />
              <p className="mt-5 font-display text-3xl" style={{ color: palette.plum }}>
                {data.brideName || 'Bride'} & {data.groomName || 'Groom'}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.34em] font-body" style={{ color: palette.muted }}>
                {copy.poweredBy} <span style={{ color: palette.gold }}>Shyara</span>
              </p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

export default RusticSignature;
