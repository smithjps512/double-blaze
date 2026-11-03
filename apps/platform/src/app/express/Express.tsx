"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COLLECTIBLES,
  ENEMIES,
  FEELINGS,
  GENRES,
  HEROES,
  POWERUPS,
  SETTINGS,
  cleanDesign,
  designGaps,
  type ExpressDesign,
  type GameSpec,
} from "@/lib/express/spec";
import GamePlayer from "./GamePlayer";

/**
 * Studio Express: design a game in one class, watch Spark build it, play it.
 *
 * Six short steps, each one a thing the class learned this semester (the
 * feeling as purpose, the core loop, mechanics as exact numbers, a player
 * story with a check and a bad day). The orange box always says exactly what
 * is still missing, so a student with a substitute never has to ask what to do.
 *
 * While Spark designs the game (10 to 20 seconds) the build screen keeps them
 * busy: a build log written from their own words, a progress bar, and a QA
 * mini-game. If Spark is not there the server builds by rule, instantly.
 * The draft lives on the Chromebook, so a closed lid loses nothing.
 * No em dashes in any copy here.
 */

type Phase = "design" | "building" | "play";

const DRAFT = "express.draft.v1";
const DEVICE = "express.device.v1";

const EMPTY: ExpressDesign = cleanDesign({
  period: 3,
  genre: "platformer",
  heroEmoji: HEROES[0],
  collectEmoji: COLLECTIBLES[0],
  enemyEmoji: ENEMIES[0],
  verbs: ["", "", ""],
  powerup: "shield",
  speed: 5,
  jump: 5,
  lives: 3,
});

function deviceKey(): string {
  try {
    let k = localStorage.getItem(DEVICE);
    if (!k) {
      k = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
      localStorage.setItem(DEVICE, k);
    }
    return k;
  } catch {
    return "nostorage" + Math.random().toString(36).slice(2, 14);
  }
}

/* ----------------------------------------------------------------- bits */

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-full font-bold text-white ${done ? "bg-emerald-600" : "bg-trail-orange"}`}>{done ? "✓" : n}</span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Text({ label, help, value, onChange, placeholder, max = 80 }: { label: string; help?: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number }) {
  return (
    <label className="block">
      <span className="block font-semibold">{label}</span>
      {help && <span className="block text-sm text-ink/60">{help}</span>}
      <input value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-base focus:border-trail-orange focus:outline-none" />
    </label>
  );
}

function Emojis({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="block font-semibold">{label}</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((e) => (
          <button key={e} type="button" onClick={() => onChange(e)} aria-pressed={value === e} className={`grid h-12 w-12 place-items-center rounded-xl border text-2xl transition ${value === e ? "scale-110 border-trail-orange bg-trail-orange/10 shadow" : "border-ink/10 bg-white hover:border-ink/30"}`}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chips({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={`rounded-full px-3 py-1.5 text-sm font-medium ${value === o ? "bg-blaze-maroon text-white" : "bg-ink/5 hover:bg-ink/10"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, words }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; words: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex justify-between font-semibold">
        <span>{label}</span>
        <span className="text-blaze-maroon">
          {value} <span className="font-normal text-ink/60">{words(value)}</span>
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[#CF4420]" />
    </label>
  );
}

/* ---------------------------------------------------------- build screen */

