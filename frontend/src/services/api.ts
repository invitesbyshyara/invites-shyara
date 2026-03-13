import {
  BroadcastAudience,
  EventCategory,
  Invite,
  InviteBroadcast,
  InviteCollaborator,
  InviteGuest,
  InviteStatus,
  InviteWorkspace,
  LocalizationSettings,
  OperationsSummary,
  PublicInviteData,
  Rsvp,
  RsvpSettings,
  TemplateConfig,
  PlatformStatus,
  User,
} from "@/types";
import { allTemplates, getTemplateBySlug } from "@/templates/registry";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const ACCESS_TOKEN_KEY = "shyara_access_token";
const CACHED_USER_KEY = "shyara_user";
export const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";
const API_BASE = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

const inviteSlugMap = new Map<string, string>();
let refreshPromise: Promise<boolean> | null = null;

const normalizeStatus = (status: string): InviteStatus =>
  (status === "taken_down" ? "taken-down" : status) as InviteStatus;

const denormalizeStatus = (status: InviteStatus): string =>
  status === "taken-down" ? "taken_down" : status;

const toCategory = (value: string): EventCategory => value.replace(/_/g, "-") as EventCategory;

const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const setStoredToken = (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token);
const clearStoredToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

const setCachedUser = (user: User) => localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
const getCachedUser = (): User | null => {
  const raw = localStorage.getItem(CACHED_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};
const clearCachedUser = () => localStorage.removeItem(CACHED_USER_KEY);

const parsePayload = async <T>(res: Response): Promise<ApiResponse<T> | null> => {
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as ApiResponse<T>;
};

const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        return false;
      }
      const payload = await parsePayload<{ accessToken: string }>(res);
      if (!payload?.success || !payload.data?.accessToken) {
        return false;
      }
      setStoredToken(payload.data.accessToken);
      return true;
    } catch {
      return false;
    }
  })();

  const ok = await refreshPromise;
  refreshPromise = null;
  return ok;
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false,
  allowRetry = true,
): Promise<T> => {
  const headers = new Headers(options.headers ?? {});
  const body = options.body;

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    body,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && requiresAuth && allowRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, requiresAuth, false);
    }
    clearStoredToken();
    clearCachedUser();
  }

  const payload = await parsePayload<T>(res);
  if (!res.ok || !payload?.success) {
    throw new ApiError(payload?.error ?? "Request failed", res.status);
  }

  return payload.data;
};

const mapUser = (raw: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
}): User => ({
  id: raw.id,
  name: raw.name,
  email: raw.email,
  phone: raw.phone ?? undefined,
  avatar: raw.avatarUrl ?? undefined,
});

const mergeTemplate = (raw: {
  slug: string;
  name: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  price: number;
  priceUsd?: number;
  priceEur?: number;
}) => {
  const base = getTemplateBySlug(raw.slug);
  if (base) {
    return {
      ...base,
      name: raw.name,
      category: toCategory(raw.category),
      tags: raw.tags,
      isPremium: raw.isPremium,
      price: raw.price,
      priceUsd: raw.priceUsd ?? 0,
      priceEur: raw.priceEur ?? 0,
    };
  }

  const fallback: TemplateConfig = {
    slug: raw.slug,
    name: raw.name,
    category: toCategory(raw.category),
    tags: raw.tags,
    isPremium: raw.isPremium,
    price: raw.price,
    priceUsd: raw.priceUsd ?? 0,
    priceEur: raw.priceEur ?? 0,
    thumbnail: "/placeholder.svg",
    previewImages: [],
    supportedSections: [],
    fields: [],
    dummyData: {},
  };
  return fallback;
};

const mapInvite = (raw: {
  id: string;
  userId: string;
  templateSlug: string;
  templateCategory: string;
  slug: string;
  status: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  rsvpCount?: number;
  accessRole?: string;
}) => ({
  id: raw.id,
  userId: raw.userId,
  templateSlug: raw.templateSlug,
  templateCategory: toCategory(raw.templateCategory),
  slug: raw.slug,
  status: normalizeStatus(raw.status),
  data: raw.data ?? {},
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  rsvpCount: raw.rsvpCount ?? 0,
  isPurchased: true,
  accessRole: raw.accessRole,
});

