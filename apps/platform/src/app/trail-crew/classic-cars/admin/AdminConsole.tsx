"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Car, Part, QuizQuestion } from "@/lib/showcase-db";
import s from "../showcase.module.css";

type Kind = "cars" | "parts" | "quiz";

/**
 * The console.
 *
 * Deliberately plain: every field is labelled with the thing it changes on the
 * site, and the row keeps its own draft so a half typed car is not lost when
 * somebody opens another one. After every save the server component reloads,
 * so what is on screen is what is in the database rather than what this
 * component hoped it wrote.
 */
export default function AdminConsole({
  team,
  cars,
  parts,
  quiz,
}: {
  team: string;
  cars: Car[];
  parts: Part[];
  quiz: QuizQuestion[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("cars");

  const counts: Record<Kind, number> = { cars: cars.length, parts: parts.length, quiz: quiz.length };
  const tabs: Array<{ key: Kind; label: string }> = [
    { key: "cars", label: "Cars" },
    { key: "parts", label: "Parts" },
    { key: "quiz", label: "Quiz" },
  ];

  const signOut = async () => {
    await fetch(`/api/showcase/signin?team=${encodeURIComponent(team)}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <div className={s.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${s.tab} ${kind === t.key ? s.tabOn : ""}`}
            onClick={() => setKind(t.key)}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
        <button type="button" className={s.tab} onClick={signOut} style={{ marginLeft: "auto" }}>
          Sign out
        </button>
      </div>

      {kind === "cars" && <CarsTab team={team} cars={cars} />}
      {kind === "parts" && <PartsTab team={team} parts={parts} />}
      {kind === "quiz" && <QuizTab team={team} quiz={quiz} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared plumbing                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Every save, add and delete goes through here so they all report the same way
 * and all end with the server component reloading. A student who saves and sees
 * nothing change has learned the wrong lesson about whether their work landed.
 */
function useRows(team: string, kind: Kind) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  const send = async (method: "POST" | "PATCH" | "DELETE", values: Record<string, unknown>, said: string) => {
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const res = await fetch("/api/showcase/rows", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team, kind, ...values }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(said);
        router.refresh();
        return true;
      }
      setFailed(true);
      setMessage(data.error ?? "That did not work.");
      return false;
    } catch {
      setFailed(true);
      setMessage("Could not reach the server. Check you are online.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, message, failed, send };
}

function Status({ busy, message, failed }: { busy: boolean; message: string; failed: boolean }) {
  if (!busy && !message) return null;
  return (
    <span className={`${s.note} ${failed ? s.noteError : ""}`}>{busy ? "Saving" : message}</span>
  );
}

function ExampleBadge({ shown }: { shown: boolean }) {
  if (!shown) return null;
  return <span className={s.pill}>Replace me</span>;
}

/* -------------------------------------------------------------------------- */
/* Cars                                                                       */
/* -------------------------------------------------------------------------- */

function CarsTab({ team, cars }: { team: string; cars: Car[] }) {
  const examples = cars.filter((c) => c.isExample).length;
  return (
    <>
      {examples > 0 && (
        <div className={s.adminBanner}>
          <strong>
            {examples} of these cars {examples === 1 ? "is a placeholder" : "are placeholders"}.
          </strong>{" "}
          We put them there so the site would not be empty on your first day.
          Picking the cars is your job, so change them for ones you actually
          think are cool. The badge disappears as soon as you edit a car.
        </div>
      )}
      <NewCar team={team} nextOrder={cars.length + 1} />
      {cars.map((car) => (
        <CarRow key={car.id} team={team} car={car} />
      ))}
    </>
  );
}

function NewCar({ team, nextOrder }: { team: string; nextOrder: number }) {
  const { busy, message, failed, send } = useRows(team, "cars");
  const [name, setName] = useState("");

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>Add a car</span>
      </div>
      <label className={s.field}>
        <span className={s.fieldLabel}>Name (this is the heading on its page)</span>
        <input
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="1970 Dodge Charger"
        />
      </label>
      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy || !name.trim()}
          onClick={async () => {
            const ok = await send("POST", { name: name.trim(), sort_order: nextOrder }, "Added. Fill in its stats below.");
            if (ok) setName("");
          }}
        >
          Add it
        </button>
        <Status busy={busy} message={message} failed={failed} />
      </div>
    </div>
  );
}

function CarRow({ team, car }: { team: string; car: Car }) {
  const { busy, message, failed, send } = useRows(team, "cars");
  const [draft, setDraft] = useState({
    name: car.name,
    year: car.year?.toString() ?? "",
    top_speed: car.topSpeed?.toString() ?? "",
    horsepower: car.horsepower?.toString() ?? "",
    special: car.special,
    sort_order: car.sortOrder.toString(),
  });
  const [imagePath, setImagePath] = useState(car.imagePath);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.set("team", team);
      form.set("file", file);
      const res = await fetch("/api/showcase/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.ok) {
        setUploadError(data.error ?? "That did not work.");
        return;
      }
      setImagePath(data.path);
      await send("PATCH", { id: car.id, image_path: data.path }, "Photo saved.");
    } catch {
      setUploadError("Could not upload it. Check you are online.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        {imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.thumb} src={`/api/showcase/media/${imagePath}`} alt="" />
        ) : (
          <span className={`${s.thumb} ${s.thumbEmpty}`} aria-hidden>
            No photo
          </span>
        )}
        <span className={s.rowTitle}>{car.name}</span>
        <ExampleBadge shown={car.isExample} />
        <Link href={`/trail-crew/classic-cars/cars/${car.slug}`} className={s.navLink}>
          View
        </Link>
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>Photo</span>
        <input
          type="file"
          accept="image/*"
          className={s.input}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {uploading && <p className={s.note}>Uploading</p>}
      {uploadError && <p className={`${s.note} ${s.noteError}`}>{uploadError}</p>}

      <label className={s.field}>
        <span className={s.fieldLabel}>Name</span>
        <input
          className={s.input}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>

      <div className={s.fieldRow} style={{ marginTop: 14 }}>
        <label>
          <span className={s.fieldLabel}>Year</span>
          <input
            className={s.input}
            inputMode="numeric"
            value={draft.year}
            onChange={(e) => setDraft({ ...draft, year: e.target.value })}
          />
        </label>
        <label>
          <span className={s.fieldLabel}>Horsepower</span>
          <input
            className={s.input}
            inputMode="numeric"
            value={draft.horsepower}
            onChange={(e) => setDraft({ ...draft, horsepower: e.target.value })}
          />
        </label>
        <label>
          <span className={s.fieldLabel}>Top speed (mph)</span>
          <input
            className={s.input}
            inputMode="numeric"
            value={draft.top_speed}
            onChange={(e) => setDraft({ ...draft, top_speed: e.target.value })}
          />
        </label>
        <label>
          <span className={s.fieldLabel}>Order on the page</span>
          <input
            className={s.input}
            inputMode="numeric"
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
          />
        </label>
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>What makes it special</span>
        <textarea
          className={s.textarea}
          rows={4}
          value={draft.special}
          onChange={(e) => setDraft({ ...draft, special: e.target.value })}
        />
      </label>

      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy}
          onClick={() => send("PATCH", { id: car.id, ...draft }, "Saved. Go and look at the site.")}
        >
          Save
        </button>
        <DeleteButton
          label={car.name}
          busy={busy}
          onDelete={() => send("DELETE", { id: car.id }, "Deleted.")}
        />
        <Status busy={busy} message={message} failed={failed} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parts                                                                      */
/* -------------------------------------------------------------------------- */

function PartsTab({ team, parts }: { team: string; parts: Part[] }) {
  return (
    <>
      <div className={s.adminBanner}>
        <strong>Horsepower is what puts a part in the builder.</strong> Leave it
        empty and the part gets a page but no tick box, which is right for
        brakes. Type a number and it appears in the builder worth that much.
        Zero is a real answer: it puts the part on the screen and adds nothing,
        which is the truth about tires and the best thing on that page.
      </div>
      <NewPart team={team} nextOrder={parts.length + 1} />
      {parts.map((part) => (
        <PartRow key={part.id} team={team} part={part} />
      ))}
    </>
  );
}

function NewPart({ team, nextOrder }: { team: string; nextOrder: number }) {
  const { busy, message, failed, send } = useRows(team, "parts");
  const [name, setName] = useState("");

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>Add a part</span>
      </div>
      <label className={s.field}>
        <span className={s.fieldLabel}>Name</span>
        <input
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Supercharger"
        />
      </label>
      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy || !name.trim()}
          onClick={async () => {
            const ok = await send("POST", { name: name.trim(), sort_order: nextOrder }, "Added. Now write what it does.");
            if (ok) setName("");
          }}
        >
          Add it
        </button>
        <Status busy={busy} message={message} failed={failed} />
      </div>
    </div>
  );
}

