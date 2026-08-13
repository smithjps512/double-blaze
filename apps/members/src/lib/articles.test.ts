import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ARTICLE_COPY,
  ARTICLE_KIND_OPTIONS,
  AUDIO_MAX_BYTES,
  BODY_MAX,
  SUMMARY_MAX,
  TITLE_MAX,
  articleDate,
  articleKindOption,
  articleMediaPath,
  articleMeta,
  articleParagraphs,
  audioExtension,
  checkAudio,
  embedSrc,
  embedWatchUrl,
  isEmbedTarget,
  parseEmbedUrl,
  readerCount,
  readingMinutes,
  slugAttempt,
  slugify,
  validateArticle,
  validateSeries,
} from "./articles.js";

const SITE = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const MEMBER = "9c858901-8a57-4791-81fe-4c455b099bc9";
const SERIES = "1a3b1e0c-5d31-4f45-9d1e-6b9a2c7d4e11";

const WRITTEN = { kind: "written", title: "Forecasting under uncertainty" };

describe("kinds", () => {
  it("covers exactly the three the build plan settled on", () => {
    assert.deepEqual(
      ARTICLE_KIND_OPTIONS.map((k) => k.value),
      ["written", "audio", "video"],
    );
  });

  it("says what each kind cannot be published without", () => {
    assert.equal(articleKindOption("written")?.requires, "body");
    assert.equal(articleKindOption("audio")?.requires, "audio");
    assert.equal(articleKindOption("video")?.requires, "embed");
  });

  it("does not recognize a kind nobody defined", () => {
    assert.equal(articleKindOption("document"), undefined);
  });
});

describe("checkAudio", () => {
  it("accepts the formats the bucket in 0022 accepts", () => {
    for (const type of ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav"]) {
      assert.equal(checkAudio({ type, size: 1000 }), null, `refused ${type}`);
    }
  });

  it("refuses anything else, including things a browser would run", () => {
    for (const type of ["video/mp4", "text/html", "image/svg+xml", "application/pdf", ""]) {
      assert.ok(checkAudio({ type, size: 1000 }), `accepted ${type}`);
    }
  });

  it("stops at the same size the bucket does, so nobody is told the wrong limit", () => {
    assert.equal(checkAudio({ type: "audio/mpeg", size: AUDIO_MAX_BYTES }), null);
    assert.ok(checkAudio({ type: "audio/mpeg", size: AUDIO_MAX_BYTES + 1 }));
  });

  it("refuses an empty file", () => {
    assert.ok(checkAudio({ type: "audio/mpeg", size: 0 }));
  });
});

describe("audioExtension", () => {
  it("comes from the mime type, never from a filename", () => {
    assert.equal(audioExtension("audio/mpeg"), "mp3");
    assert.equal(audioExtension("audio/wav"), "wav");
  });

  it("falls back rather than trusting something unknown", () => {
    assert.equal(audioExtension("audio/x-made-up"), "bin");
  });
});

describe("slugify", () => {
  it("turns a title into something readable in a URL", () => {
    assert.equal(slugify("Forecasting Under Uncertainty"), "forecasting-under-uncertainty");
  });

  it("folds diacritics rather than dropping them", () => {
    // The membership is international, and "r-sum" is not a URL anybody wants.
    assert.equal(slugify("Résumé of the séance"), "resume-of-the-seance");
  });

  it("drops apostrophes instead of turning them into hyphens", () => {
    assert.equal(slugify("The grid's next decade"), "the-grids-next-decade");
  });

  it("never leaves a stray hyphen at either end", () => {
    assert.equal(slugify("  ...Load growth!!  "), "load-growth");
    assert.ok(!slugify("x".repeat(69) + " tail").endsWith("-"));
  });

  it("caps the length", () => {
    assert.ok(slugify("word ".repeat(60)).length <= 70);
  });

  it("always returns something, even for a title with no letters", () => {
    assert.equal(slugify("!!!"), "untitled");
    assert.equal(slugify(""), "untitled");
  });
});

