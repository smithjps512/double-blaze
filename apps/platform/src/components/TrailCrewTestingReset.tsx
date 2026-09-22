"use client";

import { useState } from "react";

/**
 * A teacher's reset for one team's testing: every sheet, result and bug.
 *
 * Asks twice, like the board reset, because there is no undo and a class
 * period of testing is not quick to do again.
 */
export function TrailCrewTestingReset({ teams }: { teams: Array<{ slug: string; label: string }> }) {
  const [slug, setSlug] = useState(teams[0]?.slug ?? "");
  const [armed, setArmed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reset() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/trail-crew/test/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team: slug }),
      });
      const data = await res.json();
      setResult(data.ok ? "Testing reset. Every sheet, result and bug is gone." : data.error ?? "Could not reset.");
    } catch {
      setResult("Could not reach the server.");
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  if (teams.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <select
        className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          setArmed(false);
          setResult(null);
        }}
      >
        {teams.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.label}
          </option>
        ))}
      </select>
      {armed ? (
        <>
          <button className="rounded-md bg-trail-orange px-4 py-2 text-sm font-medium text-white" disabled={busy} onClick={reset}>
            {busy ? "Resetting..." : "Yes, wipe this team's testing"}
          </button>
          <button className="text-sm text-ink/60 underline" onClick={() => setArmed(false)}>
            Never mind
          </button>
        </>
      ) : (
        <button
          className="rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
          onClick={() => setArmed(true)}
        >
          Reset this team&rsquo;s testing
        </button>
      )}
      {result && <span className="text-sm text-ink/70">{result}</span>}
    </div>
  );
}
