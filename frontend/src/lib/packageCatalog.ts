import type { Currency, PackageCode, CheckoutIntent } from "@/types";

type PriceBook = Record<CheckoutIntent, Record<PackageCode, Record<Currency, number>>>;

export const PACKAGE_CATALOG = {
  package_a: {
    code: "package_a" as const,
    label: "Package A",
    marketingName: "Full Invite Suite",
    designNote: "Refined designs with every feature included.",
  },
  package_b: {
    code: "package_b" as const,
    label: "Package B",
    marketingName: "Premium Invite First",
    designNote: "More premium-looking designs with the invite included first.",
  },
};

const PRICE_BOOK: PriceBook = {
  initial_purchase: {
    package_a: { USD: 14_900, EUR: 16_900 },
    package_b: { USD: 9_900, EUR: 11_900 },
  },
  event_management_addon: {
    package_a: { USD: 0, EUR: 0 },
    package_b: { USD: 9_900, EUR: 9_900 },
  },
  renewal: {
    package_a: { USD: 1_400, EUR: 2_000 },
    package_b: { USD: 1_400, EUR: 2_000 },
  },
};

export const PACKAGE_FEATURE_MATRIX = [
  {
    key: "designs",
    label: "Design direction",
    packageA: "Less premium",
    packageB: "More premium",
  },
  {
    key: "invite",
    label: "Guest-facing invite",
    packageA: "Included",
    packageB: "Included",
  },
  {
    key: "event-management",
    label: "Event management tools",
    packageA: "Included",
    packageB: "Add later",
  },
  {
    key: "validity",
    label: "Invite validity",
    packageA: "3 months",
    packageB: "3 months",
  },
];

export const INVITE_VALIDITY_MONTHS = 3;

export const getCheckoutPrice = (intent: CheckoutIntent, packageCode: PackageCode, currency: Currency) =>
  PRICE_BOOK[intent][packageCode][currency];

export const getPackageDisplayName = (packageCode: PackageCode) => PACKAGE_CATALOG[packageCode].label;
