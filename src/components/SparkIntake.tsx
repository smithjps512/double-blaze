"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Spark intake chat for the client portal. Resumable: the server seeds it with
 * the stored transcript, and every turn persists server-side. When intake is
 * ready, the client confirms and we assemble the build brief. Spark runs
 * server-side via /api/spark; no API key is ever in the browser.
 */
export function SparkIntake({
  initialMessages,
  initialReady,
}: {
  initialMessages: ChatMessage[];
  initialReady: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(initialReady);
  const [brief, setBrief] = useState<"idle" | "working" | "done">("idle");
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  // Open the conversation if there is no transcript yet.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    if (messages.length === 0) void send("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  async function send(text: string) {
    setSending(true);
    setError("");
    if (text) setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (!res.ok || typeof json.reply !== "string") {
        setError(json.error ?? "Spark is unavailable. Please try again.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
      setReady(!!json.readyForBrief);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void send(text);
  }

  async function generateBrief() {
    setBrief("working");
    setError("");
    try {
      const res = await fetch("/api/brief", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setBrief("idle");
        setError(json.error ?? "Could not assemble the brief.");
        return;
      }
      setBrief("done");
    } catch {
      setBrief("idle");
      setError("Network error. Please try again.");
    }
  }

  if (brief === "done") {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/[0.06] p-6">
        <h2 className="text-lg font-bold text-ink">Thank you. We have what we need.</h2>
        <p className="mt-2 text-ink/70">
          Our team is assembling your Blue Trail build now. We will reach out as
          it comes together, and your 30-day window starts the day it goes live.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-ink/10 bg-stone-white">
      <div
        ref={scroller}
        className="max-h-[26rem] min-h-[16rem] space-y-4 overflow-y-auto p-5"
      >
        {messages.length === 0 && (
          <p className="text-sm text-ink/50">Starting your intake...</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-trail-orange text-stone-white"
                  : "bg-ink/[0.05] text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && <p className="text-sm text-ink/40">Spark is typing...</p>}
      </div>

      {error && (
        <p role="alert" className="px-5 pb-2 text-sm font-medium text-impact-orange">
          {error}
        </p>
      )}

      {ready && (
        <div className="border-t border-ink/10 bg-ridge-green/[0.06] px-5 py-4">
          <p className="text-sm text-ink/75">
            That covers what we need. Ready for us to build your brief?
          </p>
          <button
            type="button"
            onClick={generateBrief}
            disabled={brief === "working"}
            className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {brief === "working" ? "Assembling..." : "Build my brief"}
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-ink/10 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          placeholder="Type your answer..."
          className="flex-1 rounded-lg border border-ink/15 bg-stone-white px-3 py-2 text-sm text-ink outline-none focus:border-trail-orange disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
