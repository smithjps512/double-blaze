import type { Metadata } from "next";
import Vote from "./Vote";

/**
 * /vote: the class chooses what to build next. One ranked ballot per
 * Chromebook, with one sentence of why. The projector shows /vote/results.
 */
export const metadata: Metadata = {
  title: "Vote on what's next",
  description: "Rank the choices for what our class builds next, and say why.",
  robots: { index: false, follow: false },
};

export default function VotePage() {
  return <Vote />;
}
