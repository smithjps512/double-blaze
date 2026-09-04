import Link from "next/link";
import { listParts } from "@/lib/showcase-db";
import { TEAM } from "../team";
import s from "../showcase.module.css";

/**
 * Story 2, the parts library: "I want to read what each part of a car does, so
 * that I understand what is happening under the hood."
 *
 * The badge on each row is the horsepower it adds in the builder. It is here
 * because a list where three rows say "+100 hp" and one says "no horsepower"
 * asks a question, and the answer is on the tires page.
 */
export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const parts = await listParts(TEAM);

  return (
    <main className={s.wrap}>
      <div style={{ paddingTop: 54 }}>
        <p className={s.eyebrow}>Under the hood</p>
        <h1 className={s.pageTitle}>What each part actually does</h1>
        <p className={s.lede}>
          Plain words, not a manual. Each one says what it is for, and what
          changes if you upgrade it.
        </p>
      </div>

      {parts.length === 0 ? (
        <div className={s.empty}>
          <strong>No parts yet.</strong>
          Add them in the admin and they will show up here.
        </div>
      ) : (
        <div className={s.partList}>
          {parts.map((part) => (
            <Link key={part.id} href={`/trail-crew/classic-cars/parts/${part.slug}`} className={s.partRow}>
              <h2 className={s.partName}>{part.name}</h2>
              {part.hpGain === null ? (
                <span className={`${s.partGain} ${s.partGainNone}`}>Not a bolt-on</span>
              ) : part.hpGain === 0 ? (
                <span className={`${s.partGain} ${s.partGainNone}`}>No horsepower</span>
              ) : (
                <span className={s.partGain}>+{part.hpGain} hp</span>
              )}
              <span className={s.chevron} aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