describe("slugAttempt", () => {
  it("uses the clean slug first", () => {
    assert.equal(slugAttempt("load-growth", 0), "load-growth");
  });

  it("appends a suffix on a collision rather than a counter", () => {
    // A counter would say how many drafts came before, which is nobody's
    // business and an invitation to guess at them.
    assert.equal(slugAttempt("load-growth", 1, "k7f2a"), "load-growth-k7f2a");
    assert.ok(!/-2$/.test(slugAttempt("load-growth", 1)));
  });

  it("stays inside the length cap even for a long title", () => {
    assert.ok(slugAttempt("x".repeat(70), 1, "k7f2a").length <= 70);
  });
});

describe("parseEmbedUrl", () => {
  it("reads every YouTube shape a member is likely to paste", () => {
    const forms = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "youtube.com/watch?v=dQw4w9WgXcQ",
    ];
    for (const form of forms) {
      assert.deepEqual(parseEmbedUrl(form), { provider: "youtube", id: "dQw4w9WgXcQ" }, form);
    }
  });

  it("reads every Vimeo shape, including the hash an unlisted video needs", () => {
    assert.deepEqual(parseEmbedUrl("https://vimeo.com/123456789"), {
      provider: "vimeo",
      id: "123456789",
    });
    assert.deepEqual(parseEmbedUrl("https://player.vimeo.com/video/123456789"), {
      provider: "vimeo",
      id: "123456789",
    });
    assert.deepEqual(parseEmbedUrl("https://vimeo.com/channels/staffpicks/123456789"), {
      provider: "vimeo",
      id: "123456789",
    });
    assert.deepEqual(parseEmbedUrl("https://vimeo.com/123456789/a1b2c3d4e5"), {
      provider: "vimeo",
      id: "123456789/a1b2c3d4e5",
    });
  });

  it("refuses a host that is not one of the two the build plan chose", () => {
    for (const url of [
      "https://example.test/video/1",
      "https://notyoutube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
      "https://dailymotion.com/video/x123",
    ]) {
      assert.equal(parseEmbedUrl(url), null, `accepted ${url}`);
    }
  });

  it("refuses a scheme that can execute", () => {
    // This is the reason the URL never reaches an iframe src unparsed.
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
    ]) {
      assert.equal(parseEmbedUrl(url), null, `accepted ${url}`);
    }
  });

  it("refuses an id that is not the shape the provider uses", () => {
    assert.equal(parseEmbedUrl("https://www.youtube.com/watch?v=short"), null);
    assert.equal(parseEmbedUrl("https://www.youtube.com/watch?v=way_too_long_for_youtube"), null);
    assert.equal(parseEmbedUrl("https://vimeo.com/not-a-number"), null);
  });

  it("survives anything that is not a string", () => {
    for (const input of [null, undefined, 7, {}, []]) {
      assert.equal(parseEmbedUrl(input), null);
    }
  });
});

