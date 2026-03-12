import { TemplateConfig } from '@/types';
import { anniversaryFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'timeless-love',
  name: 'Timeless Love',
  category: 'anniversary',
  tags: ['elegant', 'classic', 'warm', 'golden'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: anniversaryFields,
  dummyData: {
    coupleNames: 'Mr. & Mrs. Kapoor',
    years: 25,
    anniversaryDate: '2026-12-01',
    anniversaryTime: '6:00 PM',
    venueName: 'The Taj Mahal Palace',
    venueAddress: 'Apollo Bunder, Colaba, Mumbai 400001',
    ourJourney: 'Twenty-five years of love, laughter, and growing together. From our first dance to watching our children grow — every moment has been a blessing.',
    schedule: [
      { time: '6:00 PM', title: 'Welcome Reception', description: 'Champagne and memories' },
      { time: '7:00 PM', title: 'Renewal of Vows', description: 'Recommitting to forever' },
      { time: '8:00 PM', title: 'Gala Dinner', description: 'A grand celebration of 25 years' },
    ],
    rsvpDeadline: '2026-11-20',
    enableMusic: true,
  },
};

export default config;

