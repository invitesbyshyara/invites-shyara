import { Resend } from "resend";
import DOMPurify from "isomorphic-dompurify";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

const resend = new Resend(env.RESEND_API_KEY);

const baseStyle = `
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: Arial, Helvetica, sans-serif; }
    .wrapper { width: 100%; background: #f4f4f5; padding: 32px 0; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 28px 32px; text-align: center; }
    .header img { height: 32px; margin-bottom: 8px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 32px; color: #374151; font-size: 15px; line-height: 1.6; }
    .body h2 { margin: 0 0 12px; font-size: 18px; color: #111827; }
    .body p { margin: 0 0 16px; }
    .otp { display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7c3aed; background: #f5f3ff; border-radius: 8px; padding: 12px 24px; margin: 8px 0 20px; }
    .btn { display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; margin-top: 8px; }
    .meta { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; font-size: 12px; color: #6b7280; }
    .meta a { color: #7c3aed; text-decoration: none; }
    .footer { text-align: center; padding: 16px 32px 24px; font-size: 12px; color: #9ca3af; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
`;

const buildEmail = (body: string, unsubscribeUrl?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${baseStyle}
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Shyara</h1>
      </div>
      <div class="body">
        ${body}
      </div>
      ${unsubscribeUrl ? `
      <div class="meta">
        <p style="margin:0">
          Don't want these emails?
          <a href="${unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>` : ""}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Shyara &mdash; Digital Invitations &bull; <a href="${env.FRONTEND_URL}/privacy">Privacy</a> &bull; <a href="${env.FRONTEND_URL}/terms">Terms</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const send = async (to: string | string[], subject: string, html: string) => {
  try {
    await resend.emails.send({
      from: `Shyara <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error("Email send failed", { error, to, subject });
    throw error;
  }
};

export const sendWelcomeEmail = async (name: string, email: string) => {
  const safeName = DOMPurify.sanitize(name);
  const body = `
    <h2>Welcome to Shyara! 🎉</h2>
    <p>Hi ${safeName},</p>
    <p>Thanks for signing up. Start creating beautiful digital invitations for your special events in minutes.</p>
    <p>
      <a class="btn" href="${env.FRONTEND_URL}/templates">Browse Templates</a>
    </p>
    <p style="font-size:13px;color:#6b7280;margin-top:24px">
      Need help? Reply to this email and we'll get back to you.
    </p>
  `;
  await send(email, "Welcome to Shyara 🎉", buildEmail(body));
};

export const sendRsvpConfirmationEmail = async (email: string, details: {
  guestName: string;
  inviteName: string;
  response: string;
  eventDate?: string;
  unsubscribeToken?: string;
}) => {
  const safeName = DOMPurify.sanitize(details.guestName);
  const safeInvite = DOMPurify.sanitize(details.inviteName);
  const safeResponse = DOMPurify.sanitize(details.response);
  const safeDate = details.eventDate ? DOMPurify.sanitize(details.eventDate) : undefined;

  const unsubscribeUrl = details.unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${details.unsubscribeToken}`
    : undefined;

  const responseLabel: Record<string, string> = {
    yes: "Attending ✅",
    no: "Not Attending ❌",
    maybe: "Maybe 🤔",
  };

  const body = `
    <h2>Your RSVP is confirmed</h2>
    <p>Hi ${safeName},</p>
    <p>We've recorded your RSVP for <strong>${safeInvite}</strong>.</p>
    <p><strong>Response:</strong> ${responseLabel[safeResponse] ?? safeResponse}</p>
    ${safeDate ? `<p><strong>Event date:</strong> ${safeDate}</p>` : ""}
    <p style="font-size:13px;color:#6b7280;margin-top:24px">
      Need to change your RSVP? Contact the event organiser directly.
    </p>
  `;
  await send(email, `Your RSVP for ${safeInvite}`, buildEmail(body, unsubscribeUrl));
};

export const sendRsvpNotificationEmail = async (email: string, details: {
  guestName: string;
  response: string;
  totalCount: number;
  inviteSlug?: string;
  unsubscribeToken?: string;
}) => {
  const safeName = DOMPurify.sanitize(details.guestName);
  const safeResponse = DOMPurify.sanitize(details.response);

  const unsubscribeUrl = details.unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${details.unsubscribeToken}`
    : undefined;

  const manageUrl = details.inviteSlug
    ? `${env.FRONTEND_URL}/dashboard/invites/${details.inviteSlug}/rsvps`
    : `${env.FRONTEND_URL}/dashboard`;

  const responseLabel: Record<string, string> = {
    yes: "Attending ✅",
    no: "Not Attending ❌",
    maybe: "Maybe 🤔",
  };

  const body = `
    <h2>New RSVP received</h2>
    <p><strong>${safeName}</strong> has responded to your invite.</p>
    <p><strong>Response:</strong> ${responseLabel[safeResponse] ?? safeResponse}</p>
    <p><strong>Total RSVPs so far:</strong> ${details.totalCount}</p>
    <p>
      <a class="btn" href="${manageUrl}">Manage RSVPs</a>
    </p>
  `;
  await send(email, `New RSVP from ${safeName}`, buildEmail(body, unsubscribeUrl));
};

export const sendPasswordResetOtpEmail = async (email: string, otp: string) => {
  const safeOtp = DOMPurify.sanitize(otp);
  const body = `
    <h2>Reset your password</h2>
    <p>Use the OTP below to reset your Shyara password. It expires in <strong>15 minutes</strong>.</p>
    <div class="otp">${safeOtp}</div>
    <p style="font-size:13px;color:#6b7280">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `;
  await send(email, "Your password reset OTP", buildEmail(body));
};

export const sendInvitePublishedEmail = async (email: string, inviteUrl: string, unsubscribeToken?: string) => {
  const safeUrl = DOMPurify.sanitize(inviteUrl);
  const unsubscribeUrl = unsubscribeToken
    ? `${env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`
    : undefined;

  const body = `
    <h2>Your invite is live! 🎉</h2>
    <p>Your invite has been published successfully. Share the link below with your guests.</p>
    <p>
      <a class="btn" href="${safeUrl}">View Your Invite</a>
    </p>
    <p style="font-size:13px;color:#6b7280;word-break:break-all">
      Direct link: <a href="${safeUrl}">${safeUrl}</a>
    </p>
  `;
  await send(email, "Your invite is now live", buildEmail(body, unsubscribeUrl));
};

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
    <h2>${safeTitle}</h2>
    ${safeContent}
  `;
  await send(email, safeTitle, buildEmail(body, unsubscribeUrl));
};

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
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;

  const body = `
    <h2>RSVP Deadline Reminder</h2>
    <p>Hi ${DOMPurify.sanitize(hostName)},</p>
    <p>
      Your RSVP deadline for <strong>${DOMPurify.sanitize(inviteName)}</strong> is
      <strong>${dayLabel} away</strong> (${deadlineFormatted}).
    </p>
    <p>Here's a summary of responses received so far:</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;">
      <tr>
        <td style="padding:10px 16px;background:#f9f5f2;border-radius:8px;font-size:14px;">
          <strong style="font-size:28px;">${totalRsvps}</strong><br/>Total RSVPs
        </td>
        <td style="padding:10px 16px;background:#f9f5f2;border-radius:8px;font-size:14px;margin-left:8px;">
          <strong style="font-size:28px;">${yesCount}</strong><br/>Attending
        </td>
      </tr>
    </table>
    <p>
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#c06090;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        View All RSVPs
      </a>
    </p>
    <p style="color:#888;font-size:13px;">
      After ${deadlineFormatted}, new RSVPs will automatically be closed.
    </p>
  `;
  await send(email, `Reminder: RSVP deadline in ${dayLabel} — ${DOMPurify.sanitize(inviteName)}`, buildEmail(body));
};

export const sendPostEventSuggestionEmail = async (
  email: string,
  opts: { hostName: string; inviteName: string; dashboardUrl: string },
) => {
  const { hostName, inviteName, dashboardUrl } = opts;
  const body = `
    <h2>Your event has passed 🎉</h2>
    <p>Hi ${DOMPurify.sanitize(hostName)},</p>
    <p>
      It looks like <strong>${DOMPurify.sanitize(inviteName)}</strong> has come and gone —
      congrats on the celebration!
    </p>
    <p>
      Switch your invite to <strong>Post-Event Mode</strong> to show a personalised thank-you
      message to anyone who visits the link.
    </p>
    <p>
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#c06090;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Go to Dashboard
      </a>
    </p>
    <p style="color:#888;font-size:13px;">
      You can enable Post-Event Mode from the invite editor's Review step.
    </p>
  `;
  await send(
    email,
    `Your event has passed — switch to Post-Event Mode`,
    buildEmail(body),
  );
};

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
