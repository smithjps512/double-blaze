"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Spark intake chat (spec section 6). Talks to /api/spark, which persists the
 * transcript and captured fields server-side each turn. When the brief becomes
 * ready, refreshes the portal so the brief-review view takes over.
 */
export function SparkIntake({
  projectId,
  offeringName,
  initialMessages,
}: {
  projectId: string;
  offeringName: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [error, setError] = useState("");
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Kick off the opening turn if there is no transcript yet.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (initialMessages.length === 0) {
      void send("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  async function send(message: string) {
    setStatus("thinking");
    setError("");
    try {
      const res = await fetch("/api/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message }),
      });
      const json = await res.json();

      if (json.disabled) {
        setStatus("error");
        setError(
          "Spark intake is not available right now. Please check back soon.",
        );
        return;
      }
      if (!res.ok || typeof json.reply !== "string") {
        setStatus("error");
        setError(json.error ?? "Spark could not respond. Please try again.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
      setStatus("idle");

      if (json.briefReady) {
        // Brief assembled; reload the portal into the brief-review view.
        router.refresh();
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "thinking") return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    void send(text);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Spark intake</p>
      <h1 className="mt-3 text-3xl font-bold text-ink">Let us scope your {offeringName}</h1>
      <p className="mt-3 text-ink/70">
        Spark will ask a few questions to scope your project. Answer in your own
        words. When we have enough, we will put together your project brief.
      </p>

      <div
        ref={scrollRef}
        className="mt-8 max-h-[55vh] space-y-4 overflow-y-auto rounded-xl border border-ink/10 bg-white p-5"
      >
        {messages.length === 0 && status !== "thinking" && (
          <p className="text-sm text-ink/50">Starting your intake...</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-blaze-maroon px-4 py-2.5 text-sm text-stone-white"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-ink/[0.04] px-4 py-2.5 text-sm text-ink"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {status === "thinking" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-ink/[0.04] px-4 py-2.5 text-sm text-ink/50">
              Spark is typing...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-impact-orange">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={status === "thinking"}
          className="flex-1 rounded-lg border border-ink/20 px-4 py-2.5 text-sm focus:border-trail-orange focus:outline-none disabled:opacity-60"
          aria-label="Your answer"
        />
        <button
          type="submit"
          disabled={status === "thinking" || !input.trim()}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
