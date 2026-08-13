"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type AssignableRole,
} from "@/lib/admin";

/**
 * The interactive parts of the approval queue.
 *
 * Both talk to the same endpoint and both refresh the page rather than editing
 * a local copy of the list. That is deliberate: two administrators working the
 * same queue is the ordinary case, and a screen that reflects the database
 * after every action is the cheapest way to stop one of them acting on what the
 * other already decided. The endpoint refuses a second decision anyway, and
 * this is what makes the refusal rare rather than routine.
 */

async function send(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; emailed?: boolean }> {
  try {
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "That did not work. Try again." };
    return { ok: true, emailed: data.emailed };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again." };
  }
}

export function DecisionButtons({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function decide(action: "approve" | "decline") {
    setBusy(action);
    setError(null);
    const result = await send({ memberId, action });
    if (!result.ok) {
      setError(result.error ?? null);
      setBusy(null);
      return;
    }
    if (result.emailed === false) {
      // The decision is saved either way. This is the administrator's only
      // chance to find out that the person was not told, since nothing else in
      // the build reports it to a human.
      setError(`Saved, but the email to ${name} did not send. Tell them another way.`);
      setBusy(null);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <div className="decide">
      <button
        type="button"
        onClick={() => decide("approve")}
        disabled={busy !== null}
      >
        {busy === "approve" ? "Approving..." : "Approve"}
      </button>

      {/* Declining is asked twice. It sends an email that cannot be unsent, and
          it is the one action here with a person on the other end of it. */}
      {confirming ? (
        <>
          <button
            type="button"
            className="danger"
            onClick={() => decide("decline")}
            disabled={busy !== null}
          >
            {busy === "decline" ? "Declining..." : `Yes, decline ${name}`}
          </button>
          <button type="button" className="quiet" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          className="quiet"
          onClick={() => setConfirming(true)}
          disabled={busy !== null}
        >
          Decline
        </button>
      )}

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RolePicker({
  memberId,
  current,
  name,
  isSelf,
}: {
  memberId: string;
  current: AssignableRole;
  name: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(role: string) {
    if (role === current) return;

    // Reducing your own role is the intended last step of this session and also
    // the one change that can leave an administrator unable to undo it. Asking
    // is not paternalism here, it is the only warning available.
    if (isSelf && current === "admin") {
      const confirmed = window.confirm(
        `Give up your own administrator role?\n\nYou will not be able to reverse this yourself. Another administrator would have to give it back.`,
      );
      if (!confirmed) return;
    }

    setBusy(true);
    setError(null);
    const result = await send({ memberId, action: "set_role", role });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? null);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <label className="visually-hidden" htmlFor={`role-${memberId}`}>
        Role for {name}
      </label>
      <select
        id={`role-${memberId}`}
        value={current}
        disabled={busy}
        onChange={(e) => change(e.target.value)}
      >
        {ASSIGNABLE_ROLES.map((role) => (
          <option key={role} value={role} title={ROLE_DESCRIPTIONS[role]}>
            {ROLE_LABELS[role]}
          </option>
        ))}
        {/* A guest is a real role that this console does not assign, because a
            guest carries an access window nobody is asked about here. Showing
            it keeps the select honest for a row that already holds it. */}
        {!(ASSIGNABLE_ROLES as readonly string[]).includes(current) ? (
          <option value={current} disabled>
            {current}
          </option>
        ) : null}
      </select>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
