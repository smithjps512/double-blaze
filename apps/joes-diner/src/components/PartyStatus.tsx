"use client";

import { useState } from "react";
import type { PartyView } from "@/lib/views";
import { Logo } from "./Logo";
import { post, usePoll } from "./usePoll";

/** A guest's own spot in line, on their phone. Refreshes on its own. */
export function PartyStatus({ token, isNew }: { token: string; isNew: boolean }) {
  const url = `/api/party/${encodeURIComponent(token)}`;
  const { data, error, refresh } = usePoll<PartyView>(url, 10_000);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const act = async (action: string) => {
    setBusy(true);
    await post(url, { action });
    setBusy(false);
    setConfirming(false);
    refresh();
  };

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo className="h-32 w-auto" />
        <p className="text-lg text-muted">{error ?? "Finding your spot..."}</p>
      </main>
    );
  }

  const waiting = data.status === "waiting";
  const called = data.status === "called";
  const seated = data.status === "seated" || data.status === "left" || data.status === "done";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-5 p-6 text-center">
      <Logo className="h-28 w-auto" />
      {isNew && waiting && <p className="rounded-full bg-open-light px-4 py-1 font-bold text-open">You&apos;re on the list!</p>}
      <h1 className="font-display text-3xl text-joe">
        {data.name}, party of {data.size}
      </h1>

      {called && (
        <div className="w-full rounded-3xl bg-joe p-6 text-white" role="alert">
          <p className="text-3xl font-black">Your table is ready!</p>
          <p className="mt-2 text-lg">Please come to the front now. We can hold it for about a minute.</p>
        </div>
      )}

      {waiting && (
        <div className="panel w-full p-6">
          <p className="label">Estimated wait</p>
          <p className="mt-1 text-3xl font-black">{data.wait}</p>
          {data.ahead !== null && (
            <p className="mt-2 text-lg text-muted">
              {data.ahead === 0 ? "You're next." : `${data.ahead} ${data.ahead === 1 ? "party" : "parties"} ahead of you.`}
            </p>
          )}
        </div>
      )}

      {seated && (
        <div className="panel w-full p-6">
          <p className="text-2xl font-black">Enjoy your meal!</p>
          {data.seats && <p className="mt-1 text-lg text-muted">You&apos;re at {data.seats}.</p>}
        </div>
      )}

      {(data.status === "no_show" || data.status === "left_list") && (
        <div className="panel w-full p-6">
          <p className="text-xl font-bold">You&apos;re no longer on today&apos;s list.</p>
          <p className="mt-1 text-muted">Stop by the front and we&apos;ll get you back on.</p>
        </div>
      )}

      {(waiting || called) && (
        <ul className="w-full space-y-2 rounded-2xl bg-joe-light p-4 text-left">
          <li>
            <strong>The whole party must be here</strong> to be seated.
          </li>
          <li>
            <strong>Please stay close.</strong> When we call you, we hold your table for about a minute.
          </li>
          <li>Keep this page open. It updates on its own.</li>
        </ul>
      )}

      {waiting && !data.allHere && (
        <button className="btn-dark w-full" disabled={busy} onClick={() => act("all_here")}>
          Everyone is here now
        </button>
      )}

      {data.menuUrl && (
        <a className="btn-light w-full" href={data.menuUrl} target="_blank" rel="noreferrer">
          Look at the menu while you wait
        </a>
      )}

      {waiting &&
        (confirming ? (
          <div className="w-full space-y-2">
            <p className="font-bold">Leave the waiting list?</p>
            <div className="flex gap-2">
              <button className="btn-light flex-1" onClick={() => setConfirming(false)}>
                Stay on
              </button>
              <button className="btn-primary flex-1" disabled={busy} onClick={() => act("leave")}>
                Yes, leave
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-small text-muted underline" onClick={() => setConfirming(true)}>
            Can&apos;t stay? Leave the list
          </button>
        ))}
    </main>
  );
}
