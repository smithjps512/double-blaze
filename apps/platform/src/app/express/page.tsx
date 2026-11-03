import type { Metadata } from "next";
import Express from "./Express";

/**
 * /express: Trail Crew Studio Express. A student designs a game in one class,
 * Spark builds it, they play it. Made for a substitute day: everything a
 * student needs is on the page. See docs/sub-plans/2026-11-04-studio-express.
 */
export const metadata: Metadata = {
  title: "Studio Express",
  description: "Design a game, watch it get built, and play it.",
  robots: { index: false, follow: false },
};

export default function ExpressPage() {
  return <Express />;
}
