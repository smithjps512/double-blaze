"use client";

import { useEffect, useState } from "react";
import { BREAK_IT_TESTS } from "@double-blaze/prototype-forge";
import type { BugView, CardTestingView, TeamTestingShape } from "@/lib/trail-crew-testing-shape";

/**
 * The sheet itself.
 *
 * Five parts, the same as the paper one. A tester starts a sheet (which gives
 * it a number, not a name), records each card as pass or fail with what they
 * did and what happened, tries the six ways to break it, reports bugs, and
 * finishes with ratings and their own words. Every save goes straight to the
 * server and the page re-reads the team's state from the answer, so the card
 * counts and the open bugs on this page are the same ones the project board
 * and the priority board show.
 *
 * Open bugs are on the card they belong to, with a re-test control: run the
 * steps again, and say whether it still happens. That is the only way a bug
 * closes, and the page says so.
 *
 * The sheet id lives in sessionStorage so a refresh keeps the tester on the
 * sheet they started. Nothing else is stored in the browser.
 */

const RATINGS = [
  "I could work out what to do without being told.",
  "The app does what the team's build cards say it does.",
  "It looks like it belongs to this team (their plan, their design).",
  "I would use this if it were real.",
  "You can tell the team put effort into this.",
];

const SEVERITY_LABEL: Record<1 | 2 | 3, string> = { 1: "1 small", 2: "2 annoying", 3: "3 cannot continue" };

const VERDICT_STYLE: Record<CardTestingView["verdict"], string> = {
  untested: "border-ink/15 bg-white text-ink/50",
  passing: "border-ridge-green/50 bg-ridge-green/10 text-ridge-green",
  failing: "border-trail-orange/60 bg-trail-orange/10 text-trail-orange",
};

const VERDICT_LABEL: Record<CardTestingView["verdict"], string> = {
  untested: "Not tested yet",
  passing: "Passing",
  failing: "Failing",
};

interface Saved {
  id: string | null;
  tester: string | null;
}

