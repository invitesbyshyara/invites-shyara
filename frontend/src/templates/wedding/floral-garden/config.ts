import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'floral-garden',
  name: 'Floral Garden',
  category: 'wedding',
  tags: ['floral', 'romantic', 'pastel', 'garden'],
  isPremium: true,
  price: 499,
  priceUsd: 499,
  priceEur: 449,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Ananya',
    groomName: 'Rohan',
    weddingDate: '2026-03-22',
    weddingTime: '5:00 PM',
    venueName: 'Wildflower Meadows',
    venueAddress: '45 Garden Lane, Lonavala, Maharashtra',
    loveStory: 'We met at a friend\'s garden party and bonded over our shared love of sunsets and spontaneous road trips.',
    schedule: [
      { time: '3:00 PM', title: 'Welcome Drinks', description: 'Cocktails by the fountain' },
      { time: '5:00 PM', title: 'Garden Ceremony', description: 'Exchange of vows under the oak tree' },
      { time: '7:30 PM', title: 'Dinner & Dancing', description: 'Al fresco dining and music' },
    ],
    rsvpDeadline: '2026-03-10',
    enableMusic: true,
  },
};

export default config;

