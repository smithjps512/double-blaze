import { detailOverlap } from "@/lib/reports";

/**
 * The poster's private detail beside the helper's answer, with shared words
 * highlighted. A hint, never a verdict: the poster decides.
 */
export function DetailCheck({ secret, answer, compact = false }: { secret: string; answer: string; compact?: boolean }) {
  const { shared, strength } = detailOverlap(secret, answer);
  const tone =
    strength === "strong"
      ? { cls: "bg-pine-light text-pine", text: "Their answer matches your detail" }
      : strength === "some"
        ? { cls: "bg-sun-light text-ink", text: "Partly matches. Ask a follow-up question." }
        : { cls: "bg-ember-light text-ember-dark", text: "Does not match your detail. Be careful." };
  return (
    <div className={`rounded-2xl border border-line bg-white ${compact ? "p-3 text-sm" : "p-4"}`}>
      <p className={`chip ${tone.cls} font-semibold`}>{tone.text}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Your private detail</dt>
          <dd>{secret}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Their description</dt>
          <dd>{answer || <em className="text-muted">No answer</em>}</dd>
        </div>
      </dl>
      {shared.length > 0 && <p className="mt-2 text-xs text-muted">Shared words: {shared.join(", ")}</p>}
    </div>
  );
}
