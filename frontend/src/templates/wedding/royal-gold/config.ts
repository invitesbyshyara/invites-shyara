import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'royal-gold',
  name: 'Royal Gold',
  category: 'wedding',
  tags: ['luxury', 'traditional', 'gold', 'elegant'],
  isPremium: true,
  price: 599,
  priceUsd: 599,
  priceEur: 549,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Sarah',
    groomName: 'Aryan',
    weddingDate: '2026-06-15',
    weddingTime: '4:00 PM',
    venueName: 'The Grand Palace',
    venueAddress: '123 Royal Avenue, Bandra West, Mumbai 400050',
    loveStory: 'Our story began on a rainy evening in Mumbai, where two strangers found shelter under the same bookshop awning. What started as a conversation about favourite authors turned into a lifetime of shared stories. Three years, countless adventures, and one unforgettable sunset proposal later — here we are, ready to write our most beautiful chapter together.',
    schedule: [
      { time: '10:00 AM', title: 'Mehndi Ceremony', description: 'Traditional henna celebration at the garden pavilion' },
      { time: '2:00 PM', title: 'Haldi Ceremony', description: 'Turmeric blessing at the poolside' },
      { time: '4:00 PM', title: 'Wedding Ceremony', description: 'The main ceremony at the Grand Hall' },
      { time: '7:00 PM', title: 'Reception & Dinner', description: 'Dinner, toasts, and celebrations' },
    ],
    rsvpDeadline: '2026-06-01',
    enableMusic: true,
  },
};

export default config;

