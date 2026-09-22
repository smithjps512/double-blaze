/**
 * Trail Crew: project status presentation.
 *
 * Builds two decks from one set of slides:
 *
 *   Team-Status-Presentation-Template.pptx   blanks in square brackets, with
 *                                            coaching in the speaker notes
 *   Bus-Buddy-Status-Presentation.pptx       the same deck filled in for the
 *                                            sample team, as a worked example
 *
 * The shape of the deck is the one a development team uses to report to
 * management: the problem, the users, what is being built, where it stands,
 * a demo, what went well, what is in the way, what happens next, and what the
 * team needs. Every Bus Buddy fact comes from docs/students/sample-bus-buddy
 * and the prototype generated from it. Nothing was estimated.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node status-presentation.js
 *
 * No em dashes anywhere in this file or the decks it generates.
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031";
const ORANGE = "CF4420";
const DEEP = "4A0025";
const STONE = "F6F4F1";
const WHITE = "FFFFFF";
const INK = "1C1A19";
const MUTED = "75787B";
const GREEN = "2E4A3B";
const LINE = "E4DED6";
const ROSE = "E9C9D6";

const H = "Cambria";
const B = "Calibri";

const W = 13.333;
const M = 0.7;
const CW = W - M * 2;

/* ================================================================ content */

/**
 * The template. Every bracketed value is a blank a team fills in. Notes are
 * written to the student presenting, not to the audience.
 */
const TEMPLATE = {
  file: "Team-Status-Presentation-Template.pptx",
  title: "Team status presentation template",
  isTemplate: true,

  product: "[Product name]",
  team: "[Team name]",
  period: "[Period]",
  date: "[Date of the presentation]",
  tagline: "[One sentence: what your app does and for whom.]",

  problem:
    "[Two or three sentences from the Purpose section of your product plan. What goes wrong today, who it happens to, and what your app changes about that.]",
  oneLiner: "[Product] tells [who] [what] so that [what changes for them].",

  users: [
    ["[User 1]", "[What they want, in their words. One or two sentences.]", "[N] stories"],
    ["[User 2]", "[What they want, in their words. One or two sentences.]", "[N] stories"],
    ["[User 3]", "[What they want, in their words. One or two sentences.]", "[N] stories"],
    ["[User 4]", "[What they want, in their words. One or two sentences.]", "[N] stories"],
  ],

  features: [
    ["[Feature 1]", "[What it does, one line]", "[N]", "[Stage]"],
    ["[Feature 2]", "[What it does, one line]", "[N]", "[Stage]"],
    ["[Feature 3]", "[What it does, one line]", "[N]", "[Stage]"],
    ["[Feature 4]", "[What it does, one line]", "[N]", "[Stage]"],
    ["[Feature 5]", "[What it does, one line]", "[N]", "[Stage]"],
  ],
  featureNote:
    "Stage is one of: No story yet, Prototyped, Carded, Designed, Building, Done. Be honest. A feature is Done when every box on its build card is ticked.",

  // 0 = done, 1 = here, 2 = not yet
  chain: [
    ["Product plan", 0],
    ["User stories", 0],
    ["Build cards", 1],
    ["Architecture", 2],
    ["Design", 2],
    ["Build", 2],
  ],
  chainNote:
    "[Mark each step done, here, or not yet. Your gap guide (gaps.html) shows the same chain and is the source of truth. Copy it, do not improve it.]",
  nextThing: "[The one thing your gap guide names as next. Copy the sentence.]",

  stats: [
    ["[N]", "features", "in the plan"],
    ["[N]", "user stories", "with acceptance criteria"],
    ["[N]", "screens", "in the prototype"],
    ["[N] of [N]", "build cards", "ticked done"],
  ],
  statsNote:
    "[Every number here should be one you can point at: the prototype's How this was made screen, your board, or your gap guide.]",

  demoSteps: [
    ["[Step 1]", "[Which screen you open and what you tap. Name the user you are showing it as.]"],
    ["[Step 2]", "[What happens next. Say the story it comes from.]"],
    ["[Step 3]", "[The bad day: an empty state, a refused save, a missing story. Show one on purpose.]"],
    ["[Step 4]", "[Where it stops. The last thing that works and the first thing that does not.]"],
  ],
  demoLookFor: [
    "[One thing the audience should notice, in their words]",
    "[A second thing]",
    "[The thing that does not work yet, named before they see it]",
  ],
  demoUrl: "[doubleblaze.solutions/prototypes/<team-folder>/ or your Anvil app link]",
  demoBackup: "[Backup: screenshots in a second file, or the prototype on a phone]",

  wentWell: [
    ["[Something that worked]", "[Why it worked, in one sentence. Give a name if one person did it.]"],
    ["[Something that worked]", "[Why it worked.]"],
    ["[Something that worked]", "[Why it worked.]"],
  ],
  learned: [
    ["[Something you did not know in September]", "[How you found out.]"],
    ["[Something you would do differently]", "[What you would do instead.]"],
    ["[Something about your users]", "[Where it came from: the plan, a test, a conversation.]"],
  ],

  blockers: [
    ["[What is in the way]", "[Why it stops the next step]", "[What you are doing about it, and who]"],
    ["[What is in the way]", "[Why it stops the next step]", "[What you are doing about it, and who]"],
    ["[What is in the way]", "[Why it stops the next step]", "[What you are doing about it, and who]"],
  ],
  blockersNote:
    "[Your gap guide's In the way right now list goes here first. Then anything it cannot see: a person out sick, a tool you cannot get into, a disagreement.]",

  nextSteps: [
    ["[Next step 1, the one that has to happen first]", "[Who]", "[By when]"],
    ["[Next step 2]", "[Who]", "[By when]"],
    ["[Next step 3]", "[Who]", "[By when]"],
  ],

  asks: [
    ["[What you need]", "[From whom, and what happens if you get it]"],
    ["[A decision you need made]", "[The two options, and which one you recommend]"],
    ["[Time or a tool you need]", "[How much, and when]"],
  ],

  links: [
    ["Prototype", "[doubleblaze.solutions/prototypes/<team-folder>/]"],
    ["Gap guide", "[.../gaps.html]"],
    ["Test plan", "[.../test-plan.html]"],
    ["Project board", "[doubleblaze.solutions/trail-crew/<team-folder>/board]"],
  ],
};