/** Bug squash: QA while you wait. Bugs crawl across; tap them. */
function BugSquash() {
  const [bugs, setBugs] = useState<Array<{ id: number; x: number; y: number; dx: number; dy: number }>>([]);
  const [score, setScore] = useState(0);
  const next = useRef(0);
  useEffect(() => {
    const spawn = setInterval(() => {
      setBugs((b) => (b.length > 7 ? b : [...b, { id: next.current++, x: Math.random() < 0.5 ? -5 : 105, y: 10 + Math.random() * 75, dx: 0, dy: (Math.random() - 0.5) * 0.6 }].map((x) => (x.dx ? x : { ...x, dx: x.x < 0 ? 0.6 + Math.random() : -(0.6 + Math.random()) }))));
    }, 650);
    const move = setInterval(() => setBugs((b) => b.map((x) => ({ ...x, x: x.x + x.dx, y: Math.min(90, Math.max(5, x.y + x.dy)) })).filter((x) => x.x > -8 && x.x < 108)), 40);
    return () => {
      clearInterval(spawn);
      clearInterval(move);
    };
  }, []);
  return (
    <div className="relative h-44 select-none overflow-hidden rounded-xl bg-ink/90">
      <p className="absolute left-3 top-2 text-sm font-semibold text-white/80">🐞 QA while you wait: squash the bugs! <span className="text-trail-orange">Squashed: {score}</span></p>
      {bugs.map((b) => (
        <button
          key={b.id}
          type="button"
          aria-label="squash"
          onClick={() => {
            setScore((s) => s + 1);
            setBugs((all) => all.filter((x) => x.id !== b.id));
          }}
          className="absolute text-3xl transition-transform active:scale-50"
          style={{ left: `${b.x}%`, top: `${b.y}%`, transform: `scaleX(${b.dx < 0 ? -1 : 1})` }}
        >
          🐛
        </button>
      ))}
    </div>
  );
}

function buildLog(d: ExpressDesign): string[] {
  const genre = GENRES.find((g) => g.id === d.genre)?.name ?? "game";
  const power = POWERUPS.find((p) => p.id === d.powerup);
  return [
    `📖 Reading ${d.studio}'s design for "${d.gameName}"...`,
    `💛 The feeling is "${d.feeling}". Every level has to feel like that.`,
    `${d.heroEmoji} Sketching ${d.heroName}...`,
    `🌍 Building the world: ${d.setting || "somewhere amazing"}`,
    `${d.collectEmoji} Hiding ${d.collectName}s all over the map`,
    `${d.enemyEmoji} Teaching the ${d.enemyName} how to move`,
    `🔁 Wiring the core loop: ${d.verbs.filter(Boolean).join(" → ")} → again`,
    `${power?.emoji ?? "✨"} Installing the ${power?.name ?? "power-up"}`,
    `🎚️ Setting speed to ${d.speed}, jump to ${d.jump}, lives to ${d.lives}`,
    `🧪 Testing your check: "${d.check}"`,
    d.badWhen ? `⛈️ Practicing your bad day: when ${d.badWhen}...` : `⛈️ Making sure falling does not break the game`,
    `🏗️ Laying out 3 ${genre.toLowerCase()} levels, easy to hard`,
    `🎨 Picking colors for your world`,
    `✨ Polishing...`,
  ];
}

function Building({ d, done }: { d: ExpressDesign; done: boolean }) {
  const lines = useMemo(() => buildLog(d), [d]);
  const [shown, setShown] = useState(1);
  const [pct, setPct] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setShown((n) => Math.min(lines.length, n + 1)), 1300);
    const p = setInterval(() => setPct((v) => (v < 92 ? v + Math.max(0.4, (92 - v) * 0.05) : v)), 250);
    return () => {
      clearInterval(t);
      clearInterval(p);
    };
  }, [lines.length]);
  useEffect(() => {
    if (done) {
      setShown(lines.length);
      setPct(100);
    }
  }, [done, lines.length]);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl bg-blaze-maroon p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Spark is building</p>
        <h2 className="mt-1 text-3xl font-bold">{d.heroEmoji} {d.gameName}</h2>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-trail-orange transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-white/80">{done ? "Done! Loading your game..." : `${Math.round(pct)}%: real game studios take months. Spark takes about 20 seconds.`}</p>
      </div>
      <ol className="space-y-1.5 rounded-2xl border border-ink/10 bg-white p-5 font-mono text-sm">
        {lines.slice(0, shown).map((l, i) => (
          <li key={i} className={i === shown - 1 && !done ? "animate-pulse text-blaze-maroon" : "text-ink/80"}>
            {l} {i < shown - 1 || done ? <span className="text-emerald-600">✓</span> : null}
          </li>
        ))}
      </ol>
      <BugSquash />
    </div>
  );
}

/* --------------------------------------------------------------- page */

