import { TemplateConfig } from '@/types';
import { corporateFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'modern-summit',
  name: 'Modern Summit',
  category: 'corporate',
  tags: ['minimal', 'modern', 'startup', 'tech'],
  isPremium: false,
  price: 599,
  priceUsd: 599,
  priceEur: 549,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: corporateFields,
  dummyData: {
    eventName: 'Startup Founders Meetup',
    organizerName: 'TechHub Community',
    companyName: 'TechHub',
    eventDate: '2026-05-20',
    eventTime: '6:00 PM',
    venueName: 'WeWork Galaxy',
    venueAddress: 'Residency Road, Bangalore',
    description: 'An evening for founders, builders, and dreamers. Share stories, find co-founders, and build the future.',
    schedule: [
      { time: '6:00 PM', title: 'Networking', description: 'Introductions and drinks' },
      { time: '7:00 PM', title: 'Lightning Talks', description: '5-minute pitches from 6 founders' },
      { time: '8:30 PM', title: 'Open Discussions', description: 'Round tables on key topics' },
    ],
    rsvpDeadline: '2026-05-15',
  },
};

export default config;

