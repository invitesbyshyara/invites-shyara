export type EventCategory = 'wedding' | 'engagement' | 'birthday' | 'baby-shower' | 'corporate' | 'anniversary';

export type TemplateFieldType = 'text' | 'textarea' | 'date' | 'time' | 'image' | 'images' | 'toggle' | 'schedule-list' | 'number' | 'url';

export interface TemplateField {
  key: string;
  label: string;
  type: TemplateFieldType;
  required: boolean;
  section?: 'basic' | 'venue' | 'story' | 'schedule' | 'gallery' | 'rsvp' | 'settings';
  maxLength?: number;
  max?: number;
  placeholder?: string;
}

export interface TemplateConfig {
  slug: string;
  name: string;
  category: EventCategory;
  tags: string[];
  isPremium: boolean;
  price: number;
  priceUsd: number;
  priceEur: number;
  thumbnail: string;
  previewImages: string[];
  supportedSections: string[];
  fields: TemplateField[];
  dummyData: Record<string, any>;
}

export type InviteStatus = 'draft' | 'published' | 'expired' | 'taken-down';

export interface Invite {
  id: string;
  userId: string;
  templateSlug: string;
  templateCategory: EventCategory;
  slug: string;
  status: InviteStatus;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  rsvpCount: number;
  isPurchased: boolean;
}

export type RsvpResponse = 'yes' | 'no' | 'maybe';

export interface Rsvp {
  id: string;
  inviteId: string;
  name: string;
  response: RsvpResponse;
  guestCount: number;
  message: string;
  submittedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface PublicInviteData {
  templateSlug: string;
  templateCategory: EventCategory;
  data: Record<string, any>;
  inviteId: string;
  status?: InviteStatus;
}
