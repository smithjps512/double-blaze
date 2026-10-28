import type { Metadata } from "next";
import gallery from "@/data/launch-gallery.json";
import games from "@/data/game-gallery.json";
import Arcade, { type ArcadeApp } from "./Arcade";

/**
 * /play: every Launch Pad team's app in one place, to play and to QA.
 *
 * A short address on purpose, because it gets written on a whiteboard. The
 * apps come from the same manifest as the Launch Pad gallery, so a team
 * appears here as soon as `npm run launch:prototypes` gives them a card.
 * Reports go to the teacher first (see /play/review). No student names.
 */
export const metadata: Metadata = {
  title: "Play and QA",
  description: "Play your classmates' apps, then report what you find like a real QA tester.",
  robots: { index: false, follow: false },
};

interface Entry {
  slug: string;
  productName: string;
  teamName?: string;
  period?: number;
  purpose: string;
  href: string;
  example?: boolean;
  demoHref?: string;
}

/**
 * Game Studio builds. A hand-maintained list, because each game is built by
 * hand from a team's design doc (docs/games/<folder>): add an entry when its
 * build lands in public/demo/<folder>/. Games are listed first.
 */
interface GameEntry {
  slug: string;
  gameName: string;
  teamName: string;
  period?: number;
  pitch: string;
  playHref: string;
}

const gameApps: ArcadeApp[] = (games as GameEntry[]).map((g) => ({
  slug: g.slug,
  name: g.gameName,
  team: g.teamName,
  period: g.period ?? null,
  purpose: g.pitch,
  playHref: g.playHref,
  prototypeHref: g.playHref,
  working: false,
  kind: "game",
}));

const appList: ArcadeApp[] = (gallery as Entry[])
  .filter((e) => !e.example)
  .map((e) => ({
    slug: e.slug,
    name: e.productName,
    team: e.teamName ?? "",
    period: e.period ?? null,
    purpose: e.purpose,
    playHref: e.demoHref ?? e.href,
    prototypeHref: e.href,
    working: !!e.demoHref,
    kind: "app" as const,
  }));

const apps = [...gameApps, ...appList];

export default function PlayPage() {
  return <Arcade apps={apps} />;
}
