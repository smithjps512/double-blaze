import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_JOIN_QUESTIONS,
  JOIN_ANSWER_KEYS,
  JOIN_QUESTIONS,
  NAME_QUESTION,
  requiresInterest,
  summarizeJoinAnswers,
  validateJoinSubmission,
} from "./join.js";

/** A submission that should always pass, so a test can vary one field at a time. */
function goodSubmission(over: Record<string, unknown> = {}) {
  return {
    display_name: "Dana Okafor",
    employer: "Cascade Power Authority",
    role_title: "Director of Grid Planning",
    industry: "grid",
    ...over,
  };
}

describe("the question set", () => {
  it("asks for a name plus four questions and no more", () => {
    assert.equal(ALL_JOIN_QUESTIONS.length, 5);
    assert.deepEqual(JOIN_ANSWER_KEYS, ["employer", "role_title", "industry", "interest"]);
  });

  it("keeps the name out of join_answers, because it is a column", () => {
    assert.ok(!JOIN_ANSWER_KEYS.includes(NAME_QUESTION.key));
  });

  it("uses no em dashes in any question copy", () => {
    for (const question of ALL_JOIN_QUESTIONS) {
      const copy = [question.label, question.help ?? ""]
        .concat((question.choices ?? []).flatMap((c) => [c.label, c.help]))
        .join(" ");
      assert.ok(!copy.includes("—"), `em dash in ${question.key}`);
    }
  });
});

describe("validateJoinSubmission", () => {
  it("accepts a complete answer", () => {
    const result = validateJoinSubmission(goodSubmission());
    assert.ok(result.ok);
    assert.equal(result.submission.displayName, "Dana Okafor");
    assert.deepEqual(result.submission.answers, {
      employer: "Cascade Power Authority",
      role_title: "Director of Grid Planning",
      industry: "grid",
    });
  });

  it("leaves an unanswered optional question out rather than storing an empty string", () => {
    const result = validateJoinSubmission(goodSubmission({ interest: "   " }));
    assert.ok(result.ok);
    assert.ok(!("interest" in result.submission.answers));
  });

  it("keeps the free-text answer when it is given", () => {
    const result = validateJoinSubmission(
      goodSubmission({ interest: "Forecasting methods, and what other planners are reading." }),
    );
    assert.ok(result.ok);
    assert.equal(
      result.submission.answers.interest,
      "Forecasting methods, and what other planners are reading.",
    );
  });

  it("reports every problem at once", () => {
    const result = validateJoinSubmission({ display_name: "", employer: "", industry: "" });
    assert.ok(!result.ok);
    assert.deepEqual(Object.keys(result.errors).sort(), [
      "display_name",
      "employer",
      "industry",
      "role_title",
    ]);
  });

  it("rejects a missing body outright rather than throwing", () => {
    for (const input of [null, undefined, "nope", 42, []]) {
      const result = validateJoinSubmission(input);
      assert.ok(!result.ok, `accepted ${JSON.stringify(input)}`);
    }
  });

  it("treats whitespace as absent", () => {
    const result = validateJoinSubmission(goodSubmission({ display_name: " \t \n " }));
    assert.ok(!result.ok);
    assert.ok(result.errors.display_name);
  });

  it("ignores keys that are not questions", () => {
    const result = validateJoinSubmission(
      goodSubmission({ role: "admin", status: "active", site_id: "somewhere-else" }),
    );
    assert.ok(result.ok);
    assert.deepEqual(Object.keys(result.submission.answers).sort(), [
      "employer",
      "industry",
      "role_title",
    ]);
  });

  it("rejects an industry that is not one of the offered choices", () => {
    const result = validateJoinSubmission(goodSubmission({ industry: "finance" }));
    assert.ok(!result.ok);
    assert.ok(result.errors.industry);
  });

  it("rejects a non-string answer instead of coercing it", () => {
    const result = validateJoinSubmission(goodSubmission({ employer: { name: "Cascade" } }));
    assert.ok(!result.ok);
    assert.ok(result.errors.employer);
  });

  it("enforces the length limit on each field", () => {
    const long = "x".repeat(1000);
    for (const question of ALL_JOIN_QUESTIONS) {
      if (question.kind === "choice") continue;
      const result = validateJoinSubmission(goodSubmission({ [question.key]: long }));
      assert.ok(!result.ok, `accepted ${question.key} at 1000 characters`);
      assert.ok(result.errors[question.key]);
    }
  });

  it("collapses whitespace in a single-line answer", () => {
    const result = validateJoinSubmission(
      goodSubmission({ employer: "  Cascade   Power\tAuthority  " }),
    );
    assert.ok(result.ok);
    assert.equal(result.submission.answers.employer, "Cascade Power Authority");
  });

  it("strips control characters that a paste can carry in", () => {
    const result = validateJoinSubmission(
      goodSubmission({ employer: "Cascade\u0007 Power\u0000Authority" }),
    );
    assert.ok(result.ok);
    assert.equal(result.submission.answers.employer, "Cascade Power Authority");
  });

  it("keeps paragraphs in the free-text answer but not blank runs", () => {
    const result = validateJoinSubmission(
      goodSubmission({ interest: "First thought.\n\n\n\nSecond thought.  " }),
    );
    assert.ok(result.ok);
    assert.equal(result.submission.answers.interest, "First thought.\n\nSecond thought.");
  });

  it("flattens newlines pasted into a single-line answer", () => {
    const result = validateJoinSubmission(goodSubmission({ role_title: "Director\nGrid Planning" }));
    assert.ok(result.ok);
    assert.equal(result.submission.answers.role_title, "Director Grid Planning");
  });
});

