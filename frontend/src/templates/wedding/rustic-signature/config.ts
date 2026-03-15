import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'rustic-signature',
  name: 'Rustic Signature',
  category: 'wedding',
  packageCode: 'package_b',
  tags: ['rustic', 'editorial', 'premium', 'wedding'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Aarohi',
    groomName: 'Kabir',
    weddingDate: '2026-11-21',
    weddingTime: '5:30 PM',
    venueName: 'The Orchard House',
    venueAddress: 'Riverside Lane, Alibaug, Maharashtra',
    loveStory: 'A slower, softer celebration inspired by weekend dinners, handwritten notes, and long drives toward the sea.',
    schedule: [
      { time: '4:30 PM', title: 'Welcome Drinks', description: 'Garden cocktails and live acoustic music' },
      { time: '5:30 PM', title: 'Ceremony', description: 'Vows under the old banyan trees' },
      { time: '8:00 PM', title: 'Dinner & Dancing', description: 'An intimate dinner followed by the dance floor opening' },
    ],
    rsvpDeadline: '2026-11-05',
    enableMusic: false,
  },
};

export default config;
