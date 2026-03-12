export const buildShareMessage = (
  data: Record<string, unknown>,
  eventType: string,
  inviteUrl: string,
): string => {
  const names = [
    data.brideFirstName,
    data.groomFirstName,
    data.coupleName,
    data.hostName,
    data.guestOfHonorName,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(" & ");

  const prefix = names ? `${names}'s ${eventType}` : `a special ${eventType}`;
  return `You're invited to ${prefix}! View your invitation here: ${inviteUrl}`;
};

export const extractInviteNames = (data: Record<string, unknown>): string => {
  const names = [
    data.brideFirstName,
    data.groomFirstName,
    data.coupleName,
    data.hostName,
    data.guestOfHonorName,
  ]
    .filter(Boolean)
    .slice(0, 2);
  return (names as string[]).join(' & ');
};
