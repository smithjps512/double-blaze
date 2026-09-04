"use client";

import { useState } from "react";
import Link from "next/link";
import s from "../showcase.module.css";

export interface Upgrade {
  id: string;
  slug: string;
  name: string;
  gain: number;
  note: string;
}

/**
 * Their acceptance criteria, in order: you start at a number, every upgrade
 * adds horsepower, the total updates as soon as you pick something, and you can
 * take one back off.
 *
 * The state is a set of ids rather than a running total, so unticking is the
 * same operation as ticking and cannot drift out of step with the boxes. Their
 * own architecture makes the same point: tick everything, untick everything,
 * and you should be back at the number you started with.
 */
export default function Builder({ base, upgrades }: { base: number; upgrades: Upgrade[] }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const total = upgrades.reduce((sum, u) => (picked.has(u.id) ? sum + u.gain : sum), base);
  const added = total - base;

  // The zero-horsepower upgrade is the point of the screen, so the footnote
  // links to whichever part that is rather than to a slug that could be
  // deleted in the admin tomorrow.
  const noGain = upgrades.find((u) => u.gain === 0);

  const toggle = (id: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className={s.builderTotal}>
        <div className={`${s.bigNumber} ${added > 0 ? s.bigNumberUp : ""}`}>{total}</div>
        <div className={s.bigLabel}>Horsepower</div>
        <p className={s.fromStock}>
          {added === 0
            ? `Stock. Nothing bolted on yet.`
            : `${base} stock, plus ${added} from ${picked.size} ${picked.size === 1 ? "upgrade" : "upgrades"}.`}
        </p>
      </div>

      <div className={s.upgrades}>
        {upgrades.map((u) => {
          const on = picked.has(u.id);
          return (
            <label key={u.id} className={`${s.upgrade} ${on ? s.upgradeOn : ""}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(u.id)} />
              <span>
                <span className={s.upgradeName}>{u.name}</span>
                <span className={s.upgradeNote} style={{ display: "block" }}>
                  {u.gain === 0 ? "Adds grip, not power. The number will not move." : firstSentence(u.note)}
                </span>
              </span>
              <span className={`${s.upgradeGain} ${u.gain === 0 ? s.upgradeGainNone : ""}`}>
                {u.gain === 0 ? "+0" : `+${u.gain}`}
              </span>
            </label>
          );
        })}
      </div>

      <div className={s.actions}>
        <button type="button" className={s.ghostButton} onClick={() => setPicked(new Set())}>
          Back to stock
        </button>
      </div>

      {noGain && (
        <p className={s.footnote}>
          One of these adds nothing, and that is not a mistake.{" "}
          <Link href={`/trail-crew/classic-cars/parts/${noGain.slug}`}>Read why</Link>.
        </p>
      )}
    </>
  );
}

/** Enough of the part's own writing to say what it is, without a wall of text. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const end = trimmed.indexOf(". ");
  return end === -1 ? trimmed : trimmed.slice(0, end + 1);
}
