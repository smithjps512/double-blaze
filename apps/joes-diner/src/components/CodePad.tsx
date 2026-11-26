"use client";

import { useState } from "react";

/** A 4-digit keypad for staff codes. Big keys for wet hands. */
export function CodePad({
  title,
  onSubmit,
  onCancel,
  error,
  busy,
}: {
  title: string;
  onSubmit: (code: string) => void;
  onCancel: () => void;
  error: string | null;
  busy: boolean;
}) {
  const [code, setCode] = useState("");
  const press = (d: string) => {
    if (busy) return;
    const next = (code + d).slice(0, 4);
    setCode(next);
    if (next.length === 4) {
      onSubmit(next);
      setCode("");
    }
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel w-full max-w-sm p-6 shadow-2xl">
        <h2 className="text-center text-2xl font-black">{title}</h2>
        <p className="mt-1 text-center text-muted">Enter your code</p>
        <div className="mt-4 flex justify-center gap-3" aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-5 w-5 rounded-full border-2 border-ink ${i < code.length ? "bg-ink" : ""}`} />
          ))}
        </div>
        {error && <p className="mt-3 text-center font-bold text-joe">{error}</p>}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} className="btn-light h-16 text-2xl" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button className="btn-light h-16 text-base" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-light h-16 text-2xl" onClick={() => press("0")}>
            0
          </button>
          <button className="btn-light h-16 text-base" onClick={() => setCode(code.slice(0, -1))} aria-label="Delete">
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
