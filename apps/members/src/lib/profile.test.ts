import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PHOTO_MAX_BYTES,
  PROFILE_FIELDS,
  checkPhoto,
  cleanProfile,
  mediaPath,
  prefillFromJoinAnswers,
  profileCompleteness,
  profileHeadline,
  profileLinks,
} from "./profile.js";

const SITE = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const MEMBER = "9c858901-8a57-4791-81fe-4c455b099bc9";

describe("cleanProfile", () => {
  it("keeps the fields it knows", () => {
    const profile = cleanProfile({
      employer: "Cascade Power Authority",
      title: "Director of Grid Planning",
      career: "Twenty years in transmission planning.",
    });
    assert.equal(profile.employer, "Cascade Power Authority");
    assert.equal(profile.career, "Twenty years in transmission planning.");
  });

  it("drops keys that are not profile fields", () => {
    // The profile column is jsonb, so without this a member could write
    // anything they liked into their own row.
    const profile = cleanProfile({ employer: "Cascade", role: "admin", status: "active" });
    assert.deepEqual(Object.keys(profile), ["employer"]);
  });

  it("never lets the caller set photo_path", () => {
    // Only the upload route knows where the bytes actually went.
    const profile = cleanProfile({ photo_path: "someone/elses/photo.jpg" });
    assert.equal(profile.photo_path, undefined);
  });

  it("carries an existing photo through an edit of the text fields", () => {
    const profile = cleanProfile({ employer: "Cascade" }, { photo_path: `${SITE}/${MEMBER}/a.jpg` });
    assert.equal(profile.photo_path, `${SITE}/${MEMBER}/a.jpg`);
  });

  it("truncates rather than refusing, since nothing here is load bearing", () => {
    const field = PROFILE_FIELDS.find((f) => f.key === "career");
    const profile = cleanProfile({ career: "x".repeat(5000) });
    assert.equal(profile.career?.length, field?.maxLength);
  });

  it("leaves an empty field out rather than storing an empty string", () => {
    const profile = cleanProfile({ employer: "   ", career: "" });
    assert.deepEqual(profile, {});
  });

  it("collapses whitespace on one-line fields and keeps paragraphs on the rest", () => {
    const profile = cleanProfile({
      employer: "  Cascade   Power  ",
      career: "First.\n\n\n\nSecond.",
    });
    assert.equal(profile.employer, "Cascade Power");
    assert.equal(profile.career, "First.\n\nSecond.");
  });

  it("survives a malformed body", () => {
    for (const input of [null, undefined, "profile", 7, []]) {
      assert.deepEqual(cleanProfile(input), {});
    }
  });

  it("ignores non-string values instead of coercing them", () => {
    const profile = cleanProfile({ employer: { name: "Cascade" }, title: 42 });
    assert.deepEqual(profile, {});
  });
});

describe("prefillFromJoinAnswers", () => {
  it("carries employer and role across from the questionnaire", () => {
    const profile = prefillFromJoinAnswers({
      employer: "Cascade Power Authority",
      role_title: "Director of Grid Planning",
      industry: "grid",
    });
    assert.equal(profile.employer, "Cascade Power Authority");
    assert.equal(profile.title, "Director of Grid Planning");
  });

  it("does not carry the industry answer, which is not a profile field", () => {
    const profile = prefillFromJoinAnswers({ industry: "grid" });
    assert.equal(profile.industry, undefined);
  });

  it("carries the free-text answer into interests when there was one", () => {
    const profile = prefillFromJoinAnswers({ interest: "Forecasting methods." });
    assert.equal(profile.interests, "Forecasting methods.");
  });

  it("gives an invited member, who answered nothing, an empty start", () => {
    assert.deepEqual(prefillFromJoinAnswers({}), {});
    assert.deepEqual(prefillFromJoinAnswers(null), {});
  });
});

