/**
 * Game Studio: a sixth grade team's game design doc.
 *
 * The same ideas as Launch Pad, said the way games say them. A game's purpose
 * is the feeling it gives the player. There is always more than one kind of
 * player. The core loop is the few verbs the player repeats. A level is a
 * player story, with checks and scenarios and the same Definition of Done,
 * so a level is written exactly like a feature.
 *
 * Pure, so the page, the API and the export agree. Hints are rules, not a
 * model. No em dashes in any copy.
 */

import {
  cleanPlan,
  emptyStory,
  storyDone,
  storyIsWritten,
  toUserStories,
  type Hint,
  type LaunchPlan,
  type LaunchStory,
} from "../launch/plan";

export const GENRES = ["Platformer", "Top-down adventure", "Runner or racer", "Puzzle", "Survival", "Sports", "Arcade dodge", "Something new"] as const;

export interface PlayerType {
  name: string;
  wants: string;
}

export interface Mechanic {
  name: string;
  /** Which buttons: "A button", "arrow keys", "tap". */
  controls: string;
  /** What happens: the rule. "Jump clears a 2 tile wall." */
  rule: string;
}

export interface GameDesign {
  gameName: string;
  /** "It's a ___ game where you ___." */
  oneLiner: string;
  /** The purpose of a game: how the player should feel. */
  feeling: string;
  genre: string;
  players: PlayerType[];
  /** The verbs the player repeats, in order. */
  loop: string[];
  win: string;
  lose: string;
  hero: string;
  goal: string;
  obstacle: string;
  setting: string;
  intro: string;
  mechanics: Mechanic[];
  /** Each level is a player story, with checks and scenarios. */
  levels: LaunchStory[];
}

export const STUDIO_LIMITS = { short: 80, sentence: 400, players: 6, loop: 5, mechanics: 8, levels: 8 } as const;
export const GOALS = { players: 2, loop: 3, mechanics: 3, levels: 3 } as const;

export function emptyDesign(): GameDesign {
  return {
    gameName: "",
    oneLiner: "",
    feeling: "",
    genre: "",
    players: [
      { name: "", wants: "" },
      { name: "", wants: "" },
    ],
    loop: ["", "", ""],
    win: "",
    lose: "",
    hero: "",
    goal: "",
    obstacle: "",
    setting: "",
    intro: "",
    mechanics: [
      { name: "", controls: "", rule: "" },
      { name: "", controls: "", rule: "" },
      { name: "", controls: "", rule: "" },
    ],
    levels: [emptyStory(), emptyStory(), emptyStory()],
  };
}

const str = (raw: unknown, max: number) =>
  typeof raw === "string" ? raw.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/ {2,}/g, " ").slice(0, max) : "";
