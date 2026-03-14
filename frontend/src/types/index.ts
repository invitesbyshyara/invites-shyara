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
  accessRole?: string;
  permissions?: CollaboratorPermission[];
}

export type RsvpResponse = 'yes' | 'no' | 'maybe';

export interface Rsvp {
  id: string;
  inviteId: string;
  guestId?: string;
  name: string;
  email?: string;
  response: RsvpResponse;
  guestCount: number;
  message: string;
  submittedAt: string;
  adultCount?: number;
  childCount?: number;
  mealChoice?: string;
  dietaryRestrictions?: string;
  customAnswers?: Record<string, unknown>;
  stayNeeded?: boolean;
  roomRequirement?: string;
  transportNeeded?: boolean;
  transportMode?: string;
  language?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  emailPreferences?: {
    rsvpNotifications: boolean;
    weeklyDigest: boolean;
    marketing: boolean;
  };
  mfaEnabled?: boolean;
  recoveryCodesRemaining?: number;
}

export interface PlatformStatus {
  customerAcquisitionLocked: boolean;
  notice?: string | null;
}

export interface InviteViewer {
  token: string;
  name: string;
  email?: string;
  phone?: string;
  language: string;
  audienceSegment?: string;
  response?: RsvpResponse;
  guestCount?: number;
  adultCount?: number;
  childCount?: number;
  mealChoice?: string;
  dietaryRestrictions?: string;
  household?: string;
  stayNeeded?: boolean;
  roomRequirement?: string;
  transportNeeded?: boolean;
  transportMode?: string;
  customAnswers?: Record<string, unknown>;
}

export interface PublicInviteData {
  templateSlug: string;
  templateCategory: EventCategory;
  data: Record<string, any>;
  inviteId: string;
  status?: InviteStatus;
  selectedLanguage?: string;
  languages?: string[];
  viewer?: InviteViewer;
}

export interface CustomRsvpQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'number';
  required: boolean;
  options?: string[];
  translations?: Record<string, string>;
}

export interface RsvpSettings {
  collectEmail: boolean;
  allowPlusOnes: boolean;
  maxGuestCount?: number;
  collectAdultsChildrenSplit: boolean;
  collectMealChoice: boolean;
  mealOptions: string[];
  collectDietaryRestrictions: boolean;
  collectTravelPlans: boolean;
  collectStayNeeds: boolean;
  collectHousehold: boolean;
  collectPhone: boolean;
  deadline?: string;
  customQuestions: CustomRsvpQuestion[];
  language?: string;
  enabledLanguages?: string[];
  viewer?: InviteViewer;
}

export interface InviteGuest {
  id: string;
  inviteId: string;
  token: string;
  name: string;
  email?: string;
  phone?: string;
  household?: string;
  audienceSegment: string;
  tags: string[];
  language: string;
  invitationStatus: 'invited' | 'confirmed' | 'waitlisted' | 'cancelled';
  response?: RsvpResponse;
  guestCount: number;
  adultCount?: number;
  childCount?: number;
  message?: string;
  mealChoice?: string;
  dietaryRestrictions?: string;
  customAnswers?: Record<string, unknown>;
  stayNeeded?: boolean;
  lodgingStatus?: string;
  hotelName?: string;
  roomType?: string;
  roomCount?: number;
  checkInDate?: string;
  checkOutDate?: string;
  shuttleRequired?: boolean;
  transportMode?: string;
  arrivalDetails?: string;
  departureDetails?: string;
  parkingRequired: boolean;
  supportNotes?: string;
  inviteSentAt?: string;
  lastBroadcastAt?: string;
  rsvpSubmittedAt?: string;
  guestLink?: string;
  createdAt: string;
  updatedAt: string;
}

export type CollaboratorPermission =
  | 'edit_content'
  | 'manage_rsvps'
  | 'send_reminders'
  | 'view_reports'
  | 'handle_guest_support';

export interface InviteCollaborator {
  id: string;
  inviteId: string;
  userId?: string;
  email: string;
  name?: string;
  roleLabel: string;
  permissions: CollaboratorPermission[];
  status: 'pending' | 'active' | 'revoked';
  invitedByUserId: string;
  inviteToken: string;
  invitedAt: string;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteAccessRequest {
  id: string;
  inviteId: string;
  requesterUserId: string;
  requesterCollaboratorId: string;
  requestedPermissions: CollaboratorPermission[];
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  decidedByUserId?: string;
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  requesterCollaborator?: {
    id: string;
    email: string;
    name?: string;
    roleLabel: string;
    status: InviteCollaborator['status'];
    permissions: CollaboratorPermission[];
  };
  decider?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BroadcastAudience {
  guestIds?: string[];
  segments?: string[];
  responses?: Array<RsvpResponse | 'pending'>;
  languages?: string[];
  onlyMissingRsvp?: boolean;
}

export interface BroadcastRecipient {
  id: string;
  broadcastId: string;
  guestId?: string;
  email: string;
  name?: string;
  language: string;
  status: 'pending' | 'sent' | 'opened' | 'bounced';
  openToken: string;
  sentAt?: string;
  openedAt?: string;
  bouncedAt?: string;
  errorMessage?: string;
  inviteUrl?: string;
  createdAt: string;
}

export interface InviteBroadcast {
  id: string;
  inviteId: string;
  type:
    | 'venue_change'
    | 'timing_update'
    | 'rsvp_reminder'
    | 'dress_code_reminder'
    | 'weather_advisory'
    | 'parking_update'
    | 'photos_uploaded'
    | 'post_event_thank_you'
    | 'custom';
  title: string;
  subject?: string;
  message: string;
  language: string;
  audience: BroadcastAudience;
  status: 'draft' | 'sent' | 'partial';
  sentAt?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  recipients: BroadcastRecipient[];
  stats?: {
    sent: number;
    opened: number;
    bounced: number;
  };
}

export interface LocalizationSettings {
  defaultLanguage: string;
  enabledLanguages: string[];
  translations: Record<string, Record<string, unknown>>;
  translationMeta: Record<
    string,
    {
      status: 'up_to_date' | 'stale' | 'failed';
      sourceHash?: string;
      translatedAt?: string;
      lastRequestedAt?: string;
      lastError?: string;
      provider?: string;
      model?: string;
    }
  >;
}

export interface OperationsSummary {
  totals: {
    invited: number;
    attending: number;
    households: number;
    adults: number;
    children: number;
    stayRequests: number;
    transportRequests: number;
  };
  mealCounts: Record<string, number>;
  roomSummary: Record<string, { rooms: number; guests: number }>;
  transportSummary: Record<string, number>;
  followUpTasks: string[];
  missingInfoAlerts: string[];
}

export interface InviteWorkspace {
  invite: {
    id: string;
    slug: string;
    status: InviteStatus;
    templateSlug: string;
  };
  availableLanguages: string[];
  defaultLanguage: string;
  rsvpSettings: RsvpSettings;
  localization?: LocalizationSettings;
  summary?: OperationsSummary;
  guests: InviteGuest[];
  collaborators: InviteCollaborator[];
  broadcasts: InviteBroadcast[];
  accessRole: string;
  permissions: CollaboratorPermission[];
  requestablePermissions: CollaboratorPermission[];
  myAccessRequests: InviteAccessRequest[];
  accessRequests: InviteAccessRequest[];
}
