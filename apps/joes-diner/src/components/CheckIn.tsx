"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CheckinView } from "@/lib/views";
import { describeWait } from "@/lib/wait";
import { Logo } from "./Logo";
import { Offline } from "./Offline";
import { post, usePoll } from "./usePoll";

/**
 * Guest check-in. The same flow runs on the counter tablet ("counter") and
 * on a guest's own phone after scanning the QR code ("phone"). Guests see
 * the wait before they check in, choose table or bar with both waits in
 * front of them, and are told plainly that the whole party must be here and
 * to stay close.
 */

type Step = "start" | "size" | "choice" | "here" | "name" | "done";
type Choice = "table" | "bar_ok" | "any";

const RESET_AFTER_MS = 60_000;

export function CheckIn({ mode }: { mode: "counter" | "phone" }) {
  const { data, offline } = usePoll<CheckinView>("/api/checkin", mode === "counter" ? 5000 : 15000);
  const router = useRouter();
  const [step, setStep] = useState<Step>("start");
  const [size, setSize] = useState(2);
  const [choice, setChoice] = useState<Choice>("any");
  const [allHere, setAllHere] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; minutes: number | null } | null>(null);
  const touched = useRef(Date.now());

  const reset = () => {
    setStep("start");
    setSize(2);
    setChoice("any");
    setAllHere(true);
    setName("");
    setError(null);
    setDone(null);
  };

  // The counter tablet goes back to the start if a guest walks away mid-way.
  useEffect(() => {
    if (mode !== "counter") return;
    const id = setInterval(() => {
      const idle = Date.now() - touched.current;
      if (step === "done" ? idle > 20_000 : step !== "start" && idle > RESET_AFTER_MS) reset();
    }, 2000);
    return () => clearInterval(id);
  }, [mode, step]);

  const go = (s: Step) => {
    touched.current = Date.now();
    setError(null);
    setStep(s);
  };

  const submit = async () => {
    setBusy(true);
    const r = await post("/api/checkin", { name, size, choice, allHere });
    setBusy(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    if (mode === "phone" && typeof r.data.token === "string") {
      router.replace(`/p/${r.data.token}?new=1`);
      return;
    }
    setDone({ name: name.trim(), minutes: typeof r.data.minutes === "number" ? r.data.minutes : null });
    go("done");
  };

  if (!data) {
    return <Shell mode={mode}><p className="p-10 text-center text-xl text-muted">One moment...</p></Shell>;
  }

  if (!data.open) {
    return (
      <Shell mode={mode}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Logo className="h-48 w-auto" />
          <h1 className="text-3xl font-black">Welcome to Joe&apos;s!</h1>
          <p className="text-xl text-muted">Check-in opens when we do. Open 8 am to 2 pm, Wednesday to Sunday.</p>
        </div>
      </Shell>
    );
  }

  const q = data.quotes[Math.min(size, 8)] ?? { table: null, bar: null };
  const barFits = size <= 9;
  const waitFor = (c: Choice) =>
    c === "table" ? q.table : c === "bar_ok" ? (q.bar ?? q.table) : [q.table, q.bar].filter((m): m is number => m !== null).reduce((a, b) => Math.min(a, b), Infinity);
  const two = data.quotes[2];

  return (
    <Shell mode={mode} offline={offline}>
      {step === "start" && (
        <div className={`flex flex-1 ${mode === "counter" ? "gap-6 p-8" : "flex-col gap-5 p-5"}`}>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Logo className={mode === "counter" ? "h-56 w-auto" : "h-40 w-auto"} />
            <h1 className="mt-4 font-display text-4xl text-joe">Welcome to Joe&apos;s!</h1>
            <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-3">
              <WaitCard label="Table" minutes={two.table} />
              <WaitCard label="Bar" minutes={two.bar} />
            </div>
            <p className="mt-2 text-sm text-muted">Current waits for 2 guests. Your wait depends on party size.</p>
            <Rules hold={data.holdSeconds} />
            <button className="btn-primary mt-6 h-20 w-full max-w-md text-3xl" onClick={() => go("size")}>
              Check in
            </button>
            {mode === "phone" && data.menuUrl && (
              <a className="btn-light mt-3 w-full max-w-md" href={data.menuUrl} target="_blank" rel="noreferrer">
                See the menu
              </a>
            )}
          </div>
          {mode === "counter" && <Line data={data} />}
          {mode === "phone" && data.line.length > 0 && (
            <p className="text-center text-muted">
              {data.line.length} {data.line.length === 1 ? "party" : "parties"} waiting now.
            </p>
          )}
        </div>
      )}

      {step === "size" && (
        <Step title="How many in your party?" onBack={() => go("start")}>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button key={n} className={`btn-light h-24 text-4xl ${size === n ? "border-joe text-joe" : ""}`} onClick={() => { setSize(n); go("choice"); }}>
                {n}
              </button>
            ))}
            <button className={`btn-light h-24 text-3xl ${size >= 8 ? "border-joe text-joe" : ""}`} onClick={() => { setSize(8); go("choice"); }}>
              8+
            </button>
          </div>
          {size >= 8 && step === "size" && null}
        </Step>
      )}

      {step === "choice" && (
        <Step title="Where would you like to sit?" onBack={() => go("size")}>
          {size >= 8 && (
            <div className="mb-4 rounded-2xl bg-food-light p-4 text-lg">
              Our largest tables seat 7. Larger parties are seated across tables near each other.
              <label className="mt-3 flex items-center gap-3">
                Exact party size
                <input
                  type="number"
                  min={8}
                  max={30}
                  value={size}
                  onChange={(e) => setSize(Math.max(8, Math.min(30, Number(e.target.value) || 8)))}
                  className="field w-28"
                />
              </label>
            </div>
          )}
          <div className="grid gap-3">
            <ChoiceButton title="First available" note="Table or bar, whichever opens first" minutes={waitFor("any")} onClick={() => { setChoice("any"); go("here"); }} />
            {barFits && (
              <ChoiceButton title="The bar is fine" note={`${size} ${size === 1 ? "seat" : "seats"} side by side at the counter`} minutes={q.bar} onClick={() => { setChoice("bar_ok"); go("here"); }} />
            )}
            <ChoiceButton title="Table only" note="A booth or table" minutes={q.table} onClick={() => { setChoice("table"); go("here"); }} />
          </div>
          <p className="mt-4 text-center text-muted">Like a barber shop: &ldquo;first available&rdquo; is usually the quickest.</p>
        </Step>
      )}

      {step === "here" && (
        <Step title="Is your whole party here?" onBack={() => go("choice")}>
          <p className="mb-5 text-xl text-muted">We seat parties once everyone has arrived.</p>
          <div className="grid gap-3">
            <button className="btn-primary h-20 text-2xl" onClick={() => { setAllHere(true); go("name"); }}>
              Yes, we&apos;re all here
            </button>
            <button className="btn-light h-20 text-xl" onClick={() => { setAllHere(false); go("name"); }}>
              Not yet, some are on the way
            </button>
          </div>
          {!allHere && <p className="mt-4 text-muted">We&apos;ll keep your place. Let us know when everyone arrives.</p>}
        </Step>
      )}

      {step === "name" && (
        <Step title="What name should we call?" onBack={() => go("here")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) submit();
            }}
          >
            <input
              className="field h-16 text-3xl"
              value={name}
              onChange={(e) => { touched.current = Date.now(); setName(e.target.value); }}
              maxLength={40}
              autoFocus
              autoComplete="off"
              autoCapitalize="words"
              aria-label="Name"
              placeholder="First name is fine"
            />
            <p className="mt-2 text-muted">This name shows on the waiting list and on your table.</p>
            {error && <p className="mt-3 text-lg font-bold text-joe">{error}</p>}
            <button className="btn-primary mt-5 h-20 w-full text-2xl" disabled={busy || !name.trim()}>
              {busy ? "Adding you..." : "Put me on the list"}
            </button>
          </form>
        </Step>
      )}

      {step === "done" && done && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Logo className="h-32 w-auto" />
          <h1 className="font-display text-4xl text-joe">You&apos;re on the list, {done.name}!</h1>
          <p className="text-3xl font-black">{describeWait(done.minutes)}</p>
          <Rules hold={data.holdSeconds} allHere={allHere} />
          <button className="btn-dark mt-4 h-16 w-full max-w-sm text-2xl" onClick={reset}>
            Done
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ mode, offline = false, children }: { mode: "counter" | "phone"; offline?: boolean; children: React.ReactNode }) {
  return (
    <div className={`kiosk flex flex-col ${mode === "counter" ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Offline show={offline} />
      {children}
    </div>
  );
}

function Step({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6">
      <button className="btn-small self-start text-muted" onClick={onBack}>
        ← Back
      </button>
      <h1 className="mb-6 mt-4 text-4xl font-black">{title}</h1>
      {children}
    </div>
  );
}

function WaitCard({ label, minutes }: { label: string; minutes: number | null }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
      <p className="label">{label}</p>
      <p className="text-xl font-black">{describeWait(minutes)}</p>
    </div>
  );
}

function ChoiceButton({ title, note, minutes, onClick }: { title: string; note: string; minutes: number | null; onClick: () => void }) {
  const m = minutes === Infinity ? null : minutes;
  return (
    <button className="btn-light h-auto justify-between px-6 py-5 text-left" onClick={onClick}>
      <span>
        <span className="block text-2xl font-black">{title}</span>
        <span className="block text-base font-normal text-muted">{note}</span>
      </span>
      <span className="text-right text-lg font-black text-joe">{describeWait(m)}</span>
    </button>
  );
}

function Rules({ hold, allHere = true }: { hold: number; allHere?: boolean }) {
  return (
    <ul className="mt-5 w-full max-w-md space-y-2 rounded-2xl bg-joe-light p-4 text-left text-lg">
      <li>
        <strong>The whole party must be here</strong> to be seated.
        {!allHere && " Let us know when everyone arrives."}
      </li>
      <li>
        <strong>Please stay close.</strong> When we call you, we can hold your table for about {hold >= 90 ? `${Math.round(hold / 60)} minutes` : "a minute"}.
      </li>
    </ul>
  );
}

function Line({ data }: { data: CheckinView }) {
  return (
    <aside className="panel flex w-[38%] flex-col p-5" aria-label="Waiting list">
      {data.nowSeating.length > 0 && (
        <div className="mb-4 rounded-2xl bg-open-light p-4">
          <p className="label text-open">Now seating</p>
          <p className="text-2xl font-black">{data.nowSeating.join(", ")}</p>
        </div>
      )}
      <h2 className="text-2xl font-black">Waiting list</h2>
      <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden">
        {data.line.length === 0 && <li className="text-lg text-muted">No wait right now!</li>}
        {data.line.slice(0, 10).map((l, i) => (
          <li key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 ${l.called ? "bg-joe text-white" : "bg-cream"}`}>
            <span className="truncate text-xl font-bold">
              {l.name} <span className="font-normal opacity-70">({l.size})</span>
            </span>
            <span className="shrink-0 pl-2 text-right text-sm font-semibold">{l.wait}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">
        Big parties and bar seats can change the order a little. Your own wait is the one to watch.
      </p>
    </aside>
  );
}
