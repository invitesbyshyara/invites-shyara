import { TemplateConfig } from '@/types';
import { weddingFields } from '../../shared-fields';

const config: TemplateConfig = {
  slug: 'velvet-3d',
  name: 'Velvet 3D',
  category: 'wedding',
  tags: ['3d', 'luxury', 'modern', 'dark', 'elegant', 'rose-gold'],
  isPremium: true,
  price: 799,
  priceUsd: 799,
  priceEur: 699,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Ananya',
    groomName: 'Rahul',
    weddingDate: '2026-11-22',
    weddingTime: '7:00 PM',
    venueName: 'The Crystal Ballroom',
    venueAddress: '12 Palace Road, Bandra West, Mumbai 400050',
    loveStory:
      'Two souls who found each other in a world of chaos, and chose to build a lifetime of quiet magic together. From a chance meeting to a forever promise — this is our story.',
    coverPhoto: '',
    galleryPhotos: [],
    schedule: [
      { time: '6:30 PM', title: 'Arrival & Welcome Drinks', description: 'Settle in and enjoy the ambiance' },
      { time: '7:00 PM', title: 'Wedding Ceremony', description: 'The sacred union begins' },
      { time: '8:00 PM', title: 'Dinner & Reception', description: 'A grand feast and celebration' },
      { time: '9:30 PM', title: 'Dancing & Music', description: "Let's celebrate all night long" },
    ],
    rsvpDeadline: '2026-11-10',
    enableMusic: false,
  },
};

export default config;