/**
 * Bus Buddy, filled in from the repository on 22 September 2026.
 * Stage: stories written, no build cards. Two gaps on the gap guide.
 */
const BUS_BUDDY = {
  file: "Bus-Buddy-Status-Presentation.pptx",
  title: "Bus Buddy: status update",
  isTemplate: false,

  product: "Bus Buddy",
  team: "Sample Team",
  period: "Demo team",
  date: "22 September 2026",
  tagline: "A phone app that shows students, parents, drivers and the front office where the school buses are and when they will arrive.",

  problem:
    "Students at our school wait outside for buses that are late, early, or already gone, and nobody tells them which. Parents call the front office to ask where the bus is, and the office cannot answer either.",
  oneLiner: "Bus Buddy tells everybody the same thing at the same time so nobody is standing in the rain guessing.",

  users: [
    ["Students", "How many minutes until my bus, and is it worth leaving class early. On a phone, in a hurry, will not read anything long.", "3 stories"],
    ["Parents", "Did my kid get on the bus, and when will it reach our neighborhood. Mostly they want to stop calling the school.", "1 story"],
    ["Bus drivers", "Report a delay once and have it reach everyone, instead of answering the same question forty times.", "1 story"],
    ["Front office", "See every route at once, so a phone call takes ten seconds instead of ten minutes.", "1 story"],
  ],

  features: [
    ["Bus tracker", "Countdown to your stop, and where the bus is right now", "2", "Prototyped"],
    ["Delay alerts", "Driver reports a delay; every rider on the route sees the reason and new time", "2", "Prototyped"],
    ["My stop setup", "Pick your bus number and stop once; the app remembers", "1", "Prototyped"],
    ["Route board", "One screen for the front office with every route and its status", "1", "Prototyped"],
    ["Ride history", "Which buses a student rode and when", "0", "No story yet"],
  ],
  featureNote:
    "Prototyped means the screen exists in the generated prototype and can be clicked. Nothing is built in Anvil yet. Ride history has an empty screen because nobody has written its story.",

  chain: [
    ["Product plan", 0],
    ["User stories", 0],
    ["Build cards", 1],
    ["Architecture", 2],
    ["Design", 2],
    ["Build", 2],
  ],
  chainNote:
    "Copied from our gap guide. Each step reads the one before it, which is why we cannot start the architecture until the cards exist.",
  nextThing: "You have stories but no build cards. Sit down with your teacher and turn each story into a card.",

  stats: [
    ["5", "features", "in the plan"],
    ["6", "user stories", "all with acceptance criteria"],
    ["8", "screens", "in the prototype, from 7 scenarios"],
    ["0 of 6", "build cards", "written so far"],
  ],
  statsNote:
    "From the How this was made screen in the prototype and the gap guide. Six stories with criteria is why every screen in the demo is clickable.",

  demoSteps: [
    ["First morning", "Open the prototype as a student. My stop setup: enter a bus number, pick a stop from the list. The app remembers it and goes to the tracker."],
    ["The countdown", "Bus tracker shows minutes until the bus reaches our stop, and where it is on the route. This is story S1, the first one we wrote."],
    ["A delay", "Switch to the bus driver. Report a delay, choose a reason. Switch back to the student: the new time and the reason are on the home screen."],
    ["Where it stops", "Route board, as front office. Then Ride history: an empty screen that says it is waiting on a user story. That is true, and it is our next gap."],
  ],
  demoLookFor: [
    "Every screen names the sentence it came from",
    "The driver's two taps reach the student without the driver doing anything else",
    "The Ride history screen is empty on purpose, not by accident",
  ],
  demoUrl: "doubleblaze.solutions/prototypes/sample-bus-buddy/",
  demoBackup: "Backup: the same prototype opens from a thumb drive with no internet",

  wentWell: [
    ["Four users, not one", "Writing the driver and the front office as users gave us two features we would not have thought of from the student's side."],
    ["Given, When, Then on every story", "Seven scenarios, so the generator had something to click on for every feature that has a story."],
    ["The purpose is one paragraph", "Everyone on the team can say what the app is for without looking. That has stopped three arguments already."],
  ],
  learned: [
    ["No story means an empty screen", "Ride history looked finished in the plan. In the prototype it is a blank page that names what is missing."],
    ["A story needs its so that", "The route board story has no so that. The screen works, but nobody can say why it matters or test whether it does."],
    ["We know the front office least", "One story, no so that. We should ask the front office what a phone call actually sounds like."],
  ],

  blockers: [
    ["Ride history has no user story", "Its screen is empty and it cannot get a build card", "Decide: write the story, or cut the feature. See the ask."],
    ["Route board story has no so that", "Nobody can test whether the board does its job", "Rewrite it in the story studio this week. Owner: Sample Team."],
    ["No build cards yet", "Architecture, design and build all read the cards", "Card session with the teacher. Needs 20 minutes and all four of us."],
  ],
  blockersNote:
    "The first three lines are our gap guide, in its order. It says to fix one at a time, and that some of the others disappear when the first is fixed.",

  nextSteps: [
    ["Card session: turn the six stories into build cards", "Whole team, with the teacher", "This week"],
    ["Rewrite the route board story with a so that, in the story studio", "Sample Team", "Before the card session"],
    ["Ride history: write its story or take it out of the plan", "Sample Team, after the decision", "Next week"],
  ],

  asks: [
    ["20 minutes with the teacher", "For the card session. It unblocks architecture, design and build, which is everything after it."],
    ["A decision on Ride history", "Keep it and write the story, or cut it. We recommend cutting it for now: none of our four users asked for it."],
    ["Ten minutes with the front office", "So the route board story has a real so that, from the person who actually answers the phone."],
  ],

  links: [
    ["Prototype", "doubleblaze.solutions/prototypes/sample-bus-buddy/"],
    ["Gap guide", "doubleblaze.solutions/prototypes/sample-bus-buddy/gaps.html"],
    ["Test plan", "doubleblaze.solutions/prototypes/sample-bus-buddy/test-plan.html"],
    ["Project board", "doubleblaze.solutions/trail-crew/sample-bus-buddy/board"],
  ],
};

