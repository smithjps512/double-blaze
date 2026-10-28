/**
 * Launch Pad: what next? You decide.
 *
 * A one day deck for period 3 sixth graders. The garden project is paused
 * (the budget is frozen), so the class votes on what comes next from three
 * choices, then learns the skill every choice needs: scenarios (Given, When,
 * Then) and a Definition of Done on top of their user stories.
 *
 * About twelve minutes of slides, eight to vote at /vote, twenty five to
 * write scenarios on Launch Pad. Speaker notes on every slide. The QA numbers
 * on slide 2 were counted from launch_qa on the day the deck was made.
 * No em dashes anywhere in this deck.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node what-next.js
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
const TEAL = "1F6F78";

const H = "Cambria";
const B = "Calibri";

const LAUNCH = "doubleblaze.solutions/trail-crew/launch";
const VOTE = "doubleblaze.solutions/vote";
const RESULTS = "doubleblaze.solutions/vote/results";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Double Blaze";
pres.title = "Launch Pad: what next? You decide.";

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

/** One of the three choices, laid out the same way so none looks favored. */
function choice(n, name, tagline, make, learn, example, notes) {
  const s = content(name, `Choice ${n} of 3`);
  body(s, tagline, { x: M, y: 1.55, w: CW, h: 0.5, fontSize: 19, italic: true, color: MUTED });
  const cols = [
    ["What you would make", make],
    ["What you would learn", learn],
    ["For example", example],
  ];
  const { w: cw, x: colX } = grid(3);
  cols.forEach(([head, text], i) => {
    const x = colX(i);
    card(s, { x, y: 2.3, w: cw, h: 3.9, fill: i === 2 ? "FBEDE8" : WHITE });
    s.addText(head.toUpperCase(), {
      x: x + 0.3, y: 2.5, w: cw - 0.6, h: 0.35, fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
    });
    s.addText(text, {
      x: x + 0.3, y: 2.95, w: cw - 0.6, h: 3.1, fontFace: B, fontSize: 16, color: INK, lineSpacing: 23, valign: "top", isTextBox: true, margin: 0,
    });
  });
  numberDot(s, n, W - M - 0.6, 0.55, { size: 0.6, fontSize: 20, fill: MAROON });
  s.addNotes(notes);
  return s;
}

