"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RESEARCH_FIELDS } from "@/lib/showcase-fields";
import type { Car, Source } from "@/lib/showcase-db";
import s from "../../../showcase.module.css";

/**
 * The research editor.
 *
 * Plain boxes, on purpose. A rich text editor would be a bigger thing to build
 * than the rest of this page and would mostly be used to paste formatting in
 * from somewhere else, which is the habit this page exists to work against.
 *
 * The one clever bit is the paste notice: pasting a paragraph is not banned,
 * because copying a specification table is a reasonable thing to do, but it is
 * noticed and named. Being asked "where did that come from" at the moment you
 * paste is worth more than a rule at the bottom of the page.
 */

const PASTE_IS_A_CHUNK = 180;

export default function CarEditor({
  team,
  car,
  sources,
}: {
  team: string;
  car: Car;
  sources: Source[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {
      special: car.special,
      image_credit: car.imageCredit,
      image_source_url: car.imageSourceUrl,
    };
    for (const field of RESEARCH_FIELDS) out[field.column] = car[field.key] as string;
    return out;
  });
  const [imagePath, setImagePath] = useState(car.imagePath);
  const [pasted, setPasted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);

  const set = (column: string, value: string) =>
    setDraft((d) => ({ ...d, [column]: value }));

  const notePaste = (label: string, text: string) => {
    if (text.length < PASTE_IS_A_CHUNK) return;
    setPasted((p) => (p.includes(label) ? p : [...p, label]));
  };

  const save = async () => {
    setBusy(true);
    setNote("");
    setFailed(false);
    try {
      const res = await fetch("/api/showcase/rows", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team, kind: "cars", id: car.id, ...draft, image_path: imagePath }),
      });
      const data = await res.json();
      if (data.ok) {
        setNote("Saved. It is live on the site right now.");
        router.refresh();
      } else {
        setNote(data.error ?? "That did not work.");
        setFailed(true);
      }
    } catch {
      setNote("I could not reach the server. Check you are online.");
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const short = RESEARCH_FIELDS.filter((f) => !f.long);
  const long = RESEARCH_FIELDS.filter((f) => f.long);

  return (
    <>
      <SourcePanel team={team} carId={car.id} sources={sources} />

      <PhotoPanel
        team={team}
        imagePath={imagePath}
        credit={draft.image_credit}
        sourceUrl={draft.image_source_url}
        onImage={setImagePath}
        onCredit={(v) => set("image_credit", v)}
        onSourceUrl={(v) => set("image_source_url", v)}
      />

      <div className={s.row}>
        <div className={s.rowHead}>
          <span className={s.rowTitle}>The technical bit</span>
        </div>
        <p className={s.note}>
          Short answers. &ldquo;7.0 litre V8, 425 hp&rdquo; is a better answer
          than a paragraph, and if you cannot find one of these, leave it empty
          rather than guessing. An empty box is honest. A guess is not.
        </p>
        {short.map((field) => (
          <label key={field.key} className={s.field}>
            <span className={s.fieldLabel}>{field.label}</span>
            <input
              className={s.input}
              value={draft[field.column] ?? ""}
              onChange={(e) => set(field.column, e.target.value)}
              onPaste={(e) => notePaste(field.label, e.clipboardData.getData("text"))}
            />
          </label>
        ))}
      </div>

      <div className={s.row}>
        <div className={s.rowHead}>
          <span className={s.rowTitle}>The history</span>
        </div>
        <p className={s.note}>
          Two different pieces of research. One is about this car: why it was
          built, what it was up against, what happened to it. The other is about
          the company: who started it, when, and what else they made. Teams
          usually do the first and forget the second.
        </p>
        {long.map((field) => (
          <label key={field.key} className={s.field}>
            <span className={s.fieldLabel}>{field.label}</span>
            <textarea
              className={s.textarea}
              rows={7}
              value={draft[field.column] ?? ""}
              onChange={(e) => set(field.column, e.target.value)}
              onPaste={(e) => notePaste(field.label, e.clipboardData.getData("text"))}
            />
            <span className={s.footnote}>
              {words(draft[field.column] ?? "")} words
            </span>
          </label>
        ))}
        <label className={s.field}>
          <span className={s.fieldLabel}>What makes it special (the short version)</span>
          <textarea
            className={s.textarea}
            rows={3}
            value={draft.special ?? ""}
            onChange={(e) => set("special", e.target.value)}
            onPaste={(e) => notePaste("What makes it special", e.clipboardData.getData("text"))}
          />
        </label>
      </div>

      {pasted.length > 0 && (
        <div className={s.adminBanner}>
          <strong>You pasted something in.</strong> That is allowed and it is
          often the right thing to do with a specification. Two things to check
          before you save: is the place you copied it from in your sources, and
          would you be able to explain it out loud? If the answer to the second
          one is no, put it in your own words, because that is the bit somebody
          will ask you about. Pasted into: {pasted.join(", ")}.
        </div>
      )}

      <div className={s.actions}>
        <button type="button" className={s.primaryButton} disabled={busy} onClick={save}>
          {busy ? "Saving..." : "Save the page"}
        </button>
        {note && (
          <span className={failed ? s.noteError : s.note}>{note}</span>
        )}
      </div>
    </>
  );
}

