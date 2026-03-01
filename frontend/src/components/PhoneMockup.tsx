import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  scale?: number;
}

const PhoneMockup = ({ children, className = '', scale = 1 }: Props) => (
  <div className={`relative ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
    {/* Phone frame */}
    <div className="relative w-[280px] h-[560px] rounded-[2.5rem] border-[6px] border-foreground/15 bg-foreground/5 shadow-2xl overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/15 rounded-b-2xl z-20" />
      {/* Screen */}
      <div className="w-full h-full overflow-hidden rounded-[2rem]">
        {children}
      </div>
    </div>
    {/* Reflection highlight */}
    <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
      style={{ background: 'linear-gradient(135deg, hsla(0,0%,100%,0.08) 0%, transparent 50%)' }}
    />
  </div>
);

export default PhoneMockup;
