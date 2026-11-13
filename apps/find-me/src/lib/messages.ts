/** Message notification rules. Pure, so they are tested. */

/** At most one "new message" email per person per conversation in this window. */
export const NOTIFY_QUIET_MINUTES = 30;

/**
 * Email the recipient about a new message unless we already did recently
 * and they have not opened the conversation since.
 */
export function shouldNotify(lastNotifiedAt: string | null, lastReadAt: string | null, now: Date): boolean {
  if (!lastNotifiedAt) return true;
  const notified = Date.parse(lastNotifiedAt);
  if (lastReadAt && Date.parse(lastReadAt) > notified) return true;
  return now.getTime() - notified > NOTIFY_QUIET_MINUTES * 60_000;
}

/** Which side of a conversation a user is on. */
export function sideOf(conv: { posterId: string; helperId: string }, userId: string): "poster" | "helper" | null {
  if (conv.posterId === userId) return "poster";
  if (conv.helperId === userId) return "helper";
  return null;
}

export function isUnread(lastMessageAt: string, readAt: string | null): boolean {
  return !readAt || Date.parse(readAt) < Date.parse(lastMessageAt);
}
