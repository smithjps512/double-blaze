"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ARTICLE_COPY,
  ARTICLE_KIND_OPTIONS,
  AUDIO_MIME_TYPES,
  BODY_MAX,
  SUMMARY_MAX,
  TITLE_MAX,
  type ArticleKind,
} from "@/lib/articles";

/**
 * Writing a piece.
 *
 * One form for all three kinds, because they differ in one field each and a
 * member deciding halfway through that their written piece is really an
 * interview should not have to start again.
 *
 * Two things here are worth knowing before changing them:
 *
 *  - **A draft saves with only a title.** Everything else can be empty. The
 *    server applies the same rule, and the publish button is the only thing
 *    that asks for more.
 *  - **The audio upload needs a row to attach to**, so choosing a file on a
 *    piece that has never been saved saves it as a draft first. That is why
 *    `ensureSaved` exists and why the id lives in state rather than in props.
 */

export interface EditorArticle {
  id: string | null;
  kind: ArticleKind;
  status: "draft" | "published" | "removed";
  slug: string | null;
  title: string;
  summary: string;
  body: string;
  video_url: string;
  series_id: string;
  series_position: string;
  media_path: string | null;
  media_bytes: number | null;
}

export interface SeriesOption {
  id: string;
  title: string;
}

const NEW_SERIES = "__new__";

