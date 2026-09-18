"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import s from "../tracker.module.css";

/**
 * The chat box. Keeps the thread in memory for the page visit and sends the
 * last few turns back with each question so a follow-up ("and the next
 * season?") makes sense. Nothing is stored anywhere.
 *
 * An error from the server arrives as a message in the thread rather than a
 * red banner, because to a 12 year old "the storyteller is not switched on
 * yet" is an answer, and a banner is a broken page.
 */

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Tell me the story of his first goal for Spain.",
  "Which season was his best, and why?",
  "What happened at the 2026 World Cup?",
  "How did he get from a park in Granollers to Barcelona?",
  "What records does he hold?",
  "How do you know all this?",
];

export function AskYamal() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const history = turns.slice(-8);
    setTurns((t) => [...t, { role: "user", content: q }]);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/yamal/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const json = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      const content =
        json.answer ?? json.error ?? "Something went wrong on my end. Try again in a moment.";
      setTurns((t) => [...t, { role: "assistant", content }]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", content: "I could not reach the storyteller. Check the connection and try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(draft);
  }

  return (
    <div className={s.chat}>
      <div className={s.thread} role="log" aria-live="polite" aria-label="Conversation">
        {turns.length === 0 && (
          <p className={s.chatEmpty}>
            Ask anything about his teams, his seasons or his goals. Pick a question below to start.
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === "user" ? s.bubbleUser : s.bubbleTeller}>
            <span className={s.bubbleWho}>{t.role === "user" ? "You" : "Storyteller"}</span>
            <p>{t.content}</p>
          </div>
        ))}
        {busy && (
          <div className={s.bubbleTeller}>
            <span className={s.bubbleWho}>Storyteller</span>
            <p className={s.thinking}>Checking the numbers</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={s.starters}>
        {STARTERS.map((q) => (
          <button key={q} type="button" className={s.starter} onClick={() => void ask(q)} disabled={busy}>
            {q}
          </button>
        ))}
      </div>

      <form className={s.askForm} onSubmit={onSubmit}>
        <label htmlFor="ask-yamal" className="sr-only">
          Your question
        </label>
        <input
          id="ask-yamal"
          className={s.askInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about a season, a team or a goal"
          maxLength={300}
          autoComplete="off"
          disabled={busy}
        />
        <button type="submit" className={s.askButton} disabled={busy || !draft.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
