export type PackageCode = "package_a" | "package_b";
export type CheckoutIntent = "initial_purchase" | "event_management_addon" | "renewal";
export type CurrencyCode = "usd" | "eur";
export type InviteLifecycleStatus = "draft" | "published" | "expired" | "taken_down";

const PACKAGE_VALIDITY_MONTHS = 3;

const PACKAGE_PRICING: Record<CheckoutIntent, Record<PackageCode, Record<CurrencyCode, number>>> = {
  initial_purchase: {
    package_a: { usd: 14_900, eur: 16_900 },
    package_b: { usd: 9_900, eur: 11_900 },
  },
  event_management_addon: {
    package_a: { usd: 0, eur: 0 },
    package_b: { usd: 9_900, eur: 9_900 },
  },
  renewal: {
    package_a: { usd: 1_400, eur: 2_000 },
    package_b: { usd: 1_400, eur: 2_000 },
  },
};

const addMonths = (value: Date, months: number) => {
  const result = new Date(value);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

export const resolvePackagePrice = ({
  intent,
  packageCode,
  currency,
}: {
  intent: CheckoutIntent;
  packageCode: PackageCode;
  currency: CurrencyCode;
}) => {
  return PACKAGE_PRICING[intent][packageCode][currency];
};

export const isPromoAllowedForIntent = (intent: CheckoutIntent) => intent === "initial_purchase";

export const buildInitialInviteEntitlements = (packageCode: PackageCode, now = new Date()) => ({
  packageCode,
  eventManagementEnabled: packageCode === "package_a",
  validUntil: addMonths(now, PACKAGE_VALIDITY_MONTHS),
});

export const extendInviteValidity = (currentValidUntil: Date | null | undefined, now = new Date()) => {
  const anchor = currentValidUntil && currentValidUntil > now ? currentValidUntil : now;
  return addMonths(anchor, PACKAGE_VALIDITY_MONTHS);
};

export const deriveInviteEntitlements = ({
  packageCode,
  eventManagementEnabled,
  validUntil,
  status,
  now = new Date(),
}: {
  packageCode: PackageCode;
  eventManagementEnabled: boolean;
  validUntil: Date | null;
  status: InviteLifecycleStatus;
  now?: Date;
}) => {
  const isExpired = Boolean(validUntil && validUntil <= now) || status === "expired";
  const isTakenDown = status === "taken_down";
  const effectiveStatus = isTakenDown ? "taken_down" : isExpired ? "expired" : status;

  return {
    isExpired,
    canRenew: isExpired,
    canUpgradeEventManagement: !isExpired && packageCode === "package_b" && !eventManagementEnabled,
    publicInviteAccessible: !isExpired && !isTakenDown && status === "published",
    editorAccessible: !isExpired && !isTakenDown,
    eventManagementAccessible: !isExpired && !isTakenDown && eventManagementEnabled,
    effectiveStatus,
  };
};
