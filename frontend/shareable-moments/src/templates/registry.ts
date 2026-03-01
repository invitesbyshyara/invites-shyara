import { lazy } from 'react';
import { TemplateConfig, EventCategory } from '@/types';

// Static config imports (small data files, safe to bundle)
import royalGold from './wedding/royal-gold/config';
import floralGarden from './wedding/floral-garden/config';
import eternalVows from './wedding/eternal-vows/config';
import rusticCharm from './wedding/rustic-charm/config';
import celestialDreams from './wedding/celestial-dreams/config';
import midnightBloom from './engagement/midnight-bloom/config';
import goldenRing from './engagement/golden-ring/config';
import roseGarden from './engagement/rose-garden/config';
import confettiBurst from './birthday/confetti-burst/config';
import neonGlow from './birthday/neon-glow/config';
import littleStar from './baby-shower/little-star/config';
import sweetArrival from './baby-shower/sweet-arrival/config';
import executiveEdge from './corporate/executive-edge/config';
import modernSummit from './corporate/modern-summit/config';
import timelessLove from './anniversary/timeless-love/config';

export const allTemplates: TemplateConfig[] = [
  royalGold,
  floralGarden,
  eternalVows,
  rusticCharm,
  celestialDreams,
  midnightBloom,
  goldenRing,
  roseGarden,
  confettiBurst,
  neonGlow,
  littleStar,
  sweetArrival,
  executiveEdge,
  modernSummit,
  timelessLove,
];

export const getTemplateBySlug = (slug: string): TemplateConfig | undefined =>
  allTemplates.find(t => t.slug === slug);

export const getTemplatesByCategory = (category: EventCategory): TemplateConfig[] =>
  allTemplates.filter(t => t.category === category);

export const categories: { value: EventCategory; label: string }[] = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'baby-shower', label: 'Baby Shower' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'anniversary', label: 'Anniversary' },
];

// Dynamic renderer loading — Vite analyzes this glob at build time.
// At runtime, only the requested template's code is fetched.
const rendererModules = import.meta.glob('./*/*/index.tsx') as Record<
  string,
  () => Promise<{ default: React.ComponentType<any> }>
>;

export const getTemplateRenderer = (category: string, slug: string) => {
  const path = `./${category}/${slug}/index.tsx`;
  const loader = rendererModules[path];
  if (!loader) {
    throw new Error(`Template renderer not found: ${category}/${slug}`);
  }
  return lazy(loader);
};
