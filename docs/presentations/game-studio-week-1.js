/**
 * Game Studio, week 1: welcome to the studio.
 *
 * Period 3 sixth graders voted Game Studio 15 to 3 for their next six weeks.
 * This deck runs the first week, one section per day: the studio and its
 * roles, the core loop, players and the feeling, the pitch, and pitch day.
 * About ten minutes of slides a day; the rest of each class is the work.
 *
 * Same family as launch-pad.js and what-next.js (maroon, orange, stone),
 * with an arcade night colour for the day dividers. Speaker notes on every
 * slide. No real game brands are named anywhere, on purpose. No em dashes.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node game-studio-week-1.js
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031";
const ORANGE = "CF4420";
const DEEP = "4A0025";
const STONE = "F6F4F1";
const WHITE = "FFFFFF";
const INK = "1C1A19";
const MUTED = "75787B";
const PINK = "E9C9D6";
const NIGHT = "1B1230"; // the arcade cabinet
const NIGHT2 = "2A1D47";
const NEON = "FFB13B"; // coin gold
const MINT = "3DDC97"; // 1UP green
const SKY = "5CC8FF";

const H = "Cambria";
const B = "Calibri";
const PIX = "Consolas";

const STUDIO = "doubleblaze.solutions/studio";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Double Blaze";
pres.title = "Game Studio, week 1";

const W = 13.333;
const M = 0.7;
const CW = W - M * 2;

/* ---------------------------------------------------------------- helpers */

function content(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: STONE };
  // A row of pixel blocks along the top: the arcade signature on every slide.
  [ORANGE, NEON, MINT, SKY].forEach((c, i) => {
    s.addShape(pres.ShapeType.rect, { x: W - M - 0.9 + i * 0.24, y: 0.46, w: 0.18, h: 0.18, fill: { color: c }, line: { width: 0 } });
  });
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.42, w: CW - 1.2, h: 0.28,
      fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
    });
  }
  s.addText(title, {
    x: M, y: kicker ? 0.72 : 0.55, w: CW, h: 0.85,
    fontFace: H, fontSize: 34, bold: true, color: MAROON, isTextBox: true, margin: 0, valign: "top",
  });
  return s;
}

