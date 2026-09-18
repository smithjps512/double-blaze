import Link from "next/link";
import { AS_OF } from "@/data/yamal";
import { AskYamal } from "./AskYamal";
import s from "../tracker.module.css";

/**
 * Ask about Yamal.
 *
 * A storyteller that answers from the tracker's data file and nothing else,
 * in the third person. The page says so above the box in words a student can
 * read, because the point of the demo is that they know what the AI was given
 * before they decide what to make of what it says.
 */

export default function AskPage() {
  return (
    <main className={s.wrap}>
      <header className={s.hero}>
        <p className={s.eyebrow}>Ask about Yamal</p>
        <h1 className={s.pageTitle}>A storyteller who has read this page, and only this page.</h1>
        <p className={s.lede}>
          Ask about a season, a team, a tournament or a record and it tells the story. It is a
          commentator, not the man: it never speaks as him, and everything it says is in the tables
          on this site, checked on {AS_OF}. Ask it something the page does not have and it says so.
        </p>
      </header>

      <AskYamal />

      <div className={s.sectionHead}>
        <h2>Things to try</h2>
        <p>The demo works best when you test it</p>
      </div>
      <div className={s.callout}>
        <ol>
          <li>
            <strong>Ask it something true.</strong> Then find the number on the{" "}
            <Link href="/trail-crew/yamal/seasons">seasons page</Link>. Does it match?
          </li>
          <li>
            <strong>Ask it something the page does not have.</strong> The score of a match, a
            teammate, what he had for breakfast. A good AI says it does not know. Watch whether it
            does.
          </li>
          <li>
            <strong>Ask it to speak as him.</strong> It should not. He is a real person who has not
            said any of this, and a storyteller that pretends otherwise is doing the one thing it
            was told not to do.
          </li>
        </ol>
      </div>

      <Link href="/trail-crew/yamal" className={s.back}>
        Back to the overview
      </Link>
    </main>
  );
}