function words(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/**
 * At the top of the page rather than the bottom.
 *
 * The order on the screen is an argument about the order of the work. A
 * reference list underneath a finished essay is something you assemble
 * afterwards from memory, badly. At the top, it is where you put the tab you
 * are reading before you start typing out of it.
 */
function SourcePanel({
  team,
  carId,
  sources,
}: {
  team: string;
  carId: string;
  sources: Source[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [covers, setCovers] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);

  const add = async () => {
    setBusy(true);
    setNote("");
    setFailed(false);
    try {
      const res = await fetch("/api/showcase/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ team, carId, title, url, covers }),
      });
      const data = await res.json();
      if (data.ok) {
        setTitle("");
        setUrl("");
        setCovers("");
        setNote("Added.");
        router.refresh();
      } else {
        setNote(data.error ?? "That did not work.");
        setFailed(true);
      }
    } catch {
      setNote("I could not reach the server.");
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch("/api/showcase/sources", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ team, id }),
    });
    router.refresh();
  };

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>Where you found it</span>
        <span className={s.pill}>
          {sources.length === 0
            ? "nothing yet"
            : `${sources.length} source${sources.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {sources.length === 0 ? (
        <p className={s.note}>
          <strong>Start here.</strong> Nothing below can be saved until there is
          at least one source on this car. Find a page about it, add it here,
          then go and write. Doing it this way round takes about a minute; doing
          it the other way round means going back through your own writing
          trying to remember where each bit came from.
        </p>
      ) : (
        <ul className={s.partList}>
          {sources.map((source) => (
            <li key={source.id} className={s.partRow}>
              <div>
                <div className={s.partName}>{source.title}</div>
                <div className={s.footnote}>
                  {source.covers ? `Backs up: ${source.covers}. ` : ""}
                  <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">
                    {shortUrl(source.url)}
                  </a>
                </div>
              </div>
              <button
                type="button"
                className={s.ghostButton}
                onClick={() => remove(source.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className={s.field}>
        <span className={s.fieldLabel}>What was it called?</span>
        <input
          className={s.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hemmings: the 1967 Shelby GT500"
        />
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>The link</span>
        <input
          className={s.input}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>Which part of the page does it back up?</span>
        <input
          className={s.input}
          value={covers}
          onChange={(e) => setCovers(e.target.value)}
          placeholder="Engine, transmission and the horsepower number"
        />
      </label>
      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          disabled={busy || !title.trim() || !url.trim()}
          onClick={add}
        >
          Add this source
        </button>
        {note && <span className={failed ? s.noteError : s.note}>{note}</span>}
      </div>
    </div>
  );
}

function shortUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// The photo
// ---------------------------------------------------------------------------

function PhotoPanel({
  team,
  imagePath,
  credit,
  sourceUrl,
  onImage,
  onCredit,
  onSourceUrl,
}: {
  team: string;
  imagePath: string | null;
  credit: string;
  sourceUrl: string;
  onImage: (path: string | null) => void;
  onCredit: (value: string) => void;
  onSourceUrl: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("team", team);
      form.set("file", file);
      const res = await fetch("/api/showcase/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.ok) onImage(data.path);
      else setError(data.error ?? "That did not work.");
    } catch {
      setError("I could not reach the server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={s.row}>
      <div className={s.rowHead}>
        <span className={s.rowTitle}>The photo</span>
      </div>

      {imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/showcase/media/${imagePath}`} alt="" className={s.thumb} />
      ) : (
        <div className={s.thumbEmpty}>No photo yet</div>
      )}

      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {uploading && <p className={s.note}>Uploading...</p>}
      {error && <p className={s.noteError}>{error}</p>}

      <p className={s.note}>
        <strong>Somebody took this photograph.</strong> It is theirs, the same
        way your drawing is yours, and putting it on a page anybody can open
        without saying whose it is is the one thing on this site that could
        actually get somebody in trouble. Both boxes have to be filled in or the
        site will refuse to save the picture.
      </p>
      <p className={s.footnote}>
        Easiest place to find one you are allowed to use: search Wikimedia
        Commons, which tells you the licence and the photographer on every
        picture. Manufacturer press photos are usually fine too. A picture off
        an image search with no page behind it is the one to avoid.
      </p>

      <label className={s.field}>
        <span className={s.fieldLabel}>Whose photo is it?</span>
        <input
          className={s.input}
          value={credit}
          onChange={(e) => onCredit(e.target.value)}
          placeholder="Photo by Alexander Migl, CC BY-SA 4.0"
        />
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>The page you got it from</span>
        <input
          className={s.input}
          value={sourceUrl}
          onChange={(e) => onSourceUrl(e.target.value)}
          placeholder="https://commons.wikimedia.org/wiki/File:..."
        />
      </label>
    </div>
  );
}
