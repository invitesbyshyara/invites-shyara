import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'eternal-vows',
  name: 'Eternal Vows',
  category: 'wedding',
  tags: ['classic', 'timeless', 'ivory', 'elegant'],
  isPremium: true,
  price: 549,
  priceUsd: 549,
  priceEur: 499,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Meera',
    groomName: 'Karan',
    weddingDate: '2026-11-28',
    weddingTime: '6:00 PM',
    venueName: 'The Oberoi Udaivilas',
    venueAddress: 'Haridasji Ki Magri, Udaipur, Rajasthan 313001',
    loveStory: 'From college sweethearts to soulmates — our journey of ten years has been nothing short of magical.',
    schedule: [
      { time: '4:00 PM', title: 'Baraat Procession', description: 'Grand welcome of the groom' },
      { time: '6:00 PM', title: 'Wedding Ceremony', description: 'Pheras and vows by the lake' },
      { time: '8:30 PM', title: 'Grand Reception', description: 'Gala dinner and celebrations' },
    ],
    rsvpDeadline: '2026-11-15',
    enableMusic: true,
  },
};

export default config;

