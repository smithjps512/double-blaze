"use client";

import { useMemo, useState } from "react";
import { QUESTIONS, type Answers, type Question } from "@/lib/quiz";
import { submitQuiz } from "@/app/match/actions";

/** Turns saved answers into the string values the inputs use. */
function initialValues(a: Answers): Record<string, string[]> {
  return {
    species: [a.species],
    home: [a.home],
    activity: [String(a.activity)],
    hoursAway: [a.hoursAway],
    experience: [String(a.experience)],
    kids: [a.kids],
    hasDogs: [a.hasDogs ? "yes" : "no"],
    hasCats: [a.hasCats ? "yes" : "no"],
    sizes: a.sizes,
    maxSize: [a.maxSize ?? "none"],
    ages: a.ages,
    grooming: [String(a.grooming)],
  };
}

const DOG_ONLY = new Set<Question["id"]>(["sizes", "maxSize"]);

/**
 * One question per screen on a phone. Every input stays in one real form, so
 * the submit works even before JavaScript loads; the stepper only hides the
 * questions you are not on.
 */
export function Quiz({ initial, next, returning }: { initial: Answers; next: string; returning: boolean }) {
  const [values, setValues] = useState(() => initialValues(initial));
  const [step, setStep] = useState(0);

  const questions = useMemo(
    () => QUESTIONS.filter((q) => !(DOG_ONLY.has(q.id) && values.species[0] === "cat")),
    [values.species],
  );
  const q = questions[Math.min(step, questions.length - 1)];
  const last = step >= questions.length - 1;
  const answered = q.kind === "multi" || (values[q.id]?.length ?? 0) > 0;

  const choose = (question: Question, value: string) => {
    setValues((v) => {
      if (question.kind !== "multi") return { ...v, [question.id]: [value] };
      const cur = v[question.id] ?? [];
      return { ...v, [question.id]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  };

  return (
    <form action={submitQuiz} className="card mx-auto max-w-xl p-6 sm:p-8">
      <input type="hidden" name="next" value={next} />
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Question {step + 1} of {questions.length}
        </span>
        {returning && <span>Your saved answers are filled in</span>}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-dim" aria-hidden="true">
        <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>

      {QUESTIONS.map((question) => {
        const visible = question.id === q.id;
        const skipped = !questions.includes(question);
        const type = question.kind === "multi" ? "checkbox" : "radio";
        return (
          <fieldset key={question.id} hidden={!visible} disabled={skipped} className="mt-6">
            <legend className="font-display text-3xl font-extrabold leading-tight">{question.title}</legend>
            {question.help && <p className="mt-1 text-muted">{question.help}</p>}
            <div className="mt-5 grid gap-3">
              {question.choices.map((c) => {
                const checked = (values[question.id] ?? []).includes(c.value);
                return (
                  <label
                    key={c.value}
                    className={`focus-within:ring-4 focus-within:ring-sun flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-4 transition ${
                      checked ? "border-ember bg-ember-light" : "border-line bg-white hover:border-pine"
                    }`}
                  >
                    <input
                      type={type}
                      name={question.id}
                      value={c.value}
                      checked={checked}
                      onChange={() => choose(question, c.value)}
                      className="h-5 w-5 accent-ember"
                    />
                    <span>
                      <span className="block font-semibold">{c.label}</span>
                      {c.hint && <span className="text-sm text-muted">{c.hint}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" className="btn-quiet" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </button>
        {last ? (
          <button type="submit" className="btn-primary">
            See my matches
          </button>
        ) : (
          <button type="button" className="btn-primary" disabled={!answered} onClick={() => setStep((s) => s + 1)}>
            {q.kind === "multi" && (values[q.id]?.length ?? 0) === 0 ? "Skip, any is fine" : "Next"}
          </button>
        )}
      </div>
    </form>
  );
}