function PartRow({ team, part }: { team: string; part: Part }) {
  const { busy, message, failed, send } = useRows(team, "parts");
  const [draft, setDraft] = useState({
    name: part.name,
    what_it_does: part.whatItDoes,
    if_upgraded: part.ifUpgraded,
    hp_gain: part.hpGain === null ? "" : part.hpGain.toString(),
    sort_order: part.sortOrder.toString(),
  });

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>{part.name}</span>
        <ExampleBadge shown={part.isExample} />
        <Link href={`/trail-crew/classic-cars/parts/${part.slug}`} className={s.navLink}>
          View
        </Link>
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>Name</span>
        <input
          className={s.input}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>

      <label className={s.field}>
        <span className={s.fieldLabel}>What it does, in plain words</span>
        <textarea
          className={s.textarea}
          rows={5}
          value={draft.what_it_does}
          onChange={(e) => setDraft({ ...draft, what_it_does: e.target.value })}
        />
      </label>

      <label className={s.field}>
        <span className={s.fieldLabel}>What happens if you upgrade it</span>
        <textarea
          className={s.textarea}
          rows={4}
          value={draft.if_upgraded}
          onChange={(e) => setDraft({ ...draft, if_upgraded: e.target.value })}
        />
      </label>

      <div className={s.fieldRow} style={{ marginTop: 14 }}>
        <label>
          <span className={s.fieldLabel}>Horsepower in the builder</span>
          <input
            className={s.input}
            inputMode="numeric"
            placeholder="empty = not a bolt-on"
            value={draft.hp_gain}
            onChange={(e) => setDraft({ ...draft, hp_gain: e.target.value })}
          />
        </label>
        <label>
          <span className={s.fieldLabel}>Order on the page</span>
          <input
            className={s.input}
            inputMode="numeric"
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
          />
        </label>
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy}
          onClick={() => send("PATCH", { id: part.id, ...draft }, "Saved.")}
        >
          Save
        </button>
        <DeleteButton
          label={part.name}
          busy={busy}
          onDelete={() => send("DELETE", { id: part.id }, "Deleted.")}
        />
        <Status busy={busy} message={message} failed={failed} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quiz                                                                       */
