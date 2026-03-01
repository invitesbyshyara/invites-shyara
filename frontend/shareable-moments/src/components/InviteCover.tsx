import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteCoverProps {
  title: string;
  subtitle?: string;
  date?: string;
  time?: string;
  slug: string;
  isPreview?: boolean;
  theme?: 'gold' | 'dark-floral' | 'confetti' | 'pastel-floral' | 'ivory-classic' | 'rustic-warm' | 'celestial-navy' | 'golden-warm' | 'rose-pink' | 'neon-dark' | 'star-blue' | 'sweet-pink' | 'corporate-dark' | 'corporate-light' | 'anniversary-warm' | 'default';
  onOpen: () => void;
}

const themeStyles: Record<string, { bg: string; text: string; heading: string; accent: string; btn: string; ornament: string }> = {
  gold: {
    bg: 'bg-gradient-to-b from-[hsl(38,40%,12%)] via-[hsl(38,30%,8%)] to-[hsl(38,20%,5%)]',
    text: 'text-[hsl(38,65%,75%)]',
    heading: 'text-[hsl(38,65%,70%)]',
    accent: 'text-[hsl(38,65%,55%)]',
    btn: 'bg-[hsl(38,65%,50%)] text-[hsl(38,80%,5%)] hover:bg-[hsl(38,65%,45%)]',
    ornament: 'text-[hsl(38,50%,35%)]',
  },
  'dark-floral': {
    bg: 'bg-gradient-to-b from-[hsl(280,25%,8%)] via-[hsl(310,20%,10%)] to-[hsl(340,15%,6%)]',
    text: 'text-[hsl(330,30%,80%)]',
    heading: 'text-[hsl(330,40%,85%)]',
    accent: 'text-[hsl(330,50%,70%)]',
    btn: 'bg-[hsl(330,40%,50%)] text-[hsl(330,20%,95%)] hover:bg-[hsl(330,40%,45%)]',
    ornament: 'text-[hsl(280,20%,30%)]',
  },
  confetti: {
    bg: 'bg-gradient-to-b from-[hsl(45,90%,55%)] via-[hsl(30,85%,55%)] to-[hsl(350,80%,55%)]',
    text: 'text-[hsl(0,0%,100%)]',
    heading: 'text-[hsl(0,0%,100%)]',
    accent: 'text-[hsl(0,0%,100%)]/80',
    btn: 'bg-[hsl(0,0%,100%)] text-[hsl(350,80%,40%)] hover:bg-[hsl(0,0%,95%)]',
    ornament: 'text-[hsl(0,0%,100%)]/30',
  },
  'pastel-floral': {
    bg: 'bg-gradient-to-b from-[hsl(150,25%,92%)] via-[hsl(120,20%,95%)] to-[hsl(140,20%,90%)]',
    text: 'text-[hsl(150,30%,35%)]',
    heading: 'text-[hsl(150,40%,25%)]',
    accent: 'text-[hsl(150,45%,40%)]',
    btn: 'bg-[hsl(150,45%,40%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(150,45%,35%)]',
    ornament: 'text-[hsl(150,20%,70%)]',
  },
  'ivory-classic': {
    bg: 'bg-gradient-to-b from-[hsl(0,0%,97%)] via-[hsl(345,10%,95%)] to-[hsl(345,15%,92%)]',
    text: 'text-[hsl(345,25%,35%)]',
    heading: 'text-[hsl(345,50%,30%)]',
    accent: 'text-[hsl(345,50%,45%)]',
    btn: 'bg-[hsl(345,50%,40%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(345,50%,35%)]',
    ornament: 'text-[hsl(345,15%,75%)]',
  },
  'rustic-warm': {
    bg: 'bg-gradient-to-b from-[hsl(30,30%,90%)] via-[hsl(25,25%,85%)] to-[hsl(20,20%,80%)]',
    text: 'text-[hsl(25,40%,30%)]',
    heading: 'text-[hsl(25,55%,25%)]',
    accent: 'text-[hsl(25,55%,40%)]',
    btn: 'bg-[hsl(25,55%,40%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(25,55%,35%)]',
    ornament: 'text-[hsl(25,20%,60%)]',
  },
  'celestial-navy': {
    bg: 'bg-gradient-to-b from-[hsl(230,35%,10%)] via-[hsl(240,30%,8%)] to-[hsl(260,25%,6%)]',
    text: 'text-[hsl(230,20%,75%)]',
    heading: 'text-[hsl(45,80%,75%)]',
    accent: 'text-[hsl(45,80%,65%)]',
    btn: 'bg-[hsl(45,80%,60%)] text-[hsl(230,35%,10%)] hover:bg-[hsl(45,80%,55%)]',
    ornament: 'text-[hsl(45,50%,30%)]',
  },
  'golden-warm': {
    bg: 'bg-gradient-to-b from-[hsl(39,35%,95%)] via-[hsl(39,30%,92%)] to-[hsl(39,25%,88%)]',
    text: 'text-[hsl(39,40%,30%)]',
    heading: 'text-[hsl(39,50%,22%)]',
    accent: 'text-[hsl(39,70%,45%)]',
    btn: 'bg-[hsl(39,70%,45%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(39,70%,40%)]',
    ornament: 'text-[hsl(39,30%,65%)]',
  },
  'rose-pink': {
    bg: 'bg-gradient-to-b from-[hsl(350,30%,95%)] via-[hsl(340,25%,93%)] to-[hsl(330,20%,90%)]',
    text: 'text-[hsl(350,35%,35%)]',
    heading: 'text-[hsl(350,45%,30%)]',
    accent: 'text-[hsl(350,60%,50%)]',
    btn: 'bg-[hsl(350,60%,50%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(350,60%,45%)]',
    ornament: 'text-[hsl(350,20%,70%)]',
  },
  'neon-dark': {
    bg: 'bg-gradient-to-b from-[hsl(260,30%,8%)] via-[hsl(270,25%,6%)] to-[hsl(280,20%,4%)]',
    text: 'text-[hsl(0,0%,80%)]',
    heading: 'text-[hsl(170,100%,60%)]',
    accent: 'text-[hsl(280,80%,65%)]',
    btn: 'bg-[hsl(170,100%,45%)] text-[hsl(260,30%,5%)] hover:bg-[hsl(170,100%,40%)]',
    ornament: 'text-[hsl(170,50%,25%)]',
  },
  'star-blue': {
    bg: 'bg-gradient-to-b from-[hsl(210,40%,93%)] via-[hsl(210,35%,95%)] to-[hsl(200,30%,90%)]',
    text: 'text-[hsl(210,30%,35%)]',
    heading: 'text-[hsl(210,40%,25%)]',
    accent: 'text-[hsl(45,80%,50%)]',
    btn: 'bg-[hsl(210,50%,45%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(210,50%,40%)]',
    ornament: 'text-[hsl(45,50%,65%)]',
  },
  'sweet-pink': {
    bg: 'bg-gradient-to-b from-[hsl(340,35%,95%)] via-[hsl(340,30%,93%)] to-[hsl(160,25%,92%)]',
    text: 'text-[hsl(340,30%,35%)]',
    heading: 'text-[hsl(340,40%,30%)]',
    accent: 'text-[hsl(340,50%,55%)]',
    btn: 'bg-[hsl(340,50%,55%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(340,50%,50%)]',
    ornament: 'text-[hsl(340,20%,70%)]',
  },
  'corporate-dark': {
    bg: 'bg-gradient-to-b from-[hsl(220,20%,12%)] via-[hsl(220,18%,10%)] to-[hsl(220,15%,7%)]',
    text: 'text-[hsl(0,0%,75%)]',
    heading: 'text-[hsl(0,0%,95%)]',
    accent: 'text-[hsl(210,70%,55%)]',
    btn: 'bg-[hsl(210,70%,50%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(210,70%,45%)]',
    ornament: 'text-[hsl(220,10%,30%)]',
  },
  'corporate-light': {
    bg: 'bg-gradient-to-b from-[hsl(0,0%,100%)] via-[hsl(220,10%,97%)] to-[hsl(220,10%,94%)]',
    text: 'text-[hsl(220,20%,40%)]',
    heading: 'text-[hsl(220,25%,15%)]',
    accent: 'text-[hsl(220,80%,50%)]',
    btn: 'bg-[hsl(220,80%,50%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(220,80%,45%)]',
    ornament: 'text-[hsl(220,15%,75%)]',
  },
  'anniversary-warm': {
    bg: 'bg-gradient-to-b from-[hsl(20,35%,92%)] via-[hsl(15,30%,88%)] to-[hsl(20,25%,85%)]',
    text: 'text-[hsl(20,40%,30%)]',
    heading: 'text-[hsl(20,50%,22%)]',
    accent: 'text-[hsl(20,60%,40%)]',
    btn: 'bg-[hsl(20,60%,40%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(20,60%,35%)]',
    ornament: 'text-[hsl(20,25%,60%)]',
  },
  default: {
    bg: 'bg-gradient-to-b from-primary/10 via-background to-accent/20',
    text: 'text-muted-foreground',
    heading: 'text-foreground',
    accent: 'text-gold',
    btn: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ornament: 'text-muted-foreground/20',
  },
};