export default function Express() {
  const [d, setD] = useState<ExpressDesign>(EMPTY);
  const [phase, setPhase] = useState<Phase>("design");
  const [spec, setSpec] = useState<GameSpec | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [buildsLeft, setBuildsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrived, setArrived] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT);
      if (raw) setD({ ...EMPTY, ...cleanDesign(JSON.parse(raw)) });
    } catch {
      /* fresh start */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(DRAFT, JSON.stringify(d));
    } catch {
      /* fine */
    }
  }, [d]);

  const set = (patch: Partial<ExpressDesign>) => setD((x) => ({ ...x, ...patch }));
  const gaps = designGaps(cleanDesign(d));
  const verbs = [0, 1, 2].map((i) => d.verbs[i] ?? "");

  async function build() {
    setError(null);
    setArrived(false);
    setPhase("building");
    window.scrollTo({ top: 0, behavior: "smooth" });
    const started = Date.now();
    try {
      const res = await fetch("/api/express/build", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ design: d, device: deviceKey() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "The build did not work. Try again.");
        setPhase("design");
        return;
      }
      // At least a few seconds of build screen, so even an instant rule build feels like a build.
      const wait = Math.max(0, 6000 - (Date.now() - started));
      setTimeout(() => setArrived(true), wait);
      setTimeout(() => {
        setSpec(data.spec);
        setSlug(data.slug ?? null);
        setBuildsLeft(data.buildsLeft ?? null);
        setPhase("play");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, wait + 1600);
    } catch {
      setError("Could not reach the studio. Check the wifi, then press Build again.");
      setPhase("design");
    }
  }

  if (phase === "building") {
    return (
      <div className="bg-stone-white">
        <div className="container-page py-8">
          <Building d={d} done={arrived} />
        </div>
      </div>
    );
  }

  if (phase === "play" && spec) {
    return (
      <div className="bg-stone-white">
        <div className="container-page py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">You designed this</p>
              <h1 className="text-3xl font-bold">
                {spec.hero.emoji} {spec.title}
              </h1>
              <p className="text-ink/70">
                {spec.tagline} &middot; {d.initials} &middot; {spec.builtBy === "spark" ? "designed with Spark" : "built by the studio engine"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPhase("design")} className="rounded-md border border-blaze-maroon bg-white px-4 py-2 font-medium text-blaze-maroon" title="Change your design and build again">
                🔁 Remix{buildsLeft !== null ? ` (${buildsLeft} build${buildsLeft === 1 ? "" : "s"} left)` : ""}
              </button>
              <a href="/express/today" target="_blank" rel="noopener" className="btn-primary">
                🎮 Play classmates&rsquo; games
              </a>
            </div>
          </div>
          <div className="mx-auto mt-5" style={{ maxWidth: "min(100%, calc((100vh - 235px) * 16 / 9))" }}>
            <GamePlayer spec={spec} />
          </div>
          {slug && (
            <p className="mt-4 text-sm text-ink/60">
              Your game&rsquo;s link: <a className="font-mono text-blaze-maroon underline" href={`/express/play/${slug}`}>doubleblaze.solutions/express/play/{slug}</a>. Show your sub your game playing before the bell!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-white">
      <div className="container-page py-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">🎮 Trail Crew Studio Express</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">Design a game. Watch it get built. Play it.</h1>
          <p className="mt-2 text-ink/70">Use everything you learned this semester. Fill in the six steps, press Build, and Spark turns your design into a real game in about 20 seconds.</p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <Step n={1} title="Who are you?" done={/^[A-Z]{2,3}$/.test(cleanDesign(d).initials) && d.studio.length > 1}>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="block font-semibold">Period</span>
                  <select value={d.period} onChange={(e) => set({ period: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </label>
                <Text label="Your initials" help="2 or 3 letters" value={d.initials} onChange={(v) => set({ initials: v.toUpperCase().replace(/[^A-Za-z]/g, "").slice(0, 3) })} placeholder="ABC" max={3} />
                <Text label="Studio name" help="Never your real name" value={d.studio} onChange={(v) => set({ studio: v })} placeholder="Pixel Pickles" max={40} />
              </div>
            </Step>

            <Step n={2} title="Your game" done={d.gameName.length > 1 && d.feeling.length > 1}>
              <Text label="Game name" value={d.gameName} onChange={(v) => set({ gameName: v })} placeholder="Pickle Panic" max={50} />
              <div>
                <span className="block font-semibold">Genre</span>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  {GENRES.map((g) => (
                    <button key={g.id} type="button" onClick={() => set({ genre: g.id })} aria-pressed={d.genre === g.id} className={`rounded-xl border p-3 text-left ${d.genre === g.id ? "border-trail-orange bg-trail-orange/10" : "border-ink/10 bg-white hover:border-ink/30"}`}>
                      <span className="text-2xl">{g.emoji}</span> <span className="font-semibold">{g.name}</span>
                      <span className="mt-1 block text-xs text-ink/60">{g.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block font-semibold">The feeling</span>
                <span className="block text-sm text-ink/60">A game&rsquo;s purpose is how it makes the player feel. Pick one or type your own.</span>
                <div className="mt-2">
                  <Chips options={FEELINGS} value={d.feeling} onChange={(v) => set({ feeling: v })} />
                </div>
                <input value={d.feeling} maxLength={80} onChange={(e) => set({ feeling: e.target.value })} placeholder="or type your own" className="mt-2 w-full rounded-lg border border-ink/20 bg-white px-3 py-2" />
              </div>
            </Step>

            <Step n={3} title="Hero and world" done={d.heroName.length > 1}>
              <Emojis label="Pick your hero" options={HEROES} value={d.heroEmoji} onChange={(v) => set({ heroEmoji: v })} />
              <Text label="Hero's name" value={d.heroName} onChange={(v) => set({ heroName: v })} placeholder="Dill" max={30} />
              <div>
                <span className="block font-semibold">Where does it happen?</span>
                <div className="mt-2">
                  <Chips options={SETTINGS} value={d.setting} onChange={(v) => set({ setting: v === "Somewhere else" ? "" : v })} />
                </div>
                <input value={d.setting} maxLength={80} onChange={(e) => set({ setting: e.target.value })} placeholder="or describe your world" className="mt-2 w-full rounded-lg border border-ink/20 bg-white px-3 py-2" />
              </div>
              <Text label="What is the hero trying to do?" value={d.goal} onChange={(v) => set({ goal: v })} placeholder="Save every pickle before the lunch bell" max={160} />
            </Step>

            <Step n={4} title="Collect and avoid" done={d.collectName.length > 1 && d.enemyName.length > 1}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <Emojis label="What do you collect?" options={COLLECTIBLES} value={d.collectEmoji} onChange={(v) => set({ collectEmoji: v })} />
                  <Text label="Call it" value={d.collectName} onChange={(v) => set({ collectName: v })} placeholder="pickle" max={30} />
                </div>
                <div className="space-y-3">
                  <Emojis label="What is in the way?" options={ENEMIES} value={d.enemyEmoji} onChange={(v) => set({ enemyEmoji: v })} />
                  <Text label="Call it" value={d.enemyName} onChange={(v) => set({ enemyName: v })} placeholder="lunch tray" max={30} />
                </div>
              </div>
            </Step>

            <Step n={5} title="How it works" done={verbs.filter((v) => v.trim()).length >= 3}>
              <div>
                <span className="block font-semibold">Core loop: 3 things the player does over and over</span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {verbs.map((v, i) => (
                    <span key={i} className="flex items-center gap-2">
                      <input value={v} maxLength={20} onChange={(e) => set({ verbs: verbs.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={["run", "jump", "collect"][i]} className="w-32 rounded-lg border border-ink/20 bg-white px-3 py-2 text-center font-semibold" />
                      <span className="text-xl text-trail-orange">→</span>
                    </span>
                  ))}
                  <span className="font-semibold text-ink/50">again</span>
                </div>
              </div>
              <div>
                <span className="block font-semibold">Power-up</span>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  {POWERUPS.map((p) => (
                    <button key={p.id} type="button" onClick={() => set({ powerup: p.id })} aria-pressed={d.powerup === p.id} className={`rounded-xl border p-3 text-left ${d.powerup === p.id ? "border-trail-orange bg-trail-orange/10" : "border-ink/10 bg-white"}`}>
                      <span className="text-xl">{p.emoji}</span> <span className="font-semibold">{p.name}</span>
                      <span className="block text-xs text-ink/60">{p.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-ink/60">Mechanics are exact numbers. These are the real numbers your game will run on.</p>
              <Slider label="Speed" value={d.speed} min={1} max={10} onChange={(v) => set({ speed: v })} words={(v) => (v < 4 ? "slow and careful" : v < 8 ? "nice and quick" : "super fast")} />
              <Slider label="Jump" value={d.jump} min={1} max={10} onChange={(v) => set({ jump: v })} words={(v) => (v < 4 ? "little hops" : v < 8 ? "good jumps" : "huge leaps")} />
              <Slider label="Lives" value={d.lives} min={1} max={5} onChange={(v) => set({ lives: v })} words={(v) => "❤️".repeat(v)} />
            </Step>

            <Step n={6} title="Your player story" done={d.iWant.length > 2 && d.soThat.length > 2 && d.check.length > 2}>
              <div className="grid gap-3 text-lg sm:grid-cols-[auto_1fr] sm:items-center">
                <span className="font-semibold text-blaze-maroon">As a player, I want to</span>
                <input value={d.iWant} maxLength={200} onChange={(e) => set({ iWant: e.target.value })} placeholder="jump over lunch trays" className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-base" />
                <span className="font-semibold text-blaze-maroon">so I can</span>
                <input value={d.soThat} maxLength={200} onChange={(e) => set({ soThat: e.target.value })} placeholder="save every pickle" className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-base" />
              </div>
              <Text label="One check: how would we know it works?" help="Something a tester could answer yes or no." value={d.check} onChange={(v) => set({ check: v })} placeholder="I can clear a lunch tray in one jump" max={200} />
              <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3">
                <p className="font-semibold">⛈️ Bonus: a bad day</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-center">
                  <span className="font-semibold text-blaze-maroon">Given</span>
                  <input value={d.badGiven} maxLength={200} onChange={(e) => set({ badGiven: e.target.value })} placeholder="I am on a high table" className="rounded-lg border border-ink/20 bg-white px-3 py-2" />
                  <span className="font-semibold text-blaze-maroon">When</span>
                  <input value={d.badWhen} maxLength={200} onChange={(e) => set({ badWhen: e.target.value })} placeholder="I miss the jump and fall" className="rounded-lg border border-ink/20 bg-white px-3 py-2" />
                  <span className="font-semibold text-blaze-maroon">Then</span>
                  <input value={d.badThen} maxLength={200} onChange={(e) => set({ badThen: e.target.value })} placeholder="I lose a life and go back to the checkpoint" className="rounded-lg border border-ink/20 bg-white px-3 py-2" />
                </div>
              </div>
              <Text label="Bonus: anything special? A boss, a twist, a secret?" value={d.special} onChange={(v) => set({ special: v })} placeholder="Level 3 is in the dark" max={240} />
            </Step>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className={`rounded-2xl border-2 p-5 ${gaps.length ? "border-trail-orange bg-trail-orange/5" : "border-emerald-500 bg-emerald-50"}`}>
              {gaps.length ? (
                <>
                  <p className="font-bold text-trail-orange">Still missing ({gaps.length})</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {gaps.map((g) => (
                      <li key={g}>○ {g}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="font-bold text-emerald-700">✓ Your design is ready!</p>
              )}
              {error && <p className="mt-3 rounded-lg bg-white p-2 text-sm font-medium text-blaze-maroon">{error}</p>}
              <button onClick={build} disabled={gaps.length > 0} className="btn-primary mt-4 w-full py-3 text-lg disabled:cursor-not-allowed disabled:opacity-40">
                🚀 Build my game
              </button>
              <p className="mt-2 text-xs text-ink/50">Your work saves on this Chromebook as you type.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
