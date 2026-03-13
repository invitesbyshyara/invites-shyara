import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'rustic-charm',
  name: 'Rustic Charm',
  category: 'wedding',
  tags: ['rustic', 'barn', 'countryside', 'warm'],
  isPremium: true,
  price: 400,
  priceUsd: 400,
  priceEur: 500,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    brideName: 'Priya',
    groomName: 'Amit',
    weddingDate: '2026-10-10',
    weddingTime: '11:00 AM',
    venueName: 'The Farmhouse',
    venueAddress: 'Old Mill Road, Karjat, Maharashtra',
    loveStory: 'A simple love story — we grew up as neighbours, became best friends, and one day realized we were meant for each other.',
    schedule: [
      { time: '11:00 AM', title: 'Morning Ceremony', description: 'Traditional rituals in the courtyard' },
      { time: '1:00 PM', title: 'Lunch Reception', description: 'Farm-to-table feast' },
    ],
    rsvpDeadline: '2026-09-25',
    enableMusic: false,
  },
};

export default config;
