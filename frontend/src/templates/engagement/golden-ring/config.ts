import { TemplateConfig } from '@/types';
import { engagementFields } from '@/templates/shared-fields';

const config: TemplateConfig = {
  slug: 'golden-ring',
  name: 'Golden Ring',
  category: 'engagement',
  tags: ['gold', 'classic', 'warm', 'romantic'],
  isPremium: true,
  price: 9900,
  priceUsd: 9900,
  priceEur: 11900,
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: engagementFields,
  dummyData: {
    partnerOneName: 'Aisha',
    partnerTwoName: 'Rajan',
    engagementDate: '2026-05-18',
    engagementTime: '5:00 PM',
    venueName: 'Golden Bay Resort',
    venueAddress: 'ECR Road, Chennai, Tamil Nadu',
    ourStory: 'From best friends to forever — we couldn\'t imagine life without each other.',
    schedule: [
      { time: '5:00 PM', title: 'Ring Exchange', description: 'The big moment!' },
      { time: '6:30 PM', title: 'Celebration Dinner', description: 'Dinner with family and friends' },
    ],
    rsvpDeadline: '2026-05-10',
    enableMusic: false,
  },
};

export default config;

