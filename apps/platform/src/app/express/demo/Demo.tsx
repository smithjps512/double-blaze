"use client";

import { useEffect, useMemo, useState } from "react";
import { GENRES, cleanDesign, cleanSpec, specFromDesign, type Genre } from "@/lib/express/spec";
import GamePlayer from "../GamePlayer";

/** Sample designs, one per genre, so the engine can be tried without the build form. */
const SAMPLES: Record<Genre, Record<string, unknown>> = {
  platformer: {
    initials: "DEM", studio: "Demo Studio", gameName: "Pickle Panic", genre: "platformer", feeling: "Brave", heroName: "Dill", heroEmoji: "🥒",
    setting: "The school at night", goal: "save every pickle", collectName: "pickle jar", collectEmoji: "⭐", enemyName: "lunch tray", enemyEmoji: "👻",
    verbs: ["run", "jump", "collect"], powerup: "double-jump", speed: 6, jump: 6, lives: 3,
  },
  topdown: {
    initials: "DEM", studio: "Demo Studio", gameName: "Gem Quest", genre: "topdown", feeling: "Sneaky", heroName: "Pixel", heroEmoji: "🦊",
    setting: "A haunted castle", goal: "find every gem", collectName: "gem", collectEmoji: "💎", enemyName: "bat", enemyEmoji: "🦇",
    verbs: ["sneak", "grab", "escape"], powerup: "slow-time", speed: 5, jump: 5, lives: 3,
  },
  dodge: {
    initials: "DEM", studio: "Demo Studio", gameName: "Star Dash", genre: "dodge", feeling: "Fast", heroName: "Nova", heroEmoji: "🧑‍🚀",
    setting: "Outer space", goal: "reach the stars", collectName: "star", collectEmoji: "⭐", enemyName: "space rock", enemyEmoji: "🪨",
    verbs: ["fly", "dodge", "collect"], powerup: "shield", speed: 6, jump: 5, lives: 3,
  },
};

export default function Demo() {
  const [genre, setGenre] = useState<Genre>("platformer");
  // ?weird=1 feeds the engine a spec with out-of-range values, through cleanSpec, to prove it still plays.
  const [weird, setWeird] = useState(false);
  useEffect(() => setWeird(new URLSearchParams(window.location.search).has("weird")), []);
  const spec = useMemo(() => {
    const design = cleanDesign(SAMPLES[genre]);
    if (!weird) return specFromDesign(design);
    return cleanSpec(
      {
        title: "<b>Weird</b>",
        palette: { sky: "red", sky2: "#zzzzzz" },
        hero: { emoji: "hello" },
        enemies: [{ emoji: "🔥", behavior: "teleport" }, {}, {}, {}, {}],
        levels: [{ goal: 999, enemies: -5, enemySpeed: 99, twist: "spin" }, { goal: "lots", twist: "dark" }],
        powerup: { seconds: 1000 },
      },
      design,
    );
  }, [genre, weird]);
  return (
    <div className="bg-stone-white">
      <div className="container-page py-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Studio Express</p>
        <h1 className="text-3xl font-bold">Engine demo</h1>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {GENRES.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={genre === g.id}
              data-genre={g.id}
              onClick={() => setGenre(g.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${genre === g.id ? "bg-ink text-white" : "bg-white text-ink"}`}
            >
              {g.emoji} {g.name}
            </button>
          ))}
        </div>
        <div className="mt-5 max-w-4xl">
          <GamePlayer key={genre} spec={spec} />
        </div>
      </div>
    </div>
  );
}
