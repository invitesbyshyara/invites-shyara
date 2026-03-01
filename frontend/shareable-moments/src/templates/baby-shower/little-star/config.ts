import { TemplateConfig } from '@/types';
import { babyShowerFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'little-star',
  name: 'Little Star',
  category: 'baby-shower',
  tags: ['stars', 'cute', 'twinkle', 'soft'],
  isPremium: false,
  price: 0,
  priceUsd: 0,
  priceEur: 0,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: babyShowerFields,
  dummyData: {
    parentNames: 'Sneha & Raj',
    babyName: 'Coming Soon!',
    eventDate: '2026-04-20',
    eventTime: '3:00 PM',
    venueName: 'The Nest Cafe',
    venueAddress: 'Koramangala, Bangalore',
    welcomeMessage: 'A little star is on the way! Join us for an afternoon of love, laughter, and baby games.',
    theme: 'Twinkle Twinkle Little Star',
    rsvpDeadline: '2026-04-12',
  },
};

export default config;

