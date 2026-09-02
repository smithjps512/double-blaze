/**
 * Pure guards for the Trail Crew helper.
 *
 * Kept out of `trail-crew-helper.ts` because that module is server-only, and a
 * guard this important deserves tests that run in the ordinary test process
 * rather than tests that cannot import it.
 */

/** How long a student's question may be: long enough to explain, short enough to stay a question. */
export const MAX_QUESTION_LENGTH = 600;

/**
 * Does this reply contain code?
 *
 * The helper's system prompt forbids writing code, because the build documents
 * are a lookup chain and code handed over collapses it. This is the independent
 * check for the day a determined thirteen year old talks the model into it
 * anyway.
 *
 * It is tuned to over-trigger. A wrongly withheld answer costs a student thirty
 * seconds; a leaked answer costs the teaching design.
 */
export function looksLikeCode(text: string): boolean {
  if (/```/.test(text)) return true;
  if (/^\s{4,}\S+.*[=:(]/m.test(text)) return true;
  // The decorator needs its own test: a leading \b can never match before "@",
  // which is not a word character, so folding it into the group below silently
  // never fired.
  if (/@handle\s*\(/.test(text)) return true;
  return /\b(def |import |self\.\w+\s*=|app_tables\.|anvil\.server\.call\()/.test(text);
}
