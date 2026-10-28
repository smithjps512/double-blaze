import type { Metadata } from "next";
import Results from "./Results";

/** /vote/results: the live tally, for the projector. */
export const metadata: Metadata = { title: "Vote results", robots: { index: false, follow: false } };

export default function ResultsPage() {
  return <Results />;
}
