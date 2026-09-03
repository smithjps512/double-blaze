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
/**
 * How much code a debugging answer may contain.
 *
 * Debug mode is allowed to show code, because an error message has no answer in
 * the build documents and refusing there teaches nothing. But it must be a fix,
 * not a feature: a few corrected lines, never the whole handler. Past this many
 * lines the helper has stopped debugging and started doing the assignment.
 */
export const MAX_DEBUG_CODE_LINES = 12;

/**
 * Is this debugging answer handing over a whole feature rather than a fix?
 *
 * Counts the lines inside fenced blocks. Generous on purpose: a real fix
 * sometimes needs the two lines above it for context, and being strict here
 * would block honest help.
 */
export function tooMuchCode(text: string): boolean {
  const fences = [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)];
  const lines = fences.reduce(
    (n, m) => n + m[1].split("\n").filter((l) => l.trim().length > 0).length,
    0,
  );
  return lines > MAX_DEBUG_CODE_LINES;
}

export function looksLikeCode(text: string): boolean {
  if (/```/.test(text)) return true;
  if (/^\s{4,}\S+.*[=:(]/m.test(text)) return true;
  // The decorator needs its own test: a leading \b can never match before "@",
  // which is not a word character, so folding it into the group below silently
  // never fired.
  if (/@handle\s*\(/.test(text)) return true;
  return /\b(def |import |self\.\w+\s*=|app_tables\.|anvil\.server\.call\()/.test(text);
}
