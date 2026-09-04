"use client";

import { useState } from "react";
import Link from "next/link";
import s from "../showcase.module.css";

export interface Question {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
}

const KEYS = ["A", "B", "C", "D", "E", "F"];

/**
 * One question at a time, with the verdict shown before moving on.
 *
 * Their story says "press submit when I am done" and "it tells me how many I
 * got right", and a single form of every question would satisfy both. Telling
 * them straight away is the better version of the same thing: a score at the
 * end says how many you missed, and saying which one you missed while the
 * question is still on the screen is what makes anybody go back and read the
 * page it came from.
 */
export default function Quiz({ questions }: { questions: Question[] }) {
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    const perfect = score === questions.length;
    return (
      <div className={s.quizCard}>
        <div className={s.scoreBig}>{score}</div>
        <p className={s.scoreOf}>out of {questions.length}</p>
        <p style={{ textAlign: "center", marginTop: 22 }}>
          {perfect
            ? "Every one. Go and pick a harder set of questions."
            : score === 0
              ? "None yet, which just means the parts pages are worth a read first."
              : "The ones you missed are all explained on the parts pages."}
        </p>
        <div className={s.actions} style={{ justifyContent: "center" }}>
          <button
            type="button"
            className={s.ghostButton}
            onClick={() => {
              setAt(0);
              setPicked(null);
              setScore(0);
              setDone(false);
            }}
          >
            Try again
          </button>
          <Link href="/trail-crew/classic-cars/parts" className={s.ghostButton}>
            Read the parts
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[at];
  const answered = picked !== null;
  const right = picked === q.answerIndex;
  const last = at === questions.length - 1;

  const next = () => {
    if (last) {
      setDone(true);
      return;
    }
    setAt(at + 1);
    setPicked(null);
  };

  const choose = (index: number) => {
    if (answered) return;
    setPicked(index);
    if (index === q.answerIndex) setScore(score + 1);
  };

  return (
    <div className={s.quizCard}>
      <p className={s.quizProgress}>
        Question {at + 1} of {questions.length}
      </p>
      <h2 className={s.quizQuestion}>{q.question}</h2>

      <div className={s.choices}>
        {q.choices.map((choice, index) => {
          const state = !answered
            ? ""
            : index === q.answerIndex
              ? s.choiceRight
              : index === picked
                ? s.choiceWrong
                : "";
          return (
            <button
              key={index}
              type="button"
              className={`${s.choice} ${state}`}
              disabled={answered}
              onClick={() => choose(index)}
            >
              <span className={s.choiceKey}>{KEYS[index] ?? index + 1}</span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <p className={`${s.verdict} ${right ? s.verdictRight : s.verdictWrong}`}>
            {right ? "Right." : `Not that one. The answer is ${q.choices[q.answerIndex]}.`}
          </p>
          <div className={s.actions}>
            <button type="button" className={s.primaryButton} onClick={next}>
              {last ? "See my score" : "Next question"}
            </button>
            <span className={s.note}>
              {score} right so far
            </span>
          </div>
        </>
      )}
    </div>
  );
}
