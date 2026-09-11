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

/**
 * Is this a Figma question that landed in the wrong box?
 *
 * The "I do not know what to do" box and the gap guide box teach by refusing:
 * the answer is in the student's documents and looking it up is the lesson.
 * Nothing about Figma is in those documents, so a Figma question asked there
 * gets a refusal that teaches nothing and points at a Pattern Book with no
 * Figma in it. The log showed exactly that happening: "how do I link Figma to
 * Anvil" and "how do I make a password box in my prototype" both asked in learn
 * mode and both "answered".
 *
 * So the ask route sends these to design mode, whichever tab they came in on.
 * Tuned to over-trigger a little: a design answer to a borderline question is
 * still a good answer, while a lookup refusal to a Figma question is not.
 *
 * A question that contains code is an Anvil question whatever words are in it,
 * and stays where it was asked.
 */
export function looksLikeFigma(question: string): boolean {
  // looksLikeCode is tuned for answers; a pasted fragment in a question can be
  // looser ("self.lbl_total.text = 5"), so this also catches a bare attribute
  // chain, which no Figma question contains.
  if (looksLikeCode(question) || /\bself\.\w+|\bapp_tables\.|\w+\.\w+\(/.test(question)) return false;
  const q = question.toLowerCase();
  if (/\bfigma\b|\bdev mode\b|\bauto ?layout\b|\bartboard|\bnoodle|\bsmart animate|\bwireframe|\bmock ?up/.test(q)) return true;
  if (/\bframes?\b|\blayers?\b|\bprototyp/.test(q)) return true;
  if (/\bhex\b|\bcolou?r scheme|\bfont\b|\bicon\b/.test(q)) return true;
  // "How do I make it look like a real app", "make it pretty", "look like a phone app".
  if (/\b(look|looks|looking)\s+(like|good|nice|better|pretty|professional)|\bpretty\b|\bphone app\b|\blike an app\b/.test(q)) return true;
  // "How do I design ...", "design the home screen", "start my design".
  return /\bdesign(ing|ed|s)?\b\s+(my|the|a|our|it)\b|\bstart(ing)? (my|the|our) design\b/.test(q);
}
