import type { Metadata } from "next";
import Demo from "./Demo";

/** /express/demo: every Studio Express genre from a sample design, for testing the engine. */
export const metadata: Metadata = {
  title: "Studio Express: engine demo",
  robots: { index: false, follow: false },
};

export default function ExpressDemoPage() {
  return <Demo />;
}
