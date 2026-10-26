import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { forgePrototype } from "@double-blaze/prototype-forge";
import {
  checkTeamName,
  cleanPlan,
  emptyPlan,
  progress,
  purposeHints,
  storyHints,
  storySentence,
  toProductPlan,
  toUserStories,
  userHints,
  type LaunchPlan,
} from "./plan.js";

const LOST: LaunchPlan = {
  productName: "Finders Keepers",
  idea: "A lost and found you can search from your phone, with a photo of everything turned in",
  community: "Our school",
  purpose:
    "Students lose jackets, water bottles and headphones every week, and most of it gets donated before anyone finds it. Because of Finders Keepers, kids get their stuff back and families stop buying the same things twice.",
  users: [
    { name: "Students", cares: "They want their stuff back fast without digging through a giant pile" },
    { name: "Front office staff", cares: "They want the pile gone and fewer people asking at the desk" },
    { name: "Parents", cares: "They do not want to buy a second jacket" },
  ],
  stories: [
    {
      feature: "Photo search",
      asA: "Student",
      iWant: "I want to look through photos of everything turned in",
      soThat: "find my jacket before it gets donated",
      criteria: ["Every item has a photo", "Newest items show first."],
    },
    { feature: "", asA: "Front office staff", iWant: "post a photo of a found item in under a minute", soThat: "the pile does not take over the office", criteria: [] },
    { feature: "Name alert", asA: "a parent", iWant: "get a message when something with my kid's name is turned in", soThat: "so I can stop buying replacements", criteria: [] },
  ],
};

describe("purpose coaching", () => {
  it("asks for an impact when the purpose only says what it does", () => {
    const hints = purposeHints("It is an app that shows the lunch menu every day for students");
    assert.ok(hints.some((h) => h.level === "nudge" && /impact/i.test(h.text)));
  });

  it("is happy with a purpose that says what changes", () => {
    const hints = purposeHints(LOST.purpose);
    assert.ok(hints.some((h) => h.level === "good"));
    assert.ok(!hints.some((h) => h.level === "nudge"));
  });

  it("asks for something when it is empty", () => {
    assert.equal(purposeHints("  ")[0].level, "todo");
  });
});

describe("user coaching", () => {
  it("says there is always more than one", () => {
    const hints = userHints([{ name: "Students", cares: "x" }]);
    assert.ok(hints.some((h) => /more than one/.test(h.text)));
  });

  it("asks about the adults when every user is a kid", () => {
    const hints = userHints([
      { name: "Students", cares: "a" },
      { name: "Athletes", cares: "b" },
    ]);
    assert.ok(hints.some((h) => /adult/i.test(h.text)));
  });

  it("names the user missing a sentence", () => {
    const hints = userHints([
      { name: "Students", cares: "a" },
      { name: "Teachers", cares: "" },
    ]);
    assert.ok(hints.some((h) => /Teachers/.test(h.text)));
  });
});

describe("story coaching", () => {
  it("says nothing about a story nobody has started", () => {
    assert.deepEqual(storyHints({ feature: "", asA: "", iWant: "", soThat: "", criteria: [] }, LOST.users), []);
  });

  it("asks for the so that", () => {
    const hints = storyHints({ feature: "", asA: "Students", iWant: "see photos", soThat: "", criteria: [] }, LOST.users);
    assert.ok(hints.some((h) => h.level === "todo" && /so I can/.test(h.text)));
  });

  it("notices a user who is not on the list", () => {
    const hints = storyHints({ feature: "", asA: "Custodians", iWant: "drop items off", soThat: "the halls stay clear", criteria: [] }, LOST.users);
    assert.ok(hints.some((h) => /Custodians/.test(h.text)));
  });

  it("calls a complete story a story", () => {
    const hints = storyHints(LOST.stories[0], LOST.users);
    assert.equal(hints[0].level, "good");
  });
});

describe("team names", () => {
  it("treats differently typed names as one team", () => {
    const a = checkTeamName("The Lions");
    const b = checkTeamName("  the   LIONS! ");
    assert.ok(a.ok && b.ok && a.key === b.key);
  });

  it("refuses the obvious", () => {
    assert.equal(checkTeamName("shit squad").ok, false);
    assert.equal(checkTeamName("!").ok, false);
  });
});

