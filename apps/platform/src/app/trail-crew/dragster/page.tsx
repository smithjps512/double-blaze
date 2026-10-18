import type { Metadata } from "next";
import DragsterLab from "./DragsterLab";

/**
 * Dragster Lab: Intro to Technology's virtual CO2 dragster.
 *
 * Built for the days students cannot be in the wood shop. They copy their
 * real blueprint into a virtual twin, check it against the class rules, mod
 * it, and race it in a period bracket a substitute can run from one button.
 *
 * No logins, initials only, the same as every Trail Crew page. The physics
 * is in src/lib/dragster/sim.ts and the rules in src/lib/dragster/rules.ts.
 */

export const metadata: Metadata = {
  title: "Dragster Lab",
  description: "Build a virtual twin of your CO2 dragster, mod it, and race the class.",
  robots: { index: false, follow: false },
};

export default function DragsterPage() {
  return <DragsterLab />;
}
