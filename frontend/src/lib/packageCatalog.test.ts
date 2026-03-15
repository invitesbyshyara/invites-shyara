import { describe, expect, it } from "vitest";
import {
  getCheckoutPrice,
  getPackageDisplayName,
  PACKAGE_FEATURE_MATRIX,
} from "./packageCatalog";

describe("packageCatalog", () => {
  it("returns the configured initial package prices per currency", () => {
    expect(getCheckoutPrice("initial_purchase", "package_a", "USD")).toBe(14_900);
    expect(getCheckoutPrice("initial_purchase", "package_a", "EUR")).toBe(16_900);
    expect(getCheckoutPrice("initial_purchase", "package_b", "USD")).toBe(9_900);
    expect(getCheckoutPrice("initial_purchase", "package_b", "EUR")).toBe(11_900);
  });

  it("returns the configured add-on and renewal prices", () => {
    expect(getCheckoutPrice("event_management_addon", "package_b", "USD")).toBe(9_900);
    expect(getCheckoutPrice("event_management_addon", "package_b", "EUR")).toBe(9_900);
    expect(getCheckoutPrice("renewal", "package_a", "USD")).toBe(1_400);
    expect(getCheckoutPrice("renewal", "package_b", "EUR")).toBe(2_000);
  });

  it("describes Package A as the full invite and Package B as invite-first", () => {
    expect(getPackageDisplayName("package_a")).toBe("Package A");
    expect(getPackageDisplayName("package_b")).toBe("Package B");
    expect(PACKAGE_FEATURE_MATRIX.find((feature) => feature.key === "event-management")).toEqual({
      key: "event-management",
      label: "Event management tools",
      packageA: "Included",
      packageB: "Add later",
    });
  });
});
