/**
 * What the storyteller is given: the voice it speaks in and every fact it may
 * use, both built from the tracker's data file. Kept apart from the module
 * that calls the model so it has no server-only import and the tests can read
 * it under plain node.
 *
 * No em dashes anywhere in this file.
 */

import {
  AS_OF,
  AWARDS,
  BIO,
  HONOURS,
  RECORDS,
  SEASONS,
  SPAIN_CAMPAIGNS,
  SPAIN_TOTAL,
  TEAMS,
  YOUTH_NATIONAL,
  clubTotals,
} from "@/data/yamal";

/** Every fact the pages show, as plain text the model can quote from. */
export function factsText(): string {
  const club = clubTotals();
  const out: string[] = [];

  out.push(`Numbers are as of ${AS_OF}.`);
  out.push("");
  out.push("WHO HE IS");
  out.push(
    `${BIO.fullName}, known as ${BIO.name}. Born ${BIO.born} in ${BIO.birthplace}, raised in ${BIO.hometown}. ${BIO.position}, ${BIO.foot.toLowerCase()} footed. Wears number ${BIO.clubShirt} for Barcelona and number ${BIO.countryShirt} for Spain.`,
  );
  out.push("");

  out.push("EVERY TEAM, OLDEST FIRST");
  for (const t of TEAMS) {
    const rec = t.record ? ` Record: ${t.record.apps} games, ${t.record.goals} goals.` : "";
    out.push(`- ${t.name} (${t.years}; ${t.role}). ${t.summary}${rec}`);
  }
  out.push("");

  out.push("SPAIN YOUTH TEAMS");
  for (const r of YOUTH_NATIONAL) out.push(`- ${r.team}, ${r.years}: ${r.apps} games, ${r.goals} goals.`);
  out.push("");

  out.push("BARCELONA FIRST TEAM, SEASON BY SEASON, ALL COMPETITIONS");
  for (const s of SEASONS) {
    out.push(
      `${s.label}${s.inProgress ? " (in progress)" : ""}: age ${s.age} at the start, shirt number ${s.shirt}. Total ${s.total.apps} games, ${s.total.goals} goals, ${s.total.assists} assists.`,
    );
    for (const l of s.lines) {
      out.push(
        `  - ${l.competition}: ${l.apps} games, ${l.goals} goals, ${l.assists} assists${l.derived ? " (derived by subtraction from the season total, not reported directly)" : ""}.`,
      );
    }
    if (s.honours.length) out.push(`  - Won: ${s.honours.join("; ")}.`);
    for (const m of s.moments) out.push(`  - ${m}`);
  }
  out.push(`Barcelona career total: ${club.apps} games, ${club.goals} goals, ${club.assists} assists.`);
  out.push("");

  out.push("SPAIN SENIOR TEAM");
  out.push(
    `${SPAIN_TOTAL.caps} caps and ${SPAIN_TOTAL.goals} goals through ${SPAIN_TOTAL.through}. That count is the 25 caps and 6 goals reported on 31 March 2026 plus his eight World Cup games and one World Cup goal; friendlies in between and matches after the final are not counted.`,
  );
  for (const c of SPAIN_CAMPAIGNS) {
    const line = c.apps !== undefined ? ` ${c.apps} games, ${c.goals} goals, ${c.assists} assists.` : "";
    out.push(`${c.label} (${c.years}): ${c.result}.${line}`);
    for (const m of c.moments) out.push(`  - ${m}`);
  }
  out.push("");

  out.push("HONOURS");
  for (const h of HONOURS.club) out.push(`- With Barcelona: ${h}`);
  for (const h of HONOURS.country) out.push(`- With Spain: ${h}`);
  out.push("");

  out.push("INDIVIDUAL AWARDS");
  for (const a of AWARDS) out.push(`- ${a.year}: ${a.award}`);
  out.push("");

  out.push("RECORDS");
  for (const r of RECORDS) out.push(`- ${r}`);

  return out.join("\n");
}

export const VOICE = `You are the storyteller on a classroom web page about the footballer Lamine Yamal. You are talking to students aged 12 to 14 who love him.

Who you are:
- A commentator telling his story in the third person. You are not Lamine Yamal. Never speak as him, never write "I" as if you were him, and never invent quotes from him or anyone else.
- Warm, vivid and short. Two to five sentences for most answers, a few more for a season or a tournament. Plain words a 12 year old reads easily.

The one rule:
- Everything you say about him must come from the FACTS below. Do not add goals, matches, scores, dates, teammates, opponents or numbers that are not in the FACTS, even if you believe you remember them.
- If a question asks for something the FACTS do not have, say so in one plain sentence, then offer the closest thing you do have. For example: "The page does not have that match. What it does have is ..."
- When a number is marked as derived, or the FACTS give a date it was true, you may mention that if it matters to the answer.
- Questions about other players, other sports or anything unrelated: answer in one friendly sentence that you only know this page, and steer back to him.

Style:
- No em dashes. Use commas, full stops or colons instead.
- No bullet lists unless the student asks for a list. Tell it as a story.
- If the student asks how you know, tell them: the numbers on this page, checked on the date shown, and nothing else.`;

