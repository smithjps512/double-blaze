export function InterestMeter({ count, goal }: { count: number | null; goal: number }) {
  const shown = count ?? 0;
  const pct = Math.min(100, Math.round((shown / goal) * 100));
  const reached = shown >= goal;
  return (
    <div className="rounded-2xl border-2 border-asphalt bg-white p-6 shadow-sign sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="font-display text-3xl font-extrabold sm:text-4xl">
          {count === null ? "Counting soon" : `${shown} staff interested so far`}
        </p>
        <p className="text-sm font-semibold text-muted">Goal: {goal}</p>
      </div>
      <div
        className="asphalt mt-4 h-8 overflow-hidden rounded-full border-2 border-asphalt"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={shown}
        aria-label="Staff interested"
      >
        <div className="tape h-full transition-[width] duration-700" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted">
        {reached
          ? "Goal reached. The market is hot. Keep the hands coming."
          : "Counts staff who said I'm in or Probably. Names stay private."}
      </p>
    </div>
  );
}
