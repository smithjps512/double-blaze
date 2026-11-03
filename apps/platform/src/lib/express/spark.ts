import "server-only";
import { callSparkStructured, isAnthropicConfigured } from "../anthropic";
import { GENRES, POWERUPS, cleanSpec, specFromDesign, type ExpressDesign, type GameSpec } from "./spec";

/**
 * Spark designs a game from a student's design: names, story lines, three
 * levels that get harder, enemy behaviors, a palette, and the X-ray that
 * shows the student which of their words became which part of the game.
 *
 * Structured output keeps it to the spec's shape, and cleanSpec clamps every
 * number and replaces anything odd with the rule build, so the engine only
 * ever sees data it can play. If Spark is not configured, takes too long, or
 * fails, the rule build is returned instead: a student always gets a game.
 */

const LIMIT_MS = 25_000;

const str = { type: "string" };
const int = { type: "integer" };
const o = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, properties, required: Object.keys(properties) });

const SCHEMA = o({
  title: str,
  tagline: str,
  palette: o({ sky: str, sky2: str, ground: str, accent: str }),
  hero: o({ name: str, emoji: str }),
  collectible: o({ name: str, plural: str, emoji: str }),
  enemies: { type: "array", items: o({ name: str, emoji: str, behavior: { type: "string", enum: ["patrol", "chase", "bounce", "fall"] } }) },
  powerup: o({ name: str, emoji: str, seconds: int }),
  story: o({ intro: str, win: str, lose: str }),
  levels: {
    type: "array",
    items: o({ name: str, intro: str, goal: int, enemies: int, enemySpeed: int, twist: { type: "string", enum: ["none", "low-gravity", "dark", "fast", "wind", "big-enemies"] } }),
  },
  xray: { type: "array", items: o({ theyWrote: str, weBuilt: str }) },
});

const SYSTEM = `You are Spark, the game designer at Trail Crew Studio. A sixth grader designed a video game in class today. Turn their design into a spec for our game engine.

Rules:
- Use their words. Their hero name, collectible, enemy, feeling and story should be recognizable everywhere. Make it feel like THEIR game, polished.
- Everything must be school appropriate and kind. No violence beyond cartoon "bonk", no scary gore, no real brands, people or places.
- Exactly 3 levels that get harder: level 1 easy (goal 6-10, 2-4 enemies, speed 2-4, twist "none"), level 2 medium (goal 10-14, 4-6 enemies, speed 4-6), level 3 hard (goal 14-20, 6-9 enemies, speed 6-8). Pick twists for levels 2 and 3 that fit their world (space suits low-gravity, a haunted place suits dark).
- If their "special idea" can be expressed with a twist, level name, story line or enemy behavior, do it and say so in the X-ray.
- Up to 3 enemies: the first is theirs; add 1 or 2 fun variants of it (for example "Speedy ghost"). Emojis only for emoji fields (one emoji each).
- Palette: 4 hex colors (#rrggbb) that fit their world. sky and sky2 are a background gradient, ground is platforms or walls, accent is for highlights. Keep enough contrast for emojis to show.
- Story lines are short (intro under 40 words, win and lose under 25), exciting, and use their hero's name. The lose line should echo their bad day if they wrote one.
- X-ray: 4 to 6 rows. theyWrote quotes or closely paraphrases something they wrote (their feeling, story, check, bad day, special idea, numbers). weBuilt says exactly what in the game came from it.
- powerup.seconds between 4 and 8.`;

export async function designGame(d: ExpressDesign): Promise<GameSpec> {
  if (!isAnthropicConfigured()) return specFromDesign(d);
  const genre = GENRES.find((g) => g.id === d.genre)?.name ?? d.genre;
  const power = POWERUPS.find((p) => p.id === d.powerup)?.name ?? d.powerup;
  const brief = [
    `Game name: ${d.gameName}`,
    `Studio: ${d.studio}`,
    `Genre: ${genre}`,
    `The feeling (the game's purpose): ${d.feeling}`,
    `Hero: ${d.heroName} ${d.heroEmoji}`,
    `World: ${d.setting}`,
    `Goal: ${d.goal}`,
    `Collects: ${d.collectName} ${d.collectEmoji}`,
    `In the way: ${d.enemyName} ${d.enemyEmoji}`,
    `Core loop: ${d.verbs.filter(Boolean).join(" -> ")}`,
    `Power-up: ${power}`,
    `Numbers they chose (keep them): speed ${d.speed}/10, jump ${d.jump}/10, lives ${d.lives}`,
    `Player story: As a player, I want to ${d.iWant}, so I can ${d.soThat}.`,
    `Their check (how we know it works): ${d.check}`,
    d.badWhen ? `Their bad day: Given ${d.badGiven}, when ${d.badWhen}, then ${d.badThen}.` : "",
    d.special ? `Special idea: ${d.special}` : "",
  ].filter(Boolean).join("\n");

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LIMIT_MS));
  const raw = await Promise.race([
    callSparkStructured<unknown>({ system: SYSTEM, messages: [{ role: "user", content: brief }], schema: SCHEMA, maxTokens: 1800 }).catch(() => null),
    timeout,
  ]);
  if (!raw) return specFromDesign(d);
  return cleanSpec({ ...(raw as object), builtBy: "spark" }, d);
}
