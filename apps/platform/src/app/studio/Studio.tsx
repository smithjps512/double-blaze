"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cleanPlan, emptyStory, type LaunchScenario, type LaunchStory } from "@/lib/launch/plan";
import {
  GENRES,
  GOALS,
  STUDIO_LIMITS as L,
  asPlan,
  emptyDesign,
  feelingHints,
  loopHints,
  mechanicHints,
  mechanicIsWritten,
  playerHints,
  studioLevelUp,
  studioProgress,
  type GameDesign,
  type StudioItem,
  type StudioStep,
} from "@/lib/studio/design";
import { Card, Field, Hints, Join, StoryCard, readLocal, writeLocal, type Conflict, type Session } from "../trail-crew/launch/shared";

/**
 * The Game Studio: a team's game design doc, one tab at a time.
 *
 * Pitch, players, core loop, world, mechanics, then levels, which are player
 * stories with checks, scenarios and the Definition of Done, written with the
 * same card as Launch Pad. Saves the same way too: to the class a moment
 * after typing stops, with a copy on the Chromebook, and a question instead
 * of a lost edit when two Chromebooks save over each other.
 * No em dashes in any copy here.
 */

type SaveState = "saved" | "saving" | "waiting" | "local" | "error";

const API = "/api/studio";
const LAST = "launch.last.v1";
const docKey = (s: Session) => `studio.design.v1.${s.period}.${s.key}`;
const INCOMING_SCENARIO = "studio.incoming-scenario.v1";

/* ------------------------------------------------------------------ tabs */

