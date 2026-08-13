/**
 * Articles and media (session 5).
 *
 * The core of the brief: members publish written pieces, audio, and embedded
 * video into a library only members can read. This module holds the field
 * definitions, the validation, and the copy, so the editor, the API route, and
 * the library all read the same rules and none of it needs a browser or a
 * database to test.
 *
 * Pure and framework-free, like lib/join.ts, lib/admin.ts, lib/invitations.ts
 * and lib/profile.ts.
 *
 * ---------------------------------------------------------------------------
 * Three kinds, one shape
 * ---------------------------------------------------------------------------
 *
 * The media split was decided in build plan section 2: video is embedded from
 * YouTube or Vimeo, audio and documents are self-hosted. So a written piece
 * carries prose, an audio piece carries a file in the member-media bucket, and
 * a video piece carries a provider and an id. Everything else is identical, and
 * `requires` below is the only place that difference is written down.
 *
 * ---------------------------------------------------------------------------
 * Why an embed is a provider and an id, never a URL
 * ---------------------------------------------------------------------------
 *
 * An article's video ends up in an iframe src. Storing the URL an author pasted
 * and putting that in the src would make "publish an article" mean "embed
 * anything you like in a page other members trust". So the URL is parsed down
 * to a provider and an id, the id is checked against the shape that provider
 * actually uses, and the src is rebuilt from scratch. An author who pastes
 * something unrecognized gets told, rather than getting an embed nobody
 * intended.
 *
 * YouTube is embedded through youtube-nocookie.com. A club whose whole premise
 * is that its inside is not public should not hand a reading list to an ad
 * network on page load.
 *
 * ---------------------------------------------------------------------------
 * The name of the content area
 * ---------------------------------------------------------------------------
 *
 * Still open, and flagged in build plan section 3 item 6 and in status.md. The
 * copy below calls it the library, which is the plain description the brief
 * itself uses, rather than a name invented here and quietly shipped. Options go
 * to the club at this session's gate, and changing it later is this file.
 *
 * No em dashes anywhere, per the house rule, and no coordination language, per
 * build plan section 3.
 */

export const ARTICLE_KINDS = ["written", "audio", "video"] as const;
export type ArticleKind = (typeof ARTICLE_KINDS)[number];

export const ARTICLE_STATUSES = ["draft", "published", "removed"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export interface ArticleKindOption {
  value: ArticleKind;
  label: string;
  help: string;
  /** What this kind cannot be published without. */
  requires: "body" | "audio" | "embed";
  /** The word for one of these, in a list. */
  noun: string;
  /**
   * How this kind is offered as a way in, before any form exists.
   *
   * A user test found that a member who sees only "Write" concludes that
   * writing is the only thing on offer. The kinds have to be visible as
   * choices, not discovered as a radio button on a page they had no reason to
   * open.
   */
  action: string;
  /** The heading once that choice has been made. */
  heading: string;
}

export const ARTICLE_KIND_OPTIONS: readonly ArticleKindOption[] = [
  {
    value: "written",
    label: "Written",
    help: "A piece you type here. The most common thing to publish.",
    requires: "body",
    noun: "Written",
    action: "Write a piece",
    heading: "Write something",
  },
  {
    value: "audio",
    label: "Audio",
    help: "An interview or a recorded talk, up to 50MB. Members play it here, and it is not reachable from outside the club.",
    requires: "audio",
    noun: "Audio",
    action: "Upload a recording",
    heading: "Upload a recording",
  },
  {
    value: "video",
    label: "Video",
    help: "A YouTube or Vimeo link. The video stays where it is and plays inside the article.",
    requires: "embed",
    noun: "Video",
    action: "Add a video",
    heading: "Add a video",
  },
];

export function articleKindOption(kind: string): ArticleKindOption | undefined {
  return ARTICLE_KIND_OPTIONS.find((option) => option.value === kind);
}

/**
 * A kind from a query string, or the default.
 *
 * The three ways in are links rather than a form, so the choice arrives as
 * `?kind=audio`. Anything unrecognised falls back to written rather than
 * failing, because a mistyped URL should open the editor rather than an error.
 */
export function parseArticleKind(value: unknown): ArticleKind {
  return typeof value === "string" && (ARTICLE_KINDS as readonly string[]).includes(value)
    ? (value as ArticleKind)
    : "written";
}

/* ---------------------------------------------------------------------------
 * Limits
 * ------------------------------------------------------------------------- */

export const TITLE_MAX = 140;
export const SUMMARY_MAX = 320;
export const BODY_MAX = 60000;
export const SERIES_TITLE_MAX = 90;
export const SERIES_DESCRIPTION_MAX = 400;

/**
 * The bucket in 0022 accepts 50MB, and this matches it rather than sitting
 * under it, because a member who gets past this check and then fails at the
 * storage layer has been told the wrong thing.
 */
export const AUDIO_MAX_BYTES = 50 * 1024 * 1024;

export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
] as const;