function dark(color = NIGHT) {
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

/** A day divider: an arcade screen with the day as a pixel score. */
function dayDivider(day, title, line, notes) {
  const s = dark(NIGHT);
  // Scattered pixel stars.
  [[1.2, 6.6, NEON], [3.4, 0.5, MINT], [6.1, 6.9, SKY], [8.6, 0.7, ORANGE], [12.4, 6.2, MINT], [12.1, 1.3, NEON]].forEach(([x, y, c]) => {
    s.addShape(pres.ShapeType.rect, { x, y, w: 0.14, h: 0.14, fill: { color: c }, line: { width: 0 } });
  });
  s.addShape(pres.ShapeType.roundRect, { x: 9.2, y: 1.4, w: 3.4, h: 4.7, rectRadius: 0.2, fill: { color: NIGHT2 }, line: { color: NEON, width: 3 } });
  s.addText("DAY", { x: 9.2, y: 1.8, w: 3.4, h: 0.6, fontFace: PIX, fontSize: 30, bold: true, color: NEON, align: "center", isTextBox: true, margin: 0 });
  s.addText(String(day), { x: 9.2, y: 2.4, w: 3.4, h: 2.6, fontFace: PIX, fontSize: 150, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText("PRESS START", { x: 9.2, y: 5.25, w: 3.4, h: 0.5, fontFace: PIX, fontSize: 16, bold: true, color: MINT, align: "center", isTextBox: true, margin: 0 });
  s.addText(`GAME STUDIO  ·  WEEK 1  ·  DAY ${day} OF 5`, {
    x: M, y: 2.2, w: 8.2, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: NEON, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText(title, {
    x: M, y: 2.6, w: 8.2, h: 1.6, fontFace: H, fontSize: 46, bold: true, color: WHITE, valign: "top", isTextBox: true, margin: 0,
  });
  s.addText(line, {
    x: M, y: 4.3, w: 8.2, h: 1.4, fontFace: B, fontSize: 21, color: "DCD3F0", lineSpacing: 29, valign: "top", isTextBox: true, margin: 0,
  });
  s.addNotes(notes);
  return s;
}

/** A loop of verbs drawn as stations on a ring, with arrows between them. */
function loop(s, verbs, { cx, cy, r, color = ORANGE, size = 1.55 }) {
  s.addShape(pres.ShapeType.ellipse, { x: cx - r, y: cy - r, w: r * 2, h: r * 2, fill: { type: "none" }, line: { color: "D9D2C7", width: 3, dashType: "dash" } });
  verbs.forEach((v, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / verbs.length;
    const x = cx + r * Math.cos(a) - size / 2;
    const y = cy + r * Math.sin(a) - 0.33;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: size, h: 0.66, rectRadius: 0.33, fill: { color }, line: { width: 0 } });
    s.addText(v, { x, y, w: size, h: 0.66, fontFace: B, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addText("↻", { x: cx - 0.5, y: cy - 0.5, w: 1, h: 1, fontFace: B, fontSize: 40, bold: true, color: "C9C1B4", align: "center", valign: "middle", isTextBox: true, margin: 0 });
}

/* ------------------------------------------------------------------ title */
{
  const s = dark(NIGHT);
  for (let i = 0; i < 9; i++) {
    s.addShape(pres.ShapeType.rect, { x: 8.4 + (i % 3) * 1.25, y: 1.0 + Math.floor(i / 3) * 1.25, w: 1.05, h: 1.05, fill: { color: [ORANGE, NEON, MINT, SKY, MAROON, ORANGE, MINT, SKY, NEON][i] }, line: { width: 0 }, transparency: i === 4 ? 0 : 35 });
  }
  s.addText("▶", { x: 9.65, y: 2.25, w: 1.05, h: 1.05, fontFace: B, fontSize: 40, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText("GAME STUDIO  ·  PERIOD 3  ·  WEEK 1", {
    x: M, y: 1.9, w: 7.5, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: NEON, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText("Welcome to\nthe studio.", {
    x: M, y: 2.32, w: 7.6, h: 2.1, fontFace: H, fontSize: 54, bold: true, color: WHITE, lineSpacing: 60, isTextBox: true, margin: 0,
  });
  s.addText("For six weeks you are game makers. You will design a game people want to play, playtest it, fix it, and launch it.", {
    x: M, y: 4.65, w: 7.4, h: 1.1, fontFace: B, fontSize: 18, color: "DCD3F0", lineSpacing: 26, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Open here on Day 1. Let the title sit for a second; the energy should feel different from the app unit.\n\n" +
      "Say: you chose this. For the next six weeks this room is a game studio, and every one of you has a job in it.\n\n" +
      "This deck runs all of week 1. Each day starts with its own Day slide; about ten minutes of slides, then the work.",
  );
}

/* ================================================================== DAY 1 */
dayDivider(1, "Welcome to the studio", "What a game studio is, who does what, and the one idea that matters most: a game is made to give the player a feeling.",
  "Day 1 starts here. Today: why we are here, the four studio roles, the six-week map, the big idea (the feeling), and a play-and-dissect warm up.\n\n" +
    "Nobody is on a team yet. Teams form on Day 5, around the pitches.");

/* ------------------------------------------------------------ you chose this */
{
  const s = content("You chose this", "Day 1 · The vote");
  card(s, { x: M, y: 1.95, w: 4.6, h: 3.9, fill: NIGHT });
  s.addText("15", { x: M, y: 2.15, w: 4.6, h: 1.9, fontFace: PIX, fontSize: 110, bold: true, color: NEON, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText("of 18 first-choice votes", { x: M, y: 4.05, w: 4.6, h: 0.5, fontFace: B, fontSize: 20, bold: true, color: WHITE, align: "center", isTextBox: true, margin: 0 });
  s.addText("Game Studio won. By a lot.", { x: M, y: 4.6, w: 4.6, h: 0.5, fontFace: B, fontSize: 16, color: "DCD3F0", align: "center", isTextBox: true, margin: 0 });
  const quotes = ["“I like coding games.”", "“A fun playable game made by me.”", "“Because I want to have fun with friends.”"];
  quotes.forEach((q, i) => {
    const y = 1.95 + i * 1.3;
    card(s, { x: M + 5.0, y, w: CW - 5.0, h: 1.1 });
    s.addText(q, { x: M + 5.35, y, w: CW - 5.7, h: 1.1, fontFace: H, fontSize: 24, italic: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Your reasons, from the vote. Making it, coding it, and doing it together: that is exactly what a studio is.", {
    x: M, y: 6.15, w: CW, h: 0.6, fontSize: 17, color: MUTED,
  });
  s.addNotes(
    "These quotes are real, from the /vote reasons. Read them out.\n\n" +
      "Point out the three things in them: making something, coding something, doing it with friends. Every one of those is in the next six weeks.\n\n" +
      "Also say honestly: the other choices were good too, and two of you wanted apps v2. Everything you learned about stories and scenarios comes with us.",
  );
}

/* ------------------------------------------------------------ what a studio is */
{
  const s = content("What is a game studio?", "Day 1 · The studio");
  body(s, "A team of people who make a game together. Nobody makes a big game alone. Everyone has a job, and the jobs depend on each other.", {
    x: M, y: 1.65, w: CW, h: 0.9, fontSize: 20,
  });
  const steps = [
    ["Dream it", "What game? Who plays it? How should it feel?"],
    ["Design it", "Write it down: the loop, the rules, the levels."],
    ["Build it", "Turn the design into something you can play."],
    ["Test it", "Watch people play. Find what is broken or boring."],
    ["Ship it", "Fix the most important things, then launch."],
  ];
  const { w: cw, x: colX } = grid(5, 0.22);
  steps.forEach(([t, d], i) => {
    const x = colX(i);
    card(s, { x, y: 2.85, w: cw, h: 2.75 });
    numberDot(s, i + 1, x + 0.25, 3.05, { fill: [ORANGE, NEON, MINT, SKY, MAROON][i] });
    s.addText(t, { x: x + 0.25, y: 3.65, w: cw - 0.5, h: 0.5, fontFace: H, fontSize: 21, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(d, { x: x + 0.25, y: 4.2, w: cw - 0.5, h: 1.3, fontFace: B, fontSize: 14.5, color: INK, lineSpacing: 20, valign: "top", isTextBox: true, margin: 0 });
  });
  body(s, "This is the same loop as your apps: plan, build, QA, fix. Games just make it more fun to test.", { x: M, y: 6.0, w: CW, h: 0.6, fontSize: 17, bold: true, color: ORANGE });
  s.addNotes(
    "Keep it quick. The five steps are the whole six weeks in miniature.\n\n" +
      "Connect it to what they already did: they planned apps, Double Blaze built them, they QA'd each other on /play. A studio is the same loop, with a game at the end.",
  );
}

/* ------------------------------------------------------------ the four roles */
{
  const s = content("Four jobs in every studio", "Day 1 · Studio roles (they rotate every week)");
  const roles = [
    ["🎯", "Producer", "The product manager. Keeps the plan, runs the to-do list, makes sure the team finishes.", "you like being organized and making calls."],
    ["🎨", "Game Designer", "Decides the rules, the levels, the hero and the world. Writes the design doc.", "you always have ideas for how a game should work."],
    ["💻", "Developer", "Turns the design into something playable. Next month: MakeCode Arcade.", "you like figuring out how things work inside."],
    ["🐞", "QA Lead", "Plays it to break it. Writes bug reports and bad days. Protects the player.", "you notice everything that is a little off."],
  ];
  const { w: cw, x: colX } = grid(4, 0.3);
  roles.forEach(([icon, name, what, like], i) => {
    const x = colX(i);
    card(s, { x, y: 1.85, w: cw, h: 4.55, fill: i % 2 ? WHITE : "FFF8EC" });
    s.addText(icon, { x: x + 0.25, y: 2.0, w: 0.9, h: 0.8, fontFace: B, fontSize: 34, isTextBox: true, margin: 0 });
    s.addText(name, { x: x + 0.25, y: 2.85, w: cw - 0.5, h: 0.5, fontFace: H, fontSize: 22, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(what, { x: x + 0.25, y: 3.4, w: cw - 0.5, h: 1.65, fontFace: B, fontSize: 14.5, color: INK, lineSpacing: 20, valign: "top", isTextBox: true, margin: 0 });
    s.addText([
      { text: "You'd like this if ", options: { color: ORANGE, bold: true } },
      { text: like, options: { color: MUTED, italic: true } },
    ], { x: x + 0.25, y: 5.1, w: cw - 0.5, h: 1.15, fontFace: B, fontSize: 13.5, lineSpacing: 18, valign: "top", isTextBox: true, margin: 0 });
  });
  body(s, "Roles rotate every week, so everyone tries every job at least once.", { x: M, y: 6.6, w: CW, h: 0.5, fontSize: 16, bold: true, color: ORANGE });
  s.addNotes(
    "Read each role and its 'you'd like this if' line. Ask for a show of hands after each: who thinks they'd like this one?\n\n" +
      "Make the rotation clear: nobody is stuck as the Developer for six weeks, and nobody gets to be Producer every week either. Teams of 3 double up a role; teams of 4 have one each.\n\n" +
      "The Producer is the product manager they already know from Launch Pad. That is the job this whole class is really about.",
  );
}

/* ------------------------------------------------------------ six-week map */
{
  const s = content("Your six weeks", "Day 1 · The map");
  const weeks = [
    ["1", "Kickoff", "Core loops, players, the feeling, pitches. Teams form."],
    ["2", "Design doc", "Your game, written down on the Game Studio site."],
    ["3", "Levels as stories", "Player stories, checks, happy paths and bad days."],
    ["4", "MakeCode Arcade", "Build one mechanic of your game yourself."],
    ["5", "Playtest", "Play the build of your game. QA each other on /play."],
    ["6", "Launch", "Polish, a trailer pitch, and launch day."],
  ];
  const { w: cw, x: colX } = grid(6, 0.2);
  weeks.forEach(([n, t, d], i) => {
    const x = colX(i);
    const now = i === 0;
    card(s, { x, y: 1.95, w: cw, h: 3.9, fill: now ? NIGHT : WHITE });
    s.addText(`WEEK ${n}`, { x: x + 0.2, y: 2.15, w: cw - 0.4, h: 0.35, fontFace: PIX, fontSize: 14, bold: true, color: now ? NEON : ORANGE, isTextBox: true, margin: 0 });
    s.addText(t, { x: x + 0.2, y: 2.55, w: cw - 0.4, h: 0.9, fontFace: H, fontSize: 19, bold: true, color: now ? WHITE : MAROON, valign: "top", isTextBox: true, margin: 0 });
    s.addText(d, { x: x + 0.2, y: 3.5, w: cw - 0.4, h: 2.2, fontFace: B, fontSize: 13.5, color: now ? "DCD3F0" : INK, lineSpacing: 19, valign: "top", isTextBox: true, margin: 0 });
    if (now) s.addText("YOU ARE HERE", { x: x + 0.2, y: 5.35, w: cw - 0.4, h: 0.3, fontFace: PIX, fontSize: 11, bold: true, color: MINT, isTextBox: true, margin: 0 });
  });
  body(s, "Week 3 ends with your design doc. Double Blaze builds a playable version of your game from it, and you playtest it in week 5.", {
    x: M, y: 6.15, w: CW, h: 0.7, fontSize: 17, bold: true, color: MAROON,
  });
  s.addNotes(
    "The whole unit on one slide. Leave it up.\n\n" +
      "The hook is the bottom line: just like the apps, what they write becomes something playable. The clearer the design doc, the better the build. In week 4 they also get to build one piece of it themselves in MakeCode Arcade.",
  );
}

/* ------------------------------------------------------------ the big idea */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.4, y: 1.0, w: 5.6, h: 5.6, fill: { color: DEEP }, line: { width: 0 } });
  s.addText("♥", { x: 9.4, y: 1.0, w: 5.6, h: 5.6, fontFace: B, fontSize: 170, color: ORANGE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText("THE BIG IDEA", { x: M, y: 1.7, w: 8, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("A game's purpose is the feeling it gives the player.", {
    x: M, y: 2.1, w: 8.6, h: 2.2, fontFace: H, fontSize: 44, bold: true, color: WHITE, valign: "top", isTextBox: true, margin: 0,
  });
  s.addText("Brave. Clever. Fast. Cozy. Spooky. Proud.\nEvery rule, level and sound is there to make the player feel that.", {
    x: M, y: 4.55, w: 8.4, h: 1.4, fontFace: B, fontSize: 21, color: "F3E3EA", lineSpacing: 30, valign: "top", isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Say the line twice. This is the game version of 'purpose is impact' from Launch Pad, and it comes back on Day 3.\n\n" +
      "Ask: think of a game you love. How does it make you feel when you are winning? When you almost lose? That feeling is not an accident; somebody designed it.",
  );
}

/* ------------------------------------------------------------ play and dissect */
{
  const s = content("Play and dissect", "Day 1 · Your turn (15 minutes)");
  body(s, "Pick a game you know well. Any game: on a phone, a console, a board game, or a playground game. With a partner, answer:", {
    x: M, y: 1.65, w: CW, h: 0.9, fontSize: 19,
  });
  const qs = [
    ["What do you DO over and over?", "Use verbs: run, jump, aim, build, collect, trade."],
    ["How do you win? How do you lose?", "If you cannot lose, is it still a game?"],
    ["How does it make you feel?", "When you are winning, and when you almost lose."],
  ];
  qs.forEach(([q, hint], i) => {
    const y = 2.75 + i * 1.15;
    numberDot(s, i + 1, M, y + 0.12, { size: 0.6, fontSize: 20 });
    s.addText(q, { x: M + 0.85, y, w: 6.8, h: 0.85, fontFace: H, fontSize: 24, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(hint, { x: M + 7.75, y, w: CW - 7.75, h: 0.85, fontFace: B, fontSize: 16, italic: true, color: MUTED, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Share one answer out loud. Tomorrow, question 1 gets a name: the core loop.", { x: M, y: 6.3, w: CW, h: 0.5, fontSize: 17, bold: true, color: ORANGE });
  s.addNotes(
    "Pairs, about 10 minutes, then 5 minutes of sharing. Board games and playground games count; tag is a great example (run, chase, tag, switch).\n\n" +
      "Walk the room and push for verbs. 'It's fun' is not an answer to question 1; 'I jump, collect coins, and dodge' is.\n\n" +
      "Collect two or three examples on the board for tomorrow. Do not name or rank real brands on the board; describe the game type instead.",
  );
}

/* ================================================================== DAY 2 */
dayDivider(2, "The core loop", "The three or four things a player does over and over. Get the loop right and the game is fun. Get it wrong and nothing else saves it.",
  "Day 2. Today: what a core loop is, three worked examples, a loop from our own class (W.C.O 27), and win and lose conditions.\n\n" +
    "Start by asking for yesterday's question 1 answers from the board.");

/* ------------------------------------------------------------ what a core loop is */
{
  const s = content("The core loop: verbs that repeat", "Day 2 · The core loop");
  loop(s, ["Run", "Jump", "Collect", "Reach the flag"], { cx: 3.6, cy: 4.3, r: 1.75 });
  s.addText("A PLATFORMER", { x: M, y: 1.7, w: 5.8, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
  card(s, { x: 7.0, y: 1.9, w: CW - 6.3, h: 4.6 });
  body(s, [
    { text: "A core loop is the short list of things a player does again and again.", options: { bold: true, fontSize: 19, color: MAROON, breakLine: true, paraSpaceAfter: 14 } },
    { text: "3 or 4 verbs. Doing words.", options: { bullet: true, breakLine: true } },
    { text: "Each verb leads to the next.", options: { bullet: true, breakLine: true } },
    { text: "The last one leads back to the first.", options: { bullet: true, breakLine: true } },
    { text: "Every level is the same loop, a little harder.", options: { bullet: true } },
  ], { x: 7.35, y: 2.15, w: CW - 7.0, h: 4.2, fontSize: 18, lineSpacing: 28 });
  s.addNotes(
    "Walk the ring with your finger: run, jump, collect, reach the flag, and then the next level starts, so you run again.\n\n" +
      "The key word is VERBS. Ask the class for verbs from yesterday's board and sort them into loops.\n\n" +
      "Point out the last bullet: levels do not change the loop, they make it harder. That idea is how they will plan three levels in week 3.",
  );
}

/* ------------------------------------------------------------ three loops */
{
  const s = content("Same idea, different games", "Day 2 · Worked examples");
  const loops = [
    ["A racing game", ["Steer", "Boost", "Pass", "Finish"], ORANGE],
    ["A collect-and-upgrade game", ["Explore", "Collect", "Upgrade", "Go further"], MAROON],
    ["A tower-defense game", ["Place", "Watch", "Earn", "Upgrade"], "1F6F78"],
  ];
  const { w: cw, x: colX } = grid(3, 0.4);
  loops.forEach(([name, verbs, color], i) => {
    const x = colX(i);
    card(s, { x, y: 1.8, w: cw, h: 4.6 });
    s.addText(name, { x: x + 0.25, y: 1.95, w: cw - 0.5, h: 0.5, fontFace: H, fontSize: 20, bold: true, color: MAROON, align: "center", isTextBox: true, margin: 0 });
    loop(s, verbs, { cx: x + cw / 2, cy: 4.25, r: 1.25, color, size: 1.35 });
  });
  body(s, "Notice: you could describe each one without knowing its name. That is how you know it is a real loop.", { x: M, y: 6.6, w: CW, h: 0.5, fontSize: 16, color: MUTED });
  s.addNotes(
    "Three common game types, described only by their loops. On purpose, no real game names: we talk about game TYPES, so nobody's favorite gets judged.\n\n" +
      "Ask: which loop do you think is the most fun? Why? Usually the answer is about the feeling (fast, clever, proud), which sets up Day 3.",
  );
}

/* ------------------------------------------------------------ W.C.O 27 */
{
  const s = content("A loop from this room: W.C.O 27", "Day 2 · Your class already did this");
  loop(s, ["Play the obby", "Earn cards", "Build your team", "Play the tournament"], { cx: 3.9, cy: 4.25, r: 1.8, color: "16A34A", size: 1.9 });
  card(s, { x: 7.4, y: 1.85, w: CW - 6.7, h: 4.65, fill: "EFFAF2" });
  body(s, [
    { text: "the dragon slayer wrote three stories:\n", options: { bold: true, color: MAROON, fontSize: 18 } },
    { text: "“I want to play the obby, so I can get cards.”\n", options: { italic: true } },
    { text: "“I want to collect soccer cards, so I can use them in my dream team.”\n", options: { italic: true } },
    { text: "“I want to use my team, so I can play in the tournament.”\n\n", options: { italic: true } },
    { text: "Each “so I can” leads to the next story. That is a core loop, and they wrote it before they knew the word.", options: { bold: true, color: ORANGE } },
  ], { x: 7.75, y: 2.1, w: CW - 7.4, h: 4.3, fontSize: 16.5, lineSpacing: 24 });
  s.addNotes(
    "This is their classmates' work, so name the team and give credit.\n\n" +
      "The insight: the 'so I can' of each story is the start of the next one. A good core loop chains together exactly like that.\n\n" +
      "If you have a minute, open doubleblaze.solutions/play and show W.C.O 27 being played. The loop is right there.",
  );
}

/* ------------------------------------------------------------ win and lose */
{
  const s = content("How do you win? How do you lose?", "Day 2 · Win and lose conditions");
  const half = (CW - 0.4) / 2;
  card(s, { x: M, y: 1.85, w: half, h: 3.6, fill: "EAF7EF" });
  card(s, { x: M + half + 0.4, y: 1.85, w: half, h: 3.6, fill: "FDECEA" });
  s.addText("🏆  WIN CONDITION", { x: M + 0.35, y: 2.05, w: half - 0.7, h: 0.4, fontFace: B, fontSize: 15, bold: true, color: "1E7A44", charSpacing: 1, isTextBox: true, margin: 0 });
  s.addText("What the player has to do to finish.\n\n• Reach the flag\n• Score 10 goals first\n• Survive until sunrise", {
    x: M + 0.35, y: 2.55, w: half - 0.7, h: 2.7, fontFace: B, fontSize: 18, color: INK, lineSpacing: 26, valign: "top", isTextBox: true, margin: 0,
  });
  const rx = M + half + 0.75;
  s.addText("💥  LOSE CONDITION", { x: rx, y: 2.05, w: half - 0.7, h: 0.4, fontFace: B, fontSize: 15, bold: true, color: "B4261C", charSpacing: 1, isTextBox: true, margin: 0 });
  s.addText("What ends the game or costs the player.\n\n• Out of hearts\n• The timer runs out\n• Hunger hits zero", {
    x: rx, y: 2.55, w: half - 0.7, h: 2.7, fontFace: B, fontSize: 18, color: INK, lineSpacing: 26, valign: "top", isTextBox: true, margin: 0,
  });
  body(s, "No way to lose usually means no reason to try. The chance of losing is where the feeling comes from.", {
    x: M, y: 5.8, w: CW, h: 0.8, fontSize: 19, bold: true, color: MAROON,
  });
  s.addNotes(
    "Quick check: name a game with no lose condition. (Some building or drawing games.) Are they still games? Good debate, keep it short.\n\n" +
      "Tie it forward: in week 3, lose conditions become 'bad day' scenarios. What happens when you run out of hearts is a scenario someone has to write.\n\n" +
      "Exit task: each student writes one loop (3 or 4 verbs) plus a win and a lose condition for a game idea of their own.",
  );
}

/* ================================================================== DAY 3 */
dayDivider(3, "Players and the feeling", "There is always more than one kind of player. Know who they are, and decide how your game should make them feel.",
  "Day 3. Today: player types, feeling words, and how the feeling is the game version of 'purpose is impact'.\n\n" +
    "Warm up: ask two students to read the loop they wrote for yesterday's exit task.");

/* ------------------------------------------------------------ player types */
{
  const s = content("There is always more than one player", "Day 3 · Player types");
  const types = [
    ["🧭", "Explorer", "Wants to find every secret and see what is around the corner."],
    ["🏁", "Competitor", "Wants to win, beat a high score, and beat their friends."],
    ["💎", "Collector", "Wants to get them all: every card, every coin, every badge."],
    ["🧱", "Builder", "Wants to make something of their own: a base, a team, a world."],
    ["👪", "The parent who says yes", "Never plays, but decides if it is allowed. Wants it safe and fair."],
  ];
  types.forEach(([icon, name, want], i) => {
    const y = 1.8 + i * 0.95;
    card(s, { x: M, y, w: CW, h: 0.8, fill: i === 4 ? "FBEDE8" : WHITE });
    s.addText(icon, { x: M + 0.2, y, w: 0.7, h: 0.8, fontFace: B, fontSize: 26, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(name, { x: M + 1.0, y, w: 3.6, h: 0.8, fontFace: H, fontSize: 21, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(want, { x: M + 4.7, y, w: CW - 4.95, h: 0.8, fontFace: B, fontSize: 16.5, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Same rule as Launch Pad: name at least two, and write what each one wants.", { x: M, y: 6.65, w: CW, h: 0.5, fontSize: 16, bold: true, color: ORANGE });
  s.addNotes(
    "Ask for hands: which type are you? Most kids are two or three. That is the point: one game can serve more than one type.\n\n" +
      "The parent row is the one they forget, just like the adults on Launch Pad. A parent decides whether a game gets played at all: is it safe, is it fair, does it ask for money?\n\n" +
      "These types go straight into the Players section of the design doc next week.",
  );
}

/* ------------------------------------------------------------ feeling words */
{
  const s = content("Pick the feeling", "Day 3 · Feeling words");
  const words = [
    ["Brave", ORANGE], ["Clever", "1F6F78"], ["Fast", "B4261C"], ["Cozy", "8A5A2B"], ["Spooky", NIGHT2], ["Proud", MAROON],
    ["Curious", "2E6B4A"], ["Powerful", "B45309"], ["Calm", "3B82A0"], ["Sneaky", "4B3F72"],
  ];
  words.forEach(([w, c], i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = M + col * (CW / 5);
    const y = 1.9 + row * 1.35;
    s.addShape(pres.ShapeType.roundRect, { x: x + 0.1, y, w: CW / 5 - 0.2, h: 1.05, rectRadius: 0.5, fill: { color: c }, line: { width: 0 } });
    s.addText(w, { x: x + 0.1, y, w: CW / 5 - 0.2, h: 1.05, fontFace: H, fontSize: 24, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 4.85, w: CW, h: 1.55 });
  body(s, [
    { text: "Then check your loop against it. ", options: { bold: true, color: MAROON } },
    { text: "If the feeling is “spooky”, does your loop have hiding, sneaking, and things that jump out? If the feeling is “cozy”, do you really need a timer?", options: {} },
  ], { x: M + 0.35, y: 5.05, w: CW - 0.7, h: 1.25, fontSize: 18, lineSpacing: 26 });
  s.addNotes(
    "Pick one or two feelings, not five. A game that tries to feel everything feels like nothing.\n\n" +
      "The bottom box is the real skill: the feeling decides the rules. A timer makes things fast and stressful, which is great for a racing game and wrong for a cozy farm game.\n\n" +
      "Ask a few students: what feeling would your game idea give? Does your loop match it?",
  );
}

/* ------------------------------------------------------------ purpose -> feeling */
{
  const s = content("From apps to games: the same skill", "Day 3 · Purpose is the feeling");
  const half = (CW - 0.4) / 2;
  card(s, { x: M, y: 1.85, w: half, h: 3.7 });
  card(s, { x: M + half + 0.4, y: 1.85, w: half, h: 3.7, fill: "FFF8EC" });
  s.addText("APPS (LAUNCH PAD)", { x: M + 0.35, y: 2.05, w: half - 0.7, h: 0.35, fontFace: B, fontSize: 13, bold: true, color: MUTED, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText("Purpose = the impact.", { x: M + 0.35, y: 2.45, w: half - 0.7, h: 0.6, fontFace: H, fontSize: 26, bold: true, color: MAROON, isTextBox: true, margin: 0 });
  s.addText("“New kids get to class on time instead of getting lost.”\n\nWho is better off, and how?", {
    x: M + 0.35, y: 3.15, w: half - 0.7, h: 2.2, fontFace: B, fontSize: 18, color: INK, lineSpacing: 25, valign: "top", isTextBox: true, margin: 0,
  });
  const rx = M + half + 0.75;
  s.addText("GAMES (GAME STUDIO)", { x: rx, y: 2.05, w: half - 0.7, h: 0.35, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText("Purpose = the feeling.", { x: rx, y: 2.45, w: half - 0.7, h: 0.6, fontFace: H, fontSize: 26, bold: true, color: MAROON, isTextBox: true, margin: 0 });
  s.addText("“The player feels brave, because the dragon is huge and they beat it anyway.”\n\nHow does the player feel, and why?", {
    x: rx, y: 3.15, w: half - 0.7, h: 2.2, fontFace: B, fontSize: 18, color: INK, lineSpacing: 25, valign: "top", isTextBox: true, margin: 0,
  });
  body(s, "Write it as: “The player feels ____, because ____.” That sentence goes at the top of your design doc.", { x: M, y: 5.9, w: CW, h: 0.8, fontSize: 19, bold: true, color: ORANGE });
  s.addNotes(
    "Bridge from what they know. On Launch Pad the purpose was the impact, not what the app does. For a game, the purpose is the feeling, not what the game has in it.\n\n" +
      "Weak: 'It is a game with a dragon.' Strong: 'The player feels brave, because the dragon is huge and they beat it anyway.'\n\n" +
      "Exit task: each student writes their own 'The player feels ____, because ____.' They will need it for tomorrow's pitch.",
  );
}

/* ================================================================== DAY 4 */
dayDivider(4, "The pitch", "One sentence that makes people want to play your game, and a plan small enough to actually make in six weeks.",
  "Day 4. Today: the pitch sentence, weak vs strong, and what makes a game buildable in six weeks. Everybody writes and practices a 60 second pitch for tomorrow.\n\n" +
    "Warm up: two students read their 'The player feels ____, because ____' from yesterday.");

/* ------------------------------------------------------------ the pitch sentence */
{
  const s = content("The pitch sentence", "Day 4 · The pitch");
  card(s, { x: M, y: 1.9, w: CW, h: 1.6 });
  s.addText([
    { text: "It's a ", options: { color: INK } },
    { text: "______", options: { color: ORANGE, bold: true } },
    { text: " game where you ", options: { color: INK } },
    { text: "______", options: { color: ORANGE, bold: true } },
    { text: " so that you feel ", options: { color: INK } },
    { text: "______", options: { color: ORANGE, bold: true } },
    { text: ".", options: { color: INK } },
  ], { x: M + 0.4, y: 1.9, w: CW - 0.8, h: 1.6, fontFace: H, fontSize: 32, valign: "middle", isTextBox: true, margin: 0 });
  const parts = [
    ["Game type", "platformer, racer, puzzle, survival, sports, collect-and-upgrade"],
    ["Your core loop", "the verbs: jump across rooftops and collect lost kittens"],
    ["The feeling", "brave, clever, fast, cozy, spooky, proud"],
  ];
  const { w: cw, x: colX } = grid(3);
  parts.forEach(([h, d], i) => {
    const x = colX(i);
    card(s, { x, y: 3.85, w: cw, h: 2.2, fill: "FFF8EC" });
    numberDot(s, i + 1, x + 0.3, 4.05);
    s.addText(h, { x: x + 0.95, y: 4.05, w: cw - 1.2, h: 0.46, fontFace: H, fontSize: 20, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(d, { x: x + 0.3, y: 4.7, w: cw - 0.6, h: 1.25, fontFace: B, fontSize: 15.5, italic: true, color: MUTED, lineSpacing: 21, valign: "top", isTextBox: true, margin: 0 });
  });
  body(s, "Three blanks: what kind of game, what you do, how it feels. Everything else waits until next week.", { x: M, y: 6.35, w: CW, h: 0.5, fontSize: 16, color: MUTED });
  s.addNotes(
    "The three blanks are the last three days in one sentence: game type, core loop (Day 2), feeling (Day 3).\n\n" +
      "Model one out loud: 'It's a platformer where you jump across rooftops and collect lost kittens so that you feel heroic.'\n\n" +
      "Students write theirs now. Fill-in-the-blank is fine; they can make it sound better once the blanks are right.",
  );
}

/* ------------------------------------------------------------ weak vs strong */
{
  const s = content("Weak pitch, strong pitch", "Day 4 · The pitch");
  const pairs = [
    ["It's a really fun game with lots of levels and cool stuff.", "It's a survival game where you build a camp and scare off wolves at night so that you feel brave.", "What do you DO? How does it feel?"],
    ["It's like a game everyone plays, but better.", "It's a sports game where you win matches to unlock new players for your dream team so that you feel proud.", "Say what it is, not what it is like."],
  ];
  pairs.forEach(([weak, strong, note], i) => {
    const y = 1.85 + i * 2.25;
    const lw = 4.4;
    card(s, { x: M, y, w: lw, h: 2.0 });
    card(s, { x: M + lw + 0.35, y, w: CW - lw - 0.35, h: 2.0, fill: "EAF7EF" });
    s.addText("WEAK", { x: M + 0.3, y: y + 0.15, w: 2, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: MUTED, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(weak, { x: M + 0.3, y: y + 0.45, w: lw - 0.6, h: 0.95, fontFace: H, fontSize: 17, color: "5A5F63", valign: "top", isTextBox: true, margin: 0 });
    s.addText(note, { x: M + 0.3, y: y + 1.45, w: lw - 0.6, h: 0.45, fontFace: B, fontSize: 14, italic: true, color: ORANGE, isTextBox: true, margin: 0 });
    const sx = M + lw + 0.65;
    s.addText("STRONG", { x: sx, y: y + 0.15, w: 2, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: "1E7A44", charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(strong, { x: sx, y: y + 0.45, w: CW - lw - 0.95, h: 1.45, fontFace: H, fontSize: 19, color: INK, lineSpacing: 26, valign: "top", isTextBox: true, margin: 0 });
  });
  s.addNotes(
    "Read the weak one first and let them say what is wrong before you read the orange note.\n\n" +
      "First pair: 'fun' and 'cool stuff' tell you nothing. The strong one names the type, the verbs, and the feeling.\n\n" +
      "Second pair: 'like a game everyone plays' borrows someone else's idea and does not say what yours is. Our games are original, so say what yours is.",
  );
}

/* ------------------------------------------------------------ buildable in 6 weeks */
{
  const s = content("Can it be made in six weeks?", "Day 4 · Scope");
  const rules = [
    ["1", "One hero", "One character the player controls. Not a team of twelve."],
    ["1", "One core loop", "3 or 4 verbs. Not five different mini-games."],
    ["3", "Three levels", "The same loop, getting harder. Not an open world."],
  ];
  const { w: cw, x: colX } = grid(3);
  rules.forEach(([n, t, d], i) => {
    const x = colX(i);
    card(s, { x, y: 1.85, w: cw, h: 3.4 });
    s.addText(n, { x, y: 2.0, w: cw, h: 1.4, fontFace: PIX, fontSize: 88, bold: true, color: [ORANGE, MAROON, "1F6F78"][i], align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(t, { x: x + 0.3, y: 3.45, w: cw - 0.6, h: 0.5, fontFace: H, fontSize: 23, bold: true, color: MAROON, align: "center", isTextBox: true, margin: 0 });
    s.addText(d, { x: x + 0.3, y: 4.0, w: cw - 0.6, h: 1.1, fontFace: B, fontSize: 16, color: INK, lineSpacing: 22, align: "center", valign: "top", isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 5.55, w: CW, h: 1.2, fill: "FBEDE8" });
  body(s, [
    { text: "Real studios call this scope. ", options: { bold: true, color: ORANGE } },
    { text: "A small game that is finished and fun beats a huge game that is half made. You can always add more in version 2.", options: {} },
  ], { x: M + 0.35, y: 5.72, w: CW - 0.7, h: 0.95, fontSize: 18, lineSpacing: 25 });
  s.addNotes(
    "This is the slide that saves the unit. Sixth graders will pitch open-world multiplayer epics. Celebrate the ambition, then shrink it: one hero, one loop, three levels.\n\n" +
      "The word to teach is SCOPE. Producers protect the scope: when someone says 'and also a boss fight and a shop and online mode', the Producer says 'version 2'.\n\n" +
      "Practice: students write their pitch and say it to a partner in under 60 seconds. The partner checks the three rules.",
  );
}

/* ================================================================== DAY 5 */
dayDivider(5, "Pitch day", "Sixty seconds each. Then teams form around the games people most want to make.",
  "Day 5. Today: pitches, team forming, studio names, and a look at next week.\n\n" +
    "Have a timer ready and the board split into columns, one per pitch, so students can sign up by initials later.");

/* ------------------------------------------------------------ how pitch day runs */
{
  const s = content("How pitch day works", "Day 5 · Pitch day");
  const steps = [
    ["60 seconds", "Stand up and give your pitch: the sentence, then your loop and your win and lose conditions."],
    ["One question each", "The class asks one question per pitch. Good questions: How do you lose? Who is it for? What does level 3 look like?"],
    ["Clap it out", "Every pitch gets the same applause. Being brave enough to pitch is the point."],
  ];
  steps.forEach(([t, d], i) => {
    const y = 1.85 + i * 1.45;
    card(s, { x: M, y, w: CW, h: 1.25 });
    numberDot(s, i + 1, M + 0.3, y + 0.33, { size: 0.6, fontSize: 20, fill: [ORANGE, MAROON, "1F6F78"][i] });
    s.addText(t, { x: M + 1.15, y, w: 3.3, h: 1.25, fontFace: H, fontSize: 22, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(d, { x: M + 4.5, y, w: CW - 4.8, h: 1.25, fontFace: B, fontSize: 16.5, color: INK, lineSpacing: 22, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Listeners: you are about to choose a team. Listen for the game you would want to work on for five weeks.", { x: M, y: 6.35, w: CW, h: 0.6, fontSize: 17, bold: true, color: ORANGE });
  s.addNotes(
    "With about 18 students, 60 seconds plus one question is roughly 25 minutes. Keep it moving with a visible timer.\n\n" +
      "Not everyone has to pitch if they are not ready; anyone may pitch. Shy students can pitch in pairs.\n\n" +
      "Write each pitched game's name on the board as it goes, so the next slide has columns to join.",
  );
}

/* ------------------------------------------------------------ forming teams */
{
  const s = content("Form your studio", "Day 5 · Teams");
  const rules = [
    ["Pick a game, not your friends", "Choose the pitch you most want to build. Write your initials under it."],
    ["3 or 4 per studio", "Popular games may split into two studios, or merge with a similar pitch."],
    ["The pitcher is not the boss", "Everyone rotates roles. The pitcher's idea becomes the team's idea."],
    ["Merge ideas on purpose", "Two pitches can become one game. Keep the best loop and the best feeling."],
  ];
  const { w: cw, x: colX } = grid(2, 0.4);
  rules.forEach(([t, d], i) => {
    const x = colX(i % 2);
    const y = 1.85 + Math.floor(i / 2) * 2.1;
    card(s, { x, y, w: cw, h: 1.85 });
    numberDot(s, i + 1, x + 0.3, y + 0.3);
    s.addText(t, { x: x + 0.95, y: y + 0.25, w: cw - 1.2, h: 0.55, fontFace: H, fontSize: 20, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(d, { x: x + 0.3, y: y + 0.9, w: cw - 0.6, h: 0.85, fontFace: B, fontSize: 16, color: INK, lineSpacing: 21, valign: "top", isTextBox: true, margin: 0 });
  });
  body(s, "Your teacher has the final say, so every studio is balanced and every game gets made.", { x: M, y: 6.2, w: CW, h: 0.5, fontSize: 16, color: MUTED });
  s.addNotes(
    "Students sign up by initials under the game they want, on the board. Then you balance: split games with 6 fans into two studios, merge similar pitches, and move anyone who chose by friendship rather than game.\n\n" +
      "A pitch nobody joins is fine. Thank that student; their idea can become a level or a mechanic in the game they join.\n\n" +
      "Aim for 5 or 6 studios of 3 or 4.",
  );
}

/* ------------------------------------------------------------ studio name */
{
  const s = content("Name your studio", "Day 5 · Studio name");
  const ex = ["Pixel Pickle Games", "Night Owl Studio", "Dragon Byte", "Purple Rocket Works"];
  ex.forEach((n, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * ((CW + 0.4) / 2);
    const y = 1.95 + row * 1.35;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: (CW - 0.4) / 2, h: 1.1, rectRadius: 0.12, fill: { color: [NIGHT, MAROON, "1F6F78", ORANGE][i] }, line: { width: 0 } });
    s.addText(n, { x, y, w: (CW - 0.4) / 2, h: 1.1, fontFace: PIX, fontSize: 24, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 4.85, w: CW, h: 1.55, fill: "FBEDE8" });
  body(s, [
    { text: "The rules: ", options: { bold: true, color: MAROON } },
    { text: "no real names, no real companies, and nothing you would not say in front of the principal. Your studio name is what you type on ", options: {} },
    { text: STUDIO, options: { bold: true, fontFace: PIX } },
    { text: " and what shows on /play.", options: {} },
  ], { x: M + 0.35, y: 5.05, w: CW - 0.7, h: 1.2, fontSize: 18, lineSpacing: 26 });
  s.addNotes(
    "These are examples only, made up. Give studios three minutes to agree on a name.\n\n" +
      "The name matters because it is the team name the site uses, the same way Launch Pad team names worked: no student names, ever, because it shows up on a public page.\n\n" +
      "Collect the names and periods on paper too, in case anyone forgets what they typed.",
  );
}

/* ------------------------------------------------------------ next week */
{
  const s = dark(NIGHT);
  [[1.0, 6.5, NEON], [4.2, 0.6, MINT], [11.9, 6.4, SKY], [12.3, 0.9, ORANGE]].forEach(([x, y, c]) => {
    s.addShape(pres.ShapeType.rect, { x, y, w: 0.14, h: 0.14, fill: { color: c }, line: { width: 0 } });
  });
  s.addText("NEXT WEEK  ·  WEEK 2", { x: M, y: 1.0, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: NEON, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Write your game down.", { x: M, y: 1.4, w: CW, h: 1.0, fontFace: H, fontSize: 48, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  const items = [
    ["The feeling", "The player feels ____, because ____."],
    ["Players", "At least two types, and what each wants."],
    ["Core loop", "Your verbs, plus how you win and lose."],
    ["World and story", "The hero, the goal, what stands in the way."],
    ["Mechanics", "The controls and the rules."],
  ];
  items.forEach(([t, d], i) => {
    const y = 2.65 + i * 0.66;
    numberDot(s, i + 1, M, y + 0.05, { size: 0.46, fontSize: 15, fill: [ORANGE, NEON, MINT, SKY, PINK][i], color: NIGHT });
    s.addText(t, { x: M + 0.7, y, w: 3.2, h: 0.56, fontFace: B, fontSize: 19, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(d, { x: M + 3.9, y, w: CW - 3.9, h: 0.56, fontFace: B, fontSize: 17, color: "DCD3F0", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 6.2, w: CW, h: 0.85, rectRadius: 0.09, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText([
    { text: "Your design doc lives at:  ", options: { bold: true } },
    { text: STUDIO, options: { bold: true, fontFace: PIX } },
  ], { x: M + 0.35, y: 6.2, w: CW - 0.7, h: 0.85, fontFace: B, fontSize: 22, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    "Close the week here. Everything they did this week has a box waiting in the design doc: the feeling (Day 3), players (Day 3), the core loop and win/lose (Day 2), plus two new parts next week: world and story, and mechanics.\n\n" +
      "Say: the clearer your design doc, the better the playable build Double Blaze makes from it at the end of week 3.\n\n" +
      "Before Monday, check that every studio name is written down with its period.",
  );
}

pres.writeFile({ fileName: __dirname + "/Game-Studio-Week-1.pptx" }).then((f) => console.log("wrote", f));
