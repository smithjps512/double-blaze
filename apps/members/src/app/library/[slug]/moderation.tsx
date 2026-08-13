"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The administrator's remove control, and the undo for it.
 *
 * Present on every article an administrator opens, which is the whole of the
 * moderation surface for now: build plan section 2 settled on publish
 * immediately and remove afterwards, and the reporting path that lets a member
 * raise something is session 9 with the rest of the admin console.
 *
 * Confirmed rather than instant. Removal is visible to the author and reverses
 * cleanly, so this is not a destructive action, but it does take somebody's
 * work out of the library and that is worth one deliberate click.
 */
export function ModerationControls({
  articleId,
  status,
}: {
  articleId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const removing = status !== "removed";

  async function act() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: articleId, action: removing ? "remove" : "restore" }),
      });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "That change could not be saved.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setBusy(false);
      setError("Could not reach the server. Try again.");
    }
  }

  return (
    <div className="notice moderation">
      <p className="muted small">
        You administer this club, so you can take this out of the library. The author
        keeps their copy and is told what happened.
      </p>

      {confirming ? (
        <div className="decide">
          <button type="button" className="danger small" disabled={busy} onClick={act}>
            {busy ? "Working..." : "Yes, take it down"}
          </button>
          <button
            type="button"
            className="quiet small"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Leave it up
          </button>
        </div>
      ) : (
        <div className="decide">
          <button
            type="button"
            className={removing ? "quiet small" : "small"}
            disabled={busy}
            onClick={() => (removing ? setConfirming(true) : act())}
          >
            {removing ? "Remove from the library" : busy ? "Working..." : "Restore as a draft"}
          </button>
        </div>
      )}

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