/** Extension by mime type. Never taken from the filename: see 0022. */
const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

export function audioExtension(mime: string): string {
  return AUDIO_EXTENSIONS[mime] ?? "bin";
}

/** Whether an uploaded file is acceptable audio. Mirrors checkPhoto. */
export function checkAudio(file: { type: string; size: number }): string | null {
  if (!(AUDIO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Audio needs to be an MP3, M4A, AAC, OGG, or WAV file.";
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return `That file is larger than ${Math.round(AUDIO_MAX_BYTES / 1024 / 1024)}MB.`;
  }
  if (file.size === 0) return "That file was empty.";
  return null;
}

/* ---------------------------------------------------------------------------
 * Slugs
 * ------------------------------------------------------------------------- */

/**
 * A title turned into the URL it gets.
 *
 * Diacritics are folded rather than dropped, so a title in a language that uses
 * them produces a readable slug instead of a row of hyphens. The membership is
 * international and this is the cheapest place to notice that.
 */
export function slugify(value: string, max = 70): string {
  const slug = (value ?? "")
    .normalize("NFKD")
    // The combining marks NFKD just split off. Folded rather than turned into
    // hyphens, so "Résumé" becomes "resume" and not "r-sum".
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return slug || "untitled";
}

/**
 * The slug to try on the nth attempt.
 *
 * Slugs are unique per club, so two members titling a piece the same way is an
 * ordinary event rather than an error. The first attempt is the clean slug; a
 * collision appends a short suffix rather than a counter, because a counter
 * leaks how many attempts came before and invites guessing at drafts.
 */
export function slugAttempt(base: string, attempt: number, suffix?: string): string {
  if (attempt === 0) return base;
  const tail = suffix ?? Math.random().toString(36).slice(2, 7);
  return `${base.slice(0, 70 - tail.length - 1)}-${tail}`;
}

/* ---------------------------------------------------------------------------
 * Embeds
 * ------------------------------------------------------------------------- */

export interface EmbedTarget {
  provider: "youtube" | "vimeo";
  /**
   * YouTube: the eleven character id. Vimeo: the numeric id, optionally
   * followed by "/" and the privacy hash that an unlisted video needs in order
   * to play. Both shapes are validated before anything is built from them.
   */
  id: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d+(?:\/[A-Za-z0-9]+)?$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

/**
 * Turn a link an author pasted into a provider and an id, or nothing.
 *
 * Nothing is the important case. An unparsed link is refused rather than stored
 * hopefully, because the alternative is an article whose video silently does
 * not play, and the author is the last person to find out.
 */
export function parseEmbedUrl(input: unknown): EmbedTarget | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  // http and https only. A javascript: or data: link parses perfectly well.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    const id =
      host === "youtu.be"
        ? segments[0]
        : url.searchParams.get("v") ??
          (["embed", "shorts", "live", "v"].includes(segments[0]) ? segments[1] : undefined);
    return id && YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
  }

  if (VIMEO_HOSTS.has(host)) {
    // vimeo.com/123, vimeo.com/123/hash, vimeo.com/channels/staffpicks/123,
    // player.vimeo.com/video/123.
    const numeric = segments.findIndex((s) => /^\d+$/.test(s));
    if (numeric === -1) return null;
    const id = segments[numeric];
    const next = segments[numeric + 1];
    const hash = next && /^[A-Za-z0-9]+$/.test(next) && !/^\d+$/.test(next) ? next : undefined;
    const value = hash ? `${id}/${hash}` : id;
    return VIMEO_ID.test(value) ? { provider: "vimeo", id: value } : null;
  }

  return null;
}

