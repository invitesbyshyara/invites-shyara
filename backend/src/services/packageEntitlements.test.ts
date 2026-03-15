import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInitialInviteEntitlements,
  deriveInviteEntitlements,
  extendInviteValidity,
  isPromoAllowedForIntent,
  resolvePackagePrice,
} from "./packageEntitlements";

test("resolvePackagePrice returns the configured initial purchase price per package and currency", () => {
  assert.equal(resolvePackagePrice({ intent: "initial_purchase", packageCode: "package_a", currency: "usd" }), 14_900);
  assert.equal(resolvePackagePrice({ intent: "initial_purchase", packageCode: "package_a", currency: "eur" }), 16_900);
  assert.equal(resolvePackagePrice({ intent: "initial_purchase", packageCode: "package_b", currency: "usd" }), 9_900);
  assert.equal(resolvePackagePrice({ intent: "initial_purchase", packageCode: "package_b", currency: "eur" }), 11_900);
});

test("resolvePackagePrice returns the configured add-on and renewal prices", () => {
  assert.equal(resolvePackagePrice({ intent: "event_management_addon", packageCode: "package_b", currency: "usd" }), 9_900);
  assert.equal(resolvePackagePrice({ intent: "event_management_addon", packageCode: "package_b", currency: "eur" }), 9_900);
  assert.equal(resolvePackagePrice({ intent: "renewal", packageCode: "package_a", currency: "usd" }), 1_400);
  assert.equal(resolvePackagePrice({ intent: "renewal", packageCode: "package_b", currency: "eur" }), 2_000);
});

test("buildInitialInviteEntitlements enables event management only for Package A and grants 3 months of validity", () => {
  const now = new Date("2026-03-15T10:00:00.000Z");

  assert.deepEqual(buildInitialInviteEntitlements("package_a", now), {
    packageCode: "package_a",
    eventManagementEnabled: true,
    validUntil: new Date("2026-06-15T10:00:00.000Z"),
  });

  assert.deepEqual(buildInitialInviteEntitlements("package_b", now), {
    packageCode: "package_b",
    eventManagementEnabled: false,
    validUntil: new Date("2026-06-15T10:00:00.000Z"),
  });
});

test("extendInviteValidity adds 3 months from the later of now or the current valid-until date", () => {
  const now = new Date("2026-03-15T10:00:00.000Z");

  assert.deepEqual(
    extendInviteValidity(undefined, now),
    new Date("2026-06-15T10:00:00.000Z"),
  );

  assert.deepEqual(
    extendInviteValidity(new Date("2026-05-01T00:00:00.000Z"), now),
    new Date("2026-08-01T00:00:00.000Z"),
  );

  assert.deepEqual(
    extendInviteValidity(new Date("2026-01-01T00:00:00.000Z"), now),
    new Date("2026-06-15T10:00:00.000Z"),
  );
});

test("deriveInviteEntitlements keeps Package B invites public while event management remains locked", () => {
  const entitlements = deriveInviteEntitlements({
    packageCode: "package_b",
    eventManagementEnabled: false,
    validUntil: new Date("2026-06-15T10:00:00.000Z"),
    status: "published",
    now: new Date("2026-03-15T10:00:00.000Z"),
  });

  assert.equal(entitlements.isExpired, false);
  assert.equal(entitlements.canRenew, false);
  assert.equal(entitlements.canUpgradeEventManagement, true);
  assert.equal(entitlements.publicInviteAccessible, true);
  assert.equal(entitlements.editorAccessible, true);
  assert.equal(entitlements.eventManagementAccessible, false);
  assert.equal(entitlements.effectiveStatus, "published");
});

test("deriveInviteEntitlements locks expired invites until renewal", () => {
  const entitlements = deriveInviteEntitlements({
    packageCode: "package_a",
    eventManagementEnabled: true,
    validUntil: new Date("2026-03-01T00:00:00.000Z"),
    status: "published",
    now: new Date("2026-03-15T10:00:00.000Z"),
  });

  assert.equal(entitlements.isExpired, true);
  assert.equal(entitlements.canRenew, true);
  assert.equal(entitlements.canUpgradeEventManagement, false);
  assert.equal(entitlements.publicInviteAccessible, false);
  assert.equal(entitlements.editorAccessible, false);
  assert.equal(entitlements.eventManagementAccessible, false);
  assert.equal(entitlements.effectiveStatus, "expired");
});

test("isPromoAllowedForIntent only permits promo codes on initial purchases", () => {
  assert.equal(isPromoAllowedForIntent("initial_purchase"), true);
  assert.equal(isPromoAllowedForIntent("event_management_addon"), false);
  assert.equal(isPromoAllowedForIntent("renewal"), false);
});