/* -------------------------------------------------------------------------- */

function QuizTab({ team, quiz }: { team: string; quiz: QuizQuestion[] }) {
  return (
    <>
      <div className={s.adminBanner}>
        <strong>Your own story says the questions come from your parts pages.</strong>{" "}
        Somebody who read those pages should be able to get every one of these
        right. If a question cannot be answered from what you wrote, either the
        question is unfair or the part page is missing something.
      </div>
      <NewQuestion team={team} nextOrder={quiz.length + 1} />
      {quiz.map((q) => (
        <QuestionRow key={q.id} team={team} question={q} />
      ))}
    </>
  );
}

function NewQuestion({ team, nextOrder }: { team: string; nextOrder: number }) {
  const { busy, message, failed, send } = useRows(team, "quiz");
  const [question, setQuestion] = useState("");

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>Add a question</span>
      </div>
      <label className={s.field}>
        <span className={s.fieldLabel}>The question</span>
        <input
          className={s.input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What does a supercharger do?"
        />
      </label>
      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy || !question.trim()}
          onClick={async () => {
            const ok = await send(
              "POST",
              {
                question: question.trim(),
                choices: ["", "", "", ""],
                answer_index: 0,
                sort_order: nextOrder,
              },
              "Added. Now write the answers.",
            );
            if (ok) setQuestion("");
          }}
        >
          Add it
        </button>
        <Status busy={busy} message={message} failed={failed} />
      </div>
    </div>
  );
}