type ExitType = 'doors' | 'curtain' | 'zoom-burst' | 'fade-up' | 'slide-left' | 'default';

function getExitType(theme: string): ExitType {
  switch (theme) {
    case 'gold':
    case 'ivory-classic':
    case 'rustic-warm':
    case 'celestial-navy':
    case 'anniversary-warm':
    case 'golden-warm':
      return 'doors';
    case 'pastel-floral':
    case 'rose-pink':
    case 'dark-floral':
      return 'curtain';
    case 'confetti':
    case 'neon-dark':
      return 'zoom-burst';
    case 'star-blue':
    case 'sweet-pink':
      return 'fade-up';
    case 'corporate-dark':
    case 'corporate-light':
      return 'slide-left';
    default:
      return 'default';
  }
}

const cubicEase: [number, number, number, number] = [0.76, 0, 0.24, 1];

function getExitVariant(type: ExitType, side?: 'left' | 'right') {
  switch (type) {
    case 'doors':
      return { x: side === 'left' ? '-100%' : '100%', transition: { duration: 0.8, ease: cubicEase } };
    case 'curtain':
      return { y: '100vh', transition: { duration: 0.7, ease: cubicEase } };
    case 'zoom-burst':
      return { scale: 1.8, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' as const } };
    case 'fade-up':
      return { y: -60, opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' as const } };
    case 'slide-left':
      return { x: '-100vw', transition: { duration: 0.5, ease: cubicEase } };
    default:
      return { opacity: 0, scale: 1.05, transition: { duration: 0.6, ease: 'easeInOut' as const } };
  }
}

const CoverContent = ({ s, subtitle, title, date, time, showSkip, handleOpen }: {
  s: typeof themeStyles.default;
  subtitle?: string;
  title: string;
  date?: string;
  time?: string;
  showSkip: boolean;
  handleOpen: () => void;
}) => (
  <>
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className={`text-6xl mb-2 ${s.ornament}`}
    >
      ✦
    </motion.div>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className={`text-xs uppercase tracking-[0.4em] ${s.text} mb-6 font-body`}
    >
      {subtitle || "You're Invited"}
    </motion.p>

    <motion.h1
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
      className={`font-display text-4xl md:text-6xl lg:text-7xl font-bold ${s.heading} mb-3 leading-tight`}
    >
      {title}
    </motion.h1>

    {date && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className={`text-lg ${s.text} mb-1 font-body`}
      >
        {date}
      </motion.p>
    )}
    {time && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className={`text-sm ${s.accent} mb-10 font-body`}
      >
        {time}
      </motion.p>
    )}

    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleOpen}
      className={`px-10 py-4 rounded-full font-body font-medium text-sm tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl ${s.btn}`}
    >
      Open Invitation
    </motion.button>

    <AnimatePresence>
      {showSkip && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOpen}
          className={`absolute bottom-8 text-xs ${s.text} font-body hover:underline`}
        >
          Skip Intro →
        </motion.button>
      )}
    </AnimatePresence>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className={`text-6xl mt-2 ${s.ornament}`}
    >
      ✦
    </motion.div>
  </>
);

