import { EventCategory, Invite } from "@/types";

type InviteData = Record<string, unknown>;

const asTrimmed = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const getEventTitleFromData = (data: InviteData, category: EventCategory) => {
  const brideName = asTrimmed(data.brideName);
  const groomName = asTrimmed(data.groomName);
  const partnerOneName = asTrimmed(data.partnerOneName);
  const partnerTwoName = asTrimmed(data.partnerTwoName);
  const celebrantName = asTrimmed(data.celebrantName);
  const eventName = asTrimmed(data.eventName);
  const parentNames = asTrimmed(data.parentNames);
  const coupleNames = asTrimmed(data.coupleNames);

  switch (category) {
    case "wedding":
      return brideName && groomName ? `${brideName} & ${groomName}` : eventName || "Wedding Invitation";
    case "engagement":
      return partnerOneName && partnerTwoName ? `${partnerOneName} & ${partnerTwoName}` : eventName || "Engagement Invitation";
    case "birthday":
      return celebrantName ? `${celebrantName}'s Birthday` : eventName || "Birthday Invitation";
    case "baby-shower":
      return parentNames || eventName || "Baby Shower Invitation";
    case "corporate":
      return eventName || "Corporate Event";
    case "anniversary":
      return coupleNames || eventName || "Anniversary Invitation";
    default:
      return eventName || "Invitation";
  }
};

export const getEventDateFromData = (data: InviteData) =>
  asTrimmed(data.eventDate) ||
  asTrimmed(data.weddingDate) ||
  asTrimmed(data.engagementDate) ||
  asTrimmed(data.anniversaryDate);

export const getEventTimeFromData = (data: InviteData) =>
  asTrimmed(data.eventTime) ||
  asTrimmed(data.weddingTime) ||
  asTrimmed(data.engagementTime) ||
  asTrimmed(data.anniversaryTime);

export const getInviteVenueSummary = (data: InviteData) => {
  const venueName = asTrimmed(data.venueName);
  const venueAddress = asTrimmed(data.venueAddress);

  if (venueName && venueAddress) {
    return `${venueName}, ${venueAddress}`;
  }

  return venueName || venueAddress;
};

export const getInviteHeadline = (invite: Invite) => {
  const title = getEventTitleFromData(invite.data ?? {}, invite.templateCategory);
  if (title && title !== "Invitation") {
    return title;
  }
  if (invite.slug) {
    return invite.slug.replace(/-/g, " ");
  }
  return "Untitled invite";
};

export const formatSectionLabel = (section: string) =>
  section
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getLocalizedInviteData = (data: InviteData, language?: string) => {
  if (!language) return data;

  const localization = data.localization;
  if (!localization || typeof localization !== "object" || Array.isArray(localization)) {
    return data;
  }

  const translations = (localization as { translations?: Record<string, Record<string, unknown>> }).translations;
  const entries = translations?.[language];
  if (!entries || typeof entries !== "object") {
    return data;
  }

  const localized = { ...data };
  Object.entries(entries).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      localized[key] = value;
    }
  });

  return localized;
};
