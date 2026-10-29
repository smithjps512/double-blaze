/**
 * Find me v2: Pickle bombs keep building their app.
 *
 * The rest of 6th grade period 3 is in the Game Studio unit. Pickle bombs
 * asked to keep going with Find me, so this deck runs the same six weeks,
 * the same roles and the same build weekends, aimed at version 2 of their
 * app instead of a game. Everything it points at already exists: Launch Pad
 * (stories, checks, scenarios, Definition of Done, Level up, See my app),
 * their working app, and /play for QA. Speaker notes on every slide.
 * No em dashes anywhere in this deck.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node find-me-v2.js
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031";
const ORANGE = "CF4420";
const DEEP = "4A0025";
const STONE = "F6F4F1";
const WHITE = "FFFFFF";
const INK = "1C1A19";
const MUTED = "75787B";
const GREEN = "2E6B4A";
const PINK = "E9C9D6";

const H = "Cambria";
const B = "Calibri";

const LAUNCH = "doubleblaze.solutions/trail-crew/launch";
const APP = "doubleblaze.solutions/demo/p3-pickle-bombs/index.html";
const PLAY = "doubleblaze.solutions/play";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Double Blaze";
pres.title = "Find me v2: your app, your studio";

const W = 13.333;
const M = 0.7;
const CW = W - M * 2;

/* ---------------------------------------------------------------- helpers */

function content(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: STONE };
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.42, w: CW, h: 0.28,
      fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
    });
  }
  s.addText(title, {
    x: M, y: kicker ? 0.72 : 0.55, w: CW, h: 0.85,
    fontFace: H, fontSize: 34, bold: true, color: MAROON, isTextBox: true, margin: 0, valign: "top",
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
    line: { color: "E4DED6", width: 1 },
    shadow: { type: "outer", angle: 90, blur: 8, offset: 1, opacity: 0.08, color: "000000" },
  });
}