/* ================================================================ builder */

function build(d) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Double Blaze";
  pres.title = d.title;

  /* ---------------------------------------------------------- helpers */

  function content(title, kicker) {
    const s = pres.addSlide();
    s.background = { color: STONE };
    if (kicker) {
      s.addText(kicker.toUpperCase(), {
        x: M, y: 0.42, w: CW, h: 0.28,
        fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2,
        isTextBox: true, margin: 0,
      });
    }
    s.addText(title, {
      x: M, y: kicker ? 0.72 : 0.55, w: CW, h: 0.85,
      fontFace: H, fontSize: 34, bold: true, color: MAROON,
      isTextBox: true, margin: 0, valign: "top",
    });
    return s;
  }

  function dark(color = MAROON) {
    const s = pres.addSlide();
    s.background = { color };
    return s;
  }

  function card(s, { x, y, w, h, fill = WHITE }) {
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w, h, rectRadius: 0.09,
      fill: { color: fill },
      line: { color: LINE, width: 1 },
      shadow: { type: "outer", angle: 90, blur: 8, offset: 1, opacity: 0.08, color: "000000" },
    });
  }

  function numberDot(s, n, x, y, { size = 0.46, fill = ORANGE, color = WHITE } = {}) {
    s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color: fill }, line: { width: 0 } });
    s.addText(String(n), {
      x, y, w: size, h: size,
      fontFace: B, fontSize: 15, bold: true, color,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
  }

  function pill(s, label, x, y, w, { fill = ORANGE, color = WHITE } = {}) {
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w, h: 0.34, rectRadius: 0.17, fill: { color: fill }, line: { width: 0 },
    });
    s.addText(label, {
      x, y, w, h: 0.34,
      fontFace: B, fontSize: 11.5, bold: true, color,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
  }

  function grid(n, gap = 0.36) {
    const w = (CW - gap * (n - 1)) / n;
    return { w, gap, x: (i) => M + i * (w + gap) };
  }

  function body(s, text, opts) {
    s.addText(text, {
      fontFace: B, fontSize: 15, color: INK, lineSpacing: 22,
      isTextBox: true, margin: 0, valign: "top", ...opts,
    });
  }

  function footer(s, text) {
    s.addText(text, {
      x: M, y: 6.85, w: CW, h: 0.3,
      fontFace: B, fontSize: 11, color: MUTED, isTextBox: true, margin: 0,
    });
  }

  const T = d.isTemplate;

  /* ------------------------------------------------ 0 read me (template) */
  if (T) {
    const s = content("Read this, then delete this slide", "How to use this template");
    const rules = [
      ["Fill every bracket", "Anything in [square brackets] is a blank. Your product plan, user stories, gap guide and prototype have every answer. Copy from them, do not improve on them."],
      ["Keep it to eight minutes", "One minute on the problem and users, two on where you are, three on the demo, one on what is in the way and what is next, one for questions. The agenda slide has the times."],
      ["Tell the truth about status", "Management can cope with a red row. They cannot cope with a green row that turns out to be red. If your gap guide says not yet, your slide says not yet."],
      ["Rehearse the demo twice", "Once with the person driving, once with somebody else driving. Decide who talks and who taps. Have a backup that needs no internet."],
      ["Everybody speaks", "Split the slides between the whole team. The person who wrote a story presents its screen."],
      ["Use the notes", "Every slide has speaker notes written to you. They say what to say and what to leave out. Read them before you present, then delete them."],
    ];
    const { w: cw, x: colX } = grid(2, 0.4);
    rules.forEach(([title, text], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = colX(col), y = 1.85 + row * 1.7;
      card(s, { x, y, w: cw, h: 1.52 });
      numberDot(s, i + 1, x + 0.3, y + 0.28, { size: 0.42 });
      s.addText(title, {
        x: x + 0.9, y: y + 0.22, w: cw - 1.2, h: 0.4,
        fontFace: H, fontSize: 17, bold: true, color: MAROON, isTextBox: true, margin: 0,
      });
      s.addText(text, {
        x: x + 0.9, y: y + 0.6, w: cw - 1.2, h: 0.85,
        fontFace: B, fontSize: 11.5, color: INK, lineSpacing: 15, isTextBox: true, margin: 0, valign: "top",
      });
    });
    s.addNotes(
      "This slide is for the team, not the audience. Delete it once the rest of the deck is filled in.\n\n" +
        "The deck is the shape a real development team uses to report to the people who fund them: what problem, for whom, what we are building, where it stands, show it working, what went well, what is in the way, what happens next, what we need. Fifteen slides, eight minutes.",
    );
  }

  /* ------------------------------------------------------------ 1 title */
  {
    const s = dark(MAROON);
    s.addShape(pres.ShapeType.ellipse, {
      x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 },
    });
    s.addShape(pres.ShapeType.ellipse, {
      x: 11.4, y: 4.3, w: 3.4, h: 3.4, fill: { color: ORANGE }, line: { width: 0 }, transparency: 70,
    });
    s.addText("TRAIL CREW  ·  PROJECT STATUS", {
      x: M, y: 1.7, w: 8.4, h: 0.34,
      fontFace: B, fontSize: 13, bold: true, color: ROSE, charSpacing: 3,
      isTextBox: true, margin: 0,
    });
    s.addText(d.product, {
      x: M, y: 2.1, w: 8.8, h: 1.4,
      fontFace: H, fontSize: 54, bold: true, color: WHITE,
      isTextBox: true, margin: 0, valign: "middle",
    });
    s.addText(d.tagline, {
      x: M, y: 3.55, w: 8.2, h: 1.1,
      fontFace: B, fontSize: 17, color: "EBD9E1", lineSpacing: 25, isTextBox: true, margin: 0, valign: "top",
    });
    s.addText(`${d.team}  ·  ${d.period}  ·  ${d.date}`, {
      x: M, y: 5.0, w: 8.4, h: 0.4,
      fontFace: B, fontSize: 14, bold: true, color: WHITE, isTextBox: true, margin: 0,
    });
    s.addText("Status update for management. About eight minutes, with a demo.", {
      x: M, y: 5.45, w: 8.4, h: 0.4,
      fontFace: B, fontSize: 12.5, color: ROSE, isTextBox: true, margin: 0,
    });
    s.addNotes(
      T
        ? "Say your product name, your team, and the one sentence. Then move on. Nobody needs the history of the team on the title slide.\n\nThe tagline is the sentence from your product description that says what the app does and for whom. If you cannot say it in one breath, it is too long."
        : "Good morning. We are Sample Team and this is Bus Buddy, a phone app that shows where the school buses are and when they will arrive. We are going to show you where we have got to, what works, what is in the way, and what we need from you. About eight minutes.",
    );
  }

  /* ------------------------------------------------------------ 2 agenda */
  {
    const s = content("What we will cover", "Eight minutes");
    const items = [
      ["The problem, and who has it", "1 min"],
      ["What we are building, and where it stands", "2 min"],
      ["Demo", "3 min"],
      ["What went well, what we learned", "1 min"],
      ["What is in the way, what is next, what we need", "1 min"],
      ["Your questions", "open"],
    ];
    const { w: cw, x: colX } = grid(2, 0.4);
    items.forEach(([label, mins], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = colX(col), y = 1.95 + row * 1.15;
      card(s, { x, y, w: cw, h: 0.95 });
      numberDot(s, i + 1, x + 0.28, y + 0.245);
      s.addText(label, {
        x: x + 0.95, y, w: cw - 2.2, h: 0.95,
        fontFace: B, fontSize: 15.5, bold: true, color: INK, valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(mins, {
        x: x + cw - 1.2, y, w: 0.95, h: 0.95,
        fontFace: H, fontSize: 15, bold: true, color: ORANGE, align: "right", valign: "middle", isTextBox: true, margin: 0,
      });
    });
    body(s, "The demo is the middle of the presentation, not the end, so there is time to talk about what it showed.", {
      x: M, y: 5.6, w: CW, h: 0.6, fontSize: 15, color: MUTED,
    });
    s.addNotes(
      T
        ? "Read the six lines, with the times. That is all. It tells the audience when the demo is coming and that you have a plan for the time.\n\nIf your teacher gives you a different time limit, change the minutes on this slide and keep the same proportions: the demo gets about a third."
        : "Here is the shape of the next eight minutes. One minute on the problem and the four kinds of people who have it. Two on the five features and where each one stands. Three on the demo, which is the clickable prototype. Then a minute on what went well and what we learned, a minute on what is in the way and what we need, and your questions.",
    );
  }

  /* ---------------------------------------------------------- 3 problem */
  {
    const s = content("The problem", "Why this exists");
    s.addText(d.problem, {
      x: M, y: 1.95, w: 7.0, h: 2.6,
      fontFace: H, fontSize: 22, color: INK, lineSpacing: 32, isTextBox: true, margin: 0, valign: "top",
    });
    const cx = M + 7.5, cw = CW - 7.5;
    card(s, { x: cx, y: 1.95, w: cw, h: 3.0, fill: MAROON });
    s.addText("IN ONE SENTENCE", {
      x: cx + 0.4, y: 2.25, w: cw - 0.8, h: 0.3,
      fontFace: B, fontSize: 11, bold: true, color: ROSE, charSpacing: 2, isTextBox: true, margin: 0,
    });
    s.addText(d.oneLiner, {
      x: cx + 0.4, y: 2.65, w: cw - 0.8, h: 2.1,
      fontFace: H, fontSize: 18, bold: true, color: WHITE, lineSpacing: 26, isTextBox: true, margin: 0, valign: "top",
    });
    body(s, T
      ? "[This is the Purpose section of your product plan, read aloud. It has not changed since September, and if it has, say so and say why.]"
      : "This is the Purpose paragraph from our product plan. It has not changed since we wrote it.", {
      x: M, y: 5.3, w: CW, h: 0.8, fontSize: 14, color: MUTED,
    });
    s.addNotes(
      T
        ? "Read the problem in your own words, not off the slide. Then say the one sentence on the right.\n\nManagement wants to know one thing here: is this a real problem that real people have. If you can name a specific person or a specific morning it happened, do that."
        : "Every one of us has stood outside in the rain not knowing whether the bus had already gone. Parents ring the front office and the office does not know either. Bus Buddy tells everybody the same thing at the same time. That is the whole idea, and everything we have built comes from that one paragraph.",
    );
  }

  /* ------------------------------------------------------------ 4 users */
  {
    const s = content("Who it is for", "The users");
    const { w: cw, x: colX } = grid(4, 0.3);
    d.users.forEach(([name, want, stories], i) => {
      const x = colX(i);
      card(s, { x, y: 1.95, w: cw, h: 3.7 });
      numberDot(s, i + 1, x + 0.3, 2.22, { fill: MAROON });
      s.addText(name, {
        x: x + 0.3, y: 2.85, w: cw - 0.6, h: 0.42,
        fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0,
      });
      s.addText(want, {
        x: x + 0.3, y: 3.3, w: cw - 0.6, h: 1.7,
        fontFace: B, fontSize: 12.5, color: INK, lineSpacing: 17, isTextBox: true, margin: 0, valign: "top",
      });
      s.addText(stories, {
        x: x + 0.3, y: 5.1, w: cw - 0.6, h: 0.35,
        fontFace: B, fontSize: 12, italic: true, color: ORANGE, isTextBox: true, margin: 0,
      });
    });
    body(s, T
      ? "[From the Who are the users section of your plan. The story count is on the prototype's Who this is for screen. A user with zero stories is a finding, not a mistake: say it.]"
      : "From our plan's Who are the users section. Three of the six stories are the student's. The other three users have one each.", {
      x: M, y: 5.95, w: CW, h: 0.7, fontSize: 14, color: MUTED,
    });
    s.addNotes(
      T
        ? "One sentence per user: who they are and what they want. Use the words from your plan.\n\nIf one user has far more stories than the others, say that out loud and say whether it is on purpose. It usually is not, and noticing it is worth more than hiding it."
        : "Four kinds of people, and they want different things. Students want the countdown. Parents want to know the kid got on. Drivers want to say it once. The front office wants every route on one screen. Three of our six stories are the student's, and the front office has one, which comes back later as something we learned.",
    );
  }

  /* --------------------------------------------------------- 5 features */
  {
    const s = content("What we are building", "The features, and where each one stands");
    const stageFill = (stage) => {
      const t = stage.toLowerCase();
      if (t.includes("done")) return GREEN;
      if (t.includes("no story")) return "9A3B24";
      if (t.includes("prototyp")) return MAROON;
      if (t.includes("[")) return MUTED;
      return ORANGE;
    };
    const rowH = 0.72, top = 1.95;
    // header row
    const cols = [
      ["Feature", M, 2.6],
      ["What it does", M + 2.75, 6.2],
      ["Stories", M + 9.15, 0.9],
      ["Stage", M + 10.2, 1.7],
    ];
    cols.forEach(([label, x, w]) => {
      s.addText(label.toUpperCase(), {
        x, y: top, w, h: 0.3,
        fontFace: B, fontSize: 10.5, bold: true, color: MUTED, charSpacing: 1.5, isTextBox: true, margin: 0,
      });
    });
    d.features.forEach(([name, what, n, stage], i) => {
      const y = top + 0.4 + i * (rowH + 0.1);
      card(s, { x: M, y, w: CW, h: rowH });
      s.addText(name, {
        x: M + 0.25, y, w: 2.4, h: rowH,
        fontFace: H, fontSize: 15, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(what, {
        x: M + 2.75, y, w: 6.2, h: rowH,
        fontFace: B, fontSize: 12.5, color: INK, valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(n, {
        x: M + 9.15, y, w: 0.9, h: rowH,
        fontFace: H, fontSize: 17, bold: true, color: INK, align: "center", valign: "middle", isTextBox: true, margin: 0,
      });
      pill(s, stage, M + 10.2, y + (rowH - 0.34) / 2, 1.5, { fill: stageFill(stage) });
    });
    body(s, d.featureNote, {
      x: M, y: top + 0.4 + d.features.length * (rowH + 0.1) + 0.15, w: CW, h: 0.8, fontSize: 13, color: MUTED,
    });
    s.addNotes(
      T
        ? "Go down the rows. Feature, one line, and its stage. Do not explain each feature in detail: the demo does that.\n\nThe stage column is the honest part. Prototyped means it exists in the generated prototype. Carded means it has a build card. Designed means the screen is in Figma with named layers. Building means somebody has typed it into Anvil. Done means every box on its card is ticked. No story yet means exactly that."
        : "Five features. Four have stories and are in the prototype, which is what we will demo. Ride history has no story, so its screen is empty and it cannot go any further until somebody writes one. Nothing is built in Anvil yet. We are at the build cards step, which is the next slide.",
    );
  }

  /* ------------------------------------------------------------ 6 chain */
  {
    const s = dark(MAROON);
    s.addText("Where we are", {
      x: M, y: 0.75, w: CW, h: 0.7,
      fontFace: H, fontSize: 34, bold: true, color: WHITE, isTextBox: true, margin: 0,
    });
    s.addText("Each step reads the one before it. Skipping one does not save time; it moves the work somewhere harder.", {
      x: M, y: 1.5, w: CW, h: 0.5, fontFace: B, fontSize: 15, color: ROSE, isTextBox: true, margin: 0,
    });
    const n = d.chain.length, gap = 0.26;
    const bw = (CW - gap * (n - 1)) / n;
    const state = [
      { fill: GREEN, line: GREEN, label: "done" },
      { fill: ORANGE, line: ORANGE, label: "you are here" },
      { fill: DEEP, line: "7A2049", label: "not yet" },
    ];
    d.chain.forEach(([label, st], i) => {
      const x = M + i * (bw + gap);
      const c = state[st];
      s.addShape(pres.ShapeType.roundRect, {
        x, y: 2.5, w: bw, h: 1.05, rectRadius: 0.1, fill: { color: c.fill }, line: { color: c.line, width: 1 },
      });
      s.addText(label, {
        x, y: 2.5, w: bw, h: 1.05,
        fontFace: B, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(c.label, {
        x, y: 3.62, w: bw, h: 0.3,
        fontFace: B, fontSize: 11.5, italic: true, color: st === 1 ? ORANGE : ROSE, align: "center", isTextBox: true, margin: 0,
      });
      if (i < n - 1) {
        s.addText("→", {
          x: x + bw, y: 2.5, w: gap, h: 1.05,
          fontFace: B, fontSize: 14, color: "C79AAF", align: "center", valign: "middle", isTextBox: true, margin: 0,
        });
      }
    });
    // the one next thing
    card(s, { x: M, y: 4.35, w: CW, h: 1.5, fill: WHITE });
    s.addText("THE NEXT THING", {
      x: M + 0.4, y: 4.55, w: 4, h: 0.3,
      fontFace: B, fontSize: 11, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
    });
    s.addText(d.nextThing, {
      x: M + 0.4, y: 4.88, w: CW - 0.8, h: 0.85,
      fontFace: H, fontSize: 18, bold: true, color: MAROON, lineSpacing: 24, isTextBox: true, margin: 0, valign: "top",
    });
    s.addText(d.chainNote, {
      x: M, y: 6.1, w: CW, h: 0.7,
      fontFace: B, fontSize: 12.5, color: ROSE, lineSpacing: 17, isTextBox: true, margin: 0,
    });
    s.addNotes(
      T
        ? "This is the slide management actually came for. Point at the orange box and say what it is. Then read the next thing.\n\nYour gap guide has this exact chain at the top with the same three states. Copy it. If you think the gap guide is wrong, the fix is in your documents, and you can say that too."
        : "Plan done, stories done. We are at build cards, and nothing after that has started. Our gap guide names one next thing: we have stories but no cards, and the fix is a session with the teacher turning each story into a card. That is also our first ask, later on.",
    );
  }

  /* ---------------------------------------------------------- 7 numbers */
  {
    const s = content("By the numbers", "Counted, not estimated");
    const { w: cw, x: colX } = grid(4, 0.35);
    d.stats.forEach(([n, label, note], i) => {
      const x = colX(i);
      card(s, { x, y: 2.1, w: cw, h: 2.7 });
      s.addText(n, {
        x, y: 2.3, w: cw, h: 1.15,
        fontFace: H, fontSize: n.length > 8 ? 32 : n.length > 4 ? 40 : 60, bold: true, color: MAROON,
        align: "center", valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(label, {
        x, y: 3.55, w: cw, h: 0.32,
        fontFace: B, fontSize: 15, bold: true, color: INK, align: "center", isTextBox: true, margin: 0,
      });
      s.addText(note, {
        x: x + 0.18, y: 3.92, w: cw - 0.36, h: 0.75,
        fontFace: B, fontSize: 12, color: "5A5F63", align: "center", lineSpacing: 16, isTextBox: true, margin: 0,
      });
    });
    body(s, d.statsNote, {
      x: M, y: 5.25, w: CW, h: 0.9, fontSize: 15, color: MUTED,
    });
    s.addNotes(
      T
        ? "Four numbers, read out. Each one has to be something you could show if somebody asked: the How this was made screen in your prototype, your board, or your gap guide.\n\nThe last tile is the one that changes week to week. Cards ticked done is the number management will ask about next time, so start reporting it now, even when it is zero."
        : "Five features. Six stories, every one with acceptance criteria, which is why the prototype has eight screens you can click through rather than pictures. Zero build cards out of six. That zero is the number we expect to be asked about next time.",
    );
  }

  /* ------------------------------------------------------------- 8 demo */
  {
    const s = content("What you are about to see", "Demo");
    const lw = 6.9;
    d.demoSteps.forEach(([title, text], i) => {
      const y = 1.95 + i * 1.05;
      numberDot(s, i + 1, M, y + 0.05, { size: 0.42 });
      s.addText(title, {
        x: M + 0.65, y, w: lw - 0.65, h: 0.35,
        fontFace: H, fontSize: 16, bold: true, color: MAROON, isTextBox: true, margin: 0,
      });
      s.addText(text, {
        x: M + 0.65, y: y + 0.36, w: lw - 0.65, h: 0.68,
        fontFace: B, fontSize: 12, color: INK, lineSpacing: 16, isTextBox: true, margin: 0, valign: "top",
      });
    });
    const cx = M + lw + 0.5, cw = CW - lw - 0.5;
    card(s, { x: cx, y: 1.95, w: cw, h: 3.05 });
    s.addText("LOOK FOR", {
      x: cx + 0.35, y: 2.2, w: cw - 0.7, h: 0.3,
      fontFace: B, fontSize: 11, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
    });
    s.addText(
      d.demoLookFor.map((t, i) => ({
        text: t,
        options: { bullet: true, breakLine: i < d.demoLookFor.length - 1, paraSpaceAfter: 8 },
      })),
      {
        x: cx + 0.35, y: 2.55, w: cw - 0.7, h: 2.35,
        fontFace: B, fontSize: 13, color: INK, lineSpacing: 18, isTextBox: true, margin: 0, valign: "top",
      },
    );
    card(s, { x: cx, y: 5.15, w: cw, h: 1.4, fill: MAROON });
    s.addText(d.demoUrl, {
      x: cx + 0.35, y: 5.27, w: cw - 0.7, h: 0.6,
      fontFace: B, fontSize: 11.5, bold: true, color: WHITE, lineSpacing: 15, valign: "top", isTextBox: true, margin: 0,
    });
    s.addText(d.demoBackup, {
      x: cx + 0.35, y: 5.92, w: cw - 0.7, h: 0.55,
      fontFace: B, fontSize: 10, color: ROSE, lineSpacing: 13, valign: "top", isTextBox: true, margin: 0,
    });
    footer(s, T
      ? "[Four steps, three minutes. Step three is always the bad day. Step four is always where it stops.]"
      : "Four steps, three minutes. One of us drives, one of us talks.");
    s.addNotes(
      T
        ? "Tell them what they are about to see before they see it, so they know what to look for and are not surprised by the part that does not work.\n\nThe four steps: start where a new user starts, show the main story, show the bad day on purpose (an empty state, a refused save, a missing story), and end at the exact point where the app stops working. Naming that point yourself is the most professional thing in the whole presentation.\n\nOne person drives, one person talks. Rehearse it twice, with a different driver each time."
        : "We are going to walk through the prototype as four different people. First morning as a student, setting up. The countdown. Then as the driver, reporting a delay, and back to the student to see it land. Then the route board, and finally Ride history, which is empty, on purpose, because it has no story. Watch for the sentence at the bottom of every screen: it is the story that screen came from.",
    );
  }

  /* ---------------------------------------------------- 9 demo divider */
  {
    const s = dark(DEEP);
    s.addShape(pres.ShapeType.ellipse, {
      x: -2.2, y: 3.6, w: 6.0, h: 6.0, fill: { color: MAROON }, line: { width: 0 },
    });
    s.addText("Demo", {
      x: M, y: 1.9, w: CW, h: 1.6,
      fontFace: H, fontSize: 80, bold: true, color: WHITE, isTextBox: true, margin: 0,
    });
    s.addText(d.demoUrl, {
      x: M, y: 3.6, w: CW, h: 0.5,
      fontFace: B, fontSize: 18, bold: true, color: ROSE, isTextBox: true, margin: 0,
    });
    s.addText(
      T
        ? "[Switch to the live app now. Come back to this deck when the demo ends.]"
        : "Switching to the prototype now. Back to the slides in three minutes.",
      { x: M, y: 4.2, w: 9, h: 0.5, fontFace: B, fontSize: 14, color: "C79AAF", isTextBox: true, margin: 0 },
    );
    s.addNotes(
      T
        ? "Leave this slide up while you switch windows, so the screen is not a desktop.\n\nIf the demo breaks: say so, in one sentence, and go to your backup. Do not debug in front of the audience. A broken demo handled calmly is fine. A broken demo with four people crowded round a laptop is not."
        : "Leave this up while we switch to the browser. If the internet is down, the same file is on the thumb drive and opens with no connection.",
    );
  }

  /* --------------------------------------------- 10 went well / learned */
  {
    const s = content("What went well, and what we learned", "Looking back");
    const { w: cw, x: colX } = grid(2, 0.5);
    const column = (title, items, col, fill) => {
      const x = colX(col);
      s.addText(title.toUpperCase(), {
        x, y: 1.95, w: cw, h: 0.3,
        fontFace: B, fontSize: 11, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
      });
      items.forEach(([head, text], i) => {
        const y = 2.35 + i * 1.5;
        card(s, { x, y, w: cw, h: 1.35 });
        numberDot(s, i + 1, x + 0.25, y + 0.22, { size: 0.38, fill });
        s.addText(head, {
          x: x + 0.8, y: y + 0.15, w: cw - 1.05, h: 0.58,
          fontFace: H, fontSize: 14, bold: true, color: MAROON, lineSpacing: 17,
          isTextBox: true, margin: 0, valign: "top",
        });
        s.addText(text, {
          x: x + 0.8, y: y + 0.74, w: cw - 1.05, h: 0.58,
          fontFace: B, fontSize: 11, color: INK, lineSpacing: 14.5, isTextBox: true, margin: 0, valign: "top",
        });
      });
    };
    column("What went well", d.wentWell, 0, GREEN);
    column("What we learned", d.learned, 1, ORANGE);
    s.addNotes(
      T
        ? "Three things that worked, three things you learned. Short. Give names: the person who wrote the story that made the demo work should be named.\n\nWhat you learned is the more interesting column. Something you did not know in September, something you would do differently, something about your users. Management trusts a team that can say what it got wrong."
        : "What went well: writing four users, not just the student, gave us two features we would never have thought of. Every story has Given, When, Then, which is why the prototype clicks. And the purpose is one paragraph everyone can say.\n\nWhat we learned: a feature with no story is an empty screen. A story with no so that cannot be tested. And the front office is the user we understand least, which is where our third ask comes from.",
    );
  }

  /* --------------------------------------------------------- 11 blockers */
  {
    const s = content("What is in the way", "Blockers, in the order they have to be fixed");
    const cols = [
      ["What is in the way", M, 3.5],
      ["Why it matters", M + 3.7, 3.7],
      ["What we are doing about it", M + 7.6, CW - 7.6],
    ];
    cols.forEach(([label, x, w]) => {
      s.addText(label.toUpperCase(), {
        x, y: 1.95, w, h: 0.3,
        fontFace: B, fontSize: 10.5, bold: true, color: MUTED, charSpacing: 1.5, isTextBox: true, margin: 0,
      });
    });
    const rowH = 1.05;
    d.blockers.forEach(([what, why, doing], i) => {
      const y = 2.35 + i * (rowH + 0.15);
      card(s, { x: M, y, w: CW, h: rowH });
      numberDot(s, i + 1, M + 0.22, y + (rowH - 0.38) / 2, { size: 0.38, fill: i === 0 ? ORANGE : MAROON });
      s.addText(what, {
        x: M + 0.75, y, w: 2.85, h: rowH,
        fontFace: H, fontSize: 14, bold: true, color: MAROON, valign: "middle", lineSpacing: 18, isTextBox: true, margin: 0,
      });
      s.addText(why, {
        x: M + 3.7, y, w: 3.7, h: rowH,
        fontFace: B, fontSize: 12, color: INK, valign: "middle", lineSpacing: 16, isTextBox: true, margin: 0,
      });
      s.addText(doing, {
        x: M + 7.6, y, w: CW - 7.85, h: rowH,
        fontFace: B, fontSize: 12, color: INK, valign: "middle", lineSpacing: 16, isTextBox: true, margin: 0,
      });
    });
    body(s, d.blockersNote, {
      x: M, y: 2.35 + d.blockers.length * (rowH + 0.15) + 0.1, w: CW, h: 0.8, fontSize: 13, color: MUTED,
    });
    s.addNotes(
      T
        ? "The first row is the one your gap guide names as next. Say that one properly. Say the others in one sentence each.\n\nEvery row has a third column. A blocker with nothing in the third column is a complaint. A blocker with a plan and a name in the third column is a status report. Management funds the second kind."
        : "Three things, in the order the gap guide puts them. Ride history has no story, so it is stuck: we need a decision on it. The route board story has no so that, so we are rewriting it this week. And there are no build cards, which is the one the gap guide says to do first, because everything after it reads the cards.",
    );
  }

  /* ------------------------------------------------------- 12 next steps */
  {
    const s = content("What happens next", "The next three things, in order");
    const cols = [
      ["Step", M + 0.75, 6.6],
      ["Who", M + 7.6, 2.6],
      ["By when", M + 10.4, CW - 10.4],
    ];
    cols.forEach(([label, x, w]) => {
      s.addText(label.toUpperCase(), {
        x, y: 1.95, w, h: 0.3,
        fontFace: B, fontSize: 10.5, bold: true, color: MUTED, charSpacing: 1.5, isTextBox: true, margin: 0,
      });
    });
    const rowH = 1.0;
    d.nextSteps.forEach(([step, who, when], i) => {
      const y = 2.35 + i * (rowH + 0.15);
      card(s, { x: M, y, w: CW, h: rowH, fill: i === 0 ? WHITE : STONE });
      numberDot(s, i + 1, M + 0.22, y + (rowH - 0.38) / 2, { size: 0.38, fill: i === 0 ? ORANGE : MAROON });
      s.addText(step, {
        x: M + 0.75, y, w: 6.6, h: rowH,
        fontFace: H, fontSize: 15, bold: i === 0, color: i === 0 ? MAROON : INK, valign: "middle", lineSpacing: 19, isTextBox: true, margin: 0,
      });
      s.addText(who, {
        x: M + 7.6, y, w: 2.6, h: rowH,
        fontFace: B, fontSize: 12.5, color: INK, valign: "middle", lineSpacing: 16, isTextBox: true, margin: 0,
      });
      s.addText(when, {
        x: M + 10.4, y, w: CW - 10.6, h: rowH,
        fontFace: B, fontSize: 12.5, bold: true, color: ORANGE, valign: "middle", isTextBox: true, margin: 0,
      });
    });
    body(s, T
      ? "[Three steps, not ten. The first one is the one the gap guide names. Every step has a person and a date, or it is a wish.]"
      : "Three steps, not ten. The first one unblocks the other two, and it is the one the gap guide named.", {
      x: M, y: 2.35 + d.nextSteps.length * (rowH + 0.15) + 0.15, w: CW, h: 0.7, fontSize: 14, color: MUTED,
    });
    s.addNotes(
      T
        ? "Three steps. The first is the one your gap guide names. Each has a name and a date. That is what makes it a plan rather than a hope.\n\nBy when should be something you will be asked about: this week, before the card session, by the next status update. Not soon."
        : "Three things. The card session first, this week, with the whole team and the teacher. Before that, we rewrite the route board story with a so that. And once Ride history is decided, we either write its story or take it out of the plan. Three steps, three dates, three names.",
    );
  }

  /* -------------------------------------------------------------- 13 ask */
  {
    const s = content("What we need from you", "The ask");
    const { w: cw, x: colX } = grid(3, 0.4);
    d.asks.forEach(([head, text], i) => {
      const x = colX(i);
      card(s, { x, y: 1.95, w: cw, h: 3.4 });
      numberDot(s, i + 1, x + 0.35, 2.25, { fill: ORANGE });
      s.addText(head, {
        x: x + 0.35, y: 2.9, w: cw - 0.7, h: 0.95,
        fontFace: H, fontSize: 18, bold: true, color: MAROON, lineSpacing: 23, isTextBox: true, margin: 0, valign: "top",
      });
      s.addText(text, {
        x: x + 0.35, y: 3.95, w: cw - 0.7, h: 1.3,
        fontFace: B, fontSize: 12.5, color: INK, lineSpacing: 17, isTextBox: true, margin: 0, valign: "top",
      });
    });
    body(s, T
      ? "[Three asks at most. Time, a decision, or a tool. Say what happens if you get it, and what happens if you do not.]"
      : "Three asks. The first unblocks everything. The second is a decision only a teacher can make. The third makes one story true.", {
      x: M, y: 5.65, w: CW, h: 0.7, fontSize: 14, color: MUTED,
    });
    s.addNotes(
      T
        ? "This is the slide that gets you something. Three asks at most: time with somebody, a decision, a tool or an account.\n\nFor a decision, give the options and say which one you recommend. Management would rather approve a recommendation than invent one. Do not ask for more time in general. Ask for a specific amount for a specific thing."
        : "We need three things. Twenty minutes with the teacher for the card session, which unblocks everything after it. A decision on Ride history: keep it and write the story, or cut it, and we recommend cutting it because none of our four users asked for it. And ten minutes with someone from the front office, so the route board story has a so that from the person who actually answers the phone.",
    );
  }

  /* ---------------------------------------------------------- 14 closing */
  {
    const s = dark(MAROON);
    s.addShape(pres.ShapeType.ellipse, {
      x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 },
    });
    s.addText("Questions", {
      x: M, y: 1.4, w: 8.5, h: 1.2,
      fontFace: H, fontSize: 54, bold: true, color: WHITE, isTextBox: true, margin: 0,
    });
    s.addText(`${d.product}  ·  ${d.team}`, {
      x: M, y: 2.65, w: 8.5, h: 0.4,
      fontFace: B, fontSize: 15, bold: true, color: ROSE, isTextBox: true, margin: 0,
    });
    d.links.forEach(([label, url], i) => {
      const y = 3.5 + i * 0.62;
      s.addText(label, {
        x: M, y, w: 1.9, h: 0.45,
        fontFace: B, fontSize: 13, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(url, {
        x: M + 1.9, y, w: 8.5, h: 0.45,
        fontFace: B, fontSize: 13, color: ROSE, valign: "middle", isTextBox: true, margin: 0,
      });
    });
    s.addText("Built in class with Double Blaze", {
      x: M, y: 6.6, w: 6, h: 0.35,
      fontFace: B, fontSize: 11, color: "C79AAF", isTextBox: true, margin: 0,
    });
    s.addNotes(
      T
        ? "Say thank you, and ask for questions. Then stop talking.\n\nIf you do not know an answer, say so and say who on the team would know or where you would look. That is a better answer than a guess. Write down every question you are asked: the ones you could not answer are the first slide of the next status update."
        : "That is Bus Buddy. Every link on this slide is live. Questions.",
    );
  }

  return pres.writeFile({ fileName: `${__dirname}/${d.file}` });
}

Promise.all([build(TEMPLATE), build(BUS_BUDDY)]).then((files) => {
  files.forEach((f) => console.log("wrote", f));
});