describe("profileCompleteness", () => {
  it("counts an empty profile as nothing filled and not enough", () => {
    const result = profileCompleteness({});
    assert.equal(result.filled, 0);
    assert.equal(result.enough, false);
  });

  it("stops prompting once there is a career description", () => {
    assert.equal(profileCompleteness({ career: "Transmission planning." }).enough, true);
  });

  it("stops prompting once there is a photo", () => {
    assert.equal(profileCompleteness({ photo_path: "a/b/c.jpg" }).enough, true);
  });

  it("does not treat employer alone as enough, since it was prefilled", () => {
    // Employer arrives from the questionnaire without the member typing
    // anything, so counting it would silence the prompt for a profile nobody
    // has actually written.
    assert.equal(profileCompleteness({ employer: "Cascade" }).enough, false);
  });

  it("survives null", () => {
    assert.equal(profileCompleteness(null).enough, false);
  });
});

describe("profileHeadline", () => {
  it("reads as title then employer", () => {
    assert.equal(
      profileHeadline({ title: "Director of Grid Planning", employer: "Cascade" }),
      "Director of Grid Planning, Cascade",
    );
  });

  it("drops the missing half rather than leaving a stray comma", () => {
    assert.equal(profileHeadline({ employer: "Cascade" }), "Cascade");
    assert.equal(profileHeadline({ title: "Analyst" }), "Analyst");
    assert.equal(profileHeadline({}), "");
    assert.equal(profileHeadline(null), "");
  });
});

describe("profileLinks", () => {
  it("turns a URL into a link and leaves prose alone", () => {
    const links = profileLinks("https://example.test/dana\nAsk me on LinkedIn");
    assert.equal(links[0].href, "https://example.test/dana");
    assert.equal(links[1].href, null);
    assert.equal(links[1].text, "Ask me on LinkedIn");
  });

  it("refuses a scheme that can execute", () => {
    const links = profileLinks("javascript:alert(1)\ndata:text/html,<script>");
    assert.equal(links[0].href, null);
    assert.equal(links[1].href, null);
  });

  it("caps how many it will render", () => {
    const links = profileLinks(Array.from({ length: 50 }, (_, i) => `https://a.test/${i}`).join("\n"));
    assert.equal(links.length, 10);
  });

  it("returns nothing for an empty field", () => {
    assert.deepEqual(profileLinks(undefined), []);
    assert.deepEqual(profileLinks(""), []);
  });
});

describe("checkPhoto", () => {
  it("accepts the formats a browser can display", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      assert.equal(checkPhoto({ type, size: 1000 }), null);
    }
  });

  it("refuses anything else, including things a browser would run", () => {
    for (const type of ["image/svg+xml", "text/html", "application/pdf", "audio/mpeg", ""]) {
      assert.ok(checkPhoto({ type, size: 1000 }), `accepted ${type}`);
    }
  });

  it("refuses one that is too large", () => {
    assert.ok(checkPhoto({ type: "image/png", size: PHOTO_MAX_BYTES + 1 }));
    assert.equal(checkPhoto({ type: "image/png", size: PHOTO_MAX_BYTES }), null);
  });

  it("refuses an empty file", () => {
    assert.ok(checkPhoto({ type: "image/png", size: 0 }));
  });
});

describe("mediaPath", () => {
  it("puts the site first and the member second, which is what the policies key on", () => {
    const path = mediaPath(SITE, MEMBER, "jpg");
    const parts = path.split("/");
    assert.equal(parts[0], SITE);
    assert.equal(parts[1], MEMBER);
    assert.equal(parts.length, 3);
    assert.ok(parts[2].endsWith(".jpg"));
  });

  it("never produces the same path twice", () => {
    const seen = new Set(Array.from({ length: 200 }, () => mediaPath(SITE, MEMBER, "jpg")));
    assert.equal(seen.size, 200);
  });

  it("does not let an extension escape the folder", () => {
    // The path is the security model, so a caller-supplied extension must not
    // be able to add a segment or walk upward out of the member's prefix.
    for (const ext of ["../../evil", "a/b", "jp g", ".."]) {
      const path = mediaPath(SITE, MEMBER, ext);
      assert.equal(path.split("/").length, 3, `escaped with ${ext}`);
      assert.ok(!path.includes(".."), `walked up with ${ext}`);
    }
  });

  it("falls back to a safe extension when given nothing usable", () => {
    assert.ok(mediaPath(SITE, MEMBER, "!!!").endsWith(".bin"));
  });
});
