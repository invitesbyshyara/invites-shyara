export type AdminRole = 'admin' | 'support';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt?: string;
  lastLoginAt?: string | null;
  mfaEnabled?: boolean;
  recoveryCodesRemaining?: number;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  totalInvites: number;
  totalSpent: number;
  status: 'active' | 'suspended';
  lastActive: string;
  plan: 'free' | 'premium';
}

export interface AdminInvite {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  templateSlug: string;
  templateName: string;
  templateCategory: string;
  eventName: string;
  slug: string;
  status: 'draft' | 'published' | 'expired' | 'taken-down';
  eventDate: string;
  rsvpCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTransaction {
  id: string;
  customerId: string;
  customerName: string;
  templateSlug: string;
  templateName: string;
  amount: number;
  currency: string;
  date: string;
  status: 'success' | 'failed' | 'refunded';
  failureReason?: string;
  refundAmount?: number;
}

export interface AdminTemplate {
  slug: string;
  name: string;
  category: string;
  tags: string[];
  price: number;
  priceUsd: number;
  priceEur: number;
  isFree: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  purchaseCount: number;
  previewCount: number;
  activeInviteCount: number;
  thumbnail: string;
  dateAdded: string;
  supportedSections: string[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  templateCount: number;
  displayOrder: number;
  isVisible: boolean;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  appliesTo: 'all' | 'template' | 'category';
  appliesToValue?: string;
  usageCount: number;
  usageLimit: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'disabled';
  usageDetails: { customerName: string; customerEmail: string; templateName: string; date: string }[];
}

export interface AdminAnnouncement {
  id: string;
  subject: string;
  body: string;
  recipientTarget: 'all' | 'new_30d' | 'active_invites' | 'specific';
  recipientEmail?: string;
  dateSent: string;
  recipientCount: number;
}

export interface AdminSettings {
  currency: 'USD' | 'EUR';
  defaultPremiumPrice: number;
  maxFileSizes: {
    coverImage: number;
    galleryPhoto: number;
    introAnimation: number;
  };
  maintenanceMode: boolean;
  rsvpDeadlineDays: number;
  featureFlags: FeatureFlag[];
}

export interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface ActivityLogEntry {
  id: string;
  customerId: string;
  action: string;
  timestamp: string;
  isAdminAction: boolean;
  adminEmail?: string;
  details?: string;
}

export interface InternalNote {
  id: string;
  entityId: string;
  entityType: 'customer' | 'invite';
  content: string;
  authorEmail: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalUsersChange: number;
  activeInvites: number;
  activeInvitesChange: number;
  todayRevenue: number;
  todayRevenueChange: number;
  newSignupsToday: number;
  newSignupsTodayChange: number;
  totalTemplates: number;
  totalTemplatesChange: number;
  totalRsvps: number;
  totalRsvpsChange: number;
}

export interface GlobalSearchResult {
  customers: { id: string; name: string; email: string }[];
  invites: { id: string; slug: string; eventName: string; customerName: string }[];
  transactions: { id: string; customerName: string; amount: number; status: string }[];
}

export const CURRENCY_SYMBOLS: Record<AdminSettings['currency'], string> = {
  USD: '$',
  EUR: '€',
};
