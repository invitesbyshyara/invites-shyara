import {
  AdminCustomer, AdminInvite, AdminTransaction, AdminTemplate,
  AdminCategory, AdminPromoCode, AdminAnnouncement, AdminSettings,
  ActivityLogEntry, InternalNote, DashboardStats, GlobalSearchResult,
  AdminUser,
} from '../types';

// ─── Config ──────────────────────────────────────────────────────

const TOKEN_KEY = 'shyara_admin_token';
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000';
const API_BASE = apiUrl.endsWith('/api') ? `${apiUrl}/admin` : `${apiUrl}/api/admin`;

// ─── Token helpers ────────────────────────────────────────────────

const getToken = () => sessionStorage.getItem(TOKEN_KEY);
const setToken = (t: string) => sessionStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = () => sessionStorage.removeItem(TOKEN_KEY);

// ─── Core request ────────────────────────────────────────────────

type ApiResponse<T> = { success: boolean; data: T; error?: string; pagination?: Pagination };
type Pagination = { page: number; limit: number; total: number; totalPages: number };

const request = async <T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<{ data: T; pagination?: Pagination }> => {
  const headers = new Headers(options.headers ?? {});
  const body = options.body;
  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (requiresAuth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, body, headers });
  const text = await res.text();
  if (!text) throw new Error('Empty response');
  const payload: ApiResponse<T> = JSON.parse(text);
  if (!res.ok || !payload.success) throw new Error(payload.error ?? `Request failed: ${res.status}`);
  return { data: payload.data, pagination: payload.pagination };
};

const r = async <T>(path: string, options?: RequestInit, requiresAuth = true): Promise<T> =>
  (await request<T>(path, options, requiresAuth)).data;

const rPaged = async <T>(path: string, options?: RequestInit): Promise<{ data: T; pagination?: Pagination }> =>
  request<T>(path, options);

// ─── Normalizers ─────────────────────────────────────────────────

const normalizeInviteStatus = (s: string) =>
  (s === 'taken_down' ? 'taken-down' : s) as AdminInvite['status'];

const mapCustomer = (u: Record<string, unknown>): AdminCustomer => ({
  id: u.id as string,
  name: u.name as string,
  email: u.email as string,
  phone: (u.phone as string | null) ?? '',
  avatar: (u.avatarUrl as string | null) ?? undefined,
  joinDate: u.createdAt as string,
  totalInvites: (u.inviteCount as number | undefined) ?? (u.totalInvites as number | undefined) ?? 0,
  totalSpent: (u.totalSpend as number | undefined) ?? (u.totalSpent as number | undefined) ?? 0,
  status: u.status as 'active' | 'suspended',
  lastActive: (u.lastLoginAt as string | null) ?? (u.createdAt as string),
  plan: u.plan as 'free' | 'premium',
});

const mapInvite = (i: Record<string, unknown>): AdminInvite => ({
  id: i.id as string,
  customerId: (i.userId as string | undefined) ?? (i.customerId as string),
  customerName: (i.customerName as string | undefined) ?? '',
  customerEmail: (i.customerEmail as string | undefined) ?? '',
  templateSlug: i.templateSlug as string,
  templateName: (i.templateName as string | undefined) ?? (i.templateSlug as string),
  templateCategory: (i.templateCategory as string).replace(/_/g, '-'),
  eventName: (i.eventName as string | undefined) ?? '',
  slug: i.slug as string,
  status: normalizeInviteStatus(i.status as string),
  eventDate: (i.eventDate as string | null) ?? '',
  rsvpCount: (i.rsvpCount as number | undefined) ?? 0,
  viewCount: (i.viewCount as number | undefined) ?? 0,
  createdAt: i.createdAt as string,
  updatedAt: i.updatedAt as string,
});

const mapTransaction = (t: Record<string, unknown>): AdminTransaction => ({
  id: t.id as string,
  customerId: (t.userId as string | undefined) ?? (t.customerId as string),
  customerName: (t.customerName as string | undefined) ?? '',
  templateSlug: t.templateSlug as string,
  templateName: (t.templateName as string | undefined) ?? (t.templateSlug as string),
  amount: t.amount as number,
  currency: (t.currency as string | undefined) ?? 'USD',
  date: t.createdAt as string,
  status: t.status as AdminTransaction['status'],
  failureReason: (t.failureReason as string | null) ?? undefined,
  refundAmount: undefined,
});

