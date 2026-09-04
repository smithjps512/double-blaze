import { listQuiz } from "@/lib/showcase-db";
import { TEAM } from "../team";
import Quiz from "./Quiz";
import s from "../showcase.module.css";

/**
 * Story 3, the quiz. This is the team's own story, the one document they handed
 * in, so its four acceptance criteria are theirs word for word: the questions
 * come from the parts pages, you pick an answer for each, you press submit when
 * you are done, and it tells you how many you got right.
 */
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const questions = await listQuiz(TEAM);

  return (
    <main className={`${s.wrap} ${s.narrow}`}>
      <div style={{ paddingTop: 54 }}>
        <p className={s.eyebrow}>Test yourself</p>
        <h1 className={s.pageTitle}>How much of that stuck?</h1>
        <p className={s.lede}>
          Every question comes off one of the parts pages. If one catches you
          out, that page is where the answer is.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className={s.empty}>
          <strong>No questions yet.</strong>
          Write them in the admin. The best ones come straight off your parts
          pages.
        </div>
      ) : (
        <Quiz questions={questions.map((q) => ({
          id: q.id,
          question: q.question,
          choices: q.choices,
          answerIndex: q.answerIndex,
        }))} />
      )}
    </main>
  );
}
