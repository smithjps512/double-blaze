"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Specimen } from "@/lib/plant-id";

/**
 * The classroom bench. Students open this on a Chromebook, put a name on a
 * photo or vote for one somebody else put up, and watch the tally move.
 *
 * No sign in and no student name, anywhere. The voter token below is a random
 * string this browser makes up and keeps, so a device can change its own vote
 * and cannot vote twice. It is not an account and identifies nobody.
 */

type Tab = "unknown" | "needs_photo" | "settled";

const TAB_LABEL: Record<Tab, string> = {
  unknown: "No name yet",
  needs_photo: "Needs a better photo",
  settled: "Settled",
};

const TAB_NOTE: Record<Tab, string> = {
  unknown:
    "These came out of the greenhouse folder with no name on them. Type what you think it is, or vote for a name someone already put up. Vote for theirs rather than adding the same answer twice.",
  needs_photo:
    "We know what these are. The problem is the photo belongs to a plant nursery, so we are not allowed to put it on the website. Find one we can use, say where you found it, and vote on the best one.",
  settled:
    "Done. The class agreed on a name and it got checked, so this plant is ready for the website.",
};

function useVoterKey(): string {
  const [key, setKey] = useState("");
  useEffect(() => {
    let value = "";
    try {
      value = localStorage.getItem("greenhouse.voter") ?? "";
      if (!value) {
        value = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("greenhouse.voter", value);
      }
    } catch {
      // Private window: voting still works for this page load.
      value = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    setKey(value);
  }, []);
  return key;
}

/**
 * The teacher's code, remembered on her own machine so she types it once a
 * term rather than once a photo. It unlocks attaching photos and settling
 * names. A classroom lock, not a security boundary: the server checks it on
 * every call and nothing here is trusted.
 */
function useTeacherCode(): [string, (value: string) => void] {
  const [code, setCode] = useState("");
  useEffect(() => {
    try {
      setCode(localStorage.getItem("greenhouse.teacher") ?? "");
    } catch {
      // Private window: she can still type it in for this session.
    }
  }, []);
  const save = useCallback((value: string) => {
    setCode(value);
    try {
      if (value) localStorage.setItem("greenhouse.teacher", value);
      else localStorage.removeItem("greenhouse.teacher");
    } catch {
      // Nothing to do; the code stays in memory for this page load.
    }
  }, []);
  return [code, save];
}

export function NameThatPlant({ initial }: { initial: Specimen[] }) {
  const [specimens, setSpecimens] = useState<Specimen[]>(initial);
  const [tab, setTab] = useState<Tab>("unknown");
  const [message, setMessage] = useState("");
  const [teacherCode, setTeacherCode] = useTeacherCode();
  const [showTeacher, setShowTeacher] = useState(false);
  const voter = useVoterKey();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!voter) return;
    try {
      const res = await fetch(`/api/greenhouse/list?voter=${encodeURIComponent(voter)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data.specimens)) setSpecimens(data.specimens);
    } catch {
      // A dropped poll is not worth telling a classroom about; the next one works.
    }
  }, [voter]);

  // Everyone is looking at the same board, so it has to move without a reload.
  useEffect(() => {
    if (!voter) return;
    refresh();
    timer.current = setInterval(refresh, 4000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [voter, refresh]);

  async function post(path: string, body: Record<string, unknown>) {
    setMessage("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, voter }),
      });
      const data = await res.json();
      if (data.error) setMessage(data.error);
      await refresh();
    } catch {
      setMessage("That did not go through. Check your connection and try again.");
    }
  }

  const settledCount = specimens.filter((s) => s.settledName).length;
  const nameCount = specimens.reduce((total, s) => total + s.names.length, 0);
  const voteCount = specimens.reduce(
    (total, s) => total + s.names.reduce((sum, n) => sum + n.votes, 0),
    0,
  );

  const shown = specimens.filter((s) =>
    tab === "settled" ? Boolean(s.settledName) : !s.settledName && s.kind === tab,
  );

  async function uploadPhoto(specimenId: string, file: File) {
    setMessage("Uploading…");
    const form = new FormData();
    form.append("specimenId", specimenId);
    form.append("code", teacherCode);
    form.append("file", file);
    try {
      const res = await fetch("/api/greenhouse/photo", { method: "POST", body: form });
      const data = await res.json();
      setMessage(data.error ?? "Photo added.");
      await refresh();
    } catch {
      setMessage("The upload did not go through. Try again.");
    }
  }

  return (
    <>
      <ul className="mt-6 flex flex-wrap gap-2 p-0 text-sm">
        <Stat label="waiting" value={specimens.length - settledCount} />
        <Stat label="names put up" value={nameCount} />
        <Stat label="votes cast" value={voteCount} />
        <Stat label="settled" value={settledCount} />
      </ul>

      <div className="mt-8 flex flex-wrap gap-1 border-b border-ink/10">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
              tab === key
                ? "border-trail-orange text-ink"
                : "border-transparent text-hokie-gray hover:text-ink"
            }`}
          >
            {TAB_LABEL[key]}
          </button>
        ))}
      </div>

      <p className="mt-6 max-w-3xl rounded-lg border border-ink/10 bg-ridge-green/5 p-4 text-sm leading-relaxed">
        {TAB_NOTE[tab]}
      </p>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-trail-orange/40 bg-trail-orange/5 p-3 text-sm text-impact-orange"
        >
          {message}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-ink/15 p-4">
        <button
          type="button"
          onClick={() => setShowTeacher((open) => !open)}
          className="text-xs font-semibold uppercase tracking-wider text-hokie-gray hover:text-ink"
        >
          {showTeacher ? "Hide teacher tools" : "Teacher tools"}
        </button>
        {showTeacher && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-ink/70" htmlFor="teacher-code">
              Teacher code
            </label>
            <input
              id="teacher-code"
              type="password"
              value={teacherCode}
              autoComplete="off"
              onChange={(event) => setTeacherCode(event.target.value)}
              className="w-44 rounded border border-ink/15 bg-stone-white px-3 py-2 text-sm"
            />
            <p className="text-sm text-hokie-gray">
              {teacherCode
                ? "Attach photo and Settle now show on every card."
                : "Type it once and this browser remembers it."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.length === 0 && (
          <p className="text-sm text-hokie-gray">
            {tab === "settled"
              ? "Nothing settled yet. Once a name wins and gets checked it lands here."
              : "All done in this pile."}
          </p>
        )}
        {shown.map((specimen) => (
          <SpecimenCard
            key={specimen.id}
            specimen={specimen}
            onPost={post}
            teacherCode={teacherCode}
            onUpload={uploadPhoto}
          />
        ))}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-full border border-ink/10 px-3 py-1 text-sm text-hokie-gray">
      <b className="font-semibold tabular-nums text-ink">{value}</b> {label}
    </li>
  );
}

