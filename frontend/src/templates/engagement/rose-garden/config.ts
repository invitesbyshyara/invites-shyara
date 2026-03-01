import { TemplateConfig } from '@/types';
import { engagementFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'rose-garden',
  name: 'Rose Garden',
  category: 'engagement',
  tags: ['rose', 'pink', 'romantic', 'garden'],
  isPremium: true,
  price: 399,
  priceUsd: 399,
  priceEur: 349,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: engagementFields,
  dummyData: {
    partnerOneName: 'Kavya',
    partnerTwoName: 'Arjun',
    engagementDate: '2026-04-05',
    engagementTime: '4:00 PM',
    venueName: 'Rose Petal Gardens',
    venueAddress: 'MG Road, Bangalore, Karnataka',
    ourStory: 'A love that blossomed like roses in spring — unexpected, beautiful, and meant to last forever.',
    schedule: [
      { time: '4:00 PM', title: 'Welcome & Blessings', description: 'Family blessings ceremony' },
      { time: '5:00 PM', title: 'Ring Exchange', description: 'The proposal we\'ve been waiting for' },
      { time: '6:30 PM', title: 'Garden Party', description: 'Celebrate with us!' },
    ],
    rsvpDeadline: '2026-03-25',
    enableMusic: true,
  },
};

export default config;

