/**
 * Studio Express: design a game in one class, and watch it get built.
 *
 * Two shapes live here. The DESIGN is what a student writes: who they are,
 * the feeling, the hero, the world, the loop, the mechanics, one player
 * story with a check and a bad day. The SPEC is what the engine plays: plain
 * data with every number in range. Spark turns a design into a spec; when
 * Spark is not there, `specFromDesign` does it by rule, so no student is ever
 * left without a game.
 *
 * The spec is data, never code. The engine draws its text on a canvas, so
 * nothing a student or a model writes can run. `cleanSpec` clamps and
 * replaces anything out of range before a spec is stored or played.
 * No em dashes in any copy.
 */

export const GENRES = [
  { id: "platformer", name: "Platformer", blurb: "Run, jump and collect across a side-scrolling world.", emoji: "🏃" },
  { id: "topdown", name: "Top-down quest", blurb: "Explore a map from above, grab every item, dodge the bad guys.", emoji: "🗺️" },
  { id: "dodge", name: "Sky dodge", blurb: "Fly up through falling danger, collect as you go, survive.", emoji: "🚀" },
] as const;
export type Genre = (typeof GENRES)[number]["id"];

export const HEROES = ["🐸", "🤖", "🦊", "🐉", "👾", "🧙", "🐱", "🦖", "🐧", "🦄", "🥒", "⚽", "🐝", "🦈", "🧑‍🚀", "🐼"];
export const COLLECTIBLES = ["⭐", "💎", "🍕", "🪙", "🍩", "🥒", "🔋", "🌮", "🎵", "🍀", "⚽", "🧩"];
export const ENEMIES = ["👻", "🤖", "🦇", "🔥", "🐍", "🧟", "🌪️", "🦂", "👹", "🪨", "🛸", "🕷️"];
export const POWERUPS = [
  { id: "shield", name: "Shield", emoji: "🛡️", blurb: "Nothing can hurt you for a few seconds." },
  { id: "speed", name: "Speed boost", emoji: "⚡", blurb: "Move twice as fast for a few seconds." },
  { id: "magnet", name: "Magnet", emoji: "🧲", blurb: "Items fly to you." },
  { id: "double-jump", name: "Double jump", emoji: "🪽", blurb: "Jump again in the air." },
  { id: "slow-time", name: "Slow time", emoji: "⏳", blurb: "Everything else slows down." },
] as const;
export type Powerup = (typeof POWERUPS)[number]["id"];
export const SETTINGS = ["The school at night", "Outer space", "A jungle", "A volcano", "Under the sea", "A city rooftop", "A haunted castle", "A candy land", "A soccer stadium", "Somewhere else"];
export const FEELINGS = ["Brave", "Fast", "Clever", "Sneaky", "Epic", "Chill", "Spooky", "Silly", "Unstoppable", "Curious"];
export const BEHAVIORS = ["patrol", "chase", "bounce", "fall"] as const;
export type Behavior = (typeof BEHAVIORS)[number];
export const TWISTS = ["none", "low-gravity", "dark", "fast", "wind", "big-enemies"] as const;
export type Twist = (typeof TWISTS)[number];

/** What the student writes. Every field is a string or a small number, so it cleans simply. */
export interface ExpressDesign {
  period: number;
  initials: string;
  studio: string;
  gameName: string;
  genre: Genre;
  feeling: string;
  heroName: string;
  heroEmoji: string;
  setting: string;
  goal: string;
  collectName: string;
  collectEmoji: string;
  enemyName: string;
  enemyEmoji: string;
  verbs: string[];
  powerup: Powerup;
  speed: number;
  jump: number;
  lives: number;
  /** As a player, I want to ___ */
  iWant: string;
  /** so I can ___ */
  soThat: string;
  /** One check: how would we know it works? */
  check: string;
  badGiven: string;
  badWhen: string;
  badThen: string;
  /** Anything special: a twist, a boss, a rule. Spark reads it; the rule build ignores it. */
  special: string;
}

export interface SpecLevel {
  name: string;
  intro: string;
  /** How many collectibles to win the level. */
  goal: number;
  enemies: number;
  enemySpeed: number;
  twist: Twist;
}

