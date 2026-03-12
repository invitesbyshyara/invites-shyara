import { Resend } from "resend";
import DOMPurify from "isomorphic-dompurify";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

const resend = new Resend(env.RESEND_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAmount = (amount: number, currency: string): string => {
  if (amount === 0) return "Free";
  const symbols: Record<string, string> = { usd: "$", eur: "€", gbp: "£" };
  const sym = symbols[currency.toLowerCase()] ?? `${currency.toUpperCase()} `;
  return `${sym}${(amount / 100).toFixed(2)}`;
};

const btn = (href: string, label: string) => `
  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:24px 0 4px;">
    <tr>
      <td style="background-color:#C9A84C;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1C1917;text-decoration:none;letter-spacing:0.2px;">${label}</a>
      </td>
    </tr>
  </table>`;

const statCell = (value: string | number, label: string) =>
  `<td style="padding:16px 18px;background-color:#FDF8F0;border:1px solid #EFE0C0;border-radius:8px;text-align:center;font-family:Arial,Helvetica,sans-serif;vertical-align:top;">
    <div style="font-size:28px;font-weight:700;color:#1C1917;line-height:1;">${value}</div>
    <div style="font-size:12px;color:#78716C;margin-top:5px;white-space:nowrap;">${label}</div>
  </td>`;

const badge = (label: string, color: string, bg: string) =>
  `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 20px;">
    <tr>
      <td style="background-color:${bg};border:1px solid ${color}33;border-radius:8px;padding:11px 18px;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:${color};">${label}</span>
      </td>
    </tr>
  </table>`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const buildEmail = (body: string, unsubscribeUrl?: string) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Shyara</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 600px) {
      .outer-td  { padding: 0 !important; }
      .card      { border-radius: 0 !important; box-shadow: none !important; }
      .body-td   { padding: 28px 22px !important; }
      .header-td { padding: 24px 22px !important; }
      .meta-td   { padding: 13px 22px !important; }
      .footer-td { padding: 18px 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F5F0EB;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#F5F0EB;">
    <tr>
      <td class="outer-td" align="center" valign="top" style="padding:36px 16px;">

        <!-- Card -->
        <table class="card" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="max-width:580px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(28,25,23,0.07);">

          <!-- ── Header ───────────────────────────── -->
          <tr>
            <td class="header-td" align="center" style="background-color:#FFFDF9;padding:28px 40px 24px;border-bottom:1px solid #EFE0C0;">
              <!-- Brand name -->
              <div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:24px;font-weight:700;color:#1C1917;letter-spacing:5px;text-transform:uppercase;line-height:1;">SHYARA</div>
              <!-- Gold underline -->
              <div style="margin:8px auto 0;width:36px;height:2px;background-color:#C9A84C;"></div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#A8968A;letter-spacing:2px;text-transform:uppercase;margin-top:8px;">Digital Invitations</div>
            </td>
          </tr>

          <!-- ── Body ─────────────────────────────── -->
          <tr>
            <td class="body-td" style="padding:36px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#44403C;">
              ${body}
            </td>
          </tr>

          ${unsubscribeUrl ? `
          <!-- Unsubscribe -->
          <tr>
            <td class="meta-td" style="background-color:#FAFAF8;border-top:1px solid #EFE0C0;padding:13px 40px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#A8968A;text-align:center;">
              Don't want these emails?&nbsp;<a href="${unsubscribeUrl}" style="color:#C9A84C;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>` : ""}

          <!-- ── Footer ───────────────────────────── -->
          <tr>
            <td class="footer-td" style="background-color:#FAFAF8;border-top:1px solid #EFE0C0;padding:20px 40px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#A8968A;">
              <p style="margin:0 0 6px;">&copy; ${new Date().getFullYear()} Shyara &mdash; Digital Invitations</p>
              <p style="margin:0;">
                <a href="${env.FRONTEND_URL}/privacy" style="color:#C9A84C;text-decoration:none;">Privacy</a>
                &nbsp;&bull;&nbsp;
                <a href="${env.FRONTEND_URL}/terms" style="color:#C9A84C;text-decoration:none;">Terms</a>
                &nbsp;&bull;&nbsp;
                <a href="mailto:support@invitesbyshyara.com" style="color:#C9A84C;text-decoration:none;">Support</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

// ─── Send ─────────────────────────────────────────────────────────────────────

const SUPPORT_EMAIL = "support@invitesbyshyara.com";

const send = async (to: string | string[], subject: string, html: string) => {
  try {
    await resend.emails.send({
      from: `Shyara <${env.EMAIL_FROM}>`,
      replyTo: SUPPORT_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error("Email send failed", { error, to, subject });
    throw error;
  }
};

// ─── Welcome ──────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (name: string, email: string) => {
  const safeName = DOMPurify.sanitize(name);

  const body = `
    <h2 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      Welcome to Shyara, ${safeName}!
    </h2>
    <p style="margin:0 0 14px;">
      We&rsquo;re delighted to have you. You can now create stunning digital invitations for weddings, birthdays, and every special occasion &mdash; in minutes.
    </p>
    <p style="margin:0 0 4px;">Start by browsing our beautifully crafted templates:</p>
    ${btn(`${env.FRONTEND_URL}/templates`, "Browse Templates \u2192")}
    <p style="margin:28px 0 0;font-size:13px;color:#78716C;">
      Need help getting started? Reply to this email or write to
      <a href="mailto:support@invitesbyshyara.com" style="color:#C9A84C;text-decoration:none;">support@invitesbyshyara.com</a>
      &mdash; we&rsquo;re always here for you.
    </p>`;

  await send(email, "Welcome to Shyara \u2728", buildEmail(body));
};

// ─── Password Reset OTP ───────────────────────────────────────────────────────

export const sendPasswordResetOtpEmail = async (email: string, otp: string) => {
  const safeOtp = DOMPurify.sanitize(otp);

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      Reset your password
    </h2>
    <p style="margin:0 0 24px;">
      Use the code below to reset your Shyara password. It expires in <strong>15 minutes</strong>.
    </p>
    <!-- OTP -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="margin:0 auto 28px;">
      <tr>
        <td align="center" style="background-color:#FDF8F0;border:2px solid #C9A84C;border-radius:12px;padding:18px 40px;">
          <span style="font-family:Georgia,'Times New Roman',Times,serif;font-size:38px;font-weight:700;letter-spacing:14px;color:#1C1917;line-height:1;">${safeOtp}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#78716C;text-align:center;">
      Didn&rsquo;t request this? You can safely ignore this email &mdash; your account remains secure.
    </p>`;

  await send(email, "Your password reset code \u2014 Shyara", buildEmail(body));
};

// ─── RSVP Confirmation (to guest) ────────────────────────────────────────────

export const sendRsvpConfirmationEmail = async (
  email: string,
  details: {
    guestName: string;
    inviteName: string;
    response: string;
    eventDate?: string;
    unsubscribeToken?: string;
  },
) => {
  const safeName   = DOMPurify.sanitize(details.guestName);
  const safeInvite = DOMPurify.sanitize(details.inviteName);
  const safeResp   = DOMPurify.sanitize(details.response);
  const safeDate   = details.eventDate ? DOMPurify.sanitize(details.eventDate) : undefined;

  const unsubscribeUrl = details.unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${details.unsubscribeToken}`
    : undefined;

  const responseMap: Record<string, { label: string; color: string; bg: string }> = {
    yes:   { label: "Attending",     color: "#15803D", bg: "#F0FDF4" },
    no:    { label: "Not Attending", color: "#B91C1C", bg: "#FEF2F2" },
    maybe: { label: "Maybe",         color: "#B45309", bg: "#FFFBEB" },
  };
  const rc = responseMap[safeResp] ?? { label: safeResp, color: "#44403C", bg: "#FAFAF8" };

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      RSVP Confirmed
    </h2>
    <p style="margin:0 0 20px;">
      Hi ${safeName}, your RSVP for <strong>${safeInvite}</strong> has been received.
    </p>
    ${badge(`Your response: ${rc.label}`, rc.color, rc.bg)}
    ${safeDate ? `<p style="margin:0 0 16px;font-size:14px;color:#78716C;">&#128197;&nbsp; <strong style="color:#1C1917;">Event date:</strong>&nbsp;${safeDate}</p>` : ""}
    <p style="margin:20px 0 0;font-size:13px;color:#78716C;">
      Need to change your RSVP? Please contact the event organiser directly.
    </p>`;

  await send(email, `RSVP confirmed \u2014 ${safeInvite}`, buildEmail(body, unsubscribeUrl));
};

// ─── RSVP Notification (to host) ─────────────────────────────────────────────

export const sendRsvpNotificationEmail = async (
  email: string,
  details: {
    guestName: string;
    response: string;
    totalCount: number;
    inviteSlug?: string;
    unsubscribeToken?: string;
  },
) => {
  const safeName = DOMPurify.sanitize(details.guestName);
  const safeResp = DOMPurify.sanitize(details.response);

  const unsubscribeUrl = details.unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${details.unsubscribeToken}`
    : undefined;

  const manageUrl = details.inviteSlug
    ? `${env.FRONTEND_URL}/dashboard/invites/${details.inviteSlug}/rsvps`
    : `${env.FRONTEND_URL}/dashboard`;

  const responseMap: Record<string, { label: string; color: string; bg: string }> = {
    yes:   { label: "Attending",     color: "#15803D", bg: "#F0FDF4" },
    no:    { label: "Not Attending", color: "#B91C1C", bg: "#FEF2F2" },
    maybe: { label: "Maybe",         color: "#B45309", bg: "#FFFBEB" },
  };
  const rc = responseMap[safeResp] ?? { label: safeResp, color: "#44403C", bg: "#FAFAF8" };

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      New RSVP Received
    </h2>
    <p style="margin:0 0 20px;">
      <strong>${safeName}</strong> has just responded to your invitation.
    </p>
    ${badge(`Response: ${rc.label}`, rc.color, rc.bg)}
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 4px;">
      <tr>${statCell(details.totalCount, "Total RSVPs")}</tr>
    </table>
    ${btn(manageUrl, "Manage RSVPs \u2192")}`;

  await send(email, `New RSVP from ${safeName}`, buildEmail(body, unsubscribeUrl));
};

// ─── Invite Published ─────────────────────────────────────────────────────────

export const sendInvitePublishedEmail = async (
  email: string,
  inviteUrl: string,
  unsubscribeToken?: string,
) => {
  const safeUrl = DOMPurify.sanitize(inviteUrl);
  const unsubscribeUrl = unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`
    : undefined;

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      Your invitation is live!
    </h2>
    <p style="margin:0 0 14px;">
      Your invite has been published and is ready to share with your guests.
    </p>
    <p style="margin:0 0 4px;">Click below to view it and start sharing:</p>
    ${btn(safeUrl, "View Your Invitation \u2192")}
    <p style="margin:24px 0 8px;font-size:13px;color:#78716C;">Or copy and share this link:</p>
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%">
      <tr>
        <td style="background-color:#FAFAF8;border:1px solid #EFE0C0;border-radius:8px;padding:11px 14px;">
          <a href="${safeUrl}" style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#C9A84C;text-decoration:none;word-break:break-all;">${safeUrl}</a>
        </td>
      </tr>
    </table>`;

  await send(email, "Your invitation is now live \u2728", buildEmail(body, unsubscribeUrl));
};

// ─── RSVP Deadline Reminder ───────────────────────────────────────────────────

export const sendRsvpDeadlineReminderEmail = async (
  email: string,
  opts: {
    hostName: string;
    inviteName: string;
    daysLeft: number;
    deadline: string;
    totalRsvps: number;
    yesCount: number;
    dashboardUrl: string;
  },
) => {
  const { hostName, inviteName, daysLeft, deadline, totalRsvps, yesCount, dashboardUrl } = opts;
  const deadlineFormatted = new Date(deadline).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;
  const noCount  = totalRsvps - yesCount;

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      RSVP Deadline Approaching
    </h2>
    <p style="margin:0 0 8px;">Hi ${DOMPurify.sanitize(hostName)},</p>
    <p style="margin:0 0 24px;">
      The RSVP deadline for <strong>${DOMPurify.sanitize(inviteName)}</strong> is
      <strong>${dayLabel} away</strong> on ${deadlineFormatted}.
    </p>
    <!-- Stats -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin:0 0 8px;">
      <tr>
        ${statCell(totalRsvps, "Total RSVPs")}
        <td style="width:10px;"></td>
        ${statCell(yesCount, "Attending")}
        <td style="width:10px;"></td>
        ${statCell(noCount, "Not Attending / Maybe")}
      </tr>
    </table>
    ${btn(dashboardUrl, "View All RSVPs \u2192")}
    <p style="margin:20px 0 0;font-size:13px;color:#78716C;">
      After ${deadlineFormatted}, new RSVPs will automatically be closed.
    </p>`;

  await send(
    email,
    `Reminder: RSVP deadline in ${dayLabel} \u2014 ${DOMPurify.sanitize(inviteName)}`,
    buildEmail(body),
  );
};

// ─── Post-Event Suggestion ────────────────────────────────────────────────────

export const sendPostEventSuggestionEmail = async (
  email: string,
  opts: { hostName: string; inviteName: string; dashboardUrl: string },
) => {
  const { hostName, inviteName, dashboardUrl } = opts;

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      Congratulations on your celebration!
    </h2>
    <p style="margin:0 0 8px;">Hi ${DOMPurify.sanitize(hostName)},</p>
    <p style="margin:0 0 16px;">
      It looks like <strong>${DOMPurify.sanitize(inviteName)}</strong> has passed &mdash; congratulations on the occasion!
    </p>
    <p style="margin:0 0 4px;">
      Switch your invite to <strong>Post-Event Mode</strong> to show a personalised thank-you message to anyone who visits your invite link.
    </p>
    ${btn(dashboardUrl, "Go to Dashboard \u2192")}
    <p style="margin:20px 0 0;font-size:13px;color:#78716C;">
      You can enable Post-Event Mode from the invite editor&rsquo;s Review step.
    </p>`;

  await send(
    email,
    "Your event has passed \u2014 switch to Post-Event Mode",
    buildEmail(body),
  );
};

// ─── Order Confirmation ───────────────────────────────────────────────────────

export const sendOrderConfirmationEmail = async (
  email: string,
  opts: {
    name: string;
    templateName: string;
    amount: number;
    currency: string;
    transactionId: string;
    dashboardUrl: string;
  },
) => {
  const { name, templateName, amount, currency, transactionId, dashboardUrl } = opts;
  const safeName     = DOMPurify.sanitize(name);
  const safeTemplate = DOMPurify.sanitize(templateName);
  const amountLabel  = formatAmount(amount, currency);

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      Purchase Confirmed!
    </h2>
    <p style="margin:0 0 8px;">Hi ${safeName},</p>
    <p style="margin:0 0 24px;">
      You&rsquo;ve successfully unlocked <strong>${safeTemplate}</strong>. Your invite is ready to customise.
    </p>
    <!-- Receipt -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"
      style="border:1px solid #EFE0C0;border-radius:10px;overflow:hidden;margin:0 0 8px;">
      <tr style="background-color:#FDF8F0;">
        <td colspan="2" style="padding:11px 18px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#A8968A;letter-spacing:1.8px;text-transform:uppercase;">Receipt</td>
      </tr>
      <tr style="border-top:1px solid #EFE0C0;">
        <td style="padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#78716C;">Template</td>
        <td style="padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#1C1917;text-align:right;">${safeTemplate}</td>
      </tr>
      <tr style="border-top:1px solid #EFE0C0;">
        <td style="padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#78716C;">Amount Paid</td>
        <td style="padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#1C1917;text-align:right;">${amountLabel}</td>
      </tr>
      <tr style="border-top:1px solid #EFE0C0;background-color:#FDF8F0;">
        <td style="padding:10px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#A8968A;">Transaction ID</td>
        <td style="padding:10px 18px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#78716C;text-align:right;">${transactionId}</td>
      </tr>
    </table>
    ${btn(dashboardUrl, "Customise Your Invite \u2192")}
    <p style="margin:20px 0 0;font-size:13px;color:#78716C;">
      Need help? Reply to this email or write to
      <a href="mailto:support@invitesbyshyara.com" style="color:#C9A84C;text-decoration:none;">support@invitesbyshyara.com</a>.
    </p>`;

  await send(email, `Purchase confirmed \u2014 ${safeTemplate}`, buildEmail(body));
};

// ─── Payment Failed ───────────────────────────────────────────────────────────

export const sendPaymentFailedEmail = async (
  email: string,
  opts: { name: string; templateName: string; retryUrl: string },
) => {
  const { name, templateName, retryUrl } = opts;
  const safeName     = DOMPurify.sanitize(name);
  const safeTemplate = DOMPurify.sanitize(templateName);

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">
      Payment Unsuccessful
    </h2>
    <p style="margin:0 0 8px;">Hi ${safeName},</p>
    <p style="margin:0 0 20px;">
      We weren&rsquo;t able to process your payment for <strong>${safeTemplate}</strong>.
      <strong>No charges were made</strong> to your account.
    </p>
    <!-- Reason hint -->
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%" style="margin:0 0 8px;">
      <tr>
        <td style="background-color:#FEF2F2;border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:13px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#B91C1C;line-height:1.6;">
          This can happen due to insufficient funds, a declined card, or a temporary issue with your bank. Please try again.
        </td>
      </tr>
    </table>
    ${btn(retryUrl, "Try Again \u2192")}
    <p style="margin:20px 0 0;font-size:13px;color:#78716C;">
      If the problem persists, write to
      <a href="mailto:support@invitesbyshyara.com" style="color:#C9A84C;text-decoration:none;">support@invitesbyshyara.com</a>
      and we&rsquo;ll help you complete your purchase.
    </p>`;

  await send(email, `Payment failed \u2014 ${safeTemplate}`, buildEmail(body));
};

// ─── Announcement (single) ────────────────────────────────────────────────────

export const sendAnnouncementEmail = async (
  email: string,
  title: string,
  content: string,
  unsubscribeToken?: string,
) => {
  const safeTitle = DOMPurify.sanitize(title);
  const safeContent = DOMPurify.sanitize(content.replace(/\n/g, "<br />"), {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "h2", "h3"],
    ALLOWED_ATTR: ["href"],
  });

  const unsubscribeUrl = unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`
    : undefined;

  const body = `
    <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;font-weight:700;color:#1C1917;line-height:1.3;">${safeTitle}</h2>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#44403C;">${safeContent}</div>`;

  await send(email, safeTitle, buildEmail(body, unsubscribeUrl));
};

// ─── Announcement (bulk) ──────────────────────────────────────────────────────

export const sendAnnouncementBulk = async (
  recipients: Array<{ email: string; unsubscribeToken?: string }>,
  title: string,
  content: string,
) => {
  const chunkSize = 50;

  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(({ email, unsubscribeToken }) =>
        sendAnnouncementEmail(email, title, content, unsubscribeToken),
      ),
    );
    if (i + chunkSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
};
