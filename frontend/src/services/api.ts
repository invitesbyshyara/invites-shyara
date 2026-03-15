import {
  BroadcastAudience,
  CheckoutIntent,
  CollaboratorPermission,
  EventCategory,
  Invite,
  InviteAccessRequest,
  InviteBroadcast,
  InviteCollaborator,
  InviteGuest,
  InviteStatus,
  InviteWorkspace,
  LocalizationSettings,
  OperationsSummary,
  PackageCode,
  PublicInviteData,
  Rsvp,
  RsvpSettings,
  TemplateConfig,
  PlatformStatus,
  User,
} from "@/types";
import { allTemplates, getTemplateBySlug } from "@/templates/registry";
import { buildCanonicalApiBase, normalizeApiOrigin } from "@/lib/apiBase";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
  requestId?: string;
  fields?: Array<{ field: string; message: string }>;
};

class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  fields?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      requestId?: string;
      fields?: Array<{ field: string; message: string }>;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.requestId = options?.requestId;
    this.fields = options?.fields;
  }
}

const CSRF_COOKIE_KEY = "csrfToken";
const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";
export const apiUrl = normalizeApiOrigin(configuredApiUrl);
const API_BASE = buildCanonicalApiBase(configuredApiUrl);

const inviteSlugMap = new Map<string, string>();
let refreshPromise: Promise<boolean> | null = null;

const normalizeStatus = (status: string): InviteStatus =>
  (status === "taken_down" ? "taken-down" : status) as InviteStatus;

const denormalizeStatus = (status: InviteStatus): string =>
  status === "taken-down" ? "taken_down" : status;

const toCategory = (value: string): EventCategory => value.replace(/_/g, "-") as EventCategory;

const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return undefined;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
};

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
      const payload = await parsePayload<{ ok: boolean }>(res);
      return Boolean(payload?.success);
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

  if (requiresAuth && !["GET", "HEAD", "OPTIONS"].includes((options.method ?? "GET").toUpperCase())) {
    const csrfToken = getCookie(CSRF_COOKIE_KEY);
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
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
  }

  const payload = await parsePayload<T>(res);
  if (!res.ok || !payload?.success) {
    throw new ApiError(payload?.error ?? "Request failed", res.status, {
      code: payload?.code,
      requestId: payload?.requestId,
      fields: payload?.fields,
    });
  }

  return payload.data;
};

const mapUser = (raw: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  emailPreferences?: User["emailPreferences"];
  mfaEnabled?: boolean;
  recoveryCodesRemaining?: number;
}): User => ({
  id: raw.id,
  name: raw.name,
  email: raw.email,
  phone: raw.phone ?? undefined,
  avatar: raw.avatarUrl ?? undefined,
  emailVerified: raw.emailVerified,
  emailPreferences: raw.emailPreferences,
  mfaEnabled: raw.mfaEnabled,
  recoveryCodesRemaining: raw.recoveryCodesRemaining,
});

