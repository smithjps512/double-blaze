import type { Metadata } from "next";
import Today from "./Today";

/** /express/today: every game built today, for the substitute's completion grade and for playing each other's games. */
export const metadata: Metadata = { title: "Today's games", robots: { index: false, follow: false } };

export default function TodayPage() {
  return <Today />;
}
