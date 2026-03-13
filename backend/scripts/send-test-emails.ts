/**
 * One-off test script — sends one email per template to a test inbox.
 * Run from /backend:  npx tsx scripts/send-test-emails.ts
 */

import "dotenv/config";
import {
  sendWelcomeEmail,
  sendPasswordResetOtpEmail,
  sendRsvpConfirmationEmail,
  sendRsvpNotificationEmail,
  sendInvitePublishedEmail,
  sendRsvpDeadlineReminderEmail,
  sendPostEventSuggestionEmail,
  sendOrderConfirmationEmail,
  sendPaymentFailedEmail,
  sendAnnouncementEmail,
} from "../src/services/email";

const TO = "invites.shyara@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8080";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const run = async (label: string, fn: () => Promise<void>) => {
  process.stdout.write(`Sending [${label}]... `);
  try {
    await fn();
    console.log("✓ sent");
  } catch (err) {
    console.error("✗ FAILED:", err);
  }
  await delay(600); // avoid rate-limits
};

(async () => {
  console.log(`\nSending test emails to ${TO}\n`);

  await run("1. Welcome", () =>
    sendWelcomeEmail("Priya Sharma", TO),
  );

  await run("2. Password Reset OTP", () =>
    sendPasswordResetOtpEmail(TO, "847293"),
  );

  await run("3. RSVP Confirmation (guest)", () =>
    sendRsvpConfirmationEmail(TO, {
      guestName: "Rahul Mehta",
      inviteName: "Priya & Arjun's Wedding",
      response: "yes",
      eventDate: "Saturday, 12 April 2025",
      unsubscribeToken: "tok_test_unsub_123",
    }),
  );

  await run("4. RSVP Notification (host)", () =>
    sendRsvpNotificationEmail(TO, {
      guestName: "Rahul Mehta",
      response: "yes",
      totalCount: 47,
      inviteSlug: "priya-arjun-wedding",
      unsubscribeToken: "tok_test_unsub_456",
    }),
  );

  await run("5. Invite Published", () =>
    sendInvitePublishedEmail(
      TO,
      `${FRONTEND_URL}/i/priya-arjun-wedding`,
      "tok_test_unsub_789",
    ),
  );

  await run("6. RSVP Deadline Reminder", () =>
    sendRsvpDeadlineReminderEmail(TO, {
      hostName: "Priya",
      inviteName: "Priya & Arjun's Wedding",
      daysLeft: 3,
      deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
      totalRsvps: 62,
      yesCount: 54,
      dashboardUrl: `${FRONTEND_URL}/dashboard`,
    }),
  );

  await run("7. Post-Event Suggestion", () =>
    sendPostEventSuggestionEmail(TO, {
      hostName: "Priya",
      inviteName: "Priya & Arjun's Wedding",
      dashboardUrl: `${FRONTEND_URL}/dashboard`,
    }),
  );

  await run("8. Order Confirmation", () =>
    sendOrderConfirmationEmail(TO, {
      name: "Priya Sharma",
      templateName: "Velvet 3D",
      amount: 49900,
      currency: "inr",
      transactionId: "pay_TEST_1234567890abcd",
      dashboardUrl: `${FRONTEND_URL}/dashboard`,
    }),
  );

  await run("9. Payment Failed", () =>
    sendPaymentFailedEmail(TO, {
      name: "Priya Sharma",
      templateName: "Velvet 3D",
      retryUrl: `${FRONTEND_URL}/checkout/rustic-charm`,
    }),
  );

  await run("10. Announcement", () =>
    sendAnnouncementEmail(
      TO,
      "Introducing Video Invitations on Shyara 🎬",
      `We're thrilled to announce a brand-new feature: **video invitation templates**!\n\nNow you can add personalised video clips to your invites and wow your guests like never before.\n\nLog in to explore the new collection — available to all active users starting today.`,
      "tok_test_unsub_announce",
    ),
  );

  console.log("\nAll done!\n");
})();