const mapTemplate = (t: Record<string, unknown>): AdminTemplate => ({
  slug: t.slug as string,
  name: t.name as string,
  category: (t.category as string).replace(/_/g, '-'),
  tags: (t.tags as string[]) ?? [],
  price: t.price as number,
  priceUsd: (t.priceUsd as number | undefined) ?? 0,
  priceEur: (t.priceEur as number | undefined) ?? 0,
  isFree: !(t.isPremium as boolean),
  isVisible: t.isVisible as boolean,
  isFeatured: t.isFeatured as boolean,
  purchaseCount: (t.purchaseCount as number | undefined) ?? 0,
  previewCount: 0,
  activeInviteCount: 0,
  thumbnail: '/placeholder.svg',
  dateAdded: (t.createdAt as string | undefined) ?? '',
  supportedSections: [],
});

const mapCategory = (c: Record<string, unknown>): AdminCategory => ({
  id: c.id as string,
  name: c.name as string,
  slug: c.slug as string,
  emoji: c.emoji as string,
  templateCount: (c.templateCount as number | undefined) ?? 0,
  displayOrder: (c.displayOrder as number | undefined) ?? 0,
  isVisible: c.isVisible as boolean,
});

const mapPromoCode = (p: Record<string, unknown>): AdminPromoCode => ({
  id: p.id as string,
  code: p.code as string,
  discountType: p.discountType as 'percentage' | 'flat',
  discountValue: p.discountValue as number,
  appliesTo: (p.appliesTo as string) === 'all' ? 'all' : 'template',
  appliesToValue: undefined,
  usageCount: (p.usageCount as number | undefined) ?? 0,
  usageLimit: (p.usageLimit as number | null) ?? 0,
  expiryDate: (p.expiresAt as string | null) ?? '',
  status: (() => {
    if (!(p.isActive as boolean)) return 'disabled' as const;
    if (p.expiresAt && new Date(p.expiresAt as string) < new Date()) return 'expired' as const;
    return 'active' as const;
  })(),
  usageDetails: [],
});

const mapAnnouncement = (a: Record<string, unknown>): AdminAnnouncement => ({
  id: a.id as string,
  subject: a.title as string,
  body: a.content as string,
  recipientTarget: (a.sentTo as string) as AdminAnnouncement['recipientTarget'],
  dateSent: a.sentAt as string,
  recipientCount: (a.recipientCount as number | undefined) ?? 0,
});

const mapNote = (n: Record<string, unknown>): InternalNote => ({
  id: n.id as string,
  entityId: n.entityId as string,
  entityType: n.entityType as 'customer' | 'invite',
  content: n.note as string,
  authorEmail: ((n.createdBy as Record<string, unknown> | undefined)?.email as string | undefined) ?? '',
  createdAt: n.createdAt as string,
});

// ─── Admin API ────────────────────────────────────────────────────