function PitchStep({ d, set }: { d: GameDesign; set: (p: Partial<GameDesign>) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Pitch</p>
        <h2 className="text-xl font-bold">What is your game?</h2>
        <div className="mt-4 space-y-4">
          <Field label="Game name" value={d.gameName} onChange={(v) => set({ gameName: v })} placeholder="Pickle Panic" max={L.short} />
          <Field label="One-liner" help={`"It's a ___ game where you ___."`} value={d.oneLiner} onChange={(v) => set({ oneLiner: v })} placeholder="It's a platformer where you rescue pickles from a runaway lunch tray." max={L.sentence} area />
          <div>
            <Field label="The feeling" help="How should the player feel? That feeling is your game's purpose." value={d.feeling} onChange={(v) => set({ feeling: v })} placeholder="Brave, and a little silly" max={L.sentence} />
            <Hints hints={feelingHints(d.feeling)} />
          </div>
          <label className="block">
            <span className="block font-semibold">Genre</span>
            <select value={d.genre} onChange={(e) => set({ genre: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2">
              <option value="">Pick one</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Feeling words</p>
        <p className="mt-2 text-sm text-ink/80">Brave, clever, fast, sneaky, cozy, spooky, unstoppable, chill, curious, epic, silly.</p>
        <p className="mt-4 text-sm text-ink/70">For apps, the purpose was the impact. For games, it is the feeling. Every mechanic and level should make that feeling stronger.</p>
      </Card>
    </div>
  );
}

function PlayersStep({ d, set }: { d: GameDesign; set: (p: Partial<GameDesign>) => void }) {
  const update = (i: number, patch: Partial<GameDesign["players"][number]>) => set({ players: d.players.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Players</p>
        <h2 className="text-xl font-bold">Who plays it, and what do they want?</h2>
        <div className="mt-4 space-y-3">
          {d.players.map((p, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-ink/10 bg-stone-white p-3 sm:grid-cols-[12rem_1fr_auto]">
              <Field label={`Player ${i + 1}`} value={p.name} onChange={(v) => update(i, { name: v })} placeholder={i === 0 ? "Explorers" : "Who else?"} max={L.short} />
              <Field label="What do they want from the game?" value={p.wants} onChange={(v) => update(i, { wants: v })} placeholder="Secret areas behind walls" max={L.sentence} />
              {d.players.length > 1 && (
                <button onClick={() => set({ players: d.players.filter((_, j) => j !== i) })} className="self-end px-2 py-2 text-sm text-ink/50 hover:text-blaze-maroon">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {d.players.length < L.players && (
          <button onClick={() => set({ players: [...d.players, { name: "", wants: "" }] })} className="mt-3 rounded-md border border-blaze-maroon px-4 py-2 font-medium text-blaze-maroon">
            + Add a player type
          </button>
        )}
        <Hints hints={playerHints(d.players)} />
      </Card>
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Player types</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
          <li><b>Explorers</b> want secrets and new places.</li>
          <li><b>Competitors</b> want to win and beat a score.</li>
          <li><b>Collectors</b> want to find every last thing.</li>
          <li><b>Builders</b> want to make their own stuff.</li>
          <li><b>The parent</b> who says yes wants it to be safe and not endless.</li>
        </ul>
      </Card>
    </div>
  );
}

function LoopStep({ d, set }: { d: GameDesign; set: (p: Partial<GameDesign>) => void }) {
  const verbs = d.loop;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Core loop</p>
        <h2 className="text-xl font-bold">What does the player do, over and over?</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {verbs.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={v}
                maxLength={40}
                onChange={(e) => set({ loop: verbs.map((x, j) => (j === i ? e.target.value : x)) })}
                placeholder={["run", "jump", "collect", "reach the flag", "upgrade"][i] ?? "verb"}
                className="w-36 rounded-lg border border-ink/20 bg-white px-3 py-2 text-center font-semibold"
              />
              <span aria-hidden className="text-xl text-trail-orange">→</span>
            </div>
          ))}
          <span className="font-semibold text-ink/50">again</span>
          {verbs.length < L.loop && (
            <button onClick={() => set({ loop: [...verbs, ""] })} className="ml-2 text-sm font-medium text-blaze-maroon">
              + verb
            </button>
          )}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="How do you win?" value={d.win} onChange={(v) => set({ win: v })} placeholder="Reach the jar on level 3 with 10 pickles" max={L.sentence} />
          <Field label="How do you lose?" value={d.lose} onChange={(v) => set({ lose: v })} placeholder="Fall off the tray 3 times" max={L.sentence} />
        </div>
        <Hints hints={loopHints(d)} />
      </Card>
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Loops you know</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
          <li>Platformer: run → jump → collect → reach the flag</li>
          <li>Racer: steer → boost → pass → finish</li>
          <li>W.C.O 27: play the obby → earn cards → build a team → play the tournament</li>
        </ul>
      </Card>
    </div>
  );
}

function WorldStep({ d, set }: { d: GameDesign; set: (p: Partial<GameDesign>) => void }) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">World</p>
      <h2 className="text-xl font-bold">Who, where, and what is in the way?</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Hero" help="Who the player is." value={d.hero} onChange={(v) => set({ hero: v })} placeholder="Dill, a brave pickle" max={L.short} />
        <Field label="Setting" help="Where it happens." value={d.setting} onChange={(v) => set({ setting: v })} placeholder="The school cafeteria at night" max={L.sentence} />
        <Field label="Goal" help="What the hero wants." value={d.goal} onChange={(v) => set({ goal: v })} placeholder="Get every pickle back in the jar" max={L.sentence} />
        <Field label="Obstacle" help="What is in the way." value={d.obstacle} onChange={(v) => set({ obstacle: v })} placeholder="The runaway lunch tray tilts every 5 seconds" max={L.sentence} />
      </div>
      <div className="mt-4">
        <Field label="Story intro" help="2 or 3 sentences a player reads before level 1." value={d.intro} onChange={(v) => set({ intro: v })} placeholder="The lunch tray came alive at midnight..." max={L.sentence * 2} area />
      </div>
    </Card>
  );
}

function MechanicsStep({ d, set }: { d: GameDesign; set: (p: Partial<GameDesign>) => void }) {
  const update = (i: number, patch: Partial<GameDesign["mechanics"][number]>) => set({ mechanics: d.mechanics.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  return (
    <div className="space-y-4">
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Mechanics</p>
        <h2 className="text-xl font-bold">The rules of your game</h2>
        <p className="mt-1 text-ink/80">Each mechanic is a button and an exact rule. &ldquo;You jump high&rdquo; cannot be built. &ldquo;Jumps 2 tiles high, once per press&rdquo; can. Write at least {GOALS.mechanics}.</p>
      </Card>
      {d.mechanics.map((m, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Mechanic {i + 1}{mechanicIsWritten(m) ? " ✓" : ""}</p>
            {d.mechanics.length > 1 && (
              <button onClick={() => set({ mechanics: d.mechanics.filter((_, j) => j !== i) })} className="text-sm text-ink/50 hover:text-blaze-maroon">
                Remove
              </button>
            )}
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr]">
            <Field label="Name" value={m.name} onChange={(v) => update(i, { name: v })} placeholder="Jump" max={L.short} />
            <Field label="Controls" value={m.controls} onChange={(v) => update(i, { controls: v })} placeholder="A button" max={L.short} />
          </div>
          <div className="mt-3">
            <Field label="Rule: exactly what happens" value={m.rule} onChange={(v) => update(i, { rule: v })} placeholder="Jumps 2 tiles high, once per press" max={L.sentence} />
          </div>
          <Hints hints={mechanicHints(m)} />
        </Card>
      ))}
      {d.mechanics.length < L.mechanics && (
        <button onClick={() => set({ mechanics: [...d.mechanics, { name: "", controls: "", rule: "" }] })} className="rounded-md border border-blaze-maroon px-4 py-2 font-medium text-blaze-maroon">
          + Add a mechanic
        </button>
      )}
    </div>
  );
}

function LevelsStep({ d, set, bonusFor }: { d: GameDesign; set: (p: Partial<GameDesign>) => void; bonusFor?: number }) {
  const plan = asPlan(d);
  return (
    <div className="space-y-5">
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Levels</p>
        <h2 className="text-xl font-bold">Every level is a player story</h2>
        <p className="mt-1 text-ink/80">
          Who is playing, what they want to do in this level, and why. Then checks a playtester could test, a happy path, and a bad day: what if the player falls, gets stuck, or does something weird? Write at least {GOALS.levels}.
        </p>
      </Card>
      {d.levels.map((l, i) => (
        <StoryCard
          key={i}
          i={i}
          story={l}
          plan={plan}
          noun="Level"
          featurePlaceholder="The tilting tray"
          onChange={(next: LaunchStory) => set({ levels: d.levels.map((x, j) => (j === i ? next : x)) })}
          onRemove={d.levels.length > 1 ? () => set({ levels: d.levels.filter((_, j) => j !== i) }) : undefined}
          openBonus={bonusFor === i}
        />
      ))}
      {d.levels.length < L.levels && (
        <button onClick={() => set({ levels: [...d.levels, emptyStory()] })} className="rounded-md border border-blaze-maroon px-4 py-2 font-medium text-blaze-maroon">
          + Add a level
        </button>
      )}
    </div>
  );
}

function DocStep({ d, session }: { d: GameDesign; session: Session }) {
  const p = studioProgress(d);
  const verbs = d.loop.filter((v) => v.trim());
  const blank = <em className="text-ink/40">not written yet</em>;
  return (
    <Card>
      <p className="text-sm text-ink/60">
        {session.teamName} &middot; Period {session.period}
        {d.genre ? <> &middot; {d.genre}</> : null}
      </p>
      <h2 className="mt-1 font-display text-3xl font-bold text-blaze-maroon">{d.gameName.trim() || "Untitled game"}</h2>
      <p className="mt-1 text-lg">{d.oneLiner.trim() || blank}</p>
      <p className="mt-2">
        <b>The feeling:</b> {d.feeling.trim() || blank}
      </p>
      <h3 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">Core loop</h3>
      <p className="mt-1 text-lg font-semibold">{verbs.length ? `${verbs.join(" → ")} → again` : blank}</p>
      <p className="text-sm">
        <b>Win:</b> {d.win.trim() || blank} &middot; <b>Lose:</b> {d.lose.trim() || blank}
      </p>
      <h3 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">Players</h3>
      <ul className="mt-1">
        {d.players.filter((x) => x.name.trim()).map((x, i) => (
          <li key={i}>
            <b>{x.name.trim()}:</b> {x.wants.trim() || blank}
          </li>
        ))}
      </ul>
      <h3 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">World</h3>
      <p className="mt-1">
        <b>{d.hero.trim() || "The hero"}</b> wants {d.goal.trim() || "..."}, but {d.obstacle.trim() || "..."}. {d.setting.trim() ? `It happens in ${d.setting.trim()}.` : ""}
      </p>
      {d.intro.trim() && <p className="mt-2 italic text-ink/80">{d.intro.trim()}</p>}
      <h3 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">Mechanics ({p.mechanics})</h3>
      <ul className="mt-1 space-y-1">
        {d.mechanics.filter((m) => m.name.trim()).map((m, i) => (
          <li key={i}>
            <b>{m.name.trim()}</b> <span className="text-ink/60">({m.controls.trim() || "no controls"})</span>: {m.rule.trim() || blank}
          </li>
        ))}
      </ul>
      <h3 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">
        Levels ({p.doneLevels} of {p.levels} done)
      </h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5">
        {d.levels.filter((l) => l.iWant.trim()).map((l, i) => (
          <li key={i}>
            <b>{l.feature.trim() || `Level ${i + 1}`}:</b> As a {l.asA.trim() || "player"}, I want to {l.iWant.trim()}, so I can {l.soThat.trim() || "..."}.
          </li>
        ))}
      </ol>
    </Card>
  );
}

function LevelUpStep({ d, onGo }: { d: GameDesign; onGo: (t: StudioItem["target"]) => void }) {
  const items = studioLevelUp(d);
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Level up</p>
      <h2 className="text-xl font-bold">{items.length ? "What would make your design buildable" : "Your design is ready to build"}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-ink/75">Every section is written and every level meets the Definition of Done. Tell your teacher it is ready, then add a level for v2.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, n) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 bg-stone-white p-3">
              <span className="min-w-[14rem] flex-1">
                <span className="mr-2 font-semibold text-trail-orange">{n + 1}.</span>
                {item.text}
              </span>
              <button onClick={() => onGo(item.target)} className="rounded-md border border-blaze-maroon bg-white px-3 py-1.5 text-sm font-medium text-blaze-maroon">
                {item.action}
              </button>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- shell */

export default function Studio() {
  const [session, setSession] = useState<Session | null>(null);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [design, setDesign] = useState<GameDesign>(emptyDesign);
  const [step, setStep] = useState<StudioStep>("pitch");
  const [save, setSave] = useState<SaveState>("saved");
  const [conflict, setConflict] = useState<Conflict<GameDesign> | null>(null);
  const [focus, setFocus] = useState<{ level: number; where: "checks" | "scenario" | "sentence" } | null>(null);
  const rev = useRef(0);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offline = useRef(false);
  const designRef = useRef(design);
  designRef.current = design;

  // A QA bug from /play, as a bad day waiting for a level (?scenario=).
  const [incoming, setIncoming] = useState<LaunchScenario | null>(null);
  const [incomingLevel, setIncomingLevel] = useState(0);

  useEffect(() => {
    setLastSession(readLocal<Session>(LAST));
    const fromUrl = new URLSearchParams(window.location.search).get("scenario");
    let raw = fromUrl;
    try {
      if (fromUrl) window.sessionStorage.setItem(INCOMING_SCENARIO, fromUrl);
      else raw = window.sessionStorage.getItem(INCOMING_SCENARIO);
    } catch {
      /* storage off */
    }
    if (raw) {
      try {
        const sc = cleanPlan({ stories: [{ scenarios: [{ ...JSON.parse(raw), kind: "bad" }] }] }).stories[0].scenarios[0];
        if (sc && (sc.when || sc.then)) setIncoming(sc);
      } catch {
        /* cut short */
      }
    }
    if (fromUrl) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  function dropIncoming() {
    setIncoming(null);
    try {
      window.sessionStorage.removeItem(INCOMING_SCENARIO);
    } catch {
      /* nothing to clear */
    }
  }

  const push = useCallback(async (s: Session, d: GameDesign) => {
    if (offline.current) return setSave("local");
    setSave("saving");
    try {
      const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ period: s.period, team: s.teamName, plan: d, rev: rev.current }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        rev.current = data.rev;
        dirty.current = false;
        return setSave("saved");
      }
      if (res.status === 409 && data.conflict) return setConflict(data.conflict as Conflict<GameDesign>), setSave("waiting");
      if (res.status === 429) {
        timer.current = setTimeout(() => push(s, d), 3000);
        return;
      }
      if (res.status === 503) offline.current = true;
      setSave(res.status === 503 ? "local" : "error");
    } catch {
      setSave("error");
    }
  }, []);

  const update = useCallback(
    (patch: Partial<GameDesign>) => {
      if (!session) return;
      const next = { ...designRef.current, ...patch };
      designRef.current = next;
      setDesign(next);
      writeLocal(docKey(session), { plan: next, rev: rev.current });
      dirty.current = true;
      if (conflict) return;
      setSave("waiting");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => push(session, next), 1200);
    },
    [session, conflict, push],
  );

  useEffect(() => {
    const flush = () => {
      if (!session || !dirty.current || conflict || offline.current) return;
      navigator.sendBeacon?.(API, new Blob([JSON.stringify({ period: session.period, team: session.teamName, plan: designRef.current, rev: rev.current })], { type: "application/json" }));
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [session, conflict]);

  // After Level up opens a level, scroll to it and put the cursor where the work is.
  useEffect(() => {
    if (!focus || step !== "levels") return;
    const t = setTimeout(() => {
      const card = document.getElementById(`story-${focus.level}`);
      card?.scrollIntoView({ behavior: "smooth", block: "start" });
      const where = focus.where === "scenario" ? "[data-sc]:last-child input" : focus.where === "checks" ? "[data-criteria] input" : "[data-sentence] input";
      const boxes = Array.from(card?.querySelectorAll<HTMLInputElement>(where) ?? []);
      (boxes.find((b) => !b.value) ?? boxes[0])?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [focus, step]);

  function join(s: Session, found: Conflict<GameDesign> | null, isOffline: boolean) {
    offline.current = isOffline;
    writeLocal(LAST, s);
    setSession(s);
    setConflict(null);
    const local = readLocal<{ plan: GameDesign; rev: number }>(docKey(s));
    if (found) {
      const mine = local && local.rev === found.rev && JSON.stringify(local.plan) !== JSON.stringify(found.plan) ? local.plan : null;
      rev.current = found.rev;
      setDesign(mine ?? found.plan);
      if (mine) {
        dirty.current = true;
        setTimeout(() => push(s, mine), 0);
      } else setSave("saved");
      setStep(found.plan.gameName ? "levelup" : "pitch");
    } else {
      rev.current = 0;
      setDesign(local?.plan ? { ...emptyDesign(), ...local.plan } : emptyDesign());
      setSave(isOffline ? "local" : "saved");
      setStep("pitch");
    }
  }

  async function refresh() {
    if (!session || offline.current) return;
    const res = await fetch(`${API}?period=${session.period}&team=${encodeURIComponent(session.teamName)}`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    rev.current = data.rev;
    dirty.current = false;
    setDesign(data.plan);
    writeLocal(docKey(session), { plan: data.plan, rev: data.rev });
    setSave("saved");
  }

  function resolve(keep: "theirs" | "mine") {
    if (!session || !conflict) return;
    rev.current = conflict.rev;
    if (keep === "theirs") {
      setDesign(conflict.plan);
      dirty.current = false;
      writeLocal(docKey(session), { plan: conflict.plan, rev: conflict.rev });
      setSave("saved");
    } else push(session, designRef.current);
    setConflict(null);
  }

  function go(t: StudioItem["target"]) {
    if (t.step === "levels" && t.level !== undefined) {
      if (t.scenario) {
        const levels = designRef.current.levels;
        const l = levels[t.level];
        if (l) update({ levels: levels.map((x, j) => (j === t.level ? { ...x, scenarios: [...(x.scenarios ?? []), { kind: t.scenario!, given: "", when: "", then: "" }] } : x)) });
      }
      setFocus({ level: t.level, where: t.scenario ? "scenario" : t.bonus ? "checks" : "sentence" });
    } else {
      if (t.step === "levels") update({ levels: [...designRef.current.levels, emptyStory()] });
      setFocus(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setStep(t.step);
  }

  function addIncoming() {
    if (!incoming) return;
    const levels = designRef.current.levels;
    const at = Math.min(incomingLevel, levels.length - 1);
    if (at < 0) return;
    update({ levels: levels.map((x, j) => (j === at ? { ...x, scenarios: [...(x.scenarios ?? []), incoming] } : x)) });
    dropIncoming();
    setFocus({ level: at, where: "scenario" });
    setStep("levels");
  }

  const p = studioProgress(design);
  const steps: Array<{ id: StudioStep; label: string; done: boolean }> = [
    { id: "pitch", label: "Pitch", done: p.pitch },
    { id: "players", label: `Players (${p.players})`, done: p.players >= GOALS.players },
    { id: "loop", label: "Core loop", done: p.loop },
    { id: "world", label: "World", done: p.world },
    { id: "mechanics", label: `Mechanics (${p.mechanics})`, done: p.mechanics >= GOALS.mechanics },
    { id: "levels", label: `Levels (${p.doneLevels}/${GOALS.levels})`, done: p.doneLevels >= GOALS.levels },
    { id: "doc", label: "Design doc", done: false },
    { id: "levelup", label: "Level up", done: false },
  ];
  const order = steps.map((s) => s.id);
  const nextStep = order[order.indexOf(step) + 1];
  const saveText: Record<SaveState, string> = {
    saved: "Saved to the class",
    saving: "Saving...",
    waiting: conflict ? "Not saved: see the yellow box" : "Saving soon...",
    local: "Saved on this Chromebook only",
    error: "Not saved yet. Check the wifi.",
  };

  return (
    <div className="bg-stone-white">
      <div className="container-page py-6 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">🎮 Game Studio</p>
            <h1 className="text-3xl font-bold md:text-4xl">Design a game a studio could build</h1>
            <p className="mt-1 max-w-2xl text-ink/70">The feeling, the players, the loop, the world, the rules, and the levels. Write it clearly enough and Double Blaze will build it.</p>
          </div>
          {session && (
            <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm">
              <p className="font-semibold">
                {session.teamName} &middot; Period {session.period}
              </p>
              <p className={save === "saved" ? "text-emerald-700" : save === "error" ? "text-blaze-maroon" : "text-ink/60"}>{saveText[save]}</p>
              <div className="mt-1 flex gap-3">
                {!offline.current && (
                  <button onClick={refresh} disabled={dirty.current} className="text-blaze-maroon underline underline-offset-2 disabled:opacity-40">
                    Refresh
                  </button>
                )}
                <button onClick={() => setSession(null)} className="text-ink/60 underline underline-offset-2">
                  Switch studio
                </button>
              </div>
            </div>
          )}
        </header>

        {!session ? (
          <div className="mt-6 max-w-3xl">
            {incoming && (
              <p className="mb-4 rounded-lg border border-trail-orange/40 bg-trail-orange/5 px-4 py-3 text-sm">Find your studio, and the bad day from QA will be ready to add.</p>
            )}
            <Join<GameDesign> key={lastSession ? `${lastSession.period}.${lastSession.key}` : "new"} onJoin={join} initial={lastSession} api={API} />
          </div>
        ) : (
          <>
            {incoming && (
              <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="font-semibold">⛈️ A playtester found a bad day in your game:</p>
                <div className="mt-2 space-y-0.5 text-sm">
                  <p><b className="text-blaze-maroon">Given</b> {incoming.given || <em className="text-ink/50">(you fill this in)</em>}</p>
                  <p><b className="text-blaze-maroon">When</b> {incoming.when}</p>
                  <p><b className="text-blaze-maroon">Then</b> {incoming.then}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select value={incomingLevel} onChange={(e) => setIncomingLevel(Number(e.target.value))} className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm">
                    {design.levels.map((l, i) => (
                      <option key={i} value={i}>
                        Level {i + 1}
                        {l.feature.trim() ? `: ${l.feature.trim()}` : ""}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={addIncoming}>
                    Add this bad day
                  </button>
                  <button className="rounded-md border border-ink/20 bg-white px-4 py-2 font-medium" onClick={dropIncoming}>
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {conflict && (
              <div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <p className="font-semibold">A teammate saved changes from another Chromebook while you were typing.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={() => resolve("theirs")}>
                    Use their version
                  </button>
                  <button className="rounded-md border border-ink/20 bg-white px-4 py-2 font-medium" onClick={() => resolve("mine")}>
                    Keep what is on this screen
                  </button>
                </div>
              </div>
            )}
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Design doc sections">
              {steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStep(s.id);
                    setFocus(null);
                  }}
                  aria-current={step === s.id ? "step" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${step === s.id ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
                >
                  {s.done && <span aria-label="done">✓ </span>}
                  {s.label}
                </button>
              ))}
            </nav>
            <main className="mt-5">
              {step === "pitch" && <PitchStep d={design} set={update} />}
              {step === "players" && <PlayersStep d={design} set={update} />}
              {step === "loop" && <LoopStep d={design} set={update} />}
              {step === "world" && <WorldStep d={design} set={update} />}
              {step === "mechanics" && <MechanicsStep d={design} set={update} />}
              {step === "levels" && <LevelsStep d={design} set={update} bonusFor={focus?.where === "checks" ? focus.level : undefined} />}
              {step === "doc" && <DocStep d={design} session={session} />}
              {step === "levelup" && <LevelUpStep d={design} onGo={go} />}
            </main>
            {nextStep && (
              <div className="mt-6 flex justify-end">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setStep(nextStep);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Next: {steps.find((s) => s.id === nextStep)?.label}
                </button>
              </div>
            )}
            <p className="mt-8 text-sm text-ink/50">Producer types, everyone decides. Teammates can open the same studio and press Refresh to read along.</p>
          </>
        )}
      </div>
    </div>
  );
}
