"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keep a screen in step with the floor: fetch now, then every `ms`, and
 * right away after any change this screen makes. Shows when the connection
 * drops so staff know to fall back to the bell and the clipboard.
 */
export function usePoll<T>(url: string, ms: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const failures = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      setData(body as T);
      setError(null);
      failures.current = 0;
      setOffline(false);
    } catch {
      failures.current += 1;
      if (failures.current >= 3) setOffline(true);
    }
  }, [url]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, ms);
    return () => clearInterval(id);
  }, [refresh, ms]);

  return { data, error, offline, refresh };
}

/** POST an action; returns the error message, or null when it worked. */
export async function post(url: string, payload: unknown): Promise<{ error: string | null; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { error: res.ok ? null : (data.error ?? "Something went wrong."), data };
  } catch {
    return { error: "No connection. Check the Wi-Fi and try again.", data: {} };
  }
}

/** A clock that ticks every second, for timers and holds. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