const InviteCover = ({ title, subtitle, date, time, slug, isPreview, theme = 'default', onOpen }: InviteCoverProps) => {
  const [show, setShow] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const storageKey = `shyara_intro_seen_${slug}`;
  const s = themeStyles[theme] || themeStyles.default;
  const exitType = useMemo(() => getExitType(theme), [theme]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || (!isPreview && localStorage.getItem(storageKey))) {
      setShow(false);
      onOpen();
      return;
    }
    const timer = setTimeout(() => setShowSkip(true), 4000);
    return () => clearTimeout(timer);
  }, [storageKey, isPreview, onOpen]);

  const handleOpen = () => {
    setShow(false);
    if (!isPreview) localStorage.setItem(storageKey, 'true');
    onOpen();
  };

  const contentProps = { s, subtitle, title, date, time, showSkip, handleOpen };
  const baseClass = `fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center ${s.bg}`;

  return (
    <AnimatePresence>
      {show && exitType === 'doors' ? (
        <>
          <motion.div
            key="door-left"
            initial={{ x: 0 }}
            exit={getExitVariant('doors', 'left')}
            className={baseClass}
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          >
            <CoverContent {...contentProps} />
          </motion.div>
          <motion.div
            key="door-right"
            initial={{ x: 0 }}
            exit={getExitVariant('doors', 'right')}
            className={baseClass}
            style={{ clipPath: 'inset(0 0 0 50%)' }}
          >
            <CoverContent {...contentProps} />
          </motion.div>
        </>
      ) : show ? (
        <motion.div
          key="cover-single"
          initial={{ opacity: 1 }}
          exit={getExitVariant(exitType)}
          className={baseClass}
        >
          <CoverContent {...contentProps} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default InviteCover;