export function TestSheet({ team, initial }: { team: string; initial: TeamTestingShape }) {
  const [state, setState] = useState<TeamTestingShape>(initial);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [tester, setTester] = useState<string | null>(null);
  const [device, setDevice] = useState("Chromebook");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const storageKey = `trail-crew-sheet:${team}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { id: string; tester: string };
        setSheetId(saved.id);
        setTester(saved.tester);
      }
    } catch {
      // No sheet remembered. The tester starts one.
    }
  }, [storageKey]);

  async function post(payload: Record<string, unknown>): Promise<Saved | null> {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/trail-crew/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Could not save that.");
        return null;
      }
      if (data.cards) setState(data as TeamTestingShape);
      return (data.saved as Saved) ?? { id: null, tester: null };
    } catch {
      setError("Could not reach the server. Check you are online.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const saved = await post({ action: "start", device });
    if (saved?.id) {
      setSheetId(saved.id);
      setTester(saved.tester);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ id: saved.id, tester: saved.tester }));
      } catch {
        // A refresh will lose the sheet number. The results are saved regardless.
      }
    }
  }

  function newSheet() {
    setSheetId(null);
    setTester(null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Nothing to forget.
    }
  }

  return (
    <div className="max-w-3xl">
      <Summary state={state} />

      {error && (
        <p className="mt-4 rounded-md border border-trail-orange/40 bg-trail-orange/5 px-4 py-2 text-sm text-ink/80">{error}</p>
      )}
      {note && <p className="mt-4 rounded-md border border-ridge-green/40 bg-ridge-green/5 px-4 py-2 text-sm text-ink/80">{note}</p>}

      <section className="mt-8 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-bold text-blaze-maroon">Before you start</h2>
        {sheetId ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-ridge-green/50 bg-ridge-green/10 px-3 py-1 font-medium text-ridge-green">
              You are {tester ?? "a tester"}
            </span>
            <span className="text-ink/60">Everything you record below goes on this sheet.</span>
            <button type="button" className="text-ink/60 underline" onClick={newSheet}>
              Somebody else is testing now
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">Device</span>
              <select className="mt-1 rounded-md border border-ink/15 bg-white px-3 py-2" value={device} onChange={(e) => setDevice(e.target.value)}>
                <option>Chromebook</option>
                <option>Phone</option>
                <option>Other</option>
              </select>
            </label>
            <button type="button" className="btn-primary" disabled={busy} onClick={start}>
              {busy ? "Starting..." : "Start a sheet"}
            </button>
            <span className="text-sm text-ink/60">The sheet gets a number, not your name.</span>
          </div>
        )}
        <p className="mt-4 text-sm text-ink/70">
          Open the app next to this page. Sign in or join with a made up name. You are
          testing the app, not the person: write what happened, not what you think of the team.
        </p>
      </section>

      <h2 className="mt-10 font-display text-2xl font-bold text-ink">Part 1: The cards</h2>
      <p className="mt-2 text-sm text-ink/70">
        Pick the cards you have time for. Five is a good test. Do the steps in the story,
        check every Done when line, then say what happened and whether it passed.
      </p>
      <ol className="mt-5 space-y-5">
        {state.cards.map((card) => (
          <CardRow key={card.slug} card={card} sheetId={sheetId} busy={busy} post={post} onSaved={setNote} />
        ))}
      </ol>

      <h2 className="mt-12 font-display text-2xl font-bold text-ink">Part 2: Try to break it</h2>
      <p className="mt-2 text-sm text-ink/70">
        A real app is tested by people who are not careful. Be one of them, on purpose. If
        the app handled it well, say so and move on. If it did not, say what happened, and
        it becomes a bug for the team.
      </p>
      <ol className="mt-5 space-y-3">
        {BREAK_IT_TESTS.map((test, i) => (
          <BreakRow key={test} index={i} test={test} sheetId={sheetId} busy={busy} post={post} onSaved={setNote} />
        ))}
      </ol>

      <h2 className="mt-12 font-display text-2xl font-bold text-ink">Part 3: Bugs you found</h2>
      <p className="mt-2 text-sm text-ink/70">
        Anything that did not work, looked wrong, or confused you. Steps matter more than
        opinions: a bug the team can make happen again is a bug they can fix.
      </p>
      <BugForm cards={state.cards} sheetId={sheetId} busy={busy} post={post} onSaved={setNote} />
      {state.unplacedBugs.length > 0 && (
        <div className="mt-5 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink">Open bugs not about one card</h3>
          <ul className="mt-2 space-y-3">
            {state.unplacedBugs.map((b) => (
              <BugRow key={b.id} bug={b} sheetId={sheetId} busy={busy} post={post} onSaved={setNote} />
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-12 font-display text-2xl font-bold text-ink">Parts 4 and 5: Your ratings, your words</h2>
      <FinishForm sheetId={sheetId} busy={busy} post={post} onSaved={setNote} />
    </div>
  );
}

function Summary({ state }: { state: TeamTestingShape }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <span className="font-semibold text-ink">
        {state.sheets} {state.sheets === 1 ? "sheet" : "sheets"} so far
      </span>
      <span className="text-hokie-gray">
        {state.passes} pass, {state.fails} fail
      </span>
      <span className={state.openBugs > 0 ? "text-trail-orange" : "text-hokie-gray"}>
        {state.openBugs} open {state.openBugs === 1 ? "bug" : "bugs"}
      </span>
      {state.fixedBugs > 0 && <span className="text-ridge-green">{state.fixedBugs} fixed</span>}
    </div>
  );
}

interface RowProps {
  sheetId: string | null;
  busy: boolean;
  post: (payload: Record<string, unknown>) => Promise<Saved | null>;
  onSaved: (note: string) => void;
}

function CardRow({ card, sheetId, busy, post, onSaved }: RowProps & { card: CardTestingView }) {
  const [whatIDid, setWhatIDid] = useState("");
  const [whatHappened, setWhatHappened] = useState("");

  async function record(outcome: "pass" | "fail") {
    if (outcome === "fail" && !whatHappened.trim()) {
      onSaved("A fail needs a note about what was different. That note is the bug report.");
      return;
    }
    const saved = await post({ action: "result", sheetId, card: card.slug, outcome, whatIDid, whatHappened });
    if (saved) {
      setWhatIDid("");
      setWhatHappened("");
      onSaved(`Card ${card.number} recorded as ${outcome === "pass" ? "a pass" : "a fail"}.`);
    }
  }

  return (
    <li className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-blaze-maroon">
          <span className="text-hokie-gray">Card {card.number}:</span> {card.title}
        </h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${VERDICT_STYLE[card.verdict]}`}>
          {VERDICT_LABEL[card.verdict]}
          {card.passes + card.fails > 0 && ` (${card.passes} pass, ${card.fails} fail)`}
        </span>
      </div>
      {card.story && <p className="mt-2 text-sm leading-relaxed text-ink/75">{card.story}</p>}
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-hokie-gray">Done when</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
        {card.criteria.map((c) => (
          <li key={c}>{c}</li>
        ))}
        {card.criteria.length === 0 && <li className="list-none text-ink/60">This card has no Done when lines. That is a finding: report it as a bug.</li>}
      </ul>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">What I did (the steps)</span>
          <textarea className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2" rows={2} value={whatIDid} onChange={(e) => setWhatIDid(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">What actually happened</span>
          <textarea className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2" rows={2} value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-md bg-ridge-green px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={busy} onClick={() => record("pass")}>
          Pass
        </button>
        <button type="button" className="rounded-md bg-trail-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={busy} onClick={() => record("fail")}>
          Fail
        </button>
        {!sheetId && <span className="text-xs text-ink/50">Start a sheet above so this lands on it. It saves either way.</span>}
      </div>

      {card.openBugs.length > 0 && (
        <div className="mt-4 border-t border-ink/10 pt-3">
          <h4 className="text-sm font-semibold text-trail-orange">Open bugs on this card</h4>
          <ul className="mt-2 space-y-3">
            {card.openBugs.map((b) => (
              <BugRow key={b.id} bug={b} sheetId={sheetId} busy={busy} post={post} onSaved={onSaved} />
            ))}
          </ul>
        </div>
      )}
      {card.fixedBugs.length > 0 && (
        <p className="mt-3 text-xs text-ridge-green">
          Fixed: {card.fixedBugs.map((b) => b.title).join("; ")}
        </p>
      )}
    </li>
  );
}