export interface GameSpec {
  title: string;
  tagline: string;
  genre: Genre;
  palette: { sky: string; sky2: string; ground: string; accent: string };
  hero: { name: string; emoji: string };
  collectible: { name: string; plural: string; emoji: string };
  enemies: Array<{ name: string; emoji: string; behavior: Behavior }>;
  powerup: { name: string; emoji: string; effect: Powerup; seconds: number };
  stats: { speed: number; jump: number; lives: number };
  story: { intro: string; win: string; lose: string };
  levels: SpecLevel[];
  /** What the student wrote, next to what it became: shown in the game's X-ray. */
  xray: Array<{ theyWrote: string; weBuilt: string }>;
  /** "spark" or "rules": who designed this spec. */
  builtBy: "spark" | "rules";
}

/* ------------------------------------------------------------- cleaning */

const RUDE = /\b(sex|porn|nazi|kill(ing)?|f+u+c+k+|sh[i1]t|bitch|ass(hole)?|dick|damn|blood|gun|drugs?)\b/i;
const text = (raw: unknown, max: number, fallback = ""): string => {
  if (typeof raw !== "string") return fallback;
  const t = raw.replace(/[\u0000-\u001f\u007f<>]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  return t && !RUDE.test(t) ? t : fallback;
};
const num = (raw: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
};
const pick = <T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(raw as T) ? (raw as T) : fallback);
/** An emoji: short, with no letters or digits, so a model cannot sneak words onto the screen as sprites. */
const emoji = (raw: unknown, fallback: string): string =>
  typeof raw === "string" && raw.trim() && [...raw.trim()].length <= 4 && !/[\p{L}\p{N}<>]/u.test(raw) ? raw.trim() : fallback;