/** Whether a stored provider and id are still a shape worth rendering. */
export function isEmbedTarget(
  provider: string | null | undefined,
  id: string | null | undefined,
): boolean {
  if (!provider || !id) return false;
  if (provider === "youtube") return YOUTUBE_ID.test(id);
  if (provider === "vimeo") return VIMEO_ID.test(id);
  return false;
}

/**
 * The iframe src, built from the id rather than from anything an author typed.
 *
 * Returns null for anything that does not validate, so a bad row renders as no
 * player rather than as an iframe pointed somewhere unintended.
 */
export function embedSrc(
  provider: string | null | undefined,
  id: string | null | undefined,
): string | null {
  if (!isEmbedTarget(provider, id)) return null;
  if (provider === "youtube") {
    // nocookie, because a member opening an article should not hand their
    // reading to an ad network before the page has rendered.
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  const [video, hash] = (id as string).split("/");
  return `https://player.vimeo.com/video/${video}${hash ? `?h=${hash}` : ""}`;
}

/** Where the video actually lives, for a member who would rather watch it there. */
export function embedWatchUrl(
  provider: string | null | undefined,
  id: string | null | undefined,
): string | null {
  if (!isEmbedTarget(provider, id)) return null;
  if (provider === "youtube") return `https://www.youtube.com/watch?v=${id}`;
  return `https://vimeo.com/${id}`;
}

/* ---------------------------------------------------------------------------
 * Cleaning and validation
 * ------------------------------------------------------------------------- */

function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanBlock(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return (
    value
      .replace(/\r\n?/g, "\n")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ")
      .replace(/[ \t]+/g, " ")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max)
  );
}

/** The columns an article write actually sets. */
export interface CleanArticle {
  kind: ArticleKind;
  status: "draft" | "published";
  title: string;
  summary: string | null;
  body: string | null;
  media_path: string | null;
  media_mime: string | null;
  media_bytes: number | null;
  embed_provider: "youtube" | "vimeo" | null;
  embed_id: string | null;
  series_id: string | null;
  series_position: number | null;
}

export interface StoredMedia {
  media_path?: string | null;
  media_mime?: string | null;
  media_bytes?: number | null;
}

