import type { InterestCounts } from "@/lib/data";
import { daysLeftText, type Deadline } from "@/lib/settings";

/**
 * The go or no-go meter. I'm in and Probably both count toward the goal, but
 * they are shown separately because the committee makes a judgement call on
 * the mix. The site never declares the fundraiser on or off by itself.
 */
export function InterestMeter({
  counts,
  goal,
  deadline,
}: {
  counts: InterestCounts | null;
  goal: number;
  deadline: Deadline | null;
}) {
  const inCount = counts?.in ?? 0;
  const probably = counts?.probably ?? 0;
  const total = inCount + probably;
  const scale = Math.max(goal, total);
  const pct = (n: number) => (n / scale) * 100;
  const reached = total >= goal;

  let note: string;
  if (deadline?.closed) {
    note = `Hand raising closed ${deadline.label}. The committee is tallying and will make the call. Late hands still count.`;
  } else if (reached) {
    note = `Goal reached! The committee makes the final call${deadline ? ` after ${deadline.label}` : ""}. Keep the hands coming.`;
  } else {
    note = `${goal - total} more to go${deadline ? ` by ${deadline.label}` : ""}. Know someone on the fence? Send them the link.`;
  }

  return (
    <div className="rounded-2xl border-2 border-asphalt bg-white p-6 shadow-sign sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-display text-3xl font-extrabold sm:text-4xl">
          {counts === null ? (
            "Counting soon"
          ) : (
            <>
              {total} <span className="text-muted">of {goal}</span> staff interested
            </>
          )}
        </p>
        {deadline && (
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="text-muted">Raise your hand by {deadline.label}</span>
            <span className={`rounded-full px-3 py-1 ${deadline.closed ? "bg-chalk-dim text-ink" : "bg-bms text-tape"}`}>
              {daysLeftText(deadline)}
            </span>
          </p>
        )}
      </div>

      <div
        className="asphalt relative mt-5 flex h-8 gap-[2px] overflow-hidden rounded-full border-2 border-asphalt"
        role="img"
        aria-label={`${inCount} said I'm in and ${probably} said Probably, ${total} of a goal of ${goal}.`}
      >
        {inCount > 0 && (
          <div className="h-full bg-tape" style={{ width: `${pct(inCount)}%` }} title={`I'm in: ${inCount}`} />
        )}
        {probably > 0 && (
          <div className="h-full bg-bms-light" style={{ width: `${pct(probably)}%` }} title={`Probably: ${probably}`} />
        )}
        {total > goal && (
          <div aria-hidden className="absolute inset-y-0 w-[3px] bg-sold" style={{ left: `${pct(goal)}%` }} title={`Goal: ${goal}`} />
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm bg-tape ring-1 ring-asphalt/40" />
          <span>
            I&apos;m in: <strong className="tabular-nums">{inCount}</strong>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm bg-bms-light ring-1 ring-asphalt/40" />
          <span>
            Probably: <strong className="tabular-nums">{probably}</strong>
          </span>
        </li>
        {total > goal && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-3 w-[3px] bg-sold" />
            <span>Goal: {goal}</span>
          </li>
        )}
        <li className="text-muted">Names stay private.</li>
      </ul>

      <p className="mt-3 text-sm text-muted">{note}</p>
    </div>
  );
}