const hex = (raw: unknown, fallback: string): string => (typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback);
const obj = (raw: unknown) => (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

export function cleanDesign(raw: unknown): ExpressDesign {
  const o = obj(raw);
  return {
    period: num(o.period, 1, 7, 3),
    initials: text(o.initials, 3).toUpperCase().replace(/[^A-Z]/g, ""),
    studio: text(o.studio, 40),
    gameName: text(o.gameName, 50),
    genre: pick(o.genre, GENRES.map((g) => g.id), "platformer"),
    feeling: text(o.feeling, 80),
    heroName: text(o.heroName, 30),
    heroEmoji: emoji(o.heroEmoji, HEROES[0]),
    setting: text(o.setting, 80),
    goal: text(o.goal, 160),
    collectName: text(o.collectName, 30),
    collectEmoji: emoji(o.collectEmoji, COLLECTIBLES[0]),
    enemyName: text(o.enemyName, 30),
    enemyEmoji: emoji(o.enemyEmoji, ENEMIES[0]),
    verbs: (Array.isArray(o.verbs) ? o.verbs : []).slice(0, 4).map((v) => text(v, 20)),
    powerup: pick(o.powerup, POWERUPS.map((p) => p.id), "shield"),
    speed: num(o.speed, 1, 10, 5),
    jump: num(o.jump, 1, 10, 5),
    lives: num(o.lives, 1, 5, 3),
    iWant: text(o.iWant, 200),
    soThat: text(o.soThat, 200),
    check: text(o.check, 200),
    badGiven: text(o.badGiven, 200),
    badWhen: text(o.badWhen, 200),
    badThen: text(o.badThen, 200),
    special: text(o.special, 240),
  };
}

/** What a design needs before it can be built. Each item names the box to fill. */
export function designGaps(d: ExpressDesign): string[] {
  const gaps: string[] = [];
  if (!/^[A-Z]{2,3}$/.test(d.initials)) gaps.push("Your initials (2 or 3 letters)");
  if (d.studio.length < 2) gaps.push("Your studio name");
  if (d.gameName.length < 2) gaps.push("Your game's name");
  if (d.feeling.length < 2) gaps.push("The feeling");
  if (d.heroName.length < 2) gaps.push("Your hero's name");
  if (d.collectName.length < 2) gaps.push("What the hero collects");
  if (d.enemyName.length < 2) gaps.push("What is in the way");
  if (d.verbs.filter((v) => v.trim()).length < 3) gaps.push("3 verbs for the core loop");
  if (d.iWant.length < 3 || d.soThat.length < 3) gaps.push("Your player story (I want to... so I can...)");
  if (d.check.length < 3) gaps.push("One check: how would we know it works?");
  return gaps;
}

const PALETTES: Record<string, GameSpec["palette"]> = {
  night: { sky: "#0f1b3d", sky2: "#3b2a6b", ground: "#2d6a4f", accent: "#ffd166" },
  space: { sky: "#05051a", sky2: "#1b1446", ground: "#4a4e69", accent: "#7df9ff" },
  jungle: { sky: "#1b4332", sky2: "#52b788", ground: "#7f5539", accent: "#ffd60a" },
  volcano: { sky: "#370617", sky2: "#d00000", ground: "#3d2c2e", accent: "#ffba08" },
  sea: { sky: "#03045e", sky2: "#0096c7", ground: "#e9c46a", accent: "#90e0ef" },
  city: { sky: "#22223b", sky2: "#f28482", ground: "#4a4e69", accent: "#f6bd60" },
  castle: { sky: "#10002b", sky2: "#5a189a", ground: "#3c096c", accent: "#c77dff" },
  candy: { sky: "#ffafcc", sky2: "#a2d2ff", ground: "#cdb4db", accent: "#ff006e" },
  stadium: { sky: "#081c15", sky2: "#1b4332", ground: "#40916c", accent: "#ffffff" },
};

function paletteFor(setting: string): GameSpec["palette"] {
  const s = setting.toLowerCase();
  const key =
    /space|star|planet|moon/.test(s) ? "space" : /jungle|forest|tree/.test(s) ? "jungle" : /volcano|lava|fire/.test(s) ? "volcano"
    : /sea|ocean|water|beach/.test(s) ? "sea" : /city|roof|street/.test(s) ? "city" : /castle|haunt|ghost/.test(s) ? "castle"
    : /candy|sweet|cake/.test(s) ? "candy" : /stadium|soccer|field|sport/.test(s) ? "stadium" : "night";
  return PALETTES[key];
}

const plural = (s: string) => (/s$/i.test(s) ? s : /y$/i.test(s) && !/[aeiou]y$/i.test(s) ? `${s.slice(0, -1)}ies` : `${s}s`);

/**
 * The spec from rules alone: always works, instantly, from exactly what the
 * student chose. Used when Spark is not configured, slow, or says something
 * the cleaner throws away.
 */
export function specFromDesign(d: ExpressDesign): GameSpec {
  const power = POWERUPS.find((p) => p.id === d.powerup) ?? POWERUPS[0];
  const collect = d.collectName || "star";
  const enemy = d.enemyName || "ghost";
  const hero = d.heroName || "Hero";
  const behaviors: Behavior[] = d.genre === "dodge" ? ["fall", "bounce", "chase"] : d.genre === "topdown" ? ["patrol", "chase", "bounce"] : ["patrol", "bounce", "chase"];
  return {
    title: d.gameName || `${hero}'s Adventure`,
    tagline: `A ${(d.feeling || "fun").toLowerCase()} ${GENRES.find((g) => g.id === d.genre)?.name.toLowerCase()} by ${d.studio || "a new studio"}`,
    genre: d.genre,
    palette: paletteFor(d.setting),
    hero: { name: hero, emoji: d.heroEmoji },
    collectible: { name: collect, plural: plural(collect), emoji: d.collectEmoji },
    enemies: [
      { name: enemy, emoji: d.enemyEmoji, behavior: behaviors[0] },
      { name: `Fast ${enemy}`, emoji: d.enemyEmoji, behavior: behaviors[1] },
    ],
    powerup: { name: power.name, emoji: power.emoji, effect: power.id, seconds: 6 },
    stats: { speed: d.speed, jump: d.jump, lives: d.lives },
    story: {
      intro: `${hero} has to ${d.goal || `collect every ${collect}`}. Watch out for the ${plural(enemy)}!`,
      win: `${hero} did it! You feel ${(d.feeling || "awesome").toLowerCase()}.`,
      lose: d.badThen || `The ${plural(enemy)} got you. Try again!`,
    },
    levels: [
      { name: "Level 1: Warm up", intro: `Collect the ${plural(collect)}.`, goal: 8, enemies: 3, enemySpeed: 3, twist: "none" },
      { name: "Level 2: Trouble", intro: `More ${plural(enemy)}, and they are faster.`, goal: 12, enemies: 5, enemySpeed: 5, twist: d.genre === "platformer" ? "wind" : "fast" },
      { name: "Level 3: The big one", intro: "Everything you have learned. Go!", goal: 16, enemies: 7, enemySpeed: 7, twist: "big-enemies" },
    ],
    xray: [
      { theyWrote: `Hero: ${hero} ${d.heroEmoji}`, weBuilt: "The character you control" },
      { theyWrote: `Collect: ${collect}`, weBuilt: `${d.collectEmoji} pickups that fill the goal bar` },
      { theyWrote: `In the way: ${enemy}`, weBuilt: `${d.enemyEmoji} enemies that patrol, bounce and chase` },
      { theyWrote: `Speed ${d.speed}, jump ${d.jump}, lives ${d.lives}`, weBuilt: "The exact numbers the game runs on" },
      ...(d.iWant ? [{ theyWrote: `As a player, I want to ${d.iWant}`, weBuilt: "The goal of every level" }] : []),
      ...(d.badWhen ? [{ theyWrote: `Bad day: when ${d.badWhen}`, weBuilt: `What happens: ${d.badThen || "you lose a life"}` }] : []),
    ],
    builtBy: "rules",
  };
}

/**
 * Anything (Spark's answer, or a stored row) as a playable spec. Every field
 * falls back to the rule build for the same design, so a half-good answer
 * still plays and a bad one quietly becomes the rule build.
 */
export function cleanSpec(raw: unknown, d: ExpressDesign): GameSpec {
  const base = specFromDesign(d);
  const o = obj(raw);
  const pal = obj(o.palette);
  const hero = obj(o.hero);
  const col = obj(o.collectible);
  const pow = obj(o.powerup);
  const stats = obj(o.stats);
  const story = obj(o.story);
  const enemies = (Array.isArray(o.enemies) ? o.enemies : []).slice(0, 3).map((e, i) => {
    const r = obj(e);
    const b = base.enemies[i] ?? base.enemies[0];
    return { name: text(r.name, 30, b.name), emoji: emoji(r.emoji, b.emoji), behavior: pick(r.behavior, BEHAVIORS, b.behavior) };
  });
  const levels = (Array.isArray(o.levels) ? o.levels : []).slice(0, 3).map((l, i) => {
    const r = obj(l);
    const b = base.levels[i];
    return {
      name: text(r.name, 40, b.name),
      intro: text(r.intro, 140, b.intro),
      goal: num(r.goal, 5, 25, b.goal),
      enemies: num(r.enemies, 1, 10, b.enemies),
      enemySpeed: num(r.enemySpeed, 1, 10, b.enemySpeed),
      twist: pick(r.twist, TWISTS, b.twist),
    };
  });
  while (levels.length < 3) levels.push(base.levels[levels.length]);
  const xray = (Array.isArray(o.xray) ? o.xray : []).slice(0, 8).map((x) => ({ theyWrote: text(obj(x).theyWrote, 160), weBuilt: text(obj(x).weBuilt, 160) })).filter((x) => x.theyWrote && x.weBuilt);
  return {
    title: text(o.title, 50, base.title),
    tagline: text(o.tagline, 100, base.tagline),
    genre: d.genre,
    palette: { sky: hex(pal.sky, base.palette.sky), sky2: hex(pal.sky2, base.palette.sky2), ground: hex(pal.ground, base.palette.ground), accent: hex(pal.accent, base.palette.accent) },
    hero: { name: text(hero.name, 30, base.hero.name), emoji: emoji(hero.emoji, base.hero.emoji) },
    collectible: { name: text(col.name, 30, base.collectible.name), plural: text(col.plural, 32, base.collectible.plural), emoji: emoji(col.emoji, base.collectible.emoji) },
    enemies: enemies.length ? enemies : base.enemies,
    powerup: { name: text(pow.name, 30, base.powerup.name), emoji: emoji(pow.emoji, base.powerup.emoji), effect: d.powerup, seconds: num(pow.seconds, 3, 10, base.powerup.seconds) },
    // The student's own numbers win: they are the mechanics they designed.
    stats: { speed: d.speed, jump: d.jump, lives: d.lives || num(stats.lives, 1, 5, 3) },
    story: { intro: text(story.intro, 280, base.story.intro), win: text(story.win, 200, base.story.win), lose: text(story.lose, 200, base.story.lose) },
    levels,
    xray: xray.length >= 3 ? xray : base.xray,
    builtBy: o.builtBy === "spark" ? "spark" : "rules",
  };
}