export type ArticleValidation =
  | { ok: true; article: CleanArticle }
  | { ok: false; errors: Record<string, string> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate a submitted article.
 *
 * Two rules worth stating, because they are the difference between this and
 * cleanProfile:
 *
 *  - **A draft only needs a title.** Saving work in progress is the point of a
 *    draft, and a save that refuses because the piece is not finished is a save
 *    that costs somebody their work.
 *  - **Publishing needs what the kind requires.** A written piece with no prose
 *    or an audio piece with no file is not an article, and publishing one puts
 *    it in front of the whole membership.
 *
 * The audio path is never taken from the request. It is read back from what is
 * already stored, exactly like photo_path in cleanProfile, because a caller who
 * could set it could point their article at somebody else's file.
 *
 * Every error comes back at once, keyed by field.
 */
export function validateArticle(input: unknown, stored?: StoredMedia): ArticleValidation {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const kindValue = cleanLine(body.kind, 16);
  const kind = (ARTICLE_KINDS as readonly string[]).includes(kindValue)
    ? (kindValue as ArticleKind)
    : null;
  if (!kind) errors.kind = "Pick what kind of piece this is.";

  const publishing = body.publish === true || body.publish === "true";

  const title = cleanLine(body.title, TITLE_MAX + 1);
  if (!title) {
    errors.title = "A title is needed, even for a draft.";
  } else if (title.length > TITLE_MAX) {
    errors.title = `Please keep the title under ${TITLE_MAX} characters.`;
  }

  const summary = cleanLine(body.summary, SUMMARY_MAX + 1);
  if (summary.length > SUMMARY_MAX) {
    errors.summary = `Please keep the summary under ${SUMMARY_MAX} characters.`;
  }

  const prose = cleanBlock(body.body, BODY_MAX);

  // Audio survives only while the piece is still audio. Changing an audio piece
  // into a written one drops the pointer, and the route removes the bytes.
  const keepMedia = kind === "audio";
  const mediaPath = keepMedia ? (stored?.media_path ?? null) : null;

  let embed: EmbedTarget | null = null;
  const embedInput = typeof body.video_url === "string" ? body.video_url.trim() : "";
  if (kind === "video" && embedInput) {
    embed = parseEmbedUrl(embedInput);
    if (!embed) {
      errors.video_url =
        "That is not a YouTube or Vimeo link we recognize. Paste the address from the browser bar.";
    }
  }

  if (publishing && kind) {
    const requires = articleKindOption(kind)?.requires;
    if (requires === "body" && !prose) {
      errors.body = "There is nothing to publish yet. Write the piece first.";
    }
    if (requires === "audio" && !mediaPath) {
      errors.audio = "Upload the audio before publishing.";
    }
    if (requires === "embed" && !embed) {
      errors.video_url = errors.video_url ?? "Add the video link before publishing.";
    }
  }

  const seriesId = cleanLine(body.series_id, 40);
  if (seriesId && !UUID.test(seriesId)) errors.series_id = "That series is not one of ours.";

  const positionRaw = body.series_position;
  let position: number | null = null;
  if (seriesId && positionRaw !== null && positionRaw !== undefined && positionRaw !== "") {
    const parsed = Number(positionRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
      errors.series_position = "Use a whole number between 1 and 999.";
    } else {
      position = parsed;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    article: {
      kind: kind as ArticleKind,
      status: publishing ? "published" : "draft",
      title,
      summary: summary || null,
      body: prose || null,
      media_path: mediaPath,
      media_mime: keepMedia ? (stored?.media_mime ?? null) : null,
      media_bytes: keepMedia ? (stored?.media_bytes ?? null) : null,
      embed_provider: kind === "video" && embed ? embed.provider : null,
      embed_id: kind === "video" && embed ? embed.id : null,
      series_id: seriesId || null,
      series_position: seriesId ? position : null,
    },
  };
}

export interface CleanSeries {
  title: string;
  slug: string;
  description: string | null;
}

export type SeriesValidation =
  | { ok: true; series: CleanSeries }
  | { ok: false; errors: Record<string, string> };

export function validateSeries(input: unknown): SeriesValidation {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const title = cleanLine(body.title, SERIES_TITLE_MAX + 1);
  if (!title) {
    errors.title = "Give the series a name.";
  } else if (title.length > SERIES_TITLE_MAX) {
    errors.title = `Please keep the name under ${SERIES_TITLE_MAX} characters.`;
  }

  const description = cleanLine(body.description, SERIES_DESCRIPTION_MAX + 1);
  if (description.length > SERIES_DESCRIPTION_MAX) {
    errors.description = `Please keep this under ${SERIES_DESCRIPTION_MAX} characters.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, series: { title, slug: slugify(title), description: description || null } };
}

/* ---------------------------------------------------------------------------
 * Reading an article back
 * ------------------------------------------------------------------------- */

/** Where a member's audio upload goes. The path is the security model; see 0022. */
export function articleMediaPath(siteId: string, memberId: string, extension: string): string {
  const safe = extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  return `${siteId}/${memberId}/${crypto.randomUUID()}.${safe}`;
}

/** Roughly how long a written piece takes, at 200 words a minute. */
export function readingMinutes(body: string | null | undefined): number {
  if (!body) return 0;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / 200));
}

/** Paragraphs, for rendering prose without letting anyone inject markup. */
export function articleParagraphs(body: string | null | undefined): string[] {
  if (!body) return [];
  return body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/**
 * The line under a title in the library.
 *
 * Video says nothing about length, because the length lives off-site. That was
 * the accepted cost of the embedding decision in build plan section 2, and it
 * is better said by omission than by a guess.
 */
export function articleMeta(article: {
  kind: string;
  body?: string | null;
  media_bytes?: number | null;
}): string {
  if (article.kind === "written") {
    const minutes = readingMinutes(article.body);
    return minutes ? `Written, ${minutes} minute read` : "Written";
  }
  if (article.kind === "audio") return "Audio";
  return "Video";
}

/**
 * How many members have read it.
 *
 * The number is what an author gets, and it is deliberately not a list. The
 * per-reader rows exist and only that reader and an administrator can see them,
 * which is the safe direction to be wrong in while the retention policy is
 * still open. See migration 0023 and build plan section 3 item 3.
 */
export function readerCount(article: {
  unique_readers?: number | null;
  total_reads?: number | null;
}): string {
  const unique = article.unique_readers ?? 0;
  if (unique === 0) return "No readers yet";
  if (unique === 1) return "Read by 1 member";
  return `Read by ${unique} members`;
}

/** The date a member sees. Deterministic, and the same on the server and client. */
export function articleDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------------------
 * Copy
 * ------------------------------------------------------------------------- */

/**
 * Everything the library and the editor say, in one place.
 *
 * Here rather than in the pages for the same reason the questions live in
 * lib/join.ts: it is what the antitrust pass in build plan section 3 has to
 * read, and there is a test that reads it.
 *
 * Note what these strings do not say. The word "library" is a description, not
 * the name of the content area, which is still open and belongs to the club.
 */
export const ARTICLE_COPY = {
  libraryTitle: "The library",
  libraryIntro:
    "Everything members have published. Written pieces, recordings, and video, visible only inside the club.",
  libraryEmpty:
    "Nothing has been published yet. The first piece in here sets the tone for the rest, so it is worth being the one to write it.",
  writeTitle: "Your pieces",
  writeIntro:
    "Everything you have published, and your drafts. A draft is visible to nobody but you until you publish it.",
  writeEmpty: "You have not started anything yet. Pick one of the three above.",
  startTitle: "Add something to the library",
  kindHelp:
    "This decides what you attach. A written piece you type here, audio you upload, or a video you link to.",
  publishHelp:
    "Publishing puts this in front of every member straight away. You can take it back to a draft afterwards, and an administrator can remove it.",
  draftNotice: "This is a draft. Nobody else can see it.",
  removedNotice:
    "An administrator has taken this down. It is no longer in the library, and only you can still see it here.",
  seriesHelp: "Optional. Put this alongside other pieces on the same subject.",
  antitrustReminder:
    "A reminder before you publish: write about published results, methods, and your own experience. Please leave out forward-looking plans, pricing, and capacity decisions.",
} as const;

/**
 * The reminder above deserves its own note, because it is the one piece of copy
 * in this build that exists for a legal reason rather than a usability one.
 *
 * Build plan section 3 item 2 records that this club's members work under FERC
 * and state regulators, and that the forum's own subjects (load growth,
 * forecasting, interconnection) touch commercially sensitive ground. Where the
 * line sits is a question for the club's counsel and not for Double Blaze. So
 * this string states the safe side and does not attempt to define the unsafe
 * one, and it is expected to be replaced with whatever counsel provides.
 */
