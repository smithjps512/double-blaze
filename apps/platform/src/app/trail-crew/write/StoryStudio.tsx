"use client";

import { useMemo, useState } from "react";
import {
  checkStory,
  isComplete,
  renderStory,
  testPlanFor,
  suggestPatterns,
  emptyDraft,
  type StoryDraft,
  type StoryCheck,
} from "@double-blaze/prototype-forge";

/**
 * The form, its checks, and the test plan it produces.
 *
 * All three panels run off the same pure module the build script uses, so the
 * test plan a student watches appear here is the same one that will be on their
 * team's test plan page after their teacher approves the story. Nothing is
 * approximated for the sake of the preview.
 *
 * Spark sits underneath and is the only part that calls a model. It is told, at
 * length, not to write the story. The checks above it are deterministic and do
 * the routine work, which means the coach is only ever asked the questions a
 * checklist cannot answer.
 */

interface Team {
  slug: string;
  label: string;
}

const LEVEL_STYLE: Record<StoryCheck["level"], string> = {
  missing: "border-trail-orange bg-trail-orange/5 text-ink",
  weak: "border-amber-400 bg-amber-50 text-ink",
  good: "border-ridge-green/40 bg-ridge-green/5 text-ink/70",
};

const LEVEL_MARK: Record<StoryCheck["level"], string> = {
  missing: "Needed",
  weak: "Think about",
  good: "Good",
};

const FIELD_LABEL: Record<StoryCheck["field"], string> = {
  title: "Name",
  role: "As a",
  want: "I want",
  soThat: "So that",
  criteria: "Acceptance criteria",
  scenarios: "Scenarios",
};