describe("cleaning", () => {
  it("survives garbage", () => {
    const p = cleanPlan({ users: "nope", stories: [null, 4, { asA: 7 }], purpose: ["x"] });
    assert.equal(p.purpose, "");
    assert.equal(p.users.length, 0);
    assert.equal(p.stories.length, 3);
    assert.equal(p.stories[2].asA, "");
  });

  it("keeps everything a real plan has", () => {
    assert.deepEqual(cleanPlan(JSON.parse(JSON.stringify(LOST))), LOST);
  });
});

describe("progress", () => {
  it("is done with a purpose, two users and three stories", () => {
    assert.equal(progress(emptyPlan()).done, false);
    assert.equal(progress(LOST).done, true);
    assert.equal(progress(LOST).criteria, 1);
  });
});

describe("the export", () => {
  it("writes the story the way the class was taught it", () => {
    assert.equal(
      storySentence(LOST.stories[0]),
      "As a student, I want to look through photos of everything turned in, so that I can find my jacket before it gets donated.",
    );
    assert.equal(
      storySentence(LOST.stories[1]),
      "As a front office staff, I want to post a photo of a found item in under a minute, so that the pile does not take over the office.",
    );
    assert.equal(
      storySentence(LOST.stories[2]),
      "As a parent, I want to get a message when something with my kid's name is turned in, so that I can stop buying replacements.",
    );
  });

  it("makes a group of users into one of them", () => {
    assert.match(storySentence({ ...LOST.stories[0], asA: "Kids" }), /^As a kid,/);
    assert.match(storySentence({ ...LOST.stories[0], asA: "Bus drivers" }), /^As a bus driver,/);
    assert.match(storySentence({ ...LOST.stories[0], asA: "Front office staff" }), /^As a front office staff,/);
  });

  it("becomes a prototype with every story on a feature screen", () => {
    const { brief, stories, app } = forgePrototype({
      planMarkdown: toProductPlan(LOST, "The Lions", 3),
      storiesMarkdown: toUserStories(LOST, "The Lions"),
    });
    assert.equal(brief.productName, "Finders Keepers");
    assert.equal(brief.teamName, "The Lions");
    assert.equal(brief.users.length, 3);
    assert.equal(brief.features.length, 3);
    assert.equal(stories.length, 3);
    assert.ok(stories.every((s) => s.soThat), "every so that survives the trip");
    assert.ok(app.screens.length >= 3);
  });

  it("lists a feature two stories share once, and puts both stories on its screen", () => {
    const plan: LaunchPlan = {
      ...LOST,
      productName: "find your way",
      purpose: "some new kids get lost",
      users: [{ name: "new student", cares: "get to class" }, { name: "teachers", cares: "kids on time" }],
      stories: [
        { feature: "school navigation", asA: "new student", iWant: "be able to find my class", soThat: "not be late", criteria: [] },
        { feature: "School Navigation", asA: "teachers", iWant: "have students on time", soThat: "start class", criteria: [] },
      ],
    };
    const md = toProductPlan(plan, "Da purples", 3);
    assert.equal(md.match(/School navigation:/gi)?.length, 1);
    assert.match(md, /^# Find your way$/m);
    assert.match(md, /^Some new kids get lost\.$/m);
    assert.match(md, /\*\*New student:\*\*/);
    assert.match(md, /A new student can find their class\./);
    const { brief, stories } = forgePrototype({ planMarkdown: md, storiesMarkdown: toUserStories(plan, "Da purples") });
    assert.equal(brief.features.length, 1);
    assert.equal(stories.length, 2);
  });

  it("still exports a half finished plan", () => {
    const md = toProductPlan(emptyPlan(), "Team Rocket");
    assert.match(md, /# Team Rocket's idea/);
    assert.match(md, /## Purpose/);
    assert.doesNotThrow(() => forgePrototype({ planMarkdown: md, storiesMarkdown: toUserStories(emptyPlan(), "Team Rocket") }));
  });
});
