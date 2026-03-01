import { useState } from 'react';
import { motion } from 'framer-motion';
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

export interface RendererProps {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const GenericRenderer = ({ config, data, isPreview = false, inviteId }: RendererProps) => {
  const [isOpened, setIsOpened] = useState(false);

  const getTitle = () => {
    if (config.category === 'wedding') return `${data.brideName || ''} & ${data.groomName || ''}`;
    if (config.category === 'engagement') return `${data.partnerOneName || ''} & ${data.partnerTwoName || ''}`;
    if (config.category === 'birthday') return data.celebrantName ? `${data.celebrantName}'s Birthday` : 'Birthday Celebration';
    if (config.category === 'baby-shower') return data.parentNames || 'Baby Shower';
    if (config.category === 'corporate') return data.eventName || 'Corporate Event';
    if (config.category === 'anniversary') return data.coupleNames || 'Anniversary';
    return 'You\'re Invited';
  };

  const getDate = () => data.weddingDate || data.engagementDate || data.eventDate || data.anniversaryDate || '';
  const getTime = () => data.weddingTime || data.engagementTime || data.eventTime || data.anniversaryTime || '';
  const getStory = () => data.loveStory || data.ourStory || data.ourJourney || data.welcomeMessage || data.description || '';

  return (
    <>
      <InviteCover
        title={getTitle()}
        date={getDate()}
        time={getTime()}
        slug={data.slug || 'preview'}
        isPreview={isPreview}
        theme="default"
        onOpen={() => setIsOpened(true)}
      />

      {isOpened && (
        <div className="min-h-screen bg-background">
          {/* Hero */}
          {config.supportedSections.includes('hero') && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="py-24 px-6 text-center bg-gradient-to-b from-primary/5 via-background to-background"
            >
              <motion.p custom={0} variants={fadeUp} className="text-xs uppercase tracking-[0.4em] text-gold mb-6 font-body">Together with their families</motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold text-foreground mb-4 leading-tight">{getTitle()}</motion.h1>
              <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground font-body">
                invite you to celebrate their {config.category.replace('-', ' ')}
              </motion.p>
              {getDate() && (
                <motion.div custom={3} variants={fadeUp} className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-accent/50 border border-border">
                  <span className="text-sm font-medium text-foreground font-body">{getDate()}</span>
                  {getTime() && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gold" />
                      <span className="text-sm text-muted-foreground font-body">{getTime()}</span>
                    </>
                  )}
                </motion.div>
              )}
            </motion.section>
          )}

          {/* Story */}
          {config.supportedSections.includes('story') && getStory() && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-20 px-6"
            >
              <div className="max-w-2xl mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-8">Our Story</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-px bg-gold mx-auto mb-8" />
                <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed text-lg font-body">{getStory()}</motion.p>
              </div>
            </motion.section>
          )}

          {/* Schedule */}
          {config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-20 px-6 bg-accent/30"
            >
              <div className="max-w-2xl mx-auto">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-4">Event Schedule</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-px bg-gold mx-auto mb-12" />
                <div className="space-y-8">
                  {data.schedule.map((item: { time: string; title: string; description?: string }, i: number) => (
                    <motion.div key={i} custom={i + 2} variants={fadeUp} className="flex gap-6 items-start">
                      <div className="w-24 shrink-0 text-sm font-medium text-gold font-body pt-1">{item.time}</div>
                      <div className="border-l-2 border-gold/30 pl-6">
                        <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                        {item.description && <p className="text-sm text-muted-foreground mt-1 font-body">{item.description}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* Venue */}
          {config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-20 px-6 text-center"
            >
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4">Venue</motion.h2>
              <motion.div custom={1} variants={fadeUp} className="w-16 h-px bg-gold mx-auto mb-8" />
              {data.venueName && <motion.p custom={2} variants={fadeUp} className="text-xl font-display font-medium">{data.venueName}</motion.p>}
              {data.venueAddress && <motion.p custom={3} variants={fadeUp} className="text-muted-foreground mt-2 font-body">{data.venueAddress}</motion.p>}
              <motion.div custom={4} variants={fadeUp} className="mt-8 max-w-2xl mx-auto h-56 bg-muted rounded-xl flex items-center justify-center text-muted-foreground font-body border border-border">
                Map placeholder
              </motion.div>
            </motion.section>
          )}

          {/* Gallery */}
          {config.supportedSections.includes('gallery') && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-20 px-6 bg-accent/30"
            >
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-4">Gallery</motion.h2>
              <motion.div custom={1} variants={fadeUp} className="w-16 h-px bg-gold mx-auto mb-12" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div key={i} custom={i + 1} variants={fadeUp} className="aspect-square bg-muted rounded-xl flex items-center justify-center text-muted-foreground text-sm font-body border border-border">
                    Photo {i}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* RSVP */}
          {config.supportedSections.includes('rsvp') && inviteId && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="py-20 px-6"
            >
              <div className="max-w-md mx-auto text-center">
                <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold mb-4">RSVP</motion.h2>
                <motion.div custom={1} variants={fadeUp} className="w-16 h-px bg-gold mx-auto mb-6" />
                <motion.p custom={2} variants={fadeUp} className="text-muted-foreground mb-8 font-body">We'd love to hear from you</motion.p>
                <motion.div custom={3} variants={fadeUp}>
                  <InviteRsvpForm inviteId={inviteId} />
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* Footer */}
          <footer className="py-12 text-center border-t border-border">
            <p className="text-muted-foreground text-xs font-body tracking-wide">Made with love on <span className="text-gold font-medium">Shyara</span></p>
          </footer>
        </div>
      )}
    </>
  );
};

export default GenericRenderer;
