import { describe, expect, it } from "vitest";
import { buildCanonicalApiBase, normalizeApiOrigin } from "@/lib/apiBase";

describe("apiBase helpers", () => {
  it("normalizes a bare API origin to the canonical v1 base", () => {
    expect(buildCanonicalApiBase("https://api.invitesbyshyara.com")).toBe("https://api.invitesbyshyara.com/api/v1");
    expect(normalizeApiOrigin("https://api.invitesbyshyara.com")).toBe("https://api.invitesbyshyara.com");
  });

  it("upgrades an /api base to /api/v1", () => {
    expect(buildCanonicalApiBase("https://api.invitesbyshyara.com/api")).toBe("https://api.invitesbyshyara.com/api/v1");
    expect(normalizeApiOrigin("https://api.invitesbyshyara.com/api")).toBe("https://api.invitesbyshyara.com");
  });

  it("preserves an already versioned base", () => {
    expect(buildCanonicalApiBase("https://api.invitesbyshyara.com/api/v1")).toBe("https://api.invitesbyshyara.com/api/v1");
    expect(normalizeApiOrigin("https://api.invitesbyshyara.com/api/v1")).toBe("https://api.invitesbyshyara.com");
  });
});
