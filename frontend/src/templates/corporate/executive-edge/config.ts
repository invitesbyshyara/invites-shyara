import { TemplateConfig } from '@/types';
import { corporateFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'executive-edge',
  name: 'Executive Edge',
  category: 'corporate',
  tags: ['professional', 'clean', 'corporate', 'modern'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: corporateFields,
  dummyData: {
    eventName: 'Annual Innovation Summit 2026',
    organizerName: 'Shyara Technologies',
    companyName: 'Shyara Tech Pvt Ltd',
    eventDate: '2026-09-15',
    eventTime: '9:00 AM',
    venueName: 'Hyatt Regency',
    venueAddress: 'Ring Road, New Delhi',
    description: 'Join industry leaders for a day of insights, networking, and innovation. Keynotes, panels, and workshops designed to shape the future.',
    schedule: [
      { time: '9:00 AM', title: 'Registration & Breakfast', description: 'Check-in and networking' },
      { time: '10:00 AM', title: 'Keynote Address', description: 'The Future of Technology' },
      { time: '12:00 PM', title: 'Panel Discussion', description: 'AI in Enterprise' },
      { time: '1:00 PM', title: 'Lunch & Networking', description: 'Connect over a curated lunch' },
      { time: '3:00 PM', title: 'Workshops', description: 'Hands-on breakout sessions' },
    ],
    rsvpDeadline: '2026-09-01',
    galleryPhotos: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
    ],
  },
};

export default config;

