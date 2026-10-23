"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LIMITS,
  STORY_GOAL,
  USER_GOAL,
  WHO_ELSE,
  checkTeamName,
  emptyPlan,
  emptyStory,
  progress,
  purposeHints,
  storyHints,
  storyIsWritten,
  storySentence,
  userHints,
  type Hint,
  type LaunchPlan,
  type LaunchStory,
} from "@/lib/launch/plan";

/**
 * Launch Pad: where a sixth grade team writes a purpose, their users, and
 * their first user stories.
 *
 * A form rather than a document, because the boxes are the lesson: a team
 * looking at "As a", "I want to" and "so I can" has been told the shape of a
 * story before anybody explains it, and the box they leave empty is the one
 * worth talking about. The hints under each box are rules from
 * src/lib/launch/plan.ts, not a model, so a hint is always something the team
 * can check for themselves.
 *
 * Saving: every change saves to the class a moment later, and a copy stays on
 * the Chromebook in case the wifi does not. Two Chromebooks on one team are
 * told when they would overwrite each other. No em dashes in any copy here.
 */

type Step = "idea" | "purpose" | "users" | "stories" | "finish";
type SaveState = "saved" | "saving" | "waiting" | "local" | "error";

interface Session {
  period: number;
  teamName: string;
  key: string;
}

interface Conflict {
  teamName: string;
  plan: LaunchPlan;
  rev: number;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const LAST = "launch.last.v1";
const planKey = (s: Session) => `launch.plan.v1.${s.period}.${s.key}`;

function readLocal<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private window or full storage: the class copy is the one that counts */
  }
}

/* ------------------------------------------------------------- pieces */