describe("embedSrc", () => {
  it("builds the YouTube src from the id, through nocookie", () => {
    assert.equal(
      embedSrc("youtube", "dQw4w9WgXcQ"),
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("carries a Vimeo hash into the query, which is what makes an unlisted video play", () => {
    assert.equal(embedSrc("vimeo", "123456789"), "https://player.vimeo.com/video/123456789");
    assert.equal(
      embedSrc("vimeo", "123456789/a1b2c3d4e5"),
      "https://player.vimeo.com/video/123456789?h=a1b2c3d4e5",
    );
  });

  it("returns nothing for a row that does not validate, so no iframe is rendered", () => {
    // A stored row is checked again at render time. If a column were ever
    // written some other way, the page shows no player rather than an iframe
    // pointed somewhere nobody intended.
    assert.equal(embedSrc("youtube", "../../evil"), null);
    assert.equal(embedSrc("youtube", "dQw4w9WgXcQ?x=1"), null);
    assert.equal(embedSrc("vimeo", "1;drop"), null);
    assert.equal(embedSrc("wistia", "abc"), null);
    assert.equal(embedSrc(null, null), null);
  });

  it("agrees with isEmbedTarget", () => {
    assert.equal(isEmbedTarget("youtube", "dQw4w9WgXcQ"), true);
    assert.equal(isEmbedTarget("youtube", "nope"), false);
  });
});

describe("embedWatchUrl", () => {
  it("points at where the video actually lives", () => {
    assert.equal(
      embedWatchUrl("youtube", "dQw4w9WgXcQ"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    assert.equal(embedWatchUrl("vimeo", "123456789"), "https://vimeo.com/123456789");
  });

  it("returns nothing for a row that does not validate", () => {
    assert.equal(embedWatchUrl("youtube", "nope"), null);
  });
});

describe("validateArticle", () => {
  it("saves a draft that has only a title, because that is the point of a draft", () => {
    const result = validateArticle(WRITTEN);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.status, "draft");
    assert.equal(result.article.body, null);
  });

  it("refuses a draft with no title, since nothing could find it again", () => {
    const result = validateArticle({ kind: "written" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.title);
  });

  it("refuses a kind nobody defined", () => {
    const result = validateArticle({ kind: "podcast", title: "A talk" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.kind);
  });

  it("will not publish a written piece with nothing written", () => {
    const result = validateArticle({ ...WRITTEN, publish: true });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.body);
  });

  it("publishes a written piece that has prose", () => {
    const result = validateArticle({ ...WRITTEN, body: "Two paragraphs.\n\nOf prose.", publish: true });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.status, "published");
    assert.equal(result.article.body, "Two paragraphs.\n\nOf prose.");
  });

  it("will not publish audio with no file, but will save it as a draft", () => {
    const audio = { kind: "audio", title: "An interview" };
    assert.equal(validateArticle(audio).ok, true);

    const publishing = validateArticle({ ...audio, publish: true });
    assert.equal(publishing.ok, false);
    if (publishing.ok) return;
    assert.ok(publishing.errors.audio);
  });

  it("publishes audio once the upload has happened", () => {
    const result = validateArticle(
      { kind: "audio", title: "An interview", publish: true },
      { media_path: `${SITE}/${MEMBER}/a.mp3`, media_mime: "audio/mpeg", media_bytes: 900 },
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.media_path, `${SITE}/${MEMBER}/a.mp3`);
  });

  it("never lets the caller name the audio file", () => {
    // The same rule as photo_path in cleanProfile. A caller who could set this
    // could point their article at somebody else's upload.
    const result = validateArticle({
      kind: "audio",
      title: "An interview",
      media_path: "someone/elses/recording.mp3",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.media_path, null);
  });

  it("drops the audio when a piece stops being audio", () => {
    const result = validateArticle(
      { kind: "written", title: "Now in prose", body: "Words." },
      { media_path: `${SITE}/${MEMBER}/a.mp3`, media_mime: "audio/mpeg", media_bytes: 900 },
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.media_path, null);
    assert.equal(result.article.media_mime, null);
  });

  it("stores a video as a provider and an id, not as the URL that was pasted", () => {
    const result = validateArticle({
      kind: "video",
      title: "A recorded talk",
      video_url: "https://youtu.be/dQw4w9WgXcQ?t=90",
      publish: true,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.embed_provider, "youtube");
    assert.equal(result.article.embed_id, "dQw4w9WgXcQ");
  });

  it("tells an author their link was not understood rather than storing it hopefully", () => {
    const result = validateArticle({
      kind: "video",
      title: "A recorded talk",
      video_url: "https://example.test/my-video",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.video_url);
  });

  it("will not publish a video with no link", () => {
    const result = validateArticle({ kind: "video", title: "A talk", publish: true });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.video_url);
  });

  it("drops the embed when a piece stops being video", () => {
    const result = validateArticle({
      kind: "written",
      title: "Now in prose",
      video_url: "https://youtu.be/dQw4w9WgXcQ",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.embed_id, null);
  });

  it("refuses a title or summary that runs long rather than truncating", () => {
    // Unlike a profile, these are read by the whole membership in a list, so
    // silently cutting one mid-word is worse than saying so.
    const long = validateArticle({ ...WRITTEN, title: "x".repeat(TITLE_MAX + 1) });
    assert.equal(long.ok, false);

    const summary = validateArticle({ ...WRITTEN, summary: "x".repeat(SUMMARY_MAX + 1) });
    assert.equal(summary.ok, false);
  });

  it("truncates the body, because losing a long piece is worse than trimming it", () => {
    const result = validateArticle({ ...WRITTEN, body: "x".repeat(BODY_MAX + 500) });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.body?.length, BODY_MAX);
  });

  it("keeps paragraphs in the body and collapses them in the title", () => {
    const result = validateArticle({
      kind: "written",
      title: "  Load   growth  ",
      body: "One.\n\n\n\nTwo.",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.article.title, "Load growth");
    assert.equal(result.article.body, "One.\n\nTwo.");
  });

  it("accepts a series and a position, and refuses a position without a series", () => {
    const filed = validateArticle({ ...WRITTEN, series_id: SERIES, series_position: 3 });
    assert.equal(filed.ok, true);
    if (!filed.ok) return;
    assert.equal(filed.article.series_id, SERIES);
    assert.equal(filed.article.series_position, 3);

    const loose = validateArticle({ ...WRITTEN, series_position: 3 });
    assert.equal(loose.ok, true);
    if (!loose.ok) return;
    assert.equal(loose.article.series_position, null);
  });

  it("refuses a series that is not an id we could have issued", () => {
    const result = validateArticle({ ...WRITTEN, series_id: "'; drop table site_articles;" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.series_id);
  });

  it("refuses a position that is not a whole number in range", () => {
    for (const value of [0, -1, 1.5, 1000, "third"]) {
      const result = validateArticle({ ...WRITTEN, series_id: SERIES, series_position: value });
      assert.equal(result.ok, false, `accepted ${value}`);
    }
  });

  it("returns every error at once rather than one at a time", () => {
    const result = validateArticle({ kind: "nonsense", publish: true });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.kind);
    assert.ok(result.errors.title);
  });

  it("survives a malformed body", () => {
    for (const input of [null, undefined, "article", 7, []]) {
      assert.equal(validateArticle(input).ok, false);
    }
  });
});

describe("validateSeries", () => {
  it("takes a name and derives the slug from it", () => {
    const result = validateSeries({ title: "Load growth, in five parts" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.series.slug, "load-growth-in-five-parts");
    assert.equal(result.series.description, null);
  });

  it("needs a name", () => {
    const result = validateSeries({ description: "About load growth." });
    assert.equal(result.ok, false);
  });
});

describe("readingMinutes", () => {
  it("rounds to whole minutes at 200 words a minute", () => {
    assert.equal(readingMinutes("word ".repeat(200)), 1);
    assert.equal(readingMinutes("word ".repeat(1000)), 5);
  });

  it("never reports zero minutes for a piece that has words", () => {
    assert.equal(readingMinutes("Three short words."), 1);
  });

  it("reports nothing for nothing", () => {
    assert.equal(readingMinutes(""), 0);
    assert.equal(readingMinutes(null), 0);
  });
});

describe("articleParagraphs", () => {
  it("splits on blank lines and drops the empties", () => {
    assert.deepEqual(articleParagraphs("One.\n\nTwo.\n\n\nThree."), ["One.", "Two.", "Three."]);
  });

  it("returns nothing for an empty body", () => {
    assert.deepEqual(articleParagraphs(null), []);
  });
});

describe("articleMeta", () => {
  it("gives a written piece its reading time", () => {
    assert.equal(articleMeta({ kind: "written", body: "word ".repeat(400) }), "Written, 2 minute read");
  });

  it("says nothing about the length of a video, because that lives off-site", () => {
    // The accepted cost of embedding rather than hosting, per build plan
    // section 2. Better said by omission than by a guess.
    assert.equal(articleMeta({ kind: "video" }), "Video");
  });

  it("labels audio without inventing a duration", () => {
    assert.equal(articleMeta({ kind: "audio", media_bytes: 4000000 }), "Audio");
  });
});

describe("readerCount", () => {
  it("counts members, and never names them", () => {
    assert.equal(readerCount({ unique_readers: 0 }), "No readers yet");
    assert.equal(readerCount({ unique_readers: 1 }), "Read by 1 member");
    assert.equal(readerCount({ unique_readers: 14 }), "Read by 14 members");
  });

  it("survives a row with no counts on it", () => {
    assert.equal(readerCount({}), "No readers yet");
  });
});

describe("articleDate", () => {
  it("reads as a date rather than a timestamp", () => {
    assert.equal(articleDate("2026-08-13T09:15:00Z"), "13 August 2026");
  });

  it("returns nothing for a draft, which has no publication date", () => {
    assert.equal(articleDate(null), "");
    assert.equal(articleDate("not a date"), "");
  });
});

describe("articleMediaPath", () => {
  it("puts the site first and the member second, which is what 0022 keys on", () => {
    const path = articleMediaPath(SITE, MEMBER, "mp3");
    const parts = path.split("/");
    assert.equal(parts[0], SITE);
    assert.equal(parts[1], MEMBER);
    assert.equal(parts.length, 3);
    assert.ok(parts[2].endsWith(".mp3"));
  });

  it("does not let an extension escape the folder", () => {
    for (const ext of ["../../evil", "a/b", ".."]) {
      const path = articleMediaPath(SITE, MEMBER, ext);
      assert.equal(path.split("/").length, 3, `escaped with ${ext}`);
      assert.ok(!path.includes(".."), `walked up with ${ext}`);
    }
  });

  it("never produces the same path twice", () => {
    const seen = new Set(Array.from({ length: 200 }, () => articleMediaPath(SITE, MEMBER, "mp3")));
    assert.equal(seen.size, 200);
  });
});

describe("copy", () => {
  const strings = [
    ...Object.values(ARTICLE_COPY),
    ...ARTICLE_KIND_OPTIONS.flatMap((k) => [k.label, k.help]),
  ];

  it("uses no em dashes, per the house rule", () => {
    for (const text of strings) {
      assert.ok(!text.includes("—"), `em dash in "${text}"`);
    }
  });

  it("avoids the coordination language the build plan flags", () => {
    // Build plan section 3. This club's members are utilities under FERC and
    // state regulators, and these words read as coordination between
    // competitors in a way they do not in most industries.
    const flagged = /\b(collaborat|coordinat|align|agree to|standardiz)/i;
    for (const text of strings) {
      assert.ok(!flagged.test(text), `coordination language in "${text}"`);
    }
  });

  it("does not name the content area, which is still the club's to name", () => {
    // Build plan section 3 item 6, and status.md. "Library" is a description
    // rather than a name, and inventing one here would quietly close a question
    // that belongs to the club.
    assert.equal(ARTICLE_COPY.libraryTitle, "The library");
  });

  it("keeps the antitrust reminder to the safe side of the line", () => {
    // It says what is ordinary professional activity and does not attempt to
    // define what is not, because that is a question for the club's counsel.
    const reminder = ARTICLE_COPY.antitrustReminder.toLowerCase();
    assert.ok(reminder.includes("published results"));
    assert.ok(reminder.includes("forward-looking"));
  });
});