function SpecimenCard({
  specimen,
  onPost,
  teacherCode,
  onUpload,
}: {
  specimen: Specimen;
  onPost: (path: string, body: Record<string, unknown>) => Promise<void>;
  teacherCode: string;
  onUpload: (specimenId: string, file: File) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const settled = Boolean(specimen.settledName);
  const top = specimen.names[0];

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${
        settled ? "border-ridge-green/50" : "border-ink/10"
      }`}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-ridge-green/5">
        {specimen.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/greenhouse/media/${specimen.imagePath}`}
            alt={settled ? specimen.settledName! : "A plant from the greenhouse, not yet named"}
            className="h-full w-full object-cover"
          />
        ) : (
          <p className="px-6 text-center text-xs uppercase tracking-wider text-hokie-gray">
            {specimen.kind === "needs_photo" ? "Photo we cannot use" : "Photo not added yet"}
          </p>
        )}
        {settled && (
          <span className="absolute bottom-2 right-2 rounded border border-ridge-green bg-white px-2 py-1 text-xs font-semibold text-ridge-green">
            {specimen.settledName}
          </span>
        )}
      </div>

      <div className="border-b border-dashed border-ink/10 p-4">
        <p className="break-all font-mono text-[10px] uppercase tracking-wider text-hokie-gray">
          {specimen.fileName}
        </p>
        {specimen.kind === "needs_photo" ? (
          <>
            <p className="mt-1 font-display text-lg italic text-blaze-maroon">{specimen.species}</p>
            <p className="mt-1 text-sm text-ink/70">
              {specimen.commonName}. The photo we have belongs to {specimen.photoSource}.
            </p>
          </>
        ) : (
          <p className="mt-1 font-display text-lg text-hokie-gray">
            {settled ? specimen.settledName : "Not named yet"}
          </p>
        )}
      </div>

      {!settled && (
        <>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hokie-gray">
              {specimen.kind === "needs_photo" ? "Photos people found" : "Names put up"}
            </p>
            {specimen.names.length === 0 && (
              <p className="text-sm text-hokie-gray">Nobody has answered yet. Be first.</p>
            )}
            {specimen.names.map((name, index) => (
              <div
                key={name.id}
                className={`flex items-center gap-3 rounded border border-l-[3px] bg-stone-white px-3 py-2 ${
                  index === 0 && name.votes > 0
                    ? "border-l-ridge-green border-ink/10"
                    : "border-ink/10 border-l-ink/10"
                }`}
              >
                <span className="flex-1 break-words text-sm">{name.name}</span>
                <button
                  type="button"
                  aria-pressed={name.mine}
                  aria-label={`Vote for ${name.name}`}
                  onClick={() =>
                    onPost("/api/greenhouse/vote", {
                      specimenId: specimen.id,
                      nameId: name.id,
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs tabular-nums transition ${
                    name.mine
                      ? "border-ridge-green bg-ridge-green text-white"
                      : "border-ink/15 text-hokie-gray hover:border-ridge-green hover:text-ridge-green"
                  }`}
                >
                  {name.mine ? "✓ " : ""}
                  {name.votes}
                </button>
              </div>
            ))}
          </div>

          <form
            className="flex gap-2 p-4 pt-0"
            onSubmit={async (event) => {
              event.preventDefault();
              const value = draft.trim();
              if (!value) return;
              setDraft("");
              await onPost("/api/greenhouse/name", { specimenId: specimen.id, name: value });
            }}
          >
            <label className="sr-only" htmlFor={`name-${specimen.id}`}>
              {specimen.kind === "needs_photo"
                ? "Where you found a photo we can use"
                : "What plant do you think this is?"}
            </label>
            <input
              id={`name-${specimen.id}`}
              value={draft}
              maxLength={90}
              autoComplete="off"
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                specimen.kind === "needs_photo" ? "Where did you find one?" : "What is it?"
              }
              className="min-w-0 flex-1 rounded border border-ink/15 bg-stone-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded bg-ridge-green px-4 py-2 text-xs font-semibold text-white"
            >
              Put it up
            </button>
          </form>

          {teacherCode && (
            <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-ink/10 bg-stone-white px-4 py-3">
              <span className="mr-auto text-[10px] font-semibold uppercase tracking-wider text-impact-orange">
                Teacher
              </span>
              <label
                className="cursor-pointer rounded border border-ridge-green px-3 py-1.5 text-xs font-semibold text-ridge-green"
                htmlFor={`photo-${specimen.id}`}
              >
                {specimen.imagePath ? "Replace photo" : "Attach photo"}
                <input
                  id={`photo-${specimen.id}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void onUpload(specimen.id, file);
                  }}
                />
              </label>
              <button
                type="button"
                disabled={!top}
                onClick={() =>
                  onPost("/api/greenhouse/settle", {
                    specimenId: specimen.id,
                    name: top?.name ?? "",
                    code: teacherCode,
                  })
                }
                className="rounded bg-impact-orange px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                {top ? `Settle on “${top.name}”` : "Settle"}
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
