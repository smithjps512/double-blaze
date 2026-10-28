"use client";

import { useEffect, useState } from "react";
import {
  CHECKS_GOAL,
  LIMITS,
  checkTeamName,
  storyDone,
  storyHints,
  storyIsWritten,
  storySentence,
  type Hint,
  type LaunchPlan,
  type LaunchScenario,
  type LaunchStory,
} from "@/lib/launch/plan";

/**
 * Pieces Launch Pad and the Game Studio share: finding your team, the form
 * boxes and hints, and the story card with its checks, scenarios and
 * Definition of Done. A level in a game is written exactly like a feature
 * in an app, which is the point. No em dashes in any copy here.
 */

export interface Session {
  period: number;
  teamName: string;
  key: string;
}

/** What the server had when a save would have overwritten a teammate. */
export interface Conflict<T = LaunchPlan> {
  teamName: string;
  plan: T;
  rev: number;
}

export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export function readLocal<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private window or full storage: the class copy is the one that counts */
  }
}

/* ------------------------------------------------------------- pieces */

export function Hints({ hints }: { hints: Hint[] }) {
  if (hints.length === 0) return null;
  const style: Record<Hint["level"], string> = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    nudge: "border-trail-orange/30 bg-trail-orange/5 text-ink",
    todo: "border-ink/10 bg-white text-ink/75",
  };
  const mark: Record<Hint["level"], string> = { good: "Nice:", nudge: "Think:", todo: "Still to do:" };
  return (
    <ul className="mt-3 space-y-2" aria-live="polite">
      {hints.map((h) => (
        <li key={h.text} className={`rounded-lg border px-3 py-2 text-sm ${style[h.level]}`}>
          <span className="font-semibold">{mark[h.level]}</span> {h.text}
        </li>
      ))}
    </ul>
  );
}

