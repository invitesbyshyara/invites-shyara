import { TemplateConfig } from '@/types';
import { babyShowerFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'sweet-arrival',
  name: 'Sweet Arrival',
  category: 'baby-shower',
  tags: ['pastel', 'sweet', 'soft', 'cute'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: babyShowerFields,
  dummyData: {
    parentNames: 'Deepika & Siddharth',
    babyName: 'Baby D',
    eventDate: '2026-06-08',
    eventTime: '2:00 PM',
    venueName: 'Sugar & Spice Studio',
    venueAddress: 'Jubilee Hills, Hyderabad',
    welcomeMessage: 'Sugar, spice, and everything nice! A sweet little one is arriving soon. Celebrate with us!',
    theme: 'Pastel Dreams',
    registryLink: 'https://example.com/registry',
    rsvpDeadline: '2026-05-30',
  },
};

export default config;