export function ArticleEditor({
  initial,
  series,
}: {
  initial: EditorArticle;
  series: SeriesOption[];
}) {
  const router = useRouter();

  const [id, setId] = useState(initial.id);
  const [status, setStatus] = useState(initial.status);
  const [values, setValues] = useState({
    kind: initial.kind,
    title: initial.title,
    summary: initial.summary,
    body: initial.body,
    video_url: initial.video_url,
    series_id: initial.series_id,
    series_position: initial.series_position,
  });
  const [newSeries, setNewSeries] = useState("");
  const [media, setMedia] = useState<{ path: string | null; bytes: number | null }>({
    path: initial.media_path,
    bytes: initial.media_bytes,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "saving" | "publishing" | "uploading" | "deleting">(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const kind = values.kind;

  function set(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setNotice(null);
  }

  /** Create the series the author typed, if they typed one. Returns its id. */
  async function resolveSeries(): Promise<string | null | undefined> {
    if (values.series_id !== NEW_SERIES) return values.series_id || null;
    if (!newSeries.trim()) return null;

    const res = await fetch("/api/series", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: newSeries }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.errors ?? { series_id: data.error ?? "That series could not be created." });
      return undefined;
    }
    setValues((previous) => ({ ...previous, series_id: data.series.id }));
    setNewSeries("");
    return data.series.id as string;
  }

  /**
   * Save, and return the id. Publishing is the same request with one more
   * field, so the server applies one set of rules to both.
   */
  async function save(publish: boolean): Promise<string | null> {
    setBusy(publish ? "publishing" : "saving");
    setErrors({});
    setNotice(null);

    const seriesId = await resolveSeries();
    if (seriesId === undefined) {
      setBusy(null);
      return null;
    }

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, id, series_id: seriesId ?? "", publish }),
      });
      const data = await res.json().catch(() => ({}));
      setBusy(null);

      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? "That could not be saved." });
        return null;
      }

      setStatus(data.status);
      if (!id) {
        setId(data.id);
        // The URL, without a navigation. router.replace would refetch the page
        // and throw away everything typed since the save, which is exactly what
        // somebody mid-paragraph does not want. This only has to be right for a
        // manual refresh.
        window.history.replaceState(null, "", `/write/${data.id}`);
      }
      setNotice(publish ? "Published. Every member can read it now." : "Draft saved.");
      router.refresh();
      return data.id as string;
    } catch {
      setBusy(null);
      setErrors({ form: "Could not reach the server. Try again." });
      return null;
    }
  }

  async function upload(file: File) {
    // Audio attaches to a row, so a piece that has never been saved becomes a
    // draft first.
    const target = id ?? (await save(false));
    if (!target) return;

    setBusy("uploading");
    setErrors({});
    const body = new FormData();
    body.append("audio", file);

    try {
      const res = await fetch(`/api/articles/${target}/audio`, { method: "PUT", body });
      const data = await res.json().catch(() => ({}));
      setBusy(null);
      if (!res.ok) {
        setErrors({ audio: data.error ?? "That file could not be uploaded." });
        return;
      }
      setMedia({ path: data.path, bytes: data.bytes });
      setNotice("Recording uploaded.");
      router.refresh();
    } catch {
      setBusy(null);
      setErrors({ audio: "Could not reach the server. Try again." });
    }
  }

  async function remove() {
    if (!id) return;
    setBusy("deleting");
    try {
      const res = await fetch(`/api/articles?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBusy(null);
        setErrors({ form: data.error ?? "That could not be deleted." });
        return;
      }
      router.replace("/write");
      router.refresh();
    } catch {
      setBusy(null);
      setErrors({ form: "Could not reach the server. Try again." });
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <fieldset className="field">
        <legend>What kind of piece is this?</legend>
        {ARTICLE_KIND_OPTIONS.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name="kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => set("kind", option.value)}
            />
            <span>
              <span>{option.label}</span>
              <span className="help">{option.help}</span>
            </span>
          </label>
        ))}
        {errors.kind ? <p className="field-error">{errors.kind}</p> : null}
      </fieldset>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          maxLength={TITLE_MAX}
          value={values.title}
          aria-invalid={errors.title ? true : undefined}
          onChange={(e) => set("title", e.target.value)}
        />
        {errors.title ? <p className="field-error">{errors.title}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="summary">
          Summary <span className="optional">(optional)</span>
        </label>
        <p className="help">
          One or two lines. This is what members see in the library, so it is the part most
          of them read.
        </p>
        <textarea
          id="summary"
          rows={2}
          maxLength={SUMMARY_MAX}
          value={values.summary}
          aria-invalid={errors.summary ? true : undefined}
          onChange={(e) => set("summary", e.target.value)}
        />
        {errors.summary ? <p className="field-error">{errors.summary}</p> : null}
      </div>

      {kind === "audio" ? (
        <div className="field">
          <label htmlFor="audio">Recording</label>
          <p className="help">
            MP3, M4A, AAC, OGG, or WAV, up to 50MB. It plays inside the club and is not
            reachable from outside it.
          </p>
          {media.path ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls preload="none" src={`/api/media/${media.path}`} />
              <p className="help">
                {media.bytes ? `${Math.round(media.bytes / 1024 / 1024 * 10) / 10}MB. ` : ""}
                Choosing another file replaces it.
              </p>
            </>
          ) : null}
          <input
            id="audio"
            type="file"
            accept={AUDIO_MIME_TYPES.join(",")}
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          {busy === "uploading" ? <p className="help">Uploading...</p> : null}
          {errors.audio ? <p className="field-error">{errors.audio}</p> : null}
        </div>
      ) : null}

      {kind === "video" ? (
        <div className="field">
          <label htmlFor="video_url">Video link</label>
          <p className="help">
            A YouTube or Vimeo address, copied from the browser bar. The video stays where it
            is and plays inside the article.
          </p>
          <input
            id="video_url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={values.video_url}
            aria-invalid={errors.video_url ? true : undefined}
            onChange={(e) => set("video_url", e.target.value)}
          />
          {errors.video_url ? <p className="field-error">{errors.video_url}</p> : null}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="body">
          {kind === "written" ? "The piece" : "Notes or a transcript"}
          {kind === "written" ? null : <span className="optional"> (optional)</span>}
        </label>
        {kind === "written" ? null : (
          <p className="help">
            Anything a reader should have alongside the recording. A transcript here is what
            makes an audio piece searchable and readable.
          </p>
        )}
        <textarea
          id="body"
          rows={kind === "written" ? 18 : 6}
          maxLength={BODY_MAX}
          value={values.body}
          aria-invalid={errors.body ? true : undefined}
          onChange={(e) => set("body", e.target.value)}
        />
        {errors.body ? <p className="field-error">{errors.body}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="series_id">
          Series <span className="optional">(optional)</span>
        </label>
        <p className="help">{ARTICLE_COPY.seriesHelp}</p>
        <select
          id="series_id"
          value={values.series_id}
          onChange={(e) => set("series_id", e.target.value)}
        >
          <option value="">Not part of one</option>
          {series.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
          <option value={NEW_SERIES}>Start a new series</option>
        </select>

        {values.series_id === NEW_SERIES ? (
          <>
            <label htmlFor="new_series" className="visually-hidden">
              Name of the new series
            </label>
            <input
              id="new_series"
              type="text"
              placeholder="Name of the series"
              value={newSeries}
              onChange={(e) => setNewSeries(e.target.value)}
            />
          </>
        ) : null}

        {values.series_id && values.series_id !== NEW_SERIES ? (
          <>
            <label htmlFor="series_position">Part number (optional)</label>
            <input
              id="series_position"
              type="number"
              min={1}
              max={999}
              value={values.series_position}
              aria-invalid={errors.series_position ? true : undefined}
              onChange={(e) => set("series_position", e.target.value)}
            />
          </>
        ) : null}

        {errors.series_id ? <p className="field-error">{errors.series_id}</p> : null}
        {errors.series_position ? <p className="field-error">{errors.series_position}</p> : null}
      </div>

      {status === "removed" ? (
        <p className="notice error">{ARTICLE_COPY.removedNotice}</p>
      ) : (
        <p className="notice">
          {status === "published" ? (
            <>Published. Changes you save go live straight away.</>
          ) : (
            ARTICLE_COPY.publishHelp
          )}
        </p>
      )}

      <p className="muted small">{ARTICLE_COPY.antitrustReminder}</p>

      {errors.form ? (
        <p className="notice error" role="alert">
          {errors.form}
        </p>
      ) : null}
      {notice ? (
        <p className="notice" role="status">
          {notice}
          {id && status === "published" && initial.slug ? (
            <>
              {" "}
              <a href={`/library/${initial.slug}`}>See it in the library</a>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="decide">
        {status === "published" ? (
          <>
            <button type="button" disabled={busy !== null} onClick={() => void save(true)}>
              {busy === "publishing" ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="quiet"
              disabled={busy !== null}
              onClick={() => void save(false)}
            >
              Take it back to a draft
            </button>
          </>
        ) : status === "draft" ? (
          <>
            <button type="button" disabled={busy !== null} onClick={() => void save(true)}>
              {busy === "publishing" ? "Publishing..." : "Publish"}
            </button>
            <button
              type="button"
              className="quiet"
              disabled={busy !== null}
              onClick={() => void save(false)}
            >
              {busy === "saving" ? "Saving..." : "Save as a draft"}
            </button>
          </>
        ) : null}

        {id && status !== "removed" ? (
          confirmingDelete ? (
            <>
              <button type="button" className="danger" disabled={busy !== null} onClick={remove}>
                {busy === "deleting" ? "Deleting..." : "Yes, delete it"}
              </button>
              <button
                type="button"
                className="quiet"
                disabled={busy !== null}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep it
              </button>
            </>
          ) : (
            <button
              type="button"
              className="quiet"
              disabled={busy !== null}
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          )
        ) : null}
      </div>
    </form>
  );
}