/** A Given / When / Then block, three coloured rows. */
function gwt(s, y, rows, { h = 0.78, label = 1.25 } = {}) {
  const fills = ["EEF2F3", "FBEDE8", "EAF4EE"];
  const colors = [TEAL, ORANGE, GREEN];
  rows.forEach(([word, text], i) => {
    const ry = y + i * (h + 0.14);
    card(s, { x: M, y: ry, w: CW, h, fill: fills[i] });
    s.addText(word, {
      x: M + 0.3, y: ry, w: label, h, fontFace: H, fontSize: 24, bold: true, color: colors[i], valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(text, {
      x: M + 0.3 + label, y: ry, w: CW - label - 0.6, h, fontFace: B, fontSize: 19, color: INK, valign: "middle", isTextBox: true, margin: 0,
    });
  });
}

/* ------------------------------------------------------------------ 1 title */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.4, y: 4.3, w: 3.4, h: 3.4, fill: { color: ORANGE }, line: { width: 0 }, transparency: 70 });
  s.addText("LAUNCH PAD  ·  PERIOD 3", {
    x: M, y: 1.9, w: 8.4, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText("What next?\nYou decide.", {
    x: M, y: 2.32, w: 8.8, h: 2.1, fontFace: H, fontSize: 54, bold: true, color: WHITE, lineSpacing: 60, isTextBox: true, margin: 0,
  });
  s.addText(
    "Today you choose where this class goes next. Then you learn the skill every product team needs, whichever way you vote.",
    { x: M, y: 4.65, w: 8.2, h: 1.1, fontFace: B, fontSize: 18, color: "EBD9E1", lineSpacing: 26, isTextBox: true, margin: 0 },
  );
  s.addNotes(
    "Open here. Set the frame: today they are not just doing the next lesson, they are deciding what the next lessons are.\n\n" +
      "Say: real product teams do not get told everything. They look at what they have, what they are allowed to spend, and what users want, and then they choose. Today you are the product team for this class.\n\n" +
      "Plan for the period: about 12 minutes of slides, 8 minutes to vote, 25 minutes writing scenarios for your own app, and the results at the end.",
  );
}

/* --------------------------------------------------------- 2 what you built */
{
  const s = content("Look what you already built", "Since Launch Pad");
  const stats = [
    ["6", "teams", "wrote a purpose, users and stories"],
    ["6", "working apps", "built from your own words"],
    ["21", "QA reports", "you wrote about each other's apps"],
  ];
  const { w: cw, x: colX } = grid(3, 0.4);
  stats.forEach(([n, label, note], i) => {
    const x = colX(i);
    card(s, { x, y: 1.85, w: cw, h: 2.3 });
    s.addText(n, { x, y: 1.98, w: cw, h: 1.05, fontFace: H, fontSize: 58, bold: true, color: MAROON, align: "center", isTextBox: true, margin: 0 });
    s.addText(label, { x, y: 3.05, w: cw, h: 0.34, fontFace: B, fontSize: 16, bold: true, color: INK, align: "center", isTextBox: true, margin: 0 });
    s.addText(note, { x: x + 0.25, y: 3.42, w: cw - 0.5, h: 0.6, fontFace: B, fontSize: 13, color: "5A5F63", align: "center", isTextBox: true, margin: 0 });
  });
  const apps = ["Find your way", "Weightin", "Find me", "The Homework Helper", "W.C.O 27", "Survival"];
  s.addText(apps.join("   ·   "), {
    x: M, y: 4.4, w: CW, h: 0.45, fontFace: H, fontSize: 18, bold: true, color: ORANGE, align: "center", isTextBox: true, margin: 0,
  });
  card(s, { x: M, y: 5.1, w: CW, h: 1.45, fill: "EAF4EE" });
  s.addText([
    { text: "15 of your 21 reports were “Love it”. ", options: { bold: true, color: GREEN } },
    { text: "You were kind. Next, get specific: only 2 were bugs. A good bug report is a gift to a team, because it tells them exactly what to fix.", options: { color: INK } },
  ], { x: M + 0.35, y: 5.1, w: CW - 0.7, h: 1.45, fontFace: B, fontSize: 17, valign: "middle", lineSpacing: 24, isTextBox: true, margin: 0 });
  s.addNotes(
    "Celebrate first. Read the apps out and let teams cheer for their own.\n\n" +
      "The QA numbers were counted from the reports at /play: 15 love it, 2 bugs, 2 confusing, 2 ideas.\n\n" +
      "Make the point gently: kindness was right, and specific is the next level. A report that says what you did, what happened, and what you expected is what lets a team fix something. That idea comes back later today as the bad day scenario.",
  );
}

/* ------------------------------------------------------ 3 the honest news */
{
  const s = content("Some honest news", "Working within limits");
  const half = (CW - 0.4) / 2;
  card(s, { x: M, y: 1.85, w: half, h: 3.5 });
  s.addText("THE NEWS", { x: M + 0.4, y: 2.1, w: half - 0.8, h: 0.35, fontFace: B, fontSize: 13, bold: true, color: MUTED, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText("The school budget is frozen. No seeds, no soil, no FarmBot parts, so the garden project is on pause for now.", {
    x: M + 0.4, y: 2.55, w: half - 0.8, h: 2.6, fontFace: H, fontSize: 22, color: INK, lineSpacing: 30, valign: "top", isTextBox: true, margin: 0,
  });
  const rx = M + half + 0.4;
  card(s, { x: rx, y: 1.85, w: half, h: 3.5, fill: "EAF4EE" });
  s.addText("WHAT PRODUCT TEAMS DO", { x: rx + 0.4, y: 2.1, w: half - 0.8, h: 0.35, fontFace: B, fontSize: 13, bold: true, color: GREEN, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText("Every real team has limits: money, time, people. The job is to make the best thing you can inside them. Ideas and writing cost nothing.", {
    x: rx + 0.4, y: 2.55, w: half - 0.8, h: 2.6, fontFace: H, fontSize: 22, bold: true, color: INK, lineSpacing: 30, valign: "top", isTextBox: true, margin: 0,
  });
  body(s, "A limit is called a constraint. Working well inside one is a product management skill.", {
    x: M, y: 5.75, w: CW, h: 0.6, fontSize: 18, bold: true, color: ORANGE,
  });
  s.addNotes(
    "Keep this short and matter of fact. Do not apologise for it at length.\n\n" +
      "Say: the garden is on pause because the school cannot spend money right now. That happens to real companies too. When it does, a product manager asks: what can we still make that is great, with what we have?\n\n" +
      "Then: everything on the next slides costs nothing but your thinking and a Chromebook.",
  );
}

/* --------------------------------------------------------- 4 three choices */
{
  const s = content("Three choices. You pick.", "Your voice");
  const opts = [
    ["1", "Level up our apps", "Make version 2 of the app your team already has."],
    ["2", "Smart City 2.0", "Design a system that runs a smart city, as a product team."],
    ["3", "Game studio", "Plan a game the way real game studios do."],
  ];
  const { w: cw, x: colX } = grid(3);
  opts.forEach(([n, name, line], i) => {
    const x = colX(i);
    card(s, { x, y: 1.9, w: cw, h: 3.4 });
    numberDot(s, n, x + 0.35, 2.2, { size: 0.62, fontSize: 21, fill: MAROON });
    s.addText(name, { x: x + 0.35, y: 3.0, w: cw - 0.7, h: 0.9, fontFace: H, fontSize: 25, bold: true, color: MAROON, valign: "top", isTextBox: true, margin: 0 });
    s.addText(line, { x: x + 0.35, y: 3.95, w: cw - 0.7, h: 1.2, fontFace: B, fontSize: 16, color: INK, lineSpacing: 22, valign: "top", isTextBox: true, margin: 0 });
  });
  body(s, "Whichever wins, this class does next. Listen to all three before you decide.", {
    x: M, y: 5.7, w: CW, h: 0.6, fontSize: 19, bold: true, color: ORANGE,
  });
  s.addNotes(
    "This is the overview. Do not say which one you like. Their vote has to be real, and kids can tell when it is not.\n\n" +
      "Say: I will show you each one for about a minute. Then you vote on your own Chromebook. Whatever gets the most points, we do. I am happy doing any of them.\n\n" +
      "Every choice uses the same product skills you started with: purpose, users, stories. And every choice uses today's new skill, scenarios.",
  );
}

/* --------------------------------------------------------- 5-7 the choices */
choice(
  1,
  "Level up our apps",
  "Keep your team's app. Make it version 2.",
  "Version 2 of your own app. New stories, real scenarios, and the fixes your classmates found when they tested it at /play.",
  "How real apps get better after launch: reading feedback, choosing what to fix first, and writing exactly what the next version must do.",
  "Find your way already grew a new feature, Scan my schedule, from one new story. What would your app's version 2 do?",
  "Pitch it with energy, the same as the others.\n\n" +
    "Point out: this is how almost every app on their phones works. Version 1 ships, people use it, the team listens and makes version 2.\n\n" +
    "Good for teams who love their idea and want to see it grow.",
);

choice(
  2,
  "Smart City 2.0",
  "Like last session's city project, but you are the product team.",
  "A system that runs part of a smart city: transit, safety, or an energy dashboard. Plus the users, stories and scenarios for it.",
  "How to plan something with many users who want different things: riders, drivers, the mayor, the people who live next door.",
  "A bus system where riders see the next bus, drivers report delays, and the city sees which routes are always late.",
  "Pitch it with energy, the same as the others.\n\n" +
    "Last session's sixth graders designed smart cities and loved it. This version is the city as a product: one system, many kinds of users, and every one of them needs stories.\n\n" +
    "Good for students who like big systems, maps, and how a whole town fits together.",
);

choice(
  3,
  "Game studio",
  "Plan a game the way real studios do.",
  "A game plan: who the player is, the core loop (what you do over and over), levels written as stories, and playtesting as QA.",
  "Why games need product managers too: what makes players come back, what makes a level fair, and how to test with real players.",
  "W.C.O 27's loop: play the obby, earn cards, build a dream team, win the tournament, and do it again.",
  "Pitch it with energy, the same as the others.\n\n" +
    "Point out: game studios have product managers, and their stories sound like ours. As a player, I want to unlock a new level, so that I keep coming back.\n\n" +
    "Good for students who love games and want to know why some games are hard to put down.",
);

/* ---------------------------------------------------------------- 8 vote */
{
  const s = dark(INK);
  s.addText("VOTE  ·  ABOUT 8 MINUTES", { x: M, y: 0.6, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("How to vote", { x: M, y: 0.98, w: CW, h: 0.9, fontFace: H, fontSize: 38, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  const steps = [
    ["Open the page", `Go to ${VOTE} on your Chromebook.`],
    ["Rank all 3", "1 is your favorite. Every choice gets a rank."],
    ["Say why", "One sentence. A good why helps your teacher plan."],
    ["Your own vote", "Vote for what you want, not what your friend wants."],
  ];
  steps.forEach(([title, text], i) => {
    const y = 2.15 + i * 0.85;
    numberDot(s, i + 1, M, y + 0.08, { size: 0.52, fontSize: 17 });
    s.addText(title, { x: M + 0.8, y, w: 2.7, h: 0.66, fontFace: B, fontSize: 20, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(text, { x: M + 3.5, y, w: CW - 3.5, h: 0.66, fontFace: B, fontSize: 18, color: "D9D6D2", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 5.95, w: CW, h: 0.95, rectRadius: 0.09, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText([
    { text: "Open:  ", options: { bold: true } },
    { text: VOTE, options: { bold: true, fontFace: "Consolas" } },
  ], { x: M + 0.35, y: 5.95, w: CW - 0.7, h: 0.95, fontFace: B, fontSize: 24, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    `Leave this up while they vote. Results are live at ${RESULTS}: keep that on your own screen, not the projector, until the end of class so nobody votes with the crowd.\n\n` +
      "Ranking matters: a first choice is worth the most, but a second choice still counts, so a choice lots of people like can win.\n\n" +
      "Walk the room and read a few of the why sentences. If someone is stuck, ask: which one would you be excited to work on next week?",
  );
}

/* ------------------------------------------------------------- 9 divider */
divider(
  "WHICHEVER ONE WINS",
  "Scenarios",
  "Every product team writes them.\nYou start today, on your own app.",
  "?",
  "Transition. Say: no matter which choice wins, you will need today's skill. So we practice it now on the apps you already know best: your own.\n\n" +
    "A scenario is a tiny story about one exact moment in your app.",
);

/* ------------------------------------------------------------ 10 ladder */
{
  const s = content("Three steps, each more exact", "The ladder");
  const steps = [
    ["1", "User story", "Who wants it, what they want, and why.", "As a new student, I want to easily find my class and not be late, so that I can learn and not be stressed."],
    ["2", "Acceptance criteria", "How we would know it works. Checks that are yes or no.", "The route shows the right room.  It says how many minutes it takes."],
    ["3", "Scenarios", "The exact situations: Given, When, Then.", "Given I am at the front doors, When I tap Show me the way, Then a route draws to C101."],
  ];
  steps.forEach(([n, name, what, ex], i) => {
    const y = 1.85 + i * 1.6;
    const indent = i * 0.5;
    card(s, { x: M + indent, y, w: CW - indent, h: 1.4, fill: i === 2 ? "EAF4EE" : WHITE });
    numberDot(s, n, M + indent + 0.3, y + 0.25, { size: 0.5, fontSize: 16, fill: i === 2 ? GREEN : ORANGE });
    s.addText(name, { x: M + indent + 1.0, y: y + 0.15, w: 3.4, h: 0.5, fontFace: H, fontSize: 21, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(what, { x: M + indent + 1.0, y: y + 0.65, w: 3.4, h: 0.65, fontFace: B, fontSize: 13.5, color: "5A5F63", lineSpacing: 18, isTextBox: true, margin: 0 });
    s.addText(ex, {
      x: M + indent + 4.6, y: y + 0.12, w: CW - indent - 4.9, h: 1.16, fontFace: B, fontSize: 15.5, italic: true, color: INK, lineSpacing: 21, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  s.addNotes(
    "This is the whole idea of today on one slide. Each step down the ladder is more exact than the one above it.\n\n" +
      "The story says what and why. The checks say how we would know it works. The scenarios describe the exact moments, so a builder knows precisely what to make, and a tester knows precisely what to try.\n\n" +
      "The examples are from Find your way, Da purples' app, which is already built, so they can open it and see each line working.",
  );
}

/* --------------------------------------------------------------- 11 GWT */
{
  const s = content("Given, When, Then", "How to write a scenario");
  const parts = [
    ["Given", "what is already true", "Before anything happens. Where are you? What is going on?"],
    ["When", "what the user does", "One action: tap, type, pick, scan."],
    ["Then", "what the app does back", "What you see or what changes. This is the part you can check."],
  ];
  const { w: cw, x: colX } = grid(3);
  const colors = [TEAL, ORANGE, GREEN];
  parts.forEach(([word, sub, text], i) => {
    const x = colX(i);
    card(s, { x, y: 1.75, w: cw, h: 1.85 });
    s.addText(word, { x: x + 0.3, y: 1.9, w: cw - 0.6, h: 0.55, fontFace: H, fontSize: 26, bold: true, color: colors[i], isTextBox: true, margin: 0 });
    s.addText(sub, { x: x + 0.3, y: 2.45, w: cw - 0.6, h: 0.35, fontFace: B, fontSize: 14, bold: true, color: INK, isTextBox: true, margin: 0 });
    s.addText(text, { x: x + 0.3, y: 2.82, w: cw - 0.6, h: 0.7, fontFace: B, fontSize: 13.5, color: "5A5F63", lineSpacing: 18, isTextBox: true, margin: 0 });
  });
  s.addText("EXAMPLE FROM FIND YOUR WAY", { x: M, y: 3.85, w: CW, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
  gwt(s, 4.25, [
    ["Given", "I am at the front doors and my next class is C101"],
    ["When", "I tap Show me the way"],
    ["Then", "a route draws to C101 and I see how many minutes it takes"],
  ], { h: 0.72 });
  s.addNotes(
    "Read the example slowly, one line at a time, and point at the matching box above.\n\n" +
      "Tip to give: the When is one action. If you need two Whens, you probably have two scenarios.\n\n" +
      "The Then has to be something you could check. 'It works' is not a Then. 'A route draws to C101' is.\n\n" +
      "If you have time, open Find your way and do exactly this on the projector: Map tab, from Front doors to C101.",
  );
}

/* ----------------------------------------------------- 12 happy vs bad day */
{
  const s = content("The happy path and the bad day", "Two scenarios for every story");
  const half = (CW - 0.4) / 2;
  const blocks = [
    ["HAPPY PATH", "Everything goes right.", GREEN, "EAF4EE", [["Given", "the halls are clear"], ["When", "I ask for directions to C101"], ["Then", "I get the shortest route"]]],
    ["BAD DAY", "Something goes wrong. What should the app do?", ORANGE, "FBEDE8", [["Given", "the main hall is packed"], ["When", "I ask for directions"], ["Then", "it routes me around the crowd"]]],
  ];
  blocks.forEach(([title, sub, color, fill, rows], i) => {
    const x = M + i * (half + 0.4);
    card(s, { x, y: 1.75, w: half, h: 3.65, fill });
    s.addText(title, { x: x + 0.35, y: 1.95, w: half - 0.7, h: 0.4, fontFace: B, fontSize: 16, bold: true, color, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(sub, { x: x + 0.35, y: 2.35, w: half - 0.7, h: 0.45, fontFace: B, fontSize: 15, italic: true, color: "5A5F63", isTextBox: true, margin: 0 });
    rows.forEach(([w, t], j) => {
      const y = 2.95 + j * 0.78;
      s.addText(w, { x: x + 0.35, y, w: 1.15, h: 0.62, fontFace: H, fontSize: 20, bold: true, color, valign: "middle", isTextBox: true, margin: 0 });
      s.addText(t, { x: x + 1.5, y, w: half - 1.85, h: 0.62, fontFace: B, fontSize: 17, color: INK, valign: "middle", isTextBox: true, margin: 0 });
    });
  });
  card(s, { x: M, y: 5.7, w: CW, h: 1.0, fill: WHITE });
  s.addText([
    { text: "Remember your QA reports? ", options: { bold: true, color: MAROON } },
    { text: "Every bug you found was a bad day that nobody wrote down. Write it as a scenario, and the team knows exactly what fixed looks like.", options: { color: INK } },
  ], { x: M + 0.35, y: 5.7, w: CW - 0.7, h: 1.0, fontFace: B, fontSize: 16, valign: "middle", lineSpacing: 22, isTextBox: true, margin: 0 });
  s.addNotes(
    "Most people only imagine the happy path. Good product teams spend just as long on the bad day, because that is where users get stuck and give up.\n\n" +
      "Ask the class: what is a bad day for Find me? (No animals match my answers. The shelter is closed.) For W.C.O 27? (I lose every heart on the first defender.)\n\n" +
      "The bottom box is the link to /play: a bug report already has a Given (the screen), a When (what you did) and a Then (what you expected). That is why it turns into a bad day scenario with one button.",
  );
}

/* --------------------------------------------------- 13 definition of done */
{
  const s = content("When is a story done?", "Definition of Done");
  const checks = [
    ["Who, what and why", "The As a, I want to, so I can sentence is complete."],
    ["At least 2 checks", "Acceptance criteria you could answer yes or no."],
    ["A happy path", "One Given, When, Then where everything goes right."],
    ["A bad day", "One Given, When, Then where something goes wrong, and what the app does about it."],
  ];
  checks.forEach(([title, text], i) => {
    const y = 1.85 + i * 1.02;
    card(s, { x: M, y, w: CW, h: 0.86 });
    s.addShape(pres.ShapeType.roundRect, { x: M + 0.3, y: y + 0.2, w: 0.46, h: 0.46, rectRadius: 0.06, fill: { color: WHITE }, line: { color: GREEN, width: 2 } });
    s.addText("✓", { x: M + 0.3, y: y + 0.2, w: 0.46, h: 0.46, fontFace: B, fontSize: 18, bold: true, color: GREEN, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(title, { x: M + 1.0, y, w: 3.4, h: 0.86, fontFace: H, fontSize: 20, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(text, { x: M + 4.5, y, w: CW - 4.8, h: 0.86, fontFace: B, fontSize: 16, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Launch Pad now shows this checklist on every story. A story with all four ticks is done.", {
    x: M, y: 6.05, w: CW, h: 0.6, fontSize: 18, bold: true, color: ORANGE,
  });
  s.addNotes(
    "Real teams call this the Definition of Done. Everyone agrees on it before they start, so nobody argues later about whether something is finished.\n\n" +
      "This is our class's Definition of Done for a story. It is on Launch Pad under every story, and the boxes tick themselves as they write.\n\n" +
      "Point out: their stories from Launch Pad day already have the first box. Most have nothing for the other three yet. That is today's work.",
  );
}

/* ------------------------------------------------------------ 14 your turn */
{
  const s = dark(INK);
  s.addText("YOUR TURN  ·  ABOUT 25 MINUTES", { x: M, y: 0.6, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Get your stories to Done", { x: M, y: 0.98, w: CW, h: 0.9, fontFace: H, fontSize: 36, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  const steps = [
    ["Open Launch Pad", "Find your team, then go to Stories."],
    ["Add 2 checks", "Under each story: how would you know it works?"],
    ["Write a happy path", "In the Scenarios section: Given, When, Then."],
    ["Write a bad day", "What goes wrong, and what should the app do?"],
    ["Finished early?", "Open /play, find a bug about your app, press Turn into a bad day."],
  ];
  steps.forEach(([title, text], i) => {
    const y = 2.05 + i * 0.74;
    numberDot(s, i + 1, M, y + 0.06, { size: 0.5, fontSize: 16 });
    s.addText(title, { x: M + 0.75, y, w: 3.1, h: 0.62, fontFace: B, fontSize: 19, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(text, { x: M + 3.85, y, w: CW - 3.85, h: 0.62, fontFace: B, fontSize: 17, color: "D9D6D2", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 6.05, w: CW, h: 0.9, rectRadius: 0.09, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText([
    { text: "Open:  ", options: { bold: true } },
    { text: LAUNCH, options: { bold: true, fontFace: "Consolas" } },
  ], { x: M + 0.35, y: 6.05, w: CW - 0.7, h: 0.9, fontFace: B, fontSize: 22, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    "Leave this up for the work time.\n\n" +
      "Teams sign in with the same period and team name as before. One person types, everyone decides.\n\n" +
      "Walk the room with three questions:\n" +
      "1. Read me a Then. Could I check it with a yes or no?\n" +
      "2. What is your bad day? What does your app do when it happens?\n" +
      "3. Is your When one action, or two?\n\n" +
      "Teams who finish: /play shows approved QA reports for their own app, and a bug can be turned into a bad day scenario with one button. Then they press See my app and look for what changed.",
  );
}

/* --------------------------------------------------------------- 15 exit */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: 2.6, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addText("THE RESULTS", { x: M, y: 1.0, w: 8.4, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("You decided.", { x: M, y: 1.45, w: 8.6, h: 1.2, fontFace: H, fontSize: 56, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  body(s, "Let's see what this class chose to build next, and why.", {
    x: M, y: 2.85, w: 8.2, h: 0.8, fontSize: 21, color: "F3E3EA", lineSpacing: 28,
  });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 4.0, w: 8.3, h: 0.9, rectRadius: 0.09, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText([
    { text: "Results:  ", options: { bold: true } },
    { text: RESULTS, options: { bold: true, fontFace: "Consolas" } },
  ], { x: M + 0.35, y: 4.0, w: 7.8, h: 0.9, fontFace: B, fontSize: 20, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  s.addText("Whatever won: your scenarios from today come with you.", {
    x: M, y: 5.4, w: 8.6, h: 0.8, fontFace: B, fontSize: 19, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addNotes(
    `Last three minutes. Switch the projector to ${RESULTS}.\n\n` +
      "Read the winner, then read two or three of the why sentences out loud, including one from a choice that did not win. Everyone's voice counted, even when their choice lost.\n\n" +
      "Close with: next class we start on what you chose, and the scenarios you wrote today are how we start.",
  );
}

pres.writeFile({ fileName: __dirname + "/Launch-Pad-What-Next.pptx" }).then((f) => console.log("wrote", f));
