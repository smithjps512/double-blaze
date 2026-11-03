/**
 * The Studio Express game engine: a GameSpec in, a playable canvas game out.
 *
 * Three genres (platformer, top-down quest, sky dodge), all drawn with
 * emojis as sprites. Everything a spec says is data: text is drawn with
 * fillText and nothing from a spec is ever run. Levels are generated from a
 * seeded random number generator, so the same game plays the same way every
 * time, and every number is clamped so a strange spec still plays.
 *
 * No React here. GamePlayer.tsx owns the canvas, the keyboard and the touch
 * buttons, and calls into this class. No em dashes in any copy.
 */

import type { GameSpec, Twist } from "./spec";

/* ------------------------------------------------------------ pure helpers */

/** A small, stable string hash (FNV-1a). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny seeded random number generator, 0 <= n < 1. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const W = 960;
export const H = 540;
export const GROUND_Y = 470;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clampNum = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : d);

/** Physics numbers from the student's own stats. */
export function physics(stats: { speed: number; jump: number }, twist: Twist) {
  const speed = clampNum(stats.speed, 1, 10, 5);
  const jump = clampNum(stats.jump, 1, 10, 5);
  const gravity = twist === "low-gravity" ? 1000 : 1800;
  return {
    run: 180 + speed * 22,
    jumpV: 560 + jump * 30,
    gravity,
    /** Top-down and dodge movement speed. */
    move: 150 + speed * 17,
  };
}

export interface PlatformerLevel {
  length: number;
  ground: Rect[];
  ledges: Rect[];
  items: Array<{ x: number; y: number }>;
  enemies: Array<{ x: number; y: number; minX: number; maxX: number }>;
  powerups: Array<{ x: number; y: number }>;
}

/**
 * A side-scrolling level: ground segments with gaps every hero can clear
 * (the widest gap is 60% of the hero's real jump distance), ledges to reach
 * extra items, and enemies on the ground past the start.
 */
export function generatePlatformer(seed: number, levelIndex: number, goal: number, enemyCount: number, stats: { speed: number; jump: number }, twist: Twist): PlatformerLevel {
  const r = rng(seed);
  const ph = physics(stats, twist);
  const airTime = (2 * ph.jumpV) / ph.gravity;
  const maxGap = Math.max(60, Math.min(170, 0.6 * ph.run * airTime));
  const jumpHeight = (ph.jumpV * ph.jumpV) / (2 * ph.gravity);
  const ledgeLift = clamp(jumpHeight * 0.65, 70, 170);
  const items = Math.max(goal + 5, 8);
  const length = 2400 + levelIndex * 800 + items * 40;
  const ground: Rect[] = [];
  let x = 0;
  // A safe start, then segments and gaps.
  ground.push({ x: 0, y: GROUND_Y, w: 520, h: H - GROUND_Y });
  x = 520;
  while (x < length - 400) {
    const gap = 70 + r() * (maxGap - 70);
    x += gap;
    const seg = 260 + r() * 360;
    ground.push({ x, y: GROUND_Y, w: seg, h: H - GROUND_Y });
    x += seg;
  }
  ground.push({ x, y: GROUND_Y, w: 600, h: H - GROUND_Y });
  const end = x + 600;

  const ledges: Rect[] = [];
  for (const g of ground.slice(1)) {
    if (r() < 0.6 && g.w > 300) {
      const lw = 110 + r() * 80;
      ledges.push({ x: g.x + 40 + r() * (g.w - lw - 80), y: GROUND_Y - ledgeLift, w: lw, h: 18 });
    }
  }

  const spots: Array<{ x: number; y: number }> = [];
  for (const g of ground) {
    for (let px = g.x + 70; px < g.x + g.w - 40; px += 90) spots.push({ x: px, y: GROUND_Y - 34 });
  }
  for (const l of ledges) spots.push({ x: l.x + l.w / 2, y: l.y - 34 });
  // Spread items through the whole level, not bunched at the start.
  const itemList: Array<{ x: number; y: number }> = [];
  const usable = spots.filter((s) => s.x > 260);
  for (let i = 0; i < items && usable.length; i++) {
    const idx = Math.floor(((i + r() * 0.8) / items) * usable.length);
    const s = usable.splice(Math.min(idx, usable.length - 1), 1)[0];
    itemList.push(s);
  }

  const enemies: PlatformerLevel["enemies"] = [];
  const segs = ground.slice(1, -1).filter((g) => g.w > 200);
  for (let i = 0; i < enemyCount && segs.length; i++) {
    const g = segs[Math.floor(r() * segs.length)];
    const ex = g.x + 60 + r() * (g.w - 120);
    enemies.push({ x: ex, y: GROUND_Y - 34, minX: g.x + 10, maxX: g.x + g.w - 10 });
  }

  const powerups = [0.35, 0.7].map((f) => {
    const s = spots[Math.floor(f * spots.length)] ?? { x: 600, y: GROUND_Y - 34 };
    return { x: s.x, y: s.y - 60 };
  });

  return { length: end, ground, ledges, items: itemList, enemies, powerups };
}

export interface TopdownLevel {
  cols: number;
  rows: number;
  tile: number;
  walls: boolean[];
  spawn: { c: number; r: number };
  items: Array<{ c: number; r: number }>;
  enemies: Array<{ c: number; r: number }>;
  powerups: Array<{ c: number; r: number }>;
  exit: { c: number; r: number };
}

