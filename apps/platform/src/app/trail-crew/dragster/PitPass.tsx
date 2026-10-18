"use client";

import { useState } from "react";

/**
 * Pit Pass: three short research cards, one check question each.
 *
 * The garage stays locked until all three are stamped, so research happens
 * before tinkering instead of after. A wrong answer gives a hint and another
 * try; the point is the idea, not the score. No em dashes in any copy here.
 */

interface Card {
  title: string;
  big: string;
  body: string[];
  question: string;
  options: string[];
  answer: number;
  hint: string;
}

export const CARDS: Card[] = [
  {
    title: "1. The push",
    big: "a = F / m",
    body: [
      "Every car in the race gets the same cartridge, so every car gets the same push (F). That is the fair part.",
      "Newton's second law says how fast you speed up (a) is the push divided by the mass (m) you are pushing. The cartridge also has to carry itself, about 30 grams of steel and gas.",
      "So the one thing you control on the push side is mass. Every gram you leave on the car is a gram the cartridge has to haul.",
    ],
    question: "Two cars get the exact same push. Car A is 45 g and car B is 55 g. Which one speeds up faster?",
    options: ["Car A, the lighter one", "Car B, the heavier one", "They speed up the same"],
    answer: 0,
    hint: "Same push, divided by a smaller mass, gives a bigger number. Try again.",
  },
  {
    title: "2. The air",
    big: "Drag",
    body: [
      "Air pushes back on the front of your car. The faster you go, the harder it pushes, much harder: twice as fast means about four times the push back.",
      "Two things decide how much: how big your car looks from the front (frontal area), and how smoothly the air can slide around it (shape).",
      "A low, pointed nose that rises gently to the cartridge lets air slide over. A flat, square front makes the air crash into it.",
    ],
    question: "Which front end meets the air best?",
    options: ["A tall, flat, square front", "A low nose that rises gently to the cartridge", "A wide front with big wheels sticking out"],
    answer: 1,
    hint: "Think about which one lets the air slide over instead of crashing into it.",
  },
  {
    title: "3. The rub",
    big: "Friction",
    body: [
      "Wheels rub on their axles, axles rub on the wood, and the screw eyes rub on the line. All of that turns your speed into heat.",
      "Heavier cars press down harder, so they rub more. A car whose axles sit too close together wobbles side to side and rubs the line even more.",
      "Safety matters here too: the wood around the CO2 hole must be at least 1/8 inch thick, and the screw eyes must be 6 to 10 1/2 inches apart, or the car can break loose.",
    ],
    question: "Which change cuts friction?",
    options: ["Switching to wider wheels", "Graphite powder on the axles", "Three more coats of paint"],
    answer: 1,
    hint: "Wide wheels are heavier, paint adds mass. Which one makes the axles slippery?",
  },
];

export default function PitPass({ passed, onPass }: { passed: boolean[]; onPass: (i: number) => void }) {
  const [open, setOpen] = useState(() => Math.max(0, passed.findIndex((p) => !p)));
  const [picked, setPicked] = useState<number | null>(null);
  const card = CARDS[open];
  const done = passed.every(Boolean);

  function choose(i: number) {
    setPicked(i);
    if (i === card.answer) onPass(open);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <ol className="flex gap-2 self-start lg:flex-col">
        {CARDS.map((c, i) => (
          <li key={c.title} className="flex-1 lg:flex-none">
            <button
              onClick={() => {
                setOpen(i);
                setPicked(null);
              }}
              className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${open === i ? "border-trail-orange bg-white shadow-sm" : "border-ink/10 bg-white/60 hover:bg-white"}`}
            >
              <span className="block font-semibold">{c.title}</span>
              <span className={`text-xs font-bold uppercase ${passed[i] ? "text-ridge-green" : "text-ink/40"}`}>
                {passed[i] ? "Stamped" : "Not yet"}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <article className="rounded-2xl border border-ink/10 bg-white p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-trail-orange">{card.title}</p>
        <p className="mt-1 font-mono text-4xl font-bold text-blaze-maroon">{card.big}</p>
        <div className="mt-4 space-y-3 text-[17px] leading-relaxed text-ink/85">
          {card.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-stone-white p-5">
          <p className="font-semibold">Check: {card.question}</p>
          <div className="mt-3 grid gap-2">
            {card.options.map((o, i) => {
              const chosen = picked === i;
              const right = chosen && i === card.answer;
              const wrong = chosen && i !== card.answer;
              return (
                <button
                  key={o}
                  onClick={() => choose(i)}
                  className={`rounded-lg border px-4 py-2.5 text-left transition ${right ? "border-ridge-green bg-ridge-green/10" : wrong ? "border-trail-orange bg-trail-orange/10" : "border-ink/15 bg-white hover:border-ink/40"}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && picked !== card.answer && <p className="mt-3 text-sm text-impact-orange">{card.hint}</p>}
          {(passed[open] || picked === card.answer) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-ridge-green px-3 py-1 text-sm font-bold text-white">Stamped</span>
              {open < CARDS.length - 1 ? (
                <button
                  className="text-sm font-semibold text-trail-orange underline"
                  onClick={() => {
                    setOpen(open + 1);
                    setPicked(null);
                  }}
                >
                  Next card
                </button>
              ) : null}
            </div>
          )}
        </div>
        {done && <p className="mt-5 rounded-lg bg-ridge-green/10 p-3 text-sm font-semibold text-ridge-green">Pit Pass complete. The Garage is open.</p>}
      </article>
    </div>
  );
}
