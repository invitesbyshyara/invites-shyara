import { TemplateConfig, EventCategory } from '@/types';

interface Props {
  config: TemplateConfig;
  className?: string;
}

const themes: Record<string, {
  bg: string; accent: string; text: string; sub: string;
}> = {
  'rustic-charm': { bg: 'linear-gradient(160deg, hsl(30,30%,92%) 0%, hsl(25,25%,85%) 100%)', accent: 'hsl(25,55%,45%)', text: 'hsl(25,40%,22%)', sub: 'hsl(25,20%,50%)' },
};

const categoryEmoji: Record<EventCategory, string> = {
  wedding: '💍', engagement: '💕', birthday: '🎂', 'baby-shower': '👶', corporate: '🏢', anniversary: '❤️',
};

const getTitle = (config: TemplateConfig): string => {
  const d = config.dummyData;
  if (config.category === 'wedding') return `${d.brideName || ''} & ${d.groomName || ''}`;
  if (config.category === 'engagement') return `${d.partnerOneName || ''} & ${d.partnerTwoName || ''}`;
  if (config.category === 'birthday') return d.celebrantName || 'Birthday';
  if (config.category === 'baby-shower') return d.parentNames || 'Baby Shower';
  if (config.category === 'corporate') return d.eventName || 'Event';
  if (config.category === 'anniversary') return d.coupleNames || 'Anniversary';
  return config.name;
};

const getDate = (config: TemplateConfig): string => {
  const d = config.dummyData;
  return d.weddingDate || d.engagementDate || d.eventDate || d.anniversaryDate || '';
};

const TemplateThumbnail = ({ config, className = '' }: Props) => {
  const t = themes[config.slug] || {
    bg: 'linear-gradient(160deg, hsl(220,15%,92%), hsl(220,10%,88%))',
    accent: 'hsl(220,60%,50%)', text: 'hsl(220,30%,20%)', sub: 'hsl(220,10%,50%)',
  };

  const isDark = false;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden select-none ${className}`} style={{ background: t.bg }}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="h-px w-8" style={{ background: t.accent, opacity: 0.4 }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent, opacity: 0.5 }} />
        <div className="h-px w-8" style={{ background: t.accent, opacity: 0.4 }} />
      </div>

      {(config.category === 'wedding' || config.category === 'engagement') && (
        <>
          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l rounded-tl" style={{ borderColor: `${t.accent}40` }} />
          <div className="absolute top-3 right-3 w-6 h-6 border-t border-r rounded-tr" style={{ borderColor: `${t.accent}40` }} />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l rounded-bl" style={{ borderColor: `${t.accent}40` }} />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r rounded-br" style={{ borderColor: `${t.accent}40` }} />
        </>
      )}

      {config.category === 'birthday' && (
        <>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: 4 + Math.random() * 4, height: 4 + Math.random() * 4,
              background: ['hsl(350,85%,55%)', 'hsl(200,90%,55%)', 'hsl(45,95%,60%)', 'hsl(140,70%,50%)', 'hsl(280,80%,60%)', 'hsl(30,90%,55%)'][i],
              top: `${15 + Math.random() * 70}%`, left: `${10 + Math.random() * 80}%`, opacity: 0.4,
            }} />
          ))}
        </>
      )}

      <span className="text-[8px] uppercase tracking-[0.35em] font-body mb-4" style={{ color: t.sub }}>
        {config.category.replace('-', ' ')}
      </span>

      <span className="text-3xl mb-3 opacity-80">{categoryEmoji[config.category]}</span>

      <h3 className="font-display text-lg md:text-xl font-bold text-center leading-tight mb-1" style={{ color: t.text }}>
        {getTitle(config)}
      </h3>

      <div className="flex items-center gap-2 my-3">
        <div className="h-px w-6" style={{ background: t.accent }} />
        <div className="w-1 h-1 rounded-full" style={{ background: t.accent }} />
        <div className="h-px w-6" style={{ background: t.accent }} />
      </div>

      <div className="w-full max-w-[140px] space-y-1.5 mt-2">
        <div className="h-1.5 rounded-full mx-auto" style={{ background: t.sub, opacity: 0.25, width: '80%' }} />
        <div className="h-1.5 rounded-full mx-auto" style={{ background: t.sub, opacity: 0.15, width: '60%' }} />
        <div className="h-1.5 rounded-full mx-auto" style={{ background: t.sub, opacity: 0.1, width: '45%' }} />
      </div>

      <div className="mt-4 px-4 py-1.5 rounded-full border" style={{ borderColor: `${t.accent}30`, background: isDark ? 'hsla(0,0%,100%,0.05)' : 'hsla(0,0%,0%,0.03)' }}>
        <span className="text-[9px] font-body font-medium" style={{ color: t.accent }}>{getDate(config) || 'June 15, 2026'}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`, opacity: 0.5 }} />
    </div>
  );
};

export default TemplateThumbnail;
