import { TemplateConfig } from '@/types';
import { birthdayFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'neon-glow',
  name: 'Neon Glow',
  category: 'birthday',
  tags: ['neon', 'modern', 'party', 'glow', 'dark'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: birthdayFields,
  dummyData: {
    celebrantName: 'Zara',
    age: 25,
    eventDate: '2026-09-12',
    eventTime: '8:00 PM',
    venueName: 'Neon Club',
    venueAddress: 'Hauz Khas Village, New Delhi',
    welcomeMessage: 'Quarter century! Let\'s glow up and celebrate Zara\'s 25th in style! 🎉',
    schedule: [
      { time: '8:00 PM', title: 'Neon Hour', description: 'Pick up your glow accessories' },
      { time: '9:30 PM', title: 'Birthday Bash', description: 'Cake, music, and surprises' },
      { time: '11:00 PM', title: 'After Party', description: 'Dance till dawn' },
    ],
    rsvpDeadline: '2026-09-05',
  },
};

export default config;

