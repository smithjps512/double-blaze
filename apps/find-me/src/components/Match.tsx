import { scoreLabel, type Reason } from "@/lib/matching";

export function MatchBadge({ score, large = false }: { score: number; large?: boolean }) {
  const strong = score >= 70;
  return (
    <span
      className={`chip font-semibold shadow ${strong ? "bg-ember text-white" : "bg-white text-ink"} ${large ? "px-4 py-2 text-base" : ""}`}
    >
      {score}% · {scoreLabel(score)}
    </span>
  );
}

const ICON: Record<Reason["tone"], { mark: string; cls: string; sr: string }> = {
  good: { mark: "✓", cls: "bg-pine-light text-pine", sr: "Fits:" },
  ok: { mark: "!", cls: "bg-sun-light text-ink", sr: "Trade-off:" },
  ask: { mark: "?", cls: "bg-cream-dim text-muted", sr: "Ask:" },
};

export function ReasonList({ reasons, compact = false }: { reasons: Reason[]; compact?: boolean }) {
  if (reasons.length === 0) return null;
  return (
    <ul className={`flex flex-col ${compact ? "gap-1 text-sm" : "gap-2"}`}>
      {reasons.map((r) => (
        <li key={r.text} className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ICON[r.tone].cls}`}
          >
            {ICON[r.tone].mark}
          </span>
          <span>
            <span className="sr-only">{ICON[r.tone].sr} </span>
            {r.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
