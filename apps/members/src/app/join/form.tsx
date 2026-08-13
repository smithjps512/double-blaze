"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ALL_JOIN_QUESTIONS,
  requiresInterest,
  type JoinQuestion,
} from "@/lib/join";

/**
 * The questionnaire itself.
 *
 * The fields are rendered from the question definitions rather than written out
 * here, so the form, the server validation, and the approval queue in 3d cannot
 * drift apart: changing the question set is one edit to lib/join.ts.
 *
 * Validation is the server's. What happens here is presentation of the server's
 * answer, plus the browser's own required and maxlength handling so the common
 * mistakes are caught without a round trip. Nothing is enforced here that is not
 * enforced again in the route and in the row level security policy behind it.
 */
export function JoinForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  function set(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    // Clear the complaint as soon as they act on it. Leaving a red message
    // under a field somebody has just fixed reads as though it is still wrong.
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    setFailure(null);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace("/sign-in?error=expired");
        return;
      }

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setFailure(data.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }

      // The front door reads the new row and shows the pending notice. refresh
      // first, because the router cache still holds the page that sent us here.
      setState("sent");
      router.refresh();
      router.replace("/");
    } catch {
      setFailure("Could not reach the server. Please try again.");
      setState("idle");
    }
  }

  // The free-text question turns required when neither industry fits, which is
  // the one case where the structured answers tell an administrator nothing.
  const interestRequired = requiresInterest(values.industry ?? "");

  return (
    <form onSubmit={submit}>
      {ALL_JOIN_QUESTIONS.map((question) => (
        <Field
          key={question.key}
          question={question}
          value={values[question.key] ?? ""}
          error={errors[question.key]}
          required={
            question.required || (question.key === "interest" && interestRequired)
          }
          disabled={state !== "idle"}
          onChange={(value) => set(question.key, value)}
        />
      ))}

      {failure ? (
        <p className="notice error" role="alert">
          {failure}
        </p>
      ) : null}

      <button type="submit" disabled={state !== "idle"}>
        {state === "idle" ? "Send my request" : "Sending..."}
      </button>
    </form>
  );
}

function Field({
  question,
  value,
  error,
  required,
  disabled,
  onChange,
}: {
  question: JoinQuestion;
  value: string;
  error?: string;
  required: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const helpId = question.help ? `${question.key}-help` : undefined;
  const errorId = error ? `${question.key}-error` : undefined;
  // Both, in reading order, so a screen reader gets the explanation and then
  // the complaint rather than one replacing the other.
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  if (question.kind === "choice") {
    return (
      <fieldset className="field" aria-describedby={describedBy}>
        <legend>
          {question.label}
          {required ? null : <span className="optional"> (optional)</span>}
        </legend>
        {question.help ? (
          <p className="help" id={helpId}>
            {question.help}
          </p>
        ) : null}

        {question.choices?.map((choice) => (
          <label className="choice" key={choice.value} htmlFor={`${question.key}-${choice.value}`}>
            <input
              type="radio"
              id={`${question.key}-${choice.value}`}
              name={question.key}
              value={choice.value}
              checked={value === choice.value}
              required={required}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
            />
            <span>
              <strong>{choice.label}</strong>
              <span className="help">{choice.help}</span>
            </span>
          </label>
        ))}

        {error ? (
          <p className="field-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </fieldset>
    );
  }

  const shared = {
    id: question.key,
    name: question.key,
    value,
    required,
    disabled,
    maxLength: question.maxLength,
    "aria-describedby": describedBy,
    "aria-invalid": error ? (true as const) : undefined,
    autoComplete: question.autoComplete,
  };

  return (
    <div className="field">
      <label htmlFor={question.key}>
        {question.label}
        {required ? null : <span className="optional"> (optional)</span>}
      </label>
      {question.help ? (
        <p className="help" id={helpId}>
          {question.help}
        </p>
      ) : null}

      {question.kind === "textarea" ? (
        <textarea {...shared} rows={4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...shared} type="text" onChange={(e) => onChange(e.target.value)} />
      )}

      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