export const adminApi = {

  // Auth
  login: async (email: string, password: string): Promise<AdminUser> => {
    const result = await r<{ token: string; admin: { id: string; name: string; email: string; role: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false,
    );
    setToken(result.token);
    return { id: result.admin.id, name: result.admin.name, email: result.admin.email, role: result.admin.role as 'admin' | 'support' };
  },

  logout: async () => {
    try { await r<{ message: string }>('/auth/logout', { method: 'POST' }); } finally { clearAdminToken(); }
  },

  me: async (): Promise<AdminUser> => {
    const a = await r<{ id: string; name: string; email: string; role: string }>('/auth/me');
    return { id: a.id, name: a.name, email: a.email, role: a.role as 'admin' | 'support' };
  },

  // Dashboard
  getOverview: async (): Promise<DashboardStats> => {
    const d = await r<Record<string, number>>('/dashboard/overview');
    return {
      totalUsers: d.totalUsers ?? 0, totalUsersChange: 0,
      activeInvites: d.publishedInvites ?? 0, activeInvitesChange: 0,
      todayRevenue: d.revenueThisMonth ?? 0, todayRevenueChange: 0,
      newSignupsToday: d.newUsersThisMonth ?? 0, newSignupsTodayChange: 0,
      totalTemplates: 0, totalTemplatesChange: 0,
      totalRsvps: d.totalRsvps ?? 0, totalRsvpsChange: 0,
    };
  },

  getRevenueChart: async (period: '7d' | '30d' | '90d' = '30d') =>
    r<{ date: string; amount: number }[]>(`/dashboard/revenue?period=${period}`),

  getRecentSignups: async () => {
    const users = await r<Record<string, unknown>[]>('/dashboard/recent-signups');
    return users.map(mapCustomer);
  },

  getRecentTransactions: async () => {
    const txns = await r<Record<string, unknown>[]>('/dashboard/recent-transactions');
    return txns.map(mapTransaction);
  },

  getTopTemplates: async () => {
    const templates = await r<Record<string, unknown>[]>('/dashboard/top-templates');
    return templates.map(mapTemplate);
  },

  getPlatformAlerts: async () =>
    r<{ failedTransactionsCount: number; takenDownInvitesCount: number; suspendedUsersCount: number }>('/dashboard/alerts'),

  // Customers
  getCustomers: async (params?: { search?: string; status?: string; plan?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.plan) q.set('plan', params.plan);
    q.set('page', String(params?.page ?? 1));
    q.set('limit', String(params?.limit ?? 20));
    const { data, pagination } = await rPaged<Record<string, unknown>[]>(`/customers?${q.toString()}`);
    return { customers: data.map(mapCustomer), pagination };
  },

  getCustomer: async (id: string) => {
    const result = await r<{
      user: Record<string, unknown>;
      invites: Record<string, unknown>[];
      transactions: Record<string, unknown>[];
      stats: { inviteCount: number; rsvpCount: number; totalSpend: number };
    }>(`/customers/${id}`);
    return {
      customer: mapCustomer({ ...result.user, inviteCount: result.stats.inviteCount, totalSpend: result.stats.totalSpend }),
      invites: result.invites.map(mapInvite),
      transactions: result.transactions.map(mapTransaction),
      stats: result.stats,
    };
  },

  createCustomer: async (data: { name: string; email: string; password: string; plan?: string }) => {
    const u = await r<Record<string, unknown>>('/customers', { method: 'POST', body: JSON.stringify(data) });
    return mapCustomer(u);
  },

  updateCustomer: async (id: string, data: Partial<{ name: string; email: string; phone: string; plan: string; status: string }>) => {
    const u = await r<Record<string, unknown>>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return mapCustomer(u);
  },

  deleteCustomer: async (id: string) =>
    r<{ message: string }>(`/customers/${id}`, { method: 'DELETE' }),

  suspendCustomer: async (id: string, reason?: string) => {
    const u = await r<Record<string, unknown>>(`/customers/${id}/suspend`, {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    return mapCustomer(u);
  },

  unsuspendCustomer: async (id: string) => {
    const u = await r<Record<string, unknown>>(`/customers/${id}/unsuspend`, { method: 'POST' });
    return mapCustomer(u);
  },

  unlockTemplate: async (id: string, templateSlug: string, reason: string) =>
    r<Record<string, unknown>>(`/customers/${id}/unlock-template`, {
      method: 'POST', body: JSON.stringify({ templateSlug, reason }),
    }),

  getActivityLog: async (customerId: string): Promise<ActivityLogEntry[]> => {
    const result = await r<{ notes: unknown[]; timeline: Record<string, unknown>[] }>(
      `/customers/${customerId}/activity`,
    );
    return result.timeline.map((t) => ({
      id: t.id as string,
      customerId,
      action: t.action as string,
      timestamp: t.timestamp as string,
      isAdminAction: (t.isAdminAction as boolean | undefined) ?? false,
      adminEmail: t.adminEmail as string | undefined,
      details: t.details as string | undefined,
    }));
  },

  // Notes
  getNotes: async (entityId: string, entityType: 'customer' | 'invite'): Promise<InternalNote[]> => {
    const notes = await r<Record<string, unknown>[]>(`/notes?entityId=${entityId}&entityType=${entityType}`);
    return notes.map(mapNote);
  },

  addNote: async (entityId: string, entityType: 'customer' | 'invite', note: string): Promise<InternalNote> => {
    const n = await r<Record<string, unknown>>('/notes', {
      method: 'POST', body: JSON.stringify({ entityId, entityType, note }),
    });
    return mapNote(n);
  },

  // Invites
  getInvites: async (params?: { search?: string; status?: string; category?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.category) q.set('category', params.category);
    q.set('page', String(params?.page ?? 1));
    q.set('limit', String(params?.limit ?? 20));
    const { data, pagination } = await rPaged<Record<string, unknown>[]>(`/invites?${q.toString()}`);
    return { invites: data.map(mapInvite), pagination };
  },

  getInvite: async (id: string) => {
    const i = await r<Record<string, unknown>>(`/invites/${id}`);
    return mapInvite(i);
  },

  updateInviteSlug: async (id: string, slug: string) => {
    const i = await r<Record<string, unknown>>(`/invites/${id}/slug`, {
      method: 'PUT', body: JSON.stringify({ slug }),
    });
    return mapInvite(i);
  },

  takedownInvite: async (id: string, reason?: string) => {
    const i = await r<Record<string, unknown>>(`/invites/${id}/takedown`, {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    return mapInvite(i);
  },

  republishInvite: async (id: string) => {
    const i = await r<Record<string, unknown>>(`/invites/${id}/republish`, { method: 'POST' });
    return mapInvite(i);
  },

  getInviteRsvps: async (id: string) =>
    r<{
      rsvps: Record<string, unknown>[];
      stats: { total: number; yes: number; no: number; maybe: number; totalGuests: number };
    }>(`/invites/${id}/rsvps`),

  // Templates
  getTemplates: async (): Promise<AdminTemplate[]> => {
    const templates = await r<Record<string, unknown>[]>('/templates');
    return templates.map(mapTemplate);
  },

  getTemplate: async (slug: string): Promise<AdminTemplate> => {
    const t = await r<Record<string, unknown>>(`/templates/${slug}`);
    return mapTemplate(t);
  },

  createTemplate: async (data: {
    slug: string; name: string; category: string; tags?: string[];
    isPremium: boolean; price?: number; priceUsd?: number; priceEur?: number; isVisible: boolean; isFeatured: boolean;
  }) => {
    const t = await r<Record<string, unknown>>('/templates', { method: 'POST', body: JSON.stringify(data) });
    return mapTemplate(t);
  },

  updateTemplate: async (slug: string, data: Partial<{
    name: string; isPremium: boolean; price: number; priceUsd: number; priceEur: number;
    isVisible: boolean; isFeatured: boolean; sortOrder: number;
  }>) => {
    const t = await r<Record<string, unknown>>(`/templates/${slug}`, { method: 'PUT', body: JSON.stringify(data) });
    return mapTemplate(t);
  },

  deleteTemplate: async (slug: string) =>
    r<{ message: string }>(`/templates/${slug}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: async (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    q.set('page', String(params?.page ?? 1));
    q.set('limit', String(params?.limit ?? 20));
    const { data, pagination } = await rPaged<{
      transactions: Record<string, unknown>[];
      summary: { totalRevenue: number; successCount: number; failedCount: number; refundedCount: number };
    }>(`/transactions?${q.toString()}`);
    return { transactions: data.transactions.map(mapTransaction), summary: data.summary, pagination };
  },

  refundTransaction: async (id: string, reason: string) => {
    const t = await r<Record<string, unknown>>(`/transactions/${id}/refund`, {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    return mapTransaction(t);
  },

  // Categories
  getCategories: async (): Promise<AdminCategory[]> => {
    const cats = await r<Record<string, unknown>[]>('/categories');
    return cats.map(mapCategory);
  },

  createCategory: async (data: { slug: string; name: string; emoji: string; displayOrder?: number; isVisible?: boolean }) => {
    const c = await r<Record<string, unknown>>('/categories', { method: 'POST', body: JSON.stringify(data) });
    return mapCategory(c);
  },

  updateCategory: async (id: string, data: Partial<{ name: string; emoji: string; displayOrder: number; isVisible: boolean }>) => {
    const c = await r<Record<string, unknown>>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return mapCategory(c);
  },

  deleteCategory: async (id: string) =>
    r<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),

  reorderCategories: async (orderedIds: string[]) => {
    const cats = await r<Record<string, unknown>[]>('/categories/reorder', {
      method: 'PUT', body: JSON.stringify({ orderedIds }),
    });
    return cats.map(mapCategory);
  },

  // Promo Codes
  getPromoCodes: async (): Promise<AdminPromoCode[]> => {
    const promos = await r<Record<string, unknown>[]>('/promo-codes');
    return promos.map(mapPromoCode);
  },

  createPromoCode: async (data: {
    code: string; discountType: 'percentage' | 'flat'; discountValue: number;
    isActive: boolean; appliesTo: string; usageLimit?: number; expiresAt?: string;
  }) => {
    const p = await r<Record<string, unknown>>('/promo-codes', { method: 'POST', body: JSON.stringify(data) });
    return mapPromoCode(p);
  },

  updatePromoCode: async (id: string, data: Partial<{
    code: string; discountType: 'percentage' | 'flat'; discountValue: number;
    isActive: boolean; appliesTo: string; usageLimit: number; expiresAt: string;
  }>) => {
    const p = await r<Record<string, unknown>>(`/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return mapPromoCode(p);
  },

  deletePromoCode: async (id: string) =>
    r<{ message: string }>(`/promo-codes/${id}`, { method: 'DELETE' }),

  // Announcements
  getAnnouncements: async (): Promise<AdminAnnouncement[]> => {
    const list = await r<Record<string, unknown>[]>('/announcements');
    return list.map(mapAnnouncement);
  },

  sendAnnouncement: async (data: { title: string; content: string; sentTo: 'all' | 'new_30d' | 'active_invites' }) => {
    const a = await r<Record<string, unknown>>('/announcements', { method: 'POST', body: JSON.stringify(data) });
    return mapAnnouncement(a);
  },

  // Settings
  getSettings: async (): Promise<AdminSettings> => {
    const raw = await r<Record<string, string>>('/settings');
    return {
      currency: (raw.currency ?? 'USD') as AdminSettings['currency'],
      defaultPremiumPrice: 0,
      maxFileSizes: { coverImage: 5, galleryPhoto: 2, introAnimation: 10 },
      maintenanceMode: raw.maintenance_mode === 'true',
      rsvpDeadlineDays: 0,
      featureFlags: [
        { id: 'google_auth', label: 'Google Auth', description: 'Allow Google sign-in', enabled: raw.allow_google_auth === 'true' },
        { id: 'email_auth', label: 'Email Auth', description: 'Allow email/password sign-in', enabled: raw.allow_email_auth === 'true' },
      ],
    };
  },

  updateSettings: async (data: Record<string, string | number | boolean | null>) =>
    r<Record<string, string>>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Search
  globalSearch: async (query: string): Promise<GlobalSearchResult> =>
    r<GlobalSearchResult>(`/search?q=${encodeURIComponent(query)}`),

  // Admin Users
  getAdmins: async () => {
    const admins = await r<{ id: string; name: string; email: string; role: string }[]>('/admins');
    return admins.map((a) => ({ id: a.id, name: a.name, email: a.email, role: a.role as 'admin' | 'support' }));
  },

  createAdmin: async (data: { name: string; email: string; password: string; role: 'admin' | 'support' }) => {
    const a = await r<{ id: string; name: string; email: string; role: string }>(
      '/admins', { method: 'POST', body: JSON.stringify(data) },
    );
    return { id: a.id, name: a.name, email: a.email, role: a.role as 'admin' | 'support' };
  },

  deleteAdmin: async (id: string) =>
    r<{ message: string }>(`/admins/${id}`, { method: 'DELETE' }),

  // Audit Logs
  getAuditLogs: async (params?: { adminId?: string; entityType?: string; entityId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.adminId) q.set('adminId', params.adminId);
    if (params?.entityType) q.set('entityType', params.entityType);
    if (params?.entityId) q.set('entityId', params.entityId);
    q.set('page', String(params?.page ?? 1));
    q.set('limit', String(params?.limit ?? 20));
    const { data, pagination } = await rPaged<Record<string, unknown>[]>(`/audit-logs?${q.toString()}`);
    return { logs: data, pagination };
  },
};