const mergeTemplate = (raw: {
  slug: string;
  name: string;
  category: string;
  packageCode?: PackageCode;
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
      packageCode: raw.packageCode ?? base.packageCode,
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
    packageCode: raw.packageCode ?? 'package_a',
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
  packageCode?: PackageCode;
  eventManagementEnabled?: boolean;
  validUntil?: string;
  canRenew?: boolean;
  canUpgradeEventManagement?: boolean;
  slug: string;
  status: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  rsvpCount?: number;
  accessRole?: string;
  permissions?: Invite["permissions"];
}) => ({
  id: raw.id,
  userId: raw.userId,
  templateSlug: raw.templateSlug,
  templateCategory: toCategory(raw.templateCategory),
  packageCode: raw.packageCode ?? 'package_a',
  eventManagementEnabled: raw.eventManagementEnabled ?? true,
  validUntil: raw.validUntil ?? "",
  canRenew: raw.canRenew ?? false,
  canUpgradeEventManagement: raw.canUpgradeEventManagement ?? false,
  slug: raw.slug,
  status: normalizeStatus(raw.status),
  data: raw.data ?? {},
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  rsvpCount: raw.rsvpCount ?? 0,
  isPurchased: true,
  accessRole: raw.accessRole,
  permissions: raw.permissions,
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

type AuthenticatedUserPayload = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  emailPreferences?: User["emailPreferences"];
  mfaEnabled?: boolean;
  recoveryCodesRemaining?: number;
};

type CustomerAuthResult =
  | {
      requiresMfa: true;
      challengeId: string;
      user: Pick<User, "id" | "name" | "email" | "emailVerified" | "mfaEnabled">;
    }
  | {
      requiresMfa?: false;
      user: User;
    };

export const api = {
  hasStoredSession: () => Boolean(getCookie(CSRF_COOKIE_KEY)),

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
        packageCode?: PackageCode;
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
      packageCode?: PackageCode;
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
        packageCode?: PackageCode;
        eventManagementEnabled?: boolean;
        validUntil?: string;
        canRenew?: boolean;
        canUpgradeEventManagement?: boolean;
        slug: string;
        status: string;
        data: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
        rsvpCount: number;
        accessRole?: string;
        permissions?: Invite["permissions"];
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
      packageCode?: PackageCode;
      eventManagementEnabled?: boolean;
      validUntil?: string;
      canRenew?: boolean;
      canUpgradeEventManagement?: boolean;
      slug: string;
      status: string;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
      rsvpCount: number;
      accessRole?: string;
      permissions?: Invite["permissions"];
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
      packageCode?: PackageCode;
      eventManagementEnabled?: boolean;
      validUntil?: string;
      canRenew?: boolean;
      canUpgradeEventManagement?: boolean;
      slug: string;
      status: string;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
      rsvpCount: number;
      accessRole?: string;
      permissions?: Invite["permissions"];
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
      packageCode?: PackageCode;
      eventManagementEnabled?: boolean;
      validUntil?: string;
      canRenew?: boolean;
      canUpgradeEventManagement?: boolean;
      slug: string;
      status: string;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
      rsvpCount: number;
      accessRole?: string;
      permissions?: Invite["permissions"];
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
      packageCode?: PackageCode;
      data?: Record<string, unknown>;
      inviteId?: string;
      status?: string;
      eventManagementEnabled?: boolean;
      validUntil?: string;
      canRenew?: boolean;
      canUpgradeEventManagement?: boolean;
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
      packageCode: data.packageCode ?? 'package_a',
      data: (data.data ?? {}) as Record<string, unknown>,
      inviteId: data.inviteId ?? "",
      status: data.status ? normalizeStatus(data.status) : undefined,
      eventManagementEnabled: data.eventManagementEnabled ?? true,
      validUntil: data.validUntil,
      canRenew: data.canRenew,
      canUpgradeEventManagement: data.canUpgradeEventManagement,
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
    return request<{ rsvpSettings: RsvpSettings; localization?: LocalizationSettings }>(
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
        body: JSON.stringify({
          defaultLanguage: localization.defaultLanguage,
          enabledLanguages: localization.enabledLanguages,
        }),
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

  requestInviteAccess: async (inviteId: string, permissions: CollaboratorPermission[]) => {
    return request<InviteAccessRequest>(
      `/invite-ops/${inviteId}/access-requests`,
      {
        method: "POST",
        body: JSON.stringify({ permissions }),
      },
      true,
    );
  },

  approveInviteAccessRequest: async (inviteId: string, accessRequestId: string) => {
    return request<InviteAccessRequest>(
      `/invite-ops/${inviteId}/access-requests/${accessRequestId}/approve`,
      { method: "POST" },
      true,
    );
  },

  rejectInviteAccessRequest: async (inviteId: string, accessRequestId: string) => {
    return request<InviteAccessRequest>(
      `/invite-ops/${inviteId}/access-requests/${accessRequestId}/reject`,
      { method: "POST" },
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

  login: async (email: string, password: string): Promise<CustomerAuthResult> => {
    const result = await request<
      | {
          requiresMfa: true;
          challengeId: string;
          user: Pick<User, "id" | "name" | "email" | "emailVerified" | "mfaEnabled">;
        }
      | {
          user: AuthenticatedUserPayload;
        }
    >(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    if ("requiresMfa" in result && result.requiresMfa) {
      return result;
    }
    return { user: mapUser(result.user) };
  },

  register: async (name: string, email: string, password: string): Promise<{ user: User }> => {
    const result = await request<{ user: AuthenticatedUserPayload }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      },
      false,
    );
    return { user: mapUser(result.user) };
  },

  googleAuth: async (accessToken: string): Promise<CustomerAuthResult> => {
    const result = await request<
      | {
          requiresMfa: true;
          challengeId: string;
          user: Pick<User, "id" | "name" | "email" | "emailVerified" | "mfaEnabled">;
        }
      | {
          user: AuthenticatedUserPayload;
        }
    >(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      },
      false,
    );
    if ("requiresMfa" in result && result.requiresMfa) {
      return result;
    }
    return { user: mapUser(result.user) };
  },

  getMe: async () => {
    const user = await request<AuthenticatedUserPayload>("/auth/me", {}, true);
    return mapUser(user);
  },

  updateProfile: async (data: Partial<User> & { avatarUrl?: string | null }) => {
    const updated = await request<AuthenticatedUserPayload>(
      "/auth/me",
      {
        method: "PUT",
        body: JSON.stringify({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
          ...(data.emailPreferences !== undefined ? { emailPreferences: data.emailPreferences } : {}),
        }),
      },
      true,
    );
    return mapUser(updated);
  },

  updatePassword: async (
    currentPassword: string,
    newPassword: string,
    options?: { mfaCode?: string; recoveryCode?: string },
  ) => {
    return request<{ message: string }>(
      "/auth/password",
      {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          ...(options?.mfaCode ? { mfaCode: options.mfaCode } : {}),
          ...(options?.recoveryCode ? { recoveryCode: options.recoveryCode } : {}),
        }),
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
    await request<{ message: string }>("/auth/logout", { method: "POST" }, true);
  },

  deleteAccount: async () => {
    await request<{ message: string }>("/auth/me", { method: "DELETE" }, true);
  },

  requestEmailVerification: async () =>
    request<{ message: string }>(
      "/auth/verify-email/request",
      { method: "POST" },
      true,
    ),

  confirmEmailVerification: async (token: string) =>
    request<{ message: string }>(
      "/auth/verify-email/confirm",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      },
      false,
    ),

  getMfaStatus: async () =>
    request<{ enabled: boolean; recoveryCodesRemaining: number }>(
      "/auth/mfa/status",
      {},
      true,
    ),

  beginMfaEnrollment: async () =>
    request<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }>(
      "/auth/mfa/enroll",
      { method: "POST" },
      true,
    ),

  verifyMfaEnrollment: async (code: string) =>
    request<{ enabled: boolean; recoveryCodes: string[] }>(
      "/auth/mfa/verify",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      },
      true,
    ),

  completeMfaLogin: async (challengeId: string, input: { code?: string; recoveryCode?: string }) => {
    const result = await request<{ user: AuthenticatedUserPayload }>(
      "/auth/mfa/complete-login",
      {
        method: "POST",
        body: JSON.stringify({ challengeId, ...input }),
      },
      false,
    );
    return { user: mapUser(result.user) };
  },

  rotateMfaRecoveryCodes: async (input: { code?: string; recoveryCode?: string }) =>
    request<{ recoveryCodes: string[] }>(
      "/auth/mfa/recovery-codes/rotate",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      true,
    ),

  disableMfa: async (input: { code?: string; recoveryCode?: string }) =>
    request<{ message: string }>(
      "/auth/mfa/disable",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      true,
    ),

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string; publicId: string }>(
      "/invites/upload-image",
      {
        method: "POST",
        body: formData,
      },
      true,
    );
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

  createCheckoutOrder: async (input: {
    intent: CheckoutIntent;
    currency: "usd" | "eur";
    templateSlug?: string;
    inviteId?: string;
    promoCode?: string;
  }) => {
    return request<CheckoutOrderResponse>(
      "/checkout/create-order",
      {
        method: "POST",
        body: JSON.stringify(input),
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