type CheckoutOrderResponse = {
  free: boolean;
  inviteId?: string;
  transactionId?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
};

export const api = {
  getCachedUser,
  hasStoredSession: () => Boolean(getStoredToken()),

  getPlatformStatus: async () => request<PlatformStatus>("/public/platform-status"),

  getTemplates: async (params?: { category?: EventCategory; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.sort === "popular") query.set("sort", "popular");
    if (params?.sort === "price") query.set("sort", "price_asc");
    if (params?.sort === "newest") query.set("sort", "newest");

    const templates = await request<
      {
        slug: string;
        name: string;
        category: string;
        tags: string[];
        isPremium: boolean;
        price: number;
        priceUsd?: number;
        priceEur?: number;
      }[]
    >(`/templates${query.size ? `?${query.toString()}` : ""}`);

    return templates
      .map(mergeTemplate)
      .filter((template) => allTemplates.some((local) => local.slug === template.slug));
  },

  getTemplate: async (slug: string) => {
    const template = await request<{
      slug: string;
      name: string;
      category: string;
      tags: string[];
      isPremium: boolean;
      price: number;
      priceUsd?: number;
      priceEur?: number;
    }>(`/templates/${slug}`);
    return mergeTemplate(template);
  },

  getInvites: async () => {
    const invites = await request<
      {
        id: string;
        userId: string;
        templateSlug: string;
        templateCategory: string;
        slug: string;
        status: string;
        data: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
        rsvpCount: number;
      }[]
    >("/invites", {}, true);
    return invites.map(mapInvite);
  },

  getInvite: async (inviteId: string) => {
    const invite = await request<{
      id: string;
      userId: string;
      templateSlug: string;
      templateCategory: string;
      slug: string;
      status: string;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
      rsvpCount: number;
    }>(`/invites/${inviteId}`, {}, true);
    return mapInvite(invite);
  },

  createInvite: async (data: {
    templateSlug: string;
    templateCategory: EventCategory;
    slug: string;
    eventData: Record<string, unknown>;
  }): Promise<Invite> => {
    const invite = await request<{
      id: string;
      userId: string;
      templateSlug: string;
      templateCategory: string;
      slug: string;
      status: string;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
      rsvpCount: number;
    }>(
      "/invites",
      {
        method: "POST",
        body: JSON.stringify({
          templateSlug: data.templateSlug,
          slug: data.slug,
          data: data.eventData,
        }),
      },
      true,
    );
    return mapInvite(invite);
  },

  updateInvite: async (inviteId: string, data: Partial<Pick<Invite, "data" | "status" | "slug">>) => {
    const payload = {
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.data !== undefined ? { data: data.data } : {}),
      ...(data.status !== undefined ? { status: denormalizeStatus(data.status) } : {}),
    };

    const invite = await request<{
      id: string;
      userId: string;
      templateSlug: string;
      templateCategory: string;
      slug: string;
      status: string;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
      rsvpCount: number;
    }>(
      `/invites/${inviteId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true,
    );
    return mapInvite(invite);
  },

  deleteInvite: async (inviteId: string) => {
    return request<{ message: string }>(`/invites/${inviteId}`, { method: "DELETE" }, true);
  },

  getPublicInvite: async (slug: string, options?: { guestToken?: string; language?: string }): Promise<PublicInviteData> => {
    const query = new URLSearchParams();
    if (options?.guestToken) query.set("guest", options.guestToken);
    if (options?.language) query.set("lang", options.language);
    const data = await request<{
      templateSlug?: string;
      templateCategory?: string;
      data?: Record<string, unknown>;
      inviteId?: string;
      status?: string;
      selectedLanguage?: string;
      languages?: string[];
      viewer?: PublicInviteData["viewer"];
    }>(`/public/invites/${slug}${query.size ? `?${query.toString()}` : ""}`);

    if (data.inviteId) {
      inviteSlugMap.set(data.inviteId, slug);
    }

    return {
      templateSlug: data.templateSlug ?? "",
      templateCategory: toCategory(data.templateCategory ?? "wedding"),
      data: (data.data ?? {}) as Record<string, unknown>,
      inviteId: data.inviteId ?? "",
      status: data.status ? normalizeStatus(data.status) : undefined,
      selectedLanguage: data.selectedLanguage,
      languages: data.languages ?? [],
      viewer: data.viewer,
    };
  },

  checkSlugAvailability: async (slug: string, excludeId?: string) => {
    const query = new URLSearchParams({ slug });
    if (excludeId) query.set("excludeId", excludeId);
    const result = await request<{ available: boolean }>(`/invites/check-slug?${query.toString()}`, {}, true);
    return {
      available: result.available,
      suggestion: result.available ? slug : `${slug}-${Math.floor(Math.random() * 1000)}`,
    };
  },

  getRsvps: async (inviteId: string) => {
    return request<Rsvp[]>(`/invites/${inviteId}/rsvps`, {}, true);
  },

  submitRsvp: async (
    inviteId: string,
    data: {
      guestToken?: string;
      language?: string;
      name: string;
      response: "yes" | "no" | "maybe";
      guestCount: number;
      message: string;
      email?: string;
      phone?: string;
      household?: string;
      adultCount?: number;
      childCount?: number;
      mealChoice?: string;
      dietaryRestrictions?: string;
      stayNeeded?: boolean;
      roomRequirement?: string;
      transportNeeded?: boolean;
      transportMode?: string;
      customAnswers?: Record<string, unknown>;
    },
  ) => {
    const slug = inviteSlugMap.get(inviteId);
    if (!slug) {
      throw new Error("Unable to submit RSVP for this invite");
    }

    return request<Rsvp>(`/public/invites/${slug}/rsvp`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getRsvpConfig: async (
    inviteId: string,
    options?: { guestToken?: string; language?: string }
  ): Promise<RsvpSettings> => {
    const query = new URLSearchParams();
    if (options?.guestToken) query.set("guest", options.guestToken);
    if (options?.language) query.set("lang", options.language);
    return request<RsvpSettings>(`/public/invites/${inviteId}/rsvp-config${query.size ? `?${query.toString()}` : ""}`);
  },

  trackView: async (slug: string): Promise<void> => {
    const ua = navigator.userAgent;
    const deviceType = /Mobi|Android/i.test(ua) ? "mobile" : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop";
    try {
      await request<{ ok: boolean }>(`/public/invites/${slug}/view`, {
        method: "POST",
        body: JSON.stringify({ deviceType, referrer: document.referrer }),
      });
    } catch {
      // View tracking is non-critical — swallow errors
    }
  },

  getInviteAnalytics: async (inviteId: string) => {
    return request<{
      viewCount: number;
      rsvpCount: number;
      yesCount: number;
      conversionRate: number;
      deviceBreakdown: { mobile: number; desktop: number; tablet: number };
      referrerBreakdown: { direct: number; whatsapp: number; facebook: number; other: number };
    }>(`/invites/${inviteId}/analytics`, {}, true);
  },

  getInviteWorkspace: async (inviteId: string) => {
    return request<InviteWorkspace>(`/invite-ops/${inviteId}`, {}, true);
  },

  updateInviteRsvpSettings: async (inviteId: string, settings: RsvpSettings) => {
    return request<{ rsvpSettings: RsvpSettings }>(
      `/invite-ops/${inviteId}/rsvp-settings`,
      {
        method: "PUT",
        body: JSON.stringify(settings),
      },
      true,
    );
  },

  updateInviteLocalization: async (inviteId: string, localization: LocalizationSettings) => {
    return request<{ localization: LocalizationSettings }>(
      `/invite-ops/${inviteId}/localization`,
      {
        method: "PUT",
        body: JSON.stringify(localization),
      },
      true,
    );
  },

  createInviteGuest: async (inviteId: string, guest: Partial<InviteGuest> & { name: string }) => {
    return request<InviteGuest>(
      `/invite-ops/${inviteId}/guests`,
      {
        method: "POST",
        body: JSON.stringify(guest),
      },
      true,
    );
  },

  updateInviteGuest: async (inviteId: string, guestId: string, guest: Partial<InviteGuest> & { name: string }) => {
    return request<InviteGuest>(
      `/invite-ops/${inviteId}/guests/${guestId}`,
      {
        method: "PUT",
        body: JSON.stringify(guest),
      },
      true,
    );
  },

  deleteInviteGuest: async (inviteId: string, guestId: string) => {
    return request<{ message: string }>(`/invite-ops/${inviteId}/guests/${guestId}`, { method: "DELETE" }, true);
  },

  createInviteBroadcast: async (
    inviteId: string,
    payload: {
      type: InviteBroadcast["type"];
      title: string;
      subject?: string;
      message: string;
      language: string;
      audience: BroadcastAudience;
    }
  ) => {
    return request<InviteBroadcast>(
      `/invite-ops/${inviteId}/broadcasts`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  inviteCollaborator: async (
    inviteId: string,
    payload: Pick<InviteCollaborator, "email" | "name" | "roleLabel" | "permissions">
  ) => {
    return request<InviteCollaborator>(
      `/invite-ops/${inviteId}/collaborators`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  removeCollaborator: async (inviteId: string, collaboratorId: string) => {
    return request<{ message: string }>(
      `/invite-ops/${inviteId}/collaborators/${collaboratorId}`,
      { method: "DELETE" },
      true,
    );
  },

  getInviteAutomation: async (inviteId: string) => {
    return request<OperationsSummary>(`/invite-ops/${inviteId}/automation`, {}, true);
  },

  getInviteExportPack: async (inviteId: string) => {
    return request<{ generatedAt: string; files: Array<{ filename: string; content: string }> }>(
      `/invite-ops/${inviteId}/export-pack`,
      {},
      true,
    );
  },

  login: async (email: string, password: string) => {
    const result = await request<{ user: User; accessToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    const user = mapUser(result.user as unknown as Parameters<typeof mapUser>[0]);
    setStoredToken(result.accessToken);
    setCachedUser(user);
    return { user, token: result.accessToken };
  },

  register: async (name: string, email: string, password: string) => {
    const result = await request<{ user: User; accessToken: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      },
      false,
    );
    const user = mapUser(result.user as unknown as Parameters<typeof mapUser>[0]);
    setStoredToken(result.accessToken);
    setCachedUser(user);
    return { user, token: result.accessToken };
  },

  googleAuth: async (accessToken: string) => {
    const result = await request<{ user: User; accessToken: string }>(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      },
      false,
    );
    const user = mapUser(result.user as unknown as Parameters<typeof mapUser>[0]);
    setStoredToken(result.accessToken);
    setCachedUser(user);
    return { user, token: result.accessToken };
  },

  getMe: async () => {
    const user = await request<{
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      avatarUrl?: string | null;
    }>("/auth/me", {}, true);
    const mapped = mapUser(user);
    setCachedUser(mapped);
    return mapped;
  },

  updateProfile: async (data: Partial<User>) => {
    const updated = await request<{
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      avatarUrl?: string | null;
    }>(
      "/auth/me",
      {
        method: "PUT",
        body: JSON.stringify({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
        }),
      },
      true,
    );
    const mapped = mapUser(updated);
    setCachedUser(mapped);
    return mapped;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    return request<{ message: string }>(
      "/auth/password",
      {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      true,
    );
  },

  forgotPassword: async (email: string) => {
    return request<{ message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false,
    );
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return request<{ message: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      },
      false,
    );
  },

  logout: async () => {
    try {
      await request<{ message: string }>("/auth/logout", { method: "POST" }, false);
    } finally {
      clearStoredToken();
      clearCachedUser();
    }
  },

  deleteAccount: async () => {
    try {
      await request<{ message: string }>("/auth/me", { method: "DELETE" }, true);
    } finally {
      clearStoredToken();
      clearCachedUser();
    }
  },

  validatePromo: async (templateSlug: string, code: string) =>
    request<{ valid: boolean; discountType: "percentage" | "flat"; discountValue: number; label: string }>(
      "/checkout/validate-promo",
      {
        method: "POST",
        body: JSON.stringify({ templateSlug, code }),
      },
      true,
    ),

  createCheckoutOrder: async (templateSlug: string, currency: "usd" | "eur", promoCode?: string) => {
    return request<CheckoutOrderResponse>(
      "/checkout/create-order",
      {
        method: "POST",
        body: JSON.stringify({ templateSlug, currency, ...(promoCode ? { promoCode } : {}) }),
      },
      true,
    );
  },

  verifyPayment: async (data: { razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }) =>
    request<{ transactionId: string; inviteId: string }>(
      "/checkout/verify-payment",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    ),
};