/**
 * A top-down map: a border, scattered wall blocks, and items only on cells
 * the hero can actually reach (checked with a flood fill from the spawn).
 */
export function generateTopdown(seed: number, levelIndex: number, goal: number, enemyCount: number): TopdownLevel {
  const r = rng(seed);
  const tile = 40;
  const cols = 24;
  const rows = 13;
  const walls: boolean[] = new Array(cols * rows).fill(false);
  const at = (c: number, rr: number) => rr * cols + c;
  for (let c = 0; c < cols; c++) {
    walls[at(c, 0)] = true;
    walls[at(c, rows - 1)] = true;
  }
  for (let rr = 0; rr < rows; rr++) {
    walls[at(0, rr)] = true;
    walls[at(cols - 1, rr)] = true;
  }
  const spawn = { c: 2, r: Math.floor(rows / 2) };
  const density = 0.1 + levelIndex * 0.025;
  for (let rr = 1; rr < rows - 1; rr++) {
    for (let c = 1; c < cols - 1; c++) {
      if (Math.abs(c - spawn.c) + Math.abs(rr - spawn.r) <= 2) continue;
      if (r() < density) walls[at(c, rr)] = true;
    }
  }
  // Flood fill from the spawn: everything placed must be reachable.
  const seen = new Set<number>();
  const queue = [at(spawn.c, spawn.r)];
  seen.add(queue[0]);
  while (queue.length) {
    const i = queue.shift()!;
    const c = i % cols;
    const rr = Math.floor(i / cols);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = at(c + dc, rr + dr);
      if (c + dc < 0 || c + dc >= cols || rr + dr < 0 || rr + dr >= rows) continue;
      if (!walls[n] && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  // Wall off unreachable pockets so nothing spawns in them.
  for (let i = 0; i < walls.length; i++) if (!walls[i] && !seen.has(i)) walls[i] = true;
  const open = [...seen].map((i) => ({ c: i % cols, r: Math.floor(i / cols) }));
  const far = (p: { c: number; r: number }, d: number) => Math.abs(p.c - spawn.c) + Math.abs(p.r - spawn.r) >= d;
  const take = (pool: Array<{ c: number; r: number }>) => pool.splice(Math.floor(r() * pool.length), 1)[0];
  const pool = open.filter((p) => far(p, 2));
  const items: TopdownLevel["items"] = [];
  for (let i = 0; i < goal + 3 && pool.length; i++) items.push(take(pool));
  const enemyPool = pool.filter((p) => far(p, 7));
  const enemies: TopdownLevel["enemies"] = [];
  for (let i = 0; i < enemyCount && enemyPool.length; i++) enemies.push(take(enemyPool));
  const powerups: TopdownLevel["powerups"] = [];
  for (let i = 0; i < 2 && pool.length; i++) powerups.push(take(pool));
  const exitPool = open.filter((p) => far(p, 14));
  const exit = exitPool.length ? exitPool[Math.floor(r() * exitPool.length)] : open[open.length - 1];
  return { cols, rows, tile, walls, spawn, items, enemies, powerups, exit };
}

/* ------------------------------------------------------------------ engine */

export type Key = "left" | "right" | "up" | "down" | "action";
export type Phase = "title" | "intro" | "play" | "cleared" | "win" | "lose";

interface Body extends Rect {
  vx: number;
  vy: number;
}
interface Enemy extends Body {
  emoji: string;
  behavior: "patrol" | "chase" | "bounce" | "fall";
  minX: number;
  maxX: number;
  t: number;
  homeY: number;
  /** Stomped: gone for the rest of the level. */
  dead?: boolean;
}
interface Pickup extends Rect {
  kind: "item" | "power";
  taken: boolean;
  bob: number;
  vy: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface EngineSnapshot {
  phase: Phase;
  level: number;
  collected: number;
  goal: number;
  lives: number;
  score: number;
  paused: boolean;
}

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
const UI_FONT = 'Sora, Inter, system-ui, sans-serif';

export class ExpressGame {
  private ctx: CanvasRenderingContext2D;
  private spec: GameSpec;
  private seed: number;
  private raf = 0;
  private last = 0;
  private keys: Record<Key, boolean> = { left: false, right: false, up: false, down: false, action: false };
  private actionEdge = false;
  private cache = new Map<string, HTMLCanvasElement>();
  private audio: AudioContext | null = null;
  private sound = false;
  private onChange?: (s: EngineSnapshot) => void;

  phase: Phase = "title";
  paused = false;
  private levelIndex = 0;
  private lives = 3;
  private collected = 0;
  private score = 0;
  private phaseTime = 0;
  private time = 0;

  // world
  private hero: Body = { x: 0, y: 0, w: 34, h: 34, vx: 0, vy: 0 };
  private onGround = false;
  private jumpsLeft = 1;
  private facing = 1;
  private inv = 0;
  private power = 0;
  private dashTime = 0;
  private dashCool = 0;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private particles: Particle[] = [];
  private shake = 0;
  private camX = 0;
  private plat: PlatformerLevel | null = null;
  private checkpoint = { x: 80, y: GROUND_Y - 40 };
  private top: TopdownLevel | null = null;
  private exitOpen = false;
  private spawnTimer = 0;
  private itemTimer = 0;
  private scroll = 0;
  private stars: Array<{ x: number; y: number; z: number; s: number }> = [];
  private dodgePowerAt: number[] = [];
  private toast = "";
  private toastTime = 0;

  constructor(canvas: HTMLCanvasElement, spec: GameSpec, opts: { onChange?: (s: EngineSnapshot) => void } = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    this.ctx = ctx;
    this.spec = spec;
    this.seed = hashString(`${spec.title}|${spec.genre}`);
    this.onChange = opts.onChange;
    this.lives = clampNum(spec.stats?.lives, 1, 5, 3);
    const r = rng(this.seed ^ 0x9e3779b9);
    for (let i = 0; i < 70; i++) this.stars.push({ x: r() * W, y: r() * H, z: 0.2 + r() * 0.8, s: 1 + r() * 2.2 });
    this.resize(canvas);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.emit();
  }

  /** Match the canvas backing store to its displayed size, for crisp drawing on any screen. */
  resize(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || W;
    const cssH = (cssW * H) / W;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform((cssW * dpr) / W, 0, 0, (cssH * dpr) / H, 0, 0);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.cache.clear();
    void this.audio?.close().catch(() => undefined);
    this.audio = null;
  }

  setKey(key: Key, down: boolean) {
    if (key === "action" && down && !this.keys.action) this.actionEdge = true;
    this.keys[key] = down;
  }

  /** Start, skip a card, or restart: what Space or a tap does outside of play. */
  press() {
    if (this.paused) return this.togglePause();
    if (this.phase === "title") return this.startLevel(0, true);
    if (this.phase === "intro") return this.go("play");
    if (this.phase === "win" || this.phase === "lose") return this.startLevel(0, true);
    if (this.phase === "cleared") return this.nextLevel();
  }

  setSound(on: boolean) {
    this.sound = on;
    if (on && !this.audio) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audio = new Ctx();
      } catch {
        this.audio = null;
      }
    }
  }

  togglePause() {
    if (this.phase !== "play") return;
    this.paused = !this.paused;
    this.emit();
  }

  private onVisibility = () => {
    if (document.visibilityState === "hidden" && this.phase === "play" && !this.paused) {
      this.paused = true;
      this.emit();
    }
  };

  snapshot(): EngineSnapshot {
    const lvl = this.spec.levels[this.levelIndex];
    return { phase: this.phase, level: this.levelIndex + 1, collected: this.collected, goal: lvl?.goal ?? 0, lives: this.lives, score: this.score, paused: this.paused };
  }

  private emit() {
    this.onChange?.(this.snapshot());
  }

  private go(phase: Phase) {
    this.phase = phase;
    this.phaseTime = 0;
    this.emit();
  }

  /* -------------------------------------------------------------- levels */

  private get level() {
    return this.spec.levels[this.levelIndex] ?? this.spec.levels[0];
  }

  private enemySpeed() {
    const base = 40 + clampNum(this.level.enemySpeed, 1, 10, 4) * 14;
    const fast = this.level.twist === "fast" ? 1.5 : 1;
    const slow = this.power > 0 && this.spec.powerup.effect === "slow-time" ? 0.4 : 1;
    return base * fast * slow;
  }

  private enemySize() {
    return this.level.twist === "big-enemies" ? 54 : 34;
  }

  private startLevel(index: number, fresh: boolean) {
    if (fresh) {
      this.lives = clampNum(this.spec.stats?.lives, 1, 5, 3);
      this.score = 0;
    }
    this.levelIndex = index;
    this.collected = 0;
    this.power = 0;
    this.inv = 0;
    this.particles = [];
    this.enemies = [];
    this.pickups = [];
    this.exitOpen = false;
    this.camX = 0;
    this.scroll = 0;
    this.spawnTimer = 1.2;
    this.itemTimer = 0.4;
    const lvl = this.level;
    const goal = clampNum(lvl.goal, 1, 40, 8);
    const count = clampNum(lvl.enemies, 0, 14, 3);
    const seed = this.seed + index * 7919;
    const size = this.enemySize();
    const emojiFor = (i: number) => this.spec.enemies[i % Math.max(1, this.spec.enemies.length)] ?? { emoji: "👻", behavior: "patrol" as const, name: "ghost" };

    if (this.spec.genre === "platformer") {
      const p = generatePlatformer(seed, index, goal, count, this.spec.stats, lvl.twist);
      this.plat = p;
      this.hero = { x: 80, y: GROUND_Y - 40, w: 30, h: 34, vx: 0, vy: 0 };
      this.checkpoint = { x: 80, y: GROUND_Y - 40 };
      this.pickups = p.items.map((it, i) => ({ x: it.x - 14, y: it.y - 14, w: 28, h: 28, kind: "item", taken: false, bob: i, vy: 0 }));
      p.powerups.forEach((pw, i) => this.pickups.push({ x: pw.x - 16, y: pw.y - 16, w: 32, h: 32, kind: "power", taken: false, bob: i * 2, vy: 0 }));
      this.enemies = p.enemies.map((e, i) => {
        const def = emojiFor(i);
        const behavior = def.behavior;
        return {
          x: e.x, y: behavior === "fall" ? -60 - i * 90 : GROUND_Y - size, w: size * 0.72, h: size * 0.72,
          vx: (i % 2 ? 1 : -1), vy: 0, emoji: def.emoji, behavior, minX: e.minX, maxX: e.maxX, t: i * 0.7, homeY: GROUND_Y - size,
        };
      });
    } else if (this.spec.genre === "topdown") {
      const t = generateTopdown(seed, index, goal, count);
      this.top = t;
      const cx = (c: number) => c * t.tile + t.tile / 2;
      const cy = (r: number) => r * t.tile + t.tile / 2 + 10;
      this.hero = { x: cx(t.spawn.c) - 14, y: cy(t.spawn.r) - 14, w: 28, h: 28, vx: 0, vy: 0 };
      this.pickups = t.items.map((it, i) => ({ x: cx(it.c) - 13, y: cy(it.r) - 13, w: 26, h: 26, kind: "item", taken: false, bob: i, vy: 0 }));
      t.powerups.forEach((pw, i) => this.pickups.push({ x: cx(pw.c) - 15, y: cy(pw.r) - 15, w: 30, h: 30, kind: "power", taken: false, bob: i * 2, vy: 0 }));
      const r = rng(seed + 1);
      this.enemies = t.enemies.map((e, i) => {
        const def = emojiFor(i);
        const a = r() * Math.PI * 2;
        const s = Math.min(size * 0.72, 30);
        return {
          x: cx(e.c) - s / 2, y: cy(e.r) - s / 2, w: s, h: s, vx: Math.cos(a), vy: Math.sin(a), emoji: def.emoji,
          behavior: def.behavior === "fall" ? "bounce" : def.behavior, minX: 0, maxX: 0, t: i, homeY: 0,
        };
      });
    } else {
      this.hero = { x: W / 2 - 16, y: H - 110, w: 30, h: 30, vx: 0, vy: 0 };
      const total = 28 + index * 6;
      this.dodgePowerAt = [total * 0.3, total * 0.65];
    }
    this.go("intro");
  }

  private nextLevel() {
    if (this.levelIndex + 1 >= this.spec.levels.length) {
      this.score += this.lives * 500;
      this.beep(880, 0.25);
      return this.go("win");
    }
    this.startLevel(this.levelIndex + 1, false);
  }

  /* ---------------------------------------------------------------- loop */

  private loop = (now: number) => {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) {
      this.time += dt;
      this.phaseTime += dt;
      if (this.phase === "play") this.update(dt);
      else this.updateParticles(dt);
      if (this.phase === "intro" && this.phaseTime > 2.6) this.go("play");
      if (this.phase === "cleared" && this.phaseTime > 1.6) this.nextLevel();
    }
    this.draw();
    this.actionEdge = false;
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.inv > 0) this.inv -= dt;
    if (this.power > 0) {
      this.power -= dt;
      if (this.power <= 0) this.emit();
    }
    if (this.toastTime > 0) this.toastTime -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
    if (this.dashCool > 0) this.dashCool -= dt;
    if (this.dashTime > 0) this.dashTime -= dt;
    if (this.spec.genre === "platformer") this.updatePlatformer(dt);
    else if (this.spec.genre === "topdown") this.updateTopdown(dt);
    else this.updateDodge(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
  }

  private powerOn(effect: string) {
    return this.power > 0 && this.spec.powerup.effect === effect;
  }

  private moveSpeed(base: number) {
    return base * (this.powerOn("speed") ? 1.8 : 1) * (this.dashTime > 0 ? 2.6 : 1);
  }

  private wind() {
    return this.level.twist === "wind" ? Math.sin(this.time * 0.8) * 90 : 0;
  }

  private updatePlatformer(dt: number) {
    const p = this.plat!;
    const ph = physics(this.spec.stats, this.level.twist);
    const h = this.hero;
    const dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    if (dir) this.facing = dir;
    const target = dir * this.moveSpeed(ph.run);
    h.vx += (target - h.vx) * Math.min(1, dt * 12);
    h.vx += this.wind() * dt * 3;
    const wantsJump = this.actionEdge || ((this.keys.up) && this.onGround);
    if (wantsJump || (this.actionEdge && this.jumpsLeft > 0)) {
      if (this.onGround) {
        h.vy = -ph.jumpV;
        this.onGround = false;
        this.jumpsLeft = this.powerOn("double-jump") ? 1 : 0;
        this.beep(520, 0.06);
      } else if (this.actionEdge && this.jumpsLeft > 0) {
        h.vy = -ph.jumpV * 0.9;
        this.jumpsLeft--;
        this.burst(h.x + h.w / 2, h.y + h.h, "#ffffff", 8);
        this.beep(660, 0.06);
      }
    }
    // Let go early for a shorter hop.
    if (!this.keys.action && !this.keys.up && h.vy < -200) h.vy += ph.gravity * dt * 0.9;
    h.vy = Math.min(h.vy + ph.gravity * dt, 1200);

    h.x = clamp(h.x + h.vx * dt, 0, p.length - h.w);
    const prevBottom = h.y + h.h;
    h.y += h.vy * dt;
    this.onGround = false;
    for (const s of [...p.ground, ...p.ledges]) {
      if (h.x + h.w > s.x + 4 && h.x < s.x + s.w - 4 && prevBottom <= s.y + 2 && h.y + h.h >= s.y && h.vy >= 0) {
        h.y = s.y - h.h;
        h.vy = 0;
        this.onGround = true;
        this.jumpsLeft = this.powerOn("double-jump") ? 1 : 0;
        if (s.y === GROUND_Y) this.checkpoint = { x: clamp(h.x, s.x + 10, s.x + s.w - 40), y: s.y - h.h - 4 };
      }
    }
    if (h.y > H + 60) {
      this.hurt(true);
      h.x = this.checkpoint.x;
      h.y = this.checkpoint.y - 20;
      h.vx = 0;
      h.vy = 0;
    }
    this.camX += (clamp(h.x - 320, 0, p.length - W) - this.camX) * Math.min(1, dt * 6);

    const sp = this.enemySpeed();
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.t += dt;
      if (e.behavior === "patrol") {
        e.x += e.vx * sp * dt;
        if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
      } else if (e.behavior === "bounce") {
        e.x += e.vx * sp * 0.7 * dt;
        if (e.x < e.minX || e.x + e.w > e.maxX) e.vx *= -1;
        e.y = e.homeY + 34 - e.h - Math.abs(Math.sin(e.t * 2.6)) * 120;
      } else if (e.behavior === "chase") {
        const dx = h.x - e.x;
        if (Math.abs(dx) < 340) e.x += Math.sign(dx) * sp * 0.9 * dt;
        e.x = clamp(e.x, e.minX, e.maxX - e.w);
      } else {
        e.y += sp * 1.3 * dt;
        if (e.y > H + 40) {
          e.y = -60;
          e.x = this.camX + 200 + ((e.t * 997) % (W - 300));
        }
      }
      this.touchEnemy(e);
    }
  }

  private solidAt(px: number, py: number) {
    const t = this.top!;
    const c = Math.floor(px / t.tile);
    const r = Math.floor((py - 10) / t.tile);
    if (c < 0 || r < 0 || c >= t.cols || r >= t.rows) return true;
    return t.walls[r * t.cols + c];
  }

  private boxHitsWall(b: Rect) {
    return (
      this.solidAt(b.x + 1, b.y + 1) || this.solidAt(b.x + b.w - 1, b.y + 1) || this.solidAt(b.x + 1, b.y + b.h - 1) || this.solidAt(b.x + b.w - 1, b.y + b.h - 1)
    );
  }

  /** Move a box with wall collision, one axis at a time, so it slides along walls. */
  private slide(b: Body, dx: number, dy: number) {
    const ox = b.x;
    b.x += dx;
    let hitX = false;
    if (this.boxHitsWall(b)) {
      b.x = ox;
      hitX = true;
    }
    const oy = b.y;
    b.y += dy;
    let hitY = false;
    if (this.boxHitsWall(b)) {
      b.y = oy;
      hitY = true;
    }
    return { hitX, hitY };
  }

  private dashInput() {
    if (this.powerOn("double-jump") && this.actionEdge && this.dashCool <= 0) {
      this.dashTime = 0.22;
      this.dashCool = 0.6;
      this.burst(this.hero.x + this.hero.w / 2, this.hero.y + this.hero.h / 2, "#ffffff", 10);
      this.beep(700, 0.05);
    }
  }

  private updateTopdown(dt: number) {
    const t = this.top!;
    const h = this.hero;
    const ph = physics(this.spec.stats, this.level.twist);
    this.dashInput();
    let dx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    let dy = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    if (dx && dy) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    if (dx) this.facing = Math.sign(dx);
    const v = this.moveSpeed(ph.move);
    this.slide(h, dx * v * dt + this.wind() * dt * 0.5, dy * v * dt);
    const sp = this.enemySpeed() * 0.85;
    for (const e of this.enemies) {
      e.t += dt;
      let mx = e.vx;
      let my = e.vy;
      if (e.behavior === "chase") {
        const ddx = h.x - e.x;
        const ddy = h.y - e.y;
        const d = Math.hypot(ddx, ddy);
        if (d < 260 && d > 1) {
          mx = ddx / d;
          my = ddy / d;
        }
      } else if (e.behavior === "patrol") {
        // Patrol in straight lines: horizontal or vertical only.
        if (Math.abs(mx) > Math.abs(my)) my = 0;
        else mx = 0;
        const m = Math.hypot(mx, my) || 1;
        mx /= m;
        my /= m;
      }
      const hit = this.slide(e, mx * sp * dt, my * sp * dt);
      if (e.behavior !== "chase") {
        if (hit.hitX) e.vx = -e.vx;
        if (hit.hitY) e.vy = -e.vy;
        if (e.behavior === "patrol" && (hit.hitX || hit.hitY) && Math.random() < 0.3) {
          const tmp = e.vx;
          e.vx = e.vy;
          e.vy = tmp;
        }
      }
      this.touchEnemy(e);
    }
    if (this.exitOpen) {
      const ex = { x: t.exit.c * t.tile + 4, y: t.exit.r * t.tile + 14, w: t.tile - 8, h: t.tile - 8 };
      if (overlaps(h, ex)) this.clearLevel();
    }
  }

  private updateDodge(dt: number) {
    const h = this.hero;
    const ph = physics(this.spec.stats, this.level.twist);
    this.dashInput();
    let dx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    let dy = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    if (dx && dy) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    if (dx) this.facing = Math.sign(dx);
    const v = this.moveSpeed(ph.move);
    h.x = clamp(h.x + (dx * v + this.wind() * 0.6) * dt, 8, W - h.w - 8);
    h.y = clamp(h.y + dy * v * dt, 210, H - h.h - 10);
    const fallSpeed = 90 + this.level.enemySpeed * 18;
    this.scroll += dt * (fallSpeed * 0.6);
    const count = clampNum(this.level.enemies, 0, 14, 3);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.32, 2.4 - count * 0.2) * (0.7 + Math.random() * 0.6);
      const def = this.spec.enemies[Math.floor(Math.random() * this.spec.enemies.length)] ?? { emoji: "🪨", behavior: "fall" as const };
      const s = this.enemySize() * 0.75;
      this.enemies.push({
        x: 20 + Math.random() * (W - 60), y: -50, w: s, h: s, vx: Math.random() < 0.5 ? -1 : 1, vy: 1, emoji: def.emoji,
        behavior: def.behavior, minX: 0, maxX: W, t: 0, homeY: 0,
      });
    }
    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.itemTimer = 0.75 + Math.random() * 0.5;
      this.pickups.push({ x: 30 + Math.random() * (W - 80), y: -30, w: 28, h: 28, kind: "item", taken: false, bob: Math.random() * 6, vy: 80 + Math.random() * 40 });
    }
    if (this.dodgePowerAt.length && this.phaseTime > this.dodgePowerAt[0]) {
      this.dodgePowerAt.shift();
      this.pickups.push({ x: 60 + Math.random() * (W - 140), y: -30, w: 32, h: 32, kind: "power", taken: false, bob: 0, vy: 70 });
    }
    const sp = this.enemySpeed();
    for (const e of this.enemies) {
      e.t += dt;
      if (e.behavior === "bounce") {
        e.x += e.vx * sp * 0.8 * dt;
        if (e.x < 0 || e.x + e.w > W) e.vx *= -1;
        e.y += sp * 0.9 * dt;
      } else if (e.behavior === "chase") {
        e.x += Math.sign(h.x - e.x) * sp * 0.45 * dt;
        e.y += sp * 0.85 * dt;
      } else if (e.behavior === "patrol") {
        e.x += Math.sin(e.t * 2) * sp * 0.9 * dt;
        e.y += sp * 0.9 * dt;
      } else {
        e.y += sp * 1.15 * dt;
      }
      this.touchEnemy(e);
    }
    this.enemies = this.enemies.filter((e) => e.y < H + 60);
    this.pickups = this.pickups.filter((p) => p.y < H + 40 && !p.taken);
  }

  private touchEnemy(e: Enemy) {
    const pad = e.w * 0.15;
    const hb = { x: e.x + pad, y: e.y + pad, w: e.w - pad * 2, h: e.h - pad * 2 };
    if (overlaps(this.hero, hb)) {
      // Stomp: landing on a platformer enemy from above knocks it away.
      if (this.spec.genre === "platformer" && this.hero.vy > 120 && this.hero.y + this.hero.h < e.y + e.h * 0.55) {
        this.hero.vy = -physics(this.spec.stats, this.level.twist).jumpV * 0.6;
        this.burst(e.x + e.w / 2, e.y + e.h / 2, this.spec.palette.accent, 14);
        e.dead = true;
        this.score += 150;
        this.beep(300, 0.08);
        return;
      }
      this.hurt(false);
    }
  }

  private hurt(fell: boolean) {
    if (this.inv > 0 || (!fell && this.powerOn("shield"))) return;
    this.lives -= 1;
    this.inv = 1.6;
    this.shake = 10;
    this.burst(this.hero.x + this.hero.w / 2, this.hero.y + this.hero.h / 2, "#ff4d6d", 18);
    this.beep(140, 0.18);
    this.emit();
    if (this.lives <= 0) this.go("lose");
  }

  private updatePickups(dt: number) {
    const h = this.hero;
    const magnet = this.powerOn("magnet");
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.bob += dt * 3;
      if (p.vy) p.y += p.vy * dt;
      if (magnet && p.kind === "item") {
        const dx = h.x - p.x;
        const dy = h.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 260 && d > 1) {
          p.x += (dx / d) * 420 * dt;
          p.y += (dy / d) * 420 * dt;
        }
      }
      if (overlaps(h, { x: p.x + 3, y: p.y + 3, w: p.w - 6, h: p.h - 6 })) {
        p.taken = true;
        if (p.kind === "item") {
          this.collected += 1;
          this.score += 100;
          this.burst(p.x + p.w / 2, p.y + p.h / 2, this.spec.palette.accent, 12);
          this.beep(880 + this.collected * 12, 0.05);
          this.emit();
          if (this.collected >= clampNum(this.level.goal, 1, 40, 8)) {
            if (this.spec.genre === "topdown") {
              if (!this.exitOpen) {
                this.exitOpen = true;
                this.flash("The exit is open! Find the portal.");
              }
            } else this.clearLevel();
          }
        } else {
          this.power = clampNum(this.spec.powerup.seconds, 2, 12, 6);
          this.burst(p.x + p.w / 2, p.y + p.h / 2, "#7df9ff", 22);
          this.flash(`${this.spec.powerup.name}!`);
          this.beep(990, 0.12);
          this.emit();
        }
      }
    }
  }

  private clearLevel() {
    if (this.phase !== "play") return;
    this.score += 250;
    for (let i = 0; i < 4; i++) this.burst(W / 2 + (i - 1.5) * 160, H / 2, this.spec.palette.accent, 16);
    this.beep(1046, 0.2);
    this.go("cleared");
  }

  private flash(text: string) {
    this.toast = text;
    this.toastTime = 1.8;
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 240;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.6 + Math.random() * 0.4, max: 1, color, size: 2 + Math.random() * 4 });
    }
    if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private beep(freq: number, dur: number) {
    if (!this.sound || !this.audio) return;
    try {
      const a = this.audio;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.05, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur + 0.02);
    } catch {
      /* sound is a bonus */
    }
  }

  /* ---------------------------------------------------------------- draw */

  /** Emojis drawn once to an offscreen canvas, then stamped: far faster than fillText every frame. */
  private sprite(emoji: string, size: number): HTMLCanvasElement {
    const key = `${emoji}|${Math.round(size)}`;
    let c = this.cache.get(key);
    if (!c) {
      c = document.createElement("canvas");
      const s = Math.ceil(size * 1.4);
      c.width = s * 2;
      c.height = s * 2;
      const g = c.getContext("2d")!;
      g.scale(2, 2);
      g.font = `${size}px ${EMOJI_FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(emoji, s / 2, s / 2 + size * 0.06);
      this.cache.set(key, c);
    }
    return c;
  }

  private drawEmoji(emoji: string, x: number, y: number, size: number, flip = false) {
    const c = this.sprite(emoji, size);
    const s = c.width / 2;
    const ctx = this.ctx;
    if (flip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(c, -s / 2, -s / 2, s, s);
      ctx.restore();
    } else ctx.drawImage(c, x - s / 2, y - s / 2, s, s);
  }

  private text(t: string, x: number, y: number, size: number, color = "#fff", align: CanvasTextAlign = "center", weight = 700, maxWidth?: number) {
    const ctx = this.ctx;
    ctx.font = `${weight} ${size}px ${UI_FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillText(t, x + 2, y + 2, maxWidth);
    ctx.fillStyle = color;
    ctx.fillText(t, x, y, maxWidth);
  }

  /** Word-wrap for the story cards. */
  private wrap(t: string, x: number, y: number, size: number, width: number, color = "#fff", lineGap = 1.35) {
    const ctx = this.ctx;
    ctx.font = `600 ${size}px ${UI_FONT}`;
    const words = t.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > width && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 5).forEach((l, i) => this.text(l, x, y + i * size * lineGap, size, color, "center", 600));
    return lines.length;
  }

  private draw() {
    const ctx = this.ctx;
    const pal = this.spec.palette;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky);
    g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // Parallax stars and shapes.
    const camX = this.spec.genre === "platformer" ? this.camX : 0;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (const s of this.stars) {
      const sx = (((s.x - camX * s.z * 0.3) % W) + W) % W;
      const sy = this.spec.genre === "dodge" ? (s.y + this.scroll * s.z * 1.5) % H : s.y * 0.75;
      ctx.globalAlpha = 0.25 + s.z * 0.6;
      ctx.fillRect(sx, sy, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    if (this.spec.genre === "platformer") {
      // Far hills.
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let i = -1; i < 7; i++) {
        const hx = i * 220 - ((camX * 0.25) % 220);
        ctx.beginPath();
        ctx.ellipse(hx + 110, GROUND_Y + 20, 150, 110, 0, Math.PI, 0);
        ctx.fill();
      }
    }

    if (this.phase === "play" || this.phase === "cleared" || this.phase === "intro" || this.phase === "lose" || this.phase === "win") this.drawWorld();

    // Particles.
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - (this.spec.genre === "platformer" ? this.camX : 0), p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (this.level.twist === "dark" && (this.phase === "play" || this.phase === "cleared")) {
      const hx = this.hero.x + this.hero.w / 2 - (this.spec.genre === "platformer" ? this.camX : 0);
      const hy = this.hero.y + this.hero.h / 2;
      const rg = ctx.createRadialGradient(hx, hy, 70, hx, hy, 230);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(1, "rgba(0,0,0,0.88)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    if (this.phase === "play" || this.phase === "cleared") this.drawHud();
    this.drawOverlay();
  }

  private drawWorld() {
    const ctx = this.ctx;
    const pal = this.spec.palette;
    const off = this.spec.genre === "platformer" ? this.camX : 0;

    if (this.spec.genre === "platformer" && this.plat) {
      for (const s of this.plat.ground) {
        if (s.x - off > W || s.x + s.w - off < 0) continue;
        ctx.fillStyle = pal.ground;
        ctx.fillRect(s.x - off, s.y, s.w, s.h);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(s.x - off, s.y, s.w, 6);
      }
      for (const s of this.plat.ledges) {
        if (s.x - off > W || s.x + s.w - off < 0) continue;
        ctx.fillStyle = pal.ground;
        ctx.fillRect(s.x - off, s.y, s.w, s.h);
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(s.x - off, s.y, s.w, 4);
        ctx.globalAlpha = 1;
      }
    }
    if (this.spec.genre === "topdown" && this.top) {
      const t = this.top;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 10, t.cols * t.tile, t.rows * t.tile);
      for (let r = 0; r < t.rows; r++) {
        for (let c = 0; c < t.cols; c++) {
          if (!t.walls[r * t.cols + c]) continue;
          ctx.fillStyle = pal.ground;
          ctx.fillRect(c * t.tile, r * t.tile + 10, t.tile, t.tile);
          ctx.fillStyle = "rgba(255,255,255,0.14)";
          ctx.fillRect(c * t.tile, r * t.tile + 10, t.tile, 4);
        }
      }
      if (this.exitOpen) {
        const ex = t.exit.c * t.tile + t.tile / 2;
        const ey = t.exit.r * t.tile + t.tile / 2 + 10;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(this.time * 2);
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + Math.sin(this.time * 6) * 3, 0, Math.PI * 1.6);
        ctx.stroke();
        ctx.restore();
        this.drawEmoji("🌀", ex, ey, 30);
      }
    }

    for (const p of this.pickups) {
      if (p.taken) continue;
      const px = p.x + p.w / 2 - off;
      if (px < -40 || px > W + 40) continue;
      const bob = Math.sin(p.bob) * 4;
      if (p.kind === "power") {
        ctx.fillStyle = "rgba(125,249,255,0.25)";
        ctx.beginPath();
        ctx.arc(px, p.y + p.h / 2 + bob, 24 + Math.sin(this.time * 5) * 3, 0, Math.PI * 2);
        ctx.fill();
        this.drawEmoji(this.spec.powerup.emoji, px, p.y + p.h / 2 + bob, 30);
      } else this.drawEmoji(this.spec.collectible.emoji, px, p.y + p.h / 2 + bob, 28);
    }

    for (const e of this.enemies) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2 - off;
      if (ex < -60 || ex > W + 60 || e.y > H + 40) continue;
      const size = e.w / 0.72;
      this.drawEmoji(e.emoji, ex, e.y + e.h / 2 + Math.sin(e.t * 8) * 1.5, Math.min(size, 60), e.vx > 0);
    }

    const h = this.hero;
    const blink = this.inv > 0 && Math.floor(this.inv * 12) % 2 === 0;
    if (!blink) {
      const hx = h.x + h.w / 2 - off;
      const hy = h.y + h.h / 2;
      if (this.power > 0) {
        ctx.strokeStyle = this.spec.powerup.effect === "shield" ? "#7df9ff" : pal.accent;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(this.time * 10) * 0.3;
        ctx.beginPath();
        ctx.arc(hx, hy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const squash = this.spec.genre === "platformer" && !this.onGround ? 1.06 : 1 + Math.sin(this.time * 10) * 0.02;
      this.drawEmoji(this.spec.hero.emoji, hx, hy, 38 * squash, this.facing < 0);
    }
  }

  private drawHud() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, W, 44);
    for (let i = 0; i < this.lives; i++) this.drawEmoji("❤️", 24 + i * 28, 22, 20);
    const goal = clampNum(this.level.goal, 1, 40, 8);
    const bw = 300;
    const bx = W / 2 - bw / 2;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(bx, 14, bw, 16);
    ctx.fillStyle = this.spec.palette.accent;
    ctx.fillRect(bx, 14, bw * Math.min(1, this.collected / goal), 16);
    this.drawEmoji(this.spec.collectible.emoji, bx - 18, 22, 20);
    this.text(`${Math.min(this.collected, goal)} / ${goal}`, W / 2, 22, 13, "#fff");
    this.text(`Level ${this.levelIndex + 1}`, W - 16, 22, 15, "#fff", "right");
    if (this.power > 0) {
      this.drawEmoji(this.spec.powerup.emoji, W - 150, 22, 20);
      this.text(`${Math.ceil(this.power)}s`, W - 128, 22, 14, "#7df9ff", "left");
    }
    if (this.spec.genre === "topdown" && this.exitOpen) this.text("Find the 🌀 portal!", W / 2, 60, 16, this.spec.palette.accent);
    if (this.toastTime > 0) {
      ctx.globalAlpha = Math.min(1, this.toastTime);
      this.text(this.toast, W / 2, 96, 26, "#fff");
      ctx.globalAlpha = 1;
    }
    if (this.paused) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      this.text("Paused", W / 2, H / 2 - 10, 44);
      this.text("Press P or tap to keep playing", W / 2, H / 2 + 34, 18, "#ddd", "center", 500);
    }
  }

  private card(title: string, body: string, footer: string, emoji?: string) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    let y = 150;
    if (emoji) {
      this.drawEmoji(emoji, W / 2, 120 + Math.sin(this.time * 3) * 6, 84);
      y = 210;
    }
    this.text(title, W / 2, y, 40, "#fff", "center", 800, W - 80);
    const lines = this.wrap(body, W / 2, y + 52, 20, W - 200, "#f1f1f1");
    if (footer) {
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 4) * 0.4;
      this.text(footer, W / 2, Math.min(H - 40, y + 70 + lines * 27 + 30), 18, this.spec.palette.accent);
      ctx.globalAlpha = 1;
    }
  }

  private drawOverlay() {
    const s = this.spec;
    if (this.phase === "title") {
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, H);
      this.drawEmoji(s.hero.emoji, W / 2, 125 + Math.sin(this.time * 3) * 8, 96);
      this.text(s.title, W / 2, 228, 48, "#fff", "center", 800, W - 60);
      this.text(s.tagline, W / 2, 272, 18, s.palette.accent, "center", 600, W - 80);
      const lines = this.wrap(s.story.intro, W / 2, 318, 19, W - 220, "#eee");
      ctx.globalAlpha = 0.55 + Math.sin(this.time * 4) * 0.45;
      this.text("Press Space or tap to start", W / 2, Math.min(H - 34, 330 + lines * 26 + 26), 20, "#fff");
      ctx.globalAlpha = 1;
    } else if (this.phase === "intro") {
      this.card(this.level.name, this.level.intro, "Space or tap to go", s.collectible.emoji);
    } else if (this.phase === "cleared") {
      this.card("Level clear!", `${this.collected} ${s.collectible.plural} collected.`, "", "🎉");
    } else if (this.phase === "win") {
      this.card("You win!", `${s.story.win}  Score: ${this.score}.  You designed this!`, "Space or tap to play again", "🏆");
    } else if (this.phase === "lose") {
      this.card("Game over", `${s.story.lose}  Score: ${this.score}.`, "Space or tap to try again", s.hero.emoji);
    }
  }
}
