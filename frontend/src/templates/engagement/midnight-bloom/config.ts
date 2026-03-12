import { TemplateConfig } from '@/types';
import { engagementFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'midnight-bloom',
  name: 'Midnight Bloom',
  category: 'engagement',
  tags: ['dark', 'floral', 'moody', 'elegant'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: engagementFields,
  dummyData: {
    partnerOneName: 'Neha',
    partnerTwoName: 'Vikram',
    engagementDate: '2026-08-14',
    engagementTime: '6:00 PM',
    venueName: 'The Sapphire Room',
    venueAddress: 'JW Marriott, Juhu, Mumbai',
    ourStory: 'He proposed under the blooming jasmine tree where they had their first date — at midnight, of course.',
    schedule: [
      { time: '6:00 PM', title: 'Ring Ceremony', description: 'The moment we say yes, forever' },
      { time: '7:30 PM', title: 'Cocktail Hour', description: 'Drinks and mingling' },
      { time: '8:30 PM', title: 'Dinner & Celebrations', description: 'Fine dining and music' },
    ],
    rsvpDeadline: '2026-08-01',
    enableMusic: true,
  },
};

export default config;

