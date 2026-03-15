import { describe, expect, it } from "vitest";
import { mapAdminInvite, mapAdminTransaction } from "@/admin/services/mappers";

describe("admin service mappers", () => {
  it("maps nested invite payloads and derives renewal state", () => {
    const invite = mapAdminInvite({
      id: "invite_1",
      userId: "user_1",
      templateSlug: "rustic-signature",
      templateCategory: "wedding",
      packageCode: "package_b",
      eventManagementEnabled: false,
      validUntil: "2026-01-01T00:00:00.000Z",
      slug: "aarohi-kabir",
      status: "published",
      createdAt: "2025-10-01T00:00:00.000Z",
      updatedAt: "2025-10-02T00:00:00.000Z",
      _count: { rsvps: 8 },
      user: {
        id: "user_1",
        name: "Aarohi Sharma",
        email: "aarohi@example.com",
      },
      data: {
        eventTitle: "Aarohi & Kabir Wedding",
      },
    });

    expect(invite.customerId).toBe("user_1");
    expect(invite.customerName).toBe("Aarohi Sharma");
    expect(invite.customerEmail).toBe("aarohi@example.com");
    expect(invite.eventName).toBe("Aarohi & Kabir Wedding");
    expect(invite.rsvpCount).toBe(8);
    expect(invite.canRenew).toBe(true);
    expect(invite.canUpgradeEventManagement).toBe(false);
  });

  it("maps active package-b invites as upgradeable before expiry", () => {
    const invite = mapAdminInvite({
      id: "invite_2",
      userId: "user_2",
      templateSlug: "rustic-signature",
      templateCategory: "wedding",
      packageCode: "package_b",
      eventManagementEnabled: false,
      validUntil: "2026-12-01T00:00:00.000Z",
      slug: "preview-slug",
      status: "draft",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-02T00:00:00.000Z",
      user: {
        id: "user_2",
        name: "Kabir Kapoor",
        email: "kabir@example.com",
      },
    });

    expect(invite.canRenew).toBe(false);
    expect(invite.canUpgradeEventManagement).toBe(true);
  });

  it("maps nested transaction payloads with linked invite details", () => {
    const transaction = mapAdminTransaction({
      id: "txn_1",
      userId: "user_1",
      templateSlug: "rustic-signature",
      packageCode: "package_b",
      kind: "event_management_addon",
      amount: 9900,
      currency: "EUR",
      createdAt: "2026-03-01T00:00:00.000Z",
      status: "success",
      user: {
        id: "user_1",
        name: "Aarohi Sharma",
        email: "aarohi@example.com",
      },
      invite: {
        id: "invite_1",
        slug: "aarohi-kabir",
      },
    });

    expect(transaction.customerId).toBe("user_1");
    expect(transaction.customerName).toBe("Aarohi Sharma");
    expect(transaction.kind).toBe("event_management_addon");
    expect(transaction.inviteId).toBe("invite_1");
    expect(transaction.inviteSlug).toBe("aarohi-kabir");
  });
});
