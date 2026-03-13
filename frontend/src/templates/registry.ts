import { lazy } from 'react';
import { TemplateConfig, EventCategory } from '@/types';

// Static config imports (small data files, safe to bundle)
import rusticCharm from './wedding/rustic-charm/config';

export const allTemplates: TemplateConfig[] = [
  rusticCharm,
];

export const getTemplateBySlug = (slug: string): TemplateConfig | undefined =>
  allTemplates.find(t => t.slug === slug);

export const getTemplatesByCategory = (category: EventCategory): TemplateConfig[] =>
  allTemplates.filter(t => t.category === category);

export const categories: { value: EventCategory; label: string }[] = [
  { value: 'wedding', label: 'Wedding' },
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