function numberDot(s, n, x, y, { size = 0.46, fill = ORANGE, color = WHITE, fontSize = 15 } = {}) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color: fill }, line: { width: 0 } });
  s.addText(String(n), {
    x, y, w: size, h: size,
    fontFace: B, fontSize, bold: true, color, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
}

function grid(n, gap = 0.36) {
  const w = (CW - gap * (n - 1)) / n;
  return { w, gap, x: (i) => M + i * (w + gap) };
}

function body(s, text, opts) {
  s.addText(text, {
    fontFace: B, fontSize: 15, color: INK, lineSpacing: 22, isTextBox: true, margin: 0, valign: "top", ...opts,
  });
}

/** A section divider with a big glyph in the circle. */
function divider(kicker, title, line, glyph, notes) {
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.9, y: 1.2, w: 5.2, h: 5.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addText(glyph, {
    x: 9.9, y: 1.2, w: 5.2, h: 5.2,
    fontFace: H, fontSize: 150, bold: true, color: ORANGE, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  s.addText(kicker, {
    x: M, y: 2.3, w: 8, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText(title, {
    x: M, y: 2.7, w: 8.8, h: 1.1, fontFace: H, fontSize: 50, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText(line, {
    x: M, y: 3.95, w: 8.6, h: 1.4, fontFace: B, fontSize: 24, color: "F3E3EA", lineSpacing: 32, isTextBox: true, margin: 0,
  });
  s.addNotes(notes);
  return s;
}


/** A big link box: the one thing to type. */
function linkBox(s, label, url, y, fill = ORANGE) {
  s.addShape(pres.ShapeType.roundRect, { x: M, y, w: CW, h: 0.8, rectRadius: 0.09, fill: { color: fill }, line: { width: 0 } });
  s.addText([
    { text: `${label}  `, options: { bold: true } },
    { text: url, options: { bold: true, fontFace: "Consolas" } },
  ], { x: M + 0.35, y, w: CW - 0.7, h: 0.8, fontFace: B, fontSize: 20, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
}

/* ------------------------------------------------------------------ 1 title */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.4, y: 4.3, w: 3.4, h: 3.4, fill: { color: ORANGE }, line: { width: 0 }, transparency: 70 });
  s.addText("PICKLE BOMBS  ·  SIX WEEKS", { x: M, y: 1.9, w: 8.4, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Find me, version 2.", { x: M, y: 2.32, w: 8.8, h: 1.2, fontFace: H, fontSize: 52, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  s.addText("Everyone else is building a game. You asked to keep building your app. Real product teams do exactly that: version 2 is where a product gets good.", {
    x: M, y: 3.75, w: 8.2, h: 1.4, fontFace: B, fontSize: 18, color: "EBD9E1", lineSpacing: 26, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Use this with the Pickle bombs team at their table while the class starts Game Studio, or show it to them first thing.\n\n" +
      "Say: you made a real choice. Most products are not built once, they are built again and again, and each version is better because of what people said about the last one. That is your job for six weeks.\n\n" +
      "Same calendar as the rest of the class, same roles, same build weekends, same launch day. You are a studio too; your product is an app.",
  );
}

/* ------------------------------------------------------------ 2 where it is */
{
  const s = content("Where Find me is today", "Version 1");
  const { w: cw, x: colX } = grid(3, 0.34);
  const cols = [
    ["What it does", "12 pets who speak for themselves, a match quiz, and shelters whose overcrowding meter drops when a pet is adopted."],
    ["What testers said", "4 “Love it” reports on /play. One said: “I can find the pet that fits my house and life best.”"],
    ["What it is missing", "Your 3 stories have no checks and no scenarios yet. None of them meets the Definition of Done."],
  ];
  cols.forEach(([title, text], i) => {
    const x = colX(i);
    card(s, { x, y: 1.95, w: cw, h: 3.0, fill: i === 2 ? "FBEDE8" : WHITE });
    s.addText(title, { x: x + 0.3, y: 2.15, w: cw - 0.6, h: 0.5, fontFace: H, fontSize: 21, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(text, { x: x + 0.3, y: 2.75, w: cw - 0.6, h: 2.1, fontFace: B, fontSize: 16, color: INK, lineSpacing: 23, isTextBox: true, margin: 0 });
  });
  body(s, "Love is great. But nobody has found a bug yet, because nobody has written down what “working” means. That is version 2's first job.", { x: M, y: 5.3, w: CW, h: 0.9, fontSize: 18, bold: true });
  s.addNotes(
    "The QA reports are real, from /play. Two of the four came from Pickle bombs about their own app, which is fine for a first try, but next time get them from other teams.\n\n" +
      "Point at the third card. A story without checks cannot fail a test, so a tester has nothing to check it against. That is why the reports are all love and no bugs.",
  );
}

/* --------------------------------------------------------------- 3 roles */
{
  const s = content("Same studio, same roles", "Like every team in the room");
  const roles = [
    ["Producer", "Keeps the plan in Launch Pad. Types. Says when a story is done."],
    ["Designer", "Decides what each screen shows, and sketches it."],
    ["Developer", "Writes checks and scenarios a builder could build from."],
    ["QA Lead", "Tests the app, finds bad days, and writes clear reports."],
  ];
  const { w: cw, x: colX } = grid(4, 0.3);
  roles.forEach(([r, t], i) => {
    const x = colX(i);
    card(s, { x, y: 2.0, w: cw, h: 2.8 });
    numberDot(s, i + 1, x + 0.3, 2.25);
    s.addText(r, { x: x + 0.3, y: 2.9, w: cw - 0.6, h: 0.5, fontFace: H, fontSize: 21, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(t, { x: x + 0.3, y: 3.45, w: cw - 0.6, h: 1.3, fontFace: B, fontSize: 15, color: INK, lineSpacing: 21, isTextBox: true, margin: 0 });
  });
  body(s, "Roles rotate every Monday, at the same time as the game studios.", { x: M, y: 5.2, w: CW, h: 0.5, fontSize: 17, color: MUTED });
  s.addNotes("These match the Game Studio roles, with Game Designer becoming Designer. In a team of 3, the Producer is also QA Lead. Rotating keeps one person from doing all the typing.");
}

/* ------------------------------------------------------------ 4 six weeks */
{
  const s = content("Your six weeks", "In step with the class");
  const weeks = [
    ["1", "Talk to real users", "Interview 3 people who have adopted or want a pet. What was hard?"],
    ["2", "Plan v2 in Launch Pad", "Update your users from what you heard. Write at least 3 new v2 stories."],
    ["3", "Make every story done", "Checks, a happy path and a bad day for every story. v2 is built that weekend."],
    ["4", "Design a screen", "Sketch one v2 screen on paper, then compare it with See my app."],
    ["5", "QA week", "Find me v2 goes on /play. The class tests it. Bugs become bad days."],
    ["6", "Launch", "Check v2 against your checks, make a store page, and launch with the class."],
  ];
  weeks.forEach(([n, title, text], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cw = (CW - 0.4) / 2, x = M + col * (cw + 0.4), y = 1.85 + row * 1.42;
    card(s, { x, y, w: cw, h: 1.25 });
    numberDot(s, n, x + 0.25, y + 0.38, { fill: MAROON });
    s.addText(title, { x: x + 0.95, y: y + 0.14, w: cw - 1.2, h: 0.42, fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(text, { x: x + 0.95, y: y + 0.56, w: cw - 1.2, h: 0.62, fontFace: B, fontSize: 14, color: INK, lineSpacing: 19, isTextBox: true, margin: 0 });
  });
  s.addNotes(
    "Same build weekends as the game studios: the teacher exports the v2 plan after day 15 (end of week 3) and Double Blaze builds it, and changes after day 24 get a second build.\n\n" +
      "Week 4: while the class learns MakeCode Arcade, Pickle bombs sketch a v2 screen. If they want to try MakeCode with the class on day 16, that is fine too.\n\n" +
      "Week 5: their app sits on /play next to the games, so the whole class QAs it.",
  );
}

/* -------------------------------------------------------- 5 talk to users */
{
  const s = content("Week 1: talk to real users", "Before you build anything new");
  card(s, { x: M, y: 1.9, w: CW, h: 2.55 });
  const qs = [
    "Tell me about the last time you looked for a pet. What happened?",
    "What was the hardest part?",
    "What would have helped?",
  ];
  qs.forEach((q, i) => {
    numberDot(s, i + 1, M + 0.35, 2.12 + i * 0.75, { size: 0.5 });
    s.addText(q, { x: M + 1.05, y: 2.1 + i * 0.75, w: CW - 1.4, h: 0.55, fontFace: H, fontSize: 21, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 4.7, w: CW, h: 1.2, fill: "FBEDE8" });
  s.addText([
    { text: "Never ask: ", options: { bold: true, color: ORANGE } },
    { text: "“Would you use my app?” Everyone says yes to be nice. Ask about what really happened instead.", options: { color: INK } },
  ], { x: M + 0.35, y: 4.7, w: CW - 0.7, h: 1.2, fontFace: B, fontSize: 18, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    "Three interviews this week: a family member, a neighbor, a classmate with a pet. Write down their words, not your opinion of them.\n\n" +
      "Ask whether they have ever been to a shelter. Shelter workers are one of Find me's users and the team has never heard from one; if a family knows somebody who volunteers, even better.\n\n" +
      "The rule about 'would you use it' is a real product management rule. People are kind, and kindness is not data.",
  );
}

/* -------------------------------------------------------- 6 v2 questions */
{
  const s = content("Questions that could become v2 stories", "Ideas, not answers");
  const ideas = [
    ["Foster", "What about families who can only keep a pet for a few weeks?"],
    ["Volunteer", "Shelters need help walking dogs. Who would sign up, and how?"],
    ["Lost pets", "What happens when a pet runs away from home?"],
    ["After adoption", "What does a new owner need in the first week?"],
  ];
  const { w: cw, x: colX } = grid(2, 0.4);
  ideas.forEach(([t, q], i) => {
    const x = colX(i % 2), y = 1.95 + Math.floor(i / 2) * 1.75;
    card(s, { x, y, w: cw, h: 1.5 });
    s.addText(t, { x: x + 0.35, y: y + 0.18, w: cw - 0.7, h: 0.45, fontFace: H, fontSize: 21, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(q, { x: x + 0.35, y: y + 0.68, w: cw - 0.7, h: 0.7, fontFace: B, fontSize: 16, color: INK, isTextBox: true, margin: 0 });
  });
  body(s, "Your interviews decide which, if any. Every v2 story needs a reason a real user gave you.", { x: M, y: 5.6, w: CW, h: 0.6, fontSize: 17, bold: true });
  s.addNotes("Do not let them pick one of these on day 1. These are here so a stuck team has somewhere to start asking. The best v2 story will come from an interview.");
}

/* ------------------------------------------------------------- 7 the ladder */
{
  const s = content("What “done” means for every story", "The Definition of Done");
  const done = [
    ["Who, what and why", "As a ___, I want to ___, so I can ___."],
    ["At least 2 checks", "Yes or no tests. “Adopting a pet lowers the meter by 1.”"],
    ["A happy path", "Given ___, When ___, Then ___. It goes right."],
    ["A bad day", "Given ___, When ___, Then ___. Something goes wrong. What should the app do?"],
  ];
  done.forEach(([t, d], i) => {
    const y = 1.95 + i * 1.02;
    card(s, { x: M, y, w: CW, h: 0.85 });
    s.addText("✓", { x: M + 0.3, y, w: 0.5, h: 0.85, fontFace: B, fontSize: 26, bold: true, color: GREEN, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(t, { x: M + 0.9, y, w: 3.4, h: 0.85, fontFace: H, fontSize: 20, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(d, { x: M + 4.4, y, w: CW - 4.7, h: 0.85, fontFace: B, fontSize: 15, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Launch Pad shows this checklist on every story, and turns the story green when it is done.", { x: M, y: 6.15, w: CW, h: 0.5, fontSize: 16, color: MUTED });
  s.addNotes(
    "This is the same Definition of Done the class learned last week, and the same one the game studios use for their levels.\n\n" +
      "A bad day example for Find me: Given every kennel is full, When a worker tries to post a new animal, Then the app shows a nearby shelter with room.",
  );
}

/* --------------------------------------------------------------- 8 where */
{
  const s = dark(INK);
  s.addText("WHERE TO GO", { x: M, y: 0.6, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Three links, that is all", { x: M, y: 0.98, w: CW, h: 0.8, fontFace: H, fontSize: 34, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  const rows = [
    ["Your plan", LAUNCH, "Period 3, team name Pickle bombs. Then the Level up tab."],
    ["Your app", APP, "Find me v1, to compare against."],
    ["QA", PLAY, "Test other teams too. Reports about Find me appear here for you."],
  ];
  rows.forEach(([label, url, note], i) => {
    const y = 2.05 + i * 1.5;
    s.addShape(pres.ShapeType.roundRect, { x: M, y, w: CW, h: 1.25, rectRadius: 0.09, fill: { color: i === 0 ? ORANGE : "2B2725" }, line: { width: 0 } });
    s.addText(label.toUpperCase(), { x: M + 0.35, y: y + 0.12, w: 3, h: 0.35, fontFace: B, fontSize: 13, bold: true, color: i === 0 ? WHITE : ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(url, { x: M + 0.35, y: y + 0.42, w: CW - 0.7, h: 0.42, fontFace: "Consolas", fontSize: 19, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText(note, { x: M + 0.35, y: y + 0.84, w: CW - 0.7, h: 0.35, fontFace: B, fontSize: 14, color: "D9D6D2", isTextBox: true, margin: 0 });
  });
  s.addText("Pick Period 3, not 2. An old copy of your plan is saved under period 2.", { x: M, y: 6.6, w: CW, h: 0.45, fontFace: B, fontSize: 16, bold: true, color: ORANGE, isTextBox: true, margin: 0 });
  s.addNotes(
    "The Launch Pad link is where all the planning happens: users, stories, checks, scenarios, the Definition of Done, Level up, and See my app (which builds a quick prototype from what they wrote).\n\n" +
      "The period 2 copy is a leftover from the first day. If they open it by mistake, they will see an older version with only one story.",
  );
}

/* ---------------------------------------------------------------- 9 today */
{
  const s = content("Today", "Week 1, day 1");
  const steps = [
    "Open Launch Pad, Period 3, Pickle bombs. Read your plan out loud together.",
    "Open your app. Each person finds one thing they would change.",
    "Write your 3 interview questions on paper, in your own words.",
    "Decide who you will interview this week (3 people, outside this table).",
  ];
  steps.forEach((t, i) => {
    numberDot(s, i + 1, M, 2.0 + i * 0.95, { size: 0.55, fontSize: 17 });
    s.addText(t, { x: M + 0.85, y: 1.95 + i * 0.95, w: CW - 0.9, h: 0.65, fontFace: B, fontSize: 19, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  linkBox(s, "Done when:", "3 questions written, 3 people picked", 5.95, MAROON);
  s.addNotes(
    "Days 2 to 5 of week 1: interviews happen at home or at lunch; in class they write up what each person said, then on day 5 they pick the 3 biggest problems they heard. Week 2 they turn those into stories in Launch Pad.\n\n" +
      "On build weekends (after day 15 and after day 24) the teacher exports their plan the same way as the Launch Pad prototypes: npm run launch:export -- p3-pickle-bombs, then Double Blaze builds the v2 app.",
  );
}

pres.writeFile({ fileName: __dirname + "/Find-Me-v2.pptx" }).then((f) => console.log("wrote", f));