export default function StoryStudio({ teams }: { teams: Team[] }) {
  const [team, setTeam] = useState(teams[0]?.slug ?? "");
  const [draft, setDraft] = useState<StoryDraft>(emptyDraft());
  const [sent, setSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const checks = useMemo(() => checkStory(draft), [draft]);
  const plan = useMemo(() => testPlanFor(draft), [draft]);
  const patterns = useMemo(() => suggestPatterns(draft), [draft]);
  const ready = isComplete(checks);

  const set = <K extends keyof StoryDraft>(key: K, value: StoryDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setCriterion = (i: number, value: string) =>
    set("criteria", draft.criteria.map((c, n) => (n === i ? value : c)));

  const setScenario = (i: number, key: keyof StoryDraft["scenarios"][number], value: string) =>
    set(
      "scenarios",
      draft.scenarios.map((s, n) => (n === i ? { ...s, [key]: value } : s)),
    );

  const submit = async () => {
    setSending(true);
    setFailed(false);
    setSent(null);
    try {
      const res = await fetch("/api/trail-crew/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          team,
          kind: "new",
          story: draft.title.trim(),
          original: "",
          proposed: renderStory(draft),
          reason: `New story. ${plan.cases.length} tests, ${plan.untestable.length} criteria with no test.`,
        }),
      });
      const data = await res.json();
      setFailed(!res.ok || !!data.error);
      setSent(data.message ?? data.error ?? "Something went wrong.");
    } catch {
      setFailed(true);
      setSent("Could not reach the server. Check you are online, then tell your teacher.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ---------------------------------------------------------------- */}
      {/* The form                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <Field label="Which team is this for">
          <select
            className="w-full rounded-md border border-ink/20 bg-white px-3 py-2"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Name it" hint="Two or three words. This becomes its heading in your team's file.">
          <input
            className="w-full rounded-md border border-ink/20 bg-white px-3 py-2"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Add points"
            maxLength={80}
          />
        </Field>

        <h2 className="mt-8 font-display text-xl font-bold text-ink">The narrative</h2>
        <p className="mt-1 text-sm text-ink/60">
          One sentence in three parts. Who, what, and why.
        </p>

        <Field label="As a" hint="A kind of person, not a name. A teacher, a rider, somebody who likes cars.">
          <input
            className="w-full rounded-md border border-ink/20 bg-white px-3 py-2"
            value={draft.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="teacher"
            maxLength={90}
          />
        </Field>

        <Field
          label="I want"
          hint="Finish the sentence &ldquo;I want...&rdquo;. Usually that is &ldquo;to&rdquo; and a verb: to see, to add, to choose."
        >
          <input
            className="w-full rounded-md border border-ink/20 bg-white px-3 py-2"
            value={draft.want}
            onChange={(e) => set("want", e.target.value)}
            placeholder="to add points to a house"
            maxLength={200}
          />
        </Field>

        <Field
          label="So that"
          hint="The half everybody skips. What goes wrong if this feature does not exist?"
        >
          <input
            className="w-full rounded-md border border-ink/20 bg-white px-3 py-2"
            value={draft.soThat}
            onChange={(e) => set("soThat", e.target.value)}
            placeholder="students can see their house going up during the week"
            maxLength={200}
          />
        </Field>

        <h2 className="mt-8 font-display text-xl font-bold text-ink">Acceptance criteria</h2>
        <p className="mt-1 text-sm text-ink/60">
          Your finish line. Each one says something that has to be true before
          this is done, in words somebody could check.
        </p>
        <div className="mt-3 space-y-2">
          {draft.criteria.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="w-full rounded-md border border-ink/20 bg-white px-3 py-2"
                value={c}
                onChange={(e) => setCriterion(i, e.target.value)}
                placeholder={i === 0 ? "A teacher can add up to 50 points at a time" : ""}
                maxLength={240}
              />
              {draft.criteria.length > 1 && (
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-ink/15 px-3 text-sm text-ink/50 hover:border-ink/40"
                  onClick={() => set("criteria", draft.criteria.filter((_, n) => n !== i))}
                  aria-label="Remove this criterion"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm font-medium text-blaze-maroon underline"
          onClick={() => set("criteria", [...draft.criteria, ""])}
        >
          Add another criterion
        </button>

        <h2 className="mt-8 font-display text-xl font-bold text-ink">Scenarios</h2>
        <p className="mt-1 text-sm text-ink/60">
          A story of one time somebody uses it. These are worth the extra typing:
          look at what they do to the test plan.
        </p>
        <div className="mt-3 space-y-4">
          {draft.scenarios.map((s, i) => (
            <div key={i} className="rounded-lg border border-ink/15 bg-white p-4">
              <GwtRow label="Given" value={s.given} placeholder="I am signed in as a teacher"
                onChange={(v) => setScenario(i, "given", v)} />
              <GwtRow label="When" value={s.when} placeholder="I add 10 points to Gryffindor"
                onChange={(v) => setScenario(i, "when", v)} />
              <GwtRow label="Then" value={s.then} placeholder="the scoreboard shows 10 more"
                onChange={(v) => setScenario(i, "then", v)} />
              {draft.scenarios.length > 1 && (
                <button
                  type="button"
                  className="mt-2 text-sm text-ink/50 underline"
                  onClick={() => set("scenarios", draft.scenarios.filter((_, n) => n !== i))}
                >
                  Remove this scenario
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-sm font-medium text-blaze-maroon underline"
          onClick={() => set("scenarios", [...draft.scenarios, { given: "", when: "", then: "" }])}
        >
          Add another scenario
        </button>

        <div className="mt-10 rounded-lg border border-ink/15 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-ink">Send it to your teacher</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            He reads it and decides. If he approves it, the story goes into your
            team&rsquo;s file, your prototype rebuilds with it, and this test plan
            shows up on your team&rsquo;s test plan page. Nothing changes until then.
          </p>
          <button
            type="button"
            className="btn-primary mt-4 disabled:opacity-50"
            disabled={!ready || sending || !team}
            onClick={submit}
          >
            {sending ? "Sending" : "Send it"}
          </button>
          {!ready && (
            <p className="mt-3 text-sm text-ink/60">
              Fill in everything marked <strong>Needed</strong> first. The ones
              marked <em>Think about</em> are advice, not a gate: send it if you
              disagree, and say why to your teacher.
            </p>
          )}
          {sent && (
            <p className={`mt-3 text-sm ${failed ? "text-impact-orange" : "text-ridge-green"}`}>{sent}</p>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* What the story produces                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Panel title="How it is looking" note="Rules, not opinions. You can argue with any of these.">
          <ul className="space-y-2">
            {checks.map((c, i) => (
              <li key={i} className={`rounded-md border-l-4 px-3 py-2 text-sm ${LEVEL_STYLE[c.level]}`}>
                <span className="mr-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                  {LEVEL_MARK[c.level]} · {FIELD_LABEL[c.field]}
                </span>
                {c.message}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Your story"
          note="This is exactly what would go into your team's file."
        >
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-ink/5 p-3 text-sm text-ink">
{renderStory(draft) || "Fill in the narrative and it appears here."}
          </pre>
        </Panel>

        <Panel
          title="The test plan this produces"
          note="Worked out from your story by rule. Nobody wrote it."
        >
          {plan.cases.length === 0 && plan.untestable.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nothing yet. A scenario or a criterion is what makes a test.
            </p>
          ) : (
            <>
              {plan.cases.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink/15 text-left">
                        <th className="py-2 pr-3 font-display font-semibold text-blaze-maroon">#</th>
                        <th className="py-2 pr-3 font-display font-semibold text-blaze-maroon">
                          What somebody does
                        </th>
                        <th className="py-2 font-display font-semibold text-blaze-maroon">
                          It passes when
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.cases.map((c) => (
                        <tr key={c.id} className="border-b border-ink/10 align-top">
                          <td className="py-2 pr-3 text-ink/50">{c.id}</td>
                          <td className="py-2 pr-3">
                            {c.steps ? (
                              c.steps.join(" ")
                            ) : (
                              <span className="text-trail-orange">
                                You write this. What would you actually do to find out?
                              </span>
                            )}
                          </td>
                          <td className="py-2">{c.passesWhen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {plan.cases.some((c) => c.steps === null) && plan.cases.some((c) => c.steps !== null) && (
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  Look at the gaps. Every blank came from an acceptance criterion,
                  which tells you what has to be <strong>true</strong> but never
                  what somebody <strong>does</strong>. Your scenarios filled in
                  both columns by themselves.
                </p>
              )}

              {plan.untestable.length > 0 && (
                <div className="mt-4 rounded-md border-l-4 border-trail-orange bg-trail-orange/5 p-3 text-sm">
                  <p className="font-semibold text-ink">
                    {plan.untestable.length === 1
                      ? "One criterion has no test at all."
                      : `${plan.untestable.length} criteria have no test at all.`}
                  </p>
                  <ul className="mt-2 space-y-2 text-ink/75">
                    {plan.untestable.map((u, i) => (
                      <li key={i}>
                        <em>&ldquo;{u.criterion}&rdquo;</em> — {u.why}.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Panel>

        {patterns.length > 0 && (
          <Panel
            title="What building it would probably take"
            note="A first guess from the words in your own criteria, not a verdict."
          >
            <ul className="space-y-1 text-sm text-ink/80">
              {patterns.map((p) => (
                <li key={p.pattern}>
                  <a
                    className="font-medium text-blaze-maroon underline"
                    href="/build/patterns.html"
                    target="_blank"
                    rel="noopener"
                  >
                    Pattern {p.pattern}: {p.name}
                  </a>{" "}
                  <span className="text-ink/55">because you wrote &ldquo;{p.because}&rdquo;</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <StoryCoach team={team} draft={draft} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-5 block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      {hint && <span className="mb-1 block text-sm text-ink/55">{hint}</span>}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function GwtRow({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mt-2 flex items-center gap-3 first:mt-0">
      <span className="w-14 shrink-0 text-sm font-semibold text-blaze-maroon">{label}</span>
      <input
        className="w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
      />
    </label>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-ink/15 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {note && <p className="mb-3 mt-1 text-sm text-ink/55">{note}</p>}
      {children}
    </section>
  );
}

/**
 * Spark, on the story.
 *
 * It is sent the draft so it can be specific, and its system prompt forbids it
 * from writing any of the words that go in the boxes. The box below says that
 * out loud before they ask, because a student who discovers the limit after
 * three attempts feels tricked and one who is told first uses it properly.
 */
function StoryCoach({ team, draft }: { team: string; draft: StoryDraft }) {
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<Array<{ who: "you" | "spark"; text: string }>>([]);
  const [busy, setBusy] = useState(false);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    setThread((t) => [...t, { who: "you", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/trail-crew/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          team,
          mode: "story",
          question: `${q}\n\nWhat I have written so far:\n${renderStory(draft) || "(nothing yet)"}`,
        }),
      });
      const data = await res.json();
      setThread((t) => [...t, { who: "spark", text: data.answer ?? data.error ?? "Something went wrong." }]);
    } catch {
      setThread((t) => [
        ...t,
        { who: "spark", text: "I could not reach the helper. Check you are online, then ask your teacher." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-ink/15 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">Stuck on the wording?</h2>
      <p className="mb-3 mt-1 text-sm leading-relaxed text-ink/60">
        Ask, and I will help you think it through. <strong>I will not write it
        for you</strong>, on purpose: a story I wrote is not yours, and you are
        the one who has to defend it in the review. Good questions: <em>what
        counts as a criterion?</em> <em>Is my so that any good?</em> <em>Why
        can my criterion not be tested?</em>
      </p>
      <form onSubmit={ask} className="flex gap-2">
        <input
          className="w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your story"
          maxLength={600}
        />
        <button type="submit" className="btn-primary shrink-0 disabled:opacity-50" disabled={busy || !question.trim()}>
          {busy ? "..." : "Ask"}
        </button>
      </form>
      <div className="mt-3 space-y-2" aria-live="polite">
        {thread.map((m, i) => (
          <p
            key={i}
            className={`whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${
              m.who === "you" ? "bg-ink/5 text-ink" : "border-l-4 border-trail-orange bg-trail-orange/5 text-ink/85"
            }`}
          >
            {m.text}
          </p>
        ))}
      </div>
    </section>
  );
}