describe("the free text is required only when the structured answers decide nothing", () => {
  it("is optional for a grid applicant", () => {
    assert.equal(requiresInterest("grid"), false);
    assert.ok(validateJoinSubmission(goodSubmission({ industry: "grid" })).ok);
  });

  it("is optional for an AI applicant", () => {
    assert.equal(requiresInterest("ai"), false);
    assert.ok(validateJoinSubmission(goodSubmission({ industry: "ai" })).ok);
  });

  it("is required when the applicant fits neither industry", () => {
    assert.equal(requiresInterest("other"), true);
    const result = validateJoinSubmission(goodSubmission({ industry: "other" }));
    assert.ok(!result.ok);
    assert.ok(result.errors.interest);
  });

  it("passes for that applicant once they explain", () => {
    const result = validateJoinSubmission(
      goodSubmission({ industry: "other", interest: "I research grid interconnection policy." }),
    );
    assert.ok(result.ok);
    assert.equal(result.submission.answers.industry, "other");
  });
});

describe("summarizeJoinAnswers", () => {
  it("returns the questions in the order they were asked, with readable choices", () => {
    const rows = summarizeJoinAnswers({
      industry: "ai",
      employer: "Northwind Models",
      role_title: "Research engineer",
    });
    assert.deepEqual(
      rows.map((r) => r.key),
      ["employer", "role_title", "industry"],
    );
    assert.equal(rows[2].value, "The AI industry");
  });

  it("skips questions that were not answered", () => {
    const rows = summarizeJoinAnswers({ employer: "Cascade Power Authority" });
    assert.equal(rows.length, 1);
  });

  it("still shows an answer whose question has since been retired", () => {
    const rows = summarizeJoinAnswers({ employer: "Cascade", former_question: "an old answer" });
    assert.ok(rows.some((r) => r.key === "former_question" && r.value === "an old answer"));
  });

  it("survives a null or malformed answer set", () => {
    assert.deepEqual(summarizeJoinAnswers(null), []);
    assert.deepEqual(summarizeJoinAnswers(undefined), []);
    assert.deepEqual(summarizeJoinAnswers({ employer: 7 } as never), []);
  });

  it("has a label for every question it can be handed", () => {
    const answers = Object.fromEntries(JOIN_QUESTIONS.map((q) => [q.key, "grid"]));
    const rows = summarizeJoinAnswers(answers);
    for (const row of rows) assert.ok(row.label.length > 0);
  });
});
