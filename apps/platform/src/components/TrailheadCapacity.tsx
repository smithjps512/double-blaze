"use client";

import { useEffect, useState } from "react";
import { TRAILHEAD_MONTHLY_CAP } from "@/lib/trailhead";

export function TrailheadCapacity() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cap, setCap] = useState(TRAILHEAD_MONTHLY_CAP);

  useEffect(() => {
    fetch("/api/trailhead/capacity")
      .then((r) => r.json())
      .then((data) => {
        setRemaining(data.remaining ?? TRAILHEAD_MONTHLY_CAP);
        setCap(data.cap ?? TRAILHEAD_MONTHLY_CAP);
      })
      .catch(() => {
        setRemaining(TRAILHEAD_MONTHLY_CAP);
      });
  }, []);

  if (remaining === null) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-2 text-sm text-ink/60">
        Loading availability...
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-trail-orange/10 px-4 py-2 text-sm font-semibold text-trail-orange">
        <span className="h-2 w-2 rounded-full bg-trail-orange" />
        This month is full. Join the waitlist below.
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-ridge-green/10 px-4 py-2 text-sm font-semibold text-ridge-green">
      <span className="h-2 w-2 rounded-full bg-ridge-green" />
      {remaining} of {cap} builds left this month
    </div>
  );
}