export function Field({
  label,
  help,
  value,
  onChange,
  placeholder,
  max,
  area,
  list,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max: number;
  area?: boolean;
  list?: string;
}) {
  const cls = "mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-base focus:border-trail-orange focus:outline-none";
  return (
    <label className="block">
      <span className="block font-semibold text-ink">{label}</span>
      {help && <span className="block text-sm text-ink/60">{help}</span>}
      {area ? (
        <textarea value={value} maxLength={max} rows={4} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input value={value} maxLength={max} placeholder={placeholder} list={list} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}

export function Card({ children, tint }: { children: React.ReactNode; tint?: boolean }) {
  return <div className={`rounded-xl border border-ink/10 p-5 shadow-sm ${tint ? "bg-blaze-maroon/5" : "bg-white"}`}>{children}</div>;
}

/* ---------------------------------------------------------------- join */

/**
 * Find your team. `api` is the endpoint that keeps this kind of document
 * (/api/launch for plans, /api/studio for game designs), so a team name opens
 * the right one.
 */
/** Whatever the team called the thing they are making, for "is this your team?". */
const docName = (doc: unknown): string => {
  const d = (doc ?? {}) as { productName?: string; gameName?: string };
  return (d.productName || d.gameName || "").trim();
};

export function Join<T>({
  onJoin,
  initial,
  api = "/api/launch",
}: {
  onJoin: (s: Session, found: Conflict<T> | null, offline: boolean) => void;
  initial: Session | null;
  api?: string;
}) {
  const [period, setPeriod] = useState<number | null>(initial?.period ?? null);
  const [name, setName] = useState(initial?.teamName ?? "");
  const [teams, setTeams] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ session: Session; found: Conflict<T> } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTeams(null);
    if (!period) return;
    fetch(`${api}?period=${period}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTeams(d?.teams ?? null))
      .catch(() => setTeams(null));
  }, [period, api]);

  async function open(teamName = name) {
    setMsg(null);
    setConfirm(null);
    if (!period) return setMsg("Pick your period first.");
    const check = checkTeamName(teamName);
    if (!check.ok) return setMsg(check.error);
    const session = { period, teamName: check.name, key: check.key };
    setBusy(true);
    try {
      const res = await fetch(`${api}?period=${period}&team=${encodeURIComponent(check.name)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) return onJoin(session, null, false);
      if (!res.ok) return onJoin(session, null, true);
      setConfirm({ session: { ...session, teamName: data.teamName }, found: { teamName: data.teamName, plan: data.plan, rev: data.rev } });
    } catch {
      onJoin(session, null, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-ink">Find your team</h2>
      <p className="mt-1 text-sm text-ink/70">
        Everybody on your team types the same team name, so you can all open the same plan. Use a team name, never a real name.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block font-semibold">Your period</span>
          <select
            value={period ?? ""}
            onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 rounded-lg border border-ink/20 bg-white px-3 py-2"
          >
            <option value="">Pick one</option>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                Period {p}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[14rem] flex-1 text-sm">
          <span className="block font-semibold">Team name</span>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && open()}
            placeholder="The Rockets"
            className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2"
          />
        </label>
        <button onClick={() => open()} disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "Looking..." : "Open our plan"}
        </button>
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-blaze-maroon">{msg}</p>}

      {confirm && (
        <div className="mt-4 rounded-lg border border-trail-orange/40 bg-trail-orange/5 p-4">
          <p className="font-semibold">
            Period {confirm.session.period} already has a team called &ldquo;{confirm.found.teamName}&rdquo;
            {docName(confirm.found.plan) ? <> working on &ldquo;{docName(confirm.found.plan)}&rdquo;</> : null}. Is that your team?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => onJoin(confirm.session, confirm.found, false)}>
              Yes, open it
            </button>
            <button className="rounded-md border border-ink/20 bg-white px-4 py-2 font-medium" onClick={() => setConfirm(null)}>
              No, we need a different name
            </button>
          </div>
        </div>
      )}

      {teams && teams.length > 0 && !confirm && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink/70">Teams already started in period {period}:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {teams.map((t) => (
              <button key={t} onClick={() => { setName(t); open(t); }} className="rounded-full bg-ink/5 px-3 py-1 text-sm hover:bg-ink/10">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function StoryCard({
  story,
  i,
  plan,
  onChange,
  onRemove,
  openBonus,
  noun = "Story",
  featurePlaceholder = "Photo search",
}: {
  story: LaunchStory;
  i: number;
  plan: LaunchPlan;
  onChange: (s: LaunchStory) => void;
  onRemove?: () => void;
  /** Level up sent the team here to add checks, so the checks should be showing. */
  openBonus?: boolean;
  /** "Story" on Launch Pad, "Level" in the Game Studio. */
  noun?: string;
  featurePlaceholder?: string;
}) {
  const [bonus, setBonus] = useState(story.criteria.some((c) => c.trim()));
  useEffect(() => {
    if (openBonus) setBonus(true);
  }, [openBonus]);
  const set = (patch: Partial<LaunchStory>) => onChange({ ...story, ...patch });
  const box = "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-base focus:border-trail-orange focus:outline-none";
  const listId = `launch-users-${i}`;
  const criteria = story.criteria.length ? story.criteria : [""];
  const scenarios = story.scenarios ?? [];
  return (
    <div id={`story-${i}`} className="scroll-mt-6">
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">{noun} {i + 1}</p>
        {onRemove && (
          <button onClick={onRemove} className="text-sm text-ink/50 hover:text-blaze-maroon">
            Remove
          </button>
        )}
      </div>
      <div className="mt-2">
        <Field label={noun === "Story" ? "Feature name" : `${noun} name`} help="Two or three words." value={story.feature} onChange={(v) => set({ feature: v })} placeholder={featurePlaceholder} max={LIMITS.short} />
      </div>
      <datalist id={listId}>
        {plan.users.filter((u) => u.name.trim()).map((u) => (
          <option key={u.name} value={u.name} />
        ))}
      </datalist>
      <div data-sentence className="mt-4 grid gap-3 text-lg sm:grid-cols-[auto_1fr] sm:items-center">
        <span className="font-semibold text-blaze-maroon">As a</span>
        <input value={story.asA} list={listId} maxLength={LIMITS.short} onChange={(e) => set({ asA: e.target.value })} placeholder="which user?" className={box} />
        <span className="font-semibold text-blaze-maroon">I want to</span>
        <input value={story.iWant} maxLength={LIMITS.sentence} onChange={(e) => set({ iWant: e.target.value })} placeholder="what they want to do" className={box} />
        <span className="font-semibold text-blaze-maroon">so I can</span>
        <input value={story.soThat} maxLength={LIMITS.sentence} onChange={(e) => set({ soThat: e.target.value })} placeholder="why it matters to them" className={box} />
      </div>
      {storyIsWritten(story) && <p className="mt-3 rounded-lg bg-stone-white px-3 py-2 italic text-ink/80">&ldquo;{storySentence(story)}&rdquo;</p>}
      <Hints hints={storyHints(story, plan.users)} />

      <div data-criteria-box className={`mt-4 rounded-lg border p-3 ${bonus ? "border-trail-orange/50" : "border-ink/10"}`}>
        <p className="font-semibold">How would we know it works?</p>
        <p className="text-sm text-ink/60">Acceptance criteria: checks you could test with a yes or a no. Done means at least {CHECKS_GOAL}.</p>
        <div data-criteria className="mt-2 space-y-2">
          {criteria.map((c, j) => (
            <div key={j} className="flex items-center gap-2">
              <span aria-hidden className="text-ink/40">&bull;</span>
              <input
                value={c}
                maxLength={LIMITS.sentence}
                placeholder={j === 0 ? "Every item has a photo" : "Another check"}
                onChange={(e) => set({ criteria: criteria.map((x, k) => (k === j ? e.target.value : x)) })}
                className={box}
              />
            </div>
          ))}
        </div>
        {criteria.length < LIMITS.criteria && (
          <button onClick={() => set({ criteria: [...criteria, ""] })} className="mt-2 text-sm font-medium text-blaze-maroon">
            + Add a check
          </button>
        )}
      </div>

      <Scenarios scenarios={scenarios} onChange={(next) => set({ scenarios: next })} />

      <DoneList story={story} />
    </Card>
    </div>
  );
}

const KIND_LABEL: Record<LaunchScenario["kind"], { name: string; emoji: string; blurb: string; tone: string }> = {
  happy: { name: "Happy path", emoji: "😀", blurb: "Everything goes right.", tone: "border-emerald-300 bg-emerald-50/60" },
  bad: { name: "Bad day", emoji: "⛈️", blurb: "Something goes wrong. What should the app do?", tone: "border-amber-300 bg-amber-50/60" },
};

/**
 * Given/When/Then, one scenario per card. Given is what is already true, When
 * is what the user does (it becomes a button in the prototype), and Then is
 * what the app does back (what pressing it shows).
 */
export function Scenarios({ scenarios, onChange }: { scenarios: LaunchScenario[]; onChange: (s: LaunchScenario[]) => void }) {
  const box = "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-base focus:border-trail-orange focus:outline-none";
  const set = (i: number, patch: Partial<LaunchScenario>) => onChange(scenarios.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const add = (kind: LaunchScenario["kind"]) => onChange([...scenarios, { kind, given: "", when: "", then: "" }]);
  return (
    <div data-scenarios className="mt-4 rounded-lg border border-ink/10 p-3">
      <p className="font-semibold">Scenarios</p>
      <p className="text-sm text-ink/60">The exact situations. Write a happy path, then a bad day.</p>
      <div className="mt-2 space-y-3">
        {scenarios.map((sc, i) => {
          const k = KIND_LABEL[sc.kind];
          return (
            <div key={i} data-sc className={`rounded-lg border p-3 ${k.tone}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">
                  <span aria-hidden>{k.emoji}</span> {k.name} <span className="font-normal text-ink/60">{k.blurb}</span>
                </p>
                <button onClick={() => onChange(scenarios.filter((_, j) => j !== i))} className="text-xs text-ink/50 hover:text-blaze-maroon">
                  Remove
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-center">
                <span className="font-semibold text-blaze-maroon">Given</span>
                <input value={sc.given} maxLength={LIMITS.sentence} onChange={(e) => set(i, { given: e.target.value })} placeholder={sc.kind === "happy" ? "what is already true" : "what has gone wrong"} className={box} />
                <span className="font-semibold text-blaze-maroon">When</span>
                <input value={sc.when} maxLength={LIMITS.sentence} onChange={(e) => set(i, { when: e.target.value })} placeholder="what the user does" className={box} />
                <span className="font-semibold text-blaze-maroon">Then</span>
                <input value={sc.then} maxLength={LIMITS.sentence} onChange={(e) => set(i, { then: e.target.value })} placeholder="what the app does back" className={box} />
              </div>
            </div>
          );
        })}
      </div>
      {scenarios.length < LIMITS.scenarios && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => add("happy")} className="rounded-md border border-emerald-400 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50">
            + 😀 Happy path
          </button>
          <button onClick={() => add("bad")} className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50">
            + ⛈️ Bad day
          </button>
        </div>
      )}
    </div>
  );
}

/** The Definition of Done, on every story, so "is it done?" is never an opinion. */
export function DoneList({ story }: { story: LaunchStory }) {
  const checks = storyDone(story);
  const done = checks.every((c) => c.ok);
  return (
    <div className={`mt-4 rounded-lg p-3 ${done ? "bg-emerald-600 text-white" : "bg-ink/5"}`}>
      <p className="text-sm font-semibold">{done ? "✓ Done. This story meets the Definition of Done." : "Definition of Done"}</p>
      {!done && (
        <ul className="mt-1 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.key} className={c.ok ? "text-emerald-800" : "text-ink/60"}>
              <span aria-hidden>{c.ok ? "✓" : "○"}</span> {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