function Hints({ hints }: { hints: Hint[] }) {
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

function Field({
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

function Card({ children, tint }: { children: React.ReactNode; tint?: boolean }) {
  return <div className={`rounded-xl border border-ink/10 p-5 shadow-sm ${tint ? "bg-blaze-maroon/5" : "bg-white"}`}>{children}</div>;
}

/* ---------------------------------------------------------------- join */

function Join({ onJoin, initial }: { onJoin: (s: Session, found: Conflict | null, offline: boolean) => void; initial: Session | null }) {
  const [period, setPeriod] = useState<number | null>(initial?.period ?? null);
  const [name, setName] = useState(initial?.teamName ?? "");
  const [teams, setTeams] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ session: Session; found: Conflict } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTeams(null);
    if (!period) return;
    fetch(`/api/launch?period=${period}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTeams(d?.teams ?? null))
      .catch(() => setTeams(null));
  }, [period]);

  async function open(teamName = name) {
    setMsg(null);
    setConfirm(null);
    if (!period) return setMsg("Pick your period first.");
    const check = checkTeamName(teamName);
    if (!check.ok) return setMsg(check.error);
    const session = { period, teamName: check.name, key: check.key };
    setBusy(true);
    try {
      const res = await fetch(`/api/launch?period=${period}&team=${encodeURIComponent(check.name)}`, { cache: "no-store" });
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
            {confirm.found.plan.productName ? <> working on &ldquo;{confirm.found.plan.productName}&rdquo;</> : null}. Is that your team?
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

/* --------------------------------------------------------------- steps */

function IdeaStep({ plan, set }: { plan: LaunchPlan; set: (p: Partial<LaunchPlan>) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <h2 className="text-xl font-bold">Your idea</h2>
        <p className="mt-1 text-sm text-ink/70">
          An app, a product, or a program that would make a difference in a community you belong to: our school, Blacksburg, your team, your
          neighborhood. It does not have to be possible yet.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="What is it called?" value={plan.productName} onChange={(v) => set({ productName: v })} placeholder="Finders Keepers" max={LIMITS.short} />
          <Field
            label="Which community is it for?"
            value={plan.community}
            onChange={(v) => set({ community: v })}
            placeholder="Our school, Blacksburg, the rec league..."
            max={LIMITS.short}
          />
          <Field
            label="What is it, in one sentence?"
            help="If you had ten seconds in an elevator, what would you say?"
            value={plan.idea}
            onChange={(v) => set({ idea: v })}
            placeholder="A lost and found you can search from your phone."
            max={LIMITS.sentence}
            area
          />
        </div>
      </Card>
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Stuck?</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink/80">
          <li>What annoys you every week at school?</li>
          <li>What does a new kid not know on day one?</li>
          <li>Who in Blacksburg could use some help?</li>
          <li>What is wasted, lost, or forgotten?</li>
          <li>What would make a club, team, or event easier to run?</li>
        </ul>
      </Card>
    </div>
  );
}

function PurposeStep({ plan, set }: { plan: LaunchPlan; set: (p: Partial<LaunchPlan>) => void }) {
  const name = plan.productName.trim() || "our product";
  const starter = `_____ have a problem: _____. Because of ${name}, _____.`;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Step 1</p>
        <h2 className="text-xl font-bold">Purpose: why should this exist?</h2>
        <p className="mt-1 text-ink/75">
          The purpose is <strong>not what it does</strong>. It is <strong>the impact it has</strong>: who is better off, and how, because it exists.
        </p>
        <div className="mt-4">
          <Field
            label="Our purpose"
            value={plan.purpose}
            onChange={(v) => set({ purpose: v })}
            placeholder="Who has a problem? What changes for them because of your idea?"
            max={LIMITS.sentence * 2}
            area
          />
          {!plan.purpose.trim() && (
            <button onClick={() => set({ purpose: starter })} className="mt-2 text-sm font-medium text-blaze-maroon underline underline-offset-2">
              Give us a sentence starter
            </button>
          )}
          <Hints hints={purposeHints(plan.purpose)} />
        </div>
      </Card>
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Does vs. impact</p>
        <p className="mt-3 text-sm">
          <span className="font-semibold text-ink/50 line-through decoration-ink/30">Does:</span>{" "}
          <span className="text-ink/60">&ldquo;An app that shows photos of the lost and found.&rdquo;</span>
        </p>
        <p className="mt-3 text-sm">
          <span className="font-semibold text-emerald-800">Impact:</span>{" "}
          &ldquo;Kids get their stuff back before it is donated, and families stop buying the same jacket twice.&rdquo;
        </p>
        <p className="mt-4 text-sm text-ink/70">Test: read it out loud. Would somebody outside your team say &ldquo;oh, that matters&rdquo;?</p>
      </Card>
    </div>
  );
}

function UsersStep({ plan, set }: { plan: LaunchPlan; set: (p: Partial<LaunchPlan>) => void }) {
  const users = plan.users;
  const update = (i: number, patch: Partial<LaunchPlan["users"][number]>) =>
    set({ users: users.map((u, j) => (j === i ? { ...u, ...patch } : u)) });
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Step 2</p>
        <h2 className="text-xl font-bold">Who are the users?</h2>
        <p className="mt-1 text-ink/75">
          There is <strong>always more than one</strong>. For each kind of person, write one sentence about what is important to them.
        </p>
        <div className="mt-4 space-y-4">
          {users.map((u, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-ink/10 bg-stone-white p-3 sm:grid-cols-[12rem_1fr_auto]">
              <Field label={`User ${i + 1}`} value={u.name} onChange={(v) => update(i, { name: v })} placeholder={i === 0 ? "Students" : "Who else?"} max={LIMITS.short} />
              <Field
                label="What matters to them?"
                value={u.cares}
                onChange={(v) => update(i, { cares: v })}
                placeholder="They want... because..."
                max={LIMITS.sentence}
              />
              {users.length > 1 && (
                <button
                  onClick={() => set({ users: users.filter((_, j) => j !== i) })}
                  className="self-end rounded-md px-2 py-2 text-sm text-ink/50 hover:bg-ink/5 hover:text-blaze-maroon"
                  aria-label={`Remove user ${i + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {users.length < LIMITS.users && (
          <button onClick={() => set({ users: [...users, { name: "", cares: "" }] })} className="mt-3 rounded-md border border-blaze-maroon px-4 py-2 font-medium text-blaze-maroon hover:bg-blaze-maroon/5">
            + Add another user
          </button>
        )}
        <Hints hints={userHints(users)} />
      </Card>
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Who else?</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink/80">
          {WHO_ELSE.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink/70">
          Users often want different things. A student wants it fast. A teacher wants it fair. Noticing that is the job.
        </p>
      </Card>
    </div>
  );
}

function StoryCard({
  story,
  i,
  plan,
  onChange,
  onRemove,
}: {
  story: LaunchStory;
  i: number;
  plan: LaunchPlan;
  onChange: (s: LaunchStory) => void;
  onRemove?: () => void;
}) {
  const [bonus, setBonus] = useState(story.criteria.some((c) => c.trim()));
  const set = (patch: Partial<LaunchStory>) => onChange({ ...story, ...patch });
  const box = "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-base focus:border-trail-orange focus:outline-none";
  const listId = `launch-users-${i}`;
  const criteria = story.criteria.length ? story.criteria : [""];
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Story {i + 1}</p>
        {onRemove && (
          <button onClick={onRemove} className="text-sm text-ink/50 hover:text-blaze-maroon">
            Remove
          </button>
        )}
      </div>
      <div className="mt-2">
        <Field label="Feature name" help="Two or three words." value={story.feature} onChange={(v) => set({ feature: v })} placeholder="Photo search" max={LIMITS.short} />
      </div>
      <datalist id={listId}>
        {plan.users.filter((u) => u.name.trim()).map((u) => (
          <option key={u.name} value={u.name} />
        ))}
      </datalist>
      <div className="mt-4 grid gap-3 text-lg sm:grid-cols-[auto_1fr] sm:items-center">
        <span className="font-semibold text-blaze-maroon">As a</span>
        <input value={story.asA} list={listId} maxLength={LIMITS.short} onChange={(e) => set({ asA: e.target.value })} placeholder="which user?" className={box} />
        <span className="font-semibold text-blaze-maroon">I want to</span>
        <input value={story.iWant} maxLength={LIMITS.sentence} onChange={(e) => set({ iWant: e.target.value })} placeholder="what they want to do" className={box} />
        <span className="font-semibold text-blaze-maroon">so I can</span>
        <input value={story.soThat} maxLength={LIMITS.sentence} onChange={(e) => set({ soThat: e.target.value })} placeholder="why it matters to them" className={box} />
      </div>
      {storyIsWritten(story) && <p className="mt-3 rounded-lg bg-stone-white px-3 py-2 italic text-ink/80">&ldquo;{storySentence(story)}&rdquo;</p>}
      <Hints hints={storyHints(story, plan.users)} />

      {!bonus ? (
        <button onClick={() => setBonus(true)} className="mt-4 text-sm font-medium text-blaze-maroon underline underline-offset-2">
          Bonus: how would we know it works?
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-ink/20 p-3">
          <p className="font-semibold">Bonus: acceptance criteria</p>
          <p className="text-sm text-ink/60">How would you check this feature works? One thing per line.</p>
          <div className="mt-2 space-y-2">
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
      )}
    </Card>
  );
}

function StoriesStep({ plan, set }: { plan: LaunchPlan; set: (p: Partial<LaunchPlan>) => void }) {
  const stories = plan.stories;
  return (
    <div className="space-y-5">
      <Card tint>
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">Step 3</p>
        <h2 className="text-xl font-bold">User stories</h2>
        <p className="mt-1 text-ink/80">
          Each story is one feature, told from one user&rsquo;s point of view. <strong>Who</strong> wants it, <strong>what</strong> they want, and{" "}
          <strong>why</strong> it matters to them. Write at least {STORY_GOAL}. Try using a different user for each one.
        </p>
      </Card>
      {stories.map((s, i) => (
        <StoryCard
          key={i}
          i={i}
          story={s}
          plan={plan}
          onChange={(next) => set({ stories: stories.map((x, j) => (j === i ? next : x)) })}
          onRemove={stories.length > 1 ? () => set({ stories: stories.filter((_, j) => j !== i) }) : undefined}
        />
      ))}
      {stories.length < LIMITS.stories && (
        <button onClick={() => set({ stories: [...stories, emptyStory()] })} className="rounded-md border border-blaze-maroon px-4 py-2 font-medium text-blaze-maroon hover:bg-blaze-maroon/5">
          + Add another story
        </button>
      )}
    </div>
  );
}

function FinishStep({ plan, session }: { plan: LaunchPlan; session: Session }) {
  const p = progress(plan);
  const users = plan.users.filter((u) => u.name.trim());
  const stories = plan.stories.filter(storyIsWritten);
  const checks: Array<[boolean, string]> = [
    [p.purpose, "A purpose that says the impact, not just what it does"],
    [p.users >= USER_GOAL, `At least ${USER_GOAL} users, each with a sentence (you have ${p.users})`],
    [p.stories >= STORY_GOAL, `At least ${STORY_GOAL} complete user stories (you have ${p.stories})`],
  ];
  return (
    <div className="space-y-5">
      <Card tint>
        <h2 className="text-xl font-bold">Read it out loud</h2>
        <p className="mt-1 text-ink/75">This is what your teacher will use to build your prototype. Read it together. Does it sound like your idea?</p>
        <ul className="mt-3 space-y-1.5">
          {checks.map(([ok, text]) => (
            <li key={text} className={ok ? "text-emerald-800" : "text-ink/70"}>
              <span aria-hidden>{ok ? "✓" : "○"}</span> {text}
            </li>
          ))}
          <li className="text-ink/60">
            <span aria-hidden>{p.criteria > 0 ? "★" : "☆"}</span> Bonus: acceptance criteria on {p.criteria} {p.criteria === 1 ? "story" : "stories"}
          </li>
        </ul>
      </Card>
      <Card>
        <p className="text-sm text-ink/60">
          {session.teamName} &middot; Period {session.period}
          {plan.community.trim() ? <> &middot; for {plan.community.trim()}</> : null}
        </p>
        <h3 className="mt-1 font-display text-2xl font-bold text-blaze-maroon">{plan.productName.trim() || "Untitled idea"}</h3>
        {plan.idea.trim() && <p className="mt-1 text-ink/80">{plan.idea.trim()}</p>}
        <h4 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">Purpose</h4>
        <p className="mt-1">{plan.purpose.trim() || <em className="text-ink/50">Not written yet.</em>}</p>
        <h4 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">Users</h4>
        {users.length === 0 ? (
          <p className="mt-1 italic text-ink/50">Not written yet.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {users.map((u, i) => (
              <li key={i}>
                <strong>{u.name.trim()}:</strong> {u.cares.trim() || <em className="text-ink/50">what matters to them?</em>}
              </li>
            ))}
          </ul>
        )}
        <h4 className="mt-5 font-semibold uppercase tracking-wide text-trail-orange">User stories</h4>
        {stories.length === 0 ? (
          <p className="mt-1 italic text-ink/50">None finished yet.</p>
        ) : (
          <ol className="mt-1 list-decimal space-y-3 pl-5">
            {stories.map((s, i) => (
              <li key={i}>
                {s.feature.trim() && <span className="font-semibold">{s.feature.trim()}: </span>}
                {storySentence(s)}
                {s.criteria.some((c) => c.trim()) && (
                  <ul className="mt-1 list-disc pl-5 text-sm text-ink/70">
                    {s.criteria.filter((c) => c.trim()).map((c, j) => (
                      <li key={j}>{c.trim()}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- shell */

export default function LaunchPad({ exampleHref }: { exampleHref?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<LaunchPlan>(emptyPlan);
  const [step, setStep] = useState<Step>("idea");
  const [save, setSave] = useState<SaveState>("saved");
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const rev = useRef(0);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offline = useRef(false);

  useEffect(() => {
    setLastSession(readLocal<Session>(LAST));
  }, []);

  const push = useCallback(
    async (s: Session, p: LaunchPlan) => {
      if (offline.current) return setSave("local");
      setSave("saving");
      try {
        const res = await fetch("/api/launch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ period: s.period, team: s.teamName, plan: p, rev: rev.current }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          rev.current = data.rev;
          dirty.current = false;
          return setSave("saved");
        }
        if (res.status === 409 && data.conflict) return setConflict(data.conflict as Conflict), setSave("waiting");
        if (res.status === 429) {
          timer.current = setTimeout(() => push(s, p), 3000);
          return;
        }
        if (res.status === 503) offline.current = true;
        setSave(res.status === 503 ? "local" : "error");
      } catch {
        setSave("error");
      }
    },
    [],
  );

  // The latest plan, for typing that lands before React has re-rendered.
  const planRef = useRef(plan);
  planRef.current = plan;

  const update = useCallback(
    (patch: Partial<LaunchPlan>) => {
      if (!session) return;
      const next = { ...planRef.current, ...patch };
      planRef.current = next;
      setPlan(next);
      writeLocal(planKey(session), { plan: next, rev: rev.current });
      dirty.current = true;
      if (conflict) return;
      setSave("waiting");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => push(session, next), 1200);
    },
    [session, conflict, push],
  );

  // Last chance to save when a Chromebook lid closes or the tab goes away.
  useEffect(() => {
    const flush = () => {
      if (!session || !dirty.current || conflict || offline.current) return;
      navigator.sendBeacon?.(
        "/api/launch",
        new Blob([JSON.stringify({ period: session.period, team: session.teamName, plan, rev: rev.current })], { type: "application/json" }),
      );
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [session, plan, conflict]);

  function join(s: Session, found: Conflict | null, isOffline: boolean) {
    offline.current = isOffline;
    writeLocal(LAST, s);
    setSession(s);
    setConflict(null);
    const local = readLocal<{ plan: LaunchPlan; rev: number }>(planKey(s));
    if (found) {
      // The class copy wins unless this Chromebook has unsaved work on top of it.
      const mine = local && local.rev === found.rev && JSON.stringify(local.plan) !== JSON.stringify(found.plan) ? local.plan : null;
      rev.current = found.rev;
      setPlan(mine ?? found.plan);
      if (mine) {
        dirty.current = true;
        setTimeout(() => push(s, mine), 0);
      } else setSave("saved");
      setStep(found.plan.purpose.trim() ? "stories" : "idea");
    } else {
      rev.current = 0;
      setPlan(local?.plan ?? emptyPlan());
      setSave(isOffline ? "local" : "saved");
      setStep("idea");
    }
  }

  async function refresh() {
    if (!session || offline.current) return;
    const res = await fetch(`/api/launch?period=${session.period}&team=${encodeURIComponent(session.teamName)}`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    rev.current = data.rev;
    dirty.current = false;
    setPlan(data.plan);
    writeLocal(planKey(session), { plan: data.plan, rev: data.rev });
    setSave("saved");
  }

  function resolve(keep: "theirs" | "mine") {
    if (!session || !conflict) return;
    rev.current = conflict.rev;
    if (keep === "theirs") {
      setPlan(conflict.plan);
      dirty.current = false;
      writeLocal(planKey(session), { plan: conflict.plan, rev: conflict.rev });
      setSave("saved");
    } else push(session, plan);
    setConflict(null);
  }

  const p = progress(plan);
  const steps: Array<{ id: Step; label: string; done: boolean }> = [
    { id: "idea", label: "Your idea", done: !!(plan.productName.trim() && plan.idea.trim()) },
    { id: "purpose", label: "1. Purpose", done: p.purpose },
    { id: "users", label: `2. Users (${p.users})`, done: p.users >= USER_GOAL },
    { id: "stories", label: `3. Stories (${p.stories}/${STORY_GOAL})`, done: p.stories >= STORY_GOAL },
    { id: "finish", label: "Read it out loud", done: p.done },
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
    <div className="min-h-screen bg-stone-white">
      <div className="container-page py-6 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Launch Pad</p>
            <h1 className="text-3xl font-bold md:text-4xl">Start a plan for anything</h1>
            <p className="mt-1 max-w-2xl text-ink/70">Purpose, users, and user stories: the first three things every real product team writes down.</p>
          </div>
          {session && (
            <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm">
              <p className="font-semibold">
                {session.teamName} &middot; Period {session.period}
              </p>
              <p className={save === "saved" ? "text-emerald-700" : save === "error" ? "text-blaze-maroon" : "text-ink/60"}>{saveText[save]}</p>
              <div className="mt-1 flex gap-3">
                {!offline.current && (
                  <button onClick={refresh} disabled={dirty.current} className="text-blaze-maroon underline underline-offset-2 disabled:opacity-40" title="Load what your teammates saved">
                    Refresh
                  </button>
                )}
                <button onClick={() => setSession(null)} className="text-ink/60 underline underline-offset-2">
                  Switch team
                </button>
              </div>
            </div>
          )}
        </header>

        {!session ? (
          <div className="mt-6 max-w-3xl">
            {/* Keyed so the form picks up the remembered team once it has been read from the Chromebook. */}
            <Join key={lastSession ? `${lastSession.period}.${lastSession.key}` : "new"} onJoin={join} initial={lastSession} />
            {exampleHref && (
              <p className="mt-4 text-sm text-ink/70">
                Want to see where this goes?{" "}
                <a href={exampleHref} target="_blank" rel="noopener" className="font-medium text-blaze-maroon underline underline-offset-2">
                  Open the Finders Keepers example prototype
                </a>
                , built from nothing but a purpose, users, and four user stories.
              </p>
            )}
          </div>
        ) : (
          <>
            {conflict && (
              <div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                <p className="font-semibold">A teammate saved changes from another Chromebook while you were typing.</p>
                <p className="text-sm text-ink/70">Decide together which one to keep. The other one is replaced.</p>
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

            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Steps">
              {steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  aria-current={step === s.id ? "step" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${step === s.id ? "bg-ink text-white" : "bg-white text-ink hover:bg-ink/5"}`}
                >
                  {s.done && <span aria-label="done">✓ </span>}
                  {s.label}
                </button>
              ))}
            </nav>

            <main className="mt-5">
              {step === "idea" && <IdeaStep plan={plan} set={update} />}
              {step === "purpose" && <PurposeStep plan={plan} set={update} />}
              {step === "users" && <UsersStep plan={plan} set={update} />}
              {step === "stories" && <StoriesStep plan={plan} set={update} />}
              {step === "finish" && <FinishStep plan={plan} session={session} />}
            </main>

            {nextStep && (
              <div className="mt-6 flex justify-end">
                <button className="btn-primary" onClick={() => { setStep(nextStep); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  Next: {steps.find((s) => s.id === nextStep)?.label}
                </button>
              </div>
            )}
            <p className="mt-8 text-sm text-ink/50">
              Tip: one person types and everyone else helps decide. Teammates can open the same team on their Chromebook and press Refresh to read along.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
