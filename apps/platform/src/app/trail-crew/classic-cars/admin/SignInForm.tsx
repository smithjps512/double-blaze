"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../showcase.module.css";

export default function SignInForm({ team, configured }: { team: string; configured: boolean }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className={s.signIn}>
        <h1>Not set up yet</h1>
        <p>
          The passcode for this site has not been configured. Ask your teacher.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/showcase/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team, passcode }),
      });
      const data = await res.json();
      if (data.ok) router.refresh();
      else setMessage(data.error ?? "That did not work.");
    } catch {
      setMessage("Could not reach the server. Check you are online.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={s.signIn} onSubmit={submit}>
      <h1>Admin</h1>
      <p>Your team has one passcode. Your teacher has it.</p>
      <label className={s.field}>
        <span className={s.fieldLabel}>Passcode</span>
        <input
          className={s.input}
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoFocus
        />
      </label>
      <div className={s.actions}>
        <button type="submit" className={s.primaryButton} disabled={busy || !passcode}>
          {busy ? "Checking" : "Let me in"}
        </button>
      </div>
      {message && <p className={`${s.note} ${s.noteError}`} style={{ marginTop: 14 }}>{message}</p>}
    </form>
  );
}
