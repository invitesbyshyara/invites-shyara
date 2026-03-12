import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'celestial-dreams',
  name: 'Celestial Dreams',
  category: 'wedding',
  tags: ['celestial', 'starry', 'night', 'navy', 'dreamy'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Isha',
    groomName: 'Dev',
    weddingDate: '2026-12-20',
    weddingTime: '7:00 PM',
    venueName: 'Starlight Terrace',
    venueAddress: 'Hilltop Resort, Mahabaleshwar, Maharashtra',
    loveStory: 'Written in the stars — we matched on an app, met under the night sky at a rooftop cafe, and knew it was destiny.',
    schedule: [
      { time: '5:00 PM', title: 'Sunset Cocktails', description: 'Welcome drinks as the sun sets' },
      { time: '7:00 PM', title: 'Ceremony Under the Stars', description: 'Vows exchange on the terrace' },
      { time: '9:00 PM', title: 'Starlit Reception', description: 'Dinner and dancing under the sky' },
    ],
    rsvpDeadline: '2026-12-05',
    enableMusic: true,
  },
};

export default config;

