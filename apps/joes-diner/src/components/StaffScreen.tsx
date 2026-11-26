"use client";

import { useEffect, useMemo, useState } from "react";
import type { StaffLine, StaffSeat, StaffServer, StaffView } from "@/lib/views";
import { CodePad } from "./CodePad";
import { Logo } from "./Logo";
import { Offline } from "./Offline";
import { post, useNow, usePoll } from "./usePoll";

/**
 * The staff screen behind the bar, where the clipboard is today. Left: the
 * waitlist. Middle: all 19 seats. Right: the rotation. Seating a party is two
 * taps: the party (its suggested seats light up), then Seat.
 */

const API = "/api/staff";

const CHOICE: Record<string, string> = { table: "Table only", bar_ok: "Bar is fine", any: "First available" };

const mins = (ms: number) => Math.max(0, Math.floor(ms / 60_000));
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function StaffScreen() {
  const { data, error, offline, refresh } = usePoll<StaffView>(API, 2000);
  const now = useNow();
  const [partyId, setPartyId] = useState<string | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [serverId, setServerId] = useState<string | null>(null);
  const [seatPanel, setSeatPanel] = useState<string | null>(null);
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [joining, setJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // The server clock and this tablet's clock may differ a little; keep timers honest.
  const skew = data ? data.now - Date.now() : 0;
  const t = now + skew;

  const party = data?.line.find((l) => l.id === partyId) ?? null;
  useEffect(() => {
    if (partyId && data && !party) {
      setPartyId(null);
      setSeats([]);
    }
  }, [data, party, partyId]);

  const act = async (payload: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    const r = await post(API, payload);
    setBusy(false);
    setMessage(r.error ?? ok ?? null);
    await refresh();
    return r;
  };

  const choose = (line: StaffLine) => {
    if (partyId === line.id) {
      setPartyId(null);
      setSeats([]);
      return;
    }
    setPartyId(line.id);
    setSeats(line.suggestion ?? []);
    setServerId(null);
    setSeatPanel(null);
    setMessage(null);
  };

  const tapSeat = (seat: StaffSeat) => {
    if (party && seat.state === "open") {
      if (seat.kind === "bar") {
        const onlyBar = seats.every((c) => c.startsWith("bar"));
        setSeats(onlyBar ? (seats.includes(seat.code) ? seats.filter((c) => c !== seat.code) : [...seats, seat.code]) : [seat.code]);
      } else {
        const onlyTables = seats.every((c) => !c.startsWith("bar"));
        // Tap one table to pick it; tap more tables to join them for a big party.
        setSeats(onlyTables && seats.length && !seats.includes(seat.code) && party.size > 7 ? [...seats, seat.code] : seats.includes(seat.code) ? seats.filter((c) => c !== seat.code) : [seat.code]);
      }
      return;
    }
    setSeatPanel(seat.code === seatPanel ? null : seat.code);
  };

  const seatNow = async () => {
    if (!party || !seats.length) return;
    const r = await act({ type: "seat", visitId: party.id, seatCodes: seats, serverId }, `${party.name} seated.`);
    if (!r.error) {
      setPartyId(null);
      setSeats([]);
      setServerId(null);
    }
  };

  if (!data) {
    return (
      <div className="kiosk flex min-h-screen items-center justify-center p-8 text-center text-xl text-muted">
        {error ?? "Loading the floor..."}
      </div>
    );
  }

  const servers = data.servers;
  const chosenServer = serverId ? servers.find((s) => s.staffId === serverId) : servers.find((s) => s.next);
  const panelSeat = seatPanel ? data.seats.find((s) => s.code === seatPanel) ?? null : null;

  return (
    <div className="kiosk flex h-screen flex-col overflow-hidden">
      <Offline show={offline} />
      <header className="flex items-center gap-4 border-b border-line bg-white px-4 py-2">
        <Logo className="h-12 w-auto" />
        <div className="flex-1">
          <p className="text-lg font-black leading-tight">Staff screen</p>
          <p className="text-sm text-muted">
            {data.today.parties} parties · {data.today.guests} guests today · {data.today.waiting} waiting
          </p>
        </div>
        {data.open && (
          <>
            <div className="rounded-2xl bg-joe-light px-4 py-2 text-right">
              <p className="label">Next up</p>
              <p className="text-xl font-black text-joe">{data.nextUp ?? "No server on"}</p>
            </div>
            <button className="btn-primary" onClick={() => setAdding(true)}>
              + Add party
            </button>
          </>
        )}
      </header>

      {message && (
        <button className="bg-ink px-4 py-2 text-left font-bold text-white" onClick={() => setMessage(null)}>
          {message}
        </button>
      )}

      {!data.open ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Logo className="h-40 w-auto" />
          <h1 className="text-3xl font-black">{data.closed ? "The day is closed." : "Good morning!"}</h1>
          <p className="max-w-md text-lg text-muted">
            {data.closed ? "See you next time." : "Open the day, then add who is serving. Guests can check in once the day is open."}
          </p>
          {!data.closed && (
            <button className="btn-primary text-2xl" disabled={busy} onClick={() => act({ type: "open_shift" })}>
              Open the day
            </button>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.05fr)_minmax(0,1.6fr)_minmax(0,0.75fr)] gap-3 p-3">
          {/* Waitlist */}
          <section className="panel flex min-h-0 flex-col" aria-label="Waitlist">
            <div className="flex items-baseline justify-between px-4 pt-3">
              <h2 className="text-xl font-black">Waiting</h2>
              <span className="label">{data.line.length} parties</span>
            </div>
            <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {data.line.length === 0 && <li className="p-6 text-center text-muted">Nobody waiting. Nice.</li>}
              {data.line.map((l, i) => (
                <PartyRow
                  key={l.id}
                  line={l}
                  index={i}
                  selected={l.id === partyId}
                  now={t}
                  hold={data.holdSeconds}
                  busy={busy}
                  onChoose={() => choose(l)}
                  onAct={(type, extra) => act({ type, visitId: l.id, ...extra })}
                />
              ))}
            </ol>
            {party && (
              <div className="border-t border-line bg-joe-light p-3">
                <p className="text-sm text-muted">
                  Seat <strong className="text-ink">{party.name}</strong> ({party.size})
                </p>
                <p className="text-xl font-black">{seats.length ? seatLabel(seats) : "Tap open seats on the floor"}</p>
                {servers.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {servers.filter((s) => !s.paused).map((s) => (
                      <button
                        key={s.staffId}
                        onClick={() => setServerId(s.next ? null : s.staffId)}
                        className={`btn-small border-2 ${chosenServer?.staffId === s.staffId ? "border-joe bg-white text-joe" : "border-transparent bg-white/60 text-muted"}`}
                      >
                        {s.name}
                        {s.next ? " (next)" : ""}
                      </button>
                    ))}
                  </div>
                )}
                <button className="btn-primary mt-3 w-full text-2xl" disabled={!seats.length || busy || !chosenServer} onClick={seatNow}>
                  Seat with {chosenServer?.name ?? "..."}
                </button>
              </div>
            )}
          </section>

          {/* Floor */}
          <section className="panel flex min-h-0 flex-col p-3" aria-label="Floor">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-xl font-black">Floor</h2>
              <Legend />
            </div>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {data.seats.filter((s) => s.kind === "table").map((s) => (
                <SeatTile key={s.code} seat={s} now={t} selected={seats.includes(s.code)} suggested={Boolean(party?.suggestion?.includes(s.code))} onTap={() => tapSeat(s)} />
              ))}
            </div>
            <p className="label mt-4 px-1">Bar</p>
            <div className="mt-1 grid grid-cols-9 gap-1.5">
              {data.seats.filter((s) => s.kind === "bar").map((s) => (
                <SeatTile key={s.code} seat={s} now={t} small selected={seats.includes(s.code)} suggested={Boolean(party?.suggestion?.includes(s.code))} onTap={() => tapSeat(s)} />
              ))}
            </div>
            {panelSeat && (
              <SeatPanel
                seat={panelSeat}
                now={t}
                busy={busy}
                onClose={() => setSeatPanel(null)}
                onAct={(type) => act({ type, seatCode: panelSeat.code })}
                onUndo={() => panelSeat.visit && act({ type: "undo_seat", visitId: panelSeat.visit.id }, "Seating undone. The party is back on the list.")}
                onReady={() => {
                  setCodeError(null);
                  setCodeFor(panelSeat.code);
                }}
              />
            )}
          </section>

          {/* Rotation */}
          <section className="panel flex min-h-0 flex-col" aria-label="Server rotation">
            <h2 className="px-4 pt-3 text-xl font-black">Rotation</h2>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {servers.length === 0 && <li className="p-4 text-center text-muted">Add who is serving.</li>}
              {servers.map((s) => (
                <ServerCard key={s.staffId} s={s} busy={busy} onAct={(type) => act({ type, staffId: s.staffId })} />
              ))}
            </ul>
            <div className="space-y-2 border-t border-line p-3">
              <button className="btn-light w-full" onClick={() => setJoining(true)}>
                + Add server
              </button>
              <button
                className="btn-small w-full text-muted"
                onClick={() => {
                  if (confirm("Close the day? Everyone comes off the floor.")) act({ type: "close_shift" });
                }}
              >
                Close the day
              </button>
            </div>
          </section>
        </div>
      )}

      {adding && <AddParty busy={busy} onCancel={() => setAdding(false)} onAdd={async (p) => { const r = await act({ type: "check_in", ...p }, `${p.name} added.`); if (!r.error) setAdding(false); }} />}
      {joining && (
        <Picker
          title="Who is starting?"
          note="They start tied with the lowest total, so tables stay even."
          options={data.offFloor}
          onCancel={() => setJoining(false)}
          onPick={async (id) => {
            await act({ type: "server_join", staffId: id });
            setJoining(false);
          }}
        />
      )}
      {codeFor && (
        <CodePad
          title={`${seatLabel([codeFor])} is ready`}
          busy={busy}
          error={codeError}
          onCancel={() => setCodeFor(null)}
          onSubmit={async (code) => {
            setBusy(true);
            const r = await post(API, { type: "table_ready", seatCode: codeFor, code });
            setBusy(false);
            if (r.error) setCodeError(r.error);
            else {
              setCodeFor(null);
              setSeatPanel(null);
              setMessage(`${seatLabel([codeFor])} is open.`);
              refresh();
            }
          }}
        />
      )}
    </div>
  );
}