function BugRow({ bug, sheetId, busy, post, onSaved }: RowProps & { bug: BugView }) {
  async function retest(outcome: "pass" | "fail") {
    const saved = await post({ action: "result", sheetId, bug: bug.id, outcome });
    if (saved) onSaved(outcome === "pass" ? "It did not happen again. The bug is closed." : "It still happens. The bug stays open and the count goes up.");
  }
  return (
    <li className="text-sm">
      <p className="text-ink">
        {bug.title}
        {bug.severity && <span className="text-hokie-gray"> (how bad: {SEVERITY_LABEL[bug.severity]})</span>}
      </p>
      {bug.steps && <p className="mt-0.5 text-ink/70">To make it happen: {bug.steps}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-hokie-gray">
          Re-test: do those steps again.
          {bug.stillHappened > 0 && ` Still happened ${bug.stillHappened} ${bug.stillHappened === 1 ? "time" : "times"} so far.`}
        </span>
        <button type="button" className="rounded-md border border-ridge-green/60 px-2.5 py-1 font-medium text-ridge-green disabled:opacity-50" disabled={busy} onClick={() => retest("pass")}>
          Did not happen
        </button>
        <button type="button" className="rounded-md border border-trail-orange/60 px-2.5 py-1 font-medium text-trail-orange disabled:opacity-50" disabled={busy} onClick={() => retest("fail")}>
          Still happens
        </button>
      </div>
    </li>
  );
}

function BreakRow({ index, test, sheetId, busy, post, onSaved }: RowProps & { index: number; test: string }) {
  const [whatHappened, setWhatHappened] = useState("");
  const [done, setDone] = useState<"yes" | "no" | null>(null);

  async function answer(handled: boolean) {
    if (!handled && !whatHappened.trim()) {
      onSaved("Say what happened first. That sentence becomes the bug.");
      return;
    }
    const saved = await post({ action: "break", sheetId, index, handled, whatHappened });
    if (saved) {
      setDone(handled ? "yes" : "no");
      onSaved(handled ? "Handled well. Nothing to fix there." : "That became a bug for the team.");
    }
  }

  return (
    <li className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-sm text-ink">{test}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-ink/15 px-3 py-1.5 text-sm"
          placeholder="What happened"
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
        />
        {done ? (
          <span className={`text-xs font-medium ${done === "yes" ? "text-ridge-green" : "text-trail-orange"}`}>
            {done === "yes" ? "Handled well" : "Reported as a bug"}
          </span>
        ) : (
          <>
            <button type="button" className="rounded-md border border-ridge-green/60 px-3 py-1.5 text-xs font-medium text-ridge-green disabled:opacity-50" disabled={busy} onClick={() => answer(true)}>
              Handled well
            </button>
            <button type="button" className="rounded-md border border-trail-orange/60 px-3 py-1.5 text-xs font-medium text-trail-orange disabled:opacity-50" disabled={busy} onClick={() => answer(false)}>
              Not handled
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function BugForm({ cards, sheetId, busy, post, onSaved }: RowProps & { cards: CardTestingView[] }) {
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [severity, setSeverity] = useState<1 | 2 | 3 | null>(null);
  const [card, setCard] = useState("");

  async function submit() {
    const saved = await post({ action: "bug", sheetId, card: card || undefined, title, steps, severity });
    if (saved) {
      setTitle("");
      setSteps("");
      setSeverity(null);
      setCard("");
      onSaved("Bug reported. It is on the team's board now.");
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="grid gap-3">
        <label className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">What went wrong (one sentence)</span>
          <input className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={240} />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">How to make it happen again (steps)</span>
          <textarea className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2" rows={2} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="text-sm">
            <legend className="text-xs font-semibold uppercase tracking-wide text-hokie-gray">How bad?</legend>
            <div className="mt-1 flex gap-1" role="radiogroup">
              {([1, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={severity === s}
                  onClick={() => setSeverity(severity === s ? null : s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    severity === s ? "border-trail-orange/60 bg-trail-orange/10 text-trail-orange" : "border-ink/15 text-ink/60"
                  }`}
                >
                  {SEVERITY_LABEL[s]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">Which card is it about?</span>
            <select className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2" value={card} onChange={(e) => setCard(e.target.value)}>
              <option value="">Not sure, or the whole app</option>
              {cards.map((c) => (
                <option key={c.slug} value={c.slug}>
                  Card {c.number}: {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <button type="button" className="btn-primary" disabled={busy || !title.trim()} onClick={submit}>
            Report this bug
          </button>
        </div>
      </div>
    </div>
  );
}

function FinishForm({ sheetId, busy, post, onSaved }: RowProps) {
  const [ratings, setRatings] = useState<Array<number | null>>([null, null, null, null, null]);
  const [keep, setKeep] = useState(["", ""]);
  const [change, setChange] = useState(["", ""]);
  const [missing, setMissing] = useState("");
  const [finished, setFinished] = useState(false);

  async function submit() {
    const saved = await post({
      action: "finish",
      sheetId,
      ratings: ratings.every((r) => r !== null) ? ratings : null,
      keep: keep.filter((k) => k.trim()),
      change: change.filter((c) => c.trim()),
      missingStory: missing,
    });
    if (saved) {
      setFinished(true);
      onSaved("Sheet finished. Thank you for testing.");
    }
  }

  if (!sheetId) {
    return <p className="mt-3 text-sm text-ink/60">Start a sheet at the top of the page to fill this part in.</p>;
  }

  return (
    <div className="mt-5 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-hokie-gray">
            <th className="pb-2 font-semibold">Statement</th>
            <th className="pb-2 text-center font-semibold">1 No</th>
            <th className="pb-2 text-center font-semibold">2</th>
            <th className="pb-2 text-center font-semibold">3</th>
            <th className="pb-2 text-center font-semibold">4</th>
            <th className="pb-2 text-center font-semibold">5 Yes</th>
          </tr>
        </thead>
        <tbody>
          {RATINGS.map((statement, i) => (
            <tr key={statement} className="border-t border-ink/10">
              <td className="py-2 pr-2 text-ink">{statement}</td>
              {[1, 2, 3, 4, 5].map((n) => (
                <td key={n} className="py-2 text-center">
                  <input
                    type="radio"
                    name={`rating-${i}`}
                    className="accent-blaze-maroon"
                    checked={ratings[i] === n}
                    onChange={() => setRatings(ratings.map((r, j) => (j === i ? n : r)))}
                    aria-label={`${statement} ${n}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hokie-gray">Two things the team should keep exactly as they are</p>
          {keep.map((k, i) => (
            <input key={i} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-1.5 text-sm" value={k} onChange={(e) => setKeep(keep.map((v, j) => (j === i ? e.target.value : v)))} />
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hokie-gray">Two things the team should change</p>
          {change.map((c, i) => (
            <input key={i} className="mt-1 w-full rounded-md border border-ink/15 px-3 py-1.5 text-sm" value={c} onChange={(e) => setChange(change.map((v, j) => (j === i ? e.target.value : v)))} />
          ))}
        </div>
      </div>
      <label className="mt-4 block text-sm">
        <span className="block text-xs font-semibold uppercase tracking-wide text-hokie-gray">One story that is missing</span>
        <span className="block text-xs text-ink/60">Something you wanted to do and could not, as a user story: As a ..., I want ..., so that ...</span>
        <textarea className="mt-1 w-full rounded-md border border-ink/15 px-3 py-2" rows={2} value={missing} onChange={(e) => setMissing(e.target.value)} />
      </label>
      <div className="mt-4">
        <button type="button" className="btn-primary" disabled={busy || finished} onClick={submit}>
          {finished ? "Finished" : "Finish this sheet"}
        </button>
      </div>
    </div>
  );
}
