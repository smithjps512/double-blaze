import type { Metadata } from "next";
import Studio from "./Studio";

/**
 * /studio: the Game Studio unit's design doc tool. Teams sign in with a
 * period and studio name, like Launch Pad. The teacher exports designs with
 * `npm run studio:export` for the Double Blaze builds. See
 * docs/lessons/game-studio. No student names.
 */
export const metadata: Metadata = {
  title: "Game Studio",
  description: "Design a game like a real studio: the feeling, players, core loop, world, mechanics and levels.",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <Studio />;
}