function seatLabel(codes: string[]): string {
  if (codes.length === 1) return codes[0].startsWith("bar") ? `Bar ${codes[0].slice(3)}` : `Table ${codes[0]}`;
  if (codes.every((c) => c.startsWith("bar"))) {
    const n = codes.map((c) => Number(c.slice(3))).sort((a, b) => a - b);
    return `Bar ${n.join(", ")}`;
  }
  return `Tables ${codes.join(" + ")}`;
}

function PartyRow({
  line,
  index,
  selected,
  now,
  hold,
  busy,
  onChoose,
  onAct,
}: {
  line: StaffLine;
  index: number;
  selected: boolean;
  now: number;
  hold: number;
  busy: boolean;
  onChoose: () => void;
  onAct: (type: string, extra?: Record<string, unknown>) => void;
}) {
  const holdLeft = line.calledAt ? hold * 1000 - (now - line.calledAt) : null;
  return (
    <li>
      <div className={`rounded-2xl border-2 ${selected ? "border-joe bg-joe-light" : "border-line bg-cream"} `}>
        <button className="focus-ring w-full p-3 text-left" onClick={onChoose} aria-pressed={selected}>
          <div className="flex items-center gap-2">
            <span className="w-6 text-center text-sm font-bold text-muted">{index + 1}</span>
            <span className="flex-1 truncate text-xl font-black">{line.name}</span>
            <span className="rounded-full bg-ink px-3 py-0.5 text-lg font-black text-white">{line.size}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-8 text-sm">
            <span className="font-semibold">{CHOICE[line.choice]}</span>
            <span className="text-muted">waited {mins(now - line.checkedInAt)}m</span>
            {line.waitMinutes !== null && <span className="text-muted">est. {line.waitMinutes}m</span>}
            {line.source === "qr" && <span className="text-muted">phone</span>}
            {!line.allHere && <span className="rounded bg-food-light px-1.5 font-bold text-ink">Not all here</span>}
          </div>
          {line.status === "called" && holdLeft !== null && (
            <p className={`mt-2 pl-8 text-lg font-black ${holdLeft > 0 ? "text-joe" : "text-ink"}`}>
              {holdLeft > 0 ? `Called · holding ${clock(holdLeft)}` : "Hold is up. Skip or seat."}
            </p>
          )}
          {line.suggestionLabel && line.status !== "called" && <p className="mt-1 pl-8 text-sm font-bold text-open">Fits {line.suggestionLabel}</p>}
        </button>
        {selected && (
          <div className="flex flex-wrap gap-2 border-t border-joe/20 p-3">
            {line.status === "waiting" ? (
              <button className="btn-small bg-ink text-white" disabled={busy} onClick={() => onAct("call")}>
                Call
              </button>
            ) : (
              <button className="btn-small bg-ink text-white" disabled={busy} onClick={() => onAct("skip")}>
                Not here, skip
              </button>
            )}
            <button className="btn-small bg-white" disabled={busy} onClick={() => onAct("set_all_here", { allHere: !line.allHere })}>
              {line.allHere ? "Not all here" : "All here now"}
            </button>
            <button className="btn-small bg-white" disabled={busy} onClick={() => onAct("no_show")}>
              No show
            </button>
            <button className="btn-small bg-white" disabled={busy} onClick={() => onAct("leave_list")}>
              Remove
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function SeatTile({
  seat,
  now,
  selected,
  suggested,
  small,
  onTap,
}: {
  seat: StaffSeat;
  now: number;
  selected: boolean;
  suggested: boolean;
  small?: boolean;
  onTap: () => void;
}) {
  const v = seat.visit;
  const look = {
    open: "bg-open-light border-open/40",
    seated: "bg-white border-line",
    food_ready: "bg-food-light border-food",
    needs_bussing: "bg-bus-light border-bus/60",
  }[seat.state];
  const ring = selected ? "ring-4 ring-joe ring-offset-2" : suggested ? "outline-dashed outline-4 outline-joe/70" : "";
  const name = seat.kind === "bar" ? seat.code.slice(3) : seat.code;
  return (
    <button
      onClick={onTap}
      className={`focus-ring relative flex flex-col rounded-2xl border-2 text-left transition ${look} ${ring} ${small ? "h-24 p-1.5" : "h-28 p-2.5"}`}
      aria-label={`${seat.kind === "bar" ? "Bar seat" : "Table"} ${name}, ${seat.state.replace("_", " ")}${v ? `, ${v.name}` : ""}`}
    >
      <span className="flex items-baseline justify-between gap-1">
        <span className={`font-black ${small ? "text-lg" : "text-2xl"}`}>{name}</span>
        {!small && seat.state !== "food_ready" && <span className="whitespace-nowrap text-xs text-muted">{seat.capacity} seats</span>}
        {seat.state === "food_ready" && seat.foodReadyAt && (
          <span title="Food up" className={`whitespace-nowrap rounded-lg bg-food px-1.5 font-black text-ink ${small ? "text-[10px]" : "text-sm"}`}>
            {small ? "FOOD" : clock(now - seat.foodReadyAt)}
          </span>
        )}
      </span>
      {seat.state === "open" && <span className={`mt-auto font-bold text-open ${small ? "text-xs" : ""}`}>Open</span>}
      {v && seat.state !== "needs_bussing" && (
        <span className={`mt-auto leading-tight ${small ? "text-[11px]" : "text-sm"}`}>
          <span className="block truncate font-bold">{v.name}</span>
          {!small && (
            <span className="block truncate text-muted">
              {v.size} · {v.server ?? "no server"} · {v.seatedAt ? mins(now - v.seatedAt) : 0}m
            </span>
          )}
        </span>
      )}
      {seat.state === "needs_bussing" && (
        <span className={`mt-auto font-bold text-bus ${small ? "text-[11px]" : "text-sm"}`}>
          Needs bussing{v?.guestsLeftAt ? ` ${mins(now - v.guestsLeftAt)}m` : ""}
        </span>
      )}
    </button>
  );
}

function SeatPanel({
  seat,
  now,
  busy,
  onClose,
  onAct,
  onUndo,
  onReady,
}: {
  seat: StaffSeat;
  now: number;
  busy: boolean;
  onClose: () => void;
  onAct: (type: string) => void;
  onUndo: () => void;
  onReady: () => void;
}) {
  const v = seat.visit;
  return (
    <div className="mt-auto rounded-2xl border-2 border-ink bg-cream p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-black">{v ? v.seatsLabel : seatLabel([seat.code])}</p>
          {v ? (
            <p className="text-muted">
              {v.name}, party of {v.size} · {v.server ?? "no server"} · seated {v.seatedAt ? mins(now - v.seatedAt) : 0}m ago
            </p>
          ) : (
            <p className="text-muted">Open. Pick a party on the left to seat here.</p>
          )}
        </div>
        <button className="btn-small bg-white" onClick={onClose}>
          Close
        </button>
      </div>
      {v && (
        <div className="mt-3 flex flex-wrap gap-2">
          {seat.state !== "needs_bussing" && (
            <button className="btn-light" disabled={busy} onClick={() => onAct("guests_left")}>
              Guests left
            </button>
          )}
          <button className="btn-dark" disabled={busy} onClick={onReady}>
            Bused, table ready
          </button>
          {seat.state === "seated" && (
            <button className="btn-small bg-white" disabled={busy} onClick={onUndo}>
              Undo seating
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ServerCard({ s, busy, onAct }: { s: StaffServer; busy: boolean; onAct: (type: string) => void }) {
  return (
    <li className={`rounded-2xl border-2 p-3 ${s.next ? "border-joe bg-joe-light" : s.paused ? "border-line bg-cream opacity-70" : "border-line bg-cream"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{s.name}</p>
          <p className="text-sm text-muted">
            {s.tables} {s.tables === 1 ? "table" : "tables"} now{s.paused ? " · paused" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black leading-none">{s.total}</p>
          {s.next && <p className="text-xs font-black uppercase text-joe">Next up</p>}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-small flex-1 bg-white" disabled={busy} onClick={() => onAct(s.paused ? "server_resume" : "server_pause")}>
          {s.paused ? "Back on" : "Pause"}
        </button>
        <button
          className="btn-small bg-white text-muted"
          disabled={busy}
          onClick={() => {
            if (confirm(`Take ${s.name} off the floor?`)) onAct("server_leave");
          }}
        >
          Off
        </button>
      </div>
    </li>
  );
}

function Legend() {
  const items = [
    ["bg-open-light border-open/40", "Open"],
    ["bg-white border-line", "Seated"],
    ["bg-food-light border-food", "Food up"],
    ["bg-bus-light border-bus/60", "Needs bussing"],
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded border-2 ${c}`} />
          {l}
        </span>
      ))}
    </div>
  );
}

function AddParty({ busy, onAdd, onCancel }: { busy: boolean; onAdd: (p: { name: string; size: number; choice: string; allHere: boolean }) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState(2);
  const [choice, setChoice] = useState("any");
  const [allHere, setAllHere] = useState(true);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label="Add a party">
      <form
        className="panel w-full max-w-lg space-y-4 p-6 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd({ name, size, choice, allHere });
        }}
      >
        <h2 className="text-2xl font-black">Add a party</h2>
        <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={40} />
        <div>
          <p className="label mb-2">Party size</p>
          <div className="grid grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button type="button" key={n} onClick={() => setSize(n)} className={`btn-small h-12 text-lg ${size === n ? "bg-ink text-white" : "bg-cream"}`}>
                {n === 8 ? "8+" : n}
              </button>
            ))}
          </div>
          {size >= 8 && (
            <input className="field mt-2" type="number" min={8} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Exact party size" />
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(CHOICE).map(([k, l]) => (
            <button type="button" key={k} onClick={() => setChoice(k)} className={`btn-small h-12 ${choice === k ? "bg-ink text-white" : "bg-cream"}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-lg">
          <input type="checkbox" className="h-6 w-6" checked={allHere} onChange={(e) => setAllHere(e.target.checked)} />
          Whole party is here
        </label>
        <div className="flex gap-3">
          <button type="button" className="btn-light flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary flex-1" disabled={busy || !name.trim()}>
            Add to list
          </button>
        </div>
      </form>
    </div>
  );
}

function Picker({
  title,
  note,
  options,
  onPick,
  onCancel,
}: {
  title: string;
  note?: string;
  options: { id: string; name: string }[];
  onPick: (id: string) => void;
  onCancel: () => void;
}) {
  const sorted = useMemo(() => [...options].sort((a, b) => a.name.localeCompare(b.name)), [options]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-2xl font-black">{title}</h2>
        {note && <p className="mt-1 text-muted">{note}</p>}
        <div className="mt-4 grid gap-2">
          {sorted.length === 0 && <p className="text-muted">Everyone is already on the floor. Add staff on the manager page.</p>}
          {sorted.map((o) => (
            <button key={o.id} className="btn-light justify-start" onClick={() => onPick(o.id)}>
              {o.name}
            </button>
          ))}
        </div>
        <button className="btn-small mt-4 w-full" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
