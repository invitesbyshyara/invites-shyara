import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  prefix?: string;
  accentColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, change, icon, prefix = '', accentColor = 'hsl(var(--primary))' }) => {
  const isPositive = change >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 relative overflow-hidden">
      {/* Accent left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ background: accentColor }} />
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: `linear-gradient(135deg, ${accentColor}, transparent)` }} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="text-2xl font-bold text-card-foreground font-body mt-2">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', isPositive ? 'text-emerald-600' : 'text-red-500')}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs yesterday</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
