"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The lock on every Race Day page. The page itself decides whether to show
 * this; the form only posts the password and refreshes on success.
 */
export default function Gate({ role, configured }: { role: "class" | "teacher"; configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const teacher = role === "teacher";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/race-day/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Could not sign in.");
        return;
      }
      setPassword("");
      router.refresh();
    } catch {
      setMsg("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Intro to Technology</p>
        <h1 className="mt-1 text-2xl font-bold">{teacher ? "Teacher sign in" : "Race Day is for our class"}</h1>
        {configured ? (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="font-medium">{teacher ? "Teacher code" : "Class password"}</span>
              <input
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy || !password}
              className="w-full rounded-lg bg-blaze-maroon px-4 py-2 font-semibold text-white hover:bg-blaze-maroon/90 disabled:opacity-50"
            >
              {busy ? "Checking..." : "Go"}
            </button>
            {msg && <p className="text-sm text-trail-orange" role="alert">{msg}</p>}
            <p className="text-xs text-ink/55">
              {teacher ? "Your code is in the server settings." : "Your teacher has the password. Please do not share it outside class."}
            </p>
          </form>
        ) : (
          <p className="mt-3 text-sm text-ink/70">
            This page is locked and no {teacher ? "teacher code" : "class password"} is set on this server yet, so nobody can open it.
            Set {teacher ? "RACE_DAY_TEACHER_CODE" : "RACE_DAY_CLASS_PASSWORD"} in the deployment settings.
          </p>
        )}
      </div>
    </div>
  );
}