const list = (raw: unknown, max: number): unknown[] => (Array.isArray(raw) ? raw.slice(0, max) : []);
const obj = (raw: unknown) => (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

/** Whatever arrives over the wire, as a design. Never throws. */
export function cleanDesign(raw: unknown): GameDesign {
  const o = obj(raw);
  const L = STUDIO_LIMITS;
  return {
    gameName: str(o.gameName, L.short),
    oneLiner: str(o.oneLiner, L.sentence),
    feeling: str(o.feeling, L.sentence),
    genre: str(o.genre, L.short),
    players: list(o.players, L.players).map((p) => ({ name: str(obj(p).name, L.short), wants: str(obj(p).wants, L.sentence) })),
    loop: list(o.loop, L.loop).map((v) => str(v, 40)),
    win: str(o.win, L.sentence),
    lose: str(o.lose, L.sentence),
    hero: str(o.hero, L.short),
    goal: str(o.goal, L.sentence),
    obstacle: str(o.obstacle, L.sentence),
    setting: str(o.setting, L.sentence),
    intro: str(o.intro, L.sentence * 2),
    mechanics: list(o.mechanics, L.mechanics).map((m) => ({ name: str(obj(m).name, L.short), controls: str(obj(m).controls, L.short), rule: str(obj(m).rule, L.sentence) })),
    // Levels are stories, cleaned by the same rules as Launch Pad's.
    levels: cleanPlan({ stories: list(o.levels, L.levels) }).stories,
  };
}

/* ------------------------------------------------------------- coaching */

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const FEELING = /\b(brave|clever|smart|fast|quick|powerful|strong|cozy|calm|relaxed|spooky|scared|nervous|excited|happy|proud|free|curious|surprised|tense|epic|funny|silly|creative|unstoppable|lucky|sneaky|heroic|chill|hyped|confident|amazed|fun)\b/i;

export function feelingHints(feeling: string): Hint[] {
  const f = feeling.trim();
  if (!f) return [{ level: "todo", text: "How should the player feel while they play? That feeling is your game's purpose." }];
  if (/\b(it is|it's|you can|the game has|a game)\b/i.test(f) && !FEELING.test(f)) {
    return [{ level: "nudge", text: "That says what the game is. Now say how it should feel: brave, clever, fast, cozy, spooky?" }];
  }
  if (!FEELING.test(f) && words(f) < 4) return [{ level: "nudge", text: "Use a feeling word. Brave? Sneaky? Unstoppable? Chill?" }];
  return [{ level: "good", text: "That is a feeling. Every level and mechanic should make it stronger." }];
}

export function playerHints(players: PlayerType[]): Hint[] {
  const named = players.filter((p) => p.name.trim());
  if (named.length === 0) return [{ level: "todo", text: "Who plays it? Start with the obvious one." }];
  const hints: Hint[] = [];
  if (named.length < GOALS.players) hints.push({ level: "todo", text: "There is always more than one kind of player. Explorers? Competitors? Collectors? Builders?" });
  const blank = named.filter((p) => !p.wants.trim());
  if (blank.length) hints.push({ level: "todo", text: `What does ${blank.map((p) => p.name.trim()).join(" and ")} want from the game?` });
  if (named.length >= GOALS.players && !blank.length) hints.push({ level: "good", text: "Different players want different things. Does your game give each of them something?" });
  return hints;
}

export function loopHints(d: GameDesign): Hint[] {
  const verbs = d.loop.filter((v) => v.trim());
  const hints: Hint[] = [];
  if (verbs.length < GOALS.loop) hints.push({ level: "todo", text: `A core loop is ${GOALS.loop} or ${GOALS.loop + 1} things the player does over and over. One word each: run, jump, collect...` });
  const long = verbs.filter((v) => words(v) > 3);
  if (long.length) hints.push({ level: "nudge", text: "Keep each step short, a verb or two. The details go in Mechanics." });
  if (!d.win.trim()) hints.push({ level: "todo", text: "How do you win? A player needs to know what they are working toward." });
  if (!d.lose.trim()) hints.push({ level: "todo", text: "How do you lose? Without a way to lose, there is nothing at stake." });
  if (!hints.length) hints.push({ level: "good", text: `${verbs.join(", then ")}, then again. That is a loop.` });
  return hints;
}

export function mechanicHints(m: Mechanic): Hint[] {
  if (!m.name.trim() && !m.controls.trim() && !m.rule.trim()) return [];
  const hints: Hint[] = [];
  if (!m.controls.trim()) hints.push({ level: "todo", text: "Which button or key does it?" });
  if (!m.rule.trim()) hints.push({ level: "todo", text: "What exactly happens? That is the rule a developer builds." });
  else if (!/\d|\b(once|twice|every|until|only|always|never|after|when|if)\b/i.test(m.rule)) {
    hints.push({ level: "nudge", text: "Make the rule exact: how far, how fast, how many, how long? Numbers make it buildable." });
  }
  if (!hints.length) hints.push({ level: "good", text: "Buildable: a button and an exact rule." });
  return hints;
}

export const mechanicIsWritten = (m: Mechanic) => !!(m.name.trim() && m.controls.trim() && m.rule.trim());

/* ------------------------------------------------------------- progress */

/** As a plan, so levels can use Launch Pad's story card and hints, and its export. */
export function asPlan(d: GameDesign): LaunchPlan {
  return {
    productName: d.gameName,
    idea: d.oneLiner,
    community: d.genre,
    purpose: d.feeling,
    users: d.players.map((p) => ({ name: p.name, cares: p.wants })),
    stories: d.levels,
  };
}

export function studioProgress(d: GameDesign) {
  const players = d.players.filter((p) => p.name.trim() && p.wants.trim()).length;
  const loop = d.loop.filter((v) => v.trim()).length;
  const mechanics = d.mechanics.filter(mechanicIsWritten).length;
  const levels = d.levels.filter(storyIsWritten).length;
  const doneLevels = d.levels.filter((l) => storyIsWritten(l) && storyDone(l).every((c) => c.ok)).length;
  return {
    pitch: !!(d.gameName.trim() && d.oneLiner.trim() && d.feeling.trim()),
    players,
    loop: loop >= GOALS.loop && !!d.win.trim() && !!d.lose.trim(),
    world: !!(d.hero.trim() && d.goal.trim() && d.obstacle.trim()),
    mechanics,
    levels,
    doneLevels,
  };
}

export type StudioStep = "pitch" | "players" | "loop" | "world" | "mechanics" | "levels" | "doc" | "levelup";

export interface StudioItem {
  id: string;
  text: string;
  action: string;
  target: { step: StudioStep; level?: number; bonus?: boolean; scenario?: "happy" | "bad" };
}

/** What would make the design better, in the order a studio would fix it. */
export function studioLevelUp(d: GameDesign): StudioItem[] {
  const items: StudioItem[] = [];
  const p = studioProgress(d);
  if (!p.pitch) items.push({ id: "pitch", text: "Your pitch needs a name, a one-liner, and a feeling.", action: "Finish the pitch", target: { step: "pitch" } });
  else if (feelingHints(d.feeling).some((h) => h.level !== "good")) items.push({ id: "feeling", text: "Say the feeling with a feeling word. It is your game's purpose.", action: "Fix the feeling", target: { step: "pitch" } });
  if (p.players < GOALS.players) items.push({ id: "players", text: "Name at least 2 kinds of players, and what each one wants.", action: "Add players", target: { step: "players" } });
  if (!p.loop) items.push({ id: "loop", text: "Finish the core loop: 3 or 4 verbs, how you win, and how you lose.", action: "Fix the loop", target: { step: "loop" } });
  if (!p.world) items.push({ id: "world", text: "Who is the hero, what do they want, and what is in the way?", action: "Build the world", target: { step: "world" } });
  if (p.mechanics < GOALS.mechanics) items.push({ id: "mechanics", text: `Write at least ${GOALS.mechanics} mechanics, each with a button and an exact rule.`, action: "Add mechanics", target: { step: "mechanics" } });
  else if (d.mechanics.some((m) => mechanicIsWritten(m) && mechanicHints(m).some((h) => h.level === "nudge"))) {
    items.push({ id: "exact", text: "Some mechanics need exact rules: how far, how fast, how many?", action: "Make rules exact", target: { step: "mechanics" } });
  }
  d.levels.forEach((l, i) => {
    const n = i + 1;
    if (!l.asA.trim() && !l.iWant.trim() && !l.soThat.trim()) return;
    const name = `Level ${n}${l.feature.trim() ? ` (${l.feature.trim()})` : ""}`;
    for (const c of storyDone(l)) {
      if (c.ok) continue;
      if (c.key === "story") items.push({ id: `l${n}-story`, text: `${name} needs a who, a what, and a "so I can".`, action: `Finish level ${n}`, target: { step: "levels", level: i } });
      if (c.key === "checks") items.push({ id: `l${n}-checks`, text: `${name} needs at least 2 checks a playtester could test.`, action: `Add checks to level ${n}`, target: { step: "levels", level: i, bonus: true } });
      if (c.key === "happy") items.push({ id: `l${n}-happy`, text: `${name} needs a happy path: what happens when it goes right?`, action: "Write the happy path", target: { step: "levels", level: i, scenario: "happy" } });
      if (c.key === "bad") items.push({ id: `l${n}-bad`, text: `${name} needs a bad day: what if the player falls, gets stuck, or does something weird?`, action: "Write a bad day", target: { step: "levels", level: i, scenario: "bad" } });
    }
  });
  if (p.levels < GOALS.levels) items.push({ id: "levels", text: `A game needs at least ${GOALS.levels} levels. What does the player do in the next one?`, action: "Add a level", target: { step: "levels" } });
  return items;
}

/* --------------------------------------------------------------- export */

const line = (s: string) => s.trim().replace(/\s+/g, " ");
const dot = (s: string) => {
  const t = line(s).replace(/[.!]+$/, "");
  return t ? `${t[0].toUpperCase()}${t.slice(1)}.` : "_Not written yet._";
};

/**
 * The design doc as markdown, for the Double Blaze build: everything a
 * builder needs, in the team's words. Levels follow in the same story format
 * as Launch Pad, so the prototype generator can read them too.
 */
export function toGameDesignDoc(d: GameDesign, teamName: string, period?: number): string {
  const name = line(d.gameName) || `${teamName}'s game`;
  const out = [`# ${name}`, "", `Team: ${teamName}`, ""];
  out.push([period ? `Period ${period}.` : "", line(d.genre) ? `Genre: ${line(d.genre)}.` : ""].filter(Boolean).join(" ") || "", "");
  out.push("## Pitch", "", dot(d.oneLiner), "", "## The feeling", "", dot(d.feeling), "", "## Players", "");
  const players = d.players.filter((p) => line(p.name));
  if (!players.length) out.push("_Not written yet._", "");
  for (const p of players) out.push(`**${line(p.name)}:** ${dot(p.wants)}`, "");
  const verbs = d.loop.map(line).filter(Boolean);
  out.push("## Core loop", "", verbs.length ? `${verbs.join(" → ")} → again` : "_Not written yet._", "", `**Win:** ${dot(d.win)}`, "", `**Lose:** ${dot(d.lose)}`, "");
  out.push("## World", "", `**Hero:** ${dot(d.hero)}`, "", `**Goal:** ${dot(d.goal)}`, "", `**Obstacle:** ${dot(d.obstacle)}`, "", `**Setting:** ${dot(d.setting)}`, "", dot(d.intro), "");
  out.push("## Mechanics", "");
  const mechanics = d.mechanics.filter((m) => line(m.name) || line(m.rule));
  if (!mechanics.length) out.push("_Not written yet._", "");
  for (const m of mechanics) out.push(`**${line(m.name) || "Unnamed"}** (${line(m.controls) || "no controls yet"}): ${dot(m.rule)}`, "");
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** The levels, as user stories with checks and scenarios. */
export function toLevelStories(d: GameDesign, teamName: string): string {
  return toUserStories(asPlan(d), teamName).replace(/^# User stories for /m, "# Levels for ");
}