function QuestionRow({ team, question }: { team: string; question: QuizQuestion }) {
  const { busy, message, failed, send } = useRows(team, "quiz");
  const [text, setText] = useState(question.question);
  const [choices, setChoices] = useState<string[]>(
    question.choices.length > 0 ? [...question.choices] : ["", "", "", ""],
  );
  const [answer, setAnswer] = useState(question.answerIndex);
  const [order, setOrder] = useState(question.sortOrder.toString());

  const setChoice = (index: number, value: string) => {
    const next = [...choices];
    next[index] = value;
    setChoices(next);
  };

  const filled = choices.filter((c) => c.trim().length > 0);
  const answerIsBlank = !choices[answer]?.trim();

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>{question.question}</span>
        <ExampleBadge shown={question.isExample} />
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>The question</span>
        <input className={s.input} value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      {choices.map((choice, index) => (
        <label className={s.field} key={index}>
          <span className={s.fieldLabel}>
            Answer {index + 1}
            {index === answer ? " — this is the right one" : ""}
          </span>
          <input
            className={s.input}
            value={choice}
            onChange={(e) => setChoice(index, e.target.value)}
          />
        </label>
      ))}

      <div className={s.fieldRow} style={{ marginTop: 14 }}>
        <label>
          <span className={s.fieldLabel}>Which one is right</span>
          <select
            className={s.select}
            value={answer}
            onChange={(e) => setAnswer(Number(e.target.value))}
          >
            {choices.map((choice, index) => (
              <option key={index} value={index}>
                {index + 1}. {choice.trim() || "(empty)"}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={s.fieldLabel}>Order in the quiz</span>
          <input
            className={s.input}
            inputMode="numeric"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </label>
      </div>

      {answerIsBlank && (
        <p className={`${s.note} ${s.noteError}`} style={{ marginTop: 12 }}>
          The one you marked right is empty. Fill it in before you save, or
          nobody can pick it.
        </p>
      )}

      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy || filled.length < 2 || answerIsBlank}
          onClick={() =>
            send(
              "PATCH",
              { id: question.id, question: text, choices, answer_index: answer, sort_order: order },
              "Saved.",
            )
          }
        >
          Save
        </button>
        <DeleteButton
          label="this question"
          busy={busy}
          onDelete={() => send("DELETE", { id: question.id }, "Deleted.")}
        />
        <Status busy={busy} message={message} failed={failed} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Delete asks once.
 *
 * Not a modal and not a typed confirmation: a second click is enough friction
 * for a row that took a minute to write, and the button says what it is about
 * to remove so an accidental click on the wrong row is caught by reading it.
 */
function DeleteButton({
  label,
  busy,
  onDelete,
}: {
  label: string;
  busy: boolean;
  onDelete: () => void;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button type="button" className={s.dangerButton} disabled={busy} onClick={() => setArmed(true)}>
        Delete
      </button>
    );
  }
  return (
    <>
      <button type="button" className={s.dangerButton} disabled={busy} onClick={onDelete}>
        Really delete {label}
      </button>
      <button type="button" className={s.ghostButton} style={{ marginTop: 0 }} onClick={() => setArmed(false)}>
        Keep it
      </button>
    </>
  );
}
