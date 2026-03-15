import type { AdminInvite, AdminTransaction } from "@/admin/types";

const normalizeInviteStatus = (status: string) =>
  (status === "taken_down" ? "taken-down" : status) as AdminInvite["status"];

const deriveInviteFlags = (input: {
  packageCode: AdminInvite["packageCode"];
  eventManagementEnabled: boolean;
  validUntil: string;
  canRenew?: boolean;
  canUpgradeEventManagement?: boolean;
}) => {
  const validUntilDate = input.validUntil ? new Date(input.validUntil) : null;
  const isExpired = validUntilDate ? validUntilDate.getTime() <= Date.now() : false;

  return {
    canRenew: input.canRenew ?? isExpired,
    canUpgradeEventManagement:
      input.canUpgradeEventManagement ??
      (!isExpired && input.packageCode === "package_b" && !input.eventManagementEnabled),
  };
};

export const mapAdminInvite = (raw: Record<string, unknown>): AdminInvite => {
  const user = (raw.user as Record<string, unknown> | undefined) ?? {};
  const count = (raw._count as Record<string, unknown> | undefined) ?? {};
  const data = (raw.data as Record<string, unknown> | undefined) ?? {};
  const packageCode = ((raw.packageCode as string | undefined) ?? "package_a") as AdminInvite["packageCode"];
  const eventManagementEnabled = (raw.eventManagementEnabled as boolean | undefined) ?? true;
  const validUntil = (raw.validUntil as string | undefined) ?? "";
  const flags = deriveInviteFlags({
    packageCode,
    eventManagementEnabled,
    validUntil,
    canRenew: raw.canRenew as boolean | undefined,
    canUpgradeEventManagement: raw.canUpgradeEventManagement as boolean | undefined,
  });

  return {
    id: raw.id as string,
    customerId: ((user.id as string | undefined) ?? (raw.userId as string | undefined) ?? (raw.customerId as string)) as string,
    customerName: ((user.name as string | undefined) ?? (raw.customerName as string | undefined) ?? "") as string,
    customerEmail: ((user.email as string | undefined) ?? (raw.customerEmail as string | undefined) ?? "") as string,
    templateSlug: raw.templateSlug as string,
    templateName: ((raw.templateName as string | undefined) ?? (raw.templateSlug as string)) as string,
    templateCategory: ((raw.templateCategory as string | undefined) ?? "wedding").replace(/_/g, "-"),
    packageCode,
    eventManagementEnabled,
    validUntil,
    canRenew: flags.canRenew,
    canUpgradeEventManagement: flags.canUpgradeEventManagement,
    eventName: ((raw.eventName as string | undefined) ?? (data.eventTitle as string | undefined) ?? (raw.slug as string)) as string,
    slug: raw.slug as string,
    status: normalizeInviteStatus(raw.status as string),
    eventDate: ((raw.eventDate as string | null | undefined) ?? (data.weddingDate as string | undefined) ?? "") as string,
    rsvpCount: ((raw.rsvpCount as number | undefined) ?? (count.rsvps as number | undefined) ?? 0) as number,
    viewCount: ((raw.viewCount as number | undefined) ?? 0) as number,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  };
};

export const mapAdminTransaction = (raw: Record<string, unknown>): AdminTransaction => {
  const user = (raw.user as Record<string, unknown> | undefined) ?? {};
  const invite = (raw.invite as Record<string, unknown> | undefined) ?? {};

  return {
    id: raw.id as string,
    customerId: ((user.id as string | undefined) ?? (raw.userId as string | undefined) ?? (raw.customerId as string)) as string,
    customerName: ((user.name as string | undefined) ?? (raw.customerName as string | undefined) ?? "") as string,
    templateSlug: raw.templateSlug as string,
    templateName: ((raw.templateName as string | undefined) ?? (raw.templateSlug as string)) as string,
    packageCode: ((raw.packageCode as string | undefined) ?? "package_a") as AdminTransaction["packageCode"],
    kind: ((raw.kind as string | undefined) ?? "initial_purchase") as AdminTransaction["kind"],
    inviteId: ((raw.inviteId as string | undefined) ?? (invite.id as string | undefined)) as string | undefined,
    inviteSlug: ((raw.inviteSlug as string | undefined) ?? (invite.slug as string | undefined)) as string | undefined,
    inviteStatus: (invite.status as string | undefined)
      ? normalizeInviteStatus(invite.status as string)
      : undefined,
    inviteValidUntil: (invite.validUntil as string | undefined) ?? undefined,
    inviteEventManagementEnabled: (invite.eventManagementEnabled as boolean | undefined) ?? undefined,
    amount: raw.amount as number,
    currency: ((raw.currency as string | undefined) ?? "USD") as string,
    date: (raw.createdAt as string | undefined) ?? (raw.date as string),
    status: raw.status as AdminTransaction["status"],
    failureReason: ((raw.failureReason as string | null | undefined) ?? undefined) as string | undefined,
    refundAmount: ((raw.refundAmount as number | undefined) ?? undefined) as number | undefined,
  };
};
