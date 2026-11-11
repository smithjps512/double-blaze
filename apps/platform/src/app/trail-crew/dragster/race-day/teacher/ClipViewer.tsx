"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sessionName, type RaceDay } from "@/lib/race-day/model";

/**
 * Frame viewer for the teacher. Open a race clip from this computer and step
 * through it one frame at a time, zoomed on the start gate or the finish.
 *
 * The video never leaves the browser: it plays from a local object URL and
 * nothing is uploaded or stored, so student faces in the footage stay on the
 * teacher's machine. Every clip from race day is 30 fps.
 *
 * Two jobs:
 *   1. Matching. Jump to a run's start gate a moment before launch, zoom in,
 *      and see who is at the launcher.
 *   2. Timing. Mark the start and finish frames of a clip that has no runs
 *      yet and send them to the Add a run form.
 *
 * No em dashes in any copy here.
 */

const FPS = 30;

export interface Marks {
  clip: string;
  startS: number;
  finishS: number;
}

function clipName(fileName: string): string {
  const m = fileName.match(/IMG_\d{4}/i);
  return m ? m[0].toUpperCase() : fileName.replace(/\.[^.]+$/, "");
}

export default function ClipViewer({ day, onMarks }: { day: RaceDay; onMarks: (m: Marks) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [clip, setClip] = useState("");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 30 });
  const [start, setStart] = useState<number | null>(null);
  const [finish, setFinish] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const runs = useMemo(() => day.runs.filter((r) => r.clip.toUpperCase() === clip), [day.runs, clip]);
  const carLabel = (id: string) => day.cars.find((c) => c.id === id)?.label ?? id;
  // Seeks land mid-frame, so floor gives the frame on screen.
  const frame = Math.floor(time * FPS + 1e-6);

  function open(file: File | undefined) {
    if (!file) return;
    if (url) URL.revokeObjectURL(url);
    setError(null);
    setUrl(URL.createObjectURL(file));
    setClip(clipName(file.name));
    setStart(null);
    setFinish(null);
    setZoom(1);
  }

  /** Lands in the middle of a frame so the browser shows exactly that frame. */
  function seek(seconds: number) {
    const v = video.current;
    if (!v) return;
    v.pause();
    const f = Math.max(0, Math.round(seconds * FPS));
    v.currentTime = Math.min(duration || Infinity, (f + 0.5) / FPS);
  }

  const step = (frames: number) => seek(frame / FPS + frames / FPS);

  function gate(seconds: number) {
    // The camera is at the finish, so the start gate is small and far up the frame.
    setOrigin({ x: 50, y: 25 });
    setZoom(3);
    seek(seconds);
  }

  function near(seconds: number) {
    setOrigin({ x: 40, y: 70 });
    setZoom(1.5);
    seek(seconds);
  }

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (!url) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(e.shiftKey ? 10 : 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(e.shiftKey ? -10 : -1);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const btn = "rounded-lg border border-ink/20 bg-white px-2.5 py-1 text-sm hover:border-trail-orange disabled:opacity-40";

  return (
    <section className="mt-8 rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Frame viewer</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            Open a clip from this computer to step through it frame by frame. It plays only in this browser and is never uploaded.
            Arrow keys step one frame, Shift plus an arrow steps ten.
          </p>
        </div>
        <label className="cursor-pointer rounded-lg bg-blaze-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-blaze-maroon/90">
          Open a clip
          <input type="file" accept="video/*,.mov,.MOV" className="sr-only" onChange={(e) => open(e.target.files?.[0])} />
        </label>
      </div>

      {url && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div
              className="relative mx-auto max-h-[70vh] overflow-hidden rounded-xl bg-ink"
              style={{ aspectRatio: "9 / 16", maxWidth: "min(100%, 40vh)" }}
              onClick={(e) => {
                // Click to aim the zoom at that spot.
                const box = e.currentTarget.getBoundingClientRect();
                setOrigin({ x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 });
              }}
            >
              <video
                ref={video}
                src={url}
                muted
                playsInline
                preload="auto"
                className="h-full w-full object-contain"
                style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  seek(0);
                }}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onSeeked={(e) => setTime(e.currentTarget.currentTime)}
                onError={() =>
                  setError(
                    "This browser cannot play that clip. Try Chrome or Safari, or on the iPhone set Camera, Formats to Most Compatible for future races.",
                  )
                }
              />
            </div>
            {error && <p className="mt-2 text-sm text-trail-orange">{error}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button type="button" className={btn} onClick={() => step(-10)}>
                &minus;10
              </button>
              <button type="button" className={btn} onClick={() => step(-1)} aria-label="Back one frame">
                &minus;1 frame
              </button>
              <span className="min-w-[9rem] text-center text-sm tabular-nums">
                <span className="font-semibold">{time.toFixed(3)} s</span>
                <span className="block text-xs text-ink/55">frame {frame}</span>
              </span>
              <button type="button" className={btn} onClick={() => step(1)} aria-label="Forward one frame">
                +1 frame
              </button>
              <button type="button" className={btn} onClick={() => step(10)}>
                +10
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-ink/60">Zoom</span>
                <input type="range" min={1} max={5} step={0.25} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
                <span className="w-8 tabular-nums">{zoom}x</span>
              </label>
              <span className="text-xs text-ink/55">Click the video to aim the zoom.</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, Math.floor(duration * FPS) - 1)}
              value={frame}
              onChange={(e) => seek(Number(e.target.value) / FPS)}
              className="mt-3 w-full"
              aria-label="Scrub through the clip"
            />
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">{clip}</p>
              <p className="text-xs text-ink/55">
                {duration ? `${duration.toFixed(2)} s, about ${Math.round(duration * FPS)} frames` : "Loading"}
              </p>
            </div>

            {runs.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Runs in this clip</p>
                {runs.map((r) => {
                  const s = day.sessions.find((x) => x.id === r.sessionId);
                  const linked = day.students.filter((st) => st.carId === r.carId).map((st) => st.firstName);
                  return (
                    <div key={r.id} className="rounded-lg border border-ink/10 p-2.5">
                      <p className="font-medium">
                        {carLabel(r.carId)}, {(r.elapsedMs / 1000).toFixed(2)} s
                      </p>
                      <p className="text-xs text-ink/55">
                        {sessionName(s)}. {linked.length ? `Linked: ${linked.join(", ")}` : "No student linked"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button type="button" className={btn} onClick={() => gate(r.startS - 0.3)}>
                          At the gate
                        </button>
                        <button type="button" className={btn} onClick={() => seek(r.startS)}>
                          Start {r.startS.toFixed(2)}
                        </button>
                        <button type="button" className={btn} onClick={() => near(r.finishS - 0.2)}>
                          Near camera
                        </button>
                        <button type="button" className={btn} onClick={() => seek(r.finishS)}>
                          Finish {r.finishS.toFixed(2)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg bg-stone-white p-2.5 text-ink/70">No runs recorded in this clip yet. Mark the start and finish to add one.</p>
            )}

            <div className="space-y-2 rounded-lg bg-stone-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Time a run</p>
              <p className="text-xs text-ink/60">
                Start: the first frame the car is visibly off the gate. Finish: the frame it passes under the finish gate.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={btn} onClick={() => setStart(Math.round(frame) / FPS)}>
                  Mark start
                </button>
                <button type="button" className={btn} onClick={() => setFinish(Math.round(frame) / FPS)}>
                  Mark finish
                </button>
              </div>
              <p className="tabular-nums">
                Start {start === null ? "not set" : `${start.toFixed(3)} s`}, finish {finish === null ? "not set" : `${finish.toFixed(3)} s`}
                {start !== null && finish !== null && finish > start && (
                  <span className="block font-semibold">
                    {Math.round((finish - start) * FPS)} frames = {(finish - start).toFixed(2)} s
                  </span>
                )}
              </p>
              <button
                type="button"
                disabled={start === null || finish === null || finish <= start}
                onClick={() => onMarks({ clip, startS: Math.round(start! * 100) / 100, finishS: Math.round(finish! * 100) / 100 })}
                className="rounded-lg bg-blaze-maroon px-3 py-1.5 font-semibold text-white disabled:opacity-40"
              >
                Send to Add a run
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
