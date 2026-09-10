/**
 * A small in-memory throttle, the same one the Trail Crew helper uses and for
 * the same reason: the job is to stop one bored student holding the button
 * down, not to defend a bank. It resets on a cold start and does not span
 * instances, which is fine for one classroom.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 12;

export function throttled(key: string): boolean {
  if (!key) return false;
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > MAX_PER_WINDOW;
}
