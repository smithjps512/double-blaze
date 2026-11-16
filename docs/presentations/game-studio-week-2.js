/**
 * Game Studio, week 2 (days 6 to 10): write your game down.
 *
 * Studios formed on day 5. This week each studio fills its design doc in
 * Game Studio one tab a day: Pitch and Players, Core loop, World, Mechanics,
 * then plays the game on paper with another studio. The slides follow
 * docs/lessons/game-studio/day-6.md to day-10.md: a divider, the teacher's
 * Watch demo with Demo Studio (Bolt the robot), and the studio's Do list.
 *
 * Same family as game-studio-week-1.js (the helpers are copied from it).
 * Speaker notes on every slide. No real game brands. No em dashes.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node game-studio-week-2.js
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
pres.title = "Game Studio, week 2";

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
  s.addText(`GAME STUDIO  ·  WEEK 2  ·  DAY ${day} OF 30`, {
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


/** The studio's work for the day: numbered steps, a stuck tip and done-when. */
function yourTurn(day, title, steps, stuck, done, notes) {
  const s = content(title, `Day ${day} · Your studio (25 to 30 minutes)`);
  steps.forEach(([who, text], i) => {
    const y = 1.75 + i * 0.66;
    numberDot(s, i + 1, M, y + 0.06, { size: 0.46, fontSize: 15, fill: [ORANGE, NEON, MINT, SKY, MAROON, ORANGE][i], color: i === 1 || i === 2 ? NIGHT : WHITE });
    s.addText([
      ...(who ? [{ text: who + "  ", options: { bold: true, color: ORANGE } }] : []),
      { text, options: { color: INK } },
    ], { x: M + 0.7, y, w: 7.6, h: 0.58, fontFace: B, fontSize: 16, valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, { x: 9.15, y: 1.75, w: W - M - 9.15, h: 2.1, fill: "FFF8EC" });
  s.addText("STUCK?", { x: 9.4, y: 1.9, w: 3, h: 0.3, fontFace: PIX, fontSize: 13, bold: true, color: ORANGE, isTextBox: true, margin: 0 });
  s.addText(stuck, { x: 9.4, y: 2.25, w: W - M - 9.65, h: 1.5, fontFace: B, fontSize: 14.5, color: INK, lineSpacing: 20, valign: "top", isTextBox: true, margin: 0 });
  card(s, { x: 9.15, y: 4.05, w: W - M - 9.15, h: 2.6, fill: NIGHT });
  s.addText("DONE WHEN", { x: 9.4, y: 4.2, w: 3, h: 0.3, fontFace: PIX, fontSize: 13, bold: true, color: MINT, isTextBox: true, margin: 0 });
  s.addText(done, { x: 9.4, y: 4.55, w: W - M - 9.65, h: 2.0, fontFace: B, fontSize: 15, bold: true, color: WHITE, lineSpacing: 21, valign: "top", isTextBox: true, margin: 0 });
  s.addNotes(notes);
  return s;
}

/** A labelled box from a Game Studio tab, filled in. */
function field(s, label, value, { x, y, w, h = 1.05, hot = false }) {
  card(s, { x, y, w, h, fill: hot ? "FFF1E0" : WHITE });
  s.addText(label.toUpperCase(), { x: x + 0.22, y: y + 0.12, w: w - 0.44, h: 0.28, fontFace: B, fontSize: 11.5, bold: true, color: hot ? ORANGE : MUTED, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText(value, { x: x + 0.22, y: y + 0.4, w: w - 0.44, h: h - 0.5, fontFace: B, fontSize: 16, color: INK, valign: "top", isTextBox: true, margin: 0 });
}

/** Side-by-side weak vs strong. */
function weakStrong(s, weak, strong, { y = 1.9, h = 2.4 } = {}) {
  const { w: cw, x: colX } = grid(2, 0.4);
  [[weak, "WEAK", "B5544A", "✗"], [strong, "STRONG", "1E8A5A", "✓"]].forEach(([[head, text, why], tag, col, mark], i) => {
    const x = colX(i);
    card(s, { x, y, w: cw, h });
    s.addShape(pres.ShapeType.rect, { x, y, w: 0.12, h, fill: { color: col }, line: { width: 0 } });
    s.addText(`${mark}  ${tag}`, { x: x + 0.35, y: y + 0.18, w: 3, h: 0.32, fontFace: PIX, fontSize: 14, bold: true, color: col, isTextBox: true, margin: 0 });
    s.addText(head, { x: x + 0.35, y: y + 0.55, w: cw - 0.6, h: 0.4, fontFace: B, fontSize: 13, bold: true, color: MUTED, isTextBox: true, margin: 0 });
    s.addText(text, { x: x + 0.35, y: y + 0.95, w: cw - 0.6, h: h - 1.75, fontFace: H, fontSize: 21, color: INK, valign: "top", isTextBox: true, margin: 0 });
    s.addText(why, { x: x + 0.35, y: y + h - 0.75, w: cw - 0.6, h: 0.6, fontFace: B, fontSize: 14, italic: true, color: col, valign: "top", isTextBox: true, margin: 0 });
  });
}

function bigLine(s, text, y = 6.35) {
  body(s, text, { x: M, y, w: CW, h: 0.7, fontSize: 18, bold: true, color: ORANGE });
}

/* ------------------------------------------------------------------ title */
{
  const s = dark(NIGHT);
  const tabs = ["Pitch", "Players", "Core loop", "World", "Mechanics"];
  tabs.forEach((t, i) => {
    const y = 1.05 + i * 1.0;
    s.addShape(pres.ShapeType.roundRect, { x: 8.9, y, w: 3.7, h: 0.78, rectRadius: 0.1, fill: { color: NIGHT2 }, line: { color: [ORANGE, NEON, MINT, SKY, PINK][i], width: 2 } });
    s.addText(["6", "6", "7", "8", "9"][i], { x: 9.05, y, w: 0.6, h: 0.78, fontFace: PIX, fontSize: 18, bold: true, color: [ORANGE, NEON, MINT, SKY, PINK][i], valign: "middle", isTextBox: true, margin: 0 });
    s.addText(t, { x: 9.7, y, w: 2.8, h: 0.78, fontFace: B, fontSize: 20, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addText("10   Paper prototype", { x: 9.05, y: 6.05, w: 3.6, h: 0.5, fontFace: PIX, fontSize: 15, bold: true, color: "B9AEDA", isTextBox: true, margin: 0 });
  s.addText("GAME STUDIO  ·  PERIOD 3  ·  WEEK 2", { x: M, y: 1.9, w: 7.6, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: NEON, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Write your\ngame down.", { x: M, y: 2.32, w: 7.8, h: 2.1, fontFace: H, fontSize: 54, bold: true, color: WHITE, lineSpacing: 60, isTextBox: true, margin: 0 });
  s.addText("This week your studio fills in its design doc, one tab a day. On Friday, another studio plays your game on paper.", {
    x: M, y: 4.65, w: 7.6, h: 1.1, fontFace: B, fontSize: 18, color: "DCD3F0", lineSpacing: 26, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Open here on Day 6. This deck runs all of week 2. Each day starts with its own Day slide: about ten minutes of slides, then the studios work.\n\n" +
      "The right side is the week: one Game Studio tab a day, then a paper prototype on Day 10.\n\n" +
      "Before class: Game Studio open on the projector, period 3, studio name Demo Studio. Nothing you type there touches a real studio.",
  );
}

/* ------------------------------------------------------------ the doc is the game */
{
  const s = dark(MAROON);
  s.addText("THIS WEEK'S BIG IDEA", { x: M, y: 1.7, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("The design doc is the game.", { x: M, y: 2.1, w: CW, h: 1.2, fontFace: H, fontSize: 50, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  s.addText("If it is not in the doc, Double Blaze cannot build it. At the end of week 3, your doc becomes a game you can play. The clearer you write, the better it plays.", {
    x: M, y: 3.55, w: 8.8, h: 1.6, fontFace: B, fontSize: 22, color: "F3E3EA", lineSpacing: 31, valign: "top", isTextBox: true, margin: 0,
  });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 5.55, w: 7.2, h: 0.85, rectRadius: 0.09, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText([{ text: "Game Studio:  ", options: { bold: true } }, { text: STUDIO, options: { bold: true, fontFace: PIX } }], {
    x: M + 0.35, y: 5.55, w: 6.8, h: 0.85, fontFace: B, fontSize: 21, color: WHITE, valign: "middle", isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Say it twice: the design doc is the game. Same as their apps: what they wrote is what got built.\n\n" +
      "Remind them it saves by itself, and everyone in a studio types the same studio name to open the same doc.",
  );
}

/* ================================================================== DAY 6 */
dayDivider(6, "Pitch and Players", "Your studio signs in to Game Studio and writes the first two tabs: what your game is, and who it is for.",
  "Day 6. Roles rotate today, so start with that slide.\n\nWatch (5 to 10 minutes): open Demo Studio, fill the Pitch tab and the Players tab on the projector. Nobody types until you are done.");

{
  const s = content("New week, new jobs", "Day 6 · Roles rotate every Monday");
  const roles = [
    ["🎯", "Producer", "Types in Game Studio. Says what is done.", "“Is it done?”"],
    ["🎨", "Game Designer", "Leads Players and Mechanics. Balance and fun.", "“Is it fun?”"],
    ["💻", "Developer", "Asks if somebody could build it from what we wrote.", "“Could we build this?”"],
    ["🐞", "QA Lead", "Asks what happens when the player does something weird.", "“What if…?”"],
  ];
  const { w: cw, x: colX } = grid(4, 0.3);
  roles.forEach(([icon, name, what, asks], i) => {
    const x = colX(i);
    card(s, { x, y: 1.85, w: cw, h: 3.7, fill: i % 2 ? WHITE : "FFF8EC" });
    s.addText(icon, { x: x + 0.25, y: 2.0, w: 0.9, h: 0.8, fontFace: B, fontSize: 34, isTextBox: true, margin: 0 });
    s.addText(name, { x: x + 0.25, y: 2.85, w: cw - 0.5, h: 0.5, fontFace: H, fontSize: 22, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(what, { x: x + 0.25, y: 3.4, w: cw - 0.5, h: 1.2, fontFace: B, fontSize: 15, color: INK, lineSpacing: 20, valign: "top", isTextBox: true, margin: 0 });
    s.addText(asks, { x: x + 0.25, y: 4.7, w: cw - 0.5, h: 0.6, fontFace: H, fontSize: 18, italic: true, color: ORANGE, isTextBox: true, margin: 0 });
  });
  body(s, "Take the next role on your card. Studio of 3? The Producer is also QA Lead.", { x: M, y: 5.85, w: CW, h: 0.5, fontSize: 18, bold: true, color: MAROON });
  body(s, "Warm up: the new Producer says your pitch out loud from the index card.", { x: M, y: 6.4, w: CW, h: 0.5, fontSize: 17, color: MUTED });
  s.addNotes("Give everyone a minute to move to the next role on their card. Then the new Producer of each studio says the pitch out loud. That is the Again for today.");
}

{
  const s = content("Open your studio", "Day 6 · Watch first");
  const steps = [
    ["Go to", STUDIO],
    ["Pick", "Period 3"],
    ["Type", "your studio name, the same on every Chromebook"],
    ["Open", "it. The Producer types, everyone else reads along and presses Refresh."],
  ];
  steps.forEach(([verb, what], i) => {
    const y = 1.9 + i * 0.95;
    numberDot(s, i + 1, M, y + 0.1, { size: 0.6, fontSize: 20 });
    s.addText([{ text: verb + "  ", options: { bold: true, color: MAROON } }, { text: what, options: { color: INK, fontFace: i === 0 ? PIX : B } }], {
      x: M + 0.85, y, w: CW - 0.85, h: 0.8, fontFace: B, fontSize: 22, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  card(s, { x: M, y: 5.8, w: CW, h: 0.9, fill: NIGHT });
  s.addText("It saves by itself. Watch the save message in the corner.", { x: M + 0.35, y: 5.8, w: CW - 0.7, h: 0.9, fontFace: B, fontSize: 19, bold: true, color: MINT, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes("Do this live with Demo Studio. Point out that one person types so the doc does not fight itself; the others press Refresh to see it.\n\nStudio names only, never a real name.");
}

{
  const s = content("The Pitch tab", "Day 6 · Demo Studio");
  const { w: cw, x: colX } = grid(2, 0.36);
  field(s, "Game name", "Bolt's Way Home", { x: colX(0), y: 1.8, w: cw });
  field(s, "Genre", "Platformer", { x: colX(1), y: 1.8, w: cw });
  field(s, "One-liner", "It's a platformer game where you guide a small robot across a junkyard before its battery dies.", { x: M, y: 3.05, w: CW, h: 1.2 });
  field(s, "The feeling  (the purpose)", "Brave, and a little in a hurry.", { x: M, y: 4.45, w: CW, h: 1.2, hot: true });
  bigLine(s, "The feeling box is the most important box on this tab. Every other tab serves it.", 5.95);
  s.addNotes("Fill these in on the projector from a pitch card. Say: the feeling box is the purpose. It is the game version of 'purpose is impact' from Launch Pad.\n\nIf the feeling box says what the game is ('a game about robots'), the hint under it will ask for a feeling word. Show that.");
}

{
  const s = content("The Players tab", "Day 6 · Two or more kinds of player");
  const players = [
    ["Explorers", "want to find secret areas behind the junk piles."],
    ["Competitors", "want the fastest time to get home."],
    ["A parent", "wants it to be fair, short, and not scary. They say yes."],
  ];
  players.forEach(([who, wants], i) => {
    const y = 1.85 + i * 1.2;
    card(s, { x: M, y, w: 8.4, h: 1.0, fill: i === 2 ? "FFF1E0" : WHITE });
    s.addText([{ text: who + "  ", options: { bold: true, color: MAROON } }, { text: wants, options: { color: INK } }], {
      x: M + 0.3, y, w: 7.9, h: 1.0, fontFace: B, fontSize: 19, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  card(s, { x: 9.5, y: 1.85, w: W - M - 9.5, h: 3.4, fill: NIGHT });
  s.addText("ALWAYS MORE THAN ONE USER", { x: 9.75, y: 2.05, w: 2.9, h: 0.6, fontFace: PIX, fontSize: 13, bold: true, color: NEON, isTextBox: true, margin: 0 });
  s.addText("Different players want different things from the same game. A good level gives each of them something.", {
    x: 9.75, y: 2.75, w: W - M - 10, h: 2.3, fontFace: B, fontSize: 16, color: WHITE, lineSpacing: 22, valign: "top", isTextBox: true, margin: 0,
  });
  bigLine(s, "QA Lead asks: what would make a parent say no?", 5.75);
  s.addNotes("Add two player types, then read the hint that shows up when there is only one. Add the person who says yes as a third.\n\nThese player types come back in week 3: every level will be a story for one of them.");
}

yourTurn(6, "Pitch and Players",
  [
    ["Producer", "says the pitch. Agree on the exact one-liner."],
    ["Producer", "signs in: period 3, your studio name."],
    ["", "Pitch tab: game name, one-liner, the feeling, genre."],
    ["Game Designer", "leads Players: 2 or more types, one sentence each."],
    ["QA Lead", "asks: what would make a parent say no?"],
    ["", "Read Pitch and Players to the studio next to you."],
  ],
  "The hints under each box say what is missing. Read them out loud before asking.",
  "Pitch tab full.\nPlayers tab has 2 or more player types, a sentence each.",
  "Leave this up while studios work. Walk the room and read feeling boxes; push for a feeling word, not a description.\n\nTomorrow adds: the Core loop tab.");

/* ================================================================== DAY 7 */
dayDivider(7, "Core loop, win and lose", "The verbs your player repeats a hundred times, plus how they win and how they lose.",
  "Day 7. Again (5 min): open your studio, the Producer reads the feeling out loud, then name your player types without looking.\n\nWatch: fill Demo Studio's Core loop tab.");

{
  const s = content("The Core loop tab", "Day 7 · Demo Studio");
  loop(s, ["Run", "Collect", "Dodge"], { cx: 3.4, cy: 4.25, r: 1.6 });
  s.addShape(pres.ShapeType.roundRect, { x: 3.4 - 0.8, y: 4.25 - 1.6 - 0.75, w: 1.6, h: 0.36, rectRadius: 0.18, fill: { color: NEON }, line: { width: 0 } });
  s.addText("★ CORE VERB", { x: 3.4 - 0.8, y: 4.25 - 1.6 - 0.75, w: 1.6, h: 0.36, fontFace: PIX, fontSize: 11, bold: true, color: NIGHT, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  field(s, "How you win", "Reach the trophy at the end of level 3.", { x: 6.6, y: 1.85, w: W - M - 6.6, h: 1.15 });
  field(s, "How you lose", "Run out of 3 hearts.", { x: 6.6, y: 3.2, w: W - M - 6.6, h: 1.15 });
  card(s, { x: 6.6, y: 4.55, w: W - M - 6.6, h: 1.4, fill: NIGHT });
  s.addText("No way to lose means no tension. Tension is part of the feeling.", { x: 6.85, y: 4.55, w: W - M - 7.1, h: 1.4, fontFace: B, fontSize: 18, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  bigLine(s, "3 or 4 verbs, in the order they repeat. Star the core verb: the one you protect.", 6.3);
  s.addNotes("Type run, collect, dodge and read them as a loop: run, collect, dodge, run again.\n\nThen the win and the lose. Both must be something a player could see on the screen.\n\nThe core verb: put it first and star it on your index card. It is the one verb the game cannot lose.");
}

{
  const s = content("Win and lose: can you see it?", "Day 7 · On the screen");
  weakStrong(s,
    ["How you win", "“You win when you are good at it.”", "Nobody can see 'good at it' on the screen."],
    ["How you win", "“Reach the trophy at the end of level 3 with at least 1 heart.”", "You can point at the moment it happens."],
    { y: 1.85, h: 2.35 });
  body(s, "Then test the loop against the feeling:", { x: M, y: 4.5, w: CW, h: 0.5, fontSize: 19, bold: true, color: MAROON });
  card(s, { x: M, y: 5.05, w: CW, h: 1.1, fill: "FFF8EC" });
  s.addText("Does run, collect, dodge make you feel brave and in a hurry? If not, which verb would?", {
    x: M + 0.35, y: 5.05, w: CW - 0.7, h: 1.1, fontFace: H, fontSize: 22, italic: true, color: INK, valign: "middle", isTextBox: true, margin: 0,
  });
  bigLine(s, "The loop is what the player does a hundred times. Win and lose are why they care.", 6.35);
  s.addNotes("Ask the class to fix the weak one out loud before you show the strong one.\n\nThe feeling test is the QA Lead's job today: does the loop give the feeling on the Pitch tab?");
}

yourTurn(7, "Core loop, win and lose",
  [
    ["", "Open your studio. Are Pitch and Players still right?"],
    ["Game Designer", "leads: 3 or 4 verbs in the order they repeat."],
    ["", "Star your core verb."],
    ["", "How you win: something you can see on the screen."],
    ["", "How you lose: something you can see on the screen."],
    ["QA Lead", "asks: does this loop give our feeling? If not, change a verb."],
  ],
  "Say what the player does in the first ten seconds of the game. Those are usually your verbs.",
  "Core loop tab has 3 or 4 verbs, a starred core verb, a win and a lose.",
  "Walk the room and listen for nouns pretending to be verbs ('coins' is not a verb; 'collect coins' is).\n\nTomorrow adds: the World tab.");

/* ================================================================== DAY 8 */
dayDivider(8, "World and story", "Your hero, their goal, what stands in the way, and a short story that gives the verbs a reason.",
  "Day 8. Again (5 min): say your core loop as verbs, out loud, as a studio, in order. Say how you win and how you lose.\n\nWatch: fill Demo Studio's World tab.");

{
  const s = content("The World tab", "Day 8 · Demo Studio");
  const { w: cw, x: colX } = grid(4, 0.26);
  [["Hero", "A small robot named Bolt"], ["Goal", "Get home before the battery dies"], ["Obstacle", "A junkyard full of magnets"], ["Setting", "A city dump at night"]].forEach(([l, v], i) => {
    field(s, l, v, { x: colX(i), y: 1.85, w: cw, h: 1.45 });
  });
  field(s, "Story intro  (2 or 3 sentences)", "Bolt fell off the truck on the way to the recycling plant. Now Bolt has to cross the junkyard before the battery runs out.", { x: M, y: 3.55, w: CW, h: 1.5, hot: true });
  card(s, { x: M, y: 5.3, w: CW, h: 0.95, fill: "FFF8EC" });
  s.addText([{ text: "Stuck on the intro?  ", options: { bold: true, color: ORANGE } }, { text: "One day, ___.  Now ___ has to ___.", options: { color: INK, fontFace: H, italic: true } }], {
    x: M + 0.35, y: 5.3, w: CW - 0.7, h: 0.95, fontFace: B, fontSize: 20, valign: "middle", isTextBox: true, margin: 0,
  });
  s.addNotes("Fill in the four boxes, then type the two-sentence intro.\n\nIn studios, somebody who is not the Producer says the first draft out loud while the Producer types.");
}

{
  const s = content("A good story gives the verbs a reason", "Day 8 · Story and loop agree");
  const pairs = [["Collect", "because the battery is dying"], ["Dodge", "because the magnets pull Bolt in"], ["Run", "because there is no time"]];
  pairs.forEach(([v, why], i) => {
    const y = 1.85 + i * 0.95;
    s.addShape(pres.ShapeType.roundRect, { x: M, y, w: 1.9, h: 0.72, rectRadius: 0.36, fill: { color: ORANGE }, line: { width: 0 } });
    s.addText(v, { x: M, y, w: 1.9, h: 0.72, fontFace: B, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(why, { x: M + 2.15, y, w: 5.2, h: 0.72, fontFace: B, fontSize: 19, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, { x: 8.3, y: 1.85, w: W - M - 8.3, h: 2.6, fill: NIGHT });
  s.addText("✗  STORY FIGHTS THE LOOP", { x: 8.55, y: 2.0, w: 4, h: 0.35, fontFace: PIX, fontSize: 12, bold: true, color: "FF8A7A", isTextBox: true, margin: 0 });
  s.addText("“A peaceful garden where nothing ever happens”\n…in a dodging game.\nWhat feels wrong?", {
    x: 8.55, y: 2.45, w: W - M - 8.8, h: 1.9, fontFace: B, fontSize: 16, color: WHITE, lineSpacing: 22, valign: "top", isTextBox: true, margin: 0,
  });
  body(s, "Developer asks: can every part of the world be drawn on one screen? If not, which part comes first?", { x: M, y: 5.0, w: CW, h: 0.8, fontSize: 18, color: MAROON, bold: true });
  bigLine(s, "If the story and the loop disagree, the player feels it.", 6.2);
  s.addNotes("Point at how the story explains the loop. Then the garden: ask the class what feels wrong (why would I dodge in a peaceful garden?).\n\nThe Developer's question keeps the world buildable.");
}

yourTurn(8, "World and story",
  [
    ["", "Open your studio. Read the Core loop out loud."],
    ["", "World tab: hero, goal, obstacle, setting."],
    ["", "Story intro, 2 or 3 sentences. A non-Producer says it, the Producer types."],
    ["", "For each verb: why does the hero do this? No reason? Change one."],
    ["Developer", "asks: can it all fit on one screen? What comes first?"],
  ],
  "Start the intro with “One day, ___” and end it with “Now ___ has to ___.”",
  "World tab full.\nThe story gives at least 2 of your verbs a reason.",
  "Read a few intros out loud at the end if there is time.\n\nTomorrow adds: the Mechanics tab.");

/* ================================================================== DAY 9 */
dayDivider(9, "Mechanics", "Every verb gets a name, its controls, and a rule that says exactly what happens.",
  "Day 9. Again (5 min): read your story intro out loud. Name the core verb and say why the hero does it.\n\nWatch: fill Demo Studio's Mechanics tab.");

{
  const s = content("A mechanic is a verb with a rule", "Day 9 · The Mechanics tab");
  const mechs = [
    ["Jump", "A button", "Bolt jumps 3 tiles high. Holding A does not jump higher."],
    ["Magnet pull", "none", "Within 4 tiles of a magnet, Bolt slides toward it at half speed."],
  ];
  mechs.forEach(([name, ctl, rule], i) => {
    const y = 1.85 + i * 1.75;
    card(s, { x: M, y, w: CW, h: 1.5 });
    s.addText(name, { x: M + 0.3, y: y + 0.15, w: 3, h: 0.5, fontFace: H, fontSize: 24, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText([{ text: "CONTROLS  ", options: { bold: true, color: MUTED, fontSize: 12 } }, { text: ctl, options: { color: INK } }], { x: M + 0.3, y: y + 0.75, w: 3, h: 0.5, fontFace: B, fontSize: 17, isTextBox: true, margin: 0 });
    s.addText([{ text: "RULE  ", options: { bold: true, color: ORANGE, fontSize: 12 } }, { text: rule, options: { color: INK } }], { x: M + 3.6, y: y + 0.15, w: CW - 3.9, h: 1.2, fontFace: B, fontSize: 19, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Some mechanics are not buttons. They are rules the world follows: gravity, enemies, a timer.", { x: M, y: 5.5, w: CW, h: 0.6, fontSize: 18, color: MAROON, bold: true });
  bigLine(s, "A rule says exactly what happens.", 6.2);
  s.addNotes("Add Jump, then Magnet pull. Point out Magnet pull has no button: it is a rule the world follows.\n\nEvery rule has a number in it: 3 tiles, 4 tiles, half speed.");
}

{
  const s = content("The two-builder test", "Day 9 · Would two people build the same thing?");
  weakStrong(s,
    ["Cool power  ·  B button", "“Does something awesome.”", "What would a builder build? Nothing."],
    ["Dash  ·  B button", "“Bolt moves 3 tiles forward fast. Works once every 2 seconds.”", "Two builders would build the same dash."],
    { y: 1.85, h: 2.6 });
  card(s, { x: M, y: 4.75, w: CW, h: 1.2, fill: NIGHT });
  s.addText([{ text: "PUT A NUMBER IN EVERY RULE:  ", options: { color: NEON, fontFace: PIX, bold: true, fontSize: 16 } }, { text: "tiles, seconds, hearts, points, how high, how fast, how many.", options: { color: WHITE } }], {
    x: M + 0.35, y: 4.75, w: CW - 0.7, h: 1.2, fontFace: B, fontSize: 19, valign: "middle", isTextBox: true, margin: 0,
  });
  bigLine(s, "If two builders would build it two different ways, the rule is not finished.", 6.25);
  s.addNotes("Show the weak one and ask what a builder would build from it. Then the strong one.\n\nThis is the same idea as checks on Launch Pad: something you could test.");
}

yourTurn(9, "Mechanics",
  [
    ["", "Open your studio. Fix World or Core loop if anything changed."],
    ["", "One mechanic for every loop verb: name, controls, rule."],
    ["", "Add at least one rule the world follows (gravity, enemies, a timer)."],
    ["Developer", "reads each rule and draws what they would build."],
    ["Game Designer", "says if the drawing is right. Wrong? Rewrite it with numbers."],
  ],
  "Put a number in every rule: tiles, seconds, hearts, points.",
  "3 or more mechanics, each with controls and a rule with a number or a clear yes or no.",
  "The drawing step is the heart of today: it is the two-builder test for real. Have scrap paper on desks.\n\nTomorrow: paper prototypes. Bring sticky notes, index cards and markers.");

/* ================================================================= DAY 10 */
dayDivider(10, "Paper prototype", "No screens. Another studio plays your game on paper, and you find out what your doc forgot.",
  "Day 10. Again (5 min): read your mechanics out loud as a list, name and rule.\n\nWatch: play Demo Studio's game on paper with a volunteer. You are the computer.\n\nMaterials: sticky notes, index cards, markers, paper.");

{
  const s = content("Your game, on paper", "Day 10 · The kit");
  const kit = [["📄", "Paper", "one level, drawn"], ["🟨", "Sticky note", "the hero"], ["🗂️", "Index cards", "enemies and obstacles"], ["🔴", "Marker dots", "coins and pickups"]];
  const { w: cw, x: colX } = grid(4, 0.3);
  kit.forEach(([icon, t, d], i) => {
    const x = colX(i);
    card(s, { x, y: 1.85, w: cw, h: 2.3 });
    s.addText(icon, { x, y: 2.0, w: cw, h: 0.8, fontFace: B, fontSize: 36, align: "center", isTextBox: true, margin: 0 });
    s.addText(t, { x, y: 2.85, w: cw, h: 0.5, fontFace: H, fontSize: 21, bold: true, color: MAROON, align: "center", isTextBox: true, margin: 0 });
    s.addText(d, { x, y: 3.35, w: cw, h: 0.5, fontFace: B, fontSize: 16, color: INK, align: "center", isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 4.45, w: CW, h: 1.45, fill: NIGHT });
  s.addText("You are the computer. The computer only does what the rules say.", { x: M + 0.35, y: 4.45, w: CW - 0.7, h: 1.45, fontFace: H, fontSize: 26, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  bigLine(s, "Paper is how studios test ideas before they spend time building.", 6.25);
  s.addNotes("Show Demo Studio's paper level. Play it with a volunteer: they move the hero, you read the rules from the Mechanics tab and move the enemies.\n\nStop when a rule does not cover what happened ('what if I jump on the magnet?'). Write it on the board. Say: that question is a gift. It is something the design doc forgot.");
}

{
  const s = content("The swap", "Day 10 · Who does what");
  const jobs = [
    ["Their player", "plays your game. Moves the hero."],
    ["Your QA Lead", "reads your rules out loud, word for word."],
    ["Your Developer", "moves the world: enemies, magnets, timers."],
    ["Everyone", "writes every “what if” on a sticky note."],
  ];
  jobs.forEach(([who, what], i) => {
    const y = 1.85 + i * 0.85;
    numberDot(s, i + 1, M, y + 0.08, { size: 0.55, fontSize: 18, fill: [ORANGE, NEON, MINT, SKY][i], color: i === 0 ? WHITE : NIGHT });
    s.addText([{ text: who + "  ", options: { bold: true, color: MAROON } }, { text: what, options: { color: INK } }], { x: M + 0.8, y, w: 7.4, h: 0.7, fontFace: B, fontSize: 19, valign: "middle", isTextBox: true, margin: 0 });
  });
  card(s, { x: 8.9, y: 1.85, w: W - M - 8.9, h: 3.2, fill: "FFF1E0" });
  s.addText("ONE RULE", { x: 9.15, y: 2.05, w: 3, h: 0.32, fontFace: PIX, fontSize: 14, bold: true, color: ORANGE, isTextBox: true, margin: 0 });
  s.addText("Nobody explains anything that is not written down.\n\nNot sure what the computer would do? Then it does nothing. Write that down as a gap.", {
    x: 9.15, y: 2.45, w: W - M - 9.4, h: 2.5, fontFace: B, fontSize: 16, color: INK, lineSpacing: 22, valign: "top", isTextBox: true, margin: 0,
  });
  bigLine(s, "Every “what if” you could not answer is a gap in your doc.", 5.6);
  s.addNotes("The no-explaining rule is what makes this work. If the player has to ask, the doc is missing something.");
}

{
  const s = content("After the swap: three questions", "Day 10 · Write these down");
  const qs = [["Fun", "What was fun?", MINT], ["Confusing", "What was confusing?", NEON], ["Forgotten", "What did our rules forget?", ORANGE]];
  const { w: cw, x: colX } = grid(3, 0.36);
  qs.forEach(([tag, q, c], i) => {
    const x = colX(i);
    card(s, { x, y: 1.85, w: cw, h: 2.9 });
    s.addShape(pres.ShapeType.rect, { x, y: 1.85, w: cw, h: 0.16, fill: { color: c }, line: { width: 0 } });
    s.addText(tag.toUpperCase(), { x: x + 0.3, y: 2.25, w: cw - 0.6, h: 0.35, fontFace: PIX, fontSize: 15, bold: true, color: MUTED, isTextBox: true, margin: 0 });
    s.addText(q, { x: x + 0.3, y: 2.7, w: cw - 0.6, h: 1.6, fontFace: H, fontSize: 26, bold: true, color: MAROON, valign: "top", isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 5.05, w: CW, h: 1.05, fill: NIGHT });
  s.addText("Then fix at least one mechanic in Game Studio because of what you saw.", { x: M + 0.35, y: 5.05, w: CW - 0.7, h: 1.05, fontFace: B, fontSize: 20, bold: true, color: MINT, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes("These are the same three questions on the board from the Watch. 'Forgotten' is the one that matters most for the doc.");
}

yourTurn(10, "Paper prototype",
  [
    ["Producer", "has the Mechanics tab on screen to read from."],
    ["", "Build it: one level on paper, the hero, the obstacles. 10 minutes."],
    ["", "Swap with the studio next to you. Their player plays."],
    ["", "Every “what if” goes on a sticky note."],
    ["", "Swap back. Answer: fun, confusing, forgotten."],
    ["", "Fix one mechanic in Game Studio."],
  ],
  "Not sure what the computer would do? The answer is: nothing. Write it down as a gap.",
  "3 answers written down.\nAt least 1 mechanic changed in Game Studio because of the playtest.",
  "Keep the 10 minute build tight; a rough level is fine. The swap is the point.\n\nCollect the three answers from each studio before they leave.");

/* ------------------------------------------------------------ next week */
{
  const s = dark(NIGHT);
  [[1.2, 6.6, NEON], [3.4, 0.5, MINT], [6.1, 6.9, SKY], [8.6, 0.7, ORANGE], [12.4, 6.2, MINT], [12.1, 1.3, NEON]].forEach(([x, y, c]) => {
    s.addShape(pres.ShapeType.rect, { x, y, w: 0.14, h: 0.14, fill: { color: c }, line: { width: 0 } });
  });
  s.addText("NEXT WEEK  ·  WEEK 3", { x: M, y: 1.0, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: NEON, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Levels as player stories.", { x: M, y: 1.4, w: CW, h: 1.0, fontFace: H, fontSize: 48, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  const items = [
    ["Level stories", "As a ___, I want to ___, so I can ___."],
    ["Checks", "How a builder would know each level works."],
    ["Scenarios", "Given, When, Then: a happy path and a bad day."],
    ["Done", "Your doc goes to Double Blaze to be built."],
  ];
  items.forEach(([t, d], i) => {
    const y = 2.75 + i * 0.75;
    numberDot(s, i + 1, M, y + 0.06, { size: 0.5, fontSize: 16, fill: [ORANGE, NEON, MINT, SKY][i], color: i === 0 ? WHITE : NIGHT });
    s.addText(t, { x: M + 0.75, y, w: 3.2, h: 0.62, fontFace: B, fontSize: 20, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(d, { x: M + 4.0, y, w: CW - 4.0, h: 0.62, fontFace: B, fontSize: 18, color: "DCD3F0", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addText("Roles rotate again on Monday.", { x: M, y: 6.0, w: CW, h: 0.5, fontFace: B, fontSize: 18, bold: true, color: MINT, isTextBox: true, margin: 0 });
  s.addNotes("Close the week. Everything they learned on Launch Pad (stories, checks, scenarios) comes back next week, now for levels.\n\nThe paper prototype's 'what ifs' are great bad days for week 3.");
}

pres.writeFile({ fileName: __dirname + "/Game-Studio-Week-2.pptx" }).then((f) => console.log("wrote", f));
