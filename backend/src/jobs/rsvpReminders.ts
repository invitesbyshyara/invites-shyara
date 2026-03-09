import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { sendRsvpDeadlineReminderEmail, sendPostEventSuggestionEmail } from "../services/email";
import { logger } from "../lib/logger";

/**
 * Checks if a date string is exactly `targetDays` days from today (±12 hours tolerance).
 */
function isDaysAway(dateStr: string, targetDays: number): boolean {
  const deadline = new Date(dateStr);
  if (isNaN(deadline.getTime())) return false;
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= targetDays - 0.5 && diffDays < targetDays + 0.5;
}

export async function runRsvpReminderJob(): Promise<void> {
  logger.info("Running RSVP deadline reminder job");

  const invites = await prisma.invite.findMany({
    where: { status: "published" },
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { rsvps: true } },
    },
  });

  const inviteIds = invites.map((invite) => invite.id);
  const yesCounts = inviteIds.length
    ? await prisma.rsvp.groupBy({
      by: ["inviteId"],
      where: { inviteId: { in: inviteIds }, response: "yes" },
      _count: { _all: true },
    })
    : [];
  const yesCountByInvite = new Map(yesCounts.map((row) => [row.inviteId, row._count._all]));

  const REMINDER_DAYS = [7, 1];
  let sent = 0;

  for (const invite of invites) {
    const data = invite.data as Record<string, unknown>;
    const rsvpDeadline = typeof data?.rsvpDeadline === "string" ? data.rsvpDeadline : null;
    if (!rsvpDeadline) continue;

    const matchingDay = REMINDER_DAYS.find((d) => isDaysAway(rsvpDeadline, d));
    if (!matchingDay) continue;

    const totalRsvps = invite._count.rsvps;
    const yesCount = yesCountByInvite.get(invite.id) ?? 0;
    const inviteName =
      typeof data.eventTitle === "string" && data.eventTitle
        ? data.eventTitle
        : invite.templateCategory.replace(/_/g, " ");

    const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

    try {
      await sendRsvpDeadlineReminderEmail(invite.user.email, {
        hostName: invite.user.name ?? "there",
        inviteName,
        daysLeft: matchingDay,
        deadline: rsvpDeadline,
        totalRsvps,
        yesCount,
        dashboardUrl,
      });
      sent++;
      logger.info(`RSVP reminder sent: ${invite.slug} (${matchingDay}d)`);
    } catch (err) {
      logger.error(`RSVP reminder failed for ${invite.slug}`, { err });
    }
  }

  logger.info(`RSVP reminder job complete. Sent: ${sent}`);

  // Post-event suggestion: notify hosts of past events that haven't switched to post-event mode
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastInvites = await prisma.invite.findMany({
    where: { status: "published" },
    include: { user: { select: { email: true, name: true } } },
  });

  let postEventSent = 0;
  for (const invite of pastInvites) {
    const data = invite.data as Record<string, unknown>;
    // Already in post-event mode or suggestion already sent
    if (data.postEventMode === true || data.postEventEmailSent === true) continue;

    const eventDateStr = typeof data.eventDate === "string"
      ? data.eventDate
      : typeof data.weddingDate === "string"
        ? data.weddingDate
        : typeof data.partyDate === "string"
          ? data.partyDate
          : null;
    if (!eventDateStr) continue;

    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);
    // Only send on the day after the event (yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (eventDate.getTime() !== yesterday.getTime()) continue;

    const inviteName =
      typeof data.eventTitle === "string" && data.eventTitle
        ? data.eventTitle
        : invite.templateCategory.replace(/_/g, " ");

    const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

    try {
      await sendPostEventSuggestionEmail(invite.user.email, {
        hostName: invite.user.name ?? "there",
        inviteName,
        dashboardUrl,
      });
      // Mark so we don't re-send
      await prisma.invite.update({
        where: { id: invite.id },
        data: { data: { ...data, postEventEmailSent: true } },
      });
      postEventSent++;
      logger.info(`Post-event suggestion sent: ${invite.slug}`);
    } catch (err) {
      logger.error(`Post-event suggestion failed for ${invite.slug}`, { err });
    }
  }

  logger.info(`Post-event suggestion job complete. Sent: ${postEventSent}`);
}

function msUntilNextRun(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function startRsvpReminderJob(): void {
  const schedule = () => {
    const delay = msUntilNextRun(9, 0);
    setTimeout(async () => {
      try {
        await runRsvpReminderJob();
      } catch (err) {
        logger.error("RSVP reminder job crashed", { err });
      } finally {
        schedule();
      }
    }, delay);
  };

  schedule();
  logger.info("RSVP deadline reminder scheduled (daily 09:00)");
}
