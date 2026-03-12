import { TemplateConfig } from '@/types';
import { birthdayFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'confetti-burst',
  name: 'Confetti Burst',
  category: 'birthday',
  tags: ['fun', 'colorful', 'party', 'confetti'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'schedule', 'gallery', 'venue', 'rsvp'],
  fields: birthdayFields,
  dummyData: {
    celebrantName: 'Rahul',
    age: 30,
    eventDate: '2026-07-22',
    eventTime: '7:00 PM',
    venueName: 'SkyLounge',
    venueAddress: 'Phoenix Mills, Lower Parel, Mumbai',
    welcomeMessage: 'Three decades down and the party\'s just getting started! Come celebrate Rahul\'s big 3-0!',
    schedule: [
      { time: '7:00 PM', title: 'Doors Open', description: 'Welcome drinks and mingling' },
      { time: '8:30 PM', title: 'Cake Cutting', description: 'The moment of truth!' },
      { time: '9:00 PM', title: 'Dance Floor Opens', description: 'Let\'s party!' },
    ],
    rsvpDeadline: '2026-07-15',
  },
};

export default config;

